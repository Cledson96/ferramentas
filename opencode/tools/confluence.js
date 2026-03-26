import { tool } from "@opencode-ai/plugin";
import { pushFlag, resolvePackagePath, runJsonScript } from "../lib/tool-utils.js";

function scriptPath() {
  return resolvePackagePath(import.meta.url, "support", "confluence-cli.cjs");
}

export const get = tool({
  description: "Get a Confluence page by page id",
  args: {
    pageId: tool.schema.string().describe("Confluence page id"),
    bodyFormat: tool.schema.string().optional().describe("Body format, defaults to storage"),
  },
  async execute(args) {
    const cliArgs = ["get", "--page-id", args.pageId];
    pushFlag(cliArgs, "bodyFormat", args.bodyFormat);
    return runJsonScript(scriptPath(), cliArgs);
  },
});

export const search = tool({
  description: "Search Confluence with CQL",
  args: {
    cql: tool.schema.string().describe("CQL query"),
    limit: tool.schema.string().optional().describe("Optional result limit"),
  },
  async execute(args) {
    const cliArgs = ["search", "--cql", args.cql];
    pushFlag(cliArgs, "limit", args.limit);
    return runJsonScript(scriptPath(), cliArgs);
  },
});

export const tree = tool({
  description: "Get Confluence page tree",
  args: {
    pageId: tool.schema.string().describe("Parent page id"),
  },
  async execute(args) {
    return runJsonScript(scriptPath(), ["tree", "--page-id", args.pageId]);
  },
});

export const versions = tool({
  description: "List Confluence page versions",
  args: {
    pageId: tool.schema.string().describe("Confluence page id"),
    limit: tool.schema.string().optional().describe("Optional result limit"),
    cursor: tool.schema.string().optional().describe("Optional pagination cursor"),
  },
  async execute(args) {
    const cliArgs = ["versions", "--page-id", args.pageId];
    pushFlag(cliArgs, "limit", args.limit);
    pushFlag(cliArgs, "cursor", args.cursor);
    return runJsonScript(scriptPath(), cliArgs);
  },
});

export const pull_pages = tool({
  description: "Pull Confluence pages into local files",
  args: {
    pages: tool.schema
      .array(
        tool.schema.object({
          pageId: tool.schema.string().describe("Confluence page id"),
          outputFile: tool.schema.string().describe("Destination file path"),
        }),
      )
      .describe("Pages to download"),
  },
  async execute(args) {
    return runJsonScript(scriptPath(), ["pull-pages", "--pages-json", JSON.stringify(args.pages)]);
  },
});

export const create = tool({
  description: "Create a Confluence page from a local body file",
  args: {
    title: tool.schema.string().describe("Page title"),
    bodyFile: tool.schema.string().describe("Path to an XHTML body file"),
    parentId: tool.schema.string().optional().describe("Optional parent page id"),
    spaceId: tool.schema.string().optional().describe("Optional space id override"),
  },
  async execute(args) {
    const cliArgs = ["create", "--title", args.title, "--body-file", args.bodyFile];
    pushFlag(cliArgs, "parentId", args.parentId);
    pushFlag(cliArgs, "spaceId", args.spaceId);
    return runJsonScript(scriptPath(), cliArgs);
  },
});

export const update = tool({
  description: "Update a Confluence page from a local body file",
  args: {
    pageId: tool.schema.string().describe("Page id to update"),
    title: tool.schema.string().describe("Updated page title"),
    bodyFile: tool.schema.string().describe("Path to an XHTML body file"),
  },
  async execute(args) {
    return runJsonScript(scriptPath(), [
      "update",
      "--page-id",
      args.pageId,
      "--title",
      args.title,
      "--body-file",
      args.bodyFile,
    ]);
  },
});

export const restore_version = tool({
  description: "Restore a Confluence page to a prior version",
  args: {
    pageId: tool.schema.string().describe("Page id to restore"),
    versionNumber: tool.schema.string().describe("Version number to restore from"),
    message: tool.schema.string().optional().describe("Optional restore message"),
    restoreTitle: tool.schema
      .boolean()
      .optional()
      .describe("Whether to restore the historical title too"),
  },
  async execute(args) {
    const cliArgs = [
      "restore-version",
      "--page-id",
      args.pageId,
      "--version-number",
      args.versionNumber,
    ];
    pushFlag(cliArgs, "message", args.message);
    if (args.restoreTitle !== undefined) {
      cliArgs.push("--restore-title", String(args.restoreTitle));
    }
    return runJsonScript(scriptPath(), cliArgs);
  },
});
