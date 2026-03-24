"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { PAIRS } from "@/config/settings";
import { TradeSignal } from "@/types";

type SortKey = "createdAt" | "pair" | "direction" | "entryPrice" | "riskPips" | "status";

export default function SignalsPage(): JSX.Element {
  const [signals, setSignals] = useState<TradeSignal[]>([]);
  const [pair, setPair] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [asc, setAsc] = useState(false);

  const load = async (): Promise<void> => {
    const url = pair === "ALL" ? "/api/signals?limit=50" : `/api/signals?pair=${pair}&limit=50`;
    const response = await fetch(url, { cache: "no-store" });
    const json = (await response.json()) as { signals: TradeSignal[] };
    setSignals(json.signals ?? []);
  };

  useEffect(() => {
    load().catch((error) => console.error("Signals load error", error));
    const id = setInterval(() => {
      load().catch((error) => console.error("Signals refresh error", error));
    }, 30_000);
    return () => clearInterval(id);
  }, [pair]);

  const filtered = useMemo(() => {
    const startTs = startDate ? new Date(`${startDate}T00:00:00Z`).getTime() : 0;
    const endTs = endDate ? new Date(`${endDate}T23:59:59Z`).getTime() : Number.MAX_SAFE_INTEGER;
    const inRange = signals.filter((s) => s.createdAt >= startTs && s.createdAt <= endTs);

    const sorted = [...inRange].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") return av - bv;
      return String(av).localeCompare(String(bv));
    });
    return asc ? sorted : sorted.reverse();
  }, [signals, startDate, endDate, sortKey, asc]);

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Signal History</h1>
      <div className="flex flex-wrap gap-3">
        <select className="bg-gray-900 border border-gray-700 rounded px-3 py-2" value={pair} onChange={(e) => setPair(e.target.value)}>
          <option value="ALL">All pairs</option>
          {PAIRS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <input className="bg-gray-900 border border-gray-700 rounded px-3 py-2" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <input className="bg-gray-900 border border-gray-700 rounded px-3 py-2" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border border-gray-800">
          <thead className="bg-gray-900">
            <tr>
              {[
                ["createdAt", "Time"],
                ["pair", "Pair"],
                ["direction", "Direction"],
                ["entryPrice", "Entry"],
                ["stopLoss", "SL"],
                ["takeProfit", "TP"],
                ["riskPips", "Risk"],
                ["status", "Status"],
              ].map(([key, label]) => (
                <th
                  key={key}
                  className="px-3 py-2 border-b border-gray-800 cursor-pointer"
                  onClick={() => {
                    if (key === sortKey) setAsc((v) => !v);
                    setSortKey(key as SortKey);
                  }}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="odd:bg-gray-900/50">
                <td className="px-3 py-2">{new Date(s.createdAt).toISOString()}</td>
                <td className="px-3 py-2">{s.pair}</td>
                <td className="px-3 py-2 uppercase">{s.direction}</td>
                <td className="px-3 py-2">{s.entryPrice.toFixed(5)}</td>
                <td className="px-3 py-2">{s.stopLoss.toFixed(5)}</td>
                <td className="px-3 py-2">{s.takeProfit.toFixed(5)}</td>
                <td className="px-3 py-2">{s.riskPips.toFixed(1)}</td>
                <td className="px-3 py-2">
                  <Badge status={s.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
