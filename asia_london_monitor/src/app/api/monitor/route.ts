import { CANDLE_HISTORY_COUNT, PAIRS, POLL_INTERVAL_MS } from "@/config/settings";
import { getLatestCandles, sleep } from "@/lib/data/fetcher";
import { SignalEngine } from "@/lib/strategy/signals";
import { sendSignalAlert } from "@/lib/bot/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const engines = new Map<string, SignalEngine>();

function getEngine(pair: string): SignalEngine {
  if (!engines.has(pair)) engines.set(pair, new SignalEngine(pair));
  return engines.get(pair) as SignalEngine;
}

export async function GET(request: Request): Promise<Response> {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      let timer: NodeJS.Timeout;
      let running = true;

      const tick = async (): Promise<void> => {
        for (const pair of PAIRS) {
          if (!running || request.signal.aborted) break;
          try {
            const candles = await getLatestCandles(pair, CANDLE_HISTORY_COUNT);
            const engine = getEngine(pair);
            const signal = engine.process(candles);
            engine.updateStatuses(candles);
            if (signal) {
              await sendSignalAlert(signal);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(signal)}\n\n`));
            }
          } catch (error) {
            console.error(`Monitor loop error for ${pair}`, error);
          }
          await sleep(1000);
        }
        if (running && !request.signal.aborted) {
          controller.enqueue(encoder.encode("event: heartbeat\ndata: ok\n\n"));
        }
      };

      tick().catch((error) => console.error("Initial monitor tick error", error));
      timer = setInterval(() => {
        tick().catch((error) => console.error("Scheduled monitor tick error", error));
      }, POLL_INTERVAL_MS);

      request.signal.addEventListener("abort", () => {
        running = false;
        clearInterval(timer);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
