import { ApiError } from "../utils/ApiError.js";

const CATALOG_SIZE = 50;
const CATALOG_CACHE_TTL_MS = 120_000;
const CATALOG_URL = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${CATALOG_SIZE}&page=1&sparkline=false`;

export interface CatalogCoin {
  coingeckoId: string;
  symbol: string;
  name: string;
  priceUsd: number;
}

interface CoinGeckoMarketEntry {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
}

let cache: { data: CatalogCoin[]; fetchedAt: number } | null = null;

async function fetchCatalog(): Promise<CatalogCoin[]> {
  const res = await fetch(CATALOG_URL);
  if (!res.ok) {
    throw new Error(`CoinGecko markets request failed: ${res.status}`);
  }
  const raw = (await res.json()) as CoinGeckoMarketEntry[];
  return raw.map((entry) => ({
    coingeckoId: entry.id,
    symbol: entry.symbol.toUpperCase(),
    name: entry.name,
    priceUsd: entry.current_price,
  }));
}

export async function getCatalog(): Promise<CatalogCoin[]> {
  const isStale = !cache || Date.now() - cache.fetchedAt > CATALOG_CACHE_TTL_MS;
  if (!isStale) {
    return cache!.data;
  }

  try {
    const data = await fetchCatalog();
    cache = { data, fetchedAt: Date.now() };
    return data;
  } catch (err) {
    if (cache) {
      console.warn("[crypto-catalog] refresh failed, serving stale cache:", err);
      return cache.data;
    }
    throw new ApiError(503, "Live market data is temporarily unavailable", "MARKET_DATA_UNAVAILABLE");
  }
}

export async function getPriceUsd(coingeckoId: string): Promise<number> {
  const catalog = await getCatalog();
  const coin = catalog.find((c) => c.coingeckoId === coingeckoId);
  if (!coin) {
    throw new ApiError(502, "Couldn't get a live price for this asset", "PRICE_UNAVAILABLE");
  }
  return coin.priceUsd;
}
