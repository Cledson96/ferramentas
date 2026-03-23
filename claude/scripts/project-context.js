#!/usr/bin/env node

const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MANAGED_START = "<!-- project-context:managed:start -->";
const MANAGED_END = "<!-- project-context:managed:end -->";
const NPX_BIN = "npx";

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
  "CLAUDE.md",
  "AGENTS.md",
  "tsconfig.json",
  "tsconfig.base.json",
  "vite.config.ts",
  "vite.config.js",
  "next.config.js",
  "next.config.ts",
  "next.config.mjs",
  ".eslintrc.json",
  ".eslintrc.js",
  ".eslintrc.cjs",
  "eslint.config.js",
  "eslint.config.mjs",
  ".prettierrc",
  ".prettierrc.json",
  ".prettierrc.js",
  "prettier.config.js",
  "docker-compose.yml",
  "docker-compose.yaml",
  "Dockerfile",
  ".env.example",
  "prisma/schema.prisma",
]);

const FOLDER_PURPOSES = {
  src: "codigo-fonte principal",
  lib: "bibliotecas internas",
  app: "aplicacao principal",
  apps: "aplicacoes (monorepo)",
  packages: "pacotes (monorepo)",
  modules: "modulos de dominio",
  components: "componentes UI",
  pages: "paginas/rotas",
  views: "views/templates",
  routes: "definicoes de rotas",
  api: "endpoints da API",
  controllers: "controllers",
  services: "servicos/logica de negocio",
  repositories: "acesso a dados",
  models: "modelos de dados",
  entities: "entidades de dominio",
  schemas: "schemas/validacao",
  dto: "data transfer objects",
  middleware: "middlewares",
  guards: "guards de autenticacao/autorizacao",
  interceptors: "interceptors",
  pipes: "pipes de validacao/transformacao",
  decorators: "decorators customizados",
  utils: "utilitarios",
  helpers: "funcoes auxiliares",
  shared: "codigo compartilhado",
  common: "codigo comum",
  config: "configuracoes",
  constants: "constantes",
  types: "definicoes de tipos",
  interfaces: "interfaces",
  enums: "enumeracoes",
  hooks: "React hooks customizados",
  context: "React contexts",
  store: "state management",
  stores: "state management",
  redux: "Redux store",
  slices: "Redux slices",
  actions: "actions (Redux/Flux)",
  reducers: "reducers",
  selectors: "selectors",
  assets: "assets estaticos",
  styles: "estilos CSS/SCSS",
  public: "arquivos publicos",
  static: "arquivos estaticos",
  tests: "testes",
  test: "testes",
  __tests__: "testes",
  spec: "testes/specs",
  e2e: "testes end-to-end",
  fixtures: "fixtures de teste",
  mocks: "mocks de teste",
  docs: "documentacao",
  scripts: "scripts utilitarios",
  tools: "ferramentas",
  bin: "executaveis/CLI",
  migrations: "migrations de banco",
  seeds: "seeds de banco",
  prisma: "Prisma schema e migrations",
  database: "configuracao de banco",
  db: "configuracao de banco",
  infra: "infraestrutura",
  deploy: "configuracao de deploy",
  ci: "integracao continua",
  ".github": "GitHub Actions e configs",
  ".husky": "Git hooks (Husky)",
};

const ENTRY_POINT_CANDIDATES = [
  "src/main.ts",
  "src/main.tsx",
  "src/index.ts",
  "src/index.tsx",
  "src/index.js",
  "src/index.jsx",
  "src/app.ts",
  "src/app.js",
  "src/App.tsx",
  "src/App.jsx",
  "src/app.module.ts",
  "src/server.ts",
  "src/server.js",
  "app/layout.tsx",
  "app/page.tsx",
  "pages/_app.tsx",
  "pages/index.tsx",
  "index.ts",
  "index.js",
  "main.ts",
  "main.js",
  "server.ts",
  "server.js",
  "manage.py",
  "main.go",
  "cmd/main.go",
  "src/main.rs",
  "src/lib.rs",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function printJson(value) {
  console.log(JSON.stringify(value, null, 2));
}

function fail(message, extra = {}, exitCode = 1) {
  printJson({ ok: false, error: message, ...extra });
  process.exit(exitCode);
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) { args._.push(token); continue; }
    const eqIndex = token.indexOf("=");
    if (eqIndex !== -1) { args[token.slice(2, eqIndex)] = token.slice(eqIndex + 1); continue; }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) { args[key] = next; i += 1; } else { args[key] = true; }
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
  try { return fs.readFileSync(filePath, "utf8"); } catch { return null; }
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
    cwd: options.cwd, encoding: "utf8", shell: Boolean(options.shell), windowsHide: true,
  });
  return { status: result.status, stdout: result.stdout || "", stderr: result.stderr || "", error: result.error || null };
}

