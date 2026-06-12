import type { DuneSimClient } from './client';

/** Uniform shape consumed by chart components across BUFI apps. */
export interface HistoricalPrice {
  /** YYYY-MM-DD */
  date: string;
  close: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}

export type TimeRange = '1W' | '1M' | '3M' | '6M' | '1Y';

const RANGE_TO_DAYS: Record<TimeRange, number> = {
  '1W': 7,
  '1M': 30,
  '3M': 90,
  '6M': 180,
  '1Y': 365,
};

// 5-min TTL cache keyed by chain:address:range (module-level: shared across calls
// within one server process; serverless instances each keep their own).
const cache = new Map<string, { data: HistoricalPrice[]; at: number }>();
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Token price history via Dune Sim, normalized to `HistoricalPrice[]`.
 * Errors resolve to the last cached value (or []) — never throws.
 */
export async function getTokenPriceHistory(
  client: DuneSimClient,
  duneChain: string,
  tokenAddress: string,
  range: TimeRange = '3M'
): Promise<HistoricalPrice[]> {
  const key = `${duneChain}:${tokenAddress}:${range}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL) return cached.data;

  try {
    const resp = await client.getTokenPrices(duneChain, tokenAddress, {
      days: RANGE_TO_DAYS[range],
    });
    const prices: HistoricalPrice[] = (resp.prices ?? []).map(p => ({
      date: p.timestamp.split('T')[0] ?? p.timestamp,
      close: p.price_usd,
    }));
    cache.set(key, { data: prices, at: Date.now() });
    return prices;
  } catch {
    return cached?.data ?? [];
  }
}
