import { tool } from "@opencode-ai/plugin";
import { pushFlag, resolvePackagePath, runJsonScript } from "../lib/tool-utils.js";

function scriptPath() {
  return resolvePackagePath(import.meta.url, "support", "jira-cli.cjs");
}

export const get = tool({
  description: "Get a Jira issue by key",
  args: {
    issue: tool.schema.string().describe("Issue key, e.g. ENG-123"),
  },
  async execute(args) {
    return runJsonScript(scriptPath(), ["get", "--issue", args.issue]);
  },
});

export const search = tool({
  description: "Search Jira issues by free text",
  args: {
    query: tool.schema.string().describe("Free-text Jira search query"),
  },
  async execute(args) {
    return runJsonScript(scriptPath(), ["search", "--query", args.query]);
  },
});

export const jql = tool({
  description: "Run a Jira JQL query",
  args: {
    jql: tool.schema.string().describe("JQL expression to execute"),
  },
  async execute(args) {
    return runJsonScript(scriptPath(), ["jql", "--jql", args.jql]);
  },
});

export const comment = tool({
  description: "Post a plain Jira comment",
  args: {
    issue: tool.schema.string().describe("Issue key, e.g. ENG-123"),
    body: tool.schema.string().describe("Comment body"),
  },
  async execute(args) {
    return runJsonScript(scriptPath(), ["comment", "--issue", args.issue, "--body", args.body]);
  },
});

export const transition = tool({
  description: "Transition a Jira issue",
  args: {
    issue: tool.schema.string().describe("Issue key, e.g. ENG-123"),
    transitionId: tool.schema.string().describe("Transition id from Jira transitions API"),
  },
  async execute(args) {
    return runJsonScript(scriptPath(), [
      "transition",
      "--issue",
      args.issue,
      "--transition-id",
      args.transitionId,
    ]);
  },
});

export const worklog = tool({
  description: "Add Jira worklog time",
  args: {
    issue: tool.schema.string().describe("Issue key, e.g. ENG-123"),
    timeSpent: tool.schema.string().describe('Time spent, e.g. "30m" or "2h"'),
    comment: tool.schema.string().optional().describe("Optional worklog comment"),
  },
  async execute(args) {
    const cliArgs = ["worklog", "--issue", args.issue, "--time-spent", args.timeSpent];
    pushFlag(cliArgs, "comment", args.comment);
    return runJsonScript(scriptPath(), cliArgs);
  },
});
