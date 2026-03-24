import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { Candle, SessionLevels, SignalStatus, TradeSignal } from "@/types";

const dataDir = path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, "monitor.db");

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS candles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pair TEXT NOT NULL,
  time INTEGER NOT NULL,
  open REAL, high REAL, low REAL, close REAL, volume REAL,
  UNIQUE(pair, time)
);
CREATE TABLE IF NOT EXISTS session_levels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pair TEXT NOT NULL,
  date TEXT NOT NULL,
  asian_high REAL, asian_low REAL,
  london_high REAL, london_low REAL,
  UNIQUE(pair, date)
);
CREATE TABLE IF NOT EXISTS signals (
  id TEXT PRIMARY KEY,
  pair TEXT NOT NULL,
  direction TEXT NOT NULL,
  entry_price REAL, stop_loss REAL, take_profit REAL,
  fvg_high REAL, fvg_low REAL,
  swept_level REAL, session TEXT,
  risk_pips REAL, reward_pips REAL,
  status TEXT DEFAULT 'pending',
  created_at INTEGER, closed_at INTEGER
);
`);

const insertCandleStmt = db.prepare(
  `INSERT OR IGNORE INTO candles (pair,time,open,high,low,close,volume) VALUES (@pair,@time,@open,@high,@low,@close,@volume)`,
);
const upsertLevelsStmt = db.prepare(`
INSERT INTO session_levels (pair,date,asian_high,asian_low,london_high,london_low)
VALUES (@pair,@date,@asianHigh,@asianLow,@londonHigh,@londonLow)
ON CONFLICT(pair,date) DO UPDATE SET
  asian_high=excluded.asian_high,
  asian_low=excluded.asian_low,
  london_high=excluded.london_high,
  london_low=excluded.london_low
`);
const logSignalStmt = db.prepare(`
INSERT OR REPLACE INTO signals (
  id,pair,direction,entry_price,stop_loss,take_profit,fvg_high,fvg_low,swept_level,session,risk_pips,reward_pips,status,created_at,closed_at
)
VALUES (@id,@pair,@direction,@entryPrice,@stopLoss,@takeProfit,@fvgHigh,@fvgLow,@sweptLevel,@session,@riskPips,@rewardPips,@status,@createdAt,@closedAt)
`);
const updateStatusStmt = db.prepare(`UPDATE signals SET status = ?, closed_at = ? WHERE id = ?`);
const recentSignalStmt = db.prepare(
  `SELECT * FROM signals ORDER BY created_at DESC LIMIT ?`,
);
const recentSignalByPairStmt = db.prepare(
  `SELECT * FROM signals WHERE pair = ? ORDER BY created_at DESC LIMIT ?`,
);
const pendingByPairStmt = db.prepare(`SELECT * FROM signals WHERE pair = ? AND status = 'pending' ORDER BY created_at DESC`);
const levelsStmt = db.prepare(`SELECT * FROM session_levels ORDER BY date DESC`);

export function insertCandles(pair: string, candles: Candle[]): void {
  const tx = db.transaction((rows: Candle[]) => {
    for (const candle of rows) {
      insertCandleStmt.run({ pair, ...candle });
    }
  });
  tx(candles);
}

export function upsertSessionLevels(levels: SessionLevels): void {
  upsertLevelsStmt.run(levels);
}

export function getSessionLevels(): SessionLevels[] {
  return levelsStmt.all().map((row) => ({
    pair: row.pair,
    date: row.date,
    asianHigh: row.asian_high,
    asianLow: row.asian_low,
    londonHigh: row.london_high,
    londonLow: row.london_low,
    asianComplete: false,
    londonActive: false,
  })) as SessionLevels[];
}

export function logSignal(signal: TradeSignal): void {
  logSignalStmt.run({
    ...signal,
    fvgHigh: signal.fvgZone.high,
    fvgLow: signal.fvgZone.low,
    closedAt: signal.closedAt ?? null,
  });
}

export function updateSignalStatus(id: string, status: SignalStatus, closedAt: number): void {
  updateStatusStmt.run(status, closedAt, id);
}

export function getRecentSignals(n: number, pair?: string): TradeSignal[] {
  const rows = pair ? recentSignalByPairStmt.all(pair, n) : recentSignalStmt.all(n);
  return rows.map((row) => ({
    id: row.id,
    pair: row.pair,
    direction: row.direction,
    entryPrice: row.entry_price,
    stopLoss: row.stop_loss,
    takeProfit: row.take_profit,
    fvgZone: { high: row.fvg_high, low: row.fvg_low },
    sweptLevel: row.swept_level,
    session: row.session,
    riskPips: row.risk_pips,
    rewardPips: row.reward_pips,
    status: row.status,
    createdAt: row.created_at,
    closedAt: row.closed_at ?? undefined,
    time: row.created_at,
  })) as TradeSignal[];
}

export function getPendingSignalsByPair(pair: string): TradeSignal[] {
  return pendingByPairStmt.all(pair).map((row) => ({
    id: row.id,
    pair: row.pair,
    direction: row.direction,
    entryPrice: row.entry_price,
    stopLoss: row.stop_loss,
    takeProfit: row.take_profit,
    fvgZone: { high: row.fvg_high, low: row.fvg_low },
    sweptLevel: row.swept_level,
    session: row.session,
    riskPips: row.risk_pips,
    rewardPips: row.reward_pips,
    status: row.status,
    createdAt: row.created_at,
    closedAt: row.closed_at ?? undefined,
    time: row.created_at,
  })) as TradeSignal[];
}