function shellQuote(value) {
  const text = String(value);
  if (process.platform !== "win32") return `'${text.replace(/'/g, `'\\''`)}'`;
  if (/^[A-Za-z0-9_./:\\*-]+$/.test(text)) return text;
  return `"${text.replace(/"/g, '\\"')}"`;
}

function runGit(cwd, gitArgs) {
  return run("git", gitArgs, { cwd });
}

function readJson(filePath) {
  try { return JSON.parse(fs.readFileSync(filePath, "utf8")); } catch { return null; }
}

function firstLineHeading(text) {
  const lines = String(text || "").split(/\r?\n/);
  const heading = lines.find((l) => l.trim().startsWith("#"));
  return heading ? heading.replace(/^#+\s*/, "").trim() : null;
}

// ---------------------------------------------------------------------------
// Git info
// ---------------------------------------------------------------------------

function getGitInfo(cwd) {
  const inside = runGit(cwd, ["rev-parse", "--is-inside-work-tree"]);
  if (inside.status !== 0 || inside.stdout.trim() !== "true") {
    return { isRepo: false, branch: null, head: null, statusText: "", statusHash: null };
  }
  const branch = runGit(cwd, ["branch", "--show-current"]).stdout.trim() || "DETACHED";
  const head = runGit(cwd, ["rev-parse", "HEAD"]).stdout.trim() || null;
  const statusText = runGit(cwd, ["status", "--short"]).stdout.trim();
  return { isRepo: true, branch, head, statusText, statusHash: sha1(statusText) };
}

function getGitActivity(cwd, maxCommits = 30) {
  const log = runGit(cwd, ["log", `--max-count=${maxCommits}`, "--pretty=format:", "--name-only", "--diff-filter=ACMR"]);
  if (log.status !== 0) return [];
  const counts = {};
  log.stdout.split(/\r?\n/).filter(Boolean).forEach((file) => {
    counts[file] = (counts[file] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([file, count]) => ({ file, changes: count }));
}

function getRecentCommitMessages(cwd, maxCommits = 10) {
  const log = runGit(cwd, ["log", `--max-count=${maxCommits}`, "--pretty=format:%s"]);
  if (log.status !== 0) return [];
  return log.stdout.split(/\r?\n/).filter(Boolean);
}

// ---------------------------------------------------------------------------
// Watch files & staleness
// ---------------------------------------------------------------------------

function walkForWatchedFiles(rootDir, maxDepth = 2) {
  const results = [];
  function visit(currentDir, depth) {
    if (depth > maxDepth) return;
    let entries;
    try { entries = fs.readdirSync(currentDir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (entry.name === ".git" || entry.name === "node_modules" || entry.name === ".context") continue;
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) { visit(fullPath, depth + 1); continue; }
      const relPath = path.relative(rootDir, fullPath).replace(/\\/g, "/");
      if (WATCH_FILE_NAMES.has(entry.name) || WATCH_FILE_NAMES.has(relPath)) {
        try {
          const stat = fs.statSync(fullPath);
          results.push({ path: relPath, size: stat.size, mtimeMs: stat.mtimeMs });
        } catch { /* ignore */ }
      }
    }
  }
  visit(rootDir, 0);
  return results.sort((a, b) => a.path.localeCompare(b.path));
}

// ---------------------------------------------------------------------------
// Detection: stack, commands, conventions, entry points, folders
// ---------------------------------------------------------------------------

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
    if (exists(path.join(rootDir, "bun.lockb"))) stack.push("Bun");

    const deps = { ...(packageJson.dependencies || {}), ...(packageJson.devDependencies || {}) };

    if (deps.typescript) stack.push("TypeScript");
    if (deps.react) stack.push("React");
    if (deps.next) stack.push("Next.js");
    if (deps.vite) stack.push("Vite");
    if (deps.express) stack.push("Express");
    if (deps.nestjs || deps["@nestjs/core"]) stack.push("NestJS");
    if (deps["@angular/core"]) stack.push("Angular");
    if (deps.vue) stack.push("Vue.js");
    if (deps.svelte) stack.push("Svelte");
    if (deps.prisma || deps["@prisma/client"]) stack.push("Prisma");
    if (deps.typeorm) stack.push("TypeORM");
    if (deps.sequelize) stack.push("Sequelize");
    if (deps.mongoose) stack.push("Mongoose");
    if (deps.tailwindcss) stack.push("Tailwind CSS");
    if (deps["styled-components"]) stack.push("Styled Components");
    if (deps["@emotion/react"] || deps["@emotion/styled"]) stack.push("Emotion");
    if (deps.jest) stack.push("Jest");
    if (deps.vitest) stack.push("Vitest");
    if (deps.mocha) stack.push("Mocha");
    if (deps.cypress) stack.push("Cypress");
    if (deps.playwright || deps["@playwright/test"]) stack.push("Playwright");
    if (deps["@testing-library/react"]) stack.push("Testing Library");
    if (deps.storybook || deps["@storybook/react"]) stack.push("Storybook");
    if (deps.eslint) stack.push("ESLint");
    if (deps.prettier) stack.push("Prettier");
    if (deps.husky) stack.push("Husky");
    if (deps["lint-staged"]) stack.push("lint-staged");
    if (deps.graphql || deps["@apollo/client"] || deps["apollo-server"]) stack.push("GraphQL");
    if (deps.trpc || deps["@trpc/server"]) stack.push("tRPC");
    if (deps.redux || deps["@reduxjs/toolkit"]) stack.push("Redux");
    if (deps.zustand) stack.push("Zustand");
    if (deps.mobx) stack.push("MobX");
    if (deps.socket || deps["socket.io"]) stack.push("Socket.IO");
    if (deps["@juscash/design-system"]) stack.push("JusCash Design System");
    if (deps.antd) stack.push("Ant Design");
    if (deps["@mui/material"]) stack.push("Material UI");
    if (deps.chakra || deps["@chakra-ui/react"]) stack.push("Chakra UI");
  }

  if (pyproject || requirements) {
    stack.push("Python");
    if (pyproject) {
      if (pyproject.includes("django")) stack.push("Django");
      if (pyproject.includes("fastapi")) stack.push("FastAPI");
      if (pyproject.includes("flask")) stack.push("Flask");
      if (pyproject.includes("pytest")) stack.push("pytest");
      if (pyproject.includes("sqlalchemy")) stack.push("SQLAlchemy");
    }
  }

  if (cargo) { stack.push("Rust"); if (cargo.includes("actix")) stack.push("Actix"); if (cargo.includes("tokio")) stack.push("Tokio"); }
  if (gomod) { stack.push("Go"); if (gomod.includes("gin-gonic")) stack.push("Gin"); if (gomod.includes("fiber")) stack.push("Fiber"); }

  if (exists(path.join(rootDir, "docker-compose.yml")) || exists(path.join(rootDir, "docker-compose.yaml"))) stack.push("Docker Compose");
  if (exists(path.join(rootDir, "Dockerfile"))) stack.push("Docker");
  if (exists(path.join(rootDir, ".github/workflows"))) stack.push("GitHub Actions");

  return [...new Set(stack)];
}

function detectCommands(rootDir) {
  const packageJson = readJson(path.join(rootDir, "package.json"));
  if (!packageJson || !packageJson.scripts) return [];
  const preferred = ["dev", "start", "build", "test", "lint", "storybook", "e2e", "format", "typecheck", "type-check"];
  const commands = [];
  preferred.forEach((name) => {
    if (packageJson.scripts[name]) commands.push({ name: `npm run ${name}`, script: packageJson.scripts[name] });
  });
  Object.keys(packageJson.scripts)
    .filter((name) => !preferred.includes(name))
    .slice(0, 5)
    .forEach((name) => commands.push({ name: `npm run ${name}`, script: packageJson.scripts[name] }));
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

function detectReadmeOverview(rootDir) {
  const readme = readFileSafe(path.join(rootDir, "README.md"));
  if (!readme) return null;
  const lines = readme.split(/\r?\n/);
  const contentLines = [];
  let foundHeading = false;
  for (const line of lines) {
    if (line.trim().startsWith("#")) {
      if (foundHeading) break;
      foundHeading = true;
      continue;
    }
    if (foundHeading && line.trim()) {
      contentLines.push(line.trim());
      if (contentLines.length >= 5) break;
    }
  }
  return contentLines.length ? contentLines.join(" ") : null;
}

function detectEntryPoints(rootDir) {
  return ENTRY_POINT_CANDIDATES.filter((candidate) => exists(path.join(rootDir, candidate)));
}

function detectKeyFiles(rootDir) {
  const candidates = [
    "package.json", "README.md", "CLAUDE.md", "AGENTS.md",
    "tsconfig.json", "tsconfig.base.json",
    "pyproject.toml", "requirements.txt", "Cargo.toml", "go.mod",
    "prisma/schema.prisma", "docker-compose.yml", "docker-compose.yaml",
    "Dockerfile", ".env.example",
  ];
  return candidates.filter((c) => exists(path.join(rootDir, c)));
}

function detectConventions(rootDir) {
  const conventions = [];
  const packageJson = readJson(path.join(rootDir, "package.json"));

  // ESLint
  const eslintConfigs = [".eslintrc.json", ".eslintrc.js", ".eslintrc.cjs", "eslint.config.js", "eslint.config.mjs"];
  const eslintFile = eslintConfigs.find((f) => exists(path.join(rootDir, f)));
  if (eslintFile) {
    conventions.push(`ESLint: configurado via \`${eslintFile}\``);
    const content = readFileSafe(path.join(rootDir, eslintFile));
    if (content) {
      if (content.includes("@typescript-eslint")) conventions.push("Linting TypeScript habilitado");
      if (content.includes("react")) conventions.push("ESLint com regras React");
      if (content.includes("prettier")) conventions.push("ESLint integrado com Prettier");
    }
  }

  // Prettier
  const prettierConfigs = [".prettierrc", ".prettierrc.json", ".prettierrc.js", "prettier.config.js"];
  const prettierFile = prettierConfigs.find((f) => exists(path.join(rootDir, f)));
  if (prettierFile) {
    conventions.push(`Prettier: configurado via \`${prettierFile}\``);
    const prettierJson = readJson(path.join(rootDir, prettierFile));
    if (prettierJson) {
      const parts = [];
      if (prettierJson.semi === false) parts.push("sem ponto-e-virgula");
      if (prettierJson.singleQuote) parts.push("aspas simples");
      if (prettierJson.tabWidth) parts.push(`tab ${prettierJson.tabWidth} espacos`);
      if (prettierJson.trailingComma) parts.push(`trailing comma: ${prettierJson.trailingComma}`);
      if (prettierJson.printWidth) parts.push(`max ${prettierJson.printWidth} colunas`);
      if (parts.length) conventions.push(`Estilo: ${parts.join(", ")}`);
    }
  }

  // TSConfig paths/aliases
  const tsconfig = readJson(path.join(rootDir, "tsconfig.json"));
  if (tsconfig?.compilerOptions?.paths) {
    const aliases = Object.keys(tsconfig.compilerOptions.paths);
    if (aliases.length) {
      conventions.push(`Path aliases: ${aliases.slice(0, 5).map((a) => `\`${a}\``).join(", ")}${aliases.length > 5 ? ` (+${aliases.length - 5})` : ""}`);
    }
  }
  if (tsconfig?.compilerOptions?.strict) conventions.push("TypeScript strict mode habilitado");
  if (tsconfig?.compilerOptions?.baseUrl) conventions.push(`Imports relativos ao \`${tsconfig.compilerOptions.baseUrl}\``);

  // Husky / lint-staged
  if (exists(path.join(rootDir, ".husky"))) conventions.push("Git hooks via Husky");
  if (packageJson?.["lint-staged"]) conventions.push("lint-staged configurado para pre-commit");

  // Commit conventions (detect from recent commits)
  const commits = getRecentCommitMessages(rootDir, 15);
  if (commits.length >= 3) {
    const conventional = commits.filter((m) => /^(feat|fix|refactor|docs|test|chore|style|perf|ci|build|revert)(\(.+\))?:/.test(m));
    if (conventional.length >= commits.length * 0.5) {
      conventions.push("Commits: Conventional Commits");
      const withJira = commits.filter((m) => /[A-Z]+-\d+/.test(m));
      if (withJira.length >= 3) conventions.push("Commits incluem Jira ID");
    }
  }

  // Env vars
  const envExample = readFileSafe(path.join(rootDir, ".env.example"));
  if (envExample) {
    const vars = envExample.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("#") && l.includes("="));
    if (vars.length) {
      conventions.push(`Env vars documentadas em \`.env.example\` (${vars.length} variaveis)`);
    }
  }

  return conventions;
}

function detectFolderStructure(rootDir, maxDepth = 2) {
  const result = [];
  function visit(dir, depth, prefix) {
    if (depth > maxDepth) return;
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    const dirs = entries
      .filter((e) => e.isDirectory())
      .filter((e) => !e.name.startsWith(".") || e.name === ".github" || e.name === ".husky")
      .filter((e) => !["node_modules", ".context", "dist", "build", "coverage", ".next", "__pycache__", ".git"].includes(e.name))
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of dirs) {
      const purpose = FOLDER_PURPOSES[entry.name] || null;
      const rel = path.relative(rootDir, path.join(dir, entry.name)).replace(/\\/g, "/");
      result.push({ path: rel, purpose, depth });
      if (depth < maxDepth) visit(path.join(dir, entry.name), depth + 1, rel);
    }
  }
  visit(rootDir, 0, "");
  return result;
}

