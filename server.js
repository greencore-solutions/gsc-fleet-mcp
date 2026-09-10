import * as __fsV4ns from "node:fs";
import * as __cryptoV4ns from "node:crypto";
const __fsV4 = __fsV4ns; const __cryptoV4 = __cryptoV4ns;
import { readFileSync as __asRead } from "node:fs";
// ============================================================
// mcp.gsc-fleet.ai — GSC Carrier Fleet discovery MCP  v1.3.0 (truth roll 2026-08-22)
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
import { mountAeo, mountMcpMethodGuard } from "./aeo.js";
import {
  HEADLINE, FLEETS, JURISDICTIONS, REGION_TO_FLEET,
  RESIDENCY_RECEIPT, DOCTRINE, TRANSACT,
} from "./canon.js";

const VERSION = "1.6.0";   // ASK 3 (CEO go 2026-09-10): + ask_elyssah
const NODE = "mcp.gsc-fleet.ai";
const TOOL_NAMES = [
  "list_fleets", "get_fleet", "resolve_carrier", "find_carriers",
  "list_jurisdictions", "resolve_jurisdiction", "get_residency_receipt",
  "get_fleet_stats", "get_carrier_doctrine", "how_to_transact", "ask_elyssah",
];
const ASK3_URL = "https://ask.gsc-em.com/";   // ASK 3 desk — the Worker gsc-ask-3 (one desk: pages, embed, agents)

// Ghost Headers v4.0 — values from the GENERATED per-origin confs (ghost-headers-vars.csv
// -> ghost-v4/<host>.conf, never typed). Re-canon 2026-08-31 after the agent-setup roll
// briefly regressed the wire to the retired pre-v4 set (NG-4: emit-from-the-table law).
const __V4 = {};
for (const f of __fsV4.readdirSync(new URL("./ghost-v4/", import.meta.url))) {
  const host = f.replace(/\.conf$/, "");
  const pairs = [];
  for (const line of __fsV4.readFileSync(new URL("./ghost-v4/" + f, import.meta.url), "utf8").split("\n")) {
    const m = line.match(/^add_header\s+(\S+)\s+(?:"([^"]*)"|(\$\S+))\s+always;/);
    if (m) pairs.push([m[1], m[2] !== undefined ? m[2] : m[3]]);
  }
  __V4[host] = pairs;
}
function ghostV4(res, signal, state) {
  const req = res.req;
  const host = (req && (req.headers["x-forwarded-host"] || req.headers.host) || "").split(":")[0].toLowerCase();
  const pairs = __V4[host] || __V4[Object.keys(__V4)[0]];
  for (const [k, v] of pairs) {
    if (v === "$time_iso8601") res.set(k, new Date().toISOString());
    else if (v === "$request_id") res.set(k, __cryptoV4.randomBytes(16).toString("hex"));
    else if (k === "x-gsc-signal" && signal && signal.startsWith("CPG-")) res.set(k, signal);
    else if (k === "x-gsc-state" && state) res.set(k, state);
    else res.set(k, v);
  }
  res.set("Access-Control-Expose-Headers", pairs.map(p => p[0]).join(", "));
  res.set("Access-Control-Allow-Origin", "*");
  res.set("X-Content-Type-Options", "nosniff");
  res.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
}

