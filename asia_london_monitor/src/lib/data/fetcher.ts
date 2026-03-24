import finnhub from "finnhub";
import { TIMEFRAME_LIVE } from "@/config/settings";
import { Candle } from "@/types";

export const FINNHUB_SYMBOL_MAP: Record<string, string> = {
  EURUSD: "OANDA:EUR_USD",
  GBPUSD: "OANDA:GBP_USD",
  XAUUSD: "OANDA:XAU_USD",
};

const apiKey = process.env.FINNHUB_API_KEY ?? "";
const apiKeyInstance = finnhub.ApiClient.instance;
apiKeyInstance.authentications.api_key.apiKey = apiKey;
const client = new finnhub.DefaultApi();

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeCandles(payload: {
  c: number[];
  h: number[];
  l: number[];
  o: number[];
  t: number[];
  v: number[];
  s: string;
}): Candle[] {
  if (payload.s === "no_data") {
    console.error("Finnhub returned no_data");
    return [];
  }

  const out: Candle[] = payload.t.map((time, idx) => ({
    time,
    open: payload.o[idx],
    high: payload.h[idx],
    low: payload.l[idx],
    close: payload.c[idx],
    volume: payload.v[idx] ?? 0,
  }));

  return out.sort((a, b) => a.time - b.time);
}

async function requestCandles(
  symbol: string,
  n: number,
  retry = 0,
): Promise<Candle[]> {
  const now = Math.floor(Date.now() / 1000);
  const from = now - n * 60;

  return new Promise((resolve, reject) => {
    client.forexCandles(symbol, TIMEFRAME_LIVE, from, now, async (error: Error | null, data: unknown) => {
      if (error) {
        const message = String(error.message ?? "");
        const ratelimited = message.includes("429") || message.toLowerCase().includes("rate");
        if (ratelimited && retry < 3) {
          const delay = 2 ** retry * 2000;
          console.error(`Finnhub rate limited for ${symbol}, retrying in ${delay}ms`);
          await sleep(delay);
          try {
            resolve(await requestCandles(symbol, n, retry + 1));
            return;
          } catch (innerError) {
            reject(innerError);
            return;
          }
        }
        reject(error);
        return;
      }

      try {
        resolve(normalizeCandles(data as { c: number[]; h: number[]; l: number[]; o: number[]; t: number[]; v: number[]; s: string }));
      } catch (parseError) {
        reject(parseError);
      }
    });
  });
}

export async function getLatestCandles(symbol: string, n: number): Promise<Candle[]> {
  const mapped = FINNHUB_SYMBOL_MAP[symbol] ?? symbol;
  try {
    return await requestCandles(mapped, n);
  } catch (error) {
    console.error(`Failed to fetch candles for ${symbol}`, error);
    return [];
  }
}
