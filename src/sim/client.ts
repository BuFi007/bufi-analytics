import type {
  DuneActivityOptions,
  DuneActivityResponse,
  DuneBalance,
  DuneBalanceOptions,
  DuneBalancesResponse,
  DuneTokenPriceOptions,
  DuneTokenPriceResponse,
} from './types';

const DEFAULT_BASE_URL = 'https://api.sim.dune.com';
const DEFAULT_TIMEOUT_MS = 15_000;
const RETRY_ATTEMPTS = 2;
const RETRY_BASE_DELAY_MS = 500;

export interface DuneSimClientOptions {
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
export class DuneSimClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(opts: DuneSimClientOptions) {
    this.apiKey = opts.apiKey;
    this.baseUrl = opts.baseUrl ?? DEFAULT_BASE_URL;
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  /** GET /v1/evm/balances/{address} — every chain Dune indexes, one call. */
  async getBalances(address: string, opts?: DuneBalanceOptions): Promise<DuneBalancesResponse> {
    const params = new URLSearchParams();
    if (opts?.metadata) params.set('metadata', opts.metadata);
    if (opts?.historicalPrices) params.set('historical_prices', opts.historicalPrices);
    if (opts?.excludeSpamTokens) params.set('exclude_spam_tokens', 'true');
    return this.request<DuneBalancesResponse>(`/v1/evm/balances/${address}`, params);
  }

  /** GET /v1/evm/activity/{address} */
  async getActivity(address: string, opts?: DuneActivityOptions): Promise<DuneActivityResponse> {
    const params = new URLSearchParams();
    if (opts?.limit) params.set('limit', String(opts.limit));
    if (opts?.offset) params.set('offset', String(opts.offset));
    return this.request<DuneActivityResponse>(`/v1/evm/activity/${address}`, params);
  }

  /** GET /v1/tokens/{chain}/{address}/price/history */
  async getTokenPrices(
    chain: string,
    tokenAddress: string,
    opts?: DuneTokenPriceOptions
  ): Promise<DuneTokenPriceResponse> {
    const params = new URLSearchParams();
    if (opts?.days) params.set('days', String(opts.days));
    return this.request<DuneTokenPriceResponse>(
      `/v1/tokens/${chain}/${tokenAddress}/price/history`,
      params
    );
  }

  /**
   * Fail-safe balances: missing key behavior is the caller's concern, but any
   * network/API error resolves to [] so dashboards never break on Dune blips.
   */
  async getBalancesSafe(address: string, opts?: DuneBalanceOptions): Promise<DuneBalance[]> {
    try {
      const res = await this.getBalances(address, { excludeSpamTokens: true, ...opts });
      return Array.isArray(res?.balances) ? res.balances : [];
    } catch {
      return [];
    }
  }

  private async request<T>(path: string, params: URLSearchParams): Promise<T> {
    const qs = params.toString();
    const url = `${this.baseUrl}${path}${qs ? `?${qs}` : ''}`;
    let lastError: unknown;

    for (let attempt = 0; attempt <= RETRY_ATTEMPTS; attempt++) {
      try {
        const res = await fetch(url, {
          headers: {
            'X-Sim-Api-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(this.timeoutMs),
        });
        if (!res.ok) {
          // 4xx (except 429) won't get better on retry
          if (res.status >= 400 && res.status < 500 && res.status !== 429) {
            throw new Error(`Dune Sim ${res.status}: ${await res.text()}`);
          }
          throw new RetryableError(`Dune Sim ${res.status}`);
        }
        return (await res.json()) as T;
      } catch (err) {
        lastError = err;
        const retryable = err instanceof RetryableError || isAbortOrNetworkError(err);
        if (!retryable || attempt === RETRY_ATTEMPTS) throw err;
        await sleep(RETRY_BASE_DELAY_MS * 2 ** attempt);
      }
    }
    throw lastError;
  }
}

class RetryableError extends Error {}

function isAbortOrNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return err.name === 'TimeoutError' || err.name === 'AbortError' || err.name === 'TypeError';
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
