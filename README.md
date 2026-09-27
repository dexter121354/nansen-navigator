# PolyPulse — 4H & Daily Binary Quant Terminal
Built for the Nansen Meridian Buildathon (September 2026)

Live Web Terminal: https://nansen-navigator.lovable.app/

// I saw Buildathon tweet yesterday, I only had 6-7 hours to do this build. I had something much more complex in mind but I adjusted as per time constraints. that's why no dedicated domain is used too. also please use your own api key by clicking on key button at top right for accurate data.

---

## What is PolyPulse?

Prediction markets like Polymarket offer fast-moving binary contracts (e.g., "BTC Up or Down 4h" and "ETH Up or Down Daily"). Retail odds on these markets often lag behind real market momentum because public bettors trade on headlines and emotion.

PolyPulse identifies statistical arbitrage opportunities by comparing live Polymarket odds against real-time institutional capital flow tracked by Nansen.

---

## The 3 Nansen Data Streams

PolyPulse queries three distinct Nansen endpoints to calculate institutional conviction:

1. Hyperliquid Perps (/api/v1/smart-money/perp-trades)
   - Tracks whether Smart Money is net Long or Short on Hyperliquid.
   - Weight: 50%

2. Smart Money DEX Flows (/api/v1/smart-money/netflow)
   - Tracks if whales are accumulating or dumping tokens on decentralized exchanges.
   - Weight: 30%

3. CEX Reserve Flows (/api/v1/tgm/flow-intelligence)
   - Measures Centralized Exchange deposits (sell pressure) vs. withdrawals (supply absorption).
   - Weight: 20%

---

## Scoring Formula & Signals

Smart Bias Score (SBS) = (0.50 * Perp Ratio) + (0.30 * DEX Flow) + (0.20 * CEX Outflows)

Alpha Edge = Smart Bias Score - Polymarket Probability

- Green [ARB BUY UP]: Smart Bias exceeds crowd odds by +15% or more (retail is underpricing an upward breakout).
- Red [ARB BUY DOWN]: Smart Bias is below crowd odds by -15% or more (retail is overly bullish while smart money is shorting).
- Gray [FAIRLY PRICED]: The difference is within +/- 15% (market is efficient).

---

## Tech Stack

- Frontend: React, Vite, TypeScript, Tailwind CSS
- Data Sources: Nansen API v1, Polymarket Public Gamma API
- Backend: Supabase Edge Functions for secure API key injection

---

## How to Run Locally

```bash
npm install
npm run dev
