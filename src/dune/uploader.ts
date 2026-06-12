import type { BufiMetricsSnapshot, BufiProject } from '../metrics/schema';
import { snapshotsToCsv } from '../metrics/schema';

const DUNE_API_BASE = 'https://api.dune.com';

export interface DuneUploaderOptions {
  /** Dune platform API key (api.dune.com — NOT the Sim key) */
  apiKey: string;
  baseUrl?: string;
}

export interface UploadCsvParams {
  /** Becomes dune.{your_namespace}.dataset_{table_name} */
  tableName: string;
  description?: string;
  csv: string;
  /** Public by default — the whole point is a public grant dashboard */
  isPrivate?: boolean;
}

export interface DuneUploadResult {
  success: boolean;
  status: number;
  body: string;
}

/**
 * Client for Dune's table-upload API. Each upload REPLACES the named table, so
 * push the full history every time — uploads stay idempotent and need no
 * append/dedup bookkeeping.
 */
export class DuneUploader {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(opts: DuneUploaderOptions) {
    this.apiKey = opts.apiKey;
    this.baseUrl = opts.baseUrl ?? DUNE_API_BASE;
  }

  /** POST /api/v1/table/upload/csv */
  async uploadCsvTable(params: UploadCsvParams): Promise<DuneUploadResult> {
    const res = await fetch(`${this.baseUrl}/api/v1/table/upload/csv`, {
      method: 'POST',
      headers: {
        'X-DUNE-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        table_name: params.tableName,
        description: params.description ?? '',
        data: params.csv,
        is_private: params.isPrivate ?? false,
      }),
      signal: AbortSignal.timeout(60_000),
    });
    return { success: res.ok, status: res.status, body: await res.text() };
  }
}

/** Canonical per-project metrics table name: bufi_metrics_{project}. */
export function metricsTableName(project: BufiProject): string {
  return `bufi_metrics_${project}`;
}

/**
 * One-call helper: validate-by-construction snapshots → CSV → upload to the
 * project's canonical table. This is what each repo's daily cron calls.
 */
export async function uploadMetricsSnapshots(opts: {
  apiKey: string;
  project: BufiProject;
  snapshots: BufiMetricsSnapshot[];
  description?: string;
}): Promise<DuneUploadResult> {
  const uploader = new DuneUploader({ apiKey: opts.apiKey });
  return uploader.uploadCsvTable({
    tableName: metricsTableName(opts.project),
    description:
      opts.description ??
      `BUFI ${opts.project} daily metrics (tvl, volume, tx count, active wallets, fees) — uploaded by @bufinance/analytics`,
    csv: snapshotsToCsv(opts.snapshots),
  });
}