function detectMonorepo(rootDir) {
  const packageJson = readJson(path.join(rootDir, "package.json"));
  if (packageJson?.workspaces) return { type: "npm/yarn workspaces", workspaces: packageJson.workspaces };
  if (exists(path.join(rootDir, "pnpm-workspace.yaml"))) return { type: "pnpm workspaces" };
  if (exists(path.join(rootDir, "lerna.json"))) return { type: "Lerna" };
  if (exists(path.join(rootDir, "nx.json"))) return { type: "Nx" };
  if (exists(path.join(rootDir, "turbo.json"))) return { type: "Turborepo" };
  return null;
}

function detectDatabase(rootDir) {
  const hints = [];
  if (exists(path.join(rootDir, "prisma/schema.prisma"))) {
    const schema = readFileSafe(path.join(rootDir, "prisma/schema.prisma"));
    if (schema) {
      const providerMatch = schema.match(/provider\s*=\s*"(\w+)"/);
      if (providerMatch) hints.push(`Prisma com ${providerMatch[1]}`);
      const modelCount = (schema.match(/^model\s+/gm) || []).length;
      if (modelCount) hints.push(`${modelCount} models Prisma`);
    }
  }
  const dockerCompose = readFileSafe(path.join(rootDir, "docker-compose.yml")) || readFileSafe(path.join(rootDir, "docker-compose.yaml"));
  if (dockerCompose) {
    if (dockerCompose.includes("postgres")) hints.push("PostgreSQL (docker-compose)");
    if (dockerCompose.includes("mysql")) hints.push("MySQL (docker-compose)");
    if (dockerCompose.includes("mongo")) hints.push("MongoDB (docker-compose)");
    if (dockerCompose.includes("redis")) hints.push("Redis (docker-compose)");
    if (dockerCompose.includes("rabbitmq")) hints.push("RabbitMQ (docker-compose)");
    if (dockerCompose.includes("elasticsearch")) hints.push("Elasticsearch (docker-compose)");
  }
  return hints;
}

