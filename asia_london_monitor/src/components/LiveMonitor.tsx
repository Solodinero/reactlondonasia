"use client";

import { useEffect, useRef } from "react";
import { PAIRS } from "@/config/settings";
import { useMonitorStore } from "@/store/useMonitorStore";
import { TradeSignal } from "@/types";
import { SignalCard } from "./SignalCard";

export function LiveMonitor(): JSX.Element {
  const { signals, addSignal, isConnected, setConnected } = useMonitorStore();
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let reconnectTimer: NodeJS.Timeout;

    const connect = (): void => {
      const source = new EventSource("/api/monitor");
      sourceRef.current = source;

      source.onopen = () => setConnected(true);
      source.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as TradeSignal;
          if (payload?.id) addSignal(payload);
        } catch (error) {
          console.error("SSE parse error", error);
        }
      };
      source.onerror = () => {
        setConnected(false);
        source.close();
        reconnectTimer = setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      sourceRef.current?.close();
    };
  }, [addSignal, setConnected]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
        <span className="text-sm text-gray-300">Monitoring {PAIRS.length} pairs ({PAIRS.join(", ")})</span>
      </div>
      <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
        {signals.slice(0, 10).map((signal) => (
          <SignalCard key={signal.id} signal={signal} />
        ))}
      </div>
    </div>
  );
}
