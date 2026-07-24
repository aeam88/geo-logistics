<template>
  <div class="min-h-screen bg-slate-900 text-white font-sans flex flex-col">
    <header class="px-4 py-2.5 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center">
      <div>
        <h1 class="text-base font-bold bg-clip-text text-transparent bg-linear-to-r from-emerald-400 to-indigo-400">
          Mi Ruta Hoy
        </h1>
        <p class="text-slate-400 text-[10px] mt-0.5">Patente: <span class="font-mono text-slate-200">{{ vehiclePlate }}</span></p>
      </div>
      <div class="flex items-center gap-2">
        <span v-if="isOffline" class="text-[9px] text-rose-400 bg-rose-400/10 px-1.5 py-0.5 rounded font-medium animate-pulse">⚡ Offline</span>
        <span v-else-if="pendingSync > 0" class="text-[9px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded font-medium">🔄 {{ pendingSync }}</span>
        <span v-else class="text-[9px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded font-medium">✓ Online</span>
        <span v-if="pushSupported && pushSubscribed" class="text-[9px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded font-medium">🔔</span>
        <span v-else-if="pushSupported" class="text-[9px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded font-medium cursor-pointer" @click="subscribePush">🔔 Off</span>
        <button @click="handleLogout" class="text-[10px] text-slate-400 hover:text-red-400 transition-colors font-semibold px-2 py-1">
          Salir
        </button>
        <div class="h-7 w-7 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 shadow-inner">
          <span class="text-sm">🧑‍✈️</span>
        </div>
      </div>
    </header>

    <div v-if="pending" class="flex-1 flex items-center justify-center">
      <div class="flex flex-col items-center gap-3 text-indigo-400">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400"></div>
        <span class="text-sm font-medium">Cargando ruta...</span>
      </div>
    </div>

    <div v-else-if="!routeData" class="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div class="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-700">
        <svg class="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.447-.894L15 7m0 13V7"/></svg>
      </div>
      <h2 class="text-xl font-bold text-slate-300 mb-1">Sin ruta asignada</h2>
      <p class="text-sm text-slate-500">No tienes una ruta programada para hoy. Descansa o contacta a tu despachador.</p>
    </div>

    <main v-else class="flex-1 flex flex-col">
      <div class="p-4 bg-slate-800/50 border-b border-slate-800">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <div>
              <div class="text-sm font-bold text-white">Ruta {{ routeData.route.status === 'despachada' ? 'Activa' : 'Pendiente' }}</div>
              <div class="text-[10px] text-slate-400">{{ completedStops }}/{{ stopsList.length }} entregas</div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-2xl font-bold text-white">{{ progressPercent }}%</div>
            <div class="text-[10px] text-slate-400">completado</div>
          </div>
        </div>
        
        <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div class="h-full bg-linear-to-r from-emerald-500 to-indigo-500 rounded-full transition-all duration-700" :style="{ width: progressPercent + '%' }"></div>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-3">
        <div
          v-for="stop in stopsList"
          :key="stop.id"
          @click="openStopDetail(stop)"
          class="group bg-slate-800 border rounded-2xl p-4 transition-all active:scale-[0.98] cursor-pointer relative overflow-hidden"
          :class="stopBorderClass(stop.status)"
        >
          <div class="absolute left-0 top-0 bottom-0 w-1 transition-colors" :class="stopStripeClass(stop.status)"></div>

          <div class="flex items-start gap-3 pl-2">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors"
              :class="stopOrderClass(stop.status)">
              {{ stop.stopOrder }}
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <h3 class="text-sm font-bold text-white truncate">{{ stop.clientName }}</h3>
                  <p class="text-xs text-slate-400 truncate mt-0.5">{{ stop.address }}</p>
                </div>
                <span class="shrink-0 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider"
                  :class="stopStatusBadgeClass(stop.status)">
                  {{ stop.status === 'entregado' ? 'Entregado' : stop.status === 'fallido' ? 'Fallido' : 'Pendiente' }}
                </span>
              </div>

              <div class="flex items-center gap-3 mt-3">
                <div v-if="stop.timeWindowStart" class="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-700/50 px-2 py-1 rounded-md">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  {{ stop.timeWindowStart }} - {{ stop.timeWindowEnd }}
                </div>
                <div v-if="stop.orderWeight" class="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-700/50 px-2 py-1 rounded-md">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                  {{ stop.orderWeight }} kg
                </div>
                <div v-if="stop.orderItems" class="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-700/50 px-2 py-1 rounded-md">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                  {{ stop.orderItems }} items
                </div>
              </div>

              <div v-if="stop.deliveredAt" class="mt-2 text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                Entregado a las {{ formatTime(stop.deliveredAt) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <div v-if="selectedStop" class="fixed inset-0 z-50 flex flex-col">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="selectedStop = null"></div>

      <div class="relative mt-auto bg-slate-800 rounded-t-3xl max-h-[90vh] overflow-y-auto shadow-2xl border-t border-slate-700">
        <div class="flex justify-center pt-3 pb-1">
          <div class="w-12 h-1.5 bg-slate-600 rounded-full"></div>
        </div>

        <div class="p-6 space-y-5">
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="text-2xl font-bold text-white">#{{ selectedStop.stopOrder }}</span>
                <span class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
                  :class="stopStatusBadgeClass(selectedStop.status)">
                  {{ selectedStop.status === 'entregado' ? 'Entregado' : selectedStop.status === 'fallido' ? 'Fallido' : 'Pendiente' }}
                </span>
              </div>
              <h2 class="text-xl font-bold text-white">{{ selectedStop.clientName }}</h2>
              <p class="text-sm text-slate-400 mt-1">{{ selectedStop.address }}</p>
            </div>
            <button @click="selectedStop = null" class="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="bg-slate-700/50 rounded-xl p-3 border border-slate-700">
              <div class="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Ventana Horaria</div>
              <div class="text-sm font-semibold text-white mt-1">{{ selectedStop.timeWindowStart || '--:--' }} - {{ selectedStop.timeWindowEnd || '--:--' }}</div>
            </div>
            <div class="bg-slate-700/50 rounded-xl p-3 border border-slate-700">
              <div class="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Peso</div>
              <div class="text-sm font-semibold text-white mt-1">{{ selectedStop.orderWeight || 0 }} kg</div>
            </div>
            <div class="bg-slate-700/50 rounded-xl p-3 border border-slate-700">
              <div class="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Items</div>
              <div class="text-sm font-semibold text-white mt-1">{{ selectedStop.orderItems || 0 }}</div>
            </div>
            <div class="bg-slate-700/50 rounded-xl p-3 border border-slate-700">
              <div class="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Teléfono</div>
              <div class="text-sm font-semibold text-white mt-1">{{ selectedStop.clientPhone || 'N/A' }}</div>
            </div>
          </div>

          <div v-if="selectedStop.orderNotes" class="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <div class="flex items-center gap-2 mb-2">
              <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span class="text-xs font-bold text-amber-400 uppercase tracking-wider">Notas de la orden</span>
            </div>
            <p class="text-sm text-amber-200/80">{{ selectedStop.orderNotes }}</p>
          </div>

          <div v-if="selectedStop.status === 'pendiente'" class="space-y-4 pt-2">
            <div class="bg-slate-700/30 rounded-xl p-4 border border-slate-700 border-dashed">
              <label class="flex flex-col items-center gap-2 cursor-pointer">
                <div v-if="!capturedPhoto" class="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center">
                  <svg class="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </div>
                <img v-else :src="capturedPhoto" class="w-16 h-16 rounded-full object-cover border-2 border-indigo-500" />
                <span class="text-xs text-slate-400 font-medium">{{ capturedPhoto ? 'Foto capturada' : 'Tomar foto de entrega (opcional)' }}</span>
                <input type="file" accept="image/*" capture="environment" class="hidden" @change="handlePhotoCapture" />
              </label>
            </div>

            <div>
              <label class="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-2 block">Firma digital del receptor (opcional)</label>
              <SignaturePad ref="signaturePadRef" @signature="onSignature" />
            </div>

            <div>
              <label class="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1.5 block">Nombre de quien recibe (opcional)</label>
              <input v-model="recipientName" type="text" placeholder="Ej: Juan Pérez" class="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div>
              <label class="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1.5 block">Notas adicionales</label>
              <textarea v-model="deliveryNotes" rows="2" placeholder="Comentarios sobre la entrega..." class="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"></textarea>
            </div>

            <div class="grid grid-cols-2 gap-3 pt-2">
              <button
                @click="markAsFailed"
                :disabled="acting"
                class="py-4 rounded-2xl font-bold text-sm bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                Fallido
              </button>
              <button
                @click="markAsDelivered"
                :disabled="acting"
                class="py-4 rounded-2xl font-bold text-sm bg-emerald-500 text-slate-900 hover:bg-emerald-400 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <svg v-if="!acting" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                <div v-else class="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-900"></div>
                {{ acting ? 'Guardando...' : 'Entregado' }}
              </button>
            </div>
          </div>

          <div v-else-if="selectedStop.status === 'entregado'" class="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
            <div class="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-2">
              <svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            </div>
            <div class="text-sm font-bold text-emerald-400">Entrega completada</div>
            <div class="text-xs text-emerald-300/70 mt-1">{{ formatTime(selectedStop.deliveredAt) }}</div>
          </div>

          <div v-else-if="selectedStop.status === 'fallido'" class="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-center">
            <div class="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center mx-auto mb-2">
              <svg class="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </div>
            <div class="text-sm font-bold text-rose-400">Entrega fallida</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useGpsTracker } from '../../composables/useGpsTracker';
