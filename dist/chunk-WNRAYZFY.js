// src/registry/addresses.ts
var BUFI_ADDRESSES = [
  // ── desk (desk-v1) ────────────────────────────────────────────────────────
  {
    project: "desk",
    address: "0x77777777Dcc4d5A8B6E418Fd04D8997ef11000eE",
    chainId: 0,
    chain: "multi",
    label: "Circle GatewayWallet (shared infra; desk volume = deposits from BUFI depositor EOAs)",
    kind: "infra"
  },
  {
    project: "desk",
    address: "0x16Ca848aB3be9c0D6660783530A23DD569f72823",
    chainId: 137,
    chain: "polygon",
    label: "Circle grant funding wallet",
    kind: "wallet"
  },
  // ── defi (defi-web-app) ───────────────────────────────────────────────────
  {
    project: "defi",
    address: "0x0E63eff212382F2679c3A363F60e00b7A6d6e3E4",
    chainId: 5042002,
    chain: "arc-testnet",
    label: "SharedFxVault (bufxUSDC liquidity)",
    kind: "vault"
  },
  {
    project: "defi",
    address: "0x929e222CBbC154f8e75a8DEF951288886Df70531",
    chainId: 5042002,
    chain: "arc-testnet",
    label: "TurboFeeVault (LP deposits)",
    kind: "vault"
  }
  // ── pasillo (b-in-bufi) ───────────────────────────────────────────────────
  // No static onchain footprint yet — ramp/FX flows report via the ledger
  // metrics path. Add settlement wallets here when they go live.
];
function addressesForProject(project) {
  return BUFI_ADDRESSES.filter((a) => a.project === project);
}
function mergeAddresses(staticList, dynamicList) {
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const entry of [...staticList, ...dynamicList]) {
    const key = `${entry.chainId}:${entry.address.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(entry);
  }
  return out;
}
function addressesToCsv(addresses) {
  const header = "project,address,chain_id,chain,label,kind";
  const lines = addresses.map(
    (a) => [a.project, a.address, a.chainId, a.chain, quote(a.label), a.kind].join(",")
  );
  return [header, ...lines].join("\n");
}
function quote(value) {
  return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

export {
  BUFI_ADDRESSES,
  addressesForProject,
  mergeAddresses,
  addressesToCsv
};
//# sourceMappingURL=chunk-WNRAYZFY.js.map