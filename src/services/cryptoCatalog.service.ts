import { ApiError } from "../utils/ApiError.js";

export interface CatalogCoin {
  coingeckoId: string;
  symbol: string;
  name: string;
  priceUsd: number;
}

// Static list of major coins with fixed, approximate USD rates — deliberately not a live
// price feed. An earlier version of this called CoinGecko's public API on every deposit
// submission, which occasionally rate-limits or blocks cloud-hosting IPs (Render included),
// surfacing as a 503 on the deposit endpoint for end users. Everything else in this app is
// already simulated (no real blockchain integration), so a static table is consistent with
// that and removes a third-party dependency from a money-computation code path.
const CATALOG: CatalogCoin[] = [
  { coingeckoId: "bitcoin", symbol: "BTC", name: "Bitcoin", priceUsd: 63000 },
  { coingeckoId: "ethereum", symbol: "ETH", name: "Ethereum", priceUsd: 1900 },
  { coingeckoId: "tether", symbol: "USDT", name: "Tether", priceUsd: 1 },
  { coingeckoId: "binancecoin", symbol: "BNB", name: "BNB", priceUsd: 590 },
  { coingeckoId: "usd-coin", symbol: "USDC", name: "USDC", priceUsd: 1 },
  { coingeckoId: "ripple", symbol: "XRP", name: "XRP", priceUsd: 0.6 },
  { coingeckoId: "solana", symbol: "SOL", name: "Solana", priceUsd: 140 },
  { coingeckoId: "tron", symbol: "TRX", name: "TRON", priceUsd: 0.12 },
  { coingeckoId: "dogecoin", symbol: "DOGE", name: "Dogecoin", priceUsd: 0.15 },
  { coingeckoId: "cardano", symbol: "ADA", name: "Cardano", priceUsd: 0.45 },
  { coingeckoId: "chainlink", symbol: "LINK", name: "Chainlink", priceUsd: 14 },
  { coingeckoId: "stellar", symbol: "XLM", name: "Stellar", priceUsd: 0.11 },
  { coingeckoId: "litecoin", symbol: "LTC", name: "Litecoin", priceUsd: 70 },
  { coingeckoId: "monero", symbol: "XMR", name: "Monero", priceUsd: 160 },
  { coingeckoId: "bitcoin-cash", symbol: "BCH", name: "Bitcoin Cash", priceUsd: 450 },
  { coingeckoId: "dai", symbol: "DAI", name: "Dai", priceUsd: 1 },
  { coingeckoId: "polkadot", symbol: "DOT", name: "Polkadot", priceUsd: 6.5 },
  { coingeckoId: "avalanche-2", symbol: "AVAX", name: "Avalanche", priceUsd: 35 },
  { coingeckoId: "shiba-inu", symbol: "SHIB", name: "Shiba Inu", priceUsd: 0.000018 },
  { coingeckoId: "matic-network", symbol: "MATIC", name: "Polygon", priceUsd: 0.7 },
];

export async function getCatalog(): Promise<CatalogCoin[]> {
  return CATALOG;
}

export async function getPriceUsd(coingeckoId: string): Promise<number> {
  const coin = CATALOG.find((c) => c.coingeckoId === coingeckoId);
  if (!coin) {
    throw new ApiError(400, "Choose a valid crypto asset", "INVALID_ASSET");
  }
  return coin.priceUsd;
}
