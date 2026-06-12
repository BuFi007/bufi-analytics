import {
  snapshotsToCsv
} from "./chunk-J63GCBQB.js";

// src/dune/uploader.ts
var DUNE_API_BASE = "https://api.dune.com";
var DuneUploader = class {
  apiKey;
  baseUrl;
  constructor(opts) {
    this.apiKey = opts.apiKey;
    this.baseUrl = opts.baseUrl ?? DUNE_API_BASE;
  }
  /** POST /api/v1/table/upload/csv */
  async uploadCsvTable(params) {
    const res = await fetch(`${this.baseUrl}/api/v1/table/upload/csv`, {
      method: "POST",
      headers: {
        "X-DUNE-API-KEY": this.apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        table_name: params.tableName,
        description: params.description ?? "",
        data: params.csv,
        is_private: params.isPrivate ?? false
      }),
      signal: AbortSignal.timeout(6e4)
    });
    return { success: res.ok, status: res.status, body: await res.text() };
  }
};
function metricsTableName(project) {
  return `bufi_metrics_${project}`;
}
async function uploadMetricsSnapshots(opts) {
  const uploader = new DuneUploader({ apiKey: opts.apiKey });
  return uploader.uploadCsvTable({
    tableName: metricsTableName(opts.project),
    description: opts.description ?? `BUFI ${opts.project} daily metrics (tvl, volume, tx count, active wallets, fees) \u2014 uploaded by @bufinance/analytics`,
    csv: snapshotsToCsv(opts.snapshots)
  });
}

export {
  DuneUploader,
  metricsTableName,
  uploadMetricsSnapshots
};
//# sourceMappingURL=chunk-N3FHWOWI.js.map