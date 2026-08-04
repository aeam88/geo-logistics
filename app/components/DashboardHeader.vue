<template>
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
          <input :value="searchPlate" @input="$emit('update:searchPlate', ($event.target as HTMLInputElement).value)" type="text" placeholder="Ej: FL-99-PT" class="text-xs md:text-sm font-medium text-slate-800 bg-transparent border-none outline-none w-full placeholder:font-normal placeholder:text-slate-300">
        </div>
        <div class="hidden sm:flex flex-1 flex-col justify-center min-w-0 px-3 cursor-text">
          <span class="text-[9px] md:text-[10px] font-bold tracking-wider text-slate-400 uppercase">Zona</span>
          <input :value="searchZone" @input="$emit('update:searchZone', ($event.target as HTMLInputElement).value)" type="text" placeholder="Todas las zonas" class="text-xs md:text-sm font-medium text-slate-800 bg-transparent border-none outline-none w-full">
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
      <button @click="$emit('logout')" class="text-xs font-semibold text-slate-600 hover:text-red-600 transition-colors">
        Salir
      </button>
      <div class="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors">
        <span class="text-sm">👨‍💻</span>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  searchPlate: string
  searchZone: string
}>()

defineEmits<{
  'update:searchPlate': [value: string]
  'update:searchZone': [value: string]
  'logout': []
}>()
</script>
