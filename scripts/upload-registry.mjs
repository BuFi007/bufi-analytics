#!/usr/bin/env node
// Uploads the static address registry to Dune as `bufi_addresses` —
// the join table for sql/03_onchain_usdc_flows.sql.
//
// Usage: DUNE_API_KEY=... node scripts/upload-registry.mjs
// (run `bun run build` first — imports from dist/)

import { addressesToCsv, BUFI_ADDRESSES, DuneUploader } from '../dist/index.js';

const apiKey = process.env.DUNE_API_KEY;
if (!apiKey) {
  console.error('DUNE_API_KEY not set');
  process.exit(1);
}

const uploader = new DuneUploader({ apiKey });
const result = await uploader.uploadCsvTable({
  tableName: 'bufi_addresses',
  description: 'BUFI registered addresses (desk/defi/pasillo) — see github.com/BuFi007/bufi-analytics',
  csv: addressesToCsv(BUFI_ADDRESSES),
});

console.log(result.success ? 'uploaded bufi_addresses' : 'FAILED', result.status, result.body);
process.exit(result.success ? 0 : 1);
