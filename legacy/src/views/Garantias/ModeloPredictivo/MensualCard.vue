<template>
  <div class="rounded-xl p-4" :style="`border:1px solid ${destacada ? '#915BD8' : '#e8e0f0'}`">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="flex items-center gap-2">
        <span class="text-sm font-semibold" style="color: #2c2039">{{ nombreMes(item.mes) }}</span>
        <span
          class="rounded-full px-2 py-0.5 text-[10px] font-bold"
          :style="`background:${chipEstado(item.estado).bg};color:${chipEstado(item.estado).color}`"
          :title="chipEstado(item.estado).title"
        >
          {{ chipEstado(item.estado).label }}
        </span>
        <span
          class="rounded-full px-2 py-0.5 text-[10px] font-bold"
          :style="`background:${chipProcedencia(item.procedencia_ventana).bg};color:${chipProcedencia(item.procedencia_ventana).color}`"
          :title="chipProcedencia(item.procedencia_ventana).title"
        >
          {{ chipProcedencia(item.procedencia_ventana).label }}
        </span>
      </div>
      <div class="text-right">
        <div class="text-xl font-bold" style="color: #915bd8">{{ fmtCOP(item.p90) }}</div>
        <div v-if="item.central != null" class="text-[11px]" style="color: #6b5a8a">
          central {{ fmtCOP(item.central) }}
        </div>
      </div>
    </div>

    <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]" style="color: #6b5a8a">
      <div class="flex justify-between">
        <dt>Ventana cierra</dt>
        <dd style="color: #2c2039">{{ fechaCorta(item.ventana_cierra) }}</dd>
      </div>
      <div class="flex justify-between">
        <dt>Lo sabés</dt>
        <dd style="color: #2c2039">{{ fechaCorta(item.objetivo) }}</dd>
      </div>
      <div class="flex justify-between">
        <dt>XM publica</dt>
        <dd style="color: #2c2039">{{ fechaCorta(item.publica_xm) }}</dd>
      </div>
      <div class="flex justify-between">
        <dt>Ventaja</dt>
        <dd
          :style="
            item.dias_ventaja > 0
              ? 'color:#059669;font-weight:600'
              : 'color:#D64455;font-weight:600'
          "
        >
          {{ item.dias_ventaja }} {{ item.dias_ventaja === 1 ? 'día' : 'días' }}
        </dd>
      </div>
    </dl>

    <div class="mt-3 flex justify-end">
      <Button
        label="Ver detalle"
        icon="pi pi-search"
        text
        size="small"
        severity="secondary"
        @click="emit('detalle', item.id)"
      />
    </div>
  </div>
</template>

<script setup>
import Button from 'primevue/button'
import { fmtCOP } from '@/views/Garantias/AjustesXM/utils/formatters'
import {
  chipEstado,
  chipProcedencia,
  fechaCorta,
  nombreMes,
  ESTADO,
} from './utils/modeloPredictivo'
import { computed } from 'vue'

const props = defineProps({
  item: { type: Object, required: true },
})
const emit = defineEmits(['detalle'])

const destacada = computed(() => props.item.estado === ESTADO.ESTIMADO)
</script>
