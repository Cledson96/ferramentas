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

function normalizeDescription(description) {
  if (description === undefined) return undefined;
  return buildDocNode([buildParagraphNode(String(description))]);
}

function buildDocNode(content) {
  return {
    type: "doc",
    version: 1,
    content,
  };
}

function buildTextNode(text, marks = undefined) {
  const node = {
    type: "text",
    text: String(text),
  };

  if (Array.isArray(marks) && marks.length > 0) {
    node.marks = marks;
  }

  return node;
}

function buildParagraphNode(content) {
  const normalizedContent = Array.isArray(content)
    ? content
    : content === undefined || content === null || content === ""
      ? []
      : [buildTextNode(content)];

  return {
    type: "paragraph",
    content: normalizedContent,
  };
}

function buildHeadingNode(level, text) {
  return {
    type: "heading",
    attrs: { level },
    content: [buildTextNode(text)],
  };
}

function buildRuleNode() {
  return { type: "rule" };
}

function buildPanelNode(panelType, content) {
  return {
    type: "panel",
    attrs: { panelType },
    content,
  };
}

function buildListItemNode(paragraphs) {
  const content = (Array.isArray(paragraphs) ? paragraphs : [paragraphs]).map((paragraph) =>
    paragraph && paragraph.type === "paragraph" ? paragraph : buildParagraphNode(paragraph)
  );

  return {
    type: "listItem",
    content,
  };
}

function buildBulletListNode(items) {
  return {
    type: "bulletList",
    content: items.map((item) => buildListItemNode(item)),
  };
}

function buildOrderedListNode(items) {
  return {
    type: "orderedList",
    content: items.map((item) => buildListItemNode(item)),
  };
}

function buildLabelValueParagraph(label, value) {
  return buildParagraphNode([buildTextNode(`${label}: `, [{ type: "strong" }]), buildTextNode(String(value))]);
}

function normalizeStringList(items) {
  return Array.isArray(items)
    ? items
        .filter(Boolean)
        .map((item) => String(item).trim())
        .filter(Boolean)
    : [];
}

