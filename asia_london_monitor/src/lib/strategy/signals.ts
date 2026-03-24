import { v4 as uuidv4 } from "uuid";
import { IFEG_LOOKBACK } from "@/config/settings";
import { getPendingSignalsByPair, logSignal, updateSignalStatus } from "@/lib/data/db";
import { Candle, TradeSignal } from "@/types";
import { IFEGDetector } from "./ifeg";
import { SessionTracker } from "./sessions";
import { SweepDetector } from "./sweep";

export class SignalEngine {
  private sessionTracker: SessionTracker;
  private sweepDetector: SweepDetector;
  private ifegDetector: IFEGDetector;

  constructor(private pair: string) {
    this.sessionTracker = new SessionTracker(pair);
    this.sweepDetector = new SweepDetector(pair);
    this.ifegDetector = new IFEGDetector();
  }

  process(candles: Candle[]): TradeSignal | null {
    const pending = getPendingSignalsByPair(this.pair);
    if (pending.length > 0) return null;

    for (let i = 0; i < candles.length; i++) {
      const candle = candles[i];
      this.sessionTracker.update(candle);
      const levels = this.sessionTracker.getLevels();
      const sweep = this.sweepDetector.detect(candle, levels, i);
      if (!sweep) continue;

      const signal = this.ifegDetector.detect(candles, sweep, i);
      if (!signal) continue;

      if (signal.time - sweep.time > IFEG_LOOKBACK * 60) {
        continue;
      }

      const tradeSignal: TradeSignal = {
        ...signal,
        id: uuidv4(),
        status: "pending",
        createdAt: Date.now(),
        sweptLevel: sweep.sweptLevel,
        session: sweep.session,
      };
      logSignal(tradeSignal);
      return tradeSignal;
    }

    return null;
  }

  updateStatuses(candles: Candle[]): void {
    const pending = getPendingSignalsByPair(this.pair);
    if (!pending.length) return;

    for (const signal of pending) {
      for (const candle of candles) {
        if (candle.time * 1000 <= signal.createdAt) continue;

        if (signal.direction === "long") {
          if (candle.low <= signal.stopLoss) {
            updateSignalStatus(signal.id, "hit_sl", Date.now());
            break;
          }
          if (candle.high >= signal.takeProfit) {
            updateSignalStatus(signal.id, "hit_tp", Date.now());
            break;
          }
        } else {
          if (candle.high >= signal.stopLoss) {
            updateSignalStatus(signal.id, "hit_sl", Date.now());
            break;
          }
          if (candle.low <= signal.takeProfit) {
            updateSignalStatus(signal.id, "hit_tp", Date.now());
            break;
          }
        }
      }
    }
  }
}
