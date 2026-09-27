export interface HolderProfile {
  address: string;
  label?: string | undefined;
  balance: number;
  winRate: number; // 0-1
  walletAgeDays: number;
  isSmartTrader: boolean;
  isBurner: boolean;
}

export interface PerpTrade {
  id: string;
  side: "LONG" | "SHORT";
  sizeUsd: number;
  price: number;
  trader: string;
  minutesAgo: number;
}

export interface SmartMoneyPerp {
  symbol: string;
  netLongShortRatio: number; // 0-1 share of smart money notional that is long
  totalVolumeUsd: number;
  recentTrades: PerpTrade[];
}

export interface DexNetflow {
  token: string;
  netflowUsd: number;
  buyersSmart: number;
  sellersSmart: number;
  window: string;
}

export interface PredictionMarket {
  slug: string;
  question: string;
  shortName: string;
  impliedProbability: number; // 0-1 YES
  volume24h: number;
  topHolders: HolderProfile[];
  perp: SmartMoneyPerp;
  netflows: DexNetflow[];
}

export type DivergenceVerdict =
  | "Extreme Bull Skew (Retail Euphoria / Smart Money Fading)"
  | "Extreme Bear Skew (Hidden Smart Accumulation)"
  | "Neutral / Fairly Priced";

export interface DivergenceMetric {
  marketSlug: string;
  probabilityYes: number;
  smartMoneyLongRatio: number;
  divergenceDelta: number;
  verdict: DivergenceVerdict;
  hcsScore: number;
}
