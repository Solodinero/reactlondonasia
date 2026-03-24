import { NextResponse } from "next/server";
import { PAIRS } from "@/config/settings";
import { runBacktest } from "@/lib/backtest/runner";
import { formatReport } from "@/lib/backtest/report";

export const maxDuration = 60;

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as {
      pair?: string;
      startDate?: string;
      endDate?: string;
    };

    if (!body.pair || !PAIRS.includes(body.pair as (typeof PAIRS)[number])) {
      return NextResponse.json({ error: "Invalid pair" }, { status: 400 });
    }
    if (!body.startDate || !body.endDate) {
      return NextResponse.json({ error: "Missing date range" }, { status: 400 });
    }

    const stats = await runBacktest(body.pair, body.startDate, body.endDate);
    return NextResponse.json({ stats, report: formatReport(stats) });
  } catch (error) {
    console.error("Backtest route error", error);
    return NextResponse.json({ error: "Backtest failed" }, { status: 500 });
  }
}
