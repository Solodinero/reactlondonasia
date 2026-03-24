import { IFEG_LOOKBACK, RISK_REWARD } from "@/config/settings";
import { Candle, IFEGSignal, SweepEvent } from "@/types";
import { getPipSize } from "./sweep";

export class IFEGDetector {
  detect(candles: Candle[], sweepEvent: SweepEvent, currentIndex: number): IFEGSignal | null {
    const start = Math.max(currentIndex + 1, sweepEvent.sweepCandleIndex + 1);
    const end = Math.min(candles.length - 1, start + IFEG_LOOKBACK);
    if (start >= end) return null;

    const bodySizes = candles.slice(Math.max(0, start - 20), start).map((c) => Math.abs(c.close - c.open));
    const avgBody = bodySizes.length > 0 ? bodySizes.reduce((a, b) => a + b, 0) / bodySizes.length : 0;

    for (let i = start; i + 2 <= end; i++) {
      const c1 = candles[i];
      const c3 = candles[i + 2];

      if (sweepEvent.direction === "long") {
        const strongBull = c1.close > c1.open && Math.abs(c1.close - c1.open) > avgBody;
        if (strongBull && c3.low > c1.high) {
          const zone = { low: c1.high, high: c3.low };
          for (let j = i + 3; j <= end; j++) {
            const retrace = candles[j];
            if (retrace.low <= zone.high) {
              const entryPrice = Math.min(Math.max(retrace.close, zone.low), zone.high);
              const risk = Math.abs(entryPrice - sweepEvent.sweptLevel);
              const pip = getPipSize(sweepEvent.pair);
              if (risk === 0) continue;
              return {
                time: retrace.time,
                pair: sweepEvent.pair,
                direction: "long",
                entryPrice,
                stopLoss: sweepEvent.sweptLevel,
                takeProfit: entryPrice + risk * RISK_REWARD,
                fvgZone: zone,
                riskPips: risk / pip,
                rewardPips: (risk * RISK_REWARD) / pip,
              };
            }
          }
        }
      } else {
        const strongBear = c1.open > c1.close && Math.abs(c1.open - c1.close) > avgBody;
        if (strongBear && c3.high < c1.low) {
          const zone = { high: c1.low, low: c3.high };
          for (let j = i + 3; j <= end; j++) {
            const retrace = candles[j];
            if (retrace.high >= zone.low) {
              const entryPrice = Math.max(Math.min(retrace.close, zone.high), zone.low);
              const risk = Math.abs(entryPrice - sweepEvent.sweptLevel);
              const pip = getPipSize(sweepEvent.pair);
              if (risk === 0) continue;
              return {
                time: retrace.time,
                pair: sweepEvent.pair,
                direction: "short",
                entryPrice,
                stopLoss: sweepEvent.sweptLevel,
                takeProfit: entryPrice - risk * RISK_REWARD,
                fvgZone: zone,
                riskPips: risk / pip,
                rewardPips: (risk * RISK_REWARD) / pip,
              };
            }
          }
        }
      }
    }
    return null;
  }
}
