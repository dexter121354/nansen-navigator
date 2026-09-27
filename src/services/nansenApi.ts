import { nansenProxy } from "@/lib/nansen.functions";
import type { HolderProfile, PerpTrade, PredictionMarket } from "@/types/nansen";

const addr = (a: string) => a;

function holders(
  rows: Array<[string, string | undefined, number, number, number, boolean, boolean]>,
): HolderProfile[] {
  return rows.map(([address, label, balance, winRate, walletAgeDays, isSmartTrader, isBurner]) => ({
    address: addr(address),
    label,
    balance,
    winRate,
    walletAgeDays,
    isSmartTrader,
    isBurner,
  }));
}

function trades(
  symbol: string,
  rows: Array<[PerpTrade["side"], number, number, string, number]>,
): PerpTrade[] {
  return rows.map(([side, sizeUsd, price, trader, minutesAgo], i) => ({
    id: `${symbol}-${i}`,
    side,
    sizeUsd,
    price,
    trader,
    minutesAgo,
  }));
}

const RAW_MARKETS = [
  {
    slug: "eth-4000-q4",
    shortName: "ETH $4K",
    question: "ETH breaks $4,000 in Q4",
    impliedProbability: 0.74,
    volume24h: 4_812_400,
    topHolders: holders([
      ["0x4f2a...c91d", "Smart Trader", 412_000, 0.71, 412, true, false],
      ["0x9b13...7ae0", "Fund: Wintermute", 288_500, 0.64, 903, true, false],
      ["0xd0c8...31f2", undefined, 194_200, 0.38, 9, false, true],
      ["0x77ab...b4c5", "Smart Trader", 151_800, 0.69, 238, true, false],
      ["0x21ef...0a77", undefined, 122_400, 0.41, 6, false, true],
      ["0xaa30...9d18", "Whale", 98_700, 0.55, 187, false, false],
      ["0x5c91...ee2b", "Smart Trader", 74_300, 0.77, 611, true, false],
      ["0xf7d2...4406", undefined, 61_050, 0.33, 4, false, true],
      ["0x3e88...12bd", undefined, 47_900, 0.49, 76, false, false],
      ["0xb612...ff03", "Smart Trader", 39_400, 0.66, 344, true, false],
    ]),
    perp: {
      symbol: "ETH-PERP",
      netLongShortRatio: 0.28,
      totalVolumeUsd: 218_400_000,
      recentTrades: trades("ETH", [
        ["SHORT", 4_200_000, 3418.2, "0x9b13...7ae0", 3],
        ["SHORT", 2_850_000, 3421.9, "0x4f2a...c91d", 11],
        ["LONG", 980_000, 3409.4, "0xaa30...9d18", 24],
        ["SHORT", 1_740_000, 3425.1, "0x5c91...ee2b", 38],
        ["SHORT", 3_110_000, 3430.7, "0xb612...ff03", 57],
      ]),
    },
    netflows: [
      { token: "ETH", netflowUsd: -18_400_000, buyersSmart: 6, sellersSmart: 19, window: "24h" },
      { token: "WSTETH", netflowUsd: -4_100_000, buyersSmart: 3, sellersSmart: 9, window: "24h" },
      { token: "USDC", netflowUsd: 22_900_000, buyersSmart: 21, sellersSmart: 4, window: "24h" },
    ],
  },
  {
    slug: "sol-flips-bnb",
    shortName: "SOL > BNB",
    question: "Solana flips BNB Market Cap",
    impliedProbability: 0.42,
    volume24h: 2_140_900,
    topHolders: holders([
      ["0x8d41...aa19", "Fund: Jump", 331_000, 0.73, 1120, true, false],
      ["0x2c77...5bd4", "Smart Trader", 226_500, 0.68, 502, true, false],
      ["0x61ba...e772", "Smart Trader", 188_300, 0.62, 288, true, false],
      ["0x0f39...c104", undefined, 96_400, 0.44, 11, false, true],
      ["0xc4e0...7731", "Whale", 88_100, 0.58, 240, false, false],
      ["0x93fd...20ac", "Smart Trader", 71_900, 0.7, 410, true, false],
      ["0x1a56...db88", undefined, 55_600, 0.47, 130, false, false],
      ["0x7e02...9f61", "Smart Trader", 44_200, 0.65, 355, true, false],
      ["0xab77...3c50", undefined, 31_800, 0.36, 8, false, true],
      ["0x5520...e9d7", undefined, 24_500, 0.51, 95, false, false],
    ]),
    perp: {
      symbol: "SOL-PERP",
      netLongShortRatio: 0.61,
      totalVolumeUsd: 134_700_000,
      recentTrades: trades("SOL", [
        ["LONG", 2_600_000, 196.4, "0x8d41...aa19", 2],
        ["LONG", 1_410_000, 195.8, "0x2c77...5bd4", 9],
        ["SHORT", 640_000, 197.1, "0x1a56...db88", 21],
        ["LONG", 1_980_000, 194.9, "0x61ba...e772", 44],
        ["LONG", 870_000, 196.0, "0x93fd...20ac", 66],
      ]),
    },
    netflows: [
      { token: "SOL", netflowUsd: 12_600_000, buyersSmart: 17, sellersSmart: 5, window: "24h" },
      { token: "JITOSOL", netflowUsd: 3_400_000, buyersSmart: 8, sellersSmart: 2, window: "24h" },
      { token: "BNB", netflowUsd: -2_150_000, buyersSmart: 2, sellersSmart: 7, window: "24h" },
    ],
  },
  {
    slug: "fed-cuts-50bps",
    shortName: "Fed 50bps",
    question: "Fed cuts rates by 50bps",
    impliedProbability: 0.31,
    volume24h: 6_305_200,
    topHolders: holders([
      ["0x44c1...9812", "Fund: Cumberland", 402_700, 0.69, 1401, true, false],
      ["0xe910...aa4f", "Smart Trader", 275_300, 0.72, 733, true, false],
      ["0x7b60...c003", "Smart Trader", 198_900, 0.6, 291, true, false],
      ["0x1dd4...5f27", "Whale", 143_200, 0.54, 188, false, false],
      ["0x0ab9...771e", undefined, 110_400, 0.4, 13, false, true],
      ["0x66f2...30ba", "Smart Trader", 87_600, 0.75, 968, true, false],
      ["0xd371...bb45", undefined, 64_100, 0.5, 210, false, false],
      ["0x2f88...1c69", "Smart Trader", 52_300, 0.63, 319, true, false],
      ["0xc002...e8d1", undefined, 38_800, 0.45, 57, false, false],
      ["0x9ae7...4432", undefined, 27_100, 0.34, 5, false, true],
    ]),
    perp: {
      symbol: "BTC-PERP",
      netLongShortRatio: 0.72,
      totalVolumeUsd: 402_800_000,
      recentTrades: trades("FED", [
        ["LONG", 6_100_000, 94_210, "0x44c1...9812", 4],
        ["LONG", 3_750_000, 94_080, "0xe910...aa4f", 14],
        ["LONG", 2_480_000, 93_940, "0x66f2...30ba", 29],
        ["SHORT", 1_120_000, 94_330, "0xd371...bb45", 48],
        ["LONG", 4_010_000, 93_870, "0x7b60...c003", 71],
      ]),
    },
    netflows: [
      { token: "BTC", netflowUsd: 31_800_000, buyersSmart: 24, sellersSmart: 6, window: "24h" },
      { token: "ETH", netflowUsd: 9_450_000, buyersSmart: 14, sellersSmart: 8, window: "24h" },
      { token: "USDT", netflowUsd: -28_200_000, buyersSmart: 5, sellersSmart: 22, window: "24h" },
    ],
  },
  {
    slug: "btc-100k",
    shortName: "BTC $100K",
    question: "Bitcoin reaches $100K",
    impliedProbability: 0.58,
    volume24h: 9_740_300,
    topHolders: holders([
      ["0xfe31...0a12", "Fund: GSR", 688_400, 0.7, 1560, true, false],
      ["0x03bd...77e9", "Smart Trader", 421_100, 0.74, 845, true, false],
      ["0x5d19...cc30", "Smart Trader", 302_600, 0.66, 470, true, false],
      ["0x8812...b0f5", "Whale", 221_000, 0.57, 299, false, false],
      ["0xa4e6...92d3", "Smart Trader", 164_700, 0.68, 388, true, false],
      ["0x7700...41ab", undefined, 121_300, 0.42, 12, false, true],
      ["0x2b95...de07", undefined, 93_800, 0.52, 143, false, false],
      ["0xc518...6e2c", "Smart Trader", 77_500, 0.71, 622, true, false],
      ["0x1f40...a8b6", undefined, 54_900, 0.39, 7, false, true],
      ["0x6cd3...3300", undefined, 41_200, 0.48, 88, false, false],
    ]),
    perp: {
      symbol: "BTC-PERP",
      netLongShortRatio: 0.66,
      totalVolumeUsd: 512_300_000,
      recentTrades: trades("BTC", [
        ["LONG", 8_400_000, 94_120, "0xfe31...0a12", 1],
        ["LONG", 5_220_000, 94_005, "0x03bd...77e9", 8],
        ["SHORT", 2_010_000, 94_400, "0x2b95...de07", 19],
        ["LONG", 3_880_000, 93_780, "0x5d19...cc30", 35],
        ["LONG", 2_640_000, 93_910, "0xa4e6...92d3", 62],
      ]),
    },
    netflows: [
      { token: "WBTC", netflowUsd: 26_400_000, buyersSmart: 20, sellersSmart: 7, window: "24h" },
      { token: "CBBTC", netflowUsd: 7_900_000, buyersSmart: 11, sellersSmart: 3, window: "24h" },
      { token: "USDC", netflowUsd: -19_300_000, buyersSmart: 6, sellersSmart: 18, window: "24h" },
    ],
  },
];

