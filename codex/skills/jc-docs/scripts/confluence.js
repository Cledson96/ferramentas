#!/usr/bin/env node
/**
 * CLI para interagir com a REST API do Confluence.
 * Zero dependências — usa fetch nativo do Node 18+.
 *
 * Uso: node confluence.js <comando> [opções]
 *
 * Comandos:
 *   setup    --email <email> --token <api-token>   (salva credenciais globalmente)
 *   search   --cql "<query>"
 *   get      --page-id <id>
 *   create   --space-id <id> --title "<titulo>" --body-file <path> [--parent-id <id>]
 *   update   --page-id <id> --title "<titulo>" --body-file <path>
 *
 * Credenciais (ordem de precedência):
 *   1. Env vars: ATLASSIAN_EMAIL + ATLASSIAN_API_TOKEN
 *   2. Arquivo global do Codex: $CODEX_HOME/atlassian.json
 *   3. Arquivo global: ~/.codex/atlassian.json
 *   4. Compatibilidade legada: ~/.claude/atlassian.json
 *
 * Salvar credenciais:
 *   node confluence.js setup --email seu@email.com --token SEU_TOKEN
 *   Gerar token: https://id.atlassian.com/manage-profile/security/api-tokens
 */

const fs   = require('fs');
const os   = require('os');
const path = require('path');

// ─── Constantes ──────────────────────────────────────────────────────────────

const BASE_URL         = 'https://juscash.atlassian.net/wiki';
const DEFAULT_SPACE_ID = '164069';
const CODEX_HOME       = process.env.CODEX_HOME;
const CREDENTIALS_FILES = [
  CODEX_HOME ? path.join(CODEX_HOME, 'atlassian.json') : null,
  path.join(os.homedir(), '.codex', 'atlassian.json'),
  path.join(os.homedir(), '.claude', 'atlassian.json'),
].filter(Boolean);
const PRIMARY_CREDENTIALS_FILE = CREDENTIALS_FILES[0];

// ─── Credenciais ─────────────────────────────────────────────────────────────

function loadCredentials() {
  // 1. Env vars têm prioridade
  if (process.env.ATLASSIAN_EMAIL && process.env.ATLASSIAN_API_TOKEN) {
    return { email: process.env.ATLASSIAN_EMAIL, token: process.env.ATLASSIAN_API_TOKEN };
  }

  // 2-4. Arquivos globais do Codex / fallback legado do Claude
  for (const filePath of CREDENTIALS_FILES) {
    if (!fs.existsSync(filePath)) continue;
    try {
      const creds = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (creds.email && creds.token) return creds;
    } catch {
      // arquivo corrompido — continua para o erro abaixo
    }
  }

  return null;
}

function getAuthHeader() {
  const creds = loadCredentials();

  if (!creds) {
    error(
      'Credenciais Atlassian não encontradas.\n' +
      'Configure com: node confluence.js setup --email seu@email.com --token SEU_TOKEN\n' +
      'Gerar token: https://id.atlassian.com/manage-profile/security/api-tokens'
    );
  }

  return 'Basic ' + Buffer.from(`${creds.email}:${creds.token}`).toString('base64');
}

