<template>
  <div class="space-y-6">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
        <i class="pi pi-exclamation-circle text-red-500 text-sm" />
      </div>
      <div>
        <h2 class="text-xl font-bold text-gray-800">Alertas</h2>
        <p class="text-xs text-gray-400 mt-0.5">Selecciona un módulo para ver las alertas activas</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
      <RouterLink
        v-for="mod in MODULOS"
        :key="mod.to"
        :to="mod.to"
        class="flex flex-col items-center gap-4 rounded-2xl border-2 p-8 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 select-none text-center"
        :class="mod.enabled
          ? 'border-transparent bg-white shadow-sm'
          : 'border-dashed border-gray-200 bg-gray-50 opacity-50 pointer-events-none'"
        :style="mod.enabled ? `border-color:${mod.color}30; background:${mod.bg}` : ''"
      >
        <div class="w-16 h-16 rounded-full flex items-center justify-center"
          :style="mod.enabled ? `background:${mod.color}18` : 'background:#f3f4f6'">
          <i :class="mod.icon" class="text-3xl"
            :style="mod.enabled ? `color:${mod.color}` : 'color:#d1d5db'" />
        </div>
        <div>
          <p class="font-semibold text-gray-800">{{ mod.label }}</p>
          <p class="text-xs text-gray-400 mt-1">{{ mod.desc }}</p>
        </div>
        <span v-if="!mod.enabled" class="text-[10px] uppercase tracking-widest text-gray-400">Próximamente</span>
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'

const MODULOS = [
  {
    to: '/alertas/contratos-ppa',
    label: 'Contratos PPA',
    desc: 'Proyectos huérfanos y duplicados en GESCON',
    icon: 'pi pi-bolt',
    color: '#f59e0b',
    bg: '#fffbeb',
    enabled: true,
  },
  {
    to: '/alertas/fronteras',
    label: 'Fronteras',
    desc: 'Fronteras sin proyecto asignado o vencidas',
    icon: 'pi pi-globe',
    color: '#3b82f6',
    bg: '#eff6ff',
    enabled: false,
  },
  {
    to: '/alertas/monitoreo',
    label: 'Monitoreo',
    desc: 'Fallas sin resolver y plantas sin datos',
    icon: 'pi pi-exclamation-triangle',
    color: '#ef4444',
    bg: '#fef2f2',
    enabled: false,
  },
]
</script>
