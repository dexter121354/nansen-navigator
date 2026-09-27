import type { AssetBoard, AssetSymbol, Horizon, PerpFill } from "@/types/pulse";

export const ASSET_META: { symbol: AssetSymbol; name: string; color: string }[] = [
  { symbol: "BTC", name: "Bitcoin", color: "#f7931a" },
  { symbol: "ETH", name: "Ethereum", color: "#8c8cff" },
  { symbol: "SOL", name: "Solana", color: "#14f195" },
  { symbol: "XRP", name: "Ripple", color: "#9aa4b2" },
  { symbol: "DOGE", name: "Dogecoin", color: "#c2a633" },
  { symbol: "BNB", name: "Binance Coin", color: "#f3ba2f" },
  { symbol: "HYPE", name: "Hyperliquid", color: "#50e3c2" },
];

const PRICE: Record<AssetSymbol, number> = {
  BTC: 94_120,
  ETH: 3_418,
  SOL: 196.4,
  XRP: 2.31,
  DOGE: 0.182,
  BNB: 642,
  HYPE: 38.7,
};

// [polyUp, polyVol, perpLong, perpShort, dexNet, dexBuyers, dexSellers, cexIn, cexOut]
type Row = [number, number, number, number, number, number, number, number, number];
const DATA: Record<Horizon, Record<AssetSymbol, Row>> = {
  "4h": {
    BTC: [0.39, 184_200, 18_400_000, 6_200_000, 3_100_000, 14, 6, 21_000_000, 34_500_000],
    ETH: [0.41, 96_400, 9_800_000, 7_100_000, 1_200_000, 11, 8, 14_200_000, 16_900_000],
    SOL: [0.39, 51_300, 4_900_000, 4_600_000, -400_000, 7, 9, 5_100_000, 5_300_000],
    XRP: [0.26, 22_800, 2_300_000, 1_700_000, 350_000, 6, 4, 3_900_000, 4_600_000],
    DOGE: [0.47, 18_900, 1_100_000, 1_600_000, -600_000, 3, 7, 2_800_000, 2_100_000],
    BNB: [0.43, 12_400, 1_400_000, 1_300_000, 150_000, 5, 5, 3_300_000, 3_200_000],
    HYPE: [0.49, 31_700, 6_700_000, 2_400_000, 2_200_000, 12, 3, 1_900_000, 3_600_000],
  },
  daily: {
    BTC: [0.55, 1_284_000, 42_600_000, 31_900_000, 6_400_000, 22, 11, 88_000_000, 97_000_000],
    ETH: [0.48, 612_000, 17_100_000, 24_300_000, -3_800_000, 9, 17, 41_000_000, 35_200_000],
    SOL: [0.62, 318_000, 12_800_000, 7_900_000, 2_900_000, 16, 7, 12_400_000, 15_800_000],
    XRP: [0.52, 144_000, 4_100_000, 3_900_000, 200_000, 8, 8, 9_700_000, 9_900_000],
    DOGE: [0.53, 97_000, 2_200_000, 3_600_000, -1_100_000, 4, 10, 6_400_000, 4_900_000],
    BNB: [0.63, 71_000, 2_900_000, 3_300_000, -300_000, 6, 7, 7_800_000, 7_100_000],
    HYPE: [0.6, 203_000, 14_200_000, 5_100_000, 4_700_000, 19, 4, 3_900_000, 6_800_000],
  },
};

const TRADERS = [
  "0x4f2a8c1e77d0b93a1f6e2d44c0a9b8e7f3c1c91d",
  "0x9b13e0f4a2c6d8b1e5f7a3c9d0e2b4f6a8c07ae0",
  "0x77ab3d5f9e1c2b4a6d8f0e3c5b7a9d1f2e4cb4c5",
  "0x5c91f2d4b6a8e0c3f5d7b9a1e2c4f6d8b0a3ee2b",
  "0xb612a4c6e8f0d2b4a6c8e0f2d4b6a8c0e2f4ff03",
];

function fills(sym: AssetSymbol, longUsd: number, shortUsd: number, h: Horizon): PerpFill[] {
  const longShare = longUsd / (longUsd + shortUsd);
  const span = h === "4h" ? 240 : 1440;
  return Array.from({ length: 8 }, (_, i) => {
    const side: PerpFill["side"] = ((i * 37) % 100) / 100 < longShare ? "LONG" : "SHORT";
    return {
      side,
      notionalUsd: Math.round(((longUsd + shortUsd) / 14) * (0.4 + ((i * 53) % 90) / 100)),
      price: Number((PRICE[sym] * (1 + (((i * 29) % 11) - 5) / 1000)).toPrecision(6)),
      trader: TRADERS[i % TRADERS.length]!,
      minutesAgo: Math.round((span / 9) * i + 1),
    };
  });
}

export function snapshotBoard(h: Horizon): AssetBoard[] {
  return ASSET_META.map(({ symbol, name }) => {
    const [up, vol, pl, ps, dn, db, ds, ci, co] = DATA[h][symbol];
    return {
      symbol,
      name,
      poly: { upProbability: up, volumeUsd: vol, slug: "", endDate: null },
      perp: { longUsd: pl, shortUsd: ps, fills: fills(symbol, pl, ps, h) },
      dex: { netflowUsd: dn, buyers: db, sellers: ds },
      cex: { inflowUsd: ci, outflowUsd: co },
      live: { poly: false, perp: false, dex: false, cex: false },
    };
  });
}
