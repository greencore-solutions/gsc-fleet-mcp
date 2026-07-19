// ============================================================
// mcp.gsc-fleet.ai — GSC Carrier Fleet discovery MCP  v1.0.0
// GreenCore Solutions Corp.
//
// The storefront. Stateless: fleet truth compiled in, Cards
// stay the single source. Ten read tools + full broadcast.
// ============================================================

import express from "express";
import crypto from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import {
  HEADLINE, FLEETS, JURISDICTIONS, REGION_TO_FLEET,
  RESIDENCY_RECEIPT, DOCTRINE, TRANSACT,
} from "./canon.js";

const VERSION = "1.0.0";
const NODE = "mcp.gsc-fleet.ai";
const TOOL_NAMES = [
  "list_fleets", "get_fleet", "resolve_carrier", "find_carriers",
  "list_jurisdictions", "resolve_jurisdiction", "get_residency_receipt",
  "get_fleet_stats", "get_carrier_doctrine", "how_to_transact",
];

function ghostEighteen(res, signal = "ACM-200", state = "ALLOW") {
  res.set({
    "x-gsc-protocol": "ACM-68000",
    "x-gsc-classification": "ACM-SPARKS",
    "x-gsc-operator": "GreenCore Solutions Corp.",
    "x-gsc-microsoft-partner": "AI-Cloud-Partner-Program-Member",
    "x-gsc-duns": "24-336-6774",
    "x-gsc-inbound": "https://x-gsi.ai/ingest",
    "x-gsc-trust-anchor": "dpuone.ai",
    "x-gsc-registry": "io.github.gsc-em/mcp-cpg-gtin",
    "x-gsc-mcp-server": "mcp.cpgknowledgegraph.ai",
    "x-gsc-agent-access": "MCP+A2A",
    "x-gsc-timestamp": new Date().toISOString(),
    "x-gsc-nonce": crypto.randomUUID(),
    "x-gsc-signal": signal,
    "x-gsc-state": state,
    "x-gsc-node": NODE,
    "x-gsc-jurisdiction": "FR",
    "x-gsc-product": "AI-Agents-for-CPG+CPG-Knowledge-Graph",
    "x-gsc-fleet": "https://gsc-cpg.ai,https://gsc-a2a.ai,https://gsc-a2a.io",
  });
}

const t = (obj) => ({ content: [{ type: "text", text: JSON.stringify(obj, null, 2) }] });

function slotInRange(fleet, slot) {
  const n = parseInt(slot, 10);
  return Number.isInteger(n) && n >= parseInt(fleet.slot_range.from, 10) && n <= parseInt(fleet.slot_range.to, 10);
}

