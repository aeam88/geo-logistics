<template>
  <div class="min-h-screen bg-slate-50 font-sans">
    <header class="h-12 md:h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-md">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
        </div>
        <span class="font-bold text-sm text-slate-800">Analytics</span>
      </div>
      <div class="flex items-center gap-2">
        <NuxtLink to="/dashboard" class="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors">← Volver</NuxtLink>
        <button @click="exportCSV" class="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors">
          Exportar CSV
        </button>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-6">
      <div class="flex flex-wrap gap-3 mb-6">
        <div class="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm">
          <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Desde</label>
          <input v-model="dateFrom" type="date" class="bg-transparent text-sm font-medium text-slate-700 outline-none">
        </div>
        <div class="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm">
          <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hasta</label>
          <input v-model="dateTo" type="date" class="bg-transparent text-sm font-medium text-slate-700 outline-none">
        </div>
        <button @click="fetchAnalytics" class="px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors">
          Actualizar
        </button>
      </div>

      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>

      <template v-else-if="analytics">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Rutas Totales</div>
            <div class="text-2xl font-bold text-slate-800">{{ analytics.routes.total }}</div>
            <div class="text-xs text-slate-500 mt-1">{{ analytics.routes.completed }} completadas</div>
          </div>
          <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tasa de Entrega</div>
            <div class="text-2xl font-bold" :class="analytics.deliveries.successRate >= 90 ? 'text-emerald-600' : analytics.deliveries.successRate >= 70 ? 'text-amber-600' : 'text-rose-600'">
              {{ analytics.deliveries.successRate }}%
            </div>
            <div class="text-xs text-slate-500 mt-1">{{ analytics.deliveries.delivered }}/{{ analytics.deliveries.total }}</div>
          </div>
          <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Distancia Total</div>
            <div class="text-2xl font-bold text-slate-800">{{ analytics.performance.totalDistanceKm }} km</div>
            <div class="text-xs text-slate-500 mt-1">Promedio: {{ analytics.performance.avgDistanceKm }} km/ruta</div>
          </div>
          <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Conductores</div>
            <div class="text-2xl font-bold text-slate-800">{{ analytics.drivers.active }}<span class="text-sm text-slate-400">/{{ analytics.drivers.total }}</span></div>
            <div class="text-xs text-slate-500 mt-1">activos ahora</div>
          </div>
        </div>

        <div class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mb-6">
          <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Rutas por Día</h3>
          <div class="flex items-end gap-2 h-40">
            <div v-for="day in analytics.routesByDay" :key="day.date" class="flex-1 flex flex-col items-center gap-1">
              <div class="text-[10px] font-bold text-slate-600">{{ day.total }}</div>
              <div class="w-full bg-indigo-100 rounded-t-lg relative" :style="{ height: barHeight(day.total) + 'px' }">
                <div class="absolute bottom-0 w-full bg-indigo-500 rounded-t-lg transition-all" :style="{ height: (day.completed / day.total * 100) + '%' }"></div>
              </div>
              <div class="text-[9px] text-slate-400 font-mono">{{ day.date.slice(5) }}</div>
            </div>
          </div>
          <div class="flex items-center gap-4 mt-3 text-[10px] text-slate-400">
            <span class="flex items-center gap-1"><span class="w-3 h-3 bg-indigo-500 rounded"></span> Completadas</span>
            <span class="flex items-center gap-1"><span class="w-3 h-3 bg-indigo-100 rounded"></span> Totales</span>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Estado de Rutas</h3>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span class="text-sm text-slate-700">Completadas</span>
                </div>
                <span class="text-sm font-bold text-slate-800">{{ analytics.routes.completed }}</span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-2">
                <div class="bg-emerald-500 h-2 rounded-full transition-all" :style="{ width: (analytics.routes.total ? (analytics.routes.completed / analytics.routes.total * 100) : 0) + '%' }"></div>
              </div>

              <div class="flex items-center justify-between mt-4">
                <div class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full bg-amber-500"></span>
                  <span class="text-sm text-slate-700">Despachadas</span>
                </div>
                <span class="text-sm font-bold text-slate-800">{{ analytics.routes.dispatched }}</span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-2">
                <div class="bg-amber-500 h-2 rounded-full transition-all" :style="{ width: (analytics.routes.total ? (analytics.routes.dispatched / analytics.routes.total * 100) : 0) + '%' }"></div>
              </div>

              <div class="flex items-center justify-between mt-4">
                <div class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full bg-slate-300"></span>
                  <span class="text-sm text-slate-700">Pendientes</span>
                </div>
                <span class="text-sm font-bold text-slate-800">{{ analytics.routes.pending }}</span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-2">
                <div class="bg-slate-300 h-2 rounded-full transition-all" :style="{ width: (analytics.routes.total ? (analytics.routes.pending / analytics.routes.total * 100) : 0) + '%' }"></div>
              </div>
            </div>
          </div>

          <div class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Resultado de Entregas</h3>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span class="text-sm text-slate-700">Entregadas</span>
                </div>
                <span class="text-sm font-bold text-slate-800">{{ analytics.deliveries.delivered }}</span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-2">
                <div class="bg-emerald-500 h-2 rounded-full transition-all" :style="{ width: (analytics.deliveries.total ? (analytics.deliveries.delivered / analytics.deliveries.total * 100) : 0) + '%' }"></div>
              </div>

              <div class="flex items-center justify-between mt-4">
                <div class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full bg-rose-500"></span>
                  <span class="text-sm text-slate-700">Fallidas</span>
                </div>
                <span class="text-sm font-bold text-slate-800">{{ analytics.deliveries.failed }}</span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-2">
                <div class="bg-rose-500 h-2 rounded-full transition-all" :style="{ width: (analytics.deliveries.total ? (analytics.deliveries.failed / analytics.deliveries.total * 100) : 0) + '%' }"></div>
              </div>

              <div class="mt-6 p-4 bg-slate-50 rounded-xl">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs text-slate-500">Tiempo promedio por ruta</span>
                  <span class="text-sm font-bold text-slate-800">{{ analytics.performance.avgDurationMins }} min</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-xs text-slate-500">Tiempo total invertido</span>
                  <span class="text-sm font-bold text-slate-800">{{ formatMinutes(analytics.performance.totalDurationMins) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

useHead({ title: 'Analytics | GeoLogistics' });

const dateFrom = ref(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
const dateTo = ref(new Date().toISOString().split('T')[0]);
const analytics = ref<any>(null);
const loading = ref(true);

const fetchAnalytics = async () => {
  loading.value = true;
  try {
    const res = await $fetch('/api/dashboard/analytics', {
      params: { from: dateFrom.value, to: dateTo.value },
      headers: import.meta.dev ? { 'x-bypass-auth': 'true' } : {},
    });
    analytics.value = res.data;
  } catch (e) {
    console.error('Error fetching analytics:', e);
  } finally {
    loading.value = false;
  }
};

await fetchAnalytics();

const barHeight = (total: number) => {
  if (!analytics.value) return 0;
  const maxTotal = Math.max(...analytics.value.routesByDay.map((d: any) => d.total), 1);
  return (total / maxTotal) * 120;
};

const formatMinutes = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
};

const exportCSV = () => {
  if (!analytics.value) return;
  const rows = [
    ['Métrica', 'Valor'],
    ['Rutas Totales', analytics.value.routes.total],
    ['Rutas Completadas', analytics.value.routes.completed],
    ['Tasa de Completado', analytics.value.routes.completionRate + '%'],
    ['Entregas Totales', analytics.value.deliveries.total],
    ['Entregas Exitosas', analytics.value.deliveries.delivered],
    ['Tasa de Éxito', analytics.value.deliveries.successRate + '%'],
    ['Distancia Total (km)', analytics.value.performance.totalDistanceKm],
    ['Duración Total (min)', analytics.value.performance.totalDurationMins],
    ['Conductores Activos', analytics.value.drivers.active],
  ];
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `analytics-${dateFrom.value}-to-${dateTo.value}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
</script>
