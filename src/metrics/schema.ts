import { z } from 'zod';

/** The three BUFI products reporting into the shared dashboard. */
export const BUFI_PROJECTS = ['desk', 'defi', 'pasillo'] as const;
export const BufiProjectSchema = z.enum(BUFI_PROJECTS);
export type BufiProject = z.infer<typeof BufiProjectSchema>;

/**
 * Where a metric row's numbers come from. Provenance is part of the contract:
 * the public dashboard labels every row so testnet/ledger volume is never
 * conflated with verifiable mainnet activity.
 */
export const METRIC_SOURCES = ['onchain', 'ledger', 'dune-sim', 'envio', 'mcp'] as const;
export const MetricSourceSchema = z.enum(METRIC_SOURCES);
export type MetricSource = z.infer<typeof MetricSourceSchema>;

/**
 * One daily metrics row. Each project uploads its full history daily (the Dune
 * CSV upload endpoint replaces the table, so uploads are idempotent).
 */
export const BufiMetricsSnapshotSchema = z.object({
  project: BufiProjectSchema,
  /** YYYY-MM-DD (UTC) the metrics describe */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD'),
  /** Chain slug ('arc-testnet', 'avalanche', 'multi') or 'offchain' for ledger rows */
  chain: z.string().min(1),
  source: MetricSourceSchema,
  tvl_usd: z.number().nonnegative().default(0),
  volume_usd: z.number().nonnegative().default(0),
  tx_count: z.number().int().nonnegative().default(0),
  active_wallets: z.number().int().nonnegative().default(0),
  fees_usd: z.number().nonnegative().default(0),
});
export type BufiMetricsSnapshot = z.infer<typeof BufiMetricsSnapshotSchema>;

/** Stable CSV column order — dashboard SQL depends on these names. */
export const METRICS_CSV_COLUMNS = [
  'project',
  'date',
  'chain',
  'source',
  'tvl_usd',
  'volume_usd',
  'tx_count',
  'active_wallets',
  'fees_usd',
] as const satisfies readonly (keyof BufiMetricsSnapshot)[];

export function parseSnapshots(rows: unknown[]): BufiMetricsSnapshot[] {
  return rows.map(r => BufiMetricsSnapshotSchema.parse(r));
}

/** Serialize snapshots to the CSV shape the Dune upload endpoint expects. */
export function snapshotsToCsv(snapshots: BufiMetricsSnapshot[]): string {
  const header = METRICS_CSV_COLUMNS.join(',');
  const lines = snapshots.map(s =>
    METRICS_CSV_COLUMNS.map(col => csvCell(s[col])).join(',')
  );
  return [header, ...lines].join('\n');
}

function csvCell(value: string | number): string {
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replaceAll('"', '""')}"` : str;
}