import { authClient } from '../../utils/auth';
import { saveRouteOffline, getRouteOffline, addToOfflineQueue, flushOfflineQueue, clearOfflineData } from '../../utils/offlineStorage';

const session = authClient.useSession();
const vehiclePlate = ref('---');
const isOffline = ref(!navigator.onLine);
const pendingSync = ref(0);

const { data, pending, error, refresh } = await useFetch('/api/drivers/my-route', {
  headers: import.meta.dev ? { 'x-bypass-auth': 'true' } : {},
});
const routeData = ref<any>(null);
const stopsList = computed(() => routeData.value?.stops || []);

watchEffect(async () => {
  if (data.value?.data) {
    routeData.value = data.value.data;
    if (data.value.data.route) {
      await saveRouteOffline(data.value.data.route, data.value.data.stops || []);
    }
  } else if (!pending.value && (error.value || !navigator.onLine)) {
    const offlineData = await getRouteOffline();
    if (offlineData) {
      routeData.value = offlineData;
      console.log('[Chofer] Loaded route from offline storage');
    }
  }
});

watch(() => session.value.data, async (userSession) => {
  if (!userSession?.user) return;
  try {
    const res = await $fetch('/api/drivers/me');
    if (res.success) vehiclePlate.value = res.data.vehiclePlate;
  } catch {}
}, { immediate: true });

