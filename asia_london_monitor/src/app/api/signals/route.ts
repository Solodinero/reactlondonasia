import { NextResponse } from "next/server";
import { getRecentSignals } from "@/lib/data/db";

export function GET(request: Request): NextResponse {
  const { searchParams } = new URL(request.url);
  const pair = searchParams.get("pair") ?? undefined;
  const limitRaw = Number(searchParams.get("limit") ?? "20");
  const limit = Math.min(Math.max(limitRaw, 1), 100);

  const signals = getRecentSignals(limit, pair);
  return NextResponse.json({ signals, count: signals.length });
}
