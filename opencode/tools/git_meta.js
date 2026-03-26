import { tool } from "@opencode-ai/plugin";
import { detectBaseBranch, extractTaskId, formatToolResult, runGit } from "../lib/tool-utils.js";

export const detect_base_branch = tool({
  description: "Detect the most likely git base branch",
  args: {
    cwd: tool.schema.string().optional().describe("Repository path; defaults to current directory"),
  },
  async execute(args, context) {
    const cwd = args.cwd || context.directory || context.worktree;
    const result = detectBaseBranch(cwd);
    return formatToolResult({
      ok: Boolean(result.base),
      ...result,
    });
  },
});

export const extract_task_id = tool({
  description: "Extract a Jira-style TASK-ID from a string or current branch",
  args: {
    source: tool.schema.string().optional().describe("String to inspect; defaults to current branch"),
    cwd: tool.schema.string().optional().describe("Repository path; defaults to current directory"),
  },
  async execute(args, context) {
    const cwd = args.cwd || context.directory || context.worktree;
    const source = args.source || runGit(cwd, ["branch", "--show-current"]);
    return formatToolResult({
      source,
      taskId: extractTaskId(source),
    });
  },
});

export const branch_summary = tool({
  description: "Summarize current branch against base",
  args: {
    cwd: tool.schema.string().optional().describe("Repository path; defaults to current directory"),
    base: tool.schema.string().optional().describe("Explicit base branch; defaults to detected base"),
  },
  async execute(args, context) {
    const cwd = args.cwd || context.directory || context.worktree;
    const detected = detectBaseBranch(cwd);
    const base = args.base || detected.base;
    if (!base) {
      throw new Error("Could not detect a base branch.");
    }

    const branch = runGit(cwd, ["branch", "--show-current"]);
    const taskId = extractTaskId(branch);

    return formatToolResult({
      branch,
      base,
      taskId,
      stat: runGit(cwd, ["diff", `${base}...HEAD`, "--stat"]),
      commits: runGit(cwd, ["log", `${base}..HEAD`, "--oneline"]),
    });
  },
});
