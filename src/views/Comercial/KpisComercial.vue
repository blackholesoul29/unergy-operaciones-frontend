<!--
  El pulso del mes, derivado de las ofertas que ya están en memoria: no hay
  endpoint de KPIs y no hace falta. Respeta los filtros activos a propósito
  (ver useOfertas.banda): un total que ignora el filtro se lee como el total del
  negocio.
-->
<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
    <div v-for="k in tarjetas" :key="k.label"
         class="rounded-lg px-4 py-3 border transition-colors"
         :class="k.accionable ? 'cursor-pointer hover:border-unergy-purple' : ''"
         :style="{ background: k.fondo, borderColor: k.borde }"
         @click="k.accionable && $emit('filtrar', k.filtro)">
      <div class="text-2xl font-semibold leading-none" :style="{ color: k.color }">{{ k.valor }}</div>
      <div class="text-xs mt-1.5" style="color:#7a6e8a">{{ k.label }}</div>
      <div v-if="k.detalle" class="text-[11px] mt-0.5" style="color:#9b89b5">{{ k.detalle }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { fmtMwh } from './comercial.js'

const props = defineProps({
  banda: { type: Object, required: true },
  alertaDias: { type: [Number, String], default: null },
})
defineEmits(['filtrar'])

const tarjetas = computed(() => {
  const b = props.banda
  return [
    {
      label: 'Ofertas activas',
      valor: b.activas,
      detalle: b.total > b.activas ? `${b.total - b.activas} cerradas` : null,
      color: '#2C2039', fondo: '#fff', borde: '#e8e0f0',
    },
    {
      label: 'Energía en juego',
      valor: fmtMwh(b.energiaMwhMes).replace(' MWh/mes', ''),
      detalle: 'MWh/mes estimados de las ofertas abiertas',
      color: '#915BD8', fondo: '#fff', borde: '#e8e0f0',
    },
    {
      label: 'Requieren atención',
      valor: b.alertas,
      detalle: props.alertaDias ? `más de ${props.alertaDias} días sin movimiento` : null,
      color: b.alertas ? '#D64455' : '#7a6e8a',
      fondo: b.alertas ? '#FEF2F2' : '#fff',
      borde: b.alertas ? 'rgba(214,68,85,0.25)' : '#e8e0f0',
      accionable: b.alertas > 0, filtro: 'alerta',
    },
    {
      label: 'Enviadas sin respuesta',
      valor: b.sinRespuesta,
      detalle: 'el cliente nunca contestó',
      color: b.sinRespuesta ? '#F0C040' : '#7a6e8a',
      fondo: '#fff', borde: '#e8e0f0',
      accionable: b.sinRespuesta > 0, filtro: 'sinRespuesta',
    },
  ]
})
</script>
