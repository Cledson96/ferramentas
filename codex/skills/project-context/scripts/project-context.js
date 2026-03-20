#!/usr/bin/env node

const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const MANAGED_START = "<!-- project-context:managed:start -->";
const MANAGED_END = "<!-- project-context:managed:end -->";
const NPX_BIN = process.platform === "win32" ? "npx" : "npx";
const WATCH_FILE_NAMES = new Set([
  "package.json",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "bun.lockb",
  "requirements.txt",
  "pyproject.toml",
  "Pipfile",
  "Cargo.toml",
  "Cargo.lock",
  "go.mod",
  "go.sum",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "composer.json",
  "Gemfile",
  "README.md",
  "README",
  "AGENTS.md",
  "tsconfig.json",
  "tsconfig.base.json",
  "vite.config.ts",
  "next.config.js",
  "next.config.ts",
]);

function printJson(value) {
  console.log(JSON.stringify(value, null, 2));
}

function fail(message, extra = {}, exitCode = 1) {
  printJson({
    ok: false,
    error: message,
    ...extra,
  });
  process.exit(exitCode);
}

function parseArgs(argv) {
  const args = { _: [] };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (!token.startsWith("--")) {
      args._.push(token);
      continue;
    }

    const eqIndex = token.indexOf("=");
    if (eqIndex !== -1) {
      args[token.slice(2, eqIndex)] = token.slice(eqIndex + 1);
      continue;
    }

    const key = token.slice(2);
    const next = argv[i + 1];

    if (next && !next.startsWith("--")) {
      args[key] = next;
      i += 1;
    } else {
      args[key] = true;
    }
  }

  return args;
}

function sha1(value) {
  return crypto.createHash("sha1").update(String(value)).digest("hex");
}

function stripAnsi(text) {
  return String(text || "").replace(/\x1B\[[0-9;]*[A-Za-z]/g, "");
}

function cwdFromArgs(args) {
  return path.resolve(args.cwd || process.cwd());
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

function writeFile(filePath, contents) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, contents, "utf8");
}

function exists(filePath) {
  return fs.existsSync(filePath);
}

function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, {
    cwd: options.cwd,
    encoding: "utf8",
    shell: Boolean(options.shell),
    windowsHide: true,
  });

  return {
    status: result.status,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    error: result.error || null,
  };
}

function shellQuote(value) {
  const text = String(value);
  if (process.platform !== "win32") {
    return `'${text.replace(/'/g, `'\\''`)}'`;
  }
  if (/^[A-Za-z0-9_./:\\*-]+$/.test(text)) {
    return text;
  }
  return `"${text.replace(/"/g, '\\"')}"`;
}

function runGit(cwd, gitArgs) {
  return run("git", gitArgs, { cwd });
}

function getGitInfo(cwd) {
  const inside = runGit(cwd, ["rev-parse", "--is-inside-work-tree"]);
  if (inside.status !== 0 || inside.stdout.trim() !== "true") {
    return {
      isRepo: false,
      branch: null,
      head: null,
      statusText: "",
      statusHash: null,
    };
  }

  const branch = runGit(cwd, ["branch", "--show-current"]).stdout.trim() || "DETACHED";
  const head = runGit(cwd, ["rev-parse", "HEAD"]).stdout.trim() || null;
  const statusText = runGit(cwd, ["status", "--short"]).stdout.trim();

  return {
    isRepo: true,
    branch,
    head,
    statusText,
    statusHash: sha1(statusText),
  };
}

function walkForWatchedFiles(rootDir, maxDepth = 2) {
  const results = [];

  function visit(currentDir, depth) {
    if (depth > maxDepth) return;

    let entries;
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.name === ".git" || entry.name === "node_modules" || entry.name === ".context") {
        continue;
      }

      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        visit(fullPath, depth + 1);
        continue;
      }

      if (WATCH_FILE_NAMES.has(entry.name)) {
        try {
          const stat = fs.statSync(fullPath);
          results.push({
            path: path.relative(rootDir, fullPath).replace(/\\/g, "/"),
            size: stat.size,
            mtimeMs: stat.mtimeMs,
          });
        } catch {
          // ignore
        }
      }
    }
  }

  visit(rootDir, 0);

  return results.sort((a, b) => a.path.localeCompare(b.path));
}

