import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gauge } from "@/components/terminal/Gauge";
import { Address } from "@/components/terminal/Address";
import { fetchLiveMarket, getMarkets } from "@/services/nansenApi";
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
  const [slug, setSlug] = useState(markets[0]!.slug);
  const fallback = markets.find((m) => m.slug === slug) ?? markets[0]!;
  const liveQ = useQuery({
    queryKey: ["nansen-market", slug],
    queryFn: () => fetchLiveMarket(slug),
    staleTime: 60_000,
    retry: false,
  });
  const market = liveQ.data?.market ?? fallback;
  const isLive = liveQ.data?.live === true;
  const metric = useMemo(() => buildMetric(market), [market]);
  const dossier = useMemo(() => buildDossier(market, metric), [market, metric]);

  const delta = metric.divergenceDelta;
  const deltaColor =
    Math.abs(delta) > 35 ? (delta > 0 ? "var(--neg)" : "var(--pos)") : "var(--muted-foreground)";

  return (
    <div className="min-h-screen font-mono text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b hairline bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-5 py-3">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold tracking-tight text-brand">POLY</span>
            <span className="text-lg font-semibold tracking-tight">DIVERGENCE</span>
          </div>
          <span className="rounded border border-brand/40 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-brand">
            Powered by Nansen API
          </span>
          <div className="ml-auto flex items-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-2 rounded-full border border-pos/20 bg-pos/10 px-2.5 py-1 tracking-wider text-pos">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pos opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-pos" />
              </span>
              NANSEN ORACLE: CONNECTED
            </span>
            <span
              className={`rounded-full border px-2.5 py-1 tracking-wider ${
                isLive ? "border-pos/20 bg-pos/10 text-pos" : "border-warn/20 bg-warn/10 text-warn"
              }`}
            >
              {liveQ.isLoading ? "Syncing…" : isLive ? "Live API Connected" : "Cached Snapshot Active"}
            </span>
            <span className="hidden tabular-nums sm:inline">24h VOL {usd(market.volume24h)}</span>
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
          <p className="eyebrow mt-1">
            Polymarket crowd odds vs. Nansen smart money stance on {market.perp.symbol}
          </p>

          <div className="mt-6 grid items-center gap-5 lg:grid-cols-[1fr_auto_1fr]">
            <Gauge
              label="Polymarket implied"
              sublabel="probability YES"
              value={market.impliedProbability}
              tone="brand"
            />

            <div className="relative flex flex-col items-center gap-2 surface px-6 py-6">
              <div aria-hidden className="pointer-events-none absolute -inset-6 -z-10 rounded-full bg-gradient-to-br from-brand to-pos opacity-15 blur-3xl" />
              <span className="eyebrow">
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
                className={`max-w-[16rem] rounded-full border px-3 py-1 text-center text-[11px] leading-relaxed ${
                  Math.abs(delta) > 35
                    ? delta > 0
                      ? "border-neg/20 bg-neg/10 text-neg"
                      : "border-pos/20 bg-pos/10 text-pos"
                    : "hairline bg-muted/40 text-muted-foreground"
                }`}
              >
                {metric.verdict}
              </span>
              <span className="mt-2 rounded-full border border-brand/20 bg-brand/10 px-2.5 py-0.5 text-[10px] tabular-nums text-brand">
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

          <TabsContent value="holders" className="mt-4 space-y-4 overflow-x-auto">
            <HolderCredibility holders={market.topHolders} />
            <table className="w-full text-xs">
              <thead className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                <tr className="border-b hairline">
                  <th className="px-3 py-1.5 text-left">#</th>
                  <th className="px-3 py-1.5 text-left">Address</th>
                  <th className="px-3 py-1.5 text-right">Position</th>
                  <th className="px-3 py-1.5 text-right">Win rate</th>
                  <th className="px-3 py-1.5 text-right">Wallet age</th>
                  <th className="px-3 py-1.5 text-left">Flags</th>
                </tr>
              </thead>
              <tbody className="divide-hair">
                {market.topHolders.map((h, i) => (
                  <tr key={h.address} className="tabular-nums transition-colors duration-200 hover:bg-foreground/[0.03]">
                    <td className="px-3 py-1.5 text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-1.5">
                      <Address value={h.address} />
                      {h.label && (
                        <span className="ml-2 text-[10px] text-muted-foreground">{h.label}</span>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{usd(h.balance)}</td>
                    <td
                      className="px-3 py-1.5 text-right tabular-nums"
                      style={{ color: h.winRate >= 0.6 ? "var(--pos)" : "var(--muted-foreground)" }}
                    >
                      {(h.winRate * 100).toFixed(0)}%
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-muted-foreground">
                      {h.walletAgeDays}d
                    </td>
                    <td className="space-x-1.5 px-3 py-1.5">
                      {h.isSmartTrader && (
                        <span className="rounded-full border border-pos/20 bg-pos/10 px-1.5 py-0.5 text-[10px] text-pos">
                          SMART
                        </span>
                      )}
                      {h.isBurner && (
                        <span className="rounded-full border border-neg/20 bg-neg/10 px-1.5 py-0.5 text-[10px] text-neg">
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
            <div className="surface space-y-3 p-4">
              <div className="eyebrow">
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
              <div className="flex justify-between text-[11px] tabular-nums">
                <span className="text-pos">
                  LONG {(market.perp.netLongShortRatio * 100).toFixed(0)}%
                </span>
                <span className="text-neg">
                  SHORT {((1 - market.perp.netLongShortRatio) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="pt-2 text-[11px] tabular-nums text-muted-foreground">
                Tracked notional: {usd(market.perp.totalVolumeUsd)}
              </div>
            </div>

            <div className="surface">
              <div className="eyebrow border-b hairline px-4 py-2">
                Recent smart money trades
              </div>
              <ul className="divide-hair">
                {market.perp.recentTrades.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 px-4 py-1.5 text-xs tabular-nums transition-colors duration-200 hover:bg-foreground/[0.03]">
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
                    <span className="ml-auto text-muted-foreground"><Address value={t.trader} /></span>
                    <span className="w-14 text-right text-muted-foreground">{t.minutesAgo}m</span>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="flows" className="mt-4 grid gap-3 sm:grid-cols-3">
            {market.netflows.map((f) => (
              <div key={f.token} className="surface p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{f.token}</span>
                  <span className="eyebrow text-[10px]">{f.window}</span>
                </div>
                <div
                  className="mt-3 text-2xl font-semibold tabular-nums"
                  style={{ color: f.netflowUsd >= 0 ? "var(--pos)" : "var(--neg)" }}
                >
                  {f.netflowUsd >= 0 ? "+" : "-"}
                  {usd(Math.abs(f.netflowUsd))}
                </div>
                <div className="mt-2 text-[11px] tabular-nums text-muted-foreground">
                  {f.buyersSmart} smart buyers · {f.sellersSmart} smart sellers
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>

        {/* Dossier */}
        <section className="panel dossier-grid relative overflow-hidden p-6">
          <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="-rotate-12 select-none text-6xl font-bold tracking-[0.3em] text-foreground/[0.03] sm:text-8xl">
              CLASSIFIED
            </span>
          </div>
          <div className="relative flex flex-wrap items-center gap-3">
            <span className="rounded-sm border border-neg/30 bg-neg/10 px-2 py-0.5 text-[10px] tracking-[0.16em] text-neg">
              [NANSEN MERIDIAN DEEP SCAN // CONFIDENTIAL]
            </span>
            <span className="eyebrow">Actionable intelligence dossier</span>
            <span className="h-px flex-1 bg-border" />
            <span className="text-[10px] tabular-nums text-muted-foreground">
              REF PD-{market.slug.slice(0, 6).toUpperCase()}-{metric.hcsScore}
            </span>
          </div>
          <ol className="relative mt-5 space-y-3 border-l border-brand/30 pl-4 text-sm leading-relaxed text-foreground/90">
            {dossier.map((line, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-[10px] tabular-nums text-brand">{String(i + 1).padStart(2, "0")}</span>
                <p>{line}</p>
              </li>
            ))}
          </ol>
        </section>

        <footer className="pb-8 text-[10px] text-muted-foreground">
          Built for the Nansen Meridian Buildathon · demo dataset · not financial advice.
        </footer>
      </main>
    </div>
  );
}

function HolderCredibility({ holders }: { holders: ReturnType<typeof getMarkets>[number]["topHolders"] }) {
  const smart = holders.filter((h) => h.isSmartTrader || (!h.isBurner && h.balance >= 250_000)).reduce((a, h) => a + h.balance, 0);
  const total = holders.reduce((a, h) => a + h.balance, 0) || 1;
  const bad = total - smart;
  const sp = (smart / total) * 100;
  return (
    <div className="surface p-4">
      <div className="flex items-center justify-between">
        <span className="eyebrow">Holder credibility · conviction split</span>
        <span className="text-[11px] tabular-nums text-muted-foreground">{usd(total)} tracked</span>
      </div>
      <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-muted">
        <div className="bg-pos transition-all duration-700" style={{ width: `${sp}%` }} />
        <div className="bg-neg transition-all duration-700" style={{ width: `${100 - sp}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-[11px] tabular-nums">
        <span className="text-pos">SMART / WHALE {sp.toFixed(0)}% · {usd(smart)}</span>
        <span className="text-neg">UNVERIFIED / BURNER {(100 - sp).toFixed(0)}% · {usd(bad)}</span>
      </div>
    </div>
  );
}
