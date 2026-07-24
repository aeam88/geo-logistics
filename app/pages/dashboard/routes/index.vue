<template>
  <div class="min-h-screen bg-slate-50 font-sans">
    <header class="h-12 md:h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-md">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        </div>
        <div class="hidden md:flex flex-col">
          <span class="font-bold text-sm text-slate-800 leading-tight">GeoLogistics Edge</span>
          <span class="text-[9px] text-slate-500 font-semibold uppercase tracking-widest">Gestión de Rutas</span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <NuxtLink to="/dashboard" class="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors">
          ← Volver al Panel
        </NuxtLink>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-6">
      <div class="flex flex-col md:flex-row gap-4 mb-6 items-start md:items-center justify-between">
        <div class="flex flex-wrap gap-3">
          <div class="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
            <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</label>
            <select v-model="statusFilter" class="bg-transparent text-sm font-medium text-slate-700 outline-none cursor-pointer">
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="despachada">Despachada</option>
              <option value="completada">Completada</option>
            </select>
          </div>
          <div class="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
            <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha</label>
            <input v-model="dateFilter" type="date" class="bg-transparent text-sm font-medium text-slate-700 outline-none" />
          </div>
          <button @click="fetchRoutes" class="px-4 py-2.5 bg-white border border-gray-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-gray-50 shadow-sm transition-all">
            Filtrar
          </button>
        </div>
        <button @click="showCreateModal = true" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
          Nueva Ruta
        </button>
      </div>

      <div v-if="pending" class="space-y-3">
        <div v-for="i in 5" :key="i" class="bg-white border border-gray-200 rounded-2xl p-4 animate-pulse">
          <div class="flex items-center gap-4">
            <div class="h-4 bg-slate-200 rounded w-24"></div>
            <div class="h-4 bg-slate-200 rounded w-32"></div>
            <div class="h-4 bg-slate-200 rounded w-20"></div>
            <div class="h-4 bg-slate-200 rounded w-16"></div>
            <div class="h-6 bg-slate-200 rounded-full w-20"></div>
          </div>
        </div>
      </div>

      <div v-else-if="routesList.length > 0" class="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead class="bg-slate-50 border-b border-gray-100">
              <tr>
                <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Conductor</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Zona</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Distancia</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <template v-for="route in routesList" :key="route.id">
                <tr class="hover:bg-slate-50/60 transition-colors cursor-pointer" @click="toggleExpand(route.id)">
                  <td class="px-6 py-4">
                    <div class="text-sm font-semibold text-slate-800">{{ formatDate(route.date) }}</div>
                    <div class="text-xs text-slate-400">{{ route.estimatedDurationMins }} min estimados</div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                      <span class="text-lg">🚚</span>
                      <div>
                        <div class="text-sm font-semibold text-slate-800">{{ route.driverName || 'Sin conductor' }}</div>
                        <div class="text-xs text-slate-400">ID: {{ route.driverId?.substring(0, 8) }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-sm font-semibold text-slate-800">{{ route.zoneName || 'Sin zona' }}</div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-sm font-semibold text-slate-800">{{ route.optimizedDistanceKm || 0 }} km</div>
                  </td>
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider"
                      :class="routeStatusClass(route.status)">
                      <span class="w-1.5 h-1.5 rounded-full" :class="routeStatusDot(route.status)"></span>
                      {{ formatStatus(route.status) }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                      <button @click.stop="editRoute(route)" class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Editar">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                      </button>
                      <button @click.stop="despacharRoute(route.id)" v-if="route.status === 'pendiente'" class="px-3 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all" title="Despachar">
                        Despachar
                      </button>
                      <svg class="w-4 h-4 text-slate-300 ml-1 transition-transform" :class="expandedRoute === route.id ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                    </div>
                  </td>
                </tr>
                <tr v-if="expandedRoute === route.id">
                  <td colspan="6" class="px-6 py-4 bg-slate-50/80">
                    <div v-if="routeStopsLoading" class="text-sm text-slate-400 py-2">Cargando paradas...</div>
                    <div v-else>
                      <div v-if="routeStops.length > 0" class="space-y-2 mb-4">
                        <div class="flex items-center justify-between mb-3">
                          <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Paradas ({{ routeStops.length }})</h4>
                          <span v-if="dragOverRoute === route.id" class="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md animate-pulse">
                            Suelta para reordenar
                          </span>
                          <span v-else class="text-[10px] text-slate-400">Arrastra para reordenar</span>
                        </div>
                        <div
                          class="space-y-2"
                          @dragover.prevent="onDragOver(route.id)"
                          @dragleave="onDragLeave"
                          @drop="onDrop(route.id, $event)"
                        >
                          <div v-for="(stop, idx) in routeStops" :key="stop.id">
                          <div
                            draggable="true"
                            @dragstart="onDragStart(stop.id, idx)"
                            @dragend="onDragEnd"
                            @dragover.prevent="dragOverIndex = idx"
                            class="flex items-center gap-4 bg-white rounded-xl p-3 border border-gray-100 cursor-grab active:cursor-grabbing hover:shadow-sm transition-all"
                            :class="{
                              'opacity-40 border-dashed border-indigo-300': draggedStopId === stop.id,
                              'border-indigo-300 bg-indigo-50': dragOverIndex === idx && draggedStopId !== stop.id,
                            }"
                          >
                            <div class="text-slate-300 hover:text-slate-500 cursor-grab">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"/></svg>
                            </div>
                            <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {{ idx + 1 }}
                            </div>
                            <div class="flex-1 min-w-0">
                              <div class="text-sm font-semibold text-slate-800 truncate">{{ stop.clientName }}</div>
                              <div class="text-xs text-slate-400 truncate">{{ stop.address }}</div>
                            </div>
                            <div class="text-xs font-mono text-slate-400">{{ stop.lat?.toFixed(4) }}, {{ stop.lng?.toFixed(4) }}</div>
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                              :class="stopStatusClass(stop.status)">
                              {{ stop.status }}
                            </span>
                            <div v-if="stop.timeWindowStart" class="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                              {{ stop.timeWindowStart }} - {{ stop.timeWindowEnd }}
                            </div>
                            <button v-if="stop.status === 'entregado'"
                              @click.stop="toggleStopEvidence(stop.id)"
                              class="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 transition-colors">
                              {{ expandedStopEvidence === stop.id ? 'Ocultar' : 'Evidencia' }}
                            </button>
                          </div>
                          <div v-if="expandedStopEvidence === stop.id" class="ml-12 mb-2">
                            <div v-if="evidenceLoading[stop.id]" class="text-xs text-slate-400 py-2">Cargando evidencia...</div>
                            <div v-else-if="stopEvidence[stop.id]?.length" class="space-y-2">
                              <div v-for="ev in stopEvidence[stop.id]" :key="ev.id" class="bg-white rounded-lg border border-gray-100 p-3 space-y-2">
                                <img v-if="ev.photoUrl" :src="ev.photoUrl" loading="lazy" class="w-full max-w-xs rounded-lg border border-gray-200" alt="Foto de entrega" />
                                <img v-if="ev.signatureData" :src="ev.signatureData" loading="lazy" class="h-16 rounded border border-gray-200 bg-white p-1" alt="Firma" />
                                <div v-if="ev.recipientName" class="text-xs text-slate-600"><span class="font-bold">Recibe:</span> {{ ev.recipientName }}</div>
                                <div v-if="ev.notes" class="text-xs text-slate-500 italic">{{ ev.notes }}</div>
                              </div>
                            </div>
                            <div v-else class="text-xs text-slate-400 py-1">Sin evidencia registrada</div>
                          </div>
                          </div>
                        </div>
                      </div>
                      <div v-else class="text-sm text-slate-400 py-2 mb-4">Sin paradas registradas</div>
                      <div class="bg-white rounded-xl border border-gray-200 p-4">
                        <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Agregar Parada</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <input v-model="newStop.clientName" type="text" placeholder="Nombre del cliente"
                              class="w-full px-3 py-2 rounded-lg bg-slate-50 border text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
                              :class="stopErrors.clientName ? 'border-red-300' : 'border-gray-200'" />
                            <p v-if="stopErrors.clientName" class="text-[10px] text-red-500 mt-1">{{ stopErrors.clientName }}</p>
                          </div>
                          <div>
                            <input v-model="newStop.address" type="text" placeholder="Dirección"
                              class="w-full px-3 py-2 rounded-lg bg-slate-50 border text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
                              :class="stopErrors.address ? 'border-red-300' : 'border-gray-200'" />
                            <p v-if="stopErrors.address" class="text-[10px] text-red-500 mt-1">{{ stopErrors.address }}</p>
                          </div>
                          <input v-model.number="newStop.lat" type="number" step="0.0001" placeholder="Latitud" class="px-3 py-2 rounded-lg bg-slate-50 border border-gray-200 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500">
                          <input v-model.number="newStop.lng" type="number" step="0.0001" placeholder="Longitud" class="px-3 py-2 rounded-lg bg-slate-50 border border-gray-200 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500">
                          <input v-model="newStop.timeWindowStart" type="time" class="px-3 py-2 rounded-lg bg-slate-50 border border-gray-200 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500">
                          <input v-model="newStop.timeWindowEnd" type="time" class="px-3 py-2 rounded-lg bg-slate-50 border border-gray-200 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500">
                        </div>
                        <button
                          @click="addStop(route.id)"
                          :disabled="!newStop.clientName || !newStop.address || addingStop"
                          class="mt-3 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                        >
                          {{ addingStop ? 'Agregando...' : '+ Agregar Parada' }}
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else class="flex flex-col items-center justify-center py-20 text-slate-400">
        <svg class="w-16 h-16 mb-4 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.447-.894L15 7m0 13V7"/></svg>
        <h3 class="text-lg font-semibold text-slate-600">No hay rutas</h3>
        <p class="text-sm mt-1">Crea una nueva ruta para empezar.</p>
      </div>
    </main>

    <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="showCreateModal = false"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold text-slate-800">Crear Nueva Ruta</h2>
          <button @click="showCreateModal = false" class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <form @submit.prevent="createRoute" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Conductor</label>
            <select v-model="newRoute.driverId" class="w-full px-4 py-3 rounded-xl bg-slate-50 border text-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              :class="routeErrors.driverId ? 'border-red-300' : 'border-gray-200'">
              <option value="">Seleccionar conductor...</option>
              <option v-for="d in availableDrivers" :key="d.id" :value="d.id">{{ d.vehiclePlate }} ({{ d.status }})</option>
            </select>
            <p v-if="routeErrors.driverId" class="text-xs text-red-500 mt-1">{{ routeErrors.driverId }}</p>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Zona</label>
            <select v-model="newRoute.zoneId" class="w-full px-4 py-3 rounded-xl bg-slate-50 border text-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              :class="routeErrors.zoneId ? 'border-red-300' : 'border-gray-200'">
              <option value="">Seleccionar zona...</option>
              <option v-for="z in zonesList" :key="z.id" :value="z.id">{{ z.name }}</option>
            </select>
            <p v-if="routeErrors.zoneId" class="text-xs text-red-500 mt-1">{{ routeErrors.zoneId }}</p>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Fecha</label>
            <input v-model="newRoute.date" type="date" required class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-gray-200 text-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Distancia Est. (km)</label>
              <input v-model.number="newRoute.optimizedDistanceKm" type="number" step="0.1" class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-gray-200 text-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Duración Est. (min)</label>
              <input v-model.number="newRoute.estimatedDurationMins" type="number" class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-gray-200 text-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
          </div>

          <div class="flex gap-3 pt-2">
            <button type="button" @click="showCreateModal = false" class="flex-1 py-3 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">
              Cancelar
            </button>
            <button type="submit" :disabled="creating" class="flex-1 py-3 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              <div v-if="creating" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {{ creating ? 'Creando...' : 'Crear Ruta' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showEditModal && editingRoute" class="fixed inset-0 z-9999 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="showEditModal = false"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold text-slate-800">Editar Ruta</h2>
          <button @click="showEditModal = false" class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <form @submit.prevent="saveEdit" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Conductor</label>
            <select v-model="editForm.driverId" class="w-full px-4 py-3 rounded-xl bg-slate-50 border text-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              :class="routeErrors.driverId ? 'border-red-300' : 'border-gray-200'">
              <option value="">Sin conductor</option>
              <option v-for="d in availableDrivers" :key="d.id" :value="d.id">{{ d.vehiclePlate }} ({{ d.status }})</option>
            </select>
            <p v-if="routeErrors.driverId" class="text-xs text-red-500 mt-1">{{ routeErrors.driverId }}</p>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Zona</label>
            <select v-model="editForm.zoneId" class="w-full px-4 py-3 rounded-xl bg-slate-50 border text-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              :class="routeErrors.zoneId ? 'border-red-300' : 'border-gray-200'">
              <option value="">Sin zona</option>
              <option v-for="z in zonesList" :key="z.id" :value="z.id">{{ z.name }}</option>
            </select>
            <p v-if="routeErrors.zoneId" class="text-xs text-red-500 mt-1">{{ routeErrors.zoneId }}</p>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Fecha</label>
            <input v-model="editForm.date" type="date" class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-gray-200 text-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Distancia Est. (km)</label>
              <input v-model.number="editForm.optimizedDistanceKm" type="number" step="0.1" class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-gray-200 text-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Duración Est. (min)</label>
              <input v-model.number="editForm.estimatedDurationMins" type="number" class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-gray-200 text-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Estado</label>
            <select v-model="editForm.status" class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-gray-200 text-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
              <option value="pendiente">Pendiente</option>
              <option value="despachada">Despachada</option>
              <option value="completada">Completada</option>
            </select>
          </div>

          <div class="flex gap-3 pt-2">
            <button type="button" @click="showEditModal = false" class="flex-1 py-3 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">
              Cancelar
            </button>
            <button type="submit" :disabled="savingEdit" class="flex-1 py-3 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              <div v-if="savingEdit" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {{ savingEdit ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
          </div>
        </form>
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
import { ref, computed, onMounted } from 'vue';

useHead({ title: 'Gestión de Rutas | GeoLogistics' });

const toast = useToast();
const { isOpen: confirmOpen, options: confirmOpts, confirm, onConfirm: confirmOnConfirm, onCancel: confirmOnCancel } = useConfirm();

const statusFilter = usePersistedRef<string>('routes:statusFilter', '');
const dateFilter = usePersistedRef<string>('routes:dateFilter', new Date().toISOString().slice(0, 10));
const expandedRoute = ref<string | null>(null);
const showCreateModal = ref(false);
const creating = ref(false);

const { data, pending, refresh } = await useFetch('/api/routes', {
  headers: import.meta.dev ? { 'x-bypass-auth': 'true' } : {},
  query: computed(() => ({
    status: statusFilter.value || undefined,
    date: dateFilter.value || undefined,
  })),
});

const routesList = computed(() => data.value?.data ?? []);

const { data: driversData } = await useFetch('/api/drivers', {
  headers: import.meta.dev ? { 'x-bypass-auth': 'true' } : {},
});
const availableDrivers = computed(() => driversData.value?.data ?? []);

const { data: zonesData } = await useFetch('/api/dashboard', {
  headers: import.meta.dev ? { 'x-bypass-auth': 'true' } : {},
});
const zonesList = computed(() => zonesData.value?.data?.zones ?? []);

const routeStops = ref<any[]>([]);
const routeStopsLoading = ref(false);
const stopEvidence = ref<Record<string, any[]>>({});
const evidenceLoading = ref<Record<string, boolean>>({});
const expandedStopEvidence = ref<string | null>(null);

const draggedStopId = ref<string | null>(null);
const draggedStopIndex = ref<number>(-1);
const dragOverRoute = ref<string | null>(null);
const dragOverIndex = ref<number>(-1);
const reordering = ref(false);

const onDragStart = (stopId: string, index: number) => {
  draggedStopId.value = stopId;
  draggedStopIndex.value = index;
};

const onDragEnd = () => {
  draggedStopId.value = null;
  draggedStopIndex.value = -1;
  dragOverRoute.value = null;
  dragOverIndex.value = -1;
};

const onDragOver = (routeId: string) => {
  dragOverRoute.value = routeId;
};

const onDragLeave = () => {
  dragOverRoute.value = null;
  dragOverIndex.value = -1;
};

const calculateDropIndex = (e: DragEvent, container: HTMLElement): number => {
  const children = Array.from(container.children);
  if (children.length === 0) return 0;

  const rect = container.getBoundingClientRect();
  const y = e.clientY - rect.top;

  for (let i = 0; i < children.length; i++) {
    const child = children[i] as HTMLElement;
    const childRect = child.getBoundingClientRect();
    const childMid = childRect.top - rect.top + childRect.height / 2;
    if (y < childMid) return i;
  }
  return children.length;
};

const onDrop = async (routeId: string, e?: DragEvent) => {
  if (!draggedStopId.value || draggedStopIndex.value === -1) return;

  if (dragOverIndex.value === -1 && e) {
    const container = (e.currentTarget || e.target) as HTMLElement;
    if (container) {
      dragOverIndex.value = calculateDropIndex(e, container);
    }
  }

  if (dragOverIndex.value === -1 || dragOverIndex.value === draggedStopIndex.value) {
    onDragEnd();
    return;
  }

  const items = [...routeStops.value];
  const [moved] = items.splice(draggedStopIndex.value, 1);
  items.splice(dragOverIndex.value, 0, moved);

  routeStops.value = items.map((item, idx) => ({ ...item, stopOrder: idx + 1 }));

  const stopIds = items.map(s => s.id);
  reordering.value = true;
  try {
    await $fetch(`/api/routes/${routeId}/reorder`, {
      method: 'PUT',
      headers: import.meta.dev ? { 'x-bypass-auth': 'true' } : {},
      body: { stopIds },
    });
    toast.add({ title: 'Paradas reordenadas', color: 'success', icon: 'i-lucide-check-circle' });
  } catch (e: any) {
    toast.add({ title: 'Error reordenando', description: e?.data?.statusMessage || e.message, color: 'error', icon: 'i-lucide-x-circle' });
    const res = await $fetch(`/api/routes/${routeId}/stops`, {
      headers: import.meta.dev ? { 'x-bypass-auth': 'true' } : {},
    });
    routeStops.value = res.data || [];
  } finally {
    reordering.value = false;
    onDragEnd();
  }
};

const toggleExpand = async (routeId: string) => {
  if (expandedRoute.value === routeId) {
    expandedRoute.value = null;
    return;
  }
  expandedRoute.value = routeId;
  routeStopsLoading.value = true;
  try {
    const res = await $fetch(`/api/routes/${routeId}/stops`, {
      headers: import.meta.dev ? { 'x-bypass-auth': 'true' } : {},
    });
    routeStops.value = res.data || [];
  } catch (e) {
    console.error('Error loading stops:', e);
    routeStops.value = [];
  } finally {
    routeStopsLoading.value = false;
  }
};

const toggleStopEvidence = async (stopId: string) => {
  if (expandedStopEvidence.value === stopId) {
    expandedStopEvidence.value = null;
    return;
  }
  expandedStopEvidence.value = stopId;
  if (stopEvidence.value[stopId]) return;
  evidenceLoading.value[stopId] = true;
  try {
    const res = await $fetch(`/api/stops/${stopId}/evidence`, {
      headers: import.meta.dev ? { 'x-bypass-auth': 'true' } : {},
    });
    stopEvidence.value[stopId] = res.data || [];
  } catch {
    stopEvidence.value[stopId] = [];
  } finally {
    evidenceLoading.value[stopId] = false;
  }
};

const newStop = ref({
  clientName: '',
  address: '',
  lat: undefined as number | undefined,
  lng: undefined as number | undefined,
  timeWindowStart: '',
  timeWindowEnd: '',
});
const addingStop = ref(false);
const stopErrors = ref<Record<string, string>>({});

const validateStop = (): boolean => {
  stopErrors.value = {};
  if (!newStop.value.clientName.trim()) stopErrors.value.clientName = 'Requerido';
  if (!newStop.value.address.trim()) stopErrors.value.address = 'Requerido';
  return Object.keys(stopErrors.value).length === 0;
};

const addStop = async (routeId: string) => {
  if (!validateStop()) return;
  addingStop.value = true;
  try {
    await $fetch(`/api/routes/${routeId}/stops`, {
      method: 'POST',
      headers: import.meta.dev ? { 'x-bypass-auth': 'true' } : {},
      body: {
        clientName: newStop.value.clientName,
        address: newStop.value.address,
        lat: newStop.value.lat || -33.456,
        lng: newStop.value.lng || -70.648,
        timeWindowStart: newStop.value.timeWindowStart || undefined,
        timeWindowEnd: newStop.value.timeWindowEnd || undefined,
      },
    });
    const res = await $fetch(`/api/routes/${routeId}/stops`, {
      headers: import.meta.dev ? { 'x-bypass-auth': 'true' } : {},
    });
    routeStops.value = res.data || [];
    newStop.value = { clientName: '', address: '', lat: undefined, lng: undefined, timeWindowStart: '', timeWindowEnd: '' };
    toast.add({ title: 'Parada agregada', color: 'success', icon: 'i-lucide-check-circle' });
  } catch (e: any) {
    toast.add({ title: 'Error agregando parada', description: e?.data?.statusMessage || e.message, color: 'error', icon: 'i-lucide-x-circle' });
  } finally {
    addingStop.value = false;
  }
};

const newRoute = ref({
  driverId: '',
  zoneId: '',
  date: new Date().toISOString().split('T')[0],
  optimizedDistanceKm: undefined as number | undefined,
  estimatedDurationMins: undefined as number | undefined,
});
const routeErrors = ref<Record<string, string>>({});

const validateRoute = (data: { driverId: string; zoneId: string; date?: string }): boolean => {
  routeErrors.value = {};
  if (!data.driverId) routeErrors.value.driverId = 'Selecciona un conductor';
  if (!data.zoneId) routeErrors.value.zoneId = 'Selecciona una zona';
  if (!data.date) routeErrors.value.date = 'La fecha es requerida';
  return Object.keys(routeErrors.value).length === 0;
};

const createRoute = async () => {
  if (!validateRoute(newRoute.value)) return;
  creating.value = true;
  try {
    await $fetch('/api/routes', {
      method: 'POST',
      headers: import.meta.dev ? { 'x-bypass-auth': 'true' } : {},
      body: {
        ...newRoute.value,
        optimizedDistanceKm: newRoute.value.optimizedDistanceKm || null,
        estimatedDurationMins: newRoute.value.estimatedDurationMins || null,
      }
    });
    showCreateModal.value = false;
    refresh();
    newRoute.value = {
      driverId: '',
      zoneId: '',
      date: new Date().toISOString().split('T')[0],
      optimizedDistanceKm: undefined,
      estimatedDurationMins: undefined,
    };
    toast.add({ title: 'Ruta creada', color: 'success', icon: 'i-lucide-check-circle' });
  } catch (e: any) {
    toast.add({ title: 'Error creando ruta', description: e?.data?.statusMessage || e.message, color: 'error', icon: 'i-lucide-x-circle' });
  } finally {
    creating.value = false;
  }
};

const fetchRoutes = () => {
  refresh();
};

const despacharRoute = async (routeId: string) => {
  const ok = await confirm({
    title: '¿Despachar esta ruta?',
    description: 'El conductor será notificado.',
    confirmLabel: 'Despachar',
    confirmColor: 'primary',
  });
  if (!ok) return;
  try {
    await $fetch(`/api/routes/${routeId}`, {
      method: 'PUT',
      headers: import.meta.dev ? { 'x-bypass-auth': 'true' } : {},
      body: { status: 'despachada' }
    });
    refresh();
    toast.add({ title: 'Ruta despachada', color: 'success', icon: 'i-lucide-check-circle' });
  } catch (e: any) {
    toast.add({ title: 'Error despachando', description: e?.data?.statusMessage || e.message, color: 'error', icon: 'i-lucide-x-circle' });
  }
};

const showEditModal = ref(false);
const editingRoute = ref<any>(null);
const editForm = ref({
  driverId: '',
  zoneId: '',
  date: '',
  optimizedDistanceKm: undefined as number | undefined,
  estimatedDurationMins: undefined as number | undefined,
  status: '' as string,
});
const savingEdit = ref(false);

const editRoute = (route: any) => {
  editingRoute.value = route;
  editForm.value = {
    driverId: route.driverId || '',
    zoneId: route.zoneId || '',
    date: route.date || '',
    optimizedDistanceKm: route.optimizedDistanceKm || undefined,
    estimatedDurationMins: route.estimatedDurationMins || undefined,
    status: route.status || 'pendiente',
  };
  routeErrors.value = {};
  showEditModal.value = true;
};

const saveEdit = async () => {
  if (!editingRoute.value) return;
  if (!validateRoute(editForm.value)) return;
  savingEdit.value = true;
  try {
    await $fetch(`/api/routes/${editingRoute.value.id}`, {
      method: 'PUT',
      headers: import.meta.dev ? { 'x-bypass-auth': 'true' } : {},
      body: editForm.value,
    });
    showEditModal.value = false;
    editingRoute.value = null;
    refresh();
    toast.add({ title: 'Ruta actualizada', color: 'success', icon: 'i-lucide-check-circle' });
  } catch (e: any) {
    toast.add({ title: 'Error guardando', description: e?.data?.statusMessage || e.message, color: 'error', icon: 'i-lucide-x-circle' });
  } finally {
    savingEdit.value = false;
  }
};

const deleteRoute = async (routeId: string) => {
  const ok = await confirm({
    title: '¿Eliminar esta ruta?',
    description: 'Esta acción no se puede deshacer.',
    confirmLabel: 'Eliminar',
    confirmColor: 'error',
  });
  if (!ok) return;
  try {
    await $fetch(`/api/routes/${routeId}`, {
      method: 'DELETE',
      headers: import.meta.dev ? { 'x-bypass-auth': 'true' } : {},
    });
    refresh();
    toast.add({ title: 'Ruta eliminada', color: 'success', icon: 'i-lucide-check-circle' });
  } catch (e: any) {
    toast.add({ title: 'Error eliminando', description: e?.data?.statusMessage || e.message, color: 'error', icon: 'i-lucide-x-circle' });
  }
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatStatus = (status: string) => {
  const map: Record<string, string> = { pendiente: 'Pendiente', despachada: 'Despachada', completada: 'Completada' };
  return map[status] || status;
};

const routeStatusClass = (status: string) => {
  if (status === 'pendiente') return 'bg-amber-50 text-amber-700 border border-amber-200';
  if (status === 'despachada') return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
  if (status === 'completada') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  return 'bg-slate-50 text-slate-600 border border-slate-200';
};

const routeStatusDot = (status: string) => {
  if (status === 'pendiente') return 'bg-amber-500';
  if (status === 'despachada') return 'bg-indigo-500';
  if (status === 'completada') return 'bg-emerald-500';
  return 'bg-slate-400';
};

const stopStatusClass = (status: string) => {
  if (status === 'entregado') return 'bg-emerald-100 text-emerald-700';
  if (status === 'fallido') return 'bg-rose-100 text-rose-700';
  return 'bg-amber-100 text-amber-700';
};
</script>
