import type { AssetBoard, CexStream, DexStream, PerpStream, QuantScore } from "@/types/pulse";

export const WEIGHTS = { perp: 0.5, dex: 0.3, cex: 0.2 } as const;
export const EDGE_THRESHOLD = 15; // percentage points

/** Stream 1: Volume_Long / (Volume_Long + Volume_Short) */
export function perpLongRatio(p: PerpStream): number {
  const tot = p.longUsd + p.shortUsd;
  return tot > 0 ? p.longUsd / tot : 0.5;
}

/**
 * Stream 2: normalized smart money DEX netflow stance (0-1).
 * Buyer/seller wallet balance blended with a tanh-squashed USD netflow so
 * a single whale cannot pin the stance to 0 or 1.
 */
export function dexFlowStance(d: DexStream, scaleUsd = 2_000_000): number {
  const usd = 0.5 + 0.5 * Math.tanh(d.netflowUsd / scaleUsd);
  const wallets = d.buyers + d.sellers;
  if (wallets === 0) return usd;
  const breadth = d.buyers / wallets;
  return 0.6 * usd + 0.4 * breadth;
}

/** Stream 3: CEX_Outflows / (CEX_Inflows + CEX_Outflows) */
export function cexSupplyShock(c: CexStream): number {
  const tot = c.inflowUsd + c.outflowUsd;
  return tot > 0 ? c.outflowUsd / tot : 0.5;
}

export function scoreAsset(a: AssetBoard): QuantScore {
  const perpRatio = perpLongRatio(a.perp);
  const dexStance = dexFlowStance(a.dex);
  const cexRatio = cexSupplyShock(a.cex);
  const sbs = WEIGHTS.perp * perpRatio + WEIGHTS.dex * dexStance + WEIGHTS.cex * cexRatio;
  const edge = Number(((sbs - a.poly.upProbability) * 100).toFixed(1));
  const signal = edge >= EDGE_THRESHOLD ? "UP" : edge <= -EDGE_THRESHOLD ? "DOWN" : "FAIR";
  const trackedFlowUsd =
    a.perp.longUsd + a.perp.shortUsd + Math.abs(a.dex.netflowUsd) + a.cex.inflowUsd + a.cex.outflowUsd;
  return { perpRatio, dexStance, cexRatio, sbs, edge, signal, trackedFlowUsd };
}

export function buildDossier(a: AssetBoard, s: QuantScore, horizonLabel: string): string[] {
  const pct = (n: number) => `${(n * 100).toFixed(0)}%`;
  return [
    `Polymarket retail prices "${a.symbol} Up or Down ${horizonLabel}" at ${pct(a.poly.upProbability)} UP, while Nansen's 3-stream Smart Bias Score reads ${pct(s.sbs)} bullish — an alpha edge of ${s.edge > 0 ? "+" : ""}${s.edge} pts.`,
    `Decomposition: Hyperliquid smart perps ${pct(s.perpRatio)} long (×0.50) · DEX smart netflow stance ${pct(s.dexStance)} (×0.30) · CEX supply shock ${pct(s.cexRatio)} outflow share (×0.20).`,
    s.signal === "UP"
      ? `Deduction: informed capital is materially longer than the crowd. Asymmetry favours buying "UP" at a ${Math.abs(s.edge).toFixed(1)}-pt discount to smart positioning.`
      : s.signal === "DOWN"
        ? `Deduction: the crowd is over-bullish versus informed flow. Asymmetry favours buying "DOWN" while the gap exceeds ${EDGE_THRESHOLD} pts.`
        : `Deduction: crowd odds and smart positioning agree within ±${EDGE_THRESHOLD} pts — fairly priced, no structural edge; stand aside.`,
  ];
}