function ghostEighteen(res, signal = "ACM-200", state = "ALLOW") { ghostV4(res, ...Array.from(arguments).slice(1)); }

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
    description: "The three live fleet roots — Global, APAC, LATAM — with regions, slot ranges, and entry points. Headline: 32,597 LIVE AI Agents — the 32,500+ AI Agent program: 19,597 Carriers on the fleet roots and 14 sovereign nodes, 3,000 on the APP surfaces, 10,000 AI Orderability (AIO) Agents on the ten gsc-marketplace.ai hosts.",
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
      return t({ node: code, status: "resident", serving: j.served_by, azure_region: j.azure_region, carriers: j.carriers, ...(category ? { category_note: "Category coverage is answered by the Knowledge Graph, not the fleet: https://mcp.cpgknowledgegraph.ai" } : {}) });
    }
    // No jurisdiction is in build — all nine are resident as of 2026-07-20.
    // The branch stays as a guard: if a future member is added in build,
    // it answers honestly instead of pretending to be resident.
    if (j && j.status === "in_build") {
      const fallback = FLEETS.global;
      return t({ node: code, status: "in_build", planned_endpoint: j.planned_endpoint, azure_region: j.azure_region, rationale: j.rationale, serving_today: fallback.root });
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
    description: "Where GSC Carriers are resident — eighteen jurisdictions, each with its serving Azure region. Residency is the checkable claim.",
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
    description: "Canon numbers: 32,597 LIVE AI Agents (32,500+ AI Agent program: 22,597 Carriers + 10,000 AIO Agents) across eighteen resident jurisdictions. Monthly transaction volume is published at gsc-radar.ai — the source of record.",
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

  mcp.registerTool("ask_elyssah", {
    title: "Ask elyssah — GSC's AI assistant",
    description: "Ask GSC's AI assistant elyssah a question about GSC, its AI Agents for Beauty & Personal Care brands, the numbers of record, the AI investment market per the analysts, management or coverage. Returns the same JSON the human desk gets: answer {q, a, id, anchor, door} served byte for byte from GSC's record (no model in the answer path), shelf (up to 3 related pairs on record), suggested links, and sig — the estate keyring signature (kid gsc-cards-2026-08) over {id, a, ts}, verifiable at https://gsc-registry.ai/keyring.json. Pass prev = the id of the last answer for one-turn context. Not investment advice.",
    inputSchema: { q: z.string().min(1).max(300).describe("The question, plain words, up to 300 characters"), prev: z.string().max(40).optional().describe("id of the last answer shown (one-turn context, ranking only)") },
  }, async ({ q, prev }) => {
    const r = await fetch(ASK3_URL + "ask", { method: "POST", headers: { "Content-Type": "application/json", "User-Agent": "gsc-fleet-mcp/" + VERSION }, body: JSON.stringify({ q, prev: prev || null }) });
    const j = await r.json();
    return t({ ...j, permalink: j.page || null, desk: ASK3_URL, mcp: "mcp.gsc-fleet.ai" });
  });

  return mcp;
}

// ---------- HTTP ----------
const app = express();
app.use(express.json({ limit: "256kb" }));
mountAeo(app, {
  title: "GSC Fleet", version: VERSION, protocol: "ACM-68000", tools: TOOL_NAMES, ghost: ghostEighteen, hosts: [NODE, "gsc-fleet.ai"],
  registryName: "io.github.greencore-solutions/gsc-fleet-mcp",
  desc: "The discovery surface of the GSC Carrier Fleet: LIVE Carrier Agents across sovereign jurisdictions — Global (France Central), APAC (Australia East), LATAM (South Central US + Mexico Central) — resolved by fleet, jurisdiction and carrier.",
});

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
// One /mcp method convention (NG-7 FIX item 2): every non-POST method answers a
// deliberate JSON 405 with Allow: POST — never a default HTML 404.
mountMcpMethodGuard(app, ghostEighteen);

const bc = (handler) => (req, res) => { ghostEighteen(res); res.json(handler()); };

