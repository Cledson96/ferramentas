#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");

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

  return [
    path.join(homedir, ".config", "opencode", "atlassian.json"),
    path.join(homedir, ".codex", "atlassian.json"),
    path.join(homedir, ".claude", "atlassian.json"),
  ];
}

function normalizeBaseUrl(baseUrl) {
  return String(baseUrl || "").trim().replace(/\/+$/, "");
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

async function jiraRequest(auth, method, requestPath, options = {}) {
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
    if (options.allowError) {
      return {
        ok: false,
        status: response.status,
        data: data !== null ? data : text,
      };
    }

    fail(`Jira API request failed: ${response.status} ${response.statusText}`, {
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

function parseJsonArg(args, name, fallback = undefined) {
  if (!args[name]) return fallback;

  try {
    return JSON.parse(args[name]);
  } catch (error) {
    fail(`Invalid JSON for --${name}.`, {
      details: { message: error.message },
    });
  }
}

function parseObjectOrArrayArg(args, name) {
  const parsed = parseJsonArg(args, name);
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") return [parsed];
  fail(`Expected a JSON object or array for --${name}.`);
}

function parseListArg(args, name, fallback = undefined) {
  if (!args[name]) return fallback;

  const value = args[name];
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) return fallback;

    if (trimmed.startsWith("[")) {
      const parsed = parseJsonArg(args, name);
      if (!Array.isArray(parsed)) {
        fail(`Expected a JSON array for --${name}.`);
      }
      return parsed;
    }

    return trimmed
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return fallback;
}

function maybeSplitCsv(value) {
  if (!value) return undefined;
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .join(",");
}

const ADF_ALLOWED_MARK_TYPES = new Set(["strong", "em", "code", "link"]);
const ADF_ALLOWED_INLINE_TYPES = new Set(["text", "hardBreak", "status"]);
const ADF_ALLOWED_TOP_LEVEL_TYPES = new Set([
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "panel",
  "codeBlock",
  "rule",
  "table",
  "expand",
]);
const ADF_ALLOWED_LIST_ITEM_TYPES = new Set(["paragraph", "bulletList", "orderedList", "panel", "codeBlock"]);
const ADF_ALLOWED_CELL_TYPES = new Set(["paragraph", "bulletList", "orderedList", "panel", "codeBlock"]);
const ADF_ALLOWED_PANEL_TYPES = new Set(["info", "note", "warning", "success", "error"]);
const ADF_ALLOWED_STATUS_COLORS = new Set(["neutral", "purple", "blue", "red", "yellow", "green"]);
const ADF_ALLOWED_EXPAND_TYPES = new Set([
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "panel",
  "codeBlock",
  "rule",
  "table",
]);

function normalizeDescription(description) {
  if (description === undefined) return undefined;

  const paragraphs = String(description)
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => buildParagraphNode(block));

  return {
    type: "doc",
    version: 1,
    content: paragraphs.length > 0 ? paragraphs : [buildParagraphNode("")],
  };
}

function buildTextNode(text, marks = undefined) {
  const node = {
    type: "text",
    text: String(text),
  };

  if (marks && marks.length > 0) {
    node.marks = marks;
  }

  return node;
}

function buildHardBreakNode() {
  return { type: "hardBreak" };
}

function buildInlineTextNodes(value, marks = undefined) {
  const lines = String(value ?? "").split("\n");
  const content = [];

  lines.forEach((line, index) => {
    if (line) {
      content.push(buildTextNode(line, marks));
    }

    if (index < lines.length - 1) {
      content.push(buildHardBreakNode());
    }
  });

  return content;
}

function buildParagraphNode(value) {
  const content = Array.isArray(value) ? value.filter(Boolean) : buildInlineTextNodes(value);
  return content.length > 0 ? { type: "paragraph", content } : { type: "paragraph" };
}

function buildHeadingNode(level, text) {
  const content = buildInlineTextNodes(text);
  return {
    type: "heading",
    attrs: { level },
    ...(content.length > 0 ? { content } : {}),
  };
}

function buildListItemNode(value) {
  const content = Array.isArray(value) ? value.filter(Boolean) : [buildParagraphNode(value)];
  return {
    type: "listItem",
    content: content.length > 0 ? content : [buildParagraphNode("")],
  };
}

function buildBulletListNode(items) {
  return {
    type: "bulletList",
    content: items.map((item) => buildListItemNode(item)),
  };
}

function buildPanelNode(panelType, content) {
  return {
    type: "panel",
    attrs: { panelType },
    content: content.filter(Boolean),
  };
}

function buildRuleNode() {
  return { type: "rule" };
}

function buildStatusNode(text, color = "neutral") {
  return {
    type: "status",
    attrs: {
      text: String(text),
      color,
    },
  };
}

function buildStrongTextNode(text) {
  return buildTextNode(text, [{ type: "strong" }]);
}

function buildLabelParagraph(label, value) {
  const content = [buildStrongTextNode(label)];
  if (value !== undefined && value !== null && String(value).trim()) {
    content.push(buildTextNode(` ${String(value).trim()}`));
  }
  return buildParagraphNode(content);
}

function normalizeCellBlocks(value) {
  if (Array.isArray(value)) {
    const items = value.filter(Boolean);
    if (items.length === 0) return [buildParagraphNode("")];

    const inlineOnly = items.every(
      (item) => item && typeof item === "object" && item.type && ADF_ALLOWED_INLINE_TYPES.has(item.type)
    );

    return inlineOnly ? [buildParagraphNode(items)] : items;
  }

  if (value && typeof value === "object" && value.type) {
    return ADF_ALLOWED_INLINE_TYPES.has(value.type) ? [buildParagraphNode([value])] : [value];
  }

  return [buildParagraphNode(value)];
}

function buildTableCellNode(value, type = "tableCell") {
  return {
    type,
    content: normalizeCellBlocks(value),
  };
}

function buildTableNode(headers, rows) {
  return {
    type: "table",
    content: [
      {
        type: "tableRow",
        content: headers.map((header) => buildTableCellNode([buildParagraphNode([buildStrongTextNode(header)])], "tableHeader")),
      },
      ...rows.map((row) => ({
        type: "tableRow",
        content: row.map((cell) => buildTableCellNode(cell)),
      })),
    ],
  };
}

function buildContextPanel(text, panelType = "info") {
  return buildPanelNode(panelType, normalizeDescription(text).content);
}

function normalizeListItems(items, emptyLabel) {
  const normalized = Array.isArray(items)
    ? items
        .filter(Boolean)
        .map((item) => String(item).trim())
        .filter(Boolean)
    : [];

  return normalized.length > 0 ? normalized : [emptyLabel];
}

function buildListSectionNodes(title, items, emptyLabel) {
  return [buildHeadingNode(3, title), buildBulletListNode(normalizeListItems(items, emptyLabel))];
}

function mapStatusColor(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (["realizado", "atendido", "concluido", "respondido", "validado", "ok"].some((item) => normalized.includes(item))) {
    return "green";
  }

  if (["andamento", "progresso", "analise", "investigacao", "em curso"].some((item) => normalized.includes(item))) {
    return "blue";
  }

  if (["pendente", "aguardando", "parcial", "atencao", "risco"].some((item) => normalized.includes(item))) {
    return "yellow";
  }

  if (["bloqueado", "falha", "erro", "impedido", "nao atendido"].some((item) => normalized.includes(item))) {
    return "red";
  }

  return "neutral";
}

function buildReplyContextNodes(replyContext) {
  return [
    buildPanelNode(replyContext.resolvedByLookup ? "note" : "warning", [
      buildLabelParagraph("Comentario alvo:", replyContext.targetCommentId),
      buildLabelParagraph("Autor original:", replyContext.author || "desconhecido"),
      buildLabelParagraph("Resumo:", replyContext.summary || "sem resumo disponivel"),
      !replyContext.resolvedByLookup
        ? buildLabelParagraph("Observacao:", "contexto do comentario alvo informado manualmente por fallback.")
        : null,
    ]),
  ];
}

function failAdf(argName, path, message, details = {}) {
  fail(`ADF payload in --${argName} ${message}`, {
    details: {
      path,
      ...details,
    },
  });
}

function validateMark(mark, path, argName) {
  if (!mark || typeof mark !== "object" || Array.isArray(mark)) {
    failAdf(argName, path, "contains an invalid mark object.");
  }

  if (!ADF_ALLOWED_MARK_TYPES.has(mark.type)) {
    failAdf(argName, path, "uses an unsupported mark type.", {
      type: mark.type,
      allowedMarkTypes: Array.from(ADF_ALLOWED_MARK_TYPES),
    });
  }

  if (mark.type === "link") {
    if (!mark.attrs || typeof mark.attrs !== "object" || Array.isArray(mark.attrs)) {
      failAdf(argName, `${path}.attrs`, "requires attrs for a link mark.");
    }

    if (!mark.attrs.href || typeof mark.attrs.href !== "string") {
      failAdf(argName, `${path}.attrs.href`, "requires a string href for a link mark.");
    }
  }
}

function validateMarks(marks, path, argName) {
  if (marks === undefined) return;

  if (!Array.isArray(marks)) {
    failAdf(argName, path, "must use an array for marks.");
  }

  marks.forEach((mark, index) => validateMark(mark, `${path}[${index}]`, argName));
}

function validateNodeArray(content, path, argName, allowedTypes) {
  if (!Array.isArray(content)) {
    failAdf(argName, path, "must contain a content array.");
  }

  content.forEach((child, index) => {
    const childPath = `${path}[${index}]`;
    validateAdfNode(child, childPath, argName);

    if (allowedTypes && !allowedTypes.has(child.type)) {
      failAdf(argName, childPath, "uses a child node type that is not allowed in this context.", {
        type: child.type,
        allowedChildTypes: Array.from(allowedTypes),
      });
    }
  });
}

function validateAdfNode(node, path, argName) {
  if (!node || typeof node !== "object" || Array.isArray(node)) {
    failAdf(argName, path, "contains an invalid node object.");
  }

  if (typeof node.type !== "string") {
    failAdf(argName, `${path}.type`, "is missing a string node type.");
  }

  switch (node.type) {
    case "text": {
      if (typeof node.text !== "string") {
        failAdf(argName, `${path}.text`, "requires a string text value.");
      }
      validateMarks(node.marks, `${path}.marks`, argName);
      return;
    }

    case "hardBreak":
    case "rule":
      return;

    case "status": {
      if (!node.attrs || typeof node.attrs !== "object" || Array.isArray(node.attrs)) {
        failAdf(argName, `${path}.attrs`, "requires attrs for a status node.");
      }

      if (!node.attrs.text || typeof node.attrs.text !== "string") {
        failAdf(argName, `${path}.attrs.text`, "requires a string text for a status node.");
      }

      if (!ADF_ALLOWED_STATUS_COLORS.has(node.attrs.color)) {
        failAdf(argName, `${path}.attrs.color`, "uses an unsupported status color.", {
          color: node.attrs.color,
          allowedStatusColors: Array.from(ADF_ALLOWED_STATUS_COLORS),
        });
      }
      return;
    }

    case "paragraph":
      if (node.content !== undefined) {
        validateNodeArray(node.content, `${path}.content`, argName, ADF_ALLOWED_INLINE_TYPES);
      }
      return;

    case "heading": {
      const level = node.attrs?.level;
      if (!Number.isInteger(level) || level < 1 || level > 6) {
        failAdf(argName, `${path}.attrs.level`, "requires a heading level between 1 and 6.");
      }
      validateNodeArray(node.content || [], `${path}.content`, argName, new Set(["text", "hardBreak"]));
      return;
    }

    case "bulletList":
    case "orderedList":
      validateNodeArray(node.content, `${path}.content`, argName, new Set(["listItem"]));
      return;

    case "listItem":
      validateNodeArray(node.content, `${path}.content`, argName, ADF_ALLOWED_LIST_ITEM_TYPES);
      return;

    case "panel": {
      if (!ADF_ALLOWED_PANEL_TYPES.has(node.attrs?.panelType)) {
        failAdf(argName, `${path}.attrs.panelType`, "uses an unsupported panel type.", {
          panelType: node.attrs?.panelType,
          allowedPanelTypes: Array.from(ADF_ALLOWED_PANEL_TYPES),
        });
      }
      validateNodeArray(node.content, `${path}.content`, argName, new Set(["paragraph", "heading", "bulletList", "orderedList", "codeBlock"]));
      return;
    }

    case "codeBlock": {
      if (node.attrs?.language !== undefined && typeof node.attrs.language !== "string") {
        failAdf(argName, `${path}.attrs.language`, "must be a string when provided.");
      }

      validateNodeArray(node.content || [], `${path}.content`, argName, new Set(["text"]));
      (node.content || []).forEach((child, index) => {
        if (Array.isArray(child.marks) && child.marks.length > 0) {
          failAdf(argName, `${path}.content[${index}].marks`, "cannot use marks inside codeBlock text nodes.");
        }
      });
      return;
    }

    case "table":
      validateNodeArray(node.content, `${path}.content`, argName, new Set(["tableRow"]));
      return;

    case "tableRow":
      validateNodeArray(node.content, `${path}.content`, argName, new Set(["tableCell", "tableHeader"]));
      return;

    case "tableCell":
    case "tableHeader":
      validateNodeArray(node.content, `${path}.content`, argName, ADF_ALLOWED_CELL_TYPES);
      return;

    case "expand": {
      if (!node.attrs?.title || typeof node.attrs.title !== "string") {
        failAdf(argName, `${path}.attrs.title`, "requires a string title for an expand node.");
      }
      validateNodeArray(node.content, `${path}.content`, argName, ADF_ALLOWED_EXPAND_TYPES);
      return;
    }

    default:
      failAdf(argName, path, "uses an unsupported node type.", {
        type: node.type,
        allowedTopLevelTypes: Array.from(ADF_ALLOWED_TOP_LEVEL_TYPES),
      });
  }
}

function validateAdfDocument(value, argName = "body-adf-json") {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(`Expected a JSON object for --${argName}.`);
  }

  if (value.type !== "doc") {
    fail(`ADF payload in --${argName} must have type='doc'.`);
  }

  if (value.version !== 1) {
    fail(`ADF payload in --${argName} must have version=1.`);
  }

  if (!Array.isArray(value.content)) {
    fail(`ADF payload in --${argName} must contain an array field 'content'.`);
  }

  validateNodeArray(value.content, "doc.content", argName, ADF_ALLOWED_TOP_LEVEL_TYPES);

  return value;
}

function parseAdfArg(args, name = "body-adf-json") {
  if (!args[name]) return undefined;
  return validateAdfDocument(parseJsonArg(args, name), name);
}

function mergeAdfWithPrefix(prefixNodes, doc) {
  return {
    type: "doc",
    version: 1,
    content: [...prefixNodes, ...doc.content],
  };
}

function plainTextFromAdf(node) {
  if (!node) return "";

  if (Array.isArray(node)) {
    return node.map((item) => plainTextFromAdf(item)).filter(Boolean).join("\n");
  }

  if (node.type === "text") {
    return node.text || "";
  }

  if (node.type === "hardBreak") {
    return "\n";
  }

  if (node.type === "status") {
    return node.attrs?.text || "";
  }

  const content = Array.isArray(node.content) ? node.content : [];
  const combined = content.map((item) => plainTextFromAdf(item)).filter(Boolean).join(" ").trim();

  if (["paragraph", "heading", "listItem", "tableCell", "tableHeader"].includes(node.type)) {
    return combined;
  }

  if (["bulletList", "orderedList"].includes(node.type)) {
    return content
      .map((item) => plainTextFromAdf(item))
      .filter(Boolean)
      .map((item) => `- ${item}`)
      .join("\n");
  }

  if (node.type === "tableRow") {
    return content.map((item) => plainTextFromAdf(item)).filter(Boolean).join(" | ");
  }

  if (node.type === "table") {
    return content.map((item) => plainTextFromAdf(item)).filter(Boolean).join("\n");
  }

  if (["panel", "expand", "codeBlock"].includes(node.type)) {
    return content.map((item) => plainTextFromAdf(item)).filter(Boolean).join("\n").trim();
  }

  return combined;
}

function extractSingleLineSummary(value, maxLength = 140) {
  const normalized = String(value || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return "";
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 3).trim()}...`;
}

function validateCriteria(criteria, mode) {
  if (!Array.isArray(criteria) || criteria.length === 0) {
    fail(`Structured comment mode '${mode}' requires --criteria-json with at least one criterion.`);
  }

  criteria.forEach((criterion, index) => {
    if (!criterion || typeof criterion !== "object") {
      fail(`Invalid criterion at index ${index}.`);
    }

    const requiredKeys = mode === "fechamento" ? ["title", "status", "detail"] : ["title", "status", "detail"];
    requiredKeys.forEach((key) => {
      if (!criterion[key]) {
        fail(`Criterion at index ${index} is missing '${key}'.`);
      }
    });
  });
}

function validatePoints(points) {
  if (!Array.isArray(points) || points.length === 0) {
    fail("Reply mode requires --points-json with at least one response point.");
  }

  points.forEach((point, index) => {
    if (!point || typeof point !== "object") {
      fail(`Invalid response point at index ${index}.`);
    }

    ["title", "status", "response"].forEach((key) => {
      if (!point[key]) {
        fail(`Response point at index ${index} is missing '${key}'.`);
      }
    });
  });
}

function buildStructuredCommentAdf(args, replyContext = null) {
  const mode = args.mode || "progresso";
  const realizado = parseListArg(args, "realizado-json");
  const pendencias = parseListArg(args, "pendencias-json");
  const bloqueios = parseListArg(args, "bloqueios-json");
  const proximoPasso = parseListArg(args, "proximo-passo-json");
  const context = args.context && args.context !== true ? String(args.context).trim() : "";

  if (!realizado || !pendencias || !bloqueios || !proximoPasso) {
    fail(
      `Structured comment mode '${mode}' requires --realizado-json, --pendencias-json, --bloqueios-json and --proximo-passo-json.`
    );
  }

  const content = [];

  if (mode === "progresso") {
    const criteria = parseObjectOrArrayArg(args, "criteria-json");
    validateCriteria(criteria, mode);

    content.push(buildHeadingNode(2, "Atualizacao de progresso"));
    content.push(buildParagraphNode("Atualizacao de andamento referente aos criterios impactados neste ciclo."));

    if (context) {
      content.push(buildContextPanel(context, "info"));
    }

    content.push(
      buildTableNode(
        ["Criterio", "Status", "Detalhe tecnico"],
        criteria.map((criterion) => [
          criterion.title,
          buildStatusNode(criterion.status, mapStatusColor(criterion.status)),
          criterion.detail,
        ])
      )
    );
  } else if (mode === "fechamento") {
    const criteria = parseObjectOrArrayArg(args, "criteria-json");
    validateCriteria(criteria, mode);

    content.push(buildHeadingNode(2, "Fechamento tecnico"));
    content.push(buildParagraphNode("Fechamento tecnico do card com consolidacao dos criterios de aceite."));

    if (context) {
      content.push(buildContextPanel(context, "success"));
    }

    content.push(
      buildTableNode(
        ["Criterio", "Status final", "Evidencia"],
        criteria.map((criterion) => [
          criterion.title,
          buildStatusNode(criterion.status, mapStatusColor(criterion.status)),
          criterion.detail,
        ])
      )
    );
  } else if (mode === "resposta") {
    const points = parseObjectOrArrayArg(args, "points-json");
    validatePoints(points);

    content.push(buildHeadingNode(2, "Resposta tecnica"));
    content.push(buildParagraphNode("Resposta consolidada para o comentario alvo do Jira."));

    if (!replyContext) {
      content.push(
        buildLabelParagraph(
          "Assunto do comentario:",
          extractSingleLineSummary(args["target-summary"] || context || "comentario anterior")
        )
      );
    }

    if (context) {
      content.push(buildContextPanel(context, "info"));
    }

    content.push(
      buildTableNode(
        ["Ponto", "Status", "Resposta"],
        points.map((point, index) => [
          `${index + 1}. ${point.title}`,
          buildStatusNode(point.status, mapStatusColor(point.status)),
          point.response,
        ])
      )
    );
  } else {
    fail(`Unsupported structured comment mode: ${mode}.`, {
      details: { supportedModes: ["progresso", "resposta", "fechamento"] },
    });
  }

  content.push(buildRuleNode());
  content.push(...buildListSectionNodes("Realizado", realizado, "sem atualizacoes registradas"));
  content.push(...buildListSectionNodes("Pendencias", pendencias, "sem pendencias"));
  content.push(...buildListSectionNodes("Bloqueios", bloqueios, "sem bloqueios"));
  content.push(...buildListSectionNodes("Proximo passo", proximoPasso, "sem proximo passo definido"));

  return buildDocNode(content);
}

function buildDocNode(content) {
  return {
    type: "doc",
    version: 1,
    content: content.filter(Boolean),
  };
}

function buildCommentDocument(args, replyContext = null) {
  const adfBody = parseAdfArg(args);
  if (adfBody) return adfBody;

  if (args.body && args.body !== true) {
    return normalizeDescription(String(args.body));
  }

  return buildStructuredCommentAdf(args, replyContext);
}

async function handleGet(auth, args) {
  const issue = requireArg(args, "issue");
  return jiraRequest(auth, "GET", `/rest/api/3/issue/${encodeURIComponent(issue)}`, {
    query: {
      fields: maybeSplitCsv(args.fields),
      expand: maybeSplitCsv(args.expand),
    },
  });
}

async function handleSearch(auth, args) {
  const query = requireArg(args, "query");
  const maxResults = args.maxResults || args.max || 10;
  const jql = `text ~ "${query.replace(/"/g, '\\"')}" ORDER BY updated DESC`;

  return jiraRequest(auth, "GET", "/rest/api/3/search/jql", {
    query: {
      jql,
      maxResults: Number(maxResults),
      fields: ["summary", "status", "priority", "assignee", "issuetype", "updated"].join(","),
    },
  });
}