// ---------------------------------------------------------------------------
// Top-level directory listing
// ---------------------------------------------------------------------------

function listTopLevelEntries(rootDir) {
  try {
    return fs
      .readdirSync(rootDir, { withFileTypes: true })
      .filter((e) => !e.name.startsWith(".") || e.name === ".github")
      .filter((e) => e.name !== "node_modules")
      .filter((e) => !/^repomix-output(\..+)?$/i.test(e.name))
      .map((e) => ({ name: e.name, type: e.isDirectory() ? "dir" : "file" }));
  } catch { return []; }
}

// ---------------------------------------------------------------------------
// Token tree parsing
// ---------------------------------------------------------------------------

function parseTokenTree(tokenTreeText) {
  const clean = stripAnsi(tokenTreeText);
  return clean.split(/\r?\n/).filter((l) => l.includes("tokens")).slice(0, 15);
}

// ---------------------------------------------------------------------------
// Build summaries
// ---------------------------------------------------------------------------

function buildSummary(rootDir, metadata, tokenTreeText) {
  const projectName = detectProjectName(rootDir);
  const description = detectDescription(rootDir);
  const readmeOverview = detectReadmeOverview(rootDir);
  const stack = detectStack(rootDir);
  const commands = detectCommands(rootDir);
  const keyFiles = detectKeyFiles(rootDir);
  const entryPoints = detectEntryPoints(rootDir);
  const conventions = detectConventions(rootDir);
  const folders = detectFolderStructure(rootDir);
  const monorepo = detectMonorepo(rootDir);
  const database = detectDatabase(rootDir);
  const gitActivity = getGitActivity(rootDir);

  const topLevel = listTopLevelEntries(rootDir)
    .slice(0, 15)
    .map((e) => `- \`${e.name}${e.type === "dir" ? "/" : ""}\``)
    .join("\n");

  const tokenHints = parseTokenTree(tokenTreeText)
    .slice(0, 10)
    .map((l) => `- ${l.trim()}`)
    .join("\n");

  const sections = [
    "# Project Context",
    "",
    "## Overview",
    description ? `- Project: \`${projectName}\` — ${description}` : `- Project: \`${projectName}\``,
  ];

  if (readmeOverview) sections.push(`- ${readmeOverview}`);

  sections.push(
    metadata.git.isRepo
      ? `- Git: branch \`${metadata.git.branch}\`, head \`${metadata.git.head}\``
      : "- Git: repository information unavailable",
    `- Generated at: ${metadata.generatedAt}`,
  );

  if (monorepo) sections.push(`- Monorepo: ${monorepo.type}`);

  sections.push("", "## Tech Stack");
  if (stack.length) sections.push(...stack.map((s) => `- ${s}`));
  else sections.push("- Stack not auto-detected");

  if (database.length) {
    sections.push("", "## Database");
    sections.push(...database.map((d) => `- ${d}`));
  }

  sections.push("", "## Top-Level Structure");
  if (topLevel) sections.push(topLevel);
  else sections.push("- Structure not available");

  if (folders.length) {
    sections.push("", "## Folder Map");
    for (const f of folders.filter((f) => f.purpose)) {
      sections.push(`- \`${f.path}/\` — ${f.purpose}`);
    }
  }

  if (entryPoints.length) {
    sections.push("", "## Entry Points");
    sections.push(...entryPoints.map((e) => `- \`${e}\``));
  }

  sections.push("", "## Useful Commands");
  if (commands.length) sections.push(...commands.map((c) => `- \`${c.name}\``));
  else sections.push("- No package scripts detected");

  sections.push("", "## Key Files");
  if (keyFiles.length) sections.push(...keyFiles.map((f) => `- \`${f}\``));
  else sections.push("- No key files detected");

  if (conventions.length) {
    sections.push("", "## Conventions & Patterns");
    sections.push(...conventions.map((c) => `- ${c}`));
  }

  if (gitActivity.length) {
    sections.push("", "## Hot Files (most changed in last 30 commits)");
    sections.push(...gitActivity.map((a) => `- \`${a.file}\` (${a.changes} changes)`));
  }

  sections.push(
    "", "## Context Artifacts",
    "- Primary summary: `.context/project-context.md`",
    "- Token map: `.context/repomix/token-count-tree.txt`",
    "- Compressed reference: `.context/repomix/repomix-compressed.xml`",
    "- Full snapshot: `.context/repomix/repomix-output.xml`",
    "- Structure-only snapshot: `.context/repomix/repomix-structure.xml`",
  );

  if (tokenHints) {
    sections.push("", "## Token Hotspots");
    sections.push(...tokenHints.split("\n"));
  }

  sections.push(
    "", "## Guidance For Agents",
    "- Read this file first before opening larger repo artifacts.",
    "- Use `token-count-tree.txt` to avoid loading expensive files unnecessarily.",
    "- Use `repomix-compressed.xml` before falling back to the full Repomix snapshot.",
    "- Check Hot Files to understand active development areas.",
  );

  return sections.join("\n");
}

