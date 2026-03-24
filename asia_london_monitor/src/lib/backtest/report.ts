import { BacktestStats } from "@/types";

export function formatReport(stats: BacktestStats): string {
  return [
    "╔══════════════════════════════════════════╗",
    `║   BACKTEST REPORT — ${stats.pair.padEnd(20, " ")}║`,
    `║   ${stats.startDate}  →  ${stats.endDate}              ║`,
    "╠══════════════════════════════════════════╣",
    `║  Total Trades     :  ${String(stats.totalTrades).padEnd(20, " ")}║`,
    `║  Win Rate         :  ${stats.winRate.toFixed(2)}%               ║`,
    `║  Profit Factor    :  ${stats.profitFactor.toFixed(2)}                ║`,
    `║  Sharpe Ratio     :  ${stats.sharpeRatio.toFixed(2)}                ║`,
    `║  Max Drawdown     :  ${stats.maxDrawdownPct.toFixed(2)}%               ║`,
    `║  Average R        :  ${stats.avgR.toFixed(2)}R               ║`,
    `║  Best Trade       :  ${stats.bestTradePips.toFixed(2)} pips            ║`,
    `║  Worst Trade      :  ${stats.worstTradePips.toFixed(2)} pips            ║`,
    "╚══════════════════════════════════════════╝",
  ].join("\n");
}

export function formatReportJSON(stats: BacktestStats): Record<string, string | number> {
  return {
    pair: stats.pair,
    startDate: stats.startDate,
    endDate: stats.endDate,
    totalTrades: stats.totalTrades,
    winRate: Number(stats.winRate.toFixed(2)),
    profitFactor: Number(stats.profitFactor.toFixed(2)),
    sharpeRatio: Number(stats.sharpeRatio.toFixed(2)),
    maxDrawdownPct: Number(stats.maxDrawdownPct.toFixed(2)),
    avgR: Number(stats.avgR.toFixed(2)),
    bestTradePips: Number(stats.bestTradePips.toFixed(2)),
    worstTradePips: Number(stats.worstTradePips.toFixed(2)),
  };
}
