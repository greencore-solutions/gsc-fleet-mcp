// aeo.js — GSC AEO / discovery layer for Express MCP surfaces (2026-08-15).
// ADDITIVE ONLY: registers GET routes; never touches /mcp or the transport.
// Constant block is keyed on the request Host header — every bound hostname self-identifies.
// Usage (in server.js, BEFORE app.post("/mcp", ...)):
//   import { mountAeo } from "./aeo.js";
//   mountAeo(app, { title, desc, protocol, tools: TOOL_NAMES, ghost: ghostEighteen, hosts: [...] });
import crypto from "node:crypto";

const TENANT = "54939635-2f2e-465a-8526-a907cb3c8ebd";
const ISSUER = `https://login.microsoftonline.com/${TENANT}/v2.0`;
const MCP_KG = "https://mcp.cpgknowledgegraph.ai/mcp";
const CANON = "38,350 brands / 15,688 retail banners / 3.29M points of sale / 50 markets — monthly inbound agent transaction number published at https://gsc-radar.ai (source of record)";
const OP = "GreenCore Solutions Corp.";
const CONTACT = "https://gsc-navigator.ai/";
const LINK = '</.well-known/api-catalog>; rel="api-catalog", </llms.txt>; rel="describedby", <https://mcp.cpgknowledgegraph.ai>; rel="service"';

// Live Entra mirror (verbatim keys, grant_types augmented) — same body as estate canon.
const ENTRA = {
  token_endpoint: `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`,
  token_endpoint_auth_methods_supported: ["client_secret_post","private_key_jwt","client_secret_basic"],
  jwks_uri: `https://login.microsoftonline.com/${TENANT}/discovery/v2.0/keys`,
  response_modes_supported: ["query","fragment","form_post"],
  subject_types_supported: ["pairwise"],
  id_token_signing_alg_values_supported: ["RS256"],
  response_types_supported: ["code","id_token","code id_token","id_token token"],
  scopes_supported: ["openid","profile","email","offline_access"],
  issuer: ISSUER,
  request_uri_parameter_supported: false,
  userinfo_endpoint: "https://graph.microsoft.com/oidc/userinfo",
  authorization_endpoint: `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/authorize`,
  device_authorization_endpoint: `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/devicecode`,
  http_logout_supported: true, frontchannel_logout_supported: true,
  end_session_endpoint: `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/logout`,
  claims_supported: ["sub","iss","cloud_instance_name","cloud_instance_host_name","cloud_graph_host_name","msgraph_host","aud","exp","iat","auth_time","acr","nonce","preferred_username","name","tid","ver","at_hash","c_hash","email"],
  kerberos_endpoint: `https://login.microsoftonline.com/${TENANT}/kerberos`,
  tenant_region_scope: "NA", cloud_instance_name: "microsoftonline.com", cloud_graph_host_name: "graph.windows.net",
  msgraph_host: "graph.microsoft.com", rbac_url: "https://pas.windows.net",
  grant_types_supported: ["authorization_code","refresh_token","client_credentials","urn:ietf:params:oauth:grant-type:device_code"],
};
const WBA = { keys: [{ kty:"OKP", crv:"Ed25519", kid:"gsc-wba-2026-08",
  x: process.env.GSC_WBA_X || "sHpu1sfipgobiFg6uTQfqikkJBSc-6j08VBxEhtFR8A", use:"sig", alg:"EdDSA", nbf:1755043200, exp:1818201600 }] };

