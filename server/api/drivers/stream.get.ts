import { createEventStream, setHeaders } from "h3";
import { requireDispatcher } from "../../utils/guards";
import { applyRateLimit } from "../../utils/rateLimit";
import { registerTelemetryListener, unregisterTelemetryListener, type TelemetryData } from "../../utils/telemetry";

export default defineEventHandler(async (event) => {
  applyRateLimit(event, {
    maxRequests: 5,
    windowMs: 10000,
    keyPrefix: "sse",
  });

  await requireDispatcher(event);

  setHeaders(event, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
  });

  const eventStream = createEventStream(event);

  const telemetryListener = async (data: TelemetryData) => {
    try {
      await eventStream.push({
        event: "telemetry-update",
        data: JSON.stringify(data),
      });
    } catch (err) {
      console.error("[SSE Stream] Failed to push event down the stream:", err);
    }
  };

  registerTelemetryListener(telemetryListener);

  eventStream.onClosed(async () => {
    unregisterTelemetryListener(telemetryListener);
    await eventStream.close();
  });

  return eventStream.send();
});
