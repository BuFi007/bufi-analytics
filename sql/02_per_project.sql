-- Per-project dashboard query — save once per project (desk / defi / pasillo)
-- with the matching table, or parameterize with a Dune dropdown parameter.
-- Replace {{namespace}} with your Dune handle.

SELECT
  CAST(date AS date)            AS day,
  chain,
  source,
  SUM(tvl_usd)                  AS tvl_usd,
  SUM(volume_usd)               AS volume_usd,
  SUM(tx_count)                 AS tx_count,
  SUM(active_wallets)           AS active_wallets,
  SUM(fees_usd)                 AS fees_usd
FROM dune.{{namespace}}.dataset_bufi_metrics_desk  -- ← swap per project
GROUP BY 1, 2, 3
ORDER BY day DESC;
