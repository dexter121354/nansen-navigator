import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gauge } from "@/components/terminal/Gauge";
import { getMarkets } from "@/services/nansenApi";
import { buildDossier, buildMetric } from "@/utils/divergenceEngine";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PolyDivergence — Prediction Market vs Smart Money Terminal" },
      {
        name: "description",
        content:
          "PolyDivergence scores the gap between Polymarket implied odds and Nansen-tracked smart money positioning on Hyperliquid, with holder credibility analysis.",
      },
      { property: "og:title", content: "PolyDivergence — Web3 Intelligence Terminal" },
      {
        property: "og:description",
        content:
          "Divergence Delta Index, Holder Credibility Score, smart money perps and spot netflows in one institutional dark terminal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Terminal,
});

const usd = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(2)}M`
    : n >= 1_000
      ? `$${(n / 1_000).toFixed(1)}K`
      : `$${n.toFixed(0)}`;

function Terminal() {
  const markets = getMarkets();
  const [slug, setSlug] = useState(markets[0].slug);
  const market = markets.find((m) => m.slug === slug)!;
  const metric = useMemo(() => buildMetric(market), [market]);
  const dossier = useMemo(() => buildDossier(market, metric), [market, metric]);

  const delta = metric.divergenceDelta;
  const deltaColor =
    Math.abs(delta) > 35 ? (delta > 0 ? "var(--neg)" : "var(--pos)") : "var(--muted-foreground)";

  return (
    <div className="min-h-screen font-mono text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-5 py-3">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold tracking-tight text-brand">POLY</span>
            <span className="text-lg font-semibold tracking-tight">DIVERGENCE</span>
          </div>
          <span className="rounded border border-brand/40 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-brand">
            Powered by Nansen API
          </span>
          <div className="ml-auto flex items-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="live-dot inline-block h-2 w-2 rounded-full bg-pos" />
              LIVE · streaming
            </span>
            <span className="hidden sm:inline">24h VOL {usd(market.volume24h)}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 px-5 py-6">
        {/* Market selector */}
        <div className="flex flex-wrap gap-2">
          {markets.map((m) => {
            const active = m.slug === slug;
            return (
              <button
                key={m.slug}
                onClick={() => setSlug(m.slug)}
                className={`rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
                  active
                    ? "border-brand/60 bg-brand/10 text-brand"
                    : "border-border text-muted-foreground hover:border-brand/40 hover:text-foreground"
                }`}
              >
                {m.shortName}
              </button>
            );
          })}
        </div>

        {/* Hero comparison */}
        <section className="panel p-6">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{market.question}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Polymarket crowd odds vs. Nansen smart money stance on {market.perp.symbol}
          </p>

          <div className="mt-6 grid items-center gap-5 lg:grid-cols-[1fr_auto_1fr]">
            <Gauge
              label="Polymarket implied"
              sublabel="probability YES"
              value={market.impliedProbability}
              tone="brand"
            />

            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-6 py-6">
              <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Divergence Delta Index
              </span>
              <span
                className="text-5xl font-bold tabular-nums"
                style={{ color: deltaColor }}
              >
                {delta > 0 ? "+" : ""}
                {delta}
              </span>
              <span
                className="max-w-[16rem] text-center text-[11px] leading-relaxed"
                style={{ color: deltaColor }}
              >
                {metric.verdict}
              </span>
              <span className="mt-2 rounded border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                HCS {metric.hcsScore}/100
              </span>
            </div>

            <Gauge
              label="Nansen smart money"
              sublabel={`net long ${market.perp.symbol}`}
              value={market.perp.netLongShortRatio}
              tone="signal"
            />
          </div>
        </section>

        {/* Tabs */}
        <Tabs defaultValue="holders" className="panel p-4">
          <TabsList className="bg-secondary">
            <TabsTrigger value="holders">Top Holders</TabsTrigger>
            <TabsTrigger value="perps">Perp Positioning</TabsTrigger>
            <TabsTrigger value="flows">Spot Netflows</TabsTrigger>
          </TabsList>

          <TabsContent value="holders" className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Address</th>
                  <th className="px-3 py-2 text-right">Position</th>
                  <th className="px-3 py-2 text-right">Win rate</th>
                  <th className="px-3 py-2 text-right">Wallet age</th>
                  <th className="px-3 py-2 text-left">Flags</th>
                </tr>
              </thead>
              <tbody>
                {market.topHolders.map((h, i) => (
                  <tr key={h.address} className="border-b border-border/60 last:border-0">
                    <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2">
                      <span>{h.address}</span>
                      {h.label && (
                        <span className="ml-2 text-[10px] text-muted-foreground">{h.label}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{usd(h.balance)}</td>
                    <td
                      className="px-3 py-2 text-right tabular-nums"
                      style={{ color: h.winRate >= 0.6 ? "var(--pos)" : "var(--muted-foreground)" }}
                    >
                      {(h.winRate * 100).toFixed(0)}%
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                      {h.walletAgeDays}d
                    </td>
                    <td className="space-x-1.5 px-3 py-2">
                      {h.isSmartTrader && (
                        <span className="rounded border border-pos/40 px-1.5 py-0.5 text-[10px] text-pos">
                          SMART
                        </span>
                      )}
                      {h.isBurner && (
                        <span className="rounded border border-neg/40 px-1.5 py-0.5 text-[10px] text-neg">
                          SYBIL / BURNER
                        </span>
                      )}
                      {!h.isSmartTrader && !h.isBurner && (
                        <span className="text-[10px] text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabsContent>

          <TabsContent value="perps" className="mt-4 grid gap-4 lg:grid-cols-[320px_1fr]">
            <div className="space-y-3 rounded-lg border border-border p-4">
              <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {market.perp.symbol} smart money book
              </div>
              <div className="flex h-3 overflow-hidden rounded">
                <div
                  className="bg-pos"
                  style={{ width: `${market.perp.netLongShortRatio * 100}%` }}
                />
                <div
                  className="bg-neg"
                  style={{ width: `${(1 - market.perp.netLongShortRatio) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-pos">
                  LONG {(market.perp.netLongShortRatio * 100).toFixed(0)}%
                </span>
                <span className="text-neg">
                  SHORT {((1 - market.perp.netLongShortRatio) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="pt-2 text-[11px] text-muted-foreground">
                Tracked notional: {usd(market.perp.totalVolumeUsd)}
              </div>
            </div>

            <div className="rounded-lg border border-border">
              <div className="border-b border-border px-4 py-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Recent smart money trades
              </div>
              <ul className="divide-y divide-border/60">
                {market.perp.recentTrades.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 px-4 py-2.5 text-xs">
                    <span
                      className="w-12 font-semibold"
                      style={{ color: t.side === "LONG" ? "var(--pos)" : "var(--neg)" }}
                    >
                      {t.side}
                    </span>
                    <span className="tabular-nums">{usd(t.sizeUsd)}</span>
                    <span className="text-muted-foreground tabular-nums">
                      @ {t.price.toLocaleString()}
                    </span>
                    <span className="ml-auto text-muted-foreground">{t.trader}</span>
                    <span className="w-14 text-right text-muted-foreground">{t.minutesAgo}m</span>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="flows" className="mt-4 grid gap-3 sm:grid-cols-3">
            {market.netflows.map((f) => (
              <div key={f.token} className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{f.token}</span>
                  <span className="text-[10px] text-muted-foreground">{f.window}</span>
                </div>
                <div
                  className="mt-3 text-2xl font-semibold tabular-nums"
                  style={{ color: f.netflowUsd >= 0 ? "var(--pos)" : "var(--neg)" }}
                >
                  {f.netflowUsd >= 0 ? "+" : "-"}
                  {usd(Math.abs(f.netflowUsd))}
                </div>
                <div className="mt-2 text-[11px] text-muted-foreground">
                  {f.buyersSmart} smart buyers · {f.sellersSmart} smart sellers
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>

        {/* Dossier */}
        <section className="panel p-6">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.18em] text-brand">
              Actionable dossier
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-foreground/90">
            {dossier.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </section>

        <footer className="pb-8 text-[10px] text-muted-foreground">
          Built for the Nansen Meridian Buildathon · demo dataset · not financial advice.
        </footer>
      </main>
    </div>
  );
}
