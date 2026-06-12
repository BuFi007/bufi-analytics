import type { DuneSimClient } from './client';

export interface TvlResult {
  usd: number;
  /** chain_ids that contributed a non-zero priced balance */
  chains: number[];
}

/**
 * Protocol TVL = Σ value_usd of tokens held by the given addresses, across every
 * chain Dune Sim indexes. Fail-safe: unindexed chains and API errors contribute 0
 * rather than throwing, so a TVL widget never breaks on a Dune blip.
 */
export async function tvlUsd(client: DuneSimClient, addresses: string[]): Promise<TvlResult> {
  const all = (await Promise.all(addresses.map(a => client.getBalancesSafe(a)))).flat();
  let usd = 0;
  const chains = new Set<number>();
  for (const b of all) {
    if (b.value_usd && Number.isFinite(b.value_usd)) {
      usd += b.value_usd;
      chains.add(b.chain_id);
    }
  }
  return { usd, chains: [...chains] };
}
