import type {
  DivergenceMetric,
  DivergenceVerdict,
  HolderProfile,
  PredictionMarket,
} from "@/types/nansen";

/**
 * Holder Credibility Score (0-100).
 * Share of total holder volume controlled by wallets that are older than
 * 14 days AND flagged as smart traders, lightly weighted by their win rate
 * and penalised by burner/sybil presence.
 */
export function calculateHCS(holders: HolderProfile[]): number {
  const totalBalance = holders.reduce((sum, h) => sum + h.balance, 0);
  if (totalBalance <= 0) return 0;

  const credibleVolume = holders
    .filter((h) => h.walletAgeDays > 14 && h.isSmartTrader && !h.isBurner)
    .reduce((sum, h) => sum + h.balance * (0.6 + 0.4 * h.winRate), 0);

  const burnerVolume = holders
    .filter((h) => h.isBurner || h.walletAgeDays <= 14)
    .reduce((sum, h) => sum + h.balance, 0);

  const raw = (credibleVolume / totalBalance) * 100 - (burnerVolume / totalBalance) * 20;
  return Math.round(Math.min(100, Math.max(0, raw)));
}

export function calculateDivergence(
  probYes: number,
  smartMoneyLongRatio: number,
): { divergenceDelta: number; verdict: DivergenceVerdict } {
  const divergenceDelta = probYes * 100 - smartMoneyLongRatio * 100;

  let verdict: DivergenceVerdict = "Neutral / Fairly Priced";
  if (divergenceDelta > 35) {
    verdict = "Extreme Bull Skew (Retail Euphoria / Smart Money Fading)";
  } else if (divergenceDelta < -35) {
    verdict = "Extreme Bear Skew (Hidden Smart Accumulation)";
  }

  return { divergenceDelta: Number(divergenceDelta.toFixed(1)), verdict };
}

export function buildMetric(market: PredictionMarket): DivergenceMetric {
  const { divergenceDelta, verdict } = calculateDivergence(
    market.impliedProbability,
    market.perp.netLongShortRatio,
  );
  return {
    marketSlug: market.slug,
    probabilityYes: market.impliedProbability,
    smartMoneyLongRatio: market.perp.netLongShortRatio,
    divergenceDelta,
    verdict,
    hcsScore: calculateHCS(market.topHolders),
  };
}

export function buildDossier(market: PredictionMarket, metric: DivergenceMetric): string[] {
  const delta = metric.divergenceDelta;
  const abs = Math.abs(delta).toFixed(1);
  const lines: string[] = [];

  lines.push(
    `Polymarket prices "${market.question}" at ${(metric.probabilityYes * 100).toFixed(0)}% YES while Nansen-tracked smart money on Hyperliquid sits ${(metric.smartMoneyLongRatio * 100).toFixed(0)}% long ${market.perp.symbol} — a divergence delta of ${delta > 0 ? "+" : ""}${delta} points.`,
  );

  if (delta > 35) {
    lines.push(
      `Verdict: retail euphoria. Informed flow is actively fading the crowd. Asymmetry favours buying NO / short-side exposure while the spread stays above +35.`,
    );
  } else if (delta < -35) {
    lines.push(
      `Verdict: hidden accumulation. Smart money is positioned materially longer than the prediction market prices. Asymmetry favours buying YES at a ${abs}-point discount to informed positioning.`,
    );
  } else {
    lines.push(
      `Verdict: fairly priced. Crowd odds and informed positioning agree within ${abs} points — no structural edge; wait for the spread to break ±35.`,
    );
  }

  lines.push(
    `Holder Credibility Score is ${metric.hcsScore}/100 (${metric.topHolders_desc ?? ""}${market.topHolders.filter((h) => h.isBurner).length} flagged burner/sybil wallets in the top ${market.topHolders.length}). ${
      metric.hcsScore >= 60
        ? "Book quality is high — treat the implied odds as informative."
        : "Book quality is weak — implied odds are noisy and easily manipulated."
    }`,
  );

  return lines;
}

declare module "@/types/nansen" {
  interface DivergenceMetric {
    topHolders_desc?: string;
  }
}
