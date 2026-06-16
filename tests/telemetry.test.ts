import { describe, it, expect, vi } from "vitest";
import {
  registerTelemetryListener,
  unregisterTelemetryListener,
  emitTelemetry,
} from "../server/utils/telemetry";
import type { TelemetryData } from "../server/utils/telemetry";

describe("Telemetry Bus", () => {
  const sampleData: TelemetryData = {
    driverId: "drv-123",
    lat: -33.456,
    lng: -70.648,
    status: "en_ruta",
    vehiclePlate: "FL-99-PT",
  };

  it("registers and receives telemetry events", () => {
    const listener = vi.fn();
    registerTelemetryListener(listener);

    emitTelemetry(sampleData);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(sampleData);

    unregisterTelemetryListener(listener);
  });

  it("does not call unregistered listeners", () => {
    const listener = vi.fn();
    registerTelemetryListener(listener);
    unregisterTelemetryListener(listener);

    emitTelemetry(sampleData);

    expect(listener).not.toHaveBeenCalled();
  });

  it("handles async listeners without blocking", async () => {
    const asyncListener = vi.fn().mockResolvedValue(undefined);
    registerTelemetryListener(asyncListener);

    emitTelemetry(sampleData);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(asyncListener).toHaveBeenCalledTimes(1);

    unregisterTelemetryListener(asyncListener);
  });

  it("catches errors in listeners without crashing", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const badListener = vi.fn().mockImplementation(() => {
      throw new Error("Boom");
    });

    registerTelemetryListener(badListener);
    emitTelemetry(sampleData);

    expect(badListener).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith(
      "[Telemetry Engine] Error executing listener:",
      expect.any(Error)
    );

    unregisterTelemetryListener(badListener);
    consoleSpy.mockRestore();
  });

  it("supports multiple listeners simultaneously", () => {
    const listenerA = vi.fn();
    const listenerB = vi.fn();

    registerTelemetryListener(listenerA);
    registerTelemetryListener(listenerB);

    emitTelemetry(sampleData);

    expect(listenerA).toHaveBeenCalledTimes(1);
    expect(listenerB).toHaveBeenCalledTimes(1);

    unregisterTelemetryListener(listenerA);
    unregisterTelemetryListener(listenerB);
  });
});
