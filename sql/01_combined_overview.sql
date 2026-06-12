-- BUFI combined overview — powers the main grant dashboard.
-- Unions the three uploaded project tables into one timeseries.
-- Replace {{namespace}} with your Dune handle (e.g. criptopoeta) when saving.
--
-- Provenance: `source` distinguishes verifiable mainnet rows ('onchain',
-- 'dune-sim') from app-ledger and testnet rows ('ledger', 'envio', 'mcp').

WITH all_metrics AS (
  SELECT * FROM dune.{{namespace}}.dataset_bufi_metrics_desk
  UNION ALL
  SELECT * FROM dune.{{namespace}}.dataset_bufi_metrics_defi
  UNION ALL
  SELECT * FROM dune.{{namespace}}.dataset_bufi_metrics_pasillo
)
SELECT
  CAST(date AS date)            AS day,
  project,
  chain,
  source,
  SUM(tvl_usd)                  AS tvl_usd,
  SUM(volume_usd)               AS volume_usd,
  SUM(tx_count)                 AS tx_count,
  SUM(active_wallets)           AS active_wallets,
  SUM(fees_usd)                 AS fees_usd
FROM all_metrics
GROUP BY 1, 2, 3, 4
ORDER BY day DESC, project;