const SKILLS = {
  "sku-discovery": ["Resolve Beauty & Personal Care (BPC) and CPG SKUs/GTINs to canonical, cited product identity on the SPARKS CPG Knowledge Graph.",
    `Use the MCP endpoint ${MCP_KG} (streamable-http) to resolve a SKU, GTIN or brand to canonical identity.\nCoverage: ${CANON}.\nGTIN-first; answers are resolved and cited, no LLM in the request path.`],
  "eligibility-check": ["Check whether a CPG SKU or brand qualifies for a retail banner's assortment across 15,688 banners in 50 markets.",
    `Query the SPARKS CPG Knowledge Graph over MCP (${MCP_KG}) with a SKU/GTIN and a target retail banner or market.\nReturns qualification signals grounded in the graph (${CANON}).`],
  "jurisdiction-resolution": ["Resolve which GSC protocol jurisdiction governs an agentic CPG transaction (SM-ECO-10060, ACM-68000, ACM-SPARKS).",
    `Resolve jurisdiction and protocol for an agentic CPG transaction via MCP (${MCP_KG}).\nCanonical standards: acm-sparks.ai / sm-eco-10060.org / acm-68000.org. Operator: ${OP}.`],
  "procurement-signal": ["Read procurement signals for retail grocery buying agents; human-in-the-loop commits via GSC Navigator.",
    `Read agentic procurement signals over MCP (${MCP_KG}).\n${CANON}.\nEvery order commit is human-signed (HITL) via GSC Navigator.`],
};
const skillMd = (n, d, b) => `---\nname: ${n}\ndescription: ${d}\n---\n\n# ${n.replace(/-/g," ").replace(/\b\w/g, c => c.toUpperCase())}\n\n${b}\n`;
const sha = s => "sha256:" + crypto.createHash("sha256").update(s, "utf8").digest("hex");

