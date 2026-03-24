"use client";

import { useEffect, useRef } from "react";
import { CandlestickData, ColorType, IChartApi, ISeriesApi, Time, createChart } from "lightweight-charts";
import { Candle, SessionLevels, TradeSignal } from "@/types";

export function CandleChart({
  candles,
  sessionLevels,
  signals,
}: {
  candles: Candle[];
  sessionLevels: SessionLevels | null;
  signals: TradeSignal[];
}): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 450,
      layout: {
        background: { type: ColorType.Solid, color: "#030712" },
        textColor: "#e5e7eb",
      },
      grid: {
        vertLines: { color: "#1f2937" },
        horzLines: { color: "#1f2937" },
      },
    });
    const series = chart.addCandlestickSeries();

    chartRef.current = chart;
    seriesRef.current = series;

    const resize = new ResizeObserver((entries) => {
      for (const entry of entries) {
        chart.applyOptions({ width: entry.contentRect.width });
      }
    });
    resize.observe(containerRef.current);

    return () => {
      resize.disconnect();
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current) return;
    const data: CandlestickData<Time>[] = candles.map((c) => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    seriesRef.current.setData(data);

    if (sessionLevels) {
      const values = [sessionLevels.asianHigh, sessionLevels.asianLow, sessionLevels.londonHigh, sessionLevels.londonLow].filter(
        (v): v is number => v !== null,
      );
      for (const value of values) {
        seriesRef.current.createPriceLine({ price: value, color: "#64748b", lineStyle: 2, lineWidth: 1, axisLabelVisible: true });
      }
    }

    seriesRef.current.setMarkers(
      signals.map((s) => ({
        time: s.time as Time,
        position: s.direction === "long" ? "belowBar" : "aboveBar",
        color: s.direction === "long" ? "#10b981" : "#ef4444",
        shape: s.direction === "long" ? "arrowUp" : "arrowDown",
        text: s.direction.toUpperCase(),
      })),
    );
  }, [candles, sessionLevels, signals]);

  return <div ref={containerRef} className="w-full" />;
}
