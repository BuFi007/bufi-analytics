-- Verifiable onchain USDC flows touching registered BUFI addresses (mainnets).
-- Joins Dune's canonical transfer data against the uploaded address registry
-- (dataset_bufi_addresses — push via `addressesToCsv` + `DuneUploader`).
-- Replace {{namespace}} with your Dune handle.
--
-- This is the "trust layer" beside the uploaded metrics: anyone can audit
-- these rows against the chain.

WITH bufi_addrs AS (
  SELECT DISTINCT lower(address) AS address, project
  FROM dune.{{namespace}}.dataset_bufi_addresses
  WHERE kind IN ('wallet', 'vault', 'protocol')
)
SELECT
  DATE_TRUNC('day', t.evt_block_time)                   AS day,
  a.project,
  t.blockchain                                          AS chain,
  COUNT(*)                                              AS transfer_count,
  SUM(t.amount_usd)                                     AS volume_usd,
  COUNT(DISTINCT t."from")                              AS unique_senders
FROM tokens.transfers t
JOIN bufi_addrs a
  ON lower(CAST(t."to" AS varchar)) = a.address
  OR lower(CAST(t."from" AS varchar)) = a.address
WHERE t.symbol = 'USDC'
  AND t.evt_block_time > NOW() - INTERVAL '90' day
GROUP BY 1, 2, 3
ORDER BY day DESC;
