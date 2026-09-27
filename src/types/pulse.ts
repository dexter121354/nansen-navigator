export type Horizon = "4h" | "daily";
export type AssetSymbol = "BTC" | "ETH" | "SOL" | "XRP" | "DOGE" | "BNB" | "HYPE";

export interface PerpFill {
  side: "LONG" | "SHORT";
  notionalUsd: number;
  price: number;
  trader: string;
  minutesAgo: number;
}

export interface PerpStream {
  longUsd: number;
  shortUsd: number;
  fills: PerpFill[];
}

export interface DexStream {
  netflowUsd: number; // + = smart money net buying
  buyers: number;
  sellers: number;
}

export interface CexStream {
  inflowUsd: number; // to exchanges (sell pressure)
  outflowUsd: number; // off exchanges (supply shock)
}

export interface PolyMarketOdds {
  upProbability: number; // 0-1
  volumeUsd: number;
  slug: string;
  endDate: string | null;
}

export interface AssetBoard {
  symbol: AssetSymbol;
  name: string;
  poly: PolyMarketOdds;
  perp: PerpStream;
  dex: DexStream;
  cex: CexStream;
  live: { poly: boolean; perp: boolean; dex: boolean; cex: boolean };
}

export type EdgeSignal = "UP" | "DOWN" | "FAIR";

export interface QuantScore {
  perpRatio: number;
  dexStance: number;
  cexRatio: number;
  sbs: number; // 0-1 Smart Bias Score
  edge: number; // percentage points, SBS - Polymarket
  signal: EdgeSignal;
  trackedFlowUsd: number;
}