async function handleJql(auth, args) {
  const jql = requireArg(args, "jql");
  const maxResults = args.maxResults || args.max || 20;
  const fields =
    args.fields && args.fields !== true
      ? String(args.fields)
          .split(",")
          .map((field) => field.trim())
          .filter(Boolean)
      : undefined;

  return jiraRequest(auth, "GET", "/rest/api/3/search/jql", {
    query: {
      jql,
      maxResults: Number(maxResults),
      fields: fields ? fields.join(",") : undefined,
      nextPageToken: args["next-page-token"],
    },
  });
}

async function handleComment(auth, args) {
  const issue = requireArg(args, "issue");
  const body = buildCommentDocument(args);
  return jiraRequest(auth, "POST", `/rest/api/3/issue/${encodeURIComponent(issue)}/comment`, {
    body: {
      body,
    },
  });
}

async function handleComments(auth, args) {
  const issue = requireArg(args, "issue");
  const commentId = args["comment-id"];

  if (commentId) {
    const lookup = await jiraRequest(auth, "POST", "/rest/api/3/comment/list", {
      body: { ids: [Number(commentId)] },
      allowError: true,
    });

    if (!lookup.ok) {
      fail("Failed to resolve comment by id.", {
        status: lookup.status,
        details: {
          issue,
          commentId,
          response: lookup.data,
        },
      });
    }

    const values = Array.isArray(lookup.data?.values) ? lookup.data.values : [];
    const matched = values.find((comment) => String(comment.id) === String(commentId));

    if (!matched) {
      fail("Comment id was not found in Jira.", {
        details: {
          issue,
          commentId,
          response: lookup.data,
        },
      });
    }

    return {
      ok: true,
      status: lookup.status,
      data: matched,
    };
  }

  return jiraRequest(auth, "GET", `/rest/api/3/issue/${encodeURIComponent(issue)}/comment`, {
    query: {
      maxResults: Number(args.maxResults || args.max || 50),
      startAt: Number(args.startAt || 0),
      orderBy: args.orderBy,
      expand: maybeSplitCsv(args.expand),
    },
  });
}

