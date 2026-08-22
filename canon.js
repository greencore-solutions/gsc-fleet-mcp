// ============================================================
// canon.js — GSC Carrier Fleet compiled canon  v1.0.0
// mcp.gsc-fleet.ai — the fleet discovery MCP
// Stateless by design. This surface indexes the fleet; the
// Cards themselves are the payload and stay the single source.
// ============================================================

export const HEADLINE = {
  live_agents: 22597,
  carriers_in_build: 0,
  program_total: 22597,
  program_label: "22,500+ Carrier program",
  programs: {
    carrier_fleet_sovereign: { live: 19597, what: "Global + APAC + LATAM fleets and 14 sovereign nodes on gsc-fleet.ai surfaces" },
    app_program: { live: 3000, what: "GSC APP Program - AI Agents for BPC on uk/eu/latam.gsc-agency.io" },
  },
  sovereign_jurisdictions_resident: 18,
  agentic_inbound_signals_per_month: 9500000,
  human_visits_per_month: 1500000,
};

export const FLEETS = {
  global: {
    key: "global",
    fleet: "GSC AI Agent CPG Fleet - Global",
    root: "https://gsc-cpg.ai",
    region: "Microsoft Azure France Central",
    slot_range: { from: "0001", to: "5500" },
    serves_regions: ["Europe", "MENA+Africa"],
    index: "https://gsc-cpg.ai/index.json",
    catalog: "https://gsc-cpg.ai/.well-known/ai-catalog.json",
    card_url_pattern: "https://gsc-cpg.ai/{NNNN}/.well-known/agent-card.json",
  },
  apac: {
    key: "apac",
    fleet: "GSC AI Agent CPG Fleet - APAC",
    root: "https://gsc-a2a.ai",
    region: "Microsoft Azure Australia East",
    slot_range: { from: "0001", to: "1000" },
    serves_regions: ["Asia-Pacific"],
    index: "https://gsc-a2a.ai/index.json",
    catalog: "https://gsc-a2a.ai/.well-known/ai-catalog.json",
    card_url_pattern: "https://gsc-a2a.ai/{NNNN}/.well-known/agent-card.json",
  },
  latam: {
    key: "latam",
    fleet: "GSC AI Agent CPG Fleet - LATAM",
    root: "https://gsc-a2a.io",
    region: "Microsoft Azure South Central US (compute) + Mexico Central (storage)",
    slot_range: { from: "0001", to: "0500" },
    serves_regions: ["Americas"],
    index: "https://gsc-a2a.io/index.json",
    catalog: "https://gsc-a2a.io/.well-known/ai-catalog.json",
    card_url_pattern: "https://gsc-a2a.io/{NNNN}/.well-known/agent-card.json",
  },
};

