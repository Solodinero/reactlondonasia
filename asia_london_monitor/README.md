# Asia-London Liquidity Sweep Monitor

Production-ready Next.js 14 monitor for Asia/London liquidity sweeps with 1-minute IFEG confirmation, backtesting, and Telegram alerting.

## Features
- Session level tracking for Asia and London sessions (UTC).
- Liquidity sweep + IFEG signal detection for EURUSD, GBPUSD, XAUUSD.
- SQLite persistence (`better-sqlite3`) for candles, levels, and signals.
- Live monitoring over SSE endpoint (`/api/monitor`).
- Backtesting using Alpha Vantage + local cache fallback for XAUUSD.
- Lightweight charting for candles and equity curves.

## Setup
```bash
npm install
cp .env.local.example .env.local
npm run dev
```

## API Endpoints
- `GET /api/monitor` SSE live stream.
- `GET /api/signals?pair=EURUSD&limit=20` signal history.
- `GET /api/status` current session levels.
- `GET /api/candles?pair=EURUSD&n=200` live candles.
- `POST /api/backtest` `{ pair, startDate, endDate }`.

## Deploy
```bash
bash deploy/setup_vercel.sh
```