async function handleReply(auth, args) {
  const issue = requireArg(args, "issue");
  const commentId = requireArg(args, "comment-id");
  let replyContext;

  const targetCommentResponse = await jiraRequest(auth, "POST", "/rest/api/3/comment/list", {
    body: { ids: [Number(commentId)] },
    allowError: true,
  });

  if (targetCommentResponse.ok) {
    const values = Array.isArray(targetCommentResponse.data?.values) ? targetCommentResponse.data.values : [];
    const targetComment = values.find((comment) => String(comment.id) === String(commentId));

    if (!targetComment) {
      if (!args["target-summary"]) {
        fail("Could not resolve target comment by comment-id and no fallback summary was provided.", {
          details: {
            issue,
            commentId,
            lookupStatus: targetCommentResponse.status,
            lookupResponse: targetCommentResponse.data,
          },
        });
      }

      replyContext = {
        summary: extractSingleLineSummary(args["target-summary"]),
        targetCommentId: commentId,
        author: "desconhecido",
        resolvedByLookup: false,
      };
    } else {
      replyContext = {
        summary: extractSingleLineSummary(plainTextFromAdf(targetComment.body)),
        targetCommentId: targetComment.id,
        author: targetComment.author?.displayName || "desconhecido",
        resolvedByLookup: true,
      };
    }
  } else {
    if (!args["target-summary"]) {
      fail("Could not resolve target comment by comment-id and no fallback summary was provided.", {
        details: {
          issue,
          commentId,
          lookupStatus: targetCommentResponse.status,
          lookupResponse: targetCommentResponse.data,
        },
      });
    }

    replyContext = {
      summary: extractSingleLineSummary(args["target-summary"]),
      targetCommentId: commentId,
      author: "desconhecido",
      resolvedByLookup: false,
    };
  }

  const finalBody = mergeAdfWithPrefix(
    buildReplyContextNodes(replyContext),
    buildCommentDocument(
      {
        ...args,
        mode: args.mode || "resposta",
      },
      replyContext
    )
  );

  return jiraRequest(auth, "POST", `/rest/api/3/issue/${encodeURIComponent(issue)}/comment`, {
    body: {
      body: finalBody,
    },
  });
}

