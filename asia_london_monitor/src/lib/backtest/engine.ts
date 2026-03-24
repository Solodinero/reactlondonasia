import { BacktestStats, Candle, Direction, TradeSignal } from "@/types";
import { getPipSize } from "@/lib/strategy/sweep";

export interface BacktestTrade {
  entryTime: number;
  exitTime: number;
  direction: Direction;
  entryPrice: number;
  exitPrice: number;
  pips: number;
  outcome: "win" | "loss";
  r: number;
}

export class BacktestEngine {
  private trades: BacktestTrade[] = [];
  private equity: number;
  private equityCurve: Array<{ time: number; value: number }> = [];
  private openTrade: (Partial<BacktestTrade> & {
    stopLoss: number;
    takeProfit: number;
    risk: number;
    pair: string;
  }) | null = null;

  constructor(private initialCash: number = 10_000, private commission: number = 0.0002) {
    this.equity = initialCash;
  }

  processTick(candle: Candle, signal: TradeSignal | null): void {
    this.checkOpenTrade(candle);

    if (!this.openTrade && signal) {
      this.openTrade = {
        entryTime: candle.time,
        direction: signal.direction,
        entryPrice: signal.entryPrice,
        stopLoss: signal.stopLoss,
        takeProfit: signal.takeProfit,
        risk: Math.abs(signal.entryPrice - signal.stopLoss),
        pair: signal.pair,
      };
    }
  }

  checkOpenTrade(candle: Candle): void {
    if (!this.openTrade || !this.openTrade.entryPrice || !this.openTrade.direction) return;

    let hit: "tp" | "sl" | null = null;
    if (this.openTrade.direction === "long") {
      if (candle.low <= this.openTrade.stopLoss) hit = "sl";
      else if (candle.high >= this.openTrade.takeProfit) hit = "tp";
    } else {
      if (candle.high >= this.openTrade.stopLoss) hit = "sl";
      else if (candle.low <= this.openTrade.takeProfit) hit = "tp";
    }

    if (!hit) return;

    const exitPrice = hit === "tp" ? this.openTrade.takeProfit : this.openTrade.stopLoss;
    const pair = this.openTrade.pair;
    const pipSize = getPipSize(pair);
    const direction = this.openTrade.direction;
    const entry = this.openTrade.entryPrice;
    const risk = this.openTrade.risk;
    const delta = direction === "long" ? exitPrice - entry : entry - exitPrice;
    const pips = delta / pipSize;

    const gross = this.equity * (delta / entry);
    const fees = this.equity * this.commission * 2;
    this.equity += gross - fees;

    const trade: BacktestTrade = {
      entryTime: this.openTrade.entryTime ?? candle.time,
      exitTime: candle.time,
      direction,
      entryPrice: entry,
      exitPrice,
      pips,
      outcome: hit === "tp" ? "win" : "loss",
      r: risk === 0 ? 0 : delta / risk,
    };

    this.trades.push(trade);
    this.equityCurve.push({ time: candle.time, value: this.equity });
    this.openTrade = null;
  }

  getStats(): Omit<BacktestStats, "pair" | "startDate" | "endDate"> {
    const totalTrades = this.trades.length;
    const wins = this.trades.filter((t) => t.outcome === "win");
    const losses = this.trades.filter((t) => t.outcome === "loss");

    const grossProfit = wins.reduce((sum, t) => sum + Math.max(0, t.pips), 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + Math.min(0, t.pips), 0));

    const returns = this.trades.map((t) => t.r);
    const mean = returns.length ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const variance =
      returns.length > 1
        ? returns.reduce((acc, value) => acc + (value - mean) ** 2, 0) / (returns.length - 1)
        : 0;
    const std = Math.sqrt(variance);

    const first = this.trades[0]?.entryTime;
    const last = this.trades[this.trades.length - 1]?.exitTime;
    const spanDays = first && last ? Math.max((last - first) / 86_400, 1) : 1;
    const tradesPerDay = totalTrades / spanDays;
    const sharpeRatio = std === 0 ? 0 : Math.sqrt(252 * Math.max(tradesPerDay, 1)) * (mean / std);

    let peak = this.initialCash;
    let maxDrawdown = 0;
    for (const point of this.equityCurve) {
      peak = Math.max(peak, point.value);
      const drawdown = ((peak - point.value) / peak) * 100;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    return {
      totalTrades,
      winRate: totalTrades ? (wins.length / totalTrades) * 100 : 0,
      profitFactor: grossLoss === 0 ? grossProfit : grossProfit / grossLoss,
      sharpeRatio,
      maxDrawdownPct: maxDrawdown,
      avgR: totalTrades ? this.trades.reduce((sum, t) => sum + t.r, 0) / totalTrades : 0,
      bestTradePips: totalTrades ? Math.max(...this.trades.map((t) => t.pips)) : 0,
      worstTradePips: totalTrades ? Math.min(...this.trades.map((t) => t.pips)) : 0,
      equityCurve: this.equityCurve,
    };
  }
}
