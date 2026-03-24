import { BacktestStats, SessionLevels, TradeSignal } from "@/types";
import { formatReport } from "@/lib/backtest/report";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendMessage(text: string, parseMode?: "HTML"): Promise<void> {
  if (!TOKEN || !CHAT_ID) return;
  try {
    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: parseMode,
      }),
    });
  } catch (error) {
    console.error("Telegram send error", error);
  }
}

export async function sendSignalAlert(signal: TradeSignal): Promise<void> {
  try {
    const direction = signal.direction.toUpperCase();
    const time = new Date(signal.time * 1000).toISOString().slice(11, 16);
    const triggerSession = signal.session === "london" ? "London" : "Asia";
    const text = `TRADE SIGNAL — ${signal.pair}\n─────────────────────\nDirection  : ${direction}\nEntry      : ${signal.entryPrice.toFixed(5)}\nStop Loss  : ${signal.stopLoss.toFixed(5)} (${signal.riskPips.toFixed(0)} pips)\nTake Profit: ${signal.takeProfit.toFixed(5)} (${signal.rewardPips.toFixed(0)} pips)\nR:R        : 1:2\nTrigger    : ${triggerSession} ${signal.direction === "short" ? "Low" : "High"} Sweep + IFEG @ ${time} UTC\n─────────────────────\nSwept Level : ${signal.sweptLevel.toFixed(5)}\nFVG Zone    : ${signal.fvgZone.high.toFixed(5)} – ${signal.fvgZone.low.toFixed(5)}`;
    await sendMessage(text);
  } catch (error) {
    console.error("sendSignalAlert error", error);
  }
}

export async function sendBacktestSummary(stats: BacktestStats): Promise<void> {
  try {
    await sendMessage(`<pre>${formatReport(stats)}</pre>`, "HTML");
  } catch (error) {
    console.error("sendBacktestSummary error", error);
  }
}

export async function sendStatusUpdate(levels: SessionLevels[]): Promise<void> {
  try {
    const lines = levels.map(
      (l) =>
        `${l.pair}: Asia H/L ${l.asianHigh ?? "—"}/${l.asianLow ?? "—"} | London H/L ${l.londonHigh ?? "—"}/${l.londonLow ?? "—"}`,
    );
    await sendMessage(`SESSION STATUS\n${lines.join("\n")}`);
  } catch (error) {
    console.error("sendStatusUpdate error", error);
  }
}