async function handleTransitions(auth, args) {
  const issue = requireArg(args, "issue");
  return jiraRequest(auth, "GET", `/rest/api/3/issue/${encodeURIComponent(issue)}/transitions`);
}

async function handleTransition(auth, args) {
  const issue = requireArg(args, "issue");
  const transitionId = requireArg(args, "transition-id");
  const fields = parseJsonArg(args, "fields");
  const update = parseJsonArg(args, "update");

  return jiraRequest(auth, "POST", `/rest/api/3/issue/${encodeURIComponent(issue)}/transitions`, {
    body: {
      transition: { id: String(transitionId) },
      fields,
      update,
    },
  });
}

async function handleWorklog(auth, args) {
  const issue = requireArg(args, "issue");
  const timeSpent = requireArg(args, "time-spent");
  const started = args.started;
  const comment = args.comment;

  return jiraRequest(auth, "POST", `/rest/api/3/issue/${encodeURIComponent(issue)}/worklog`, {
    body: {
      timeSpent,
      started,
      comment: comment ? normalizeDescription(comment) : undefined,
    },
  });
}

async function handleProjects(auth) {
  return jiraRequest(auth, "GET", "/rest/api/3/project/search");
}

async function handleIssueTypes(auth, args) {
  const project = requireArg(args, "project");

  return jiraRequest(auth, "GET", `/rest/api/3/issue/createmeta/${encodeURIComponent(project)}/issuetypes`);
}

