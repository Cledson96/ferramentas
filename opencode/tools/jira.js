import { tool } from "@opencode-ai/plugin";
import { pushFlag, resolvePackagePath, runJsonScript } from "../lib/tool-utils.js";

function scriptPath() {
  return resolvePackagePath(import.meta.url, "support", "jira-cli.cjs");
}

function ensureCommentPayload(args, commandName) {
  if (!args.bodyAdfJson && !args.body) {
    throw new Error(`${commandName} requires bodyAdfJson or body.`);
  }
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
  description: "Post a Jira comment, prefer rich ADF",
  args: {
    issue: tool.schema.string().describe("Issue key, e.g. ENG-123"),
    body: tool.schema.string().optional().describe("Fallback plain text comment body. Prefer bodyAdfJson."),
    bodyAdfJson: tool.schema
      .string()
      .optional()
      .describe("Preferred ADF JSON string for rich Jira comments"),
  },
  async execute(args) {
    ensureCommentPayload(args, "jira_comment");
    const cliArgs = ["comment", "--issue", args.issue];
    pushFlag(cliArgs, "body", args.body);
    pushFlag(cliArgs, "bodyAdfJson", args.bodyAdfJson);
    return runJsonScript(scriptPath(), cliArgs);
  },
});

export const comments = tool({
  description: "List Jira comments or fetch one by id",
  args: {
    issue: tool.schema.string().describe("Issue key, e.g. ENG-123"),
    commentId: tool.schema.string().optional().describe("Optional comment id to fetch a single comment"),
    maxResults: tool.schema.string().optional().describe("Optional max results when listing comments"),
    startAt: tool.schema.string().optional().describe("Optional pagination offset when listing comments"),
    orderBy: tool.schema.string().optional().describe("Optional Jira comment ordering, e.g. -created"),
    expand: tool.schema.string().optional().describe("Optional comma-separated expand list"),
  },
  async execute(args) {
    const cliArgs = ["comments", "--issue", args.issue];
    pushFlag(cliArgs, "commentId", args.commentId);
    pushFlag(cliArgs, "maxResults", args.maxResults);
    pushFlag(cliArgs, "startAt", args.startAt);
    pushFlag(cliArgs, "orderBy", args.orderBy);
    pushFlag(cliArgs, "expand", args.expand);
    return runJsonScript(scriptPath(), cliArgs);
  },
});

export const reply = tool({
  description: "Reply to a Jira comment, prefer rich ADF",
  args: {
    issue: tool.schema.string().describe("Issue key, e.g. ENG-123"),
    commentId: tool.schema.string().describe("Target comment id, e.g. 42723"),
    targetSummary: tool.schema
      .string()
      .optional()
      .describe("Optional fallback summary when the target comment cannot be resolved"),
    body: tool.schema.string().optional().describe("Fallback plain text reply body. Prefer bodyAdfJson."),
    bodyAdfJson: tool.schema
      .string()
      .optional()
      .describe("Preferred ADF JSON string for a rich Jira reply"),
  },
  async execute(args) {
    ensureCommentPayload(args, "jira_reply");
    const cliArgs = ["reply", "--issue", args.issue, "--comment-id", args.commentId];
    pushFlag(cliArgs, "targetSummary", args.targetSummary);
    pushFlag(cliArgs, "body", args.body);
    pushFlag(cliArgs, "bodyAdfJson", args.bodyAdfJson);
    return runJsonScript(scriptPath(), cliArgs);
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
