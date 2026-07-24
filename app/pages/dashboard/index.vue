<template>
  <div class="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans selection:bg-indigo-500/30">
    <header class="h-12 md:h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 z-20 shrink-0">
       <div class="flex items-center gap-2 cursor-pointer">
         <div class="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
           <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
         </div>
         <div class="hidden md:flex flex-col">
           <span class="font-bold text-sm text-slate-800 leading-tight">GeoLogistics Edge</span>
           <span class="text-[9px] text-slate-500 font-semibold uppercase tracking-widest">Panel de Despacho</span>
         </div>
       </div>
       
       <div class="flex-1 max-w-2xl mx-4 lg:mx-8">
         <div class="bg-white border border-gray-300 rounded-full flex items-center h-9 md:h-10 shadow-sm hover:shadow-md transition-shadow duration-200 divide-x divide-gray-200 pl-4 pr-1.5 py-1">
            <div class="flex-1 flex flex-col justify-center min-w-0 pr-3 cursor-text">
              <span class="text-[9px] md:text-[10px] font-bold tracking-wider text-slate-400 uppercase">Buscar Chofer</span>
              <input v-model="searchPlate" type="text" placeholder="Ej: FL-99-PT" class="text-xs md:text-sm font-medium text-slate-800 bg-transparent border-none outline-none w-full placeholder:font-normal placeholder:text-slate-300">
            </div>
            <div class="hidden sm:flex flex-1 flex-col justify-center min-w-0 px-3 cursor-text">
              <span class="text-[9px] md:text-[10px] font-bold tracking-wider text-slate-400 uppercase">Zona</span>
              <input v-model="searchZone" type="text" placeholder="Todas las zonas" class="text-xs md:text-sm font-medium text-slate-800 bg-transparent border-none outline-none w-full">
            </div>
            <div class="pl-1.5">
              <button class="bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-colors rounded-full p-2 text-white shadow-md shadow-indigo-500/30">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </button>
            </div>
         </div>
       </div>
       
        <div class="flex items-center gap-2">
          <NuxtLink to="/dashboard/routes" class="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Rutas</NuxtLink>
          <NuxtLink to="/dashboard/zones" class="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Zonas</NuxtLink>
          <NuxtLink to="/dashboard/admin" class="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Admin</NuxtLink>
          <NuxtLink to="/dashboard/analytics" class="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Analytics</NuxtLink>
          <button @click="handleLogout" class="text-xs font-semibold text-slate-600 hover:text-red-600 transition-colors">
            Salir
          </button>
          <div class="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors">
            <span class="text-sm">👨‍💻</span>
          </div>
        </div>
    </header>

    <main class="flex-1 flex flex-col-reverse md:flex-row overflow-hidden relative">
      <section class="w-full md:w-120 lg:w-125 bg-white flex flex-col h-[55vh] md:h-full z-10 shadow-[4px_0_24px_rgba(0,0,0,0.04)] relative">
        <div class="px-4 py-2.5 border-b border-gray-100 bg-white/95 backdrop-blur-sm sticky top-0 z-20 flex items-center gap-2 shadow-sm">
           <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Flota</span>
           <div class="flex items-center gap-1.5">
             <button class="shrink-0 px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-full text-[11px] font-semibold transition-colors">
               Todos ({{ stats.total }})
             </button>
             <button class="shrink-0 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-full text-[11px] font-semibold transition-colors flex items-center gap-1.5">
               <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
               En Ruta ({{ stats.enRuta }})
             </button>
             <button class="shrink-0 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 rounded-full text-[11px] font-semibold transition-colors flex items-center gap-1.5">
               <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
               Idle ({{ stats.idle }})
             </button>
           </div>
        </div>
        
        <div class="flex-1 px-5 pb-8 pt-4 bg-slate-50">
           
           <div v-if="pending" class="flex flex-col items-center justify-center p-8 text-indigo-600">
             <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
             <span class="font-medium">Cargando flota...</span>
           </div>
           
           <div v-else-if="error" class="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-medium">
             Error cargando datos: {{ error.message }}
           </div>
           
           <template v-else>
              <RecycleScroller
                v-if="filteredDrivers.length > 0"
                :items="filteredDrivers"
                :item-size="105"
                key-field="id"
                class="custom-scrollbar"
                :style="{ height: 'calc(100vh - 220px)' }"
              >
                <template #default="{ item: driver }">
                  <div
                    class="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-indigo-300 hover:shadow-lg transition-all duration-300 cursor-pointer flex p-3 gap-3 mb-2"
                    @mouseenter="highlightDriver(driver.id)"
                    @mouseleave="unhighlightDriver()"
                  >
                    <div class="relative w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200 shrink-0 overflow-hidden">
                      <span class="text-xl relative z-10 group-hover:scale-110 transition-transform duration-500">🚚</span>
                      <div class="absolute inset-0 opacity-20" :class="driver.status === 'en_ruta' ? 'bg-linear-to-br from-emerald-400 to-transparent' : (driver.status === 'idle' ? 'bg-linear-to-br from-amber-400 to-transparent' : '')"></div>
                    </div>
                    <div class="flex flex-col flex-1 min-w-0 justify-center">
                      <div class="flex justify-between items-center gap-2">
                        <h3 class="font-bold text-slate-900 text-sm leading-snug truncate">{{ driver.vehiclePlate }}</h3>
                        <div class="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                             :class="driver.status === 'en_ruta' ? 'bg-emerald-100 text-emerald-700' : (driver.status === 'idle' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500')">
                          <span v-if="driver.status === 'en_ruta'" class="relative flex h-1.5 w-1.5">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                          </span>
                          <span v-else class="w-1.5 h-1.5 rounded-full" :class="driver.status === 'idle' ? 'bg-amber-500' : 'bg-slate-400'"></span>
                          {{ formatStatus(driver.status) }}
                        </div>
                      </div>
                      
                      <div class="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-500 font-medium">
                        <svg class="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        <span v-if="driver.currentLat && driver.currentLng" class="font-mono truncate">
                          {{ driver.currentLat.toFixed(4) }}, {{ driver.currentLng.toFixed(4) }}
                        </span>
                        <span v-else class="italic text-[10px]">Sin ubicación</span>
                      </div>
                    </div>
                  </div>
               </template>
              </RecycleScroller>
              <div v-if="driverPagination.hasNext" class="py-3 text-center">
                <button
                  @click="loadMoreDrivers"
                  :disabled="loadingMore"
                  class="px-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
                >
                  <span v-if="loadingMore" class="animate-spin inline-block h-3 w-3 border-b-2 border-indigo-600 mr-2"></span>
                  {{ loadingMore ? 'Cargando...' : `Cargar más (${driverPagination.total - driversList.length} restantes)` }}
                </button>
              </div>
              
              <div v-if="driversList.length === 0" class="text-center py-12 text-slate-400">
                <h3 class="text-sm font-semibold">No hay conductores registrados</h3>
                <p class="text-xs mt-1">La flota está vacía.</p>
              </div>
              <div v-else-if="filteredDrivers.length === 0" class="text-center py-12 text-slate-400">
                <h3 class="text-sm font-semibold">Sin resultados</h3>
                <p class="text-xs mt-1">No se encontraron conductores con "{{ searchPlate || searchZone }}"</p>
              </div>
           </template>
        </div>
      </section>
      <section class="flex-1 h-[45vh] md:h-full relative bg-slate-200 z-0 border-l border-gray-200">
        <div v-if="pending" class="absolute inset-0 flex items-center justify-center bg-slate-100/50 z-50 backdrop-blur-sm">
          <div class="flex flex-col items-center gap-4 bg-white p-6 rounded-2xl shadow-xl">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            <span class="text-slate-800 font-bold tracking-tight">Cargando territorio...</span>
          </div>
        </div>
        
        <ClientOnly>
          <MapCore 
            v-if="!pending && dashboardData"
            :zones="zones"
            :drivers="driversList"
            :highlighted-driver-id="highlightedDriverId"
            class="rounded-none! border-none! shadow-none!"
          />
        </ClientOnly>

        <div class="absolute bottom-6 right-6 z-1000 flex flex-col gap-3">
           <button class="bg-white p-3 rounded-lg shadow-lg border border-gray-200 text-slate-700 hover:bg-gray-50 active:scale-95 transition-all focus:outline-none">
             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
           </button>
           <button class="bg-white p-3 rounded-lg shadow-lg border border-gray-200 text-indigo-600 hover:bg-gray-50 active:scale-95 transition-all focus:outline-none">
             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path></svg>
           </button>
           <div class="h-4"></div>
           <button class="bg-white p-3 rounded-lg shadow-lg border border-gray-200 </template>
 hover:bg-gray-50 active:scale-95 transition-all focus:outline-none text-indigo-600" title="Centrar mapa">
             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
           </button>
        </div>
      </section>

    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { RecycleScroller } from 'vue-virtual-scroller';
import { authClient } from '../../utils/auth';
import { fetchWithRetry } from '../../utils/sessionRefresh';
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';

const cookieHeaders = import.meta.server ? useRequestHeaders(['cookie']) : (import.meta.dev ? { 'x-bypass-auth': 'true' } : undefined)
const { data: dashboardData, pending, error } = await useFetch('/api/dashboard', {
  headers: cookieHeaders,
});

const zones = computed(() => dashboardData.value?.data?.zones ?? []);
const stops = computed(() => dashboardData.value?.data?.stops ?? []);

const driverPage = ref(1);
const driverLimit = 20;
const driversList = ref<Array<any>>([]);
const driverPagination = ref({ total: 0, totalPages: 0, hasNext: false });
const loadingMore = ref(false);

const searchPlate = usePersistedRef<string>('dashboard:searchPlate', '');
const searchZone = usePersistedRef<string>('dashboard:searchZone', '');
const highlightedDriverId = ref<string | null>(null);

const highlightDriver = (driverId: string) => {
  highlightedDriverId.value = driverId;
};

const unhighlightDriver = () => {
  highlightedDriverId.value = null;
};

const filteredDrivers = computed(() => {
  let list = driversList.value;

  if (searchPlate.value) {
    const q = searchPlate.value.toLowerCase();
    list = list.filter(d => d.vehiclePlate?.toLowerCase().includes(q));
  }

  if (searchZone.value) {
    const q = searchZone.value.toLowerCase();
    list = list.filter(d => {
      return d.zoneName?.toLowerCase().includes(q);
    });
  }

  return list;
});

const fetchDrivers = async (page: number, append = false) => {
  try {
    const res = await fetchWithRetry<any>('/api/drivers/paginated', {
      params: { page, limit: driverLimit },
      headers: import.meta.dev ? { 'x-bypass-auth': 'true' } : {},
    });
    if (append) {
      driversList.value = [...driversList.value, ...res.data.drivers];
    } else {
      driversList.value = res.data.drivers;
    }
    driverPagination.value = res.data.pagination;
  } catch (e) {
    console.error('Error fetching drivers:', e);
  }
};

await fetchDrivers(1);

const loadMoreDrivers = async () => {
  if (!driverPagination.value.hasNext || loadingMore.value) return;
  loadingMore.value = true;
  driverPage.value++;
  await fetchDrivers(driverPage.value, true);
  loadingMore.value = false;
};

const stats = computed(() => {
  const list = filteredDrivers.value;
  return {
    total: list.length,
    enRuta: list.filter(d => d.status === 'en_ruta').length,
    idle: list.filter(d => d.status === 'idle').length,
  };
});

const formatStatus = (status: string) => {
  if (!status) return 'Desconocido';
  if (status === 'en_ruta') return 'En Ruta';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const getStatusColor = (status: string) => {
  if (status === 'en_ruta') return 'bg-emerald-500';
  if (status === 'idle') return 'bg-amber-500';
  return 'bg-slate-400';
};

let eventSource: EventSource | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY = 30000;

const connectSSE = () => {
  if (eventSource) {
    eventSource.close();
  }

  eventSource = new EventSource('/api/drivers/stream');

  eventSource.onopen = () => {
    reconnectAttempts = 0;
    console.log('[SSE] Connected successfully');
  };

  eventSource.onmessage = (event) => {
    try {
      const update = JSON.parse(event.data);
      if (update.type === 'telemetry-update') {
        const payload = update.payload;

        const driverIndex = driversList.value.findIndex(d => d.id === payload.driverId);
        if (driverIndex !== -1) {
          driversList.value[driverIndex] = {
            ...driversList.value[driverIndex],
            currentLat: payload.lat,
            currentLng: payload.lng,
            status: payload.status,
            lastUpdate: Date.now()
          };
        } else {
          console.log('[SSE] Driver not found for update:', payload.driverId);
        }
      }
    } catch (e) {
      console.error('[SSE] Error parsing event data:', e);
    }
  };

  eventSource.onerror = () => {
    console.error('[SSE] Connection error. Attempting reconnect...');
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
    reconnectAttempts++;

    reconnectTimer = setTimeout(() => {
      console.log(`[SSE] Reconnecting... (attempt ${reconnectAttempts}, delay ${delay}ms)`);
      connectSSE();
    }, delay);
  };
};

onMounted(() => {
  connectSSE();
});

const handleLogout = async () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
  try {
    await authClient.signOut()
    await navigateTo('/login')
  } catch {
    await navigateTo('/login')
  }
}

onBeforeUnmount(() => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
});
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 20px;
}
</style>