async function resolveIssueTypeId(auth, project, issueTypeInput) {
  if (/^\d+$/.test(String(issueTypeInput))) {
    return String(issueTypeInput);
  }

  const response = await handleIssueTypes(auth, { project });
  const normalizedInput = String(issueTypeInput).trim().toLowerCase();
  const matched = (response.data.issueTypes || []).find((issueType) => {
    const candidates = [issueType.name, issueType.untranslatedName]
      .filter(Boolean)
      .map((value) => String(value).trim().toLowerCase());
    return candidates.includes(normalizedInput);
  });

  if (!matched) {
    fail("Issue type not found for project.", {
      details: {
        project,
        issueType: issueTypeInput,
        availableIssueTypes: (response.data.issueTypes || []).map((item) => ({
          id: item.id,
          name: item.name,
          untranslatedName: item.untranslatedName,
        })),
      },
    });
  }

  return matched.id;
}

async function handleFields(auth, args) {
  const project = requireArg(args, "project");
  const issueTypeId = args["issue-type-id"]
    ? requireArg(args, "issue-type-id")
    : await resolveIssueTypeId(auth, project, requireArg(args, "issue-type"));
  return jiraRequest(
    auth,
    "GET",
    `/rest/api/3/issue/createmeta/${encodeURIComponent(project)}/issuetypes/${encodeURIComponent(
      issueTypeId
    )}`
  );
}

