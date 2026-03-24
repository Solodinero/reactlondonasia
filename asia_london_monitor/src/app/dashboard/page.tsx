"use client";

import { useEffect, useMemo, useState } from "react";
import { CandleChart } from "@/components/CandleChart";
import { LiveMonitor } from "@/components/LiveMonitor";
import { SessionLevels } from "@/components/SessionLevels";
import { PAIRS } from "@/config/settings";
import { useMonitorStore } from "@/store/useMonitorStore";
import { Candle } from "@/types";

export default function DashboardPage(): JSX.Element {
  const [selectedPair, setSelectedPair] = useState<string>(PAIRS[0]);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [utcNow, setUtcNow] = useState<string>(new Date().toUTCString());
  const { signals, sessionLevels, setSessionLevels, isConnected } = useMonitorStore();

  useEffect(() => {
    const id = setInterval(() => setUtcNow(new Date().toUTCString()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const run = async (): Promise<void> => {
      try {
        const [candlesRes, statusRes] = await Promise.all([
          fetch(`/api/candles?pair=${selectedPair}&n=200`),
          fetch("/api/status"),
        ]);
        const candlesJson = (await candlesRes.json()) as { candles: Candle[] };
        const statusJson = (await statusRes.json()) as { levels: typeof sessionLevels };
        setCandles(candlesJson.candles ?? []);
        setSessionLevels(statusJson.levels ?? []);
      } catch (error) {
        console.error("Dashboard fetch error", error);
      }
    };
    run().catch((error) => console.error(error));
  }, [selectedPair, setSessionLevels]);

  const selectedLevels = useMemo(
    () => sessionLevels.find((s) => s.pair === selectedPair) ?? null,
    [selectedPair, sessionLevels],
  );

  return (
    <main className="p-4 bg-gray-950 min-h-screen space-y-4">
      <header className="flex items-center justify-between border border-gray-800 bg-gray-900/70 rounded-lg p-3">
        <h1 className="text-xl font-semibold">Asia-London Liquidity Sweep Monitor</h1>
        <div className="flex items-center gap-6 text-sm">
          <span>{utcNow}</span>
          <span className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? "bg-emerald-400" : "bg-red-400"}`} />
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </header>
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2">
          <SessionLevels levels={sessionLevels} />
        </div>
        <div className="lg:col-span-3 space-y-2">
          <select
            className="bg-gray-900 border border-gray-700 rounded px-3 py-2"
            value={selectedPair}
            onChange={(e) => setSelectedPair(e.target.value)}
          >
            {PAIRS.map((pair) => (
              <option key={pair} value={pair}>
                {pair}
              </option>
            ))}
          </select>
          <CandleChart candles={candles} sessionLevels={selectedLevels} signals={signals.filter((s) => s.pair === selectedPair)} />
        </div>
      </section>
      <section className="border border-gray-800 bg-gray-900/70 rounded-lg p-4">
        <LiveMonitor />
      </section>
    </main>
  );
}
