import { SWEEP_BUFFER_PIPS } from "@/config/settings";
import { Candle, SessionLevels, SweepEvent } from "@/types";

export function getPipSize(pair: string): number {
  return pair === "XAUUSD" ? 0.1 : 0.0001;
}

export class SweepDetector {
  private lastSweepTime = 0;

  constructor(private pair: string) {}

  detect(candle: Candle, levels: SessionLevels, candleIndex = 0): SweepEvent | null {
    if (this.lastSweepTime > 0 && candle.time - this.lastSweepTime < 5 * 60) {
      return null;
    }

    const pip = getPipSize(this.pair);
    const threshold = SWEEP_BUFFER_PIPS * pip;

    const checks: Array<{ session: "asia" | "london"; high: number | null; low: number | null }> = [
      { session: "asia", high: levels.asianHigh, low: levels.asianLow },
      { session: "london", high: levels.londonHigh, low: levels.londonLow },
    ];

    for (const c of checks) {
      if (c.high !== null && candle.high > c.high + threshold && candle.close < c.high) {
        this.lastSweepTime = candle.time;
        return {
          time: candle.time,
          pair: this.pair,
          direction: "long",
          sweptLevel: c.high,
          sweepCandleIndex: candleIndex,
          session: c.session,
        };
      }
      if (c.low !== null && candle.low < c.low - threshold && candle.close > c.low) {
        this.lastSweepTime = candle.time;
        return {
          time: candle.time,
          pair: this.pair,
          direction: "short",
          sweptLevel: c.low,
          sweepCandleIndex: candleIndex,
          session: c.session,
        };
      }
    }

    return null;
  }
}
