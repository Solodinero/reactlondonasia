export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SessionLevels {
  pair: string;
  date: string;
  asianHigh: number | null;
  asianLow: number | null;
  londonHigh: number | null;
  londonLow: number | null;
  asianComplete: boolean;
  londonActive: boolean;
}

export type Direction = "long" | "short";

export interface SweepEvent {
  time: number;
  pair: string;
  direction: Direction;
  sweptLevel: number;
  sweepCandleIndex: number;
  session: "asia" | "london";
}

export interface FVGZone {
  high: number;
  low: number;
}

export interface IFEGSignal {
  time: number;
  pair: string;
  direction: Direction;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  fvgZone: FVGZone;
  riskPips: number;
  rewardPips: number;
}

export type SignalStatus = "pending" | "hit_tp" | "hit_sl" | "expired";

export interface TradeSignal extends IFEGSignal {
  id: string;
  status: SignalStatus;
  createdAt: number;
  closedAt?: number;
  sweptLevel: number;
  session: "asia" | "london";
}

export interface BacktestStats {
  pair: string;
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdownPct: number;
  avgR: number;
  bestTradePips: number;
  worstTradePips: number;
  equityCurve: Array<{ time: number; value: number }>;
  startDate: string;
  endDate: string;
}