async function handleCreate(auth, args) {
  const project = requireArg(args, "project");
  const issueType = requireArg(args, "issue-type");
  const summary = requireArg(args, "summary");
  const description = args.description;
  const extraFields = parseJsonArg(args, "fields-json", {});
  const issueTypeId = await resolveIssueTypeId(auth, project, issueType);

  const fields = {
    project: { key: String(project) },
    issuetype: { id: issueTypeId },
    summary: String(summary),
    ...extraFields,
  };

  if (description !== undefined) {
    fields.description = normalizeDescription(description);
  }

  return jiraRequest(auth, "POST", "/rest/api/3/issue", { body: { fields } });
}

async function handleEdit(auth, args) {
  const issue = requireArg(args, "issue");
  const extraFields = parseJsonArg(args, "fields-json", {});
  const fields = { ...extraFields };

  if (args.summary !== undefined) {
    fields.summary = String(args.summary);
  }

  if (args.description !== undefined) {
    fields.description = normalizeDescription(args.description);
  }

  if (Object.keys(fields).length === 0) {
    fail("No fields provided for edit. Use --summary, --description or --fields-json.");
  }

  return jiraRequest(auth, "PUT", `/rest/api/3/issue/${encodeURIComponent(issue)}`, {
    body: { fields },
  });
}

