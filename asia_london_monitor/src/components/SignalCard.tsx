import { TradeSignal } from "@/types";
import { Badge } from "./ui/Badge";
import { Card } from "./ui/Card";

function timeAgo(ms: number): string {
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} minutes ago`;
  return `${Math.floor(m / 60)} hours ago`;
}

export function SignalCard({ signal }: { signal: TradeSignal }): JSX.Element {
  const border = signal.direction === "long" ? "border-emerald-600" : "border-red-600";
  return (
    <Card className={`space-y-1 ${border}`}>
      <div className="flex items-center justify-between">
        <p className="font-semibold">TRADE SIGNAL — {signal.pair}</p>
        <Badge status={signal.status} />
      </div>
      <p>Direction : {signal.direction.toUpperCase()}</p>
      <p>Entry : {signal.entryPrice.toFixed(5)}</p>
      <p>Stop Loss : {signal.stopLoss.toFixed(5)} ({signal.riskPips.toFixed(0)} pips)</p>
      <p>Take Profit : {signal.takeProfit.toFixed(5)} ({signal.rewardPips.toFixed(0)} pips)</p>
      <p>R:R : 1:2</p>
      <p>
        Trigger : {signal.session === "london" ? "London" : "Asia"} Sweep + IFEG @{" "}
        {new Date(signal.time * 1000).toISOString().slice(11, 16)} UTC
      </p>
      <p>Swept Level : {signal.sweptLevel.toFixed(5)}</p>
      <p>
        FVG Zone : {signal.fvgZone.high.toFixed(5)} – {signal.fvgZone.low.toFixed(5)}
      </p>
      <p className="text-xs text-gray-400">{timeAgo(Date.now() - signal.createdAt)}</p>
    </Card>
  );
}
