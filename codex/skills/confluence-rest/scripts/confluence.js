#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");

const DEFAULT_SPACE_ID = "164069";

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
      const key = token.slice(2, eqIndex);
      args[key] = token.slice(eqIndex + 1);
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

function getAuthCandidates() {
  const homedir = os.homedir();
  const codeHome = process.env.CODEX_HOME || path.join(homedir, ".codex");

  return [
    path.join(codeHome, "atlassian.json"),
    path.join(homedir, ".codex", "atlassian.json"),
    path.join(homedir, ".claude", "atlassian.json"),
  ];
}

function normalizeBaseUrl(baseUrl) {
  const trimmed = String(baseUrl || "").trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  return trimmed.endsWith("/wiki") ? trimmed : `${trimmed}/wiki`;
}

function loadAuth() {
  const candidates = [...new Set(getAuthCandidates())];
  const existingPath = candidates.find((candidate) => fs.existsSync(candidate));

  if (!existingPath) {
    fail("Atlassian credentials file not found.", {
      details: {
        searchedPaths: candidates,
        expectedShape: {
          baseUrl: "https://juscash.atlassian.net",
          email: "usuario@empresa.com",
          token: "token_atlassian",
        },
        nextStep:
          "Peca ao usuario baseUrl, email e token. Depois execute o comando setup desta skill para salvar as credenciais globalmente.",
      },
    });
  }

  let raw;
  try {
    raw = fs.readFileSync(existingPath, "utf8");
  } catch (error) {
    fail("Failed to read Atlassian credentials file.", {
      details: { path: existingPath, message: error.message },
    });
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    fail("Atlassian credentials file is not valid JSON.", {
      details: { path: existingPath, message: error.message },
    });
  }

  const baseUrl = normalizeBaseUrl(parsed.baseUrl || "");
  const email = String(parsed.email || "").trim();
  const token = String(parsed.token || parsed.apiToken || "").trim();

  if (!baseUrl || !email || !token) {
    fail("Atlassian credentials file is missing required fields.", {
      details: {
        path: existingPath,
        required: ["baseUrl", "email", "token"],
        acceptedTokenKeys: ["token", "apiToken"],
      },
    });
  }

  return { path: existingPath, baseUrl, email, token };
}

function buildAuthHeader(auth) {
  return `Basic ${Buffer.from(`${auth.email}:${auth.token}`).toString("base64")}`;
}