export const MARKETS: PredictionMarket[] = RAW_MARKETS;

export function getMarkets(): PredictionMarket[] {
  return MARKETS;
}

export function getMarket(slug: string): PredictionMarket {
  return MARKETS.find((m) => m.slug === slug) ?? (MARKETS[0] as PredictionMarket);
}

// ---------------- Live layer with graceful degradation ----------------

type Row = Record<string, unknown>;
const rows = (d: unknown): Row[] => {
  if (Array.isArray(d)) return d as Row[];
  if (d && typeof d === "object") {
    const o = d as Row;
    for (const k of ["data", "results", "items"]) if (Array.isArray(o[k])) return o[k] as Row[];
  }
  return [];
};
const num = (r: Row, ...keys: string[]) => {
  for (const k of keys) {
    const v = Number(r[k]);
    if (Number.isFinite(v)) return v;
  }
  return undefined;
};
const str = (r: Row, ...keys: string[]) => {
  for (const k of keys) if (typeof r[k] === "string" && r[k]) return r[k] as string;
  return undefined;
};

async function call(endpoint: string, body: unknown): Promise<Row[] | null> {
  try {
    const res = await nansenProxy({ data: { endpoint, body } });
    if (!res.ok) return null;
    const list = rows(JSON.parse(res.json));
    return list.length ? list : null;
  } catch {
    return null;
  }
}

