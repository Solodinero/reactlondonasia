import { NextResponse } from "next/server";
import { getSessionLevels } from "@/lib/data/db";

export function GET(): NextResponse {
  const levels = getSessionLevels();
  return NextResponse.json({ levels, timestamp: Date.now() });
}