function parseJsonSafe(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function confluenceRequest(auth, method, requestPath, options = {}) {
  const url = new URL(`${auth.baseUrl}${requestPath}`);
  const headers = {
    Authorization: buildAuthHeader(auth),
    Accept: "application/json",
    ...options.headers,
  };

  const init = { method, headers };

  if (options.query) {
    Object.entries(options.query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, init);
  const text = await response.text();
  const data = parseJsonSafe(text);

  if (!response.ok) {
    fail(`Confluence API request failed: ${response.status} ${response.statusText}`, {
      status: response.status,
      details: {
        method,
        path: requestPath,
        response: data || text,
      },
    });
  }

  return {
    ok: true,
    status: response.status,
    data: data !== null ? data : text,
  };
}

function requireArg(args, name) {
  const value = args[name];
  if (!value || value === true) {
    fail(`Missing required argument --${name}.`);
  }
  return value;
}

function parseJsonArg(args, name) {
  const value = requireArg(args, name);

  try {
    return JSON.parse(value);
  } catch (error) {
    fail(`Invalid JSON for --${name}.`, {
      details: { message: error.message },
    });
  }
}

function parseIntegerArg(args, name, options = {}) {
  const rawValue = args[name];

  if (rawValue === undefined || rawValue === null || rawValue === "") {
    if (options.defaultValue !== undefined) {
      return options.defaultValue;
    }
    fail(`Missing required argument --${name}.`);
  }

  const value = Number.parseInt(String(rawValue), 10);

  if (!Number.isInteger(value)) {
    fail(`Invalid integer for --${name}.`, {
      details: { value: rawValue },
    });
  }

  if (options.min !== undefined && value < options.min) {
    fail(`Argument --${name} must be >= ${options.min}.`, {
      details: { value },
    });
  }

  return value;
}

function parseBooleanArg(args, name, options = {}) {
  const rawValue = args[name];

  if (rawValue === undefined) {
    return options.defaultValue;
  }

  if (rawValue === true || rawValue === false) {
    return rawValue;
  }

  const normalized = String(rawValue).trim().toLowerCase();

  if (["true", "1", "yes", "y"].includes(normalized)) {
    return true;
  }

  if (["false", "0", "no", "n"].includes(normalized)) {
    return false;
  }

  fail(`Invalid boolean for --${name}.`, {
    details: {
      value: rawValue,
      accepted: ["true", "false"],
    },
  });
}

function readBodyFile(filePath) {
  if (!filePath) {
    fail("Missing required argument --body-file.");
  }

  if (!fs.existsSync(filePath)) {
    fail("Confluence body file not found.", {
      details: { path: filePath },
    });
  }

  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (error) {
    fail("Failed to read Confluence body file.", {
      details: { path: filePath, message: error.message },
    });
  }
}

async function searchPages(auth, args) {
  const cql = requireArg(args, "cql");
  const response = await confluenceRequest(auth, "GET", "/rest/api/content/search", {
    query: {
      cql,
      limit: args.limit || "25",
    },
  });

  return {
    ok: true,
    command: "search",
    cql,
    total: response.data.totalSize || response.data.results?.length || 0,
    results: (response.data.results || []).map((page) => ({
      id: page.id,
      type: page.type,
      title: page.title,
      status: page.status,
      url: page._links?.webui ? `${auth.baseUrl}${page._links.webui}` : null,
    })),
  };
}

async function getPage(auth, args) {
  const pageId = requireArg(args, "page-id");
  const response = await confluenceRequest(auth, "GET", `/api/v2/pages/${pageId}`, {
    query: {
      "body-format": args["body-format"] || "storage",
    },
  });

  return {
    ok: true,
    command: "get",
    id: response.data.id,
    title: response.data.title,
    status: response.data.status,
    spaceId: response.data.spaceId,
    parentId: response.data.parentId || null,
    version: response.data.version?.number || null,
    createdAt: response.data.createdAt || null,
    body: response.data.body?.storage?.value || "",
    url: response.data._links?.webui ? `${auth.baseUrl}${response.data._links.webui}` : null,
  };
}

async function getChildren(auth, args) {
  const pageId = requireArg(args, "page-id");
  const response = await confluenceRequest(
    auth,
    "GET",
    `/rest/api/content/${pageId}/descendant/page`,
    {
      query: {
        limit: args.limit || "250",
      },
    },
  );

  return {
    ok: true,
    command: "children",
    pageId,
    total: response.data.size || response.data.results?.length || 0,
    results: (response.data.results || []).map((page) => ({
      id: page.id,
      parentId: null,
      title: page.title,
      status: page.status,
      type: page.type,
      url: page._links?.webui ? `${auth.baseUrl}${page._links.webui}` : null,
    })),
  };
}

async function getTree(auth, args) {
  const pageId = requireArg(args, "page-id");
  const root = await confluenceRequest(auth, "GET", `/api/v2/pages/${pageId}`);
  const descendants = await getChildren(auth, args);
  const parentMap = new Map();
  const childRefMap = new Map();

  const rootNode = {
    pageId: root.data.id,
    title: root.data.title,
    parentId: root.data.parentId || null,
    depth: 0,
    status: root.data.status,
    type: "page",
    url: root.data._links?.webui ? `${auth.baseUrl}${root.data._links.webui}` : null,
  };

  parentMap.set(rootNode.pageId, rootNode.parentId);
  childRefMap.set(rootNode.pageId, []);

  (descendants.results || []).forEach((page) => {
    childRefMap.set(page.id, []);
  });

  (descendants.results || []).forEach((page) => {
    const pageUrl = page.url || "";
    const pagePath = pageUrl
      ? new URL(pageUrl).pathname.replace(/\/+$/, "")
      : "";
    const bestParent = [...childRefMap.keys()]
      .filter((candidateId) => candidateId !== page.id)
      .map((candidateId) => ({
        candidateId,
        candidateUrl: descendants.results.find((item) => item.id === candidateId)?.url
          || (candidateId === rootNode.pageId ? rootNode.url : null),
      }))
      .filter((candidate) => candidate.candidateUrl)
      .map((candidate) => ({
        candidateId: candidate.candidateId,
        candidatePath: new URL(candidate.candidateUrl).pathname.replace(/\/+$/, ""),
      }))
      .filter((candidate) => pagePath.startsWith(candidate.candidatePath) && candidate.candidatePath !== pagePath)
      .sort((a, b) => b.candidatePath.length - a.candidatePath.length)[0];

    const parentId = bestParent?.candidateId || rootNode.pageId;
    parentMap.set(page.id, parentId);
    childRefMap.get(parentId)?.push(page.id);
  });

  function resolveDepth(candidateId) {
    let depth = 0;
    let currentId = parentMap.get(candidateId);

    while (currentId) {
      depth += 1;
      if (currentId === rootNode.pageId) {
        return depth;
      }
      currentId = parentMap.get(currentId);
    }

    return depth;
  }

  return {
    ok: true,
    command: "tree",
    root: rootNode,
    total: descendants.results.length + 1,
    results: [
      rootNode,
      ...(descendants.results || []).map((page) => ({
        pageId: page.id,
        title: page.title,
        parentId: parentMap.get(page.id) || null,
        depth: resolveDepth(page.id),
        status: page.status,
        type: page.type,
        url: page.url,
      })),
    ],
  };
}

function ensureOutputPath(outputFile, outputDir) {
  const normalizedOutputDir = outputDir
    ? path.resolve(outputDir)
    : path.resolve(process.cwd(), "docs");
  const resolvedFile = path.isAbsolute(outputFile)
    ? path.resolve(outputFile)
    : path.resolve(process.cwd(), outputFile);

  const relativeToDir = path.relative(normalizedOutputDir, resolvedFile);
  if (
    relativeToDir.startsWith("..") ||
    path.isAbsolute(relativeToDir) ||
    path.extname(resolvedFile).toLowerCase() !== ".xhtml"
  ) {
    fail("Invalid outputFile for pull-pages.", {
      details: {
        outputFile,
        outputDir: normalizedOutputDir,
        expectedExtension: ".xhtml",
      },
    });
  }

  return { normalizedOutputDir, resolvedFile };
}

async function pullPages(auth, args) {
  const pages = parseJsonArg(args, "pages-json");
  const outputDirArg = args["output-dir"] || "docs";
  const outputDir = path.resolve(process.cwd(), outputDirArg);

  if (!Array.isArray(pages) || pages.length === 0) {
    fail("Expected a non-empty JSON array for --pages-json.");
  }

  const results = [];

  for (const item of pages) {
    if (!item || typeof item !== "object") {
      fail("Each item in --pages-json must be an object.");
    }

    const pageId = String(item.pageId || "").trim();
    const outputFile = String(item.outputFile || "").trim();

    if (!pageId || !outputFile) {
      fail("Each pull-pages item must include pageId and outputFile.", {
        details: { item },
      });
    }

    const { resolvedFile } = ensureOutputPath(outputFile, outputDir);
    const page = await confluenceRequest(auth, "GET", `/api/v2/pages/${pageId}`, {
      query: {
        "body-format": "storage",
      },
    });
    const body = page.data.body?.storage?.value;

    if (typeof body !== "string") {
      fail("Confluence page did not return storage body.", {
        details: { pageId },
      });
    }

    fs.mkdirSync(path.dirname(resolvedFile), { recursive: true });
    fs.writeFileSync(resolvedFile, body, "utf8");

    results.push({
      pageId: page.data.id,
      title: page.data.title,
      outputFile: resolvedFile,
      status: "saved",
      version: page.data.version?.number || null,
      url: page.data._links?.webui ? `${auth.baseUrl}${page.data._links.webui}` : null,
    });
  }

  return {
    ok: true,
    command: "pull-pages",
    outputDir,
    total: results.length,
    results,
  };
}

async function createPage(auth, args) {
  const title = requireArg(args, "title");
  const body = readBodyFile(args["body-file"]);
  const payload = {
    spaceId: args["space-id"] || DEFAULT_SPACE_ID,
    title,
    status: "current",
    body: {
      representation: "storage",
      value: body,
    },
  };

  if (args["parent-id"]) {
    payload.parentId = args["parent-id"];
  }

  const response = await confluenceRequest(auth, "POST", "/api/v2/pages", {
    body: payload,
  });

  return {
    ok: true,
    command: "create",
    id: response.data.id,
    title: response.data.title,
    status: response.data.status,
    spaceId: response.data.spaceId,
    parentId: response.data.parentId || null,
    version: response.data.version?.number || null,
    url: response.data._links?.webui ? `${auth.baseUrl}${response.data._links.webui}` : null,
  };
}

async function updatePage(auth, args) {
  const pageId = requireArg(args, "page-id");
  const title = requireArg(args, "title");
  const body = readBodyFile(args["body-file"]);

  const current = await confluenceRequest(auth, "GET", `/api/v2/pages/${pageId}`, {
    query: { "body-format": "storage" },
  });

  const currentVersion = current.data.version?.number;

  if (!currentVersion) {
    fail("Could not determine current page version.", {
      details: { pageId },
    });
  }

  const payload = {
    id: pageId,
    title,
    status: "current",
    version: {
      number: currentVersion + 1,
    },
    body: {
      representation: "storage",
      value: body,
    },
  };

  const response = await confluenceRequest(auth, "PUT", `/api/v2/pages/${pageId}`, {
    body: payload,
  });

  return {
    ok: true,
    command: "update",
    id: response.data.id,
    title: response.data.title,
    status: response.data.status,
    spaceId: response.data.spaceId,
    parentId: response.data.parentId || null,
    version: response.data.version?.number || null,
    url: response.data._links?.webui ? `${auth.baseUrl}${response.data._links.webui}` : null,
  };
}

async function listPageVersions(auth, args) {
  const pageId = requireArg(args, "page-id");
  const response = await confluenceRequest(auth, "GET", `/api/v2/pages/${pageId}/versions`, {
    query: {
      limit: args.limit || "25",
      cursor: args.cursor,
    },
  });
  const next = response.data._links?.next || null;
  const nextCursor = next ? new URL(next, auth.baseUrl).searchParams.get("cursor") : null;

  const versions = Array.isArray(response.data.results)
    ? response.data.results
    : Array.isArray(response.data.items)
      ? response.data.items
      : [];

  return {
    ok: true,
    command: "versions",
    pageId,
    count: versions.length,
    next,
    nextCursor,
    results: versions.map((version) => ({
      number: version.number || null,
      message: version.message || null,
      minorEdit: version.minorEdit ?? null,
      authorId: version.authorId || version.author?.accountId || null,
      createdAt: version.createdAt || null,
    })),
  };
}

async function restorePageVersion(auth, args) {
  const pageId = requireArg(args, "page-id");
  const versionNumber = parseIntegerArg(args, "version-number", { min: 1 });
  const restoreTitle = parseBooleanArg(args, "restore-title", { defaultValue: true });
  const message = args.message && args.message !== true ? String(args.message) : undefined;
  const payload = {
    operationKey: "restore",
    params: {
      versionNumber,
      restoreTitle,
    },
  };

  if (message) {
    payload.params.message = message;
  }

  const response = await confluenceRequest(
    auth,
    "POST",
    `/rest/api/content/${pageId}/version`,
    { body: payload },
  );

  return {
    ok: true,
    command: "restore-version",
    pageId,
    restoredFromVersion: versionNumber,
    restoreTitle,
    version: response.data.number || response.data.version?.number || null,
    message: response.data.message || message || null,
    createdAt: response.data.createdAt || null,
    by: response.data.by?.displayName || response.data.by?.username || null,
  };
}

function setupCredentials(args) {
  const baseUrl = requireArg(args, "base-url");
  const email = requireArg(args, "email");
  const token = requireArg(args, "token");
  const primaryPath = getAuthCandidates()[0];

  fs.mkdirSync(path.dirname(primaryPath), { recursive: true });
  fs.writeFileSync(
    primaryPath,
    JSON.stringify(
      {
        baseUrl,
        email,
        token,
      },
      null,
      2,
    ),
    "utf8",
  );

  return {
    ok: true,
    command: "setup",
    path: primaryPath,
    baseUrl: normalizeBaseUrl(baseUrl),
    email,
  };
}

const HELP = `
Confluence CLI — REST direta

Uso: node confluence.js <comando> [opcoes]

Comandos:
  setup    --base-url <url> --email <email> --token <api-token>
  search   --cql "<query CQL>" [--limit 25]
  get      --page-id <id> [--body-format storage]
  children --page-id <id> [--limit 250]
  tree     --page-id <id> [--limit 250]
  versions --page-id <id> [--limit 25] [--cursor <cursor>]
  pull-pages --pages-json "<json>" [--output-dir docs]
  create   --title "<titulo>" --body-file <path> [--space-id <id>] [--parent-id <id>]
  update   --page-id <id> --title "<titulo>" --body-file <path>
  restore-version --page-id <id> --version-number <n> [--message "texto"] [--restore-title true|false]

Credenciais:
  - $CODEX_HOME/atlassian.json
  - ~/.codex/atlassian.json
  - ~/.claude/atlassian.json

Formato canonico:
  {
    "baseUrl": "https://juscash.atlassian.net",
    "email": "usuario@empresa.com",
    "token": "token_atlassian"
  }

Exemplos em pwsh:
  node confluence.js setup --base-url "https://juscash.atlassian.net" --email "usuario@empresa.com" --token "TOKEN"
  node confluence.js search --cql 'space = "DT" AND title ~ "API"'
  node confluence.js get --page-id 769196193
  node confluence.js children --page-id 770441364
  node confluence.js tree --page-id 770441364
  node confluence.js versions --page-id 769196193
  $pages = '[{"pageId":"769196193","outputFile":"docs/07-API-ENDPOINTS-SIJ.xhtml"}]'
  node confluence.js pull-pages --pages-json $pages
  node confluence.js create --title "Nova Pagina" --body-file "C:\\temp\\body.xhtml"
  node confluence.js update --page-id 769196193 --title "Pagina Atualizada" --body-file "C:\\temp\\body.xhtml"
  node confluence.js restore-version --page-id 769196193 --version-number 17 --message "Rollback apos upload incorreto"
`.trim();

async function main() {
  const command = process.argv[2];
  const args = parseArgs(process.argv.slice(3));

  if (!command || command === "--help" || command === "-h") {
    console.log(HELP);
    process.exit(0);
  }

  let result;

  if (command === "setup") {
    result = setupCredentials(args);
    printJson(result);
    return;
  }

  const auth = loadAuth();

  switch (command) {
    case "search":
      result = await searchPages(auth, args);
      break;
    case "get":
      result = await getPage(auth, args);
      break;
    case "children":
      result = await getChildren(auth, args);
      break;
    case "tree":
      result = await getTree(auth, args);
      break;
    case "versions":
      result = await listPageVersions(auth, args);
      break;
    case "pull-pages":
      result = await pullPages(auth, args);
      break;
    case "create":
      result = await createPage(auth, args);
      break;
    case "update":
      result = await updatePage(auth, args);
      break;
    case "restore-version":
      result = await restorePageVersion(auth, args);
      break;
    default:
      fail(`Unknown command "${command}".`, { details: { help: HELP } });
  }

  printJson(result);
}

main().catch((error) => {
  fail(error.message || String(error));
});
