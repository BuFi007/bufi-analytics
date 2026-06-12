interface DuneTokenMetadata {
    logo_url?: string;
    url?: string;
}
interface DuneHistoricalPrice {
    timestamp: string;
    price_usd: number;
}
interface DuneBalance {
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
interface DuneActivity {
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
interface DuneBalancesResponse {
    balances: DuneBalance[];
}
interface DuneActivityResponse {
    activity: DuneActivity[];
}
interface DuneBalanceOptions {
    metadata?: string;
    historicalPrices?: string;
    excludeSpamTokens?: boolean;
}
interface DuneActivityOptions {
    limit?: number;
    offset?: number;
}
interface DuneTokenPrice {
    /** ISO 8601 */
    timestamp: string;
    price_usd: number;
}
interface DuneTokenPriceResponse {
    prices: DuneTokenPrice[];
}
interface DuneTokenPriceOptions {
    /** Number of days of history (default: 90) */
    days?: number;
}

interface DuneSimClientOptions {
    apiKey: string;
    baseUrl?: string;
    /** Per-request timeout in ms (default 15s) */
    timeoutMs?: number;
}
/**
 * Unified Dune Sim API client (api.sim.dune.com) — realtime multi-chain
 * balances, activity, and token prices by address. Server-only: never expose
 * the API key to a browser bundle.
 *
 * Dune Sim indexes mainnets + major testnets but NOT Arc Testnet (5042002);
 * Arc balances come back empty. Pair with on-chain reads for Arc coverage.
 */
declare class DuneSimClient {
    private readonly apiKey;
    private readonly baseUrl;
    private readonly timeoutMs;
    constructor(opts: DuneSimClientOptions);
    /** GET /v1/evm/balances/{address} — every chain Dune indexes, one call. */
    getBalances(address: string, opts?: DuneBalanceOptions): Promise<DuneBalancesResponse>;
    /** GET /v1/evm/activity/{address} */
    getActivity(address: string, opts?: DuneActivityOptions): Promise<DuneActivityResponse>;
    /** GET /v1/tokens/{chain}/{address}/price/history */
    getTokenPrices(chain: string, tokenAddress: string, opts?: DuneTokenPriceOptions): Promise<DuneTokenPriceResponse>;
    /**
     * Fail-safe balances: missing key behavior is the caller's concern, but any
     * network/API error resolves to [] so dashboards never break on Dune blips.
     */
    getBalancesSafe(address: string, opts?: DuneBalanceOptions): Promise<DuneBalance[]>;
    private request;
}

/** Common network identifiers → Dune Sim API chain names. */
declare const DUNE_CHAIN_MAP: Record<string, string>;
declare function toDuneChain(network: string): string | null;

/** Uniform shape consumed by chart components across BUFI apps. */
interface HistoricalPrice {
    /** YYYY-MM-DD */
    date: string;
    close: number;
    open?: number;
    high?: number;
    low?: number;
    volume?: number;
}
type TimeRange = '1W' | '1M' | '3M' | '6M' | '1Y';
/**
 * Token price history via Dune Sim, normalized to `HistoricalPrice[]`.
 * Errors resolve to the last cached value (or []) — never throws.
 */
declare function getTokenPriceHistory(client: DuneSimClient, duneChain: string, tokenAddress: string, range?: TimeRange): Promise<HistoricalPrice[]>;

interface TvlResult {
    usd: number;
    /** chain_ids that contributed a non-zero priced balance */
    chains: number[];
}
/**
 * Protocol TVL = Σ value_usd of tokens held by the given addresses, across every
 * chain Dune Sim indexes. Fail-safe: unindexed chains and API errors contribute 0
 * rather than throwing, so a TVL widget never breaks on a Dune blip.
 */
declare function tvlUsd(client: DuneSimClient, addresses: string[]): Promise<TvlResult>;

export { DUNE_CHAIN_MAP, type DuneActivity, type DuneActivityOptions, type DuneActivityResponse, type DuneBalance, type DuneBalanceOptions, type DuneBalancesResponse, type DuneHistoricalPrice, DuneSimClient, type DuneSimClientOptions, type DuneTokenMetadata, type DuneTokenPrice, type DuneTokenPriceOptions, type DuneTokenPriceResponse, type HistoricalPrice, type TimeRange, type TvlResult, getTokenPriceHistory, toDuneChain, tvlUsd };
