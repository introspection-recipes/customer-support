import type { ExtensionAPI, ExtensionFactory } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

async function jsonRequest(url: string, init: RequestInit) {
  const res = await fetch(url, init);
  const text = await res.text();
  if (!res.ok) throw new Error(`${url} failed: ${res.status} ${res.statusText}${text ? `\n${text}` : ""}`);
  return text ? JSON.parse(text) : {};
}

const extension: ExtensionFactory = (pi: ExtensionAPI) => {
  pi.registerTool({
    name: "slack_list_threads",
    label: "Slack List Threads",
    description: "Read recent Slack messages from a channel. Requires SLACK_BOT_TOKEN.",
    parameters: Type.Object({
      channel: Type.String(),
      limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100 })),
    }),
    async execute(_id, params) {
      const url = new URL("https://slack.com/api/conversations.history");
      url.searchParams.set("channel", params.channel);
      url.searchParams.set("limit", String(params.limit ?? 20));
      const body = await jsonRequest(url.toString(), {
        headers: { Authorization: `Bearer ${required("SLACK_BOT_TOKEN")}` },
      });
      if (!body.ok) throw new Error(`Slack error: ${body.error}`);
      return { content: [{ type: "text", text: JSON.stringify(body.messages ?? [], null, 2) }], details: body };
    },
  });

  pi.registerTool({
    name: "slack_post_message",
    label: "Slack Post Message",
    description: "Post a Slack message. Requires SLACK_BOT_TOKEN.",
    parameters: Type.Object({ channel: Type.String(), text: Type.String() }),
    async execute(_id, params) {
      const body = await jsonRequest("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${required("SLACK_BOT_TOKEN")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });
      if (!body.ok) throw new Error(`Slack error: ${body.error}`);
      return { content: [{ type: "text", text: JSON.stringify(body, null, 2) }], details: body };
    },
  });

  pi.registerTool({
    name: "notion_search",
    label: "Notion Search",
    description: "Search Notion pages and databases. Requires NOTION_TOKEN.",
    parameters: Type.Object({
      query: Type.String(),
      page_size: Type.Optional(Type.Number({ minimum: 1, maximum: 20 })),
    }),
    async execute(_id, params) {
      const body = await jsonRequest("https://api.notion.com/v1/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${required("NOTION_TOKEN")}`,
          "Notion-Version": process.env.NOTION_VERSION || "2026-03-11",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: params.query, page_size: params.page_size ?? 10 }),
      });
      return { content: [{ type: "text", text: JSON.stringify(body.results ?? [], null, 2) }], details: body };
    },
  });

  pi.registerTool({
    name: "notion_get_page",
    label: "Notion Get Page",
    description: "Fetch a Notion page and its first child blocks. Requires NOTION_TOKEN.",
    parameters: Type.Object({ page_id: Type.String() }),
    async execute(_id, params) {
      const headers = {
        Authorization: `Bearer ${required("NOTION_TOKEN")}`,
        "Notion-Version": process.env.NOTION_VERSION || "2026-03-11",
      };
      const page = await jsonRequest(`https://api.notion.com/v1/pages/${encodeURIComponent(params.page_id)}`, { headers });
      const blocks = await jsonRequest(`https://api.notion.com/v1/blocks/${encodeURIComponent(params.page_id)}/children?page_size=50`, { headers });
      return {
        content: [{ type: "text", text: JSON.stringify({ page, blocks: blocks.results ?? [] }, null, 2) }],
        details: { page, blocks },
      };
    },
  });
};

export default extension;