export function mountAeo(app, cfg) {
  const { title, desc, protocol, tools = [], ghost = () => {}, hosts = [] } = cfg;
  const H = req => (req.headers.host || hosts[0] || "").split(":")[0].toLowerCase();
  const send = (res, req, type, body) => { ghost(res); res.setHeader("Link", LINK); res.type(type).send(body); };
  const json = (res, req, obj) => { ghost(res); res.setHeader("Link", LINK); res.json(obj); };
  const mcpUrl = h => `https://${h}/mcp`;

  app.get("/robots.txt", (req, res) => send(res, req, "text/plain",
    `User-agent: *\nContent-Signal: search=yes, ai-input=yes, ai-train=yes\nAllow: /\nUser-agent: GPTBot\nAllow: /\nUser-agent: ClaudeBot\nAllow: /\nUser-agent: Google-Extended\nAllow: /\nUser-agent: PerplexityBot\nAllow: /\nUser-agent: CCBot\nAllow: /\nSitemap: https://${H(req)}/sitemap.xml\n`));
  app.get("/sitemap.xml", (req, res) => send(res, req, "application/xml",
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://${H(req)}/</loc><lastmod>2026-08-15</lastmod></url>\n</urlset>\n`));
  app.get("/llms.txt", (req, res) => send(res, req, "text/plain",
    `# ${H(req)} — ${title}\n\n${desc}\n\nMCP endpoint (streamable-http): ${mcpUrl(H(req))}\nTools: ${tools.join(", ")}\n\nOperator: ${OP} | D-U-N-S 24-336-6774 | Microsoft AI Cloud Partner\nStandards: acm-sparks.ai / sm-eco-10060.org / acm-68000.org\nCanonical numbers: ${CANON}\nHITL contact: ${CONTACT}\n`));
  app.get("/index.md", (req, res) => send(res, req, "text/markdown; charset=utf-8",
    `# ${title}\n\n> ${H(req)}\n\n${desc}\n\n## MCP\n\n- Endpoint: ${mcpUrl(H(req))} (streamable-http)\n- Tools: ${tools.map(t => "`" + t + "`").join(", ")}\n- Server card: /.well-known/mcp/server-card.json\n\nProtocol: ${protocol} · Operator: ${OP} · D-U-N-S 24-336-6774\nStandards: [acm-sparks.ai](https://acm-sparks.ai) · [sm-eco-10060.ai](https://sm-eco-10060.ai) · [acm-68000.ai](https://acm-68000.ai)\n`));
  // Link header on EVERY response (root included) — pure header, transport body untouched.
  app.use((req, res, next) => { res.setHeader("Link", LINK); next(); });
  // ROOT content negotiation (pre-handler; JSON stays the default for agents/curl):
  //   Accept: text/markdown  -> md twin
  //   Accept: text/html      -> minimal HTML shell that loads /webmcp.js and links the machine files (browsers/WebMCP)
  //   otherwise              -> next() to the existing JSON GET /
  app.get("/", (req, res, next) => {
    const acc = req.headers.accept || "";
    if (/text\/markdown/i.test(acc)) return app._router.handle(Object.assign(req, { url: "/index.md", originalUrl: "/index.md" }), res, next);
    if (/text\/html/i.test(acc) && !/application\/json/i.test(acc.split(",")[0])) {
      const h = H(req);
      return send(res, req, "text/html; charset=utf-8",
`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${title} — ${h}</title><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="canonical" href="https://${h}/"><style>body{font-family:Inter,system-ui,sans-serif;color:#141414;max-width:760px;margin:60px auto;padding:0 24px;line-height:1.6}h1{font-family:Archivo,sans-serif}code{background:#F7F6F3;padding:2px 6px;border-radius:4px}a{color:#F38020}</style></head><body><h1>${title}</h1><p>${desc}</p><p>MCP endpoint (streamable-http): <code>${mcpUrl(h)}</code></p><p>Machine files: <a href="/llms.txt">llms.txt</a> · <a href="/index.md">markdown</a> · <a href="/.well-known/mcp/server-card.json">MCP server card</a> · <a href="/.well-known/agent-card.json">A2A agent card</a> · <a href="/.well-known/agent-skills/index.json">agent skills</a> · <a href="/health.json">health</a></p><p>Operator: ${OP} · D-U-N-S 24-336-6774 · <a href="https://gsc-navigator.ai/">Human-in-the-Loop</a></p><script src="/webmcp.js" defer></script></body></html>`);
    }
    next();
  });
  app.get("/health.json", (req, res) => json(res, req, { status: "ok", host: H(req), protocol, operator: OP, mcp: mcpUrl(H(req)), tools }));
  app.get("/.well-known/mcp/server-card.json", (req, res) => json(res, req, {
    serverInfo: { name: title, version: cfg.version || "1.0.0" },
    transport: { type: "streamable-http", endpoint: mcpUrl(H(req)) },
    capabilities: { tools: {} }, tools, operator: OP, registry: "io.github.greencore-solutions/cpg-knowledge-graph" }));
  app.get("/.well-known/agent-skills/index.json", (req, res) => json(res, req, {
    "$schema": "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
    skills: Object.entries(SKILLS).map(([n, [d, b]]) => ({ name: n, type: "skill-md", description: d, url: `/.well-known/agent-skills/${n}/SKILL.md`, digest: sha(skillMd(n, d, b)) })) }));
  app.get("/.well-known/agent-skills/:name/SKILL.md", (req, res) => {
    const s = SKILLS[req.params.name]; if (!s) return res.status(404).json({ error: "not_found" });
    send(res, req, "text/markdown; charset=utf-8", skillMd(req.params.name, s[0], s[1])); });
  app.get("/.well-known/api-catalog", (req, res) => { ghost(res); res.setHeader("Link", LINK); res.type("application/linkset+json").send(JSON.stringify({ linkset: [{
    anchor: `https://${H(req)}`, "service-desc": [{ href: mcpUrl(H(req)), type: "application/json" }],
    "service-doc": [{ href: `https://${H(req)}/llms.txt`, type: "text/plain" }], status: [{ href: `https://${H(req)}/health.json` }] }] })); });
  app.get("/.well-known/openid-configuration", (req, res) => json(res, req, ENTRA));
  const agentAuth = h => ({ skill: `https://${h}/auth.md`, register_uri: CONTACT, identity_types_supported: ["identity_assertion"],
    identity_assertion: { assertion_types_supported: ["verified_email"], credential_types_supported: ["oauth2_client_credentials"] }, claim_uri: CONTACT });
  app.get("/.well-known/oauth-authorization-server", (req, res) => json(res, req, { ...ENTRA, agent_auth: agentAuth(H(req)) }));
  app.get("/.well-known/oauth-protected-resource", (req, res) => json(res, req, { resource: `https://${H(req)}`, authorization_servers: [ISSUER],
    scopes_supported: ["openid","profile","email","offline_access"], bearer_methods_supported: ["header"], resource_documentation: "https://mcp.cpgknowledgegraph.ai/" }));
  app.get("/.well-known/http-message-signatures-directory", (req, res) => { ghost(res); res.type("application/http-message-signatures-directory+json").send(JSON.stringify(WBA)); });
  app.get("/auth.md", (req, res) => { const h = H(req); send(res, req, "text/markdown; charset=utf-8",
`# auth.md — ${h} (${OP})

## Posture

Public content and machine files on this surface are **open by design** — no authentication is required. Discovery endpoints (/.well-known/*) are public. The MCP endpoint (${mcpUrl(h)}) serves read tools openly.

Transactional agentic commerce is authorized at the **GSC Navigator boundary** using **Microsoft Entra OAuth 2.0** (2-factor; human-in-the-loop on every commit).

## Protected resource

- Resource: https://${h}
- Protected Resource Metadata: [/.well-known/oauth-protected-resource](/.well-known/oauth-protected-resource)
- Authorization server (Microsoft Entra): ${ISSUER}
- AS metadata mirror: [/.well-known/oauth-authorization-server](/.well-known/oauth-authorization-server)
- Bearer tokens are presented in the Authorization header.

## Agent registration (self-contained flow)

- **Agent audience:** AI agents and operators integrating with this MCP surface (${protocol}) and the SPARKS CPG Knowledge Graph.
- **Registration endpoint:** ${CONTACT} — GSC Navigator, the Human-in-the-Loop inbound (POST https://formspree.io/f/xaqrznpe with fields name, email, message). There is no self-serve dynamic client registration; every registration is human-reviewed.
- **Supported method — verified email:** GSC verifies the operator's email, then provisions credentials after review.
- **Credential use:** GSC issues **Microsoft Entra OAuth 2.0 client credentials** (client_credentials grant against the issuer above); present the access token as a **Bearer token in the Authorization header**. Revocation on request via the same endpoint.

\`\`\`json
${JSON.stringify({ agent_auth: agentAuth(h) }, null, 2)}
\`\`\`

Operator: ${OP} · D-U-N-S 24-336-6774 · Microsoft AI Cloud Partner.
`); });
  app.get("/webmcp.js", (req, res) => { const h = H(req); send(res, req, "text/javascript; charset=utf-8",
`// GSC WebMCP tools (real endpoints; no stubs). MCP surface ${h}.
(function(){function build(){return[
{name:"gsc_mcp_endpoint",description:"Return this surface's live MCP endpoint (streamable-http) and tool list.",inputSchema:{type:"object",properties:{}},execute:async function(){return {endpoint:"${mcpUrl(h)}",transport:"streamable-http",tools:${JSON.stringify(tools)}};}},
{name:"gsc_stats",description:"Canonical GSC AI Agent Stack statband (public set).",inputSchema:{type:"object",properties:{}},execute:async function(){return {brands:38350,retail_banners:15688,points_of_sale:3290000,markets:50,monthly_transactions_source_of_record:"https://gsc-radar.ai",operator:"${OP}",mcp:"${MCP_KG}"};}}
];}try{var mc=navigator.modelContext;if(!mc)return;var t=build();if(typeof mc.registerTool==="function"){t.forEach(function(x){mc.registerTool(x);});}else if(typeof mc.provideContext==="function"){mc.provideContext({tools:t});}}catch(e){}})();
`); });
  // Spec-complete A2A card (skills + supportedInterfaces) — REPLACES the legacy card route: register FIRST so it wins.
  app.get("/.well-known/agent-card.json", (req, res) => { const h = H(req); json(res, req, {
    protocolVersion: "0.3.0", name: title, description: desc, url: `https://${h}/`, version: cfg.version || "1.0.0", kind: "agent-card",
    provider: { organization: OP, url: "https://gsc-em.com" },
    operator: { name: OP, url: "https://gsc-em.com", duns: "24-336-6774", microsoft_partner: "Microsoft AI Cloud Partner" },
    capabilities: { streaming: true, pushNotifications: false },
    defaultInputModes: ["application/json","text/plain"], defaultOutputModes: ["application/json","text/markdown"],
    supportedInterfaces: [{ url: mcpUrl(h), protocolBinding: "HTTP+JSON", transport: "streamable-http", description: `${title} (MCP)` },
                          { url: `https://${h}/`, protocolBinding: "HTTP+JSON", transport: "HTTP+JSON" }],
    skills: [
      { id: "mcp-tools", name: `${title} — MCP tools`, description: `Live MCP tools on ${h}: ${tools.join(", ")}.`, tags: ["mcp", protocol.toLowerCase()] },
      { id: "canonical-stats", name: "Canonical Network Stats", description: `Serve the canonical GSC statband: ${CANON}.`, tags: ["stats","cpg","network"] },
      { id: "hitl-contact", name: "Human-in-the-Loop Contact", description: `Reach ${OP} via GSC Navigator (${CONTACT}); every transactional commit is human-signed.`, tags: ["contact","hitl"] }],
    protocol, registry: "io.github.greencore-solutions/cpg-knowledge-graph", mcp_endpoint: mcpUrl(h) }); });
}
