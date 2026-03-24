import { SessionLevels, Candle } from "@/types";
import { upsertSessionLevels } from "@/lib/data/db";

function tradingDateFromCandle(candleTs: number): string {
  const d = new Date(candleTs * 1000);
  if (d.getUTCHours() < 23) {
    return d.toISOString().slice(0, 10);
  }
  const next = new Date(d.getTime() + 86_400_000);
  return next.toISOString().slice(0, 10);
}

export class SessionTracker {
  private current: SessionLevels;
  private history = new Map<string, SessionLevels>();

  constructor(private pair: string) {
    const today = new Date().toISOString().slice(0, 10);
    this.current = {
      pair,
      date: today,
      asianHigh: null,
      asianLow: null,
      londonHigh: null,
      londonLow: null,
      asianComplete: false,
      londonActive: false,
    };
  }

  update(candle: Candle): void {
    const ts = new Date(candle.time * 1000);
    const hour = ts.getUTCHours();
    const date = tradingDateFromCandle(candle.time);

    if (date !== this.current.date) {
      this.history.set(this.current.date, { ...this.current });
      while (this.history.size > 5) {
        const first = this.history.keys().next().value as string;
        this.history.delete(first);
      }
      this.current = {
        pair: this.pair,
        date,
        asianHigh: null,
        asianLow: null,
        londonHigh: null,
        londonLow: null,
        asianComplete: false,
        londonActive: false,
      };
    }

    const isAsian = hour >= 23 || hour < 8;
    const isLondon = hour >= 7 && hour < 16;

    if (isAsian) {
      this.current.asianHigh = this.current.asianHigh === null ? candle.high : Math.max(this.current.asianHigh, candle.high);
      this.current.asianLow = this.current.asianLow === null ? candle.low : Math.min(this.current.asianLow, candle.low);
    }

    if (hour >= 8 && hour < 23) {
      this.current.asianComplete = this.current.asianHigh !== null && this.current.asianLow !== null;
    }

    this.current.londonActive = isLondon;
    if (isLondon) {
      this.current.londonHigh = this.current.londonHigh === null ? candle.high : Math.max(this.current.londonHigh, candle.high);
      this.current.londonLow = this.current.londonLow === null ? candle.low : Math.min(this.current.londonLow, candle.low);
    }

    upsertSessionLevels(this.current);
  }

  getLevels(): SessionLevels {
    return { ...this.current };
  }

  isAsianSessionComplete(): boolean {
    return this.current.asianComplete;
  }

  isLondonSessionActive(): boolean {
    return this.current.londonActive;
  }
}
