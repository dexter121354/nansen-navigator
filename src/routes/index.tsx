import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { KeyRound, ScanSearch, Zap, CalendarDays } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Ring } from "@/components/terminal/Ring";
import { Address } from "@/components/terminal/Address";
import { fetchBoard } from "@/services/pulseApi";
import { ASSET_META, snapshotBoard } from "@/services/snapshot";
import { buildDossier, scoreAsset } from "@/utils/quantEngine";
import type { AssetBoard, Horizon, QuantScore } from "@/types/pulse";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PolyPulse — 4H & Daily Binary Quant Terminal" },
      {
        name: "description",
        content:
          "PolyPulse compares Polymarket 4-hour and daily crypto Up/Down odds with a 3-stream Nansen Smart Bias Score across perps, DEX and CEX flows.",
      },
      { property: "og:title", content: "PolyPulse — Binary Quant Terminal" },
      {
        property: "og:description",
        content: "Find mispriced Polymarket Up/Down markets using Nansen smart money perps, DEX netflows and CEX supply shocks.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Terminal,
});

const KEY_STORE = "polypulse.nansenKey";

const usd = (n: number, sign = false) => {
  const s = sign && n > 0 ? "+" : n < 0 ? "-" : "";
  const a = Math.abs(n);
  return a >= 1e6 ? `${s}$${(a / 1e6).toFixed(1)}M` : a >= 1e3 ? `${s}$${(a / 1e3).toFixed(1)}K` : `${s}$${a.toFixed(0)}`;
};
const ago = (m: number) => (m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ${m % 60}m ago`);

function Terminal() {
  const [horizon, setHorizon] = useState<Horizon>("4h");
  const [userKey, setUserKey] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [keyOpen, setKeyOpen] = useState(false);

  useEffect(() => {
    setUserKey(localStorage.getItem(KEY_STORE) ?? "");
  }, []);

  const q = useQuery({
    queryKey: ["pulse-board", horizon, userKey],
    queryFn: () => fetchBoard(horizon, userKey),
    staleTime: 60_000,
    refetchInterval: 90_000,
    retry: false,
    placeholderData: keepPreviousData,
  });

  const snapshot = useMemo(() => snapshotBoard(horizon), [horizon]);
  const sameHorizon = q.data && q.data.assets === q.data.assets && q.isPlaceholderData === false;
  const assets = sameHorizon ? q.data!.assets : snapshot;
  const liveStreams = sameHorizon ? q.data!.liveStreams : 0;
  const scored = useMemo(() => assets.map((a) => ({ a, s: scoreAsset(a) })), [assets]);
  const selected = scored.find((x) => x.a.symbol === open);
  const hLabel = horizon === "4h" ? "4h" : "Daily";

  return (
    <div className="min-h-screen font-mono text-foreground">
      <header className="sticky top-0 z-30 border-b hairline bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md border border-brand/30 bg-brand/10">
              <Zap className="h-4 w-4 text-brand" />
            </div>
            <div>
              <div className="text-base font-semibold tracking-tight">
                Poly<span className="text-brand">Pulse</span>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Binary Quant Terminal</div>
            </div>
          </div>
          <span className="rounded border border-brand/20 bg-brand/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-brand">
            Powered by Nansen API
          </span>
          <div className="ml-auto flex items-center gap-3">
            <span className="flex items-center gap-2 text-[11px] uppercase tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pos opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-pos" />
              </span>
              Nansen Oracle: Live
            </span>
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                liveStreams > 0 ? "border-pos/25 bg-pos/10 text-pos" : "border-warn/25 bg-warn/10 text-warn"
              }`}
              title="Live data streams out of 28 (7 assets × Polymarket, Perps, DEX, CEX)"
            >
              {q.isFetching && !sameHorizon ? "Syncing…" : liveStreams > 0 ? `Live ${liveStreams}/28 streams` : "Cached Snapshot Active"}
            </span>
            <button
              type="button"
              onClick={() => setKeyOpen(true)}
              aria-label="Use your own Nansen API key"
              className="grid h-8 w-8 place-items-center rounded-md border hairline text-muted-foreground transition-colors hover:text-foreground"
            >
              <KeyRound className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="inline-flex rounded-lg border hairline bg-card/40 p-1">
            {(
              [
                ["4h", "4 Hours Crypto", Zap],
                ["daily", "Daily Crypto", CalendarDays],
              ] as const
            ).map(([h, label, Icon]) => (
              <button
                key={h}
                type="button"
                onClick={() => setHorizon(h)}
                className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm transition-all ${
                  horizon === h ? "bg-brand/15 text-brand shadow-[inset_0_0_0_1px_var(--brand)]" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
          <p className="eyebrow max-w-md text-right">
            SBS = 0.50·Perp Long Ratio + 0.30·DEX Flow + 0.20·CEX Supply Shock · Edge = SBS − Polymarket
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {scored.map(({ a, s }) => (
            <AssetCard key={a.symbol} a={a} s={s} hLabel={hLabel} onInspect={() => setOpen(a.symbol)} />
          ))}
        </div>
      </main>

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-full overflow-y-auto border-l hairline bg-background font-mono sm:max-w-xl">
          {selected && <Drawer a={selected.a} s={selected.s} hLabel={hLabel} />}
        </SheetContent>
      </Sheet>

      <KeyDialog
        open={keyOpen}
        onOpenChange={setKeyOpen}
        current={userKey}
        onSave={(k) => {
          if (k) localStorage.setItem(KEY_STORE, k);
          else localStorage.removeItem(KEY_STORE);
          setUserKey(k);
        }}
      />
    </div>
  );
}

function EdgeBadge({ s }: { s: QuantScore }) {
  if (s.signal === "FAIR")
    return (
      <span className="rounded border border-white/10 bg-muted/40 px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        Fairly priced ({s.edge > 0 ? "+" : ""}
        {s.edge}%)
      </span>
    );
  const up = s.signal === "UP";
  return (
    <span
      className={`rounded border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${
        up ? "border-pos/25 bg-pos/10 text-pos" : "border-neg/25 bg-neg/10 text-neg"
      }`}
    >
      ⚡ Arb buy "{up ? "UP" : "DOWN"}" ({up ? "+" : ""}
      {s.edge}% edge)
    </span>
  );
}

function AssetCard({ a, s, hLabel, onInspect }: { a: AssetBoard; s: QuantScore; hLabel: string; onInspect: () => void }) {
  const meta = ASSET_META.find((m) => m.symbol === a.symbol)!;
  const liveCount = Object.values(a.live).filter(Boolean).length;
  return (
    <div className="surface flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <div
          className="grid h-9 w-9 place-items-center rounded-full text-xs font-bold"
          style={{ background: `${meta.color}22`, color: meta.color, boxShadow: `inset 0 0 0 1px ${meta.color}55` }}
        >
          {a.symbol.slice(0, 4)}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">
            {a.symbol} Up or Down {hLabel}
          </div>
          <div className="text-[11px] text-muted-foreground">{a.name}</div>
        </div>
        <span
          className={`ml-auto h-1.5 w-1.5 rounded-full ${liveCount ? "bg-pos" : "bg-warn"}`}
          title={`${liveCount}/4 live streams`}
        />
      </div>

      <div className="flex items-center justify-around">
        <div className="flex flex-col items-center gap-1">
          <Ring value={a.poly.upProbability} label="Up" color="var(--brand)" />
          <span className="eyebrow text-[9px]">Polymarket crowd</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Ring value={s.sbs} label="Bullish" color={s.sbs >= 0.5 ? "var(--pos)" : "var(--neg)"} />
          <span className="eyebrow text-[9px]">Nansen smart</span>
        </div>
      </div>

      <div className="flex justify-center">
        <EdgeBadge s={s} />
      </div>

      <div className="rounded border hairline bg-background/40 px-2 py-1.5 text-[10px] leading-snug text-muted-foreground">
        Nansen 3-Stream Flow: <span className="tabular-nums text-foreground">{usd(s.trackedFlowUsd)}</span> tracked across Perps + DEX + CEX
      </div>

      <button
        type="button"
        onClick={onInspect}
        className="flex items-center justify-center gap-2 rounded-md border border-brand/25 bg-brand/10 py-2 text-xs uppercase tracking-wider text-brand transition-colors hover:bg-brand/20"
      >
        <ScanSearch className="h-3.5 w-3.5" /> Inspect onchain proof
      </button>
    </div>
  );
}

function SourceTag({ live }: { live: boolean }) {
  return (
    <span className={`text-[9px] uppercase tracking-wider ${live ? "text-pos" : "text-warn"}`}>
      {live ? "● live" : "● snapshot"}
    </span>
  );
}

function Drawer({ a, s, hLabel }: { a: AssetBoard; s: QuantScore; hLabel: string }) {
  const longPct = s.perpRatio * 100;
  const dossier = buildDossier(a, s, hLabel);
  return (
    <>
      <SheetHeader>
        <SheetTitle className="font-mono">
          {a.symbol} Up or Down {hLabel}
        </SheetTitle>
        <SheetDescription className="font-mono text-xs">
          Polymarket {Math.round(a.poly.upProbability * 100)}% Up · SBS {Math.round(s.sbs * 100)}% · Edge{" "}
          <span className={s.edge >= 0 ? "text-pos" : "text-neg"}>
            {s.edge > 0 ? "+" : ""}
            {s.edge} pts
          </span>
          {a.poly.slug && (
            <>
              {" · "}
              <a className="text-brand underline" href={`https://polymarket.com/event/${a.poly.slug}`} target="_blank" rel="noreferrer">
                View market
              </a>
            </>
          )}
        </SheetDescription>
      </SheetHeader>

      <Tabs defaultValue="perp" className="mt-4 px-4 pb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="perp" className="text-[11px]">Perp Order Flow</TabsTrigger>
          <TabsTrigger value="flows" className="text-[11px]">DEX & CEX</TabsTrigger>
          <TabsTrigger value="dossier" className="text-[11px]">Dossier</TabsTrigger>
        </TabsList>

        <TabsContent value="perp" className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="eyebrow">Hyperliquid smart money · weight 50%</span>
            <SourceTag live={a.live.perp} />
          </div>
          <div>
            <div className="mb-1 flex justify-between text-xs tabular-nums">
              <span className="text-pos">{usd(a.perp.longUsd)} Long</span>
              <span className="text-neg">{usd(a.perp.shortUsd)} Short</span>
            </div>
            <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
              <div className="bg-pos transition-all" style={{ width: `${longPct}%` }} />
              <div className="flex-1 bg-neg" />
            </div>
            <div className="mt-1 text-center text-[11px] text-muted-foreground tabular-nums">
              Perp long ratio {longPct.toFixed(1)}%
            </div>
          </div>
          <table className="w-full text-xs tabular-nums">
            <thead>
              <tr className="border-b hairline text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="py-1.5">Dir</th>
                <th className="text-right">Notional</th>
                <th className="text-right">Price</th>
                <th className="text-right">Trader</th>
                <th className="text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {a.perp.fills.map((f, i) => (
                <tr key={i} className="hover:bg-white/[0.02]">
                  <td className={`py-1.5 ${f.side === "LONG" ? "text-pos" : "text-neg"}`}>{f.side}</td>
                  <td className="text-right">{usd(f.notionalUsd)}</td>
                  <td className="text-right">${f.price.toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
                  <td className="text-right">
                    <Address value={f.trader} />
                  </td>
                  <td className="text-right text-muted-foreground">{ago(f.minutesAgo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TabsContent>

        <TabsContent value="flows" className="space-y-4">
          <div className="surface space-y-2 p-4">
            <div className="flex items-center justify-between">
              <span className="eyebrow">Smart money DEX netflow · weight 30%</span>
              <SourceTag live={a.live.dex} />
            </div>
            <div className={`text-2xl font-semibold tabular-nums ${a.dex.netflowUsd >= 0 ? "text-pos" : "text-neg"}`}>
              {usd(a.dex.netflowUsd, true)}
            </div>
            <div className="text-xs text-muted-foreground tabular-nums">
              {a.dex.buyers} smart buyers · {a.dex.sellers} smart sellers · stance {(s.dexStance * 100).toFixed(1)}%
            </div>
          </div>
          <div className="surface space-y-3 p-4">
            <div className="flex items-center justify-between">
              <span className="eyebrow">CEX reserve flows · weight 20%</span>
              <SourceTag live={a.live.cex} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm tabular-nums">
              <div>
                <div className="text-[10px] uppercase text-muted-foreground">Inflow (sell pressure)</div>
                <div className="text-neg">{usd(a.cex.inflowUsd)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-muted-foreground">Outflow (supply shock)</div>
                <div className="text-pos">{usd(a.cex.outflowUsd)}</div>
              </div>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-muted">
              <div className="bg-pos" style={{ width: `${s.cexRatio * 100}%` }} />
              <div className="flex-1 bg-neg" />
            </div>
            <div className="text-xs text-muted-foreground tabular-nums">Supply shock ratio {(s.cexRatio * 100).toFixed(1)}%</div>
          </div>
        </TabsContent>

        <TabsContent value="dossier">
          <div className="dossier-grid relative overflow-hidden rounded-lg border border-brand/20 p-5">
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-5xl font-bold tracking-widest text-foreground/[0.03] -rotate-12">
              CLASSIFIED
            </div>
            <div className="mb-4 inline-block rounded border border-neg/30 bg-neg/10 px-2 py-0.5 text-[10px] tracking-wider text-neg">
              [NANSEN MERIDIAN DEEP SCAN // CONFIDENTIAL]
            </div>
            <ol className="relative space-y-3 text-xs leading-relaxed">
              {dossier.map((l, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-brand">0{i + 1}</span>
                  <span>{l}</span>
                </li>
              ))}
            </ol>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

function KeyDialog({
  open,
  onOpenChange,
  current,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  current: string;
  onSave: (k: string) => void;
}) {
  const [val, setVal] = useState(current);
  useEffect(() => setVal(current), [current, open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="font-mono">
        <DialogHeader>
          <DialogTitle>Test with your own Nansen key</DialogTitle>
          <DialogDescription>
            Optional. Stored only in this browser and sent to our server just to query Nansen. Leave empty to use the built-in key.
          </DialogDescription>
        </DialogHeader>
        <Input type="password" placeholder="Nansen API key" value={val} onChange={(e) => setVal(e.target.value)} />
        <DialogFooter className="gap-2">
          {current && (
            <Button variant="outline" onClick={() => { onSave(""); onOpenChange(false); }}>
              Clear key
            </Button>
          )}
          <Button onClick={() => { onSave(val.trim()); onOpenChange(false); }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