function saveCredentials(email, token) {
  const dir = path.dirname(PRIMARY_CREDENTIALS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(PRIMARY_CREDENTIALS_FILE, JSON.stringify({ email, token }, null, 2), 'utf8');
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function error(msg) {
  console.error(`[erro] ${msg}`);
  process.stdout.write(JSON.stringify({ error: msg }) + '\n');
  process.exit(1);
}

async function apiFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const auth = getAuthHeader();

  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': auth,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
  });

  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }

  if (!res.ok) {
    const msg = body.message || body.errorMessage || JSON.stringify(body);
    error(`HTTP ${res.status}: ${msg}`);
  }

  return body;
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].replace(/^--/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

function readBodyFile(filePath) {
  if (!filePath) error('--body-file é obrigatório para este comando.');
  if (!fs.existsSync(filePath)) error(`Arquivo não encontrado: ${filePath}`);
  return fs.readFileSync(filePath, 'utf8');
}

// ─── Comandos ────────────────────────────────────────────────────────────────

async function search(cql) {
  if (!cql) error('--cql é obrigatório. Ex: --cql \'space = "DT" AND title ~ "API"\'');

  const params = new URLSearchParams({ cql, limit: '25' });
  const data = await apiFetch(`/rest/api/content/search?${params}`);

  const results = (data.results || []).map(r => ({
    id: r.id,
    title: r.title,
    status: r.status,
    url: r._links?.webui ? `${BASE_URL}${r._links.webui}` : null,
  }));

  return { total: data.totalSize || results.length, results };
}

async function getPage(pageId) {
  if (!pageId) error('--page-id é obrigatório.');

  const params = new URLSearchParams({ 'body-format': 'storage' });
  const data = await apiFetch(`/api/v2/pages/${pageId}?${params}`);

  return {
    id: data.id,
    title: data.title,
    version: data.version?.number,
    status: data.status,
    body: data.body?.storage?.value || '',
    url: data._links?.webui ? `${BASE_URL}${data._links.webui}` : null,
  };
}

async function createPage({ spaceId, title, bodyFile, parentId }) {
  if (!title) error('--title é obrigatório.');
  const body = readBodyFile(bodyFile);

  const payload = {
    spaceId: spaceId || DEFAULT_SPACE_ID,
    title,
    status: 'current',
    body: {
      representation: 'storage',
      value: body,
    },
  };

  if (parentId) {
    payload.parentId = parentId;
  }

  const data = await apiFetch('/api/v2/pages', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return {
    id: data.id,
    title: data.title,
    version: data.version?.number,
    url: data._links?.webui ? `${BASE_URL}${data._links.webui}` : null,
  };
}

async function updatePage({ pageId, title, bodyFile }) {
  if (!pageId) error('--page-id é obrigatório.');
  if (!title) error('--title é obrigatório.');
  const body = readBodyFile(bodyFile);

  // Buscar versão atual automaticamente
  const current = await apiFetch(`/api/v2/pages/${pageId}?body-format=storage`);
  const currentVersion = current.version?.number;

  if (!currentVersion) error('Não foi possível obter a versão atual da página.');

  const payload = {
    id: pageId,
    title,
    status: 'current',
    version: {
      number: currentVersion + 1,
    },
    body: {
      representation: 'storage',
      value: body,
    },
  };

  const data = await apiFetch(`/api/v2/pages/${pageId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  return {
    id: data.id,
    title: data.title,
    version: data.version?.number,
    url: data._links?.webui ? `${BASE_URL}${data._links.webui}` : null,
  };
}

// ─── Comando: setup ──────────────────────────────────────────────────────────

function cmdSetup({ email, token }) {
  if (!email) error('--email é obrigatório. Ex: --email seu@email.com');
  if (!token) error('--token é obrigatório. Ex: --token SEU_API_TOKEN');

  saveCredentials(email, token);

  return {
    ok: true,
    message: `Credenciais salvas em ${PRIMARY_CREDENTIALS_FILE}`,
    email,
  };
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

const HELP = `
Confluence CLI — JusCash Plugin

Uso: node confluence.js <comando> [opções]

Comandos:
  setup    --email <email> --token <api-token>   salva credenciais globalmente
  search   --cql "<query CQL>"
  get      --page-id <id>
  create   --title "<titulo>" --body-file <path> [--space-id <id>] [--parent-id <id>]
  update   --page-id <id> --title "<titulo>" --body-file <path>

Credenciais (ordem de precedência):
  1. Env vars: ATLASSIAN_EMAIL + ATLASSIAN_API_TOKEN
  2. Arquivo global do Codex: $CODEX_HOME/atlassian.json
  3. Arquivo global: ~/.codex/atlassian.json
  4. Compatibilidade legada: ~/.claude/atlassian.json

Exemplos:
  node confluence.js setup --email seu@email.com --token ATATT3x...
  node confluence.js search --cql 'space = "DT" AND title ~ "API"'
  node confluence.js get --page-id 123456789
  node confluence.js create --title "Nova Página" --body-file body.xhtml --parent-id 987654321
  node confluence.js update --page-id 123456789 --title "Página Atualizada" --body-file body.xhtml
`.trim();

async function main() {
  const command = process.argv[2];
  const args = parseArgs(process.argv.slice(3));

  if (!command || command === '--help' || command === '-h') {
    console.log(HELP);
    process.exit(0);
  }

  let result;

  switch (command) {
    case 'setup':
      result = cmdSetup({ email: args.email, token: args.token });
      break;
    case 'search':
      result = await search(args.cql);
      break;
    case 'get':
      result = await getPage(args.pageId);
      break;
    case 'create':
      result = await createPage({
        spaceId: args.spaceId,
        title: args.title,
        bodyFile: args.bodyFile,
        parentId: args.parentId,
      });
      break;
    case 'update':
      result = await updatePage({
        pageId: args.pageId,
        title: args.title,
        bodyFile: args.bodyFile,
      });
      break;
    default:
      error(`Comando desconhecido: "${command}". Use --help para ver os comandos disponíveis.`);
  }

  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}

main().catch(err => {
  error(err.message || String(err));
});
