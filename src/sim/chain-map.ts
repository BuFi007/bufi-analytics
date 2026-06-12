/** Common network identifiers → Dune Sim API chain names. */
export const DUNE_CHAIN_MAP: Record<string, string> = {
  ethereum: 'ethereum',
  base: 'base',
  optimism: 'optimism',
  arbitrum: 'arbitrum',
  polygon: 'polygon',
  gnosis: 'gnosis',
  solana: 'solana',
  avalanche: 'avalanche',
};

export function toDuneChain(network: string): string | null {
  return DUNE_CHAIN_MAP[network] ?? null;
}
