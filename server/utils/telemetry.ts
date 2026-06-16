export interface TelemetryData {
  driverId: string;
  lat: number;
  lng: number;
  status: "idle" | "en_ruta" | "offline";
  vehiclePlate: string;
}

export type TelemetryListener = (data: TelemetryData) => void | Promise<void>;

const listeners = new Set<TelemetryListener>();


export const registerTelemetryListener = (listener: TelemetryListener) => {
  listeners.add(listener);
};

export const unregisterTelemetryListener = (listener: TelemetryListener) => {
  listeners.delete(listener);
};

export const emitTelemetry = (data: TelemetryData) => {
  for (const listener of listeners) {
    try {
      const result = listener(data);
      if (result instanceof Promise) {
        result.catch((err) => {
          console.error("[Telemetry Engine] Error in async listener:", err);
        });
      }
    } catch (err) {
      console.error("[Telemetry Engine] Error executing listener:", err);
    }
  }
};
