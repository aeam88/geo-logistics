<template>
  <div ref="mapContainer" class="rounded-xl shadow-inner border border-slate-200 z-0 h-full w-full min-h-75"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';

const props = defineProps<{
  zones: Array<{ id: string; name: string; geometryJson: string }>;
  drivers: Array<{
    id: string;
    vehiclePlate: string;
    status: "idle" | "en_ruta" | "offline";
    currentLat: number | null;
    currentLng: number | null;
  }>;
  highlightedDriverId?: string | null;
  initialCenter?: [number, number];
}>();

let map: L.Map | null = null;
let geoJsonLayer: L.GeoJSON | null = null;
let stopsCluster: L.MarkerClusterGroup | null = null;
let driversLayer: L.LayerGroup | null = null;

const driverMarkers = new Map<string, L.Marker>();
const mapContainer = ref<HTMLElement | null>(null);
let moveDebounce: ReturnType<typeof setTimeout> | null = null;

const loadStopsForViewport = async () => {
  if (!map) return;

  const bounds = map.getBounds();
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();

  try {
    const stops = await $fetch<{
      success: boolean;
      data: Array<{ id: string; lat: number; lng: number; clientName: string; stopOrder: number; status: string }>;
    }>('/api/stops/viewport', {
      params: {
        sw_lat: sw.lat,
        sw_lng: sw.lng,
        ne_lat: ne.lat,
        ne_lng: ne.lng,
        limit: 200,
      },
    });

    if (stops.success && stops.data) {
      renderStops(stops.data);
    }
  } catch (err) {
    console.error('[MapCore] Error loading viewport stops:', err);
  }
};

const onMapMove = () => {
  if (moveDebounce) clearTimeout(moveDebounce);
  moveDebounce = setTimeout(() => {
    loadStopsForViewport();
  }, 300);
};

onMounted(async () => {
  await nextTick();

  if (!mapContainer.value) {
    console.error('[MapCore] mapContainer is null after nextTick!');
    return;
  }

  try {
    const center = props.initialCenter || [-33.456, -70.648];
    map = L.map(mapContainer.value).setView(center, 12);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO'
    }).addTo(map);

    stopsCluster = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      disableClusteringAtZoom: 18,
      chunkedLoading: true,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        let className = 'bg-indigo-500 text-white';
        if (count >= 10) className = 'bg-indigo-700 text-white';
        else if (count >= 5) className = 'bg-indigo-600 text-white';
        return L.divIcon({
          html: `<div class="flex items-center justify-center w-full h-full font-bold text-sm">${count}</div>`,
          className: `${className} rounded-full flex items-center justify-center shadow-lg border-2 border-white`,
          iconSize: count >= 10 ? [40, 40] : count >= 5 ? [32, 32] : [26, 26],
        });
      },
    });
    map.addLayer(stopsCluster);

    driversLayer = L.layerGroup().addTo(map);

    map.on('moveend', onMapMove);
    map.on('zoomend', onMapMove);

    renderZones();
    renderDrivers();
    loadStopsForViewport();

    setTimeout(() => {
      if (map) map.invalidateSize();
    }, 100);
  } catch (err) {
    console.error('[MapCore] Leaflet init error:', err);
  }
});

const renderZones = () => {
  if (!map) return;
  if (geoJsonLayer) map.removeLayer(geoJsonLayer);

  props.zones.forEach(zone => {
    const geoData = JSON.parse(zone.geometryJson);
    geoJsonLayer = L.geoJSON(geoData, {
      style: { color: '#3b82f6', weight: 2, fillOpacity: 0.1 },
    }).bindPopup(`<b>${zone.name}</b>`).addTo(map!);
  });
};

