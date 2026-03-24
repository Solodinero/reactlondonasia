import { NextResponse } from "next/server";
import { CANDLE_HISTORY_COUNT, PAIRS } from "@/config/settings";
import { getLatestCandles } from "@/lib/data/fetcher";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const pair = (searchParams.get("pair") ?? "EURUSD").toUpperCase();
  const n = Number(searchParams.get("n") ?? String(CANDLE_HISTORY_COUNT));
  const safeN = Number.isFinite(n) ? Math.min(Math.max(n, 1), 500) : CANDLE_HISTORY_COUNT;

  if (!PAIRS.includes(pair as (typeof PAIRS)[number])) {
    return NextResponse.json({ error: "Invalid pair" }, { status: 400 });
  }

  try {
    const candles = await getLatestCandles(pair, safeN);
    return NextResponse.json({ candles, pair });
  } catch (error) {
    console.error("Candles route error", error);
    return NextResponse.json({ error: "Failed fetching candles" }, { status: 500 });
  }
}