async function handleLink(auth, args) {
  const inwardIssue = requireArg(args, "inward-issue");
  const outwardIssue = requireArg(args, "outward-issue");
  const type = requireArg(args, "type");
  const comment = args.comment;

  const body = {
    type: { name: String(type) },
    inwardIssue: { key: String(inwardIssue) },
    outwardIssue: { key: String(outwardIssue) },
  };

  if (comment) {
    body.comment = { body: normalizeDescription(comment) };
  }

  return jiraRequest(auth, "POST", "/rest/api/3/issueLink", { body });
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
        baseUrl: normalizeBaseUrl(baseUrl),
        email,
        token,
      },
      null,
      2
    ),
    "utf8"
  );

  return {
    ok: true,
    command: "setup",
    path: primaryPath,
    baseUrl: normalizeBaseUrl(baseUrl),
    email,
  };
}

function printHelp() {
  printJson({
    ok: true,
    usage: "jira.js <command> [options]",
    notes: [
      "Prefer --body-adf-json for Jira comments and replies.",
      "Structured comment modes also generate rich ADF documents using the recommended subset.",
    ],
    commands: [
      "setup --base-url https://juscash.atlassian.net --email usuario@empresa.com --token TOKEN",
      "get --issue ABC-123 [--fields summary,status] [--expand renderedFields]",
      "search --query \"text\" [--maxResults 10]",
      "jql --jql \"project = JS ORDER BY updated DESC\" [--maxResults 20] [--fields summary,status]",
      "comments --issue ABC-123 [--maxResults 20] [--orderBy -created]",
      "comments --issue ABC-123 --comment-id 42723",
      "comment --issue ABC-123 --body-adf-json '{\"type\":\"doc\",\"version\":1,\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"Comentario rico\",\"marks\":[{\"type\":\"strong\"}]}]}]}'",
      "comment --issue ABC-123 --body \"texto simples de fallback\"",
      "comment --issue ABC-123 --mode progresso --criteria-json '[{\"title\":\"Crit 1\",\"status\":\"realizado\",\"detail\":\"Correcao aplicada e validada\"}]' --realizado-json '[\"Ajustado fluxo X\"]' --pendencias-json '[\"Validar caso Y\"]' --bloqueios-json '[\"sem bloqueios\"]' --proximo-passo-json '[\"Abrir PR\"]'",
      "reply --issue ABC-123 --comment-id 42723 --body-adf-json '{\"type\":\"doc\",\"version\":1,\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"Resposta rica\"}]}]}'",
      "reply --issue ABC-123 --comment-id 42723 --body \"texto simples de fallback\"",
      "reply --issue ABC-123 --comment-id 42723 --target-summary \"Pedido de validacao do fluxo\" --points-json '[{\"title\":\"Duvida 1\",\"status\":\"respondido\",\"response\":\"Fluxo ajustado com validacao\"}]' --realizado-json '[\"Identificada causa raiz\"]' --pendencias-json '[\"Validar em staging\"]' --bloqueios-json '[\"sem bloqueios\"]' --proximo-passo-json '[\"Comentar evidencias finais\"]'",
      "transitions --issue ABC-123",
      "transition --issue ABC-123 --transition-id 31 [--fields '{...}'] [--update '{...}']",
      "worklog --issue ABC-123 --time-spent \"30m\" [--comment \"texto\"] [--started ISO_DATE]",
      "projects",
      "issue-types --project JS",
      "fields --project JS --issue-type-id 10005",
      "fields --project JS --issue-type Task",
      "create --project JS --issue-type Task --summary \"titulo\" [--description \"texto\"] [--fields-json '{...}']",
      "edit --issue ABC-123 [--summary \"titulo\"] [--description \"texto\"] [--fields-json '{...}']",
      "link --inward-issue ABC-1 --outward-issue ABC-2 --type Blocks [--comment \"texto\"]",
    ],
    credentialSearchOrder: [
      "~/.config/opencode/atlassian.json",
      "~/.codex/atlassian.json",
      "~/.claude/atlassian.json",
    ],
    expectedCredentialShape: {
      baseUrl: "https://juscash.atlassian.net",
      email: "usuario@empresa.com",
      token: "token_atlassian",
    },
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const [command] = args._;

  if (!command || command === "help" || command === "--help") {
    printHelp();
    return;
  }

  if (command === "setup") {
    printJson(setupCredentials(args));
    return;
  }

  const auth = loadAuth();
  const handlers = {
    get: () => handleGet(auth, args),
    search: () => handleSearch(auth, args),
    jql: () => handleJql(auth, args),
    comments: () => handleComments(auth, args),
    comment: () => handleComment(auth, args),
    reply: () => handleReply(auth, args),
    transitions: () => handleTransitions(auth, args),
    transition: () => handleTransition(auth, args),
    worklog: () => handleWorklog(auth, args),
    projects: () => handleProjects(auth, args),
    "issue-types": () => handleIssueTypes(auth, args),
    fields: () => handleFields(auth, args),
    create: () => handleCreate(auth, args),
    edit: () => handleEdit(auth, args),
    link: () => handleLink(auth, args),
  };

  const handler = handlers[command];
  if (!handler) {
    fail(`Unknown command: ${command}`, { details: { command } });
  }

  const result = await handler();
  printJson({
    command,
    authPath: auth.path,
    ...result,
  });
}

main().catch((error) => {
  fail("Unexpected error while running jira REST command.", {
    details: {
      message: error.message,
      stack: error.stack,
    },
  });
});