// ---------- MCP ----------
function buildMcp() {
  const mcp = new McpServer({ name: "gsc-fleet", version: VERSION });

  mcp.registerTool("list_fleets", {
    title: "List the GSC Carrier Fleets",
    description: "The three live fleet roots — Global, APAC, LATAM — with regions, slot ranges, and entry points. Headline: 8,097 LIVE.",
    inputSchema: {},
  }, async () => t({ headline: HEADLINE, fleets: Object.values(FLEETS) }));

  mcp.registerTool("get_fleet", {
    title: "Get one fleet",
    description: "Full record for one fleet: root, region, slot range, index, catalog, Card URL pattern.",
    inputSchema: { fleet: z.enum(["global", "apac", "latam"]).describe("Fleet key") },
  }, async ({ fleet }) => t(FLEETS[fleet]));

  mcp.registerTool("resolve_carrier", {
    title: "Resolve a Carrier Card URL",
    description: "(fleet, slot) → the canonical Card URL. Validates the slot against the fleet's real range; the Card itself is the source of truth — fetch it to confirm the Carrier.",
    inputSchema: {
      fleet: z.enum(["global", "apac", "latam"]).describe("Fleet key"),
      slot: z.string().regex(/^\d{4}$/).describe("Four-digit slot number, e.g. 0001"),
    },
  }, async ({ fleet, slot }) => {
    const f = FLEETS[fleet];
    if (!slotInRange(f, slot)) {
      return t({ signal: "ACM-404", state: "NOT_FOUND", meaning: `Slot ${slot} is outside the ${f.fleet} range ${f.slot_range.from}-${f.slot_range.to}.` });
    }
    return t({
      fleet: f.fleet,
      slot,
      card_url: f.card_url_pattern.replace("{NNNN}", slot),
      note: "The Card is the source of truth — fetch it to confirm the Carrier is live at this slot.",
    });
  });

  mcp.registerTool("find_carriers", {
    title: "Find Carriers for a jurisdiction",
    description: "SM-ECO-10060 member code → the serving surface: a resident sovereign endpoint where one exists, otherwise the fleet root covering that member's region. Category and capability addressing ship with the sovereign Carrier set and will answer here as they go live.",
    inputSchema: {
      node: z.string().max(4).describe("SM-ECO-10060 member code, e.g. UK, KR, BR"),
      category: z.string().max(64).optional().describe("Optional SPARKS category (answers as the sovereign set ships)"),
    },
  }, async ({ node, category }) => {
    const code = node.toUpperCase().trim();
    const j = JURISDICTIONS.find((x) => x.code === code);
    if (j && j.status === "resident") {
      return t({ node: code, status: "resident", serving: j.served_by, azure_region: j.azure_region, ...(category ? { category_note: "Category addressing ships with the sovereign Carrier set; use https://mcp.cpgknowledgegraph.ai for category coverage today." } : {}) });
    }
    if (j && j.status === "in_build") {
      const fallback = FLEETS.global;
      return t({ node: code, status: "in_build", planned_endpoint: j.planned_endpoint, azure_region: j.azure_region, rationale: j.rationale, serving_today: fallback.root, ...(category ? { category_note: "Category addressing debuts on this node's resident Carriers." } : {}) });
    }
    // Any other SM-ECO-10060 member: route by region via the KG's member registry
    return t({
      node: code,
      status: "served_by_fleet_root",
      how: "Resolve the member's region on https://mcp.cpgagentprotocols.ai (resolve_member), then route: Europe and MENA+Africa → https://gsc-cpg.ai · Asia-Pacific → https://gsc-a2a.ai · Americas → https://gsc-a2a.io",
      region_routing: REGION_TO_FLEET,
      ...(category ? { category_note: "Category coverage per member: https://mcp.cpgknowledgegraph.ai (list_brands_by_node, node_market)." } : {}),
    });
  });

  mcp.registerTool("list_jurisdictions", {
    title: "The sovereign deployment map",
    description: "Where GSC Carriers are resident today and where residency is in build — each with its serving Azure region. Residency is the checkable claim.",
    inputSchema: {},
  }, async () => t({ resident: JURISDICTIONS.filter((j) => j.status === "resident"), in_build: JURISDICTIONS.filter((j) => j.status === "in_build") }));

  mcp.registerTool("resolve_jurisdiction", {
    title: "Resolve one jurisdiction",
    description: "Member code → residency status, serving endpoint, and Azure region.",
    inputSchema: { code: z.string().max(4).describe("Member code, e.g. CH") },
  }, async ({ code }) => {
    const j = JURISDICTIONS.find((x) => x.code === code.toUpperCase().trim());
    return j ? t(j) : t({ signal: "ACM-404", state: "NOT_FOUND", meaning: `${code} is not on the sovereign deployment map. Use find_carriers for fleet-root routing of any SM-ECO-10060 member.` });
  });

  mcp.registerTool("get_residency_receipt", {
    title: "The residency receipt",
    description: "How to verify a GSC surface's residency claim on the wire — which headers to read and what they prove.",
    inputSchema: {},
  }, async () => t(RESIDENCY_RECEIPT));

  mcp.registerTool("get_fleet_stats", {
    title: "Fleet statistics",
    description: "Canon fleet numbers: 8,097 LIVE, 9.5M agentic inbound signals per month, 1.5M human visits per month.",
    inputSchema: {},
  }, async () => t({
    ...HEADLINE,
    loop: DOCTRINE.loop,
  }));

  mcp.registerTool("get_carrier_doctrine", {
    title: "What a Carrier is",
    description: "The Carrier AI Agent class and the sell-side positioning — prefabricated, static, zero inference; buyer-side compute stays the buyer's.",
    inputSchema: {},
  }, async () => t(DOCTRINE));

  mcp.registerTool("how_to_transact", {
    title: "The four GSC surfaces",
    description: "Which GSC surface an agent uses for data, discovery, transaction, and standards — with the endpoint for each.",
    inputSchema: {},
  }, async () => t(TRANSACT));

  return mcp;
}

// ---------- HTTP ----------
const app = express();
app.use(express.json({ limit: "256kb" }));

