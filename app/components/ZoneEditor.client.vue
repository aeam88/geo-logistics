<template>
  <div class="flex flex-col h-full">
    <div ref="mapContainer" class="flex-1 rounded-xl border border-slate-200 min-h-100 relative"></div>

    <div v-if="showInstructions" class="absolute top-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl px-5 py-3 shadow-lg z-1000 max-w-md text-center">
      <div class="text-xs text-slate-600 font-medium leading-relaxed">
        <span class="font-bold text-indigo-600">Click</span> en el mapa para agregar puntos del polígono.<br>
        Mínimo 3 puntos. Luego presiona <span class="font-bold text-indigo-600">Cerrar Polígono</span>.
      </div>
      <button @click="showInstructions = false" class="mt-2 text-[10px] text-slate-400 hover:text-slate-600 underline font-semibold">Entendido</button>
    </div>

    <div class="mt-4 flex flex-wrap items-center justify-between gap-3 bg-slate-50 rounded-xl p-4 border border-slate-200">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
        </div>
        <div>
          <div class="text-sm font-bold text-slate-800">Editor de Zonas</div>
          <div class="text-xs text-slate-500">
            <span v-if="drawing">{{ drawingPoints.length }} puntos — mínimo 3 para cerrar</span>
            <span v-else-if="!hasPolygon">Click en "Dibujar" para empezar</span>
            <span v-else class="text-emerald-600 font-medium">Polígono listo para guardar</span>
          </div>
        </div>
      </div>
      <div class="flex gap-2">
        <template v-if="drawing">
          <button @click="undoPoint" :disabled="drawingPoints.length === 0" class="px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-40">
            ↩ Deshacer
          </button>
          <button @click="closePolygon" :disabled="drawingPoints.length < 3" class="px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-all disabled:opacity-40">
            Cerrar Polígono
          </button>
          <button @click="cancelDrawing" class="px-3 py-2 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-all">
            Cancelar
          </button>
        </template>
        <template v-else>
          <button v-if="!hasPolygon" @click="startDrawing" class="px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 active:scale-95 transition-all shadow-md shadow-indigo-500/20">
            Dibujar Polígono
          </button>
          <button v-if="hasPolygon" @click="clearDrawings" class="px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
            Limpiar
          </button>
          <button @click="saveZone" :disabled="!hasPolygon || saving" class="px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2">
            <div v-if="saving" class="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
            {{ saving ? 'Guardando...' : 'Guardar Zona' }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const emit = defineEmits<{
  (e: 'saved', zone: { id: string; name: string }): void;
}>();

const toast = useToast();
const mapContainer = ref<HTMLElement | null>(null);
let map: L.Map | null = null;

const drawing = ref(false);
const drawingPoints = ref<[number, number][]>([]);
const hasPolygon = ref(false);
const saving = ref(false);
const showInstructions = ref(true);

let tempPolyline: L.Polyline | null = null;
let tempPolygon: L.Polygon | null = null;
let tempMarkers: L.CircleMarker[] = [];
let finalPolygon: L.Polygon | null = null;
let clickHandler: ((e: L.LeafletMouseEvent) => void) | null = null;

onMounted(() => {
  if (!mapContainer.value) return;

  map = L.map(mapContainer.value, { doubleClickZoom: true }).setView([-33.456, -70.648], 12);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO'
  }).addTo(map);
});

const startDrawing = () => {
  if (!map) return;

  clearDrawings();
  drawing.value = true;
  drawingPoints.value = [];
  showInstructions.value = true;

  map.doubleClickZoom.disable();

  clickHandler = (e: L.LeafletMouseEvent) => {
    if (!drawing.value || !map) return;

    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    if (drawingPoints.value.length >= 3) {
      const first = drawingPoints.value[0]!;
      const dist = map.distance([lat, lng], first);
      if (dist < 15) {
        closePolygon();
        return;
      }
    }

    drawingPoints.value.push([lat, lng]);
    refreshTempLayers();
  };

  map.on('click', clickHandler);
};

