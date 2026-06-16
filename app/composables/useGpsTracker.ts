import { ref, onBeforeUnmount } from 'vue';

export interface GpsTrackerOptions {
  minDistanceMeters?: number;
  minIntervalMs?: number;
}

export const useGpsTracker = (options: GpsTrackerOptions = {}) => {
  const {
    minDistanceMeters = 50,
    minIntervalMs = 10000,
  } = options;

  const coords = ref<{ lat: number; lng: number } | null>(null);
  const error = ref<string | null>(null);
  const isTracking = ref(false);
  const isSupported = ref(false);

  let watchId: number | null = null;
  let lastEmitTime = 0;
  let lastEmitLat = 0;
  let lastEmitLng = 0;

  if (import.meta.client) {
    isSupported.value = 'geolocation' in navigator;
  }


  const haversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const shouldEmit = (newLat: number, newLng: number): boolean => {
    const now = Date.now();
    const timeSinceLastEmit = now - lastEmitTime;

    if (lastEmitTime === 0) return true;

    if (timeSinceLastEmit >= minIntervalMs) return true;

    const distance = haversineDistance(lastEmitLat, lastEmitLng, newLat, newLng);
    if (distance >= minDistanceMeters) return true;

    return false;
  };

  const startTracking = () => {
    if (!isSupported.value) {
      error.value = 'Geolocalización no soportada en este dispositivo.';
      return;
    }

    error.value = null;
    isTracking.value = true;
    lastEmitTime = 0;
    lastEmitLat = 0;
    lastEmitLng = 0;

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLat = position.coords.latitude;
        const newLng = position.coords.longitude;

        if (shouldEmit(newLat, newLng)) {
          lastEmitTime = Date.now();
          lastEmitLat = newLat;
          lastEmitLng = newLng;
          coords.value = { lat: newLat, lng: newLng };
        }
      },
      (err) => {
        console.error('Error GPS:', err);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            error.value = 'Permiso de GPS denegado.';
            break;
          case err.POSITION_UNAVAILABLE:
            error.value = 'Información de ubicación no disponible.';
            break;
          case err.TIMEOUT:
            error.value = 'Tiempo de espera agotado al obtener ubicación.';
            break;
          default:
            error.value = 'Error desconocido al acceder al GPS.';
            break;
        }
        isTracking.value = false;
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
    isTracking.value = false;
  };

  onBeforeUnmount(() => {
    stopTracking();
  });

  return {
    coords,
    error,
    isTracking,
    isSupported,
    startTracking,
    stopTracking,
  };
};