function listTopLevelEntries(rootDir) {
  try {
    return fs
      .readdirSync(rootDir, { withFileTypes: true })
      .filter((entry) => !entry.name.startsWith(".") || entry.name === ".github")
      .filter((entry) => entry.name !== "node_modules")
      .filter((entry) => !/^repomix-output(\..+)?$/i.test(entry.name))
      .map((entry) => ({
        name: entry.name,
        type: entry.isDirectory() ? "dir" : "file",
      }));
  } catch {
    return [];
  }
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function firstLineHeading(text) {
  const lines = String(text || "").split(/\r?\n/);
  const heading = lines.find((line) => line.trim().startsWith("#"));
  return heading ? heading.replace(/^#+\s*/, "").trim() : null;
}

function detectStack(rootDir) {
  const stack = [];
  const packageJson = readJson(path.join(rootDir, "package.json"));
  const pyproject = readFileSafe(path.join(rootDir, "pyproject.toml"));
  const requirements = readFileSafe(path.join(rootDir, "requirements.txt"));
  const cargo = readFileSafe(path.join(rootDir, "Cargo.toml"));
  const gomod = readFileSafe(path.join(rootDir, "go.mod"));

  if (packageJson) {
    stack.push("Node.js");
    if (exists(path.join(rootDir, "package-lock.json"))) stack.push("npm");
    if (exists(path.join(rootDir, "pnpm-lock.yaml"))) stack.push("pnpm");
    if (exists(path.join(rootDir, "yarn.lock"))) stack.push("Yarn");

    const deps = {
      ...(packageJson.dependencies || {}),
      ...(packageJson.devDependencies || {}),
    };

    if (deps.typescript) stack.push("TypeScript");
    if (deps.react) stack.push("React");
    if (deps.next) stack.push("Next.js");
    if (deps.vite) stack.push("Vite");
    if (deps.express) stack.push("Express");
    if (deps.nestjs || deps["@nestjs/core"]) stack.push("NestJS");
    if (deps.jest || deps.vitest) stack.push("Test Runner");
  }

  if (pyproject || requirements) stack.push("Python");
  if (cargo) stack.push("Rust");
  if (gomod) stack.push("Go");

  return [...new Set(stack)];
}

function detectCommands(rootDir) {
  const packageJson = readJson(path.join(rootDir, "package.json"));
  if (!packageJson || !packageJson.scripts) return [];

  const preferred = ["dev", "start", "build", "test", "lint", "storybook"];
  const commands = [];

  preferred.forEach((name) => {
    if (packageJson.scripts[name]) {
      commands.push(`npm run ${name}`);
    }
  });

  Object.keys(packageJson.scripts)
    .filter((name) => !preferred.includes(name))
    .slice(0, 4)
    .forEach((name) => commands.push(`npm run ${name}`));

  return commands;
}

function detectProjectName(rootDir) {
  const packageJson = readJson(path.join(rootDir, "package.json"));
  if (packageJson?.name) return packageJson.name;
  return path.basename(rootDir);
}

function detectDescription(rootDir) {
  const packageJson = readJson(path.join(rootDir, "package.json"));
  if (packageJson?.description) return packageJson.description;

  const readme = readFileSafe(path.join(rootDir, "README.md"));
  if (readme) {
    const heading = firstLineHeading(readme);
    if (heading) return heading;
  }

  return null;
}

function detectKeyFiles(rootDir) {
  const candidates = [
    "package.json",
    "README.md",
    "AGENTS.md",
    "tsconfig.json",
    "tsconfig.base.json",
    "pyproject.toml",
    "requirements.txt",
    "Cargo.toml",
    "go.mod",
  ];

  return candidates.filter((candidate) => exists(path.join(rootDir, candidate)));
}

function parseTokenTree(tokenTreeText) {
  const clean = stripAnsi(tokenTreeText);
  const interesting = clean
    .split(/\r?\n/)
    .filter((line) => line.includes("tokens"))
    .slice(0, 15);
  return interesting;
}

function buildSummary(rootDir, metadata, tokenTreeText) {
  const projectName = detectProjectName(rootDir);
  const description = detectDescription(rootDir);
  const stack = detectStack(rootDir);
  const commands = detectCommands(rootDir);
  const keyFiles = detectKeyFiles(rootDir);
  const topLevel = listTopLevelEntries(rootDir)
    .slice(0, 12)
    .map((entry) => `- \`${entry.name}${entry.type === "dir" ? "/" : ""}\``)
    .join("\n");
  const tokenHints = parseTokenTree(tokenTreeText)
    .slice(0, 10)
    .map((line) => `- ${line.trim()}`)
    .join("\n");

  return [
    "# Project Context",
    "",
    "## Overview",
    description ? `- Project: \`${projectName}\` - ${description}` : `- Project: \`${projectName}\``,
    metadata.git.isRepo
      ? `- Git: branch \`${metadata.git.branch}\`, head \`${metadata.git.head}\``
      : "- Git: repository information unavailable",
    `- Generated at: ${metadata.generatedAt}`,
    "",
    "## Tech Stack",
    ...(stack.length ? stack.map((item) => `- ${item}`) : ["- Stack not auto-detected"]),
    "",
    "## Top-Level Structure",
    ...(topLevel ? [topLevel] : ["- Structure not available"]),
    "",
    "## Useful Commands",
    ...(commands.length ? commands.map((item) => `- \`${item}\``) : ["- No package scripts detected"]),
    "",
    "## Key Files",
    ...(keyFiles.length ? keyFiles.map((item) => `- \`${item}\``) : ["- No key files detected"]),
    "",
    "## Context Artifacts",
    "- Primary summary: `.context/project-context.md`",
    "- Token map: `.context/repomix/token-count-tree.txt`",
    "- Compressed reference: `.context/repomix/repomix-compressed.xml`",
    "- Full snapshot: `.context/repomix/repomix-output.xml`",
    "- Structure-only snapshot: `.context/repomix/repomix-structure.xml`",
    "",
    "## Token Hotspots",
    ...(tokenHints ? tokenHints.split("\n") : ["- Token tree not available"]),
    "",
    "## Guidance For Agents",
    "- Read this file first before opening larger repo artifacts.",
    "- Use `token-count-tree.txt` to avoid loading expensive files unnecessarily.",
    "- Use `repomix-compressed.xml` before falling back to the full Repomix snapshot.",
  ].join("\n");
}

function buildManagedAgentsBlock() {
  return [
    MANAGED_START,
    "## AI Context References",
    "- Primary project context: `.context/project-context.md`",
    "- Token hotspots: `.context/repomix/token-count-tree.txt`",
    "- Expanded repo reference: `.context/repomix/repomix-compressed.xml`",
    "",
    "## Agent Guidance",
    "- Read `.context/project-context.md` first for routine tasks.",
    "- Use Repomix artifacts only when the lightweight context is insufficient.",
    MANAGED_END,
  ].join("\n");
}

function updateAgentsFile(rootDir) {
  const agentsPath = path.join(rootDir, "AGENTS.md");
  const managedBlock = buildManagedAgentsBlock();

  if (!exists(agentsPath)) {
    writeFile(agentsPath, `# AGENTS.md\n\n${managedBlock}\n`);
    return { path: agentsPath, action: "created" };
  }

  const current = readFileSafe(agentsPath) || "";
  const blockRegex = new RegExp(`${MANAGED_START}[\\s\\S]*?${MANAGED_END}`, "m");

  const updated = blockRegex.test(current)
    ? current.replace(blockRegex, managedBlock)
    : `${current.trimEnd()}\n\n${managedBlock}\n`;

  if (updated !== current) {
    writeFile(agentsPath, updated);
    return { path: agentsPath, action: blockRegex.test(current) ? "updated" : "appended" };
  }

  return { path: agentsPath, action: "unchanged" };
}

function metadataPaths(rootDir) {
  const contextDir = path.join(rootDir, ".context");
  const repomixDir = path.join(contextDir, "repomix");
  return {
    contextDir,
    repomixDir,
    summaryPath: path.join(contextDir, "project-context.md"),
    metaPath: path.join(contextDir, "context-meta.json"),
    repomixOutputPath: path.join(repomixDir, "repomix-output.xml"),
    repomixCompressedPath: path.join(repomixDir, "repomix-compressed.xml"),
    repomixStructurePath: path.join(repomixDir, "repomix-structure.xml"),
    tokenTreePath: path.join(repomixDir, "token-count-tree.txt"),
  };
}

function loadMetadata(metaPath) {
  return readJson(metaPath);
}

function computeSignature(rootDir) {
  const git = getGitInfo(rootDir);
  const watchedFiles = walkForWatchedFiles(rootDir);
  const payload = {
    rootDir,
    git,
    watchedFiles,
  };

  return {
    git,
    watchedFiles,
    signatureHash: sha1(JSON.stringify(payload)),
  };
}

function computeStatus(rootDir) {
  const paths = metadataPaths(rootDir);
  const meta = loadMetadata(paths.metaPath);
  const current = computeSignature(rootDir);
  const existsAll =
    exists(paths.summaryPath) &&
    exists(paths.metaPath) &&
    exists(paths.repomixOutputPath) &&
    exists(paths.repomixCompressedPath) &&
    exists(paths.repomixStructurePath) &&
    exists(paths.tokenTreePath);

  let stale = !existsAll;
  let reason = existsAll ? "up_to_date" : "missing_artifacts";

  if (existsAll && meta?.signatureHash && meta.signatureHash !== current.signatureHash) {
    stale = true;
    reason = "signature_changed";
  }

  if (existsAll && !meta?.signatureHash) {
    stale = true;
    reason = "missing_metadata_signature";
  }

  return {
    ok: true,
    command: "status",
    rootDir,
    contextExists: existsAll,
    stale,
    reason,
    artifacts: {
      summaryPath: paths.summaryPath,
      metaPath: paths.metaPath,
      repomixOutputPath: paths.repomixOutputPath,
      repomixCompressedPath: paths.repomixCompressedPath,
      repomixStructurePath: paths.repomixStructurePath,
      tokenTreePath: paths.tokenTreePath,
    },
    git: current.git,
    metadata: meta || null,
  };
}

function runRepomix(cwd, extraArgs, outputPath = null) {
  const args = ["--yes", "repomix", ".", "--ignore", ".context/**", ...extraArgs];
  const result =
    process.platform === "win32"
      ? run(
          "cmd.exe",
          ["/d", "/s", "/c", [NPX_BIN, ...args].map((item) => shellQuote(item)).join(" ")],
          { cwd },
        )
      : run(NPX_BIN, args, { cwd });

  if (result.error || result.status !== 0) {
    fail("Failed to execute Repomix via npx.", {
      details: {
        cwd,
        command: `npx ${args.join(" ")}`,
        status: result.status,
        stdout: stripAnsi(result.stdout).slice(-4000),
        stderr: stripAnsi(result.stderr).slice(-4000),
        message: result.error ? result.error.message : null,
      },
    });
  }

  if (outputPath && !exists(outputPath)) {
    fail("Repomix finished without producing the expected artifact.", {
      details: { outputPath },
    });
  }

  return stripAnsi(result.stdout);
}

function generateContext(rootDir) {
  const paths = metadataPaths(rootDir);
  ensureDir(paths.contextDir);
  ensureDir(paths.repomixDir);

  runRepomix(rootDir, ["--output", ".context/repomix/repomix-output.xml", "--quiet"], paths.repomixOutputPath);
  runRepomix(
    rootDir,
    ["--compress", "--output", ".context/repomix/repomix-compressed.xml", "--quiet"],
    paths.repomixCompressedPath,
  );
  runRepomix(
    rootDir,
    ["--no-files", "--output", ".context/repomix/repomix-structure.xml", "--quiet"],
    paths.repomixStructurePath,
  );

  const tokenTreeTempPath = path.join(paths.repomixDir, "token-tree-temp.xml");
  const tokenTreeOutput = runRepomix(rootDir, [
    "--token-count-tree",
    "100",
    "--output",
    ".context/repomix/token-tree-temp.xml",
  ]);
  writeFile(paths.tokenTreePath, tokenTreeOutput);
  if (exists(tokenTreeTempPath)) {
    fs.unlinkSync(tokenTreeTempPath);
  }

  const agentsUpdate = updateAgentsFile(rootDir);
  const signature = computeSignature(rootDir);
  const generatedAt = new Date().toISOString();
  const metadata = {
    generatedAt,
    rootDir,
    signatureHash: signature.signatureHash,
    git: signature.git,
    watchedFiles: signature.watchedFiles,
    artifacts: {
      summaryPath: paths.summaryPath,
      metaPath: paths.metaPath,
      repomixOutputPath: paths.repomixOutputPath,
      repomixCompressedPath: paths.repomixCompressedPath,
      repomixStructurePath: paths.repomixStructurePath,
      tokenTreePath: paths.tokenTreePath,
    },
  };

  const summary = buildSummary(rootDir, metadata, tokenTreeOutput);
  writeFile(paths.summaryPath, summary);
  writeFile(paths.metaPath, JSON.stringify(metadata, null, 2));

  ["repomix-output.xml", "repomix-output.md", "repomix-output.json", "repomix-output.txt"].forEach((name) => {
    const strayPath = path.join(rootDir, name);
    if (exists(strayPath)) {
      fs.unlinkSync(strayPath);
    }
  });

  return {
    ok: true,
    command: "refresh",
    rootDir,
    generatedAt,
    artifacts: metadata.artifacts,
    agentsUpdate,
    git: metadata.git,
  };
}

function handleStatus(args) {
  printJson(computeStatus(cwdFromArgs(args)));
}

function handleRefresh(args) {
  printJson(generateContext(cwdFromArgs(args)));
}

function handleEnsure(args) {
  const rootDir = cwdFromArgs(args);
  const status = computeStatus(rootDir);

  if (!status.contextExists || status.stale) {
    const refreshed = generateContext(rootDir);
    printJson({
      ...refreshed,
      command: "ensure",
      previousStatus: {
        contextExists: status.contextExists,
        stale: status.stale,
        reason: status.reason,
      },
    });
    return;
  }

  const agentsUpdate = updateAgentsFile(rootDir);
  printJson({
    ok: true,
    command: "ensure",
    rootDir,
    reused: true,
    artifacts: status.artifacts,
    git: status.git,
    agentsUpdate,
  });
}

const HELP = `
Project Context CLI

Uso: node project-context.js <comando> [opcoes]

Comandos:
  status                 mostra se o contexto existe e se esta stale
  ensure                 cria, reaproveita ou atualiza o contexto conforme necessario
  refresh                regenera todo o contexto com Repomix

Opcoes:
  --cwd <path>           caminho do projeto alvo (default: diretorio atual)

Fluxo Repomix:
  npx --yes repomix --output .context/repomix/repomix-output.xml --ignore ".context/**"
  npx --yes repomix --compress --output .context/repomix/repomix-compressed.xml --ignore ".context/**"
  npx --yes repomix --no-files --output .context/repomix/repomix-structure.xml --ignore ".context/**"
  npx --yes repomix --token-count-tree 100 --ignore ".context/**"
`.trim();

function main() {
  const command = process.argv[2];
  const args = parseArgs(process.argv.slice(3));

  if (!command || command === "--help" || command === "-h") {
    console.log(HELP);
    process.exit(0);
  }

  switch (command) {
    case "status":
      handleStatus(args);
      break;
    case "ensure":
      handleEnsure(args);
      break;
    case "refresh":
      handleRefresh(args);
      break;
    default:
      fail(`Unknown command "${command}".`, { details: { help: HELP } });
  }
}

main();
