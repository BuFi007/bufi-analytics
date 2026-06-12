// src/metrics/schema.ts
import { z } from "zod";
var BUFI_PROJECTS = ["desk", "defi", "pasillo"];
var BufiProjectSchema = z.enum(BUFI_PROJECTS);
var METRIC_SOURCES = ["onchain", "ledger", "dune-sim", "envio", "mcp"];
var MetricSourceSchema = z.enum(METRIC_SOURCES);
var BufiMetricsSnapshotSchema = z.object({
  project: BufiProjectSchema,
  /** YYYY-MM-DD (UTC) the metrics describe */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD"),
  /** Chain slug ('arc-testnet', 'avalanche', 'multi') or 'offchain' for ledger rows */
  chain: z.string().min(1),
  source: MetricSourceSchema,
  tvl_usd: z.number().nonnegative().default(0),
  volume_usd: z.number().nonnegative().default(0),
  tx_count: z.number().int().nonnegative().default(0),
  active_wallets: z.number().int().nonnegative().default(0),
  fees_usd: z.number().nonnegative().default(0)
});
var METRICS_CSV_COLUMNS = [
  "project",
  "date",
  "chain",
  "source",
  "tvl_usd",
  "volume_usd",
  "tx_count",
  "active_wallets",
  "fees_usd"
];
function parseSnapshots(rows) {
  return rows.map((r) => BufiMetricsSnapshotSchema.parse(r));
}
function snapshotsToCsv(snapshots) {
  const header = METRICS_CSV_COLUMNS.join(",");
  const lines = snapshots.map(
    (s) => METRICS_CSV_COLUMNS.map((col) => csvCell(s[col])).join(",")
  );
  return [header, ...lines].join("\n");
}
function csvCell(value) {
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replaceAll('"', '""')}"` : str;
}

export {
  BUFI_PROJECTS,
  BufiProjectSchema,
  METRIC_SOURCES,
  MetricSourceSchema,
  BufiMetricsSnapshotSchema,
  METRICS_CSV_COLUMNS,
  parseSnapshots,
  snapshotsToCsv
};
//# sourceMappingURL=chunk-J63GCBQB.js.map