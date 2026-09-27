import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ALLOWED = [
  "prediction-market/market-screener",
  "prediction-market/top-holders",
  "smart-money/perp-trades",
  "smart-money/netflow",
] as const;

const schema = z.object({
  endpoint: z.string().transform((s) => s.replace(/^\/+/, "")).pipe(z.enum(ALLOWED)),
  body: z.unknown().optional(),
});

export type NansenProxyResult =
  | { ok: true; status: number; data: unknown }
  | { ok: false; status: number; error: string };

// Secure server-side proxy to Nansen: hides the API key and avoids CORS.
export const nansenProxy = createServerFn({ method: "POST" })
  .inputValidator((d) => schema.parse(d))
  .handler(async ({ data }): Promise<NansenProxyResult> => {
    const apiKey = process.env["NANSEN_API_KEY"];
    if (!apiKey) return { ok: false, status: 503, error: "NANSEN_API_KEY missing" };
    try {
      const res = await fetch(`https://api.nansen.ai/api/v1/${data.endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apiKey },
        body: JSON.stringify(data.body ?? {}),
      });
      if (!res.ok) {
        console.error("Nansen error", data.endpoint, res.status, await res.text().catch(() => ""));
        return { ok: false, status: res.status, error: `Upstream ${res.status}` };
      }
      return { ok: true, status: res.status, data: (await res.json()) as unknown };
    } catch (e) {
      console.error("Nansen fetch failed", e);
      return { ok: false, status: 502, error: "Network error" };
    }
  });
