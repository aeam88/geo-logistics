<template>
  <div class="min-h-screen bg-slate-50 font-sans">
    <header class="h-12 md:h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-md">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        </div>
        <div class="hidden md:flex flex-col">
          <span class="font-bold text-sm text-slate-800 leading-tight">GeoLogistics Edge</span>
          <span class="text-[9px] text-slate-500 font-semibold uppercase tracking-widest">Gestión de Zonas</span>
        </div>
      </div>
      <NuxtLink to="/dashboard" class="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors">
        ← Volver al Panel
      </NuxtLink>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-6">
      <div class="flex gap-2 mb-6">
        <button
          @click="activeTab = 'list'"
          class="px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
          :class="activeTab === 'list' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'bg-white text-slate-600 border border-gray-200 hover:bg-gray-50'"
        >
          Zonas Guardadas
        </button>
        <button
          @click="activeTab = 'create'"
          class="px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
          :class="activeTab === 'create' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'bg-white text-slate-600 border border-gray-200 hover:bg-gray-50'"
        >
          Crear Nueva Zona
        </button>
      </div>

      <div v-if="activeTab === 'list'">
        <div v-if="pending" class="flex items-center justify-center py-20">
          <div class="flex flex-col items-center gap-4 text-indigo-600">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span class="font-medium">Cargando zonas...</span>
          </div>
        </div>

        <div v-else-if="zones.length === 0" class="flex flex-col items-center justify-center py-20 text-slate-400">
          <svg class="w-16 h-16 mb-4 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.447-.894L15 7m0 13V7"/></svg>
          <h3 class="text-lg font-semibold text-slate-600">No hay zonas</h3>
          <p class="text-sm mt-1">Crea tu primera zona para empezar.</p>
          <button @click="activeTab = 'create'" class="mt-4 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-500 transition-all">
            Crear Zona
          </button>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="zone in zones" :key="zone.id" class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
            <div class="flex items-start justify-between mb-3">
              <div>
                <h3 class="text-base font-bold text-slate-800">{{ zone.name }}</h3>
                <p class="text-[10px] text-slate-400 font-mono mt-1">ID: {{ zone.id.substring(0, 8) }}</p>
              </div>
              <div class="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.447-.894L15 7m0 13V7"/></svg>
              </div>
            </div>
            <div class="h-32 bg-slate-100 rounded-xl border border-slate-200 relative">
              <ZoneMapPreview :geometry-json="zone.geometryJson" class="w-full h-full" />
            </div>
            <div class="mt-3 flex items-center justify-between">
              <span class="text-[10px] text-slate-400">{{ formatDate(zone.createdAt) }}</span>
              <button @click="selectedZone = zone" class="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                Ver Detalle →
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="h-[calc(100vh-200px)]">
        <ZoneEditor @saved="onZoneSaved" @cancel="activeTab = 'list'" />
      </div>
    </main>
    <div v-if="selectedZone" class="fixed inset-0 z-9999 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm z-9998" @click="selectedZone = null"></div>
      <div class="relative z-9999 bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 class="text-lg font-bold text-slate-800">{{ selectedZone.name }}</h2>
            <p class="text-xs text-slate-400 font-mono mt-0.5">ID: {{ selectedZone.id }}</p>
          </div>
          <button @click="selectedZone = null" class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="h-100 bg-slate-100">
          <ZoneMapPreview :geometry-json="selectedZone.geometryJson" class="w-full h-full" />
        </div>
        <div class="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-slate-50">
          <span class="text-xs text-slate-400">Creado: {{ formatDate(selectedZone.createdAt) }}</span>
          <button @click="deleteZone(selectedZone)" class="px-4 py-2 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors">
            Eliminar Zona
          </button>
        </div>
      </div>
    </div>

    <div v-if="confirmOpen" class="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="confirmOnCancel"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <h2 class="text-lg font-bold text-slate-800">{{ confirmOpts.title }}</h2>
        <p v-if="confirmOpts.description" class="text-sm text-slate-500">{{ confirmOpts.description }}</p>
        <div class="flex gap-3 pt-2">
          <button @click="confirmOnCancel" class="flex-1 py-2.5 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">
            {{ confirmOpts.cancelLabel }}
          </button>
          <button @click="confirmOnConfirm" class="flex-1 py-2.5 rounded-xl font-bold text-sm text-white shadow-lg active:scale-[0.98] transition-all"
            :class="{
              'bg-red-600 hover:bg-red-500 shadow-red-500/20': confirmOpts.confirmColor === 'error',
              'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20': confirmOpts.confirmColor === 'primary',
              'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20': confirmOpts.confirmColor === 'warning',
              'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20': confirmOpts.confirmColor === 'success',
            }">
            {{ confirmOpts.confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

useHead({ title: 'Gestión de Zonas | GeoLogistics' });

const toast = useToast();
const { isOpen: confirmOpen, options: confirmOpts, confirm, onConfirm: confirmOnConfirm, onCancel: confirmOnCancel } = useConfirm();

const activeTab = usePersistedRef<'list' | 'create'>('zones:activeTab', 'list');
const selectedZone = ref<any>(null);

const { data, pending, refresh } = await useFetch('/api/dashboard', {
  headers: import.meta.dev ? { 'x-bypass-auth': 'true' } : {},
});
const zones = computed(() => data.value?.data?.zones ?? []);

const onZoneSaved = () => {
  activeTab.value = 'list';
  refresh();
};

const formatDate = (date: string | Date | null) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
};

const deleteZone = async (zone: any) => {
  const ok = await confirm({
    title: `¿Eliminar la zona "${zone.name}"?`,
    description: 'Esta acción no se puede deshacer.',
    confirmLabel: 'Eliminar',
    confirmColor: 'error',
  });
  if (!ok) return;
  try {
    await $fetch(`/api/zones/${zone.id}`, {
      method: 'DELETE',
      headers: import.meta.dev ? { 'x-bypass-auth': 'true' } : {},
    });
    selectedZone.value = null;
    refresh();
    toast.add({ title: 'Zona eliminada', color: 'success', icon: 'i-lucide-check-circle' });
  } catch (e: any) {
    toast.add({ title: 'Error eliminando zona', description: e?.data?.statusMessage || e.message, color: 'error', icon: 'i-lucide-x-circle' });
  }
};
</script>
