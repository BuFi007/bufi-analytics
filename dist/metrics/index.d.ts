import { z } from 'zod';

/** The three BUFI products reporting into the shared dashboard. */
declare const BUFI_PROJECTS: readonly ["desk", "defi", "pasillo"];
declare const BufiProjectSchema: z.ZodEnum<{
    desk: "desk";
    defi: "defi";
    pasillo: "pasillo";
}>;
type BufiProject = z.infer<typeof BufiProjectSchema>;
/**
 * Where a metric row's numbers come from. Provenance is part of the contract:
 * the public dashboard labels every row so testnet/ledger volume is never
 * conflated with verifiable mainnet activity.
 */
declare const METRIC_SOURCES: readonly ["onchain", "ledger", "dune-sim", "envio", "mcp"];
declare const MetricSourceSchema: z.ZodEnum<{
    onchain: "onchain";
    ledger: "ledger";
    "dune-sim": "dune-sim";
    envio: "envio";
    mcp: "mcp";
}>;
type MetricSource = z.infer<typeof MetricSourceSchema>;
/**
 * One daily metrics row. Each project uploads its full history daily (the Dune
 * CSV upload endpoint replaces the table, so uploads are idempotent).
 */
declare const BufiMetricsSnapshotSchema: z.ZodObject<{
    project: z.ZodEnum<{
        desk: "desk";
        defi: "defi";
        pasillo: "pasillo";
    }>;
    date: z.ZodString;
    chain: z.ZodString;
    source: z.ZodEnum<{
        onchain: "onchain";
        ledger: "ledger";
        "dune-sim": "dune-sim";
        envio: "envio";
        mcp: "mcp";
    }>;
    tvl_usd: z.ZodDefault<z.ZodNumber>;
    volume_usd: z.ZodDefault<z.ZodNumber>;
    tx_count: z.ZodDefault<z.ZodNumber>;
    active_wallets: z.ZodDefault<z.ZodNumber>;
    fees_usd: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
type BufiMetricsSnapshot = z.infer<typeof BufiMetricsSnapshotSchema>;
/** Stable CSV column order — dashboard SQL depends on these names. */
declare const METRICS_CSV_COLUMNS: readonly ["project", "date", "chain", "source", "tvl_usd", "volume_usd", "tx_count", "active_wallets", "fees_usd"];
declare function parseSnapshots(rows: unknown[]): BufiMetricsSnapshot[];
/** Serialize snapshots to the CSV shape the Dune upload endpoint expects. */
declare function snapshotsToCsv(snapshots: BufiMetricsSnapshot[]): string;

export { BUFI_PROJECTS, type BufiMetricsSnapshot, BufiMetricsSnapshotSchema, type BufiProject, BufiProjectSchema, METRICS_CSV_COLUMNS, METRIC_SOURCES, type MetricSource, MetricSourceSchema, parseSnapshots, snapshotsToCsv };
