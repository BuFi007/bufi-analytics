export interface DuneTokenMetadata {
  logo_url?: string;
  url?: string;
}

export interface DuneHistoricalPrice {
  timestamp: string;
  price_usd: number;
}

export interface DuneBalance {
  chain_id: number;
  address: string;
  amount: string;
  decimals: number;
  symbol: string;
  name: string;
  price_usd: number | null;
  value_usd: number | null;
  token_metadata?: DuneTokenMetadata;
  historical_prices?: DuneHistoricalPrice[];
}

export interface DuneActivity {
  chain_id: number;
  type: 'send' | 'receive' | 'call';
  from: string;
  to: string;
  value: string;
  value_usd: number | null;
  block_time: string;
  transaction_hash: string;
  function?: string;
  token_metadata?: DuneTokenMetadata;
}

export interface DuneBalancesResponse {
  balances: DuneBalance[];
}

export interface DuneActivityResponse {
  activity: DuneActivity[];
}

export interface DuneBalanceOptions {
  metadata?: string;
  historicalPrices?: string;
  excludeSpamTokens?: boolean;
}

export interface DuneActivityOptions {
  limit?: number;
  offset?: number;
}

export interface DuneTokenPrice {
  /** ISO 8601 */
  timestamp: string;
  price_usd: number;
}

export interface DuneTokenPriceResponse {
  prices: DuneTokenPrice[];
}

export interface DuneTokenPriceOptions {
  /** Number of days of history (default: 90) */
  days?: number;
}
