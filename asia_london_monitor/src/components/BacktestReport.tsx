import { BacktestStats } from "@/types";
import { EquityCurve } from "./EquityCurve";

export function BacktestReport({ stats, report }: { stats: BacktestStats; report: string }): JSX.Element {
  return (
    <div className="space-y-4">
      <pre className="bg-gray-900 border border-gray-800 rounded-lg p-4 overflow-x-auto">{report}</pre>
      <EquityCurve points={stats.equityCurve} />
    </div>
  );
}
