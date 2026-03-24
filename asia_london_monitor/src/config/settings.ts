export const ASIAN_SESSION_START = "23:00";
export const ASIAN_SESSION_END = "08:00";
export const LONDON_SESSION_START = "07:00";
export const LONDON_SESSION_END = "16:00";

export const PAIRS = ["EURUSD", "GBPUSD", "XAUUSD"] as const;
export type Pair = (typeof PAIRS)[number];

export const TIMEFRAME_LIVE = "1";
export const SWEEP_BUFFER_PIPS = 2;
export const SWEEP_REVERSAL_CANDLES = 3;
export const IFEG_LOOKBACK = 20;
export const RISK_REWARD = 2.0;
export const POLL_INTERVAL_MS = 60_000;
export const CANDLE_HISTORY_COUNT = 200;