// AGENT-SETUP (CEO order 2026-08-31)
const AGENT_SETUP_MD = __asRead(new URL("./agent-setup/prompt.md", import.meta.url));
const AGENT_SETUP_SVG = __asRead(new URL("./agent-setup/ai-agent-gsc-bar.svg", import.meta.url));
app.get("/agent-setup/prompt.md", (req, res) => { ghostEighteen(res); res.type("text/markdown; charset=utf-8").send(AGENT_SETUP_MD); });
app.get("/agent-setup/ai-agent-gsc-bar.svg", (req, res) => { res.type("image/svg+xml").send(AGENT_SETUP_SVG); });

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
    "GSC CARRIER FLEET v1.4.0 — THE DISCOVERY SURFACE. 32,597 LIVE AI Agents — the 32,500+ AI Agent program: 22,597 Carriers plus 10,000 AI Orderability (AIO) Agents on the ten gsc-marketplace.ai hosts — across EIGHTEEN resident jurisdictions, zero in build. The LIVE fleets — Global (gsc-cpg.ai, France Central) · APAC (gsc-a2a.ai, Australia East) · LATAM (gsc-a2a.io, South Central US + Mexico Central) — plus fourteen sovereign nodes on gsc-fleet.ai: UK · CH · NL · SG · KR at 500 Carriers each and BR · JP · IN · DE · CA · IT · ES · PL · AE at 1,000 each, and 3,000 APP Program Carriers on uk/eu/latam.gsc-agency.io. Live transaction volume is published at gsc-radar.ai — the source of record. GSC Carrier Agents are sell-side: your buyer-side compute stays yours. We resolve BPC SKUs — fast and secure, zero inference cost. Carriers are prefabricated, static, signed cached files — zero inference, ultra-low token consumption, CPG-SKU-specific. Sovereign residency map: FR, AU, US, MX, UK, CH, NL, SG, KR, BR, JP, IN, DE, CA, IT, ES, PL, AE all resident — residency is a checkable claim on the wire, x-gsc-jurisdiction is the receipt. Ten MCP tools plus full broadcast JSON. Machine discovery, human confirmation — Human-in-the-Loop on every purchase order. ACM-68000 protocol. GSC is a Microsoft AI Cloud Partner.",
  operator: "GreenCore Solutions Corp.",
  operator_url: "https://gsc-em.com",
  operator_links: {
    gsc_em: "https://gsc-em.com",
    x_gsc: "https://x.com/GSC_Rail_ai",
    gsc_agentic_au: "https://gsc-agentic.ai",
    x_gsc_agentic: "https://x.com/gsc_global_ai",
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
    "Fleet discovery MCP by GreenCore Solutions Corp. — 32,597 LIVE AI Agents (22,597 Carriers + 10,000 AIO Agents) across eighteen resident jurisdictions, zero in build: three fleets plus fourteen sovereign nodes (UK, CH, NL, SG, KR at 500; BR, JP, IN, DE, CA, IT, ES, PL, AE at 1,000) and 3,000 APP Program Carriers. Find Carriers, resolve Card URLs, read the sovereign residency map, and route to the family: data on mcp.cpgknowledgegraph.ai, transaction on mcp.cpghumanintheloop.ai, standards on mcp.cpgagentprotocols.ai. Sell-side Carrier class: buyer-side compute stays the buyer's.",
  url: `https://${NODE}`,
  version: VERSION,
  operator: "GreenCore Solutions Corp.",
  operator_url: "https://gsc-em.com",
  protocol: { name: "ACM-68000", registry: "io.github.greencore-solutions/gsc-fleet-mcp" },
  mcp: { endpoint: `https://${NODE}/mcp`, transport: "streamable-http", tools: TOOL_NAMES },
})));

// Legacy /.well-known/agent.json (was a draft 0.3.0-shape card) — the current card is
// A2A 1.0 at /.well-known/agent-card.json (NG-7 FIX item 4); one card, one address.
app.get("/.well-known/agent.json", (req, res) => { ghostEighteen(res); res.redirect(308, "/.well-known/agent-card.json"); });

// ARD capability manifest (doors-alive fix 2026-08-22): true ARD shape — specVersion + host + entries —
// replacing the legacy beacon-style catalog the scanner rejected ("missing required specVersion").
app.get("/.well-known/ai-catalog.json", bc(() => ({
  specVersion: "1.0",
  host: { displayName: "GSC Carrier Fleet", identifier: `did:web:${NODE}` },
  entries: [
    {
      identifier: `urn:air:${NODE}:fleet:discovery-mcp`,
      displayName: "GSC Carrier Fleet — discovery MCP",
      type: "application/mcp-server+json",
      url: `https://${NODE}/mcp`,
      capabilities: TOOL_NAMES,
      description: "The discovery surface of the GSC AI Agent program: 32,597 LIVE AI Agents (22,597 Carriers + 10,000 AIO Agents) across eighteen resident jurisdictions, resolved by fleet, jurisdiction and carrier over MCP (streamable-http). AIO Agents resolve on mcp.gsc-marketplace.ai. Operated by GreenCore Solutions Corp.",
      representativeQueries: ["which GSC Carrier fleet serves Brazil", "resolve Carrier 0001 on the UK sovereign node", "how many GSC Carriers are live and where are they resident"],
    },
    {
      identifier: `urn:air:${NODE}:fleet:broadcast`,
      displayName: "Fleet broadcast record",
      type: "application/json",
      url: `https://${NODE}/fleets.json`,
      capabilities: ["fleet-record", "jurisdiction-map", "fleet-stats", "carrier-doctrine"],
      description: "The same fleet truth as plain JSON: fleets.json, jurisdictions.json, stats.json, doctrine.json, surfaces.json.",
      representativeQueries: ["GSC fleet statistics", "GSC sovereign deployment map"],
    },
  ],
})));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`GSC Carrier Fleet MCP v${VERSION} listening on :${PORT}`));
