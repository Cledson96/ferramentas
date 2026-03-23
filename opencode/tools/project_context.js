import { tool } from "@opencode-ai/plugin";
import { pushFlag, resolvePackagePath, runJsonScript } from "../lib/tool-utils.js";

function scriptPath() {
  return resolvePackagePath(import.meta.url, "support", "project-context-cli.cjs");
}

function withCwd(args, context, commandName) {
  const cliArgs = [commandName];
  pushFlag(cliArgs, "cwd", args.cwd || context.directory || context.worktree);
  return cliArgs;
}

export const status = tool({
  description: "Check project context freshness and metadata",
  args: {
    cwd: tool.schema.string().optional().describe("Repository path; defaults to current directory"),
  },
  async execute(args, context) {
    return runJsonScript(scriptPath(), withCwd(args, context, "status"));
  },
});

export const ensure = tool({
  description: "Create or reuse lightweight project context",
  args: {
    cwd: tool.schema.string().optional().describe("Repository path; defaults to current directory"),
  },
  async execute(args, context) {
    return runJsonScript(scriptPath(), withCwd(args, context, "ensure"));
  },
});

export const refresh = tool({
  description: "Regenerate lightweight project context",
  args: {
    cwd: tool.schema.string().optional().describe("Repository path; defaults to current directory"),
  },
  async execute(args, context) {
    return runJsonScript(scriptPath(), withCwd(args, context, "refresh"));
  },
});