// ---------------------------------------------------------------------------
// Managed file (CLAUDE.md or AGENTS.md)
// ---------------------------------------------------------------------------

function buildManagedBlock() {
  return [
    MANAGED_START,
    "",
    "## Contexto do Projeto (gerado automaticamente)",
    "",
    "- Resumo leve: `.context/project-context.md`",
    "- Token hotspots: `.context/repomix/token-count-tree.txt`",
    "- Referencia expandida: `.context/repomix/repomix-compressed.xml`",
    "",
    "### Orientacao para o Claude",
    "",
    "- Ler `.context/project-context.md` primeiro para tarefas de rotina.",
    "- Usar artefatos Repomix apenas quando o contexto leve nao for suficiente.",
    "",
    MANAGED_END,
  ].join("\n");
}

function updateClaudeFile(rootDir) {
  const filePath = path.join(rootDir, "CLAUDE.md");
  const managedBlock = buildManagedBlock();

  if (!exists(filePath)) {
    writeFile(filePath, `# CLAUDE.md\n\n${managedBlock}\n`);
    return { path: filePath, action: "created" };
  }

  const current = readFileSafe(filePath) || "";
  const escapedStart = MANAGED_START.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedEnd = MANAGED_END.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const blockRegex = new RegExp(`${escapedStart}[\\s\\S]*?${escapedEnd}`, "m");

  const updated = blockRegex.test(current)
    ? current.replace(blockRegex, managedBlock)
    : `${current.trimEnd()}\n\n${managedBlock}\n`;

  if (updated !== current) {
    writeFile(filePath, updated);
    return { path: filePath, action: blockRegex.test(current) ? "updated" : "appended" };
  }

  return { path: filePath, action: "unchanged" };
}