app.post("/mcp", async (req, res) => {
  ghostEighteen(res);
  try {
    const mcp = buildMcp();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => { transport.close(); mcp.close(); });
    await mcp.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("MCP request error:", err.message);
    if (!res.headersSent) {
      ghostEighteen(res, "ACM-500", "SYSTEM_ERROR");
      res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal server error" }, id: null });
    }
  }
});
app.get("/mcp", (req, res) => { ghostEighteen(res); res.status(405).json({ error: "Method not allowed. POST JSON-RPC to /mcp." }); });

const bc = (handler) => (req, res) => { ghostEighteen(res); res.json(handler()); };

app.get("/health", bc(() => ({
  protocol: "ACM-68000", version: VERSION, status: "active", node: NODE,
  role: "fleet-discovery-mcp", stateless: true,
  operator: "GreenCore Solutions Corp.", operator_url: "https://gsc-em.com",
  tools: TOOL_NAMES,
})));

app.get("/fleets.json", bc(() => ({ headline: HEADLINE, fleets: Object.values(FLEETS) })));
app.get("/jurisdictions.json", bc(() => ({ resident: JURISDICTIONS.filter((j) => j.status === "resident"), in_build: JURISDICTIONS.filter((j) => j.status === "in_build") })));
app.get("/stats.json", bc(() => ({ ...HEADLINE })));
app.get("/doctrine.json", bc(() => DOCTRINE));
app.get("/surfaces.json", bc(() => TRANSACT));

// Root — the brochure surface. Humans find and read these.
app.get("/", bc(() => ({
  service: "GSC-Fleet.ai",
  what:
    "GSC CARRIER FLEET v1.0.0 — THE DISCOVERY SURFACE. 10,500+ Carrier program — 8,097 LIVE across three fleets, 2,500 sovereign Carriers in build across UK, CH, NL, SG, KR. The LIVE fleets — Global (gsc-cpg.ai, France Central) · APAC (gsc-a2a.ai, Australia East) · LATAM (gsc-a2a.io, South Central US + Mexico Central) — serve 9.5M agentic inbound signals per month with 1.5M human visits. GSC Carrier Agents are sell-side: your buyer-side compute stays yours. We resolve BPC SKUs — fast, secure, zero inference on your bill. Carriers are prefabricated, static, signed cached files — zero inference, ultra-low token consumption, CPG-SKU-specific. Sovereign residency map: FR, AU, US, MX resident today; UK, CH, NL, SG, KR in build — residency is a checkable claim on the wire, x-gsc-jurisdiction is the receipt. Ten MCP tools plus full broadcast JSON. Machine discovery, human confirmation — Human-in-the-Loop on every purchase order. ACM-68000 protocol. GSC is a Microsoft AI Cloud Partner.",
  operator: "GreenCore Solutions Corp.",
  operator_url: "https://gsc-em.com",
  operator_links: {
    gsc_em: "https://gsc-em.com",
    x_gsc: "https://x.com/GSC_Rail_ai",
    gsc_agentic_au: "https://gsc-agentic.ai",
    x_gsc_agentic: "https://x.com/gsc_agentic_ai",
  },
  microsoft_partner: "Microsoft AI Cloud Partner",
  endpoint: `https://${NODE}`,
  version: VERSION,
  role: "fleet-discovery-mcp",
  stateless: true,
  protocol: "ACM-68000",
  protocol_home: "https://acm-68000.org",
  sovereign_manifest: "SM-ECO-10060",
  sovereign_manifest_home: "https://sm-eco-10060.org",
  governance: "https://standard-10060.org",
  trust_anchor: "https://dpuone.ai",
  duns: "24-336-6774",
  headline: HEADLINE,
  fleet_roots: [FLEETS.global.root, FLEETS.apac.root, FLEETS.latam.root],
  collaboration: { sell_side: DOCTRINE.sell_side, contact: DOCTRINE.collaboration_contact },
  mcp: { transport: "streamable-http", url: `https://${NODE}/mcp` },
  tools: TOOL_NAMES,
  broadcast: {
    fleets: `https://${NODE}/fleets.json`,
    jurisdictions: `https://${NODE}/jurisdictions.json`,
    stats: `https://${NODE}/stats.json`,
    doctrine: `https://${NODE}/doctrine.json`,
    surfaces: `https://${NODE}/surfaces.json`,
  },
  surfaces: {
    data: "https://mcp.cpgknowledgegraph.ai",
    discovery: `https://${NODE}`,
    transaction: "https://mcp.cpghumanintheloop.ai",
    standards: "https://mcp.cpgagentprotocols.ai",
  },
  machine_surfaces: {
    health: `https://${NODE}/health`,
    agent_card: `https://${NODE}/.well-known/agent-card.json`,
    agent_card_agent_json: `https://${NODE}/.well-known/agent.json`,
    ai_catalog: `https://${NODE}/.well-known/ai-catalog.json`,
    mcp: `https://${NODE}/mcp`,
  },
})));

