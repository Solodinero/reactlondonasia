import { BacktestStats } from "@/types";
import { loadOrFetch } from "../data/historical";
import { SignalEngine } from "../strategy/signals";
import { BacktestEngine } from "./engine";

export async function runBacktest(
  pair: string,
  startDate: string,
  endDate: string,
): Promise<BacktestStats> {
  const candles = await loadOrFetch(pair, startDate, endDate);
  const signalEngine = new SignalEngine(pair);
  const backtestEngine = new BacktestEngine(10_000, 0.0002);

  for (let i = 200; i < candles.length; i++) {
    const window = candles.slice(0, i + 1);
    const signal = signalEngine.process(window);
    backtestEngine.processTick(candles[i], signal);
  }

  const stats = backtestEngine.getStats();
  return { ...stats, pair, startDate, endDate };
}
