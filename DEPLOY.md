# DEPLOY — mcp.gsc-fleet.ai v1.0.0

**Sub:** AIO Agents (`9e406344-81a4-4624-98de-a9c642a75d69`) · **RG:** `rg-aio-agents-fr` · **Region:** France Central
**ACR:** `gscemregistry` · **Env:** `aio-agents-env-fr` · **App:** `gsc-fleet-mcp`
**DB:** NONE — stateless discovery MCP, no DSN, no secrets, no Phase 0.

## What this is

The GSC Carrier Fleet discovery MCP — the DISCOVERY surface, completing the four-surface set (data · discovery · transaction · standards). Stateless: fleet truth compiled in, the 8,097 Cards stay the single source. Ten read tools (list_fleets, get_fleet, resolve_carrier, find_carriers, list_jurisdictions, resolve_jurisdiction, get_residency_receipt, get_fleet_stats, get_carrier_doctrine, how_to_transact) + broadcast JSONs (/fleets.json /jurisdictions.json /stats.json /doctrine.json /surfaces.json) + brochure root + three .well-known cards (agent-card.json, agent.json A2A, ai-catalog.json). Sovereign map ships truth-labeled: FR/AU/US/MX resident, UK/CH/NL/SG/KR in_build — flips per node as regional Carriers deploy.

Smoke-tested pre-package: 10 tools over JSON-RPC, range-validated Card resolution + ACM-404, jurisdiction routing (resident / in_build / fleet-root), all 10 GET surfaces 200, headline 8,097 on the wire, Ghost Eighteen node self-announce.

## Phase 1 — Build & push (CC)

```powershell
cd C:\GREENCORE\MCP\fleet-mcp
az acr login --name gscemregistry
docker build -t gscemregistry.azurecr.io/gsc-fleet-mcp:1.0.0 .
docker push gscemregistry.azurecr.io/gsc-fleet-mcp:1.0.0
```

## Phase 2 — Container App (CC — no secrets)

```powershell
az containerapp create `
  --name gsc-fleet-mcp `
  --resource-group rg-aio-agents-fr `
  --subscription 9e406344-81a4-4624-98de-a9c642a75d69 `
  --environment aio-agents-env-fr `
  --image gscemregistry.azurecr.io/gsc-fleet-mcp:1.0.0 `
  --target-port 8080 `
  --ingress external `
  --min-replicas 1 `
  --max-replicas 2 `
  --cpu 0.25 `
  --memory 0.5Gi `
  --registry-server gscemregistry.azurecr.io
```

## Phase 3 — Custom domain

1. CC hands operator: default FQDN + custom-domain verification ID for zone **gsc-fleet.ai**
2. Operator, Cloudflare — **grey cloud / DNS only**: CNAME `mcp` → FQDN · TXT `asuid.mcp` → verification ID
3. CC binds `mcp.gsc-fleet.ai` + managed TLS (poll up to 15 min)

## Verify (CC)

```powershell
Invoke-RestMethod "https://mcp.gsc-fleet.ai/health"        # active, stateless true, 10 tools
Invoke-RestMethod "https://mcp.gsc-fleet.ai/stats.json"    # live_agents 8097
$h = (Invoke-WebRequest "https://mcp.gsc-fleet.ai/").Headers
$h['x-gsc-node']   # mcp.gsc-fleet.ai
# tools/list -> 10 tools; /fleets.json /jurisdictions.json /doctrine.json /surfaces.json all 200
```

## Phase R — BRAND-NEW registry listing (new-era namespace)

Per CEO ruling: clean new listing, no version-forward. `io.github.gsc-em/a2a-mcp-cpg` (April 25 2026) stands as a frozen primacy receipt — untouched.

- R1  Create repo `github.com/greencore-solutions/gsc-fleet-mcp` — push source
- R2  server.json: name `io.github.greencore-solutions/gsc-fleet-mcp` · version 1.0.0 · websiteUrl `https://gsc-fleet.ai` · remote streamable-http `https://mcp.gsc-fleet.ai/mcp` · **title + description = CEO tile text, supplied at review** (tile canon: bare category strings, no sentences, no punctuation) — validate ≤100, show operator, WAIT
- R3  Publish AFTER live-remote gates pass (current login holds the namespace)
- R4  Registry API verify + commit server.json
- Build-records-log one-liner on completion

## Rollback

```powershell
az containerapp revision list --name gsc-fleet-mcp --resource-group rg-aio-agents-fr -o table
az containerapp revision activate --name gsc-fleet-mcp --resource-group rg-aio-agents-fr --revision <previous>
```

## Follow-on (separate packets, not this deploy)

Sovereign Carrier build: 2,500 Cards (500 × UK/CH/NL/SG/KR), caps #1-#3 + residency receipt + sell-side funnel native, category-path addressing (shape pending), regional Container Apps per market; this MCP flips each node resident as it ships.

## Files

```
fleet-mcp/
├── server.js       # 10 tools + brochure + broadcast + 3 well-known cards
├── canon.js        # compiled fleet truth: fleets, jurisdictions, doctrine
├── package.json
├── Dockerfile      # node:22-alpine
└── DEPLOY.md
```
