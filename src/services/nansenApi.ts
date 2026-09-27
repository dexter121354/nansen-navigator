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