const renderStops = (stops: Array<{ id: string; lat: number; lng: number; clientName: string; stopOrder: number; status: string }>) => {
  if (!map || !stopsCluster) return;
  stopsCluster.clearLayers();

  stops.forEach(stop => {
    let colorClass = 'bg-indigo-600';
    if (stop.status === 'entregado') colorClass = 'bg-emerald-500';
    else if (stop.status === 'fallido') colorClass = 'bg-rose-500';

    const customIcon = L.divIcon({
      className: '',
      html: `<div style="width:24px;height:24px;border-radius:9999px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:11px;color:white;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid white;" class="${colorClass}">${stop.stopOrder}</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    L.marker([stop.lat, stop.lng], { icon: customIcon })
      .bindPopup(`<b>${stop.clientName}</b><br>Entrega #${stop.stopOrder}`)
      .addTo(stopsCluster!);
  });
};

const renderDrivers = () => {
  if (!map || !driversLayer) return;

  const activeDriverIds = new Set(props.drivers.map(d => d.id));

  for (const [id, marker] of driverMarkers.entries()) {
    if (!activeDriverIds.has(id)) {
      driversLayer.removeLayer(marker);
      driverMarkers.delete(id);
    }
  }

  props.drivers.forEach(driver => {
    if (driver.currentLat === null || driver.currentLng === null) {
      const marker = driverMarkers.get(driver.id);
      if (marker) {
        driversLayer!.removeLayer(marker);
        driverMarkers.delete(driver.id);
      }
      return;
    }

    const isHighlighted = props.highlightedDriverId === driver.id;

    let colorClass = "bg-slate-400 border-slate-200";
    if (isHighlighted) {
      colorClass = "bg-indigo-600 border-white shadow-indigo-400/60 ring-4 ring-indigo-300 ring-opacity-50";
    } else if (driver.status === "en_ruta") {
      colorClass = "bg-emerald-500 border-emerald-200 shadow-emerald-200/50";
    } else if (driver.status === "idle") {
      colorClass = "bg-amber-500 border-amber-200 shadow-amber-200/50";
    }

    const iconSize: [number, number] = isHighlighted ? [36, 36] : [28, 28];
    const iconAnchor: [number, number] = isHighlighted ? [18, 18] : [14, 14];

    const customIcon = L.divIcon({
      className: '',
      html: `<div style="width:${iconSize[0]}px;height:${iconSize[1]}px;border-radius:9999px;display:flex;align-items:center;justify-content:center;overflow:hidden;line-height:1;${isHighlighted ? 'box-shadow:0 0 0 4px rgba(99,102,241,0.3);' : 'box-shadow:0 2px 8px rgba(0,0,0,0.25);'}border:2px solid white;" class="${colorClass}"><svg width="${isHighlighted ? 16 : 12}" height="${isHighlighted ? 16 : 12}" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>`,
      iconSize,
      iconAnchor
    });

    const latLng: L.LatLngExpression = [driver.currentLat, driver.currentLng];
    const marker = driverMarkers.get(driver.id);

    const popupHtml = `
      <div style="font-family: inherit;" class="p-1 min-w-[120px]">
        <h4 class="font-bold text-slate-800 m-0 leading-tight">Patente: ${driver.vehiclePlate}</h4>
        <div class="mt-1 flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full ${driver.status === 'en_ruta' ? 'bg-emerald-500' : driver.status === 'idle' ? 'bg-amber-500' : 'bg-slate-400'}"></span>
          <span class="text-xs text-slate-600 capitalize font-medium">${driver.status.replace('_', ' ')}</span>
        </div>
        <p class="text-[9px] text-slate-400 mt-1 mb-0 font-mono">Lat: ${driver.currentLat.toFixed(5)}<br/>Lng: ${driver.currentLng.toFixed(5)}</p>
      </div>
    `;

    if (marker) {
      marker.setLatLng(latLng);
      marker.setIcon(customIcon);
      marker.setPopupContent(popupHtml);
    } else {
      const newMarker = L.marker(latLng, { icon: customIcon })
        .bindPopup(popupHtml)
        .addTo(driversLayer!);
      driverMarkers.set(driver.id, newMarker);
    }
  });
};

watch(() => props.zones, renderZones, { deep: true });
watch(() => props.drivers, renderDrivers, { deep: true });
watch(() => props.highlightedDriverId, (newId, oldId) => {
  updateDriverHighlight(oldId, false);
  updateDriverHighlight(newId, true);
});

const updateDriverHighlight = (driverId: string | null | undefined, highlighted: boolean) => {
  if (!driverId) return;
  const marker = driverMarkers.get(driverId);
  if (!marker) return;

  const driver = props.drivers.find(d => d.id === driverId);
  if (!driver || driver.currentLat === null || driver.currentLng === null) return;

  let colorClass = "bg-slate-400 border-slate-200";
  if (highlighted) {
    colorClass = "bg-indigo-600 border-white shadow-indigo-400/60 ring-4 ring-indigo-300 ring-opacity-50";
  } else if (driver.status === "en_ruta") {
    colorClass = "bg-emerald-500 border-emerald-200 shadow-emerald-200/50";
  } else if (driver.status === "idle") {
    colorClass = "bg-amber-500 border-amber-200 shadow-amber-200/50";
  }

  const iconSize = highlighted ? [36, 36] : [28, 28];
  const iconAnchor = highlighted ? [18, 18] : [14, 14];

  const customIcon = L.divIcon({
    className: '',
    html: `<div style="width:${iconSize[0]}px;height:${iconSize[1]}px;border-radius:9999px;display:flex;align-items:center;justify-content:center;overflow:hidden;line-height:1;${highlighted ? 'box-shadow:0 0 0 4px rgba(99,102,241,0.3);' : 'box-shadow:0 2px 8px rgba(0,0,0,0.25);'}border:2px solid white;" class="${colorClass}"><svg width="${highlighted ? 16 : 12}" height="${highlighted ? 16 : 12}" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>`,
    iconSize: iconSize as [number, number],
    iconAnchor: iconAnchor as [number, number]
  });

  marker.setIcon(customIcon);
};

onBeforeUnmount(() => {
  if (moveDebounce) clearTimeout(moveDebounce);
  if (map) {
    map.remove();
    map = null;
  }
});
</script>

