import { getPulseBoard } from "@/lib/pulse.functions";
import { snapshotBoard } from "@/services/snapshot";
import type { AssetBoard, Horizon } from "@/types/pulse";

export interface BoardResult {
  assets: AssetBoard[];
  liveStreams: number; // count of live stream slots out of assets*4
}

/** Live board with per-stream graceful fallback to the built-in snapshot. */
export async function fetchBoard(horizon: Horizon, apiKey?: string): Promise<BoardResult> {
  const snap = snapshotBoard(horizon);
  try {
    const res = await Promise.race([
      getPulseBoard({ data: { horizon, apiKey: apiKey || undefined } }),
      new Promise<null>((r) => setTimeout(() => r(null), 4000)),
    ]);
    if (!res) return { assets: snap, liveStreams: 0 };
    let liveStreams = 0;
    const assets = snap.map((s) => {
      const l = res.assets.find((a) => a.symbol === s.symbol);
      if (!l) return s;
      const live = { poly: !!l.poly, perp: !!l.perp, dex: !!l.dex, cex: !!l.cex };
      liveStreams += Object.values(live).filter(Boolean).length;
      return {
        ...s,
        poly: l.poly ?? s.poly,
        perp: l.perp ?? s.perp,
        dex: l.dex ?? s.dex,
        cex: l.cex ?? s.cex,
        live,
      };
    });
    return { assets, liveStreams };
  } catch {
    return { assets: snap, liveStreams: 0 };
  }
}
