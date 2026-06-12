// src/sim/client.ts
var DEFAULT_BASE_URL = "https://api.sim.dune.com";
var DEFAULT_TIMEOUT_MS = 15e3;
var RETRY_ATTEMPTS = 2;
var RETRY_BASE_DELAY_MS = 500;
var DuneSimClient = class {
  apiKey;
  baseUrl;
  timeoutMs;
  constructor(opts) {
    this.apiKey = opts.apiKey;
    this.baseUrl = opts.baseUrl ?? DEFAULT_BASE_URL;
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }
  /** GET /v1/evm/balances/{address} — every chain Dune indexes, one call. */
  async getBalances(address, opts) {
    const params = new URLSearchParams();
    if (opts?.metadata) params.set("metadata", opts.metadata);
    if (opts?.historicalPrices) params.set("historical_prices", opts.historicalPrices);
    if (opts?.excludeSpamTokens) params.set("exclude_spam_tokens", "true");
    return this.request(`/v1/evm/balances/${address}`, params);
  }
  /** GET /v1/evm/activity/{address} */
  async getActivity(address, opts) {
    const params = new URLSearchParams();
    if (opts?.limit) params.set("limit", String(opts.limit));
    if (opts?.offset) params.set("offset", String(opts.offset));
    return this.request(`/v1/evm/activity/${address}`, params);
  }
  /** GET /v1/tokens/{chain}/{address}/price/history */
  async getTokenPrices(chain, tokenAddress, opts) {
    const params = new URLSearchParams();
    if (opts?.days) params.set("days", String(opts.days));
    return this.request(
      `/v1/tokens/${chain}/${tokenAddress}/price/history`,
      params
    );
  }
  /**
   * Fail-safe balances: missing key behavior is the caller's concern, but any
   * network/API error resolves to [] so dashboards never break on Dune blips.
   */
  async getBalancesSafe(address, opts) {
    try {
      const res = await this.getBalances(address, { excludeSpamTokens: true, ...opts });
      return Array.isArray(res?.balances) ? res.balances : [];
    } catch {
      return [];
    }
  }
  async request(path, params) {
    const qs = params.toString();
    const url = `${this.baseUrl}${path}${qs ? `?${qs}` : ""}`;
    let lastError;
    for (let attempt = 0; attempt <= RETRY_ATTEMPTS; attempt++) {
      try {
        const res = await fetch(url, {
          headers: {
            "X-Sim-Api-Key": this.apiKey,
            "Content-Type": "application/json"
          },
          signal: AbortSignal.timeout(this.timeoutMs)
        });
        if (!res.ok) {
          if (res.status >= 400 && res.status < 500 && res.status !== 429) {
            throw new Error(`Dune Sim ${res.status}: ${await res.text()}`);
          }
          throw new RetryableError(`Dune Sim ${res.status}`);
        }
        return await res.json();
      } catch (err) {
        lastError = err;
        const retryable = err instanceof RetryableError || isAbortOrNetworkError(err);
        if (!retryable || attempt === RETRY_ATTEMPTS) throw err;
        await sleep(RETRY_BASE_DELAY_MS * 2 ** attempt);
      }
    }
    throw lastError;
  }
};
var RetryableError = class extends Error {
};
function isAbortOrNetworkError(err) {
  if (!(err instanceof Error)) return false;
  return err.name === "TimeoutError" || err.name === "AbortError" || err.name === "TypeError";
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// src/sim/chain-map.ts
var DUNE_CHAIN_MAP = {
  ethereum: "ethereum",
  base: "base",
  optimism: "optimism",
  arbitrum: "arbitrum",
  polygon: "polygon",
  gnosis: "gnosis",
  solana: "solana",
  avalanche: "avalanche"
};
function toDuneChain(network) {
  return DUNE_CHAIN_MAP[network] ?? null;
}

// src/sim/price-history.ts
var RANGE_TO_DAYS = {
  "1W": 7,
  "1M": 30,
  "3M": 90,
  "6M": 180,
  "1Y": 365
};
var cache = /* @__PURE__ */ new Map();
var CACHE_TTL = 5 * 60 * 1e3;
async function getTokenPriceHistory(client, duneChain, tokenAddress, range = "3M") {
  const key = `${duneChain}:${tokenAddress}:${range}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL) return cached.data;
  try {
    const resp = await client.getTokenPrices(duneChain, tokenAddress, {
      days: RANGE_TO_DAYS[range]
    });
    const prices = (resp.prices ?? []).map((p) => ({
      date: p.timestamp.split("T")[0] ?? p.timestamp,
      close: p.price_usd
    }));
    cache.set(key, { data: prices, at: Date.now() });
    return prices;
  } catch {
    return cached?.data ?? [];
  }
}

// src/sim/tvl.ts
async function tvlUsd(client, addresses) {
  const all = (await Promise.all(addresses.map((a) => client.getBalancesSafe(a)))).flat();
  let usd = 0;
  const chains = /* @__PURE__ */ new Set();
  for (const b of all) {
    if (b.value_usd && Number.isFinite(b.value_usd)) {
      usd += b.value_usd;
      chains.add(b.chain_id);
    }
  }
  return { usd, chains: [...chains] };
}

export {
  DuneSimClient,
  DUNE_CHAIN_MAP,
  toDuneChain,
  getTokenPriceHistory,
  tvlUsd
};
//# sourceMappingURL=chunk-BM5MUAES.js.map