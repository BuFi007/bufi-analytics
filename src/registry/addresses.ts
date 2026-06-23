import type { BufiProject } from '../metrics/schema';

export type AddressKind = 'protocol' | 'vault' | 'wallet' | 'infra' | 'token';

export interface RegisteredAddress {
  project: BufiProject;
  /** EVM 0x… or Solana base58 */
  address: string;
  /** EIP-155 chain id; 0 for Solana */
  chainId: number;
  /** Human chain slug, matches metrics `chain` column */
  chain: string;
  label: string;
  kind: AddressKind;
}

/**
 * Static, code-reviewed address registry. Dynamic addresses (e.g. desk's
 * per-team gateway depositor EOAs) are NOT listed here — apps export those at
 * runtime and merge via `mergeAddresses`.
 */
export const BUFI_ADDRESSES: RegisteredAddress[] = [
  // ── desk (desk-v1) ────────────────────────────────────────────────────────
  {
    project: 'desk',
    address: '0x77777777Dcc4d5A8B6E418Fd04D8997ef11000eE',
    chainId: 0,
    chain: 'multi',
    label: 'Circle GatewayWallet (shared infra; desk volume = deposits from BUFI depositor EOAs)',
    kind: 'infra',
  },
  {
    project: 'desk',
    address: '0x16Ca848aB3be9c0D6660783530A23DD569f72823',
    chainId: 137,
    chain: 'polygon',
    label: 'Circle grant funding wallet',
    kind: 'wallet',
  },
  // ── defi (defi-web-app) ───────────────────────────────────────────────────
  {
    project: 'defi',
    address: '0x0E63eff212382F2679c3A363F60e00b7A6d6e3E4',
    chainId: 5042002,
    chain: 'arc-testnet',
    label: 'SharedFxVault (bufxUSDC liquidity)',
    kind: 'vault',
  },
  {
    project: 'defi',
    address: '0x929e222CBbC154f8e75a8DEF951288886Df70531',
    chainId: 5042002,
    chain: 'arc-testnet',
    label: 'TurboFeeVault (LP deposits)',
    kind: 'vault',
  },
  // defi — Avalanche mainnet launch (Kawaii Punks NFT, live 2026-06-23). Dune
  // indexes Avalanche C-Chain, so these light up the public dashboard's mainnet
  // footprint. Mint proceeds settle to the Safe treasury.
  {
    project: 'defi',
    address: '0x3ce4f5fde5c8aae5b4b10f6b647fdcca1349cd4f',
    chainId: 43114,
    chain: 'avalanche_c',
    label: 'KawaiiPunks ERC-1155 (NFT collection, Circle SCP)',
    kind: 'protocol',
  },
  {
    project: 'defi',
    address: '0x1946cf2ca2218217115241be3b4a1ac403eab98f',
    chainId: 43114,
    chain: 'avalanche_c',
    label: 'KawaiiPunks CurveMinter (bonding-curve mint, $0.05→$690.42)',
    kind: 'protocol',
  },
  {
    project: 'defi',
    address: '0xA3a40fa2d82C0224c40b1Ed7E07cb474B7D1468B',
    chainId: 43114,
    chain: 'avalanche_c',
    label: 'Prod Safe treasury (mint proceeds + protocol owner; Avalanche + Arc)',
    kind: 'wallet',
  },
  // ── pasillo (b-in-bufi) ───────────────────────────────────────────────────
  // No static onchain footprint yet — ramp/FX flows report via the ledger
  // metrics path. Add settlement wallets here when they go live.
];

export function addressesForProject(project: BufiProject): RegisteredAddress[] {
  return BUFI_ADDRESSES.filter(a => a.project === project);
}

/** Merge static registry with runtime-discovered addresses, deduped (lowercase EVM). */
export function mergeAddresses(
  staticList: RegisteredAddress[],
  dynamicList: RegisteredAddress[]
): RegisteredAddress[] {
  const seen = new Set<string>();
  const out: RegisteredAddress[] = [];
  for (const entry of [...staticList, ...dynamicList]) {
    const key = `${entry.chainId}:${entry.address.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(entry);
  }
  return out;
}

/** CSV for uploading the registry as a Dune table (joins in onchain queries). */
export function addressesToCsv(addresses: RegisteredAddress[]): string {
  const header = 'project,address,chain_id,chain,label,kind';
  const lines = addresses.map(a =>
    [a.project, a.address, a.chainId, a.chain, quote(a.label), a.kind].join(',')
  );
  return [header, ...lines].join('\n');
}

function quote(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}
