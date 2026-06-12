import { BufiProject, BufiMetricsSnapshot } from '../metrics/index.js';
import 'zod';

interface DuneUploaderOptions {
    /** Dune platform API key (api.dune.com — NOT the Sim key) */
    apiKey: string;
    baseUrl?: string;
}
interface UploadCsvParams {
    /** Becomes dune.{your_namespace}.dataset_{table_name} */
    tableName: string;
    description?: string;
    csv: string;
    /** Public by default — the whole point is a public grant dashboard */
    isPrivate?: boolean;
}
interface DuneUploadResult {
    success: boolean;
    status: number;
    body: string;
}
/**
 * Client for Dune's table-upload API. Each upload REPLACES the named table, so
 * push the full history every time — uploads stay idempotent and need no
 * append/dedup bookkeeping.
 */
declare class DuneUploader {
    private readonly apiKey;
    private readonly baseUrl;
    constructor(opts: DuneUploaderOptions);
    /** POST /api/v1/table/upload/csv */
    uploadCsvTable(params: UploadCsvParams): Promise<DuneUploadResult>;
}
/** Canonical per-project metrics table name: bufi_metrics_{project}. */
declare function metricsTableName(project: BufiProject): string;
/**
 * One-call helper: validate-by-construction snapshots → CSV → upload to the
 * project's canonical table. This is what each repo's daily cron calls.
 */
declare function uploadMetricsSnapshots(opts: {
    apiKey: string;
    project: BufiProject;
    snapshots: BufiMetricsSnapshot[];
    description?: string;
}): Promise<DuneUploadResult>;

export { type DuneUploadResult, DuneUploader, type DuneUploaderOptions, type UploadCsvParams, metricsTableName, uploadMetricsSnapshots };