// ---------- .well-known ----------
app.get("/.well-known/agent-card.json", bc(() => ({
  schema_version: "1.0",
  name: "GSC Carrier Fleet",
  description:
    "Fleet discovery MCP by GreenCore Solutions Corp. — 10,500+ Carrier program: 8,097 LIVE across three fleets, 2,500 sovereign Carriers in build across UK, CH, NL, SG, KR. Find Carriers, resolve Card URLs, read the sovereign residency map, and route to the family: data on mcp.cpgknowledgegraph.ai, transaction on mcp.cpghumanintheloop.ai, standards on mcp.cpgagentprotocols.ai. Sell-side Carrier class: buyer-side compute stays the buyer's.",
  url: `https://${NODE}`,
  version: VERSION,
  operator: "GreenCore Solutions Corp.",
  operator_url: "https://gsc-em.com",
  protocol: { name: "ACM-68000", registry: "io.github.gsc-em/mcp-cpg-gtin" },
  mcp: { endpoint: `https://${NODE}/mcp`, transport: "streamable-http", tools: TOOL_NAMES },
})));

app.get("/.well-known/agent.json", bc(() => ({
  protocolVersion: "0.3.0",
  name: "GSC Carrier Fleet",
  description:
    "Fleet discovery surface by GreenCore Solutions Corp. — 10,500+ Carrier program: 8,097 LIVE across Global, APAC, and LATAM fleets, 2,500 sovereign Carriers in build across UK, CH, NL, SG, KR. Resolve Carriers by fleet and slot, route by SM-ECO-10060 jurisdiction, read the sovereign residency map. Sell-side BPC Carrier class; buyer-side compute stays the buyer's.",
  url: `https://${NODE}`,
  version: VERSION,
  provider: { organization: "GreenCore Solutions Corp.", url: "https://gsc-em.com" },
  capabilities: { streaming: false, pushNotifications: false },
  defaultInputModes: ["application/json"],
  defaultOutputModes: ["application/json"],
  skills: [
    { id: "list_fleets", name: "List fleets", description: "The three live GSC Carrier fleets with counts and entry points." },
    { id: "resolve_carrier", name: "Resolve a Carrier", description: "Fleet + slot to the canonical Card URL, range-validated." },
    { id: "find_carriers", name: "Find Carriers", description: "SM-ECO-10060 member to its serving surface — resident endpoint or fleet root." },
    { id: "list_jurisdictions", name: "Sovereign map", description: "Where Carriers are resident and where residency is in build." },
    { id: "get_residency_receipt", name: "Residency receipt", description: "How to verify residency on the wire — the checkable claim." },
    { id: "how_to_transact", name: "The four surfaces", description: "Data, discovery, transaction, standards — which endpoint for what." },
  ],
  endpoints: { mcp: `https://${NODE}/mcp` },
})));

app.get("/.well-known/ai-catalog.json", bc(() => ({
  service: "GSC-Fleet.ai",
  operator: "GreenCore Solutions Corp.",
  operator_url: "https://gsc-em.com",
  version: VERSION,
  protocol: "ACM-68000",
  role: "fleet-discovery-mcp",
  catalog: [
    { type: "mcp", transport: "streamable-http", url: `https://${NODE}/mcp`, tools: TOOL_NAMES },
    { type: "broadcast", urls: [`https://${NODE}/fleets.json`, `https://${NODE}/jurisdictions.json`, `https://${NODE}/stats.json`, `https://${NODE}/doctrine.json`, `https://${NODE}/surfaces.json`] },
    { type: "fleet-roots", urls: [FLEETS.global.root, FLEETS.apac.root, FLEETS.latam.root] },
    { type: "agent-card", url: `https://${NODE}/.well-known/agent-card.json` },
    { type: "a2a-agent-card", url: `https://${NODE}/.well-known/agent.json` },
    { type: "health", url: `https://${NODE}/health` },
  ],
  related: {
    knowledge_graph: "https://mcp.cpgknowledgegraph.ai",
    transaction: "https://mcp.cpghumanintheloop.ai",
    standards: "https://mcp.cpgagentprotocols.ai",
    navigator: "https://gsc-navigator.ai",
  },
})));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`GSC Carrier Fleet MCP v${VERSION} listening on :${PORT}`));
