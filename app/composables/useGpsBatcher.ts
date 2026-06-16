import { ref, onBeforeUnmount } from 'vue';

export interface GpsPoint {
  lat: number;
  lng: number;
  accuracy?: number;
  speed?: number;
  recordedAt: string;
}

export interface GpsBatcherOptions {
  flushIntervalMs?: number;
  maxBufferSize?: number;
}

export const useGpsBatcher = (options: GpsBatcherOptions = {}) => {
  const {
    flushIntervalMs = 30000,
    maxBufferSize = 20,
  } = options;

  const buffer = ref<GpsPoint[]>([]);
  const isFlushing = ref(false);
  let flushTimer: ReturnType<typeof setInterval> | null = null;

  const flush = async () => {
    if (buffer.value.length === 0 || isFlushing.value) return;

    const pointsToSend = [...buffer.value];
    buffer.value = [];
    isFlushing.value = true;

    try {
      await $fetch('/api/drivers/history/batch', {
        method: 'POST',
        headers: import.meta.dev ? { 'x-bypass-auth': 'true' } : {},
        body: { points: pointsToSend },
      });
    } catch (err) {
      console.error('[GPS Batcher] Error flushing:', err);
      buffer.value = [...pointsToSend, ...buffer.value];
    } finally {
      isFlushing.value = false;
    }
  };

 
  const addPoint = (point: Omit<GpsPoint, 'recordedAt'>) => {
    buffer.value.push({
      ...point,
      recordedAt: new Date().toISOString(),
    });

    if (buffer.value.length >= maxBufferSize) {
      flush();
    }
  };

  const startBatcher = () => {
    if (flushTimer) return;
    flushTimer = setInterval(() => {
      flush();
    }, flushIntervalMs);
  };

  
  const stopBatcher = async () => {
    if (flushTimer) {
      clearInterval(flushTimer);
      flushTimer = null;
    }
   
    await flush();
  };

  if (import.meta.client) {
    const handleBeforeUnload = () => {
      if (buffer.value.length > 0) {
        const data = JSON.stringify({ points: buffer.value });
        navigator.sendBeacon('/api/drivers/history/batch', new Blob([data], { type: 'application/json' }));
        buffer.value = [];
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    onBeforeUnmount(() => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      stopBatcher();
    });
  }

  return {
    buffer,
    isFlushing,
    addPoint,
    flush,
    startBatcher,
    stopBatcher,
  };
};
