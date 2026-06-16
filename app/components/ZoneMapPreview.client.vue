<template>
  <div ref="mapContainer" class="w-full h-full bg-slate-100"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const props = defineProps<{
  geometryJson: string;
}>();

const mapContainer = ref<HTMLElement | null>(null);
let map: L.Map | null = null;
let geoJsonLayer: L.GeoJSON | null = null;

const renderZone = () => {
  if (!map) return;

  if (geoJsonLayer) {
    map.removeLayer(geoJsonLayer);
    geoJsonLayer = null;
  }

  try {
    const geoData = JSON.parse(props.geometryJson);
    geoJsonLayer = L.geoJSON(geoData, {
      style: { color: '#4f46e5', weight: 2, fillOpacity: 0.15 },
    }).addTo(map);

    const bounds = geoJsonLayer.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [10, 10] });
    }

    requestAnimationFrame(() => {
      if (map) map.invalidateSize();
    });
  } catch {
    
  }
};

onMounted(() => {
  if (!mapContainer.value) return;

  map = L.map(mapContainer.value, {
    zoomControl: false,
    attributionControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    keyboard: false,
    boxZoom: false,
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(map);

  renderZone();
});

watch(() => props.geometryJson, () => {
  renderZone();
});

onBeforeUnmount(() => {
  if (map) {
    map.remove();
    map = null;
  }
});
</script>