const completedStops = computed(() =>
  stopsList.value.filter((s: any) => s.status === 'entregado').length
);
const progressPercent = computed(() => {
  if (stopsList.value.length === 0) return 0;
  return Math.round((completedStops.value / stopsList.value.length) * 100);
});

const handleOnline = async () => {
  isOffline.value = false;
  console.log('[Chofer] Back online, syncing...');
  await syncOfflineQueue();
};

const handleOffline = () => {
  isOffline.value = true;
  console.log('[Chofer] Gone offline');
};

const syncOfflineQueue = async () => {
  const queue = await flushOfflineQueue();
  if (queue.length === 0) return;

  console.log(`[Chofer] Syncing ${queue.length} offline items...`);
  let synced = 0;

  for (const item of queue) {
    try {
      if (item.type === 'gps_update') {
        await $fetch('/api/drivers/update', {
          method: 'POST',
          headers: import.meta.dev ? { 'x-bypass-auth': 'true' } : undefined,
          body: item.data,
        });
        synced++;
      } else if (item.type === 'stop_update') {
        await $fetch(`/api/stops/${item.data.stopId}/${item.data.action}`, {
          method: 'POST',
          headers: import.meta.dev ? { 'x-bypass-auth': 'true' } : undefined,
          body: item.data.body,
        });
        synced++;
      }
    } catch (err) {
      console.error('[Chofer] Sync failed:', item.type, err);
      await addToOfflineQueue(item);
    }
  }

  pendingSync.value = queue.length - synced;
  if (synced > 0) console.log(`[Chofer] Synced ${synced}/${queue.length}`);
};

const { coords, error: gpsError, isTracking, startTracking, stopTracking } = useGpsTracker();
const { addPoint, startBatcher, stopBatcher } = useGpsBatcher();
const { isSupported: pushSupported, isSubscribed: pushSubscribed, subscribe: subscribePush } = usePushNotifications();
const status = ref<'idle' | 'en_ruta'>('idle');
const isEnRuta = computed(() => status.value === 'en_ruta');

const toggleRoute = async () => {
  if (isEnRuta.value) {
    status.value = 'idle';
    stopTracking();
    await stopBatcher();
    await sendUpdate('idle', null, null);
  } else {
    status.value = 'en_ruta';
    startTracking();
    startBatcher();
    if (pushSupported.value && !pushSubscribed.value) {
      await subscribePush();
    }
    if (!coords.value) {
      await sendUpdate('en_ruta', -33.4560, -70.6480);
    }
  }
};

watch(coords, async (newCoords) => {
  if (!isEnRuta.value || !newCoords) return;
  await sendUpdate('en_ruta', newCoords.lat, newCoords.lng);
  addPoint({ lat: newCoords.lat, lng: newCoords.lng });
});

const sendUpdate = async (currentStatus: string, lat: number | null, lng: number | null) => {
  const l = lat ?? coords.value?.lat;
  const g = lng ?? coords.value?.lng;
  if (l === null || g === null) return;

  const payload = { lat: l, lng: g, status: currentStatus };

  if (!navigator.onLine) {
    await addToOfflineQueue({ type: 'gps_update', data: payload });
    return;
  }

  try {
    await $fetch('/api/drivers/update', {
      method: 'POST',
      headers: import.meta.dev ? { 'x-bypass-auth': 'true' } : undefined,
      body: payload,
    });
  } catch (err) {
    await addToOfflineQueue({ type: 'gps_update', data: payload });
  }
};

