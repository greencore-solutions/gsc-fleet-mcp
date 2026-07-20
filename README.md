# MCP GSC AI Agent Carrier Class Fleet

**Surface role: DISCOVERY** — one of the four GSC surfaces (data · **discovery** · transaction · standards).

Find Carriers: which fleet, which jurisdiction, how to reach a Card.

| | |
|---|---|
| **Canonical endpoint** | `https://mcp.gsc-fleet.ai/mcp` (streamable-http) |
| **Apex / website** | `https://gsc-fleet.ai` |
| **Registry listing** | `io.github.greencore-solutions/gsc-fleet-mcp` v1.0.0 |
| **Operator** | GreenCore Solutions Corp. — Microsoft AI Cloud Partner |
| **Protocol** | ACM-68000 · sovereign manifest SM-ECO-10060 |

## Registry tile text (verbatim)

> **Title:** MCP GSC AI Agent Carrier Class Fleet
> **Description:** BPC Sustainable Carrier Agents - Low Token Zero Inference

## What it serves

Ten MCP read tools — `list_fleets`, `get_fleet`, `resolve_carrier`, `find_carriers`,
`list_jurisdictions`, `resolve_jurisdiction`, `get_residency_receipt`,
`get_fleet_stats`, `get_carrier_doctrine`, `how_to_transact` — plus broadcast JSON
(`/fleets.json`, `/jurisdictions.json`, `/stats.json`, `/doctrine.json`,
`/surfaces.json`), a brochure root, and three `.well-known` cards.

Stateless: fleet truth is compiled in; the Carrier Cards themselves stay the single
source. No database, no secrets.

## Releases

| tag | source | deployed image digest | note |
|---|---|---|---|
| `v1.0.0` | `b49d3dd` | `sha256:fd126d7e2a02` | Discovery surface goes live; completes the four-surface set |
| `v1.1.0` | this head | `sha256:8d1c003cfd26` | Sovereign resident flip — revision `gsc-fleet-mcp--0000006` |

**v1.1.0 truth:** 10,597 LIVE Carriers across **nine** resident sovereign
jurisdictions — FR, AU, US, MX, UK, CH, NL, SG, KR — zero in build. The five
sovereign nodes (`uk|ch|nl|sg|kr.gsc-fleet.ai`) carry 500 Carrier Cards each,
served from inside their own national Azure regions.

## The four surfaces

| surface | endpoint |
|---|---|
| data | `https://mcp.cpgknowledgegraph.ai` |
| **discovery** | `https://mcp.gsc-fleet.ai` |
| transaction | `https://mcp.cpghumanintheloop.ai` |
| standards | `https://mcp.cpgagentprotocols.ai` |

## Residency is checkable

Every response carries its identity on the wire. `x-gsc-jurisdiction` is the
receipt; `x-gsc-timestamp` and `x-gsc-nonce` are per-request proof of liveness.
Header canon: `https://mcp.cpgagentprotocols.ai/headers.json`

## Licensing

No license file is committed. GSC MCP server code is under a hybrid
MIT + Commercial Enterprise arrangement; the counsel-drafted terms are pending.
Until they land, absence of a LICENSE file is deliberate — not an oversight.
