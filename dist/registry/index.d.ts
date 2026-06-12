import { BufiProject } from '../metrics/index.js';
import 'zod';

type AddressKind = 'protocol' | 'vault' | 'wallet' | 'infra' | 'token';
interface RegisteredAddress {
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
declare const BUFI_ADDRESSES: RegisteredAddress[];
declare function addressesForProject(project: BufiProject): RegisteredAddress[];
/** Merge static registry with runtime-discovered addresses, deduped (lowercase EVM). */
declare function mergeAddresses(staticList: RegisteredAddress[], dynamicList: RegisteredAddress[]): RegisteredAddress[];
/** CSV for uploading the registry as a Dune table (joins in onchain queries). */
declare function addressesToCsv(addresses: RegisteredAddress[]): string;

export { type AddressKind, BUFI_ADDRESSES, type RegisteredAddress, addressesForProject, addressesToCsv, mergeAddresses };