const selectedStop = ref<any>(null);
const capturedPhoto = ref<string | null>(null);
const signatureData = ref<string | null>(null);
const recipientName = ref('');
const deliveryNotes = ref('');
const acting = ref(false);
const signaturePadRef = ref<{ clear: () => void } | null>(null);

const openStopDetail = (stop: any) => {
  selectedStop.value = stop;
  capturedPhoto.value = null;
  signatureData.value = null;
  recipientName.value = '';
  deliveryNotes.value = '';

  if (signaturePadRef.value) signaturePadRef.value.clear();
};

const onSignature = (data: string) => {
  signatureData.value = data;
};

const handlePhotoCapture = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    capturedPhoto.value = ev.target?.result as string;
  };
  reader.readAsDataURL(file);
};

const markAsDelivered = async () => {
  if (!selectedStop.value) return;
  acting.value = true;

  const payload = {
    photoBase64: capturedPhoto.value || undefined,
    signatureData: signatureData.value || undefined,
    recipientName: recipientName.value || undefined,
    notes: deliveryNotes.value || undefined,
  };

  if (!navigator.onLine) {
    await addToOfflineQueue({
      type: 'stop_update',
      data: { stopId: selectedStop.value.id, action: 'deliver', body: payload },
    });
    const idx = stopsList.value.findIndex((s: any) => s.id === selectedStop.value!.id);
    if (idx !== -1) {
      routeData.value.stops[idx] = { ...routeData.value.stops[idx], status: 'entregado', deliveredAt: new Date().toISOString() };
    }
    selectedStop.value = null;
    acting.value = false;
    return;
  }

  try {
    await $fetch(`/api/stops/${selectedStop.value.id}/deliver`, {
      method: 'POST',
      headers: import.meta.dev ? { 'x-bypass-auth': 'true' } : {},
      body: payload,
    });
    selectedStop.value = null;
    refresh();
  } catch (e: any) {
    await addToOfflineQueue({
      type: 'stop_update',
      data: { stopId: selectedStop.value!.id, action: 'deliver', body: payload },
    });
    selectedStop.value = null;
  } finally {
    acting.value = false;
  }
};

const markAsFailed = async () => {
  if (!selectedStop.value) return;
  const reason = prompt('¿Por qué no se pudo entregar?');
  if (!reason) return;
  acting.value = true;

  const payload = { reason };

  if (!navigator.onLine) {
    await addToOfflineQueue({
      type: 'stop_update',
      data: { stopId: selectedStop.value.id, action: 'fail', body: payload },
    });
    const idx = stopsList.value.findIndex((s: any) => s.id === selectedStop.value!.id);
    if (idx !== -1) {
      routeData.value.stops[idx] = { ...routeData.value.stops[idx], status: 'fallido' };
    }
    selectedStop.value = null;
    acting.value = false;
    return;
  }

  try {
    await $fetch(`/api/stops/${selectedStop.value.id}/fail`, {
      method: 'POST',
      headers: import.meta.dev ? { 'x-bypass-auth': 'true' } : {},
      body: payload,
    });
    selectedStop.value = null;
    refresh();
  } catch (e: any) {
    await addToOfflineQueue({
      type: 'stop_update',
      data: { stopId: selectedStop.value!.id, action: 'fail', body: payload },
    });
    selectedStop.value = null;
  } finally {
    acting.value = false;
  }
};

const stopBorderClass = (status: string) => {
  if (status === 'entregado') return 'border-emerald-500/30 bg-emerald-500/5';
  if (status === 'fallido') return 'border-rose-500/30 bg-rose-500/5';
  return 'border-slate-700 hover:border-indigo-500/50';
};

const stopStripeClass = (status: string) => {
  if (status === 'entregado') return 'bg-emerald-500';
  if (status === 'fallido') return 'bg-rose-500';
  return 'bg-indigo-500';
};

const stopOrderClass = (status: string) => {
  if (status === 'entregado') return 'bg-emerald-500/20 text-emerald-400';
  if (status === 'fallido') return 'bg-rose-500/20 text-rose-400';
  return 'bg-indigo-500/20 text-indigo-400';
};

const stopStatusBadgeClass = (status: string) => {
  if (status === 'entregado') return 'bg-emerald-500/20 text-emerald-400';
  if (status === 'fallido') return 'bg-rose-500/20 text-rose-400';
  return 'bg-amber-500/20 text-amber-400';
};

const formatTime = (timestamp: string | number | Date | null) => {
  if (!timestamp) return '--:--';
  const d = new Date(timestamp);
  return d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
};

const handleLogout = async () => {
  try { await authClient.signOut(); } catch {}
  await navigateTo('/login');
};
</script>