// Sovereign deployment map. Original nine resident 2026-07-20 (four fleet
// homes + five sovereign nodes at 500 Cards each). THE 22,597 RUN adds nine
// new sovereign nodes at 1,000 Cards each, flipped resident one market at a
// time as each DNS bind lands (2026-08-01). Status is only ever set from
// what is actually on the wire.
export const JURISDICTIONS = [
  { code: "FR", jurisdiction: "France", status: "resident", served_by: "https://gsc-cpg.ai", azure_region: "France Central", note: "Global fleet home" },
  { code: "AU", jurisdiction: "Australia", status: "resident", served_by: "https://gsc-a2a.ai", azure_region: "Australia East", note: "APAC fleet home" },
  { code: "US", jurisdiction: "United States", status: "resident", served_by: "https://gsc-a2a.io", azure_region: "South Central US", note: "LATAM fleet compute" },
  { code: "MX", jurisdiction: "Mexico", status: "resident", served_by: "https://gsc-a2a.io", azure_region: "Mexico Central", note: "LATAM fleet storage residency" },
  { code: "UK", jurisdiction: "United Kingdom", status: "resident", served_by: "https://uk.gsc-fleet.ai", azure_region: "UK South", rationale: "Global CPG headquarters market", carriers: 500 },
  { code: "CH", jurisdiction: "Switzerland", status: "resident", served_by: "https://ch.gsc-fleet.ai", azure_region: "Switzerland North", rationale: "Global CPG headquarters market and data sovereignty", carriers: 500 },
  { code: "NL", jurisdiction: "Netherlands", status: "resident", served_by: "https://nl.gsc-fleet.ai", azure_region: "West Europe", rationale: "Rotterdam — Europe's CPG goods flow", carriers: 500 },
  { code: "SG", jurisdiction: "Singapore", status: "resident", served_by: "https://sg.gsc-fleet.ai", azure_region: "Southeast Asia", rationale: "APAC AI and finance capital", carriers: 500 },
  { code: "KR", jurisdiction: "South Korea", status: "resident", served_by: "https://kr.gsc-fleet.ai", azure_region: "Korea Central", rationale: "Beauty & Personal Care innovation center", carriers: 500 },
  // THE 22,597 RUN (2026-08-01): nine new sovereign nodes, flipped resident per market as DNS binds
  { code: "BR", jurisdiction: "Brazil", status: "resident", served_by: "https://br.gsc-fleet.ai", azure_region: "Brazil South", rationale: "Latin America's largest CPG market", carriers: 1000 },
  { code: "JP", jurisdiction: "Japan", status: "resident", served_by: "https://jp.gsc-fleet.ai", azure_region: "Japan East", rationale: "World-leading Beauty & Personal Care innovation market", carriers: 1000 },
  { code: "IN", jurisdiction: "India", status: "resident", served_by: "https://in.gsc-fleet.ai", azure_region: "Central India", rationale: "Fastest-growing CPG consumer market on earth", carriers: 1000 },
  { code: "DE", jurisdiction: "Germany", status: "resident", served_by: "https://de.gsc-fleet.ai", azure_region: "Germany West Central", rationale: "Europe's largest CPG economy and data-sovereignty market", carriers: 1000 },
  { code: "CA", jurisdiction: "Canada", status: "resident", served_by: "https://ca.gsc-fleet.ai", azure_region: "Canada Central", rationale: "GSC home market — operator jurisdiction on sovereign soil", carriers: 1000 },
  { code: "IT", jurisdiction: "Italy", status: "resident", served_by: "https://it.gsc-fleet.ai", azure_region: "Italy North", rationale: "Global beauty manufacturing and prestige supply base", carriers: 1000 },
  { code: "ES", jurisdiction: "Spain", status: "resident", served_by: "https://es.gsc-fleet.ai", azure_region: "Spain Central", rationale: "Iberian CPG gateway and retail-grocery scale market", carriers: 1000 },
  { code: "PL", jurisdiction: "Poland", status: "resident", served_by: "https://pl.gsc-fleet.ai", azure_region: "Poland Central", rationale: "Central Europe's CPG manufacturing and logistics hub", carriers: 1000 },
  { code: "AE", jurisdiction: "United Arab Emirates", status: "resident", served_by: "https://ae.gsc-fleet.ai", azure_region: "UAE North", rationale: "Middle East trade and retail innovation gateway", carriers: 1000 },
];

// SM-ECO-10060 region routing for members without a resident node yet
export const REGION_TO_FLEET = {
  "Europe": "global",
  "MENA+Africa": "global",
  "Asia-Pacific": "apac",
  "Americas": "latam",
};

export const RESIDENCY_RECEIPT = {
  what: "Residency is a checkable claim, not a marketing line. Every GSC surface emits its identity on the wire.",
  check: "GET any GSC fleet surface and read the response headers.",
  headers_to_read: {
    "x-gsc-node": "the emitting surface self-announces",
    "x-gsc-jurisdiction": "the exact SM-ECO-10060 member the surface serves under",
    "x-gsc-operator": "GreenCore Solutions Corp.",
    "x-gsc-timestamp": "concrete per-request value — proof of liveness",
    "x-gsc-nonce": "concrete per-request value — proof of liveness",
  },
  header_canon: "https://mcp.cpgagentprotocols.ai/headers.json",
};

export const DOCTRINE = {
  carrier: "GSC makes Carrier AI Agents — prefabricated, static, zero inference. A Carrier is a signed cached file: durable, ultra-low token consumption, high security, CPG-SKU-specific.",
  sell_side: "GSC Carrier Agents are sell-side. Your buyer-side compute stays yours. We resolve BPC SKUs — fast, secure, zero inference on your bill. Optimizing your buyer-side stack? Tell us what you need and we will build to it.",
  collaboration_contact: "https://gsc-navigator.ai",
  loop: "Machine discovery, human confirmation: AI Agents find and report back to ERP operators, who put eyes on to confirm. Human-in-the-Loop on every purchase order.",
};

export const TRANSACT = {
  what: "The four GSC surfaces and when an agent uses each.",
  surfaces: {
    data: { url: "https://mcp.cpgknowledgegraph.ai", when: "Resolve SKUs, brands, makers, retail banners, eligibility — the CPG Knowledge Graph powered by SPARKS." },
    discovery: { url: "https://mcp.gsc-fleet.ai", when: "Find Carriers: which fleet, which jurisdiction, how to reach a Card." },
    transaction: { url: "https://mcp.cpghumanintheloop.ai", when: "Lodge an RFQ, request terms, or escalate — a human answers every ticket. ACM-451 ESCALATE is served here." },
    standards: { url: "https://mcp.cpgagentprotocols.ai", when: "The protocols themselves: ACM-SPARKS, SM-ECO-10060, ACM-68000 — signals, members, header canon." },
  },
};