export interface LiveMarketResult {
  market: PredictionMarket;
  live: boolean;
}

/** Fetch live Nansen data for a market; any failure falls back to the mock snapshot. */
export async function fetchLiveMarket(slug: string): Promise<LiveMarketResult> {
  const mock = getMarket(slug);
  try {
    const token = mock.perp.symbol.replace("-PERP", "");
    const [screener, holdersRes, perps, flows] = await Promise.all([
      call("prediction-market/market-screener", { search: mock.question, pagination: { page: 1, per_page: 5 } }),
      call("prediction-market/top-holders", { market_slug: mock.slug, pagination: { page: 1, per_page: 10 } }),
      call("smart-money/perp-trades", { filters: { token_symbol: token }, pagination: { page: 1, per_page: 100 } }),
      call("smart-money/netflow", { chains: ["ethereum", "solana", "base"], pagination: { page: 1, per_page: 3 } }),
    ]);
    if (!screener && !holdersRes && !perps && !flows) return { market: mock, live: false };

    const m: PredictionMarket = { ...mock, perp: { ...mock.perp }, topHolders: mock.topHolders, netflows: mock.netflows };
    const s = screener?.[0];
    if (s) {
      const p = num(s, "yes_price", "implied_probability", "probability", "price");
      if (p !== undefined && p >= 0 && p <= 1) m.impliedProbability = p;
      m.volume24h = num(s, "volume_24h", "volume24h", "volume") ?? m.volume24h;
    }
    if (holdersRes) {
      m.topHolders = holdersRes.slice(0, 10).map((h) => {
        const age = num(h, "wallet_age_days", "walletAgeDays") ?? 0;
        const label = str(h, "label", "address_label");
        return {
          address: str(h, "address", "wallet_address") ?? "0x0",
          label,
          balance: num(h, "position_usd", "value_usd", "balance") ?? 0,
          winRate: num(h, "win_rate", "winRate") ?? 0.5,
          walletAgeDays: age,
          isSmartTrader: /smart|fund/i.test(label ?? ""),
          isBurner: age > 0 && age < 14,
        };
      });
    }
    if (perps) {
      const matching = perps.filter((t) => {
        const sym = str(t, "token_symbol", "symbol", "coin");
        return !sym || sym.toUpperCase().replace(/-PERP$/, "") === token;
      });
      const trades: PerpTrade[] = matching.map((t, i) => ({
        id: `live-${i}`,
        side: /short|sell/i.test(str(t, "side", "action", "type") ?? "") ? "SHORT" : "LONG",
        sizeUsd: num(t, "value_usd", "size_usd", "notional_usd") ?? 0,
        price: num(t, "price", "price_usd") ?? 0,
        trader: str(t, "trader_address", "address") ?? "0x0",
        minutesAgo: (() => {
          const ts = str(t, "block_timestamp", "timestamp");
          return ts ? Math.max(0, Math.round((Date.now() - Date.parse(ts)) / 60000)) : 0;
        })(),
      }));
      const longV = trades.filter((t) => t.side === "LONG").reduce((a, t) => a + t.sizeUsd, 0);
      const totV = trades.reduce((a, t) => a + t.sizeUsd, 0);
      if (trades.length) m.perp.recentTrades = trades.slice(0, 5);
      // Only trust the live long/short split with a meaningful sample; tiny samples swing to 0% or 100%.
      const longs = trades.filter((t) => t.side === "LONG").length;
      if (trades.length >= 10 && totV > 0 && longs > 0 && longs < trades.length) {
        m.perp.netLongShortRatio = longV / totV;
      }
    }
    if (flows) {
      m.netflows = flows.slice(0, 3).map((f) => ({
        token: str(f, "token_symbol", "symbol") ?? "?",
        netflowUsd: num(f, "net_flow_24h_usd", "netflow_usd", "net_flow_usd") ?? 0,
        buyersSmart: num(f, "buyers", "buyer_count") ?? 0,
        sellersSmart: num(f, "sellers", "seller_count") ?? 0,
        window: "24h",
      }));
    }
    return { market: m, live: true };
  } catch {
    return { market: mock, live: false };
  }
}
