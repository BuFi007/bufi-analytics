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

### Assembly (one-time, dune.com UI)

1. Run each repo's metrics cron once (or `uploadMetricsSnapshots` manually) so the three `dataset_bufi_metrics_*` tables exist, and upload the registry (`addressesToCsv`) as `bufi_addresses`.
2. Create the four queries from `sql/`, replacing `{{namespace}}` with your Dune handle.
3. Compose dashboards: **BUFI — Overview** (combined) + one per project. Make them public.
4. Pin the overview URL here:

> **Dashboard:** _TBD — pinned after first upload_

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
