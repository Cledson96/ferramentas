#!/usr/bin/env node

/**
 * install.js — Instala o plugin JC no Claude Code local.
 *
 * Uso:
 *   node scripts/install.js                  # instala com backup
 *   node scripts/install.js --dry-run        # simula sem copiar
 *   node scripts/install.js status           # verifica o que esta instalado
 *   node scripts/install.js uninstall        # remove o plugin instalado
 */

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const pluginRoot = path.resolve(__dirname, "..");
const pluginName = "jc";
const pluginVersion = "1.0.0";
const targetRoot = path.join(
  os.homedir(),
  ".claude",
  "plugins",
  "cache",
  "local-desktop-app-uploads",
  pluginName,
  pluginVersion
);

const args = new Set(process.argv.slice(2));
const command =
  process.argv[2] && !process.argv[2].startsWith("--")
    ? process.argv[2]
    : "install";
const dryRun = args.has("--dry-run");

// Itens que nao devem ser copiados
const EXCLUDES = new Set([
  ".orphaned_at",
  "node_modules",
  ".claude",
  ".git",
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const NC = "\x1b[0m";

const info = (msg) => console.log(`${GREEN}[install]${NC} ${msg}`);
const warn = (msg) => console.log(`${YELLOW}[install]${NC} ${msg}`);
const fail = (msg) => {
  console.error(`${RED}[erro]${NC} ${msg}`);
  process.exit(1);
};
const fileLog = (msg) => console.log(`  ${CYAN}→${NC} ${msg}`);

function isExcluded(name) {
  return EXCLUDES.has(name);
}

// ─── Backup ───────────────────────────────────────────────────────────────────

function createBackup() {
  if (!fs.existsSync(targetRoot)) return null;

  const timestamp = new Date().toISOString().replace(/[.:]/g, "-");
  const backupDir = path.join(
    os.homedir(),
    ".claude",
    "plugins",
    "backups",
    `${pluginName}-${timestamp}`
  );

  if (!dryRun) {
    copyDirRecursive(targetRoot, backupDir);
    info(`Backup criado: ${backupDir}`);
  } else {
    info(`[dry-run] Backup seria criado em: ${backupDir}`);
  }

  return backupDir;
}

// ─── Copy ─────────────────────────────────────────────────────────────────────

function copyDirRecursive(src, dst) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dst, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (isExcluded(entry.name)) continue;

    const srcPath = path.join(src, entry.name);
    const dstPath = path.join(dst, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, dstPath);
    } else {
      fs.copyFileSync(srcPath, dstPath);
    }
  }
}

function countFiles(dir) {
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (isExcluded(entry.name)) continue;
    if (entry.isDirectory()) {
      count += countFiles(path.join(dir, entry.name));
    } else {
      count++;
    }
  }
  return count;
}

function listFiles(dir, base = "") {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (isExcluded(entry.name)) continue;
    const rel = path.join(base, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(path.join(dir, entry.name), rel));
    } else {
      files.push(rel);
    }
  }
  return files;
}

// ─── Commands ─────────────────────────────────────────────────────────────────

function install() {
  info(`Plugin: ${pluginName} v${pluginVersion}`);
  info(`Origem: ${pluginRoot}`);
  info(`Destino: ${targetRoot}`);
  if (dryRun) warn("(dry-run — nenhum arquivo sera copiado)");
  console.log();

  // Backup se ja existe
  if (fs.existsSync(targetRoot)) {
    createBackup();
    console.log();
  }

  // Limpar destino
  if (!dryRun) {
    if (fs.existsSync(targetRoot)) {
      const entries = fs.readdirSync(targetRoot, { withFileTypes: true });
      for (const entry of entries) {
        if (isExcluded(entry.name)) continue;
        const fullPath = path.join(targetRoot, entry.name);
        fs.rmSync(fullPath, { recursive: true, force: true });
      }
    }
    fs.mkdirSync(targetRoot, { recursive: true });
  }

  // Copiar
  const files = listFiles(pluginRoot);
  for (const file of files) {
    const srcPath = path.join(pluginRoot, file);
    const dstPath = path.join(targetRoot, file);

    if (!dryRun) {
      fs.mkdirSync(path.dirname(dstPath), { recursive: true });
      fs.copyFileSync(srcPath, dstPath);
    }
    fileLog(file.replace(/\\/g, "/"));
  }

  console.log();
  info(`${files.length} arquivo(s) instalado(s).`);
  if (!dryRun) {
    info("Plugin instalado com sucesso!");
    console.log();
    info("Para usar: reinicie o Claude Code ou recarregue os plugins.");
  }
}

