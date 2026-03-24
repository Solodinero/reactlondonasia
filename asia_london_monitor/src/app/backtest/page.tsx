"use client";

import { useState } from "react";
import { BacktestReport } from "@/components/BacktestReport";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { PAIRS } from "@/config/settings";
import { BacktestStats } from "@/types";

export default function BacktestPage(): JSX.Element {
  const [pair, setPair] = useState<string>(PAIRS[0]);
  const [startDate, setStartDate] = useState<string>("2024-01-01");
  const [endDate, setEndDate] = useState<string>("2024-12-31");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<BacktestStats | null>(null);
  const [report, setReport] = useState<string>("");

  const runBacktest = async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await fetch("/api/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pair, startDate, endDate }),
      });
      const json = (await res.json()) as { stats: BacktestStats; report: string };
      setStats(json.stats);
      setReport(json.report);
    } catch (error) {
      console.error("Backtest page error", error);
    } finally {
      setLoading(false);
    }
  };

  const download = (): void => {
    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${pair}_${startDate}_${endDate}_backtest.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Backtest Runner</h1>
      <div className="flex flex-wrap gap-3 items-end">
        <label className="grid gap-1">
          Pair
          <select className="bg-gray-900 border border-gray-700 rounded px-3 py-2" value={pair} onChange={(e) => setPair(e.target.value)}>
            {PAIRS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          Start Date
          <input className="bg-gray-900 border border-gray-700 rounded px-3 py-2" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label className="grid gap-1">
          End Date
          <input className="bg-gray-900 border border-gray-700 rounded px-3 py-2" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>
        <Button onClick={runBacktest} disabled={loading}>{loading ? <Spinner /> : "Run Backtest"}</Button>
        <Button onClick={download} disabled={!report}>Download Report</Button>
      </div>
      {stats && <BacktestReport stats={stats} report={report} />}
    </main>
  );
}