const refreshTempLayers = () => {
  if (!map) return;

  if (tempPolyline) { map.removeLayer(tempPolyline); tempPolyline = null; }
  if (tempPolygon) { map.removeLayer(tempPolygon); tempPolygon = null; }
  tempMarkers.forEach(m => map!.removeLayer(m));
  tempMarkers = [];

  const pts = drawingPoints.value;
  if (pts.length === 0) return;

  pts.forEach((pt, idx) => {
    const color = idx === 0 ? '#4f46e5' : '#6366f1';
    const marker = L.circleMarker(pt, {
      radius: idx === 0 ? 7 : 5,
      color: '#fff',
      weight: 2,
      fillColor: color,
      fillOpacity: 1,
    }).addTo(map!);
    tempMarkers.push(marker);
  });

  if (pts.length === 1) return;

  tempPolyline = L.polyline(pts, { color: '#6366f1', weight: 2, dashArray: '5, 8' }).addTo(map);

  if (pts.length >= 3) {
    tempPolygon = L.polygon(pts, { color: '#4f46e5', weight: 2, fillOpacity: 0.15 }).addTo(map);
  }
};

const undoPoint = () => {
  if (drawingPoints.value.length === 0) return;
  drawingPoints.value.pop();
  refreshTempLayers();
};

const closePolygon = () => {
  if (drawingPoints.value.length < 3) return;

  drawing.value = false;
  hasPolygon.value = true;

  if (tempPolyline) { map?.removeLayer(tempPolyline); tempPolyline = null; }
  if (tempPolygon) { map?.removeLayer(tempPolygon); tempPolygon = null; }
  tempMarkers.forEach(m => map?.removeLayer(m));
  tempMarkers = [];

  if (clickHandler && map) {
    map.off('click', clickHandler);
    clickHandler = null;
  }

  const pts = [...drawingPoints.value, drawingPoints.value[0]];
  finalPolygon = L.polygon(drawingPoints.value, {
    color: '#4f46e5',
    weight: 3,
    fillColor: '#4f46e5',
    fillOpacity: 0.2,
  }).addTo(map!);

  map?.fitBounds(finalPolygon.getBounds(), { padding: [30, 30] });

  if (map) map.doubleClickZoom.enable();
};

const cancelDrawing = () => {
  drawing.value = false;
  drawingPoints.value = [];

  if (tempPolyline) { map?.removeLayer(tempPolyline); tempPolyline = null; }
  if (tempPolygon) { map?.removeLayer(tempPolygon); tempPolygon = null; }
  tempMarkers.forEach(m => map?.removeLayer(m));
  tempMarkers = [];

  if (clickHandler && map) {
    map.off('click', clickHandler);
    clickHandler = null;
  }

  if (map) map.doubleClickZoom.enable();
};

const clearDrawings = () => {
  if (finalPolygon) { map?.removeLayer(finalPolygon); finalPolygon = null; }
  cancelDrawing();
  hasPolygon.value = false;
  drawingPoints.value = [];
};

const saveZone = async () => {
  if (!finalPolygon || !map) return;

  const geoJson = finalPolygon.toGeoJSON();

  const name = prompt('Nombre de la zona:', 'Zona Nueva');
  if (!name) return;

  saving.value = true;
  console.log('[ZoneEditor] Saving zone, GeoJSON type:', (geoJson as any)?.type);

  const safetyTimeout = setTimeout(() => {
    if (saving.value) {
      console.error('[ZoneEditor] Safety timeout! Forcing reset.');
      saving.value = false;
      toast.add({ title: 'El servidor no respondió a tiempo', description: 'Intenta de nuevo.', color: 'error', icon: 'i-lucide-x-circle' });
    }
  }, 8000);

  try {
    const url = `/api/zones?_t=${Date.now()}`;
    console.log('[ZoneEditor] POST to:', url);

    const res = await $fetch<{ success: boolean; data: { id: string } }>(url, {
      method: 'POST',
      credentials: 'include',
      headers: import.meta.dev ? { 'x-bypass-auth': 'true' } : {},
      body: {
        name,
        geometryJson: JSON.stringify(geoJson),
      },
    });

    console.log('[ZoneEditor] Save response:', res);

    if (res && res.success) {
      emit('saved', { id: res.data.id, name });
      clearDrawings();
    } else {
      toast.add({ title: 'Respuesta inesperada del servidor', color: 'error', icon: 'i-lucide-x-circle' });
    }
  } catch (e: any) {
    console.error('[ZoneEditor] Save error:', e);
    const msg = e?.response?._data?.statusMessage || e?.data?.statusMessage || e?.message || 'Error de red o servidor no disponible';
    toast.add({ title: 'Error guardando zona', description: msg, color: 'error', icon: 'i-lucide-x-circle' });
  } finally {
    clearTimeout(safetyTimeout);
    saving.value = false;
    console.log('[ZoneEditor] Saving reset');
  }
};

onBeforeUnmount(() => {
  if (clickHandler && map) {
    map.off('click', clickHandler);
  }
  if (map) {
    map.remove();
    map = null;
  }
});
</script>
