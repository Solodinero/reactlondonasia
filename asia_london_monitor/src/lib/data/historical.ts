import fs from "node:fs";
import path from "node:path";
import { Candle } from "@/types";

const CACHE_DIR = path.join(process.cwd(), "src/lib/data/cache");

function cachePath(pair: string, startDate: string, endDate: string): string {
  return path.join(CACHE_DIR, `${pair}_${startDate}_${endDate}.json`);
}

function parseDateToTs(date: string): number {
  return Math.floor(new Date(`${date}T00:00:00Z`).getTime() / 1000);
}

function parseCsv(filePath: string): Candle[] {
  const rows = fs.readFileSync(filePath, "utf8").trim().split("\n");
  const [, ...dataRows] = rows;
  return dataRows.map((row) => {
    const [time, open, high, low, close, volume] = row.split(",");
    return {
      time: Math.floor(new Date(time).getTime() / 1000),
      open: Number(open),
      high: Number(high),
      low: Number(low),
      close: Number(close),
      volume: Number(volume ?? 0),
    };
  });
}

function filterRange(candles: Candle[], startDate: string, endDate: string): Candle[] {
  const start = parseDateToTs(startDate);
  const end = parseDateToTs(endDate) + 86_399;
  return candles.filter((c) => c.time >= start && c.time <= end).sort((a, b) => a.time - b.time);
}

async function fetchAlphaVantage(pair: string): Promise<Candle[]> {
  const apiKey = process.env.AV_API_KEY;
  if (!apiKey) {
    throw new Error("AV_API_KEY is missing.");
  }

  const from = pair.slice(0, 3);
  const to = pair.slice(3, 6);
  const url = `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=${from}&to_symbol=${to}&interval=1min&outputsize=full&apikey=${apiKey}`;

  const response = await fetch(url);
  const json = (await response.json()) as Record<string, unknown>;

  if (json["Error Message"] || json["Note"] || json["Information"]) {
    console.warn("Alpha Vantage limit/error response", json);
    throw new Error(
      `Alpha Vantage fetch failed for ${pair}. Free-tier rate limit may be reached (25 calls/day).`,
    );
  }

  const series = json["Time Series FX (1min)"] as Record<string, Record<string, string>> | undefined;
  if (!series) {
    throw new Error(`Unexpected Alpha Vantage response for ${pair}.`);
  }

  return Object.entries(series)
    .map(([time, values]) => ({
      time: Math.floor(new Date(`${time.replace(" ", "T")}Z`).getTime() / 1000),
      open: Number(values["1. open"]),
      high: Number(values["2. high"]),
      low: Number(values["3. low"]),
      close: Number(values["4. close"]),
      volume: 0,
    }))
    .sort((a, b) => a.time - b.time);
}

export async function loadOrFetch(pair: string, startDate: string, endDate: string): Promise<Candle[]> {
  fs.mkdirSync(CACHE_DIR, { recursive: true });

  if (pair === "XAUUSD") {
    console.warn("Alpha Vantage does not support XAUUSD; using CSV fallback.");
    const fallback = path.join(CACHE_DIR, "XAUUSD_fallback.csv");
    if (!fs.existsSync(fallback)) {
      throw new Error(`Missing fallback file at ${fallback}`);
    }
    return filterRange(parseCsv(fallback), startDate, endDate);
  }

  const file = cachePath(pair, startDate, endDate);
  if (fs.existsSync(file)) {
    const cached = JSON.parse(fs.readFileSync(file, "utf8")) as Candle[];
    return filterRange(cached, startDate, endDate);
  }

  const candles = await fetchAlphaVantage(pair);
  fs.writeFileSync(file, JSON.stringify(candles), "utf8");
  return filterRange(candles, startDate, endDate);
}