// ---------------------------------------------------------------------------
// Metadata & staleness
// ---------------------------------------------------------------------------

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

function loadMetadata(metaPath) { return readJson(metaPath); }

function computeSignature(rootDir) {
  const git = getGitInfo(rootDir);
  const watchedFiles = walkForWatchedFiles(rootDir);
  return { git, watchedFiles, signatureHash: sha1(JSON.stringify({ rootDir, git, watchedFiles })) };
}

function computeStatus(rootDir) {
  const paths = metadataPaths(rootDir);
  const meta = loadMetadata(paths.metaPath);
  const current = computeSignature(rootDir);
  const existsAll =
    exists(paths.summaryPath) && exists(paths.metaPath) &&
    exists(paths.repomixOutputPath) && exists(paths.repomixCompressedPath) &&
    exists(paths.repomixStructurePath) && exists(paths.tokenTreePath);

  let stale = !existsAll;
  let reason = existsAll ? "up_to_date" : "missing_artifacts";

  if (existsAll && meta?.signatureHash && meta.signatureHash !== current.signatureHash) { stale = true; reason = "signature_changed"; }
  if (existsAll && !meta?.signatureHash) { stale = true; reason = "missing_metadata_signature"; }

  return {
    ok: true, command: "status", rootDir, contextExists: existsAll, stale, reason,
    artifacts: {
      summaryPath: paths.summaryPath, metaPath: paths.metaPath,
      repomixOutputPath: paths.repomixOutputPath, repomixCompressedPath: paths.repomixCompressedPath,
      repomixStructurePath: paths.repomixStructurePath, tokenTreePath: paths.tokenTreePath,
    },
    git: current.git, metadata: meta || null,
  };
}

