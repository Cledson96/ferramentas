#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sourceRoot = path.resolve(__dirname, "..");
const targetRoot = path.join(os.homedir(), ".config", "opencode");

const args = new Set(process.argv.slice(2));
const command = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "install";
const dryRun = args.has("--dry-run");

const managedDirs = ["agents", "tools", "skills", "support", "scripts", "lib"];
const copiedFiles = [
  ["package.json", "package.json"],
  [path.join("config", "opencode-dcp.jsonc"), "opencode-dcp.jsonc"],
  [path.join("config", "opencode-antigravity.jsonc"), "opencode-antigravity.jsonc"],
];

function stripJsonComments(value) {
  return String(value)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function readJsonc(filePath, fallback = {}) {
  if (!fs.existsSync(filePath)) return fallback;
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(stripJsonComments(raw));
}

function ensureDir(dirPath) {
  if (dryRun) return;
  fs.mkdirSync(dirPath, { recursive: true });
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function mergeArrays(left, right) {
  const result = [...left.map(clone)];
  const seen = new Set(result.map((item) => JSON.stringify(item)));
  for (const item of right) {
    const key = JSON.stringify(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(clone(item));
  }
  return result;
}

function deepMerge(left, right) {
  if (Array.isArray(left) && Array.isArray(right)) return mergeArrays(left, right);
  if (isObject(left) && isObject(right)) {
    const result = { ...left };
    for (const [key, value] of Object.entries(right)) {
      if (key in result) {
        result[key] = deepMerge(result[key], value);
      } else {
        result[key] = clone(value);
      }
    }
    return result;
  }
  return clone(right);
}

function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function copyFileWithBackup(sourcePath, targetPath, backupRoot) {
  if (fs.existsSync(targetPath)) {
    const backupPath = path.join(backupRoot, path.relative(targetRoot, targetPath));
    if (!dryRun) {
      fs.mkdirSync(path.dirname(backupPath), { recursive: true });
      fs.copyFileSync(targetPath, backupPath);
    }
  }
  if (!dryRun) {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(sourcePath, targetPath);
  }
}

function copyDirRecursive(sourceDir, targetDir, backupRoot) {
  if (!fs.existsSync(sourceDir)) return;
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  if (!dryRun) fs.mkdirSync(targetDir, { recursive: true });
  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(sourcePath, targetPath, backupRoot);
      continue;
    }
    copyFileWithBackup(sourcePath, targetPath, backupRoot);
  }
}

function mergeMainConfig(backupRoot) {
  const sourceConfigPath = path.join(sourceRoot, "config", "opencode.jsonc");
  const targetConfigPath = path.join(targetRoot, "opencode.json");
  const sourceConfig = readJsonc(sourceConfigPath, {});
  const targetConfig = readJsonc(targetConfigPath, {});
  const merged = deepMerge(targetConfig, sourceConfig);

  if (fs.existsSync(targetConfigPath) && !dryRun) {
    const backupPath = path.join(backupRoot, "opencode.json");
    fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    fs.copyFileSync(targetConfigPath, backupPath);
  }

  if (!dryRun) {
    fs.mkdirSync(path.dirname(targetConfigPath), { recursive: true });
    fs.writeFileSync(targetConfigPath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
  }
}

function printStatus() {
  const lines = [
    `Source: ${sourceRoot}`,
    `Target: ${targetRoot}`,
    "",
    "Managed directories:",
    ...managedDirs.map((dir) => `- ${dir}: ${fs.existsSync(path.join(targetRoot, dir)) ? "installed" : "missing"}`),
    "",
    "Managed config files:",
    `- opencode.json: ${fs.existsSync(path.join(targetRoot, "opencode.json")) ? "present" : "missing"}`,
    `- opencode-dcp.jsonc: ${fs.existsSync(path.join(targetRoot, "opencode-dcp.jsonc")) ? "present" : "missing"}`,
    `- opencode-antigravity.jsonc: ${fs.existsSync(path.join(targetRoot, "opencode-antigravity.jsonc")) ? "present" : "missing"}`,
  ];
  console.log(lines.join("\n"));
}

function install() {
  const timestamp = new Date().toISOString().replace(/[.:]/g, "-");
  const backupRoot = path.join(targetRoot, "backups", `install-${timestamp}`);

  if (!dryRun) ensureDir(targetRoot);

  for (const dir of managedDirs) {
    copyDirRecursive(path.join(sourceRoot, dir), path.join(targetRoot, dir), backupRoot);
  }

  for (const [sourceRelative, targetRelative] of copiedFiles) {
    copyFileWithBackup(path.join(sourceRoot, sourceRelative), path.join(targetRoot, targetRelative), backupRoot);
  }

  mergeMainConfig(backupRoot);

  console.log(`${dryRun ? "[dry-run] " : ""}Installation completed.`);
  console.log(`Target: ${targetRoot}`);
  console.log(`Backup: ${backupRoot}`);
}

if (command === "status") {
  printStatus();
} else if (command === "install") {
  install();
} else {
  console.error(`Unknown command: ${command}`);
  process.exit(1);
}
