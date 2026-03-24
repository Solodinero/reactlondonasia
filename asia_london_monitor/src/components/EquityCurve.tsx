"use client";

import { useEffect, useRef } from "react";
import { ColorType, Time, createChart } from "lightweight-charts";

export function EquityCurve({ points }: { points: Array<{ time: number; value: number }> }): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = createChart(ref.current, {
      width: ref.current.clientWidth,
      height: 280,
      layout: {
        background: { type: ColorType.Solid, color: "#030712" },
        textColor: "#e5e7eb",
      },
    });
    const line = chart.addLineSeries({ color: "#22c55e" });
    line.setData(points.map((p) => ({ time: p.time as Time, value: p.value })));

    return () => chart.remove();
  }, [points]);

  return <div ref={ref} className="w-full" />;
}
