# @bufinance/analytics

Cross-repo analytics kit for the BUFI product family — **one Dune dashboard for everything**.

Three products report into it:

| Project | Repo | What it reports |
| --- | --- | --- |
| `desk` | [desk-v1](https://github.com/BuFi007/desk-v1) | Gateway USDC deposits/transfers, team wallet volume (ledger + mainnet onchain) |
| `defi` | defi-web-app | FX protocol TVL, perp/spot volume, fees (Arc testnet via MCP/Envio + mainnet via Dune Sim) |
| `pasillo` | [b-in-bufi](https://github.com/BuFi007/b-in-bufi) | B2B ramp + FX flow volumes (ledger) |

## Modules

```ts
import { DuneSimClient, tvlUsd } from '@bufinance/analytics/sim';
import { BufiMetricsSnapshotSchema, snapshotsToCsv } from '@bufinance/analytics/metrics';
import { uploadMetricsSnapshots } from '@bufinance/analytics/dune';
import { BUFI_ADDRESSES, addressesToCsv } from '@bufinance/analytics/registry';
```

- **`/sim`** — unified [Dune Sim API](https://docs.sim.dune.com) client (realtime balances, activity, token prices, TVL aggregation). Superset of the clients previously duplicated in desk-v1 (`@bu/dune`) and defi-web-app. Native fetch, retry + timeout, fail-safe helpers. Env: `DUNE_SIM_API_KEY`.
- **`/metrics`** — the shared daily-metrics contract (`BufiMetricsSnapshot`, zod v4): `project, date, chain, source, tvl_usd, volume_usd, tx_count, active_wallets, fees_usd`. `source` carries provenance (`onchain | ledger | dune-sim | envio | mcp`) so testnet/app-ledger rows are never conflated with verifiable mainnet rows.
- **`/dune`** — uploader for Dune's [table upload API](https://docs.dune.com/api-reference/tables/endpoint/upload). Each project's daily cron pushes its **full history** to `dune.{namespace}.dataset_bufi_metrics_{project}` (upload = replace = idempotent). Env: `DUNE_API_KEY` (platform key, not the Sim key).
- **`/registry`** — code-reviewed static address registry + merge hook for runtime-discovered addresses (e.g. desk's per-team gateway depositor EOAs). Uploadable as `dataset_bufi_addresses` for onchain joins.

## The dashboard

`sql/` holds the version-controlled dashboard queries:

1. `01_combined_overview.sql` — all three projects, one timeseries (main grant dashboard)
2. `02_per_project.sql` — per-product dashboards (desk / defi / pasillo)
3. `03_onchain_usdc_flows.sql` — verifiable mainnet USDC flows joined against the uploaded address registry (the audit layer)

### Live state (namespace `criptopoeta1761`, seeded 2026-06-12)

Tables: `dataset_bufi_metrics_{desk,defi,pasillo}` + `dataset_bufi_addresses` — all uploaded.
Queries (public, created via API):

| Query | ID |
| --- | --- |
| BUFI — Combined Overview | [7710800](https://dune.com/queries/7710800) |
| BUFI — desk daily metrics | [7710803](https://dune.com/queries/7710803) |
| BUFI — defi daily metrics | [7710804](https://dune.com/queries/7710804) |
| BUFI — pasillo daily metrics | [7710805](https://dune.com/queries/7710805) |
| BUFI — Onchain USDC flows | [7710806](https://dune.com/queries/7710806) |

### Assembly (one-time, dune.com UI — dashboards aren't API-creatable)

1. dune.com → New → Dashboard → **"BUFI — Overview"**; add widgets from queries 7710800 + 7710806; make public.
2. Repeat per project (desk 7710803 / defi 7710804 / pasillo 7710805).
3. Pin the overview URL here:

> **Dashboard:** **[dune.com/criptopoeta1761/bufi-ecosystem](https://dune.com/criptopoeta1761/bufi-ecosystem)**

## Daily reporter pattern (per repo)

```ts
import { uploadMetricsSnapshots } from '@bufinance/analytics/dune';
import type { BufiMetricsSnapshot } from '@bufinance/analytics/metrics';

const snapshots: BufiMetricsSnapshot[] = await collectDailyHistory(); // app-specific
await uploadMetricsSnapshots({
  apiKey: process.env.DUNE_API_KEY!,
  project: 'desk',
  snapshots,
});
```

## Development

```bash
bun install
bun run build      # tsup → dist (ESM + d.ts)
bun run typecheck
bun run smoke      # asserts public exports exist
```

Release: bump version, tag `vX.Y.Z`, push — CI publishes with provenance (needs `NPM_TOKEN` secret).

MIT © BU.FI
