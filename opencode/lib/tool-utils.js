import { fileURLToPath } from "node:url";
import path from "node:path";
import { spawnSync } from "node:child_process";

function packageRootFromMeta(importMetaUrl) {
  const filePath = fileURLToPath(importMetaUrl);
  return path.dirname(path.dirname(filePath));
}

export function resolvePackagePath(importMetaUrl, ...segments) {
  return path.join(packageRootFromMeta(importMetaUrl), ...segments);
}

export function runJsonScript(scriptPath, args) {
  const result = spawnSync("node", [scriptPath, ...args], {
    encoding: "utf8",
    windowsHide: true,
  });

  const stdout = String(result.stdout || "").trim();
  const stderr = String(result.stderr || "").trim();

  let parsed = null;
  if (stdout) {
    try {
      parsed = JSON.parse(stdout);
    } catch {
      parsed = null;
    }
  }

  if (result.status !== 0) {
    const message = parsed?.error || stderr || `Script failed: ${path.basename(scriptPath)}`;
    throw new Error(message);
  }

  return parsed ?? { ok: true, output: stdout };
}

export function runGit(cwd, gitArgs) {
  const result = spawnSync("git", gitArgs, {
    cwd,
    encoding: "utf8",
    windowsHide: true,
  });

  if (result.status !== 0) {
    const stderr = String(result.stderr || "").trim();
    throw new Error(stderr || `git ${gitArgs.join(" ")} failed`);
  }

  return String(result.stdout || "").trim();
}

export function detectBaseBranch(cwd) {
  const remotes = runGit(cwd, ["branch", "-r"])
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const priorities = ["origin/development", "origin/develop", "origin/main", "origin/master"];
  const selected = priorities.find((branch) => remotes.includes(branch)) || null;

  return {
    remotes,
    selected,
    base: selected ? selected.replace(/^origin\//, "") : null,
  };
}

export function extractTaskId(source) {
  const match = String(source || "").match(/[A-Z]+-\d+/);
  return match ? match[0] : null;
}

export function kebabFlag(name) {
  return `--${name.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}`;
}

export function pushFlag(args, name, value) {
  if (value === undefined || value === null || value === "") return;
  args.push(kebabFlag(name), String(value));
}
