import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { AssetSymbol, CexStream, DexStream, PerpFill, PerpStream, PolyMarketOdds } from "@/types/pulse";

const TIMEOUT_MS = 2500;

interface AssetCfg {
  sym: AssetSymbol;
  dailySlug: string; // prefix used in Polymarket daily slugs
  fourSlug: string; // prefix used in Polymarket 4h slugs
  dexSymbols: string[];
  cex?: { chain: string; token: string };
}

const ASSETS: AssetCfg[] = [
  { sym: "BTC", dailySlug: "bitcoin", fourSlug: "btc", dexSymbols: ["WBTC", "CBBTC", "BTCB", "TBTC", "BTC"], cex: { chain: "ethereum", token: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599" } },
  { sym: "ETH", dailySlug: "ethereum", fourSlug: "eth", dexSymbols: ["ETH", "WETH"], cex: { chain: "ethereum", token: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2" } },
  { sym: "SOL", dailySlug: "solana", fourSlug: "sol", dexSymbols: ["SOL", "WSOL"], cex: { chain: "solana", token: "So11111111111111111111111111111111111111112" } },
  { sym: "XRP", dailySlug: "xrp", fourSlug: "xrp", dexSymbols: ["XRP"], cex: { chain: "bnb", token: "0x1d2f0da169ceb9fc7b3144628db156f3f6c60dbe" } },
  { sym: "DOGE", dailySlug: "dogecoin", fourSlug: "doge", dexSymbols: ["DOGE"], cex: { chain: "bnb", token: "0xba2ae424d960c26247dd6c32edc70b295c744c43" } },
  { sym: "BNB", dailySlug: "bnb", fourSlug: "bnb", dexSymbols: ["BNB", "WBNB"], cex: { chain: "bnb", token: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c" } },
  { sym: "HYPE", dailySlug: "hype", fourSlug: "hype", dexSymbols: ["HYPE", "WHYPE"] },
];

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

type Row = Record<string, unknown>;
const num = (r: Row, ...keys: string[]) => {
  for (const k of keys) {
    const v = Number(r[k]);
    if (r[k] !== null && r[k] !== undefined && Number.isFinite(v)) return v;
  }
  return undefined;
};
const str = (r: Row, ...keys: string[]) => {
  for (const k of keys) if (typeof r[k] === "string" && r[k]) return r[k] as string;
  return undefined;
};
const rows = (d: unknown): Row[] => {
  if (Array.isArray(d)) return d as Row[];
  if (d && typeof d === "object") {
    const o = d as Row;
    for (const k of ["data", "results", "items"]) if (Array.isArray(o[k])) return o[k] as Row[];
    return [o];
  }
  return [];
};

// ---------------- Polymarket (public Gamma API, no key required) ----------------

function polySlugs(cfg: AssetCfg, horizon: "4h" | "daily", now: Date): string[] {
  if (horizon === "4h") {
    const start = Math.floor(now.getTime() / 1000 / 14400) * 14400;
    return [`${cfg.fourSlug}-updown-4h-${start}`, `${cfg.fourSlug}-updown-4h-${start + 14400}`];
  }
  // Daily markets resolve at 16:00 UTC (noon ET) on the named date.
  const d = new Date(now);
  if (d.getUTCHours() >= 16) d.setUTCDate(d.getUTCDate() + 1);
  const next = new Date(d);
  next.setUTCDate(next.getUTCDate() + 1);
  const s = (x: Date) => `${cfg.dailySlug}-up-or-down-on-${MONTHS[x.getUTCMonth()]}-${x.getUTCDate()}-${x.getUTCFullYear()}`;
  return [s(d), s(next)];
}

async function fetchPoly(cfg: AssetCfg, horizon: "4h" | "daily"): Promise<PolyMarketOdds | null> {
  for (const slug of polySlugs(cfg, horizon, new Date())) {
    try {
      const res = await fetch(`https://gamma-api.polymarket.com/events?slug=${slug}`, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) continue;
      const ev = ((await res.json()) as Row[])[0];
      if (!ev || ev["closed"] === true) continue;
      const m = (ev["markets"] as Row[] | undefined)?.[0];
      if (!m) continue;
      const outcomes = JSON.parse(String(m["outcomes"] ?? "[]")) as string[];
      const prices = (JSON.parse(String(m["outcomePrices"] ?? "[]")) as string[]).map(Number);
      const upIdx = Math.max(0, outcomes.findIndex((o) => /up/i.test(o)));
      const up = prices[upIdx];
      if (up === undefined || !Number.isFinite(up)) continue;
      return {
        upProbability: up,
        volumeUsd: num(m, "volumeNum", "volume") ?? 0,
        slug,
        endDate: str(ev, "endDate") ?? null,
      };
    } catch {
      /* try next slug */
    }
  }
  return null;
}

// ---------------- Nansen ----------------

async function nansen(apiKey: string, endpoint: string, body: unknown): Promise<Row[] | null> {
  try {
    const res = await fetch(`https://api.nansen.ai/api/v1/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apiKey },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      console.warn("Nansen", endpoint, res.status);
      return null;
    }
    const list = rows(await res.json());
    return list.length ? list : null;
  } catch {
    return null;
  }
}

async function fetchPerp(apiKey: string, cfg: AssetCfg, horizon: "4h" | "daily"): Promise<PerpStream | null> {
  const list = await nansen(apiKey, "smart-money/perp-trades", {
    filters: { token_symbol: cfg.sym },
    pagination: { page: 1, per_page: 200 },
  });
  if (!list) return null;
  const windowMin = horizon === "4h" ? 240 : 1440;
  const fills: PerpFill[] = [];
  for (const t of list) {
    const sym = str(t, "token_symbol", "symbol", "coin");
    if (sym && sym.toUpperCase().replace(/-PERP$/, "") !== cfg.sym) continue;
    const ts = str(t, "block_timestamp", "timestamp");
    const minutesAgo = ts ? Math.max(0, Math.round((Date.now() - Date.parse(ts.endsWith("Z") ? ts : `${ts}Z`)) / 60000)) : 0;
    if (minutesAgo > windowMin) continue;
    const sideTxt = `${str(t, "side") ?? ""} ${str(t, "action", "type") ?? ""}`;
    // "Close Long" reduces long exposure → counts as short flow, and vice versa.
    const isClose = /close|reduce/i.test(sideTxt);
    const isShort = /short|sell/i.test(sideTxt);
    const side: PerpFill["side"] = isShort !== isClose ? "SHORT" : "LONG";
    fills.push({
      side,
      notionalUsd: num(t, "value_usd", "size_usd", "notional_usd") ?? 0,
      price: num(t, "price_usd", "price") ?? 0,
      trader: str(t, "trader_address", "address") ?? "0x0",
      minutesAgo,
    });
  }
  const longUsd = fills.filter((f) => f.side === "LONG").reduce((a, f) => a + f.notionalUsd, 0);
  const shortUsd = fills.filter((f) => f.side === "SHORT").reduce((a, f) => a + f.notionalUsd, 0);
  // Require a meaningful two-sided sample; otherwise the ratio pins to 0/100%.
  const longs = fills.filter((f) => f.side === "LONG").length;
  if (fills.length < 6 || longs === 0 || longs === fills.length || longUsd + shortUsd <= 0) return null;
  fills.sort((a, b) => a.minutesAgo - b.minutesAgo);
  return { longUsd, shortUsd, fills: fills.slice(0, 12) };
}

async function fetchDexAll(apiKey: string, horizon: "4h" | "daily"): Promise<Map<AssetSymbol, DexStream>> {
  const out = new Map<AssetSymbol, DexStream>();
  const list = await nansen(apiKey, "smart-money/netflow", {
    chains: ["ethereum", "solana", "base", "arbitrum", "bnb"],
    pagination: { page: 1, per_page: 1000 },
  });
  if (!list) return out;
  for (const cfg of ASSETS) {
    const matches = list.filter((r) => cfg.dexSymbols.includes((str(r, "token_symbol", "symbol") ?? "").toUpperCase()));
    if (!matches.length) continue;
    let net = 0;
    let buyers = 0;
    let sellers = 0;
    for (const r of matches) {
      const h1 = num(r, "net_flow_1h_usd");
      const d1 = num(r, "net_flow_24h_usd", "netflow_usd", "net_flow_usd") ?? 0;
      net += horizon === "4h" ? (h1 !== undefined ? h1 * 4 : d1 / 6) : d1;
      buyers += num(r, "buyers", "buyer_count", "trader_count") ?? 0;
      sellers += num(r, "sellers", "seller_count") ?? 0;
    }
    out.set(cfg.sym, { netflowUsd: net, buyers, sellers });
  }
  return out;
}

async function fetchCex(apiKey: string, cfg: AssetCfg, horizon: "4h" | "daily"): Promise<CexStream | null> {
  if (!cfg.cex) return null;
  const list = await nansen(apiKey, "tgm/flow-intelligence", {
    chain: cfg.cex.chain,
    token_address: cfg.cex.token,
    timeframe: horizon === "4h" ? "6h" : "1d",
  });
  const r = list?.[0];
  if (!r) return null;
  const inflow = num(r, "exchange_inflow_usd", "exchange_inflows_usd");
  const outflow = num(r, "exchange_outflow_usd", "exchange_outflows_usd");
  if (inflow !== undefined && outflow !== undefined && inflow + outflow > 0) {
    return { inflowUsd: Math.abs(inflow), outflowUsd: Math.abs(outflow) };
  }
  const net = num(r, "exchange_net_flow_usd", "exchange_netflow_usd");
  const avg = Math.abs(num(r, "exchange_avg_flow_usd") ?? 0);
  const wallets = num(r, "exchange_wallet_count") ?? 0;
  if (net === undefined) return null;
  // Only net flow available: reconstruct gross legs around an estimated gross volume.
  const gross = Math.max(Math.abs(net) * 2.5, avg * Math.max(wallets, 1), 1);
  return { inflowUsd: (gross + net) / 2, outflowUsd: (gross - net) / 2 };
}

export interface LiveAsset {
  symbol: AssetSymbol;
  poly: PolyMarketOdds | null;
  perp: PerpStream | null;
  dex: DexStream | null;
  cex: CexStream | null;
}

const input = z.object({
  horizon: z.enum(["4h", "daily"]),
  apiKey: z.string().trim().max(200).optional(),
});

export const getPulseBoard = createServerFn({ method: "POST" })
  .inputValidator((d) => input.parse(d))
  .handler(async ({ data }): Promise<{ assets: LiveAsset[]; nansenKey: boolean }> => {
    const apiKey = data.apiKey || process.env["NANSEN_API_KEY"] || "";
    const [polys, dexMap, perps, cexes] = await Promise.all([
      Promise.all(ASSETS.map((a) => fetchPoly(a, data.horizon))),
      apiKey ? fetchDexAll(apiKey, data.horizon) : Promise.resolve(new Map<AssetSymbol, DexStream>()),
      Promise.all(ASSETS.map((a) => (apiKey ? fetchPerp(apiKey, a, data.horizon) : null))),
      Promise.all(ASSETS.map((a) => (apiKey ? fetchCex(apiKey, a, data.horizon) : null))),
    ]);
    return {
      nansenKey: Boolean(apiKey),
      assets: ASSETS.map((a, i) => ({
        symbol: a.sym,
        poly: polys[i] ?? null,
        perp: perps[i] ?? null,
        dex: dexMap.get(a.sym) ?? null,
        cex: cexes[i] ?? null,
      })),
    };
  });