// ---------------------------------------------------------------------------
// Repomix execution
// ---------------------------------------------------------------------------

function runRepomix(cwd, extraArgs, outputPath = null) {
  const args = ["--yes", "repomix", ".", "--ignore", ".context/**", ...extraArgs];
  const result = process.platform === "win32"
    ? run("cmd.exe", ["/d", "/s", "/c", [NPX_BIN, ...args].map((i) => shellQuote(i)).join(" ")], { cwd })
    : run(NPX_BIN, args, { cwd });

  if (result.error || result.status !== 0) {
    fail("Failed to execute Repomix via npx.", {
      details: {
        cwd, command: `npx ${args.join(" ")}`, status: result.status,
        stdout: stripAnsi(result.stdout).slice(-4000), stderr: stripAnsi(result.stderr).slice(-4000),
        message: result.error ? result.error.message : null,
      },
    });
  }
  if (outputPath && !exists(outputPath)) {
    fail("Repomix finished without producing the expected artifact.", { details: { outputPath } });
  }
  return stripAnsi(result.stdout);
}

// ---------------------------------------------------------------------------
// Generate context
// ---------------------------------------------------------------------------

function generateContext(rootDir) {
  const paths = metadataPaths(rootDir);
  ensureDir(paths.contextDir);
  ensureDir(paths.repomixDir);

  runRepomix(rootDir, ["--output", ".context/repomix/repomix-output.xml", "--quiet"], paths.repomixOutputPath);
  runRepomix(rootDir, ["--compress", "--output", ".context/repomix/repomix-compressed.xml", "--quiet"], paths.repomixCompressedPath);
  runRepomix(rootDir, ["--no-files", "--output", ".context/repomix/repomix-structure.xml", "--quiet"], paths.repomixStructurePath);

  const tokenTreeTempPath = path.join(paths.repomixDir, "token-tree-temp.xml");
  const tokenTreeOutput = runRepomix(rootDir, ["--token-count-tree", "100", "--output", ".context/repomix/token-tree-temp.xml"]);
  writeFile(paths.tokenTreePath, tokenTreeOutput);
  if (exists(tokenTreeTempPath)) fs.unlinkSync(tokenTreeTempPath);

  const claudeUpdate = updateClaudeFile(rootDir);
  const signature = computeSignature(rootDir);
  const generatedAt = new Date().toISOString();
  const metadata = {
    generatedAt, rootDir, signatureHash: signature.signatureHash,
    git: signature.git, watchedFiles: signature.watchedFiles,
    artifacts: {
      summaryPath: paths.summaryPath, metaPath: paths.metaPath,
      repomixOutputPath: paths.repomixOutputPath, repomixCompressedPath: paths.repomixCompressedPath,
      repomixStructurePath: paths.repomixStructurePath, tokenTreePath: paths.tokenTreePath,
    },
  };

  const summary = buildSummary(rootDir, metadata, tokenTreeOutput);
  writeFile(paths.summaryPath, summary);
  writeFile(paths.metaPath, JSON.stringify(metadata, null, 2));

  // Cleanup stray repomix files
  ["repomix-output.xml", "repomix-output.md", "repomix-output.json", "repomix-output.txt"].forEach((name) => {
    const stray = path.join(rootDir, name);
    if (exists(stray)) fs.unlinkSync(stray);
  });

  return {
    ok: true, command: "refresh", rootDir, generatedAt,
    artifacts: metadata.artifacts, claudeUpdate, git: metadata.git,
  };
}

// ---------------------------------------------------------------------------
// Command handlers
// ---------------------------------------------------------------------------

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
      previousStatus: { contextExists: status.contextExists, stale: status.stale, reason: status.reason },
    });
    return;
  }

  const claudeUpdate = updateClaudeFile(rootDir);
  printJson({
    ok: true, command: "ensure", rootDir, reused: true,
    artifacts: status.artifacts, git: status.git, claudeUpdate,
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const HELP = `
Project Context CLI

Uso: node project-context.js <comando> [opcoes]

Comandos:
  status                 mostra se o contexto existe e se esta stale
  ensure                 cria, reaproveita ou atualiza o contexto conforme necessario
  refresh                regenera todo o contexto com Repomix

Opcoes:
  --cwd <path>           caminho do projeto alvo (default: diretorio atual)
`.trim();

function main() {
  const command = process.argv[2];
  const args = parseArgs(process.argv.slice(3));

  if (!command || command === "--help" || command === "-h") { console.log(HELP); process.exit(0); }

  switch (command) {
    case "status": handleStatus(args); break;
    case "ensure": handleEnsure(args); break;
    case "refresh": handleRefresh(args); break;
    default: fail(`Unknown command "${command}".`, { details: { help: HELP } });
  }
}

main();
