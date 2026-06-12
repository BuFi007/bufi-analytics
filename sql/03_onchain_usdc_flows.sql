-- Verifiable onchain USDC flows touching registered BUFI addresses (mainnets).
-- Joins Dune's canonical transfer data against the uploaded address registry
-- (dataset_bufi_addresses — push via `addressesToCsv` + `DuneUploader`).
-- Replace {{namespace}} with your Dune handle (live: criptopoeta1761, query 7710806).
--
-- NOTE: Dune types uploaded 0x… CSV columns as varbinary, which matches
-- tokens.transfers natively — do NOT lower() or CAST the address columns
-- (varbinary is case-insensitive; lower(varbinary) is a type error).
--
-- This is the "trust layer" beside the uploaded metrics: anyone can audit
-- these rows against the chain.

WITH bufi_addrs AS (
  SELECT DISTINCT address, project
  FROM dune.{{namespace}}.dataset_bufi_addresses
  WHERE kind IN ('wallet', 'vault', 'protocol')
)
SELECT
  DATE_TRUNC('day', t.block_time)                       AS day,
  a.project,
  t.blockchain                                          AS chain,
  COUNT(*)                                              AS transfer_count,
  SUM(t.amount_usd)                                     AS volume_usd,
  COUNT(DISTINCT t."from")                              AS unique_senders
FROM tokens.transfers t
JOIN bufi_addrs a
  ON t."to" = a.address
  OR t."from" = a.address
WHERE t.symbol = 'USDC'
  AND t.block_time > NOW() - INTERVAL '90' day
GROUP BY 1, 2, 3
ORDER BY day DESC;