function buildListSectionNodes(title, items, emptyLabel) {
  const normalized = normalizeStringList(items);
  const listItems = (normalized.length > 0 ? normalized : [emptyLabel]).map((item) => [buildParagraphNode(item)]);

  return [buildHeadingNode(3, title), buildBulletListNode(listItems)];
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

  const content = Array.isArray(node.content) ? node.content : [];
  const combined = content.map((item) => plainTextFromAdf(item)).filter(Boolean).join(" ").trim();

  if (["paragraph", "heading", "listItem"].includes(node.type)) {
    return combined;
  }

  if (["bulletList", "orderedList"].includes(node.type)) {
    return content
      .map((item) => plainTextFromAdf(item))
      .filter(Boolean)
      .map((item) => `- ${item}`)
      .join("\n");
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
  if (args.body && args.body !== true) {
    return normalizeDescription(String(args.body));
  }

  const mode = args.mode || "progresso";
  const realizado = parseListArg(args, "realizado-json");
  const pendencias = parseListArg(args, "pendencias-json");
  const bloqueios = parseListArg(args, "bloqueios-json");
  const proximoPasso = parseListArg(args, "proximo-passo-json");

  if (!realizado || !pendencias || !bloqueios || !proximoPasso) {
    fail(
      `Structured comment mode '${mode}' requires --realizado-json, --pendencias-json, --bloqueios-json and --proximo-passo-json.`
    );
  }

  const content = [];

  if (mode === "progresso") {
    const criteria = parseObjectOrArrayArg(args, "criteria-json");
    validateCriteria(criteria, mode);
    content.push(buildHeadingNode(2, "Atualizacao de andamento"));
    content.push(
      buildPanelNode(
        "info",
        [buildParagraphNode("Atualizacao de andamento referente aos criterios impactados neste ciclo.")].concat(
          args.context && args.context !== true ? [buildParagraphNode(String(args.context).trim())] : []
        )
      )
    );
    content.push(buildHeadingNode(3, "Criterios impactados"));
    content.push(
      buildOrderedListNode(
        criteria.map((criterion) => [
          buildParagraphNode([buildTextNode(String(criterion.title), [{ type: "strong" }])]),
          buildLabelValueParagraph("Status", criterion.status),
          buildLabelValueParagraph("Detalhe tecnico", criterion.detail),
        ])
      )
    );
  } else if (mode === "fechamento") {
    const criteria = parseObjectOrArrayArg(args, "criteria-json");
    validateCriteria(criteria, mode);
    content.push(buildHeadingNode(2, "Fechamento tecnico"));
    content.push(
      buildPanelNode(
        "success",
        [buildParagraphNode("Fechamento tecnico do card com consolidacao dos criterios de aceite.")].concat(
          args.context && args.context !== true ? [buildParagraphNode(String(args.context).trim())] : []
        )
      )
    );
    content.push(buildHeadingNode(3, "Criterios consolidados"));
    content.push(
      buildOrderedListNode(
        criteria.map((criterion) => [
          buildParagraphNode([buildTextNode(String(criterion.title), [{ type: "strong" }])]),
          buildLabelValueParagraph("Status final", criterion.status),
          buildLabelValueParagraph("Evidencia", criterion.detail),
        ])
      )
    );
  } else if (mode === "resposta") {
    const points = parseObjectOrArrayArg(args, "points-json");
    validatePoints(points);
    const summary =
      replyContext?.summary ||
      extractSingleLineSummary(args.context || "comentario anterior");
    content.push(buildHeadingNode(2, "Resposta a comentario"));
    content.push(
      buildPanelNode(replyContext?.resolvedByLookup ? "note" : "warning", [
        buildLabelValueParagraph("Comentario alvo", replyContext?.targetCommentId || args["comment-id"] || "nao informado"),
        buildLabelValueParagraph("Autor original", replyContext?.author || "desconhecido"),
        buildLabelValueParagraph("Resumo do comentario", summary || "comentario anterior"),
      ])
    );
    content.push(buildHeadingNode(3, "Pontos respondidos"));
    content.push(
      buildOrderedListNode(
        points.map((point, index) => [
          buildParagraphNode([
            buildTextNode(`Ponto ${index + 1}: `, [{ type: "strong" }]),
            buildTextNode(point.title),
          ]),
          buildLabelValueParagraph("Status", point.status),
          buildLabelValueParagraph("Resposta", point.response),
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
  const adfBody = parseAdfArg(args);
  const body = adfBody || normalizeDescription(buildStructuredCommentBody(args));
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

  const decoratedHeader = [
    `Comentario alvo: ${replyContext.targetCommentId}`,
    `Autor original: ${replyContext.author}`,
  ];

  if (!replyContext.resolvedByLookup) {
    decoratedHeader.push("Observacao: contexto do comentario alvo informado manualmente por fallback.");
  }

  const adfBody = parseAdfArg(args);
  const finalBody = adfBody
    ? mergeAdfWithPrefix(decoratedHeader.map((line) => buildParagraphNode(line)), adfBody)
    : normalizeDescription(
        `${decoratedHeader.join("\n")}\n\n${buildStructuredCommentBody(
          {
            ...args,
            mode: args.mode || "resposta",
          },
          replyContext
        )}`
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
    commands: [
      "setup --base-url https://juscash.atlassian.net --email usuario@empresa.com --token TOKEN",
      "get --issue ABC-123 [--fields summary,status] [--expand renderedFields]",
      "search --query \"text\" [--maxResults 10]",
      "jql --jql \"project = JS ORDER BY updated DESC\" [--maxResults 20] [--fields summary,status]",
      "comments --issue ABC-123 [--maxResults 20] [--orderBy -created]",
      "comments --issue ABC-123 --comment-id 42723",
      "comment --issue ABC-123 --body \"texto\"",
      "comment --issue ABC-123 --body-adf-json '{\"type\":\"doc\",\"version\":1,\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"Comentario rico\",\"marks\":[{\"type\":\"strong\"}]}]}]}'",
      "comment --issue ABC-123 --mode progresso --criteria-json '[{\"title\":\"Crit 1\",\"status\":\"realizado\",\"detail\":\"Correcao aplicada e validada\"}]' --realizado-json '[\"Ajustado fluxo X\"]' --pendencias-json '[\"Validar caso Y\"]' --bloqueios-json '[\"sem bloqueios\"]' --proximo-passo-json '[\"Abrir PR\"]'",
      "reply --issue ABC-123 --comment-id 42723 --body \"texto\"",
      "reply --issue ABC-123 --comment-id 42723 --body-adf-json '{\"type\":\"doc\",\"version\":1,\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"Resposta rica\"}]}]}'",
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