function status() {
  info(`Plugin: ${pluginName} v${pluginVersion}`);
  info(`Origem: ${pluginRoot}`);
  info(`Destino: ${targetRoot}`);
  console.log();

  const installed = fs.existsSync(targetRoot);

  if (!installed) {
    warn("Plugin NAO instalado.");
    console.log();
    info("Para instalar: node scripts/install.js");
    return;
  }

  info("Plugin instalado.");
  console.log();

  // Comparar estrutura
  const sourceFiles = new Set(listFiles(pluginRoot));
  const targetFiles = new Set(listFiles(targetRoot));

  const missing = [...sourceFiles].filter((f) => !targetFiles.has(f));
  const extra = [...targetFiles].filter((f) => !sourceFiles.has(f));
  const common = [...sourceFiles].filter((f) => targetFiles.has(f));

  // Verificar arquivos desatualizados
  const outdated = [];
  for (const file of common) {
    const srcContent = fs.readFileSync(path.join(pluginRoot, file));
    const dstContent = fs.readFileSync(path.join(targetRoot, file));
    if (!srcContent.equals(dstContent)) {
      outdated.push(file);
    }
  }

  const sections = [
    ["Agents", "agents"],
    ["Skills", "skills"],
    ["Scripts", "scripts"],
    ["Config", ".claude-plugin"],
  ];

  for (const [label, dir] of sections) {
    const dirFiles = [...sourceFiles].filter((f) => f.startsWith(dir + path.sep) || f.startsWith(dir + "/"));
    const installedCount = dirFiles.filter((f) => targetFiles.has(f)).length;
    console.log(`  ${label}: ${installedCount}/${dirFiles.length} arquivos`);
  }

  console.log();

  if (missing.length > 0) {
    warn(`${missing.length} arquivo(s) faltando no destino:`);
    for (const f of missing) fileLog(f.replace(/\\/g, "/"));
    console.log();
  }

  if (outdated.length > 0) {
    warn(`${outdated.length} arquivo(s) desatualizados:`);
    for (const f of outdated) fileLog(f.replace(/\\/g, "/"));
    console.log();
  }

  if (extra.length > 0) {
    warn(`${extra.length} arquivo(s) extras no destino (nao existem no repo):`);
    for (const f of extra) fileLog(f.replace(/\\/g, "/"));
    console.log();
  }

  if (missing.length === 0 && outdated.length === 0) {
    info("Tudo sincronizado!");
  } else {
    info("Para atualizar: node scripts/install.js");
  }
}

function uninstall() {
  info(`Plugin: ${pluginName} v${pluginVersion}`);
  info(`Destino: ${targetRoot}`);
  console.log();

  if (!fs.existsSync(targetRoot)) {
    warn("Plugin nao esta instalado.");
    return;
  }

  if (dryRun) {
    warn("(dry-run) Removeria:");
    const files = listFiles(targetRoot);
    for (const f of files) fileLog(f.replace(/\\/g, "/"));
    console.log();
    info(`${files.length} arquivo(s) seriam removidos.`);
    return;
  }

  // Backup antes de remover
  createBackup();
  console.log();

  fs.rmSync(targetRoot, { recursive: true, force: true });
  info("Plugin removido com sucesso.");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

switch (command) {
  case "install":
    install();
    break;
  case "status":
    status();
    break;
  case "uninstall":
    uninstall();
    break;
  default:
    console.log("Uso:");
    console.log("  node scripts/install.js              # instala o plugin");
    console.log("  node scripts/install.js --dry-run    # simula a instalacao");
    console.log("  node scripts/install.js status       # verifica status");
    console.log("  node scripts/install.js uninstall    # remove o plugin");
    process.exit(1);
}
