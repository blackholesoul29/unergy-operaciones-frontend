<template>
  <div class="overflow-x-auto rounded-xl" style="border:1px solid #e8e0f0">
    <table class="w-full text-xs">
      <thead>
        <tr class="bg-gray-50 border-b">
          <th class="px-3 py-2 text-left font-semibold" style="color:#6b5a8a">Vence</th>
          <th class="px-3 py-2 text-left font-semibold" style="color:#6b5a8a">Período</th>
          <th class="px-3 py-2 text-left font-semibold" style="color:#6b5a8a">Bloque</th>
          <th class="px-3 py-2 text-left font-semibold" style="color:#6b5a8a">Estado</th>
          <th class="px-3 py-2 text-right font-semibold" style="color:#6b5a8a">Central</th>
          <th class="px-3 py-2 text-right font-semibold" style="color:#6b5a8a">P90</th>
          <th class="px-3 py-2 text-right font-semibold" style="color:#6b5a8a">Real</th>
          <th class="px-3 py-2 text-center font-semibold" style="color:#6b5a8a">Ventana</th>
          <th class="px-3 py-2" />
        </tr>
      </thead>
      <tbody>
        <tr v-for="fila in filas" :key="fila.id"
          class="border-b last:border-b-0 hover:bg-gray-50/60">
          <td class="px-3 py-2" style="color:#2C2039">{{ fechaCorta(fila.vencimiento) }}</td>
          <td class="px-3 py-2" style="color:#6b5a8a">
            {{ rangoCorto(fila.periodo_ini, fila.periodo_fin) }}
          </td>
          <td class="px-3 py-2" style="color:#6b5a8a">{{ fila.etiqueta_periodo }}</td>
          <td class="px-3 py-2">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold"
              :style="`background:${chipEstado(fila.estado).bg};color:${chipEstado(fila.estado).color}`"
              :title="chipEstado(fila.estado).title">
              {{ chipEstado(fila.estado).label }}
            </span>
          </td>
          <td class="px-3 py-2 text-right tabular-nums" style="color:#6b5a8a">
            {{ fila.central == null ? '—' : fmtCOP(fila.central) }}
          </td>
          <td class="px-3 py-2 text-right tabular-nums font-semibold" style="color:#2C2039">
            {{ fila.p90 == null ? '—' : fmtCOP(fila.p90) }}
          </td>
          <td class="px-3 py-2 text-right tabular-nums" style="color:#6b5a8a">
            {{ fila.real == null ? '—' : fmtCOP(fila.real) }}
          </td>
          <td class="px-3 py-2 text-center">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold"
              :style="`background:${chipProcedencia(fila.procedencia_ventana).bg};color:${chipProcedencia(fila.procedencia_ventana).color}`"
              :title="chipProcedencia(fila.procedencia_ventana).title">
              {{ chipProcedencia(fila.procedencia_ventana).label }}
            </span>
          </td>
          <td class="px-3 py-2 text-right">
            <Button text size="small" severity="secondary"
              :aria-label="`Ver detalle de ${fila.vencimiento}`"
              @click="emit('detalle', fila.id)">
              <template #icon><SearchIcon class="size-[1em]" /></template>
            </Button>
          </td>
        </tr>
        <tr v-if="!filas.length">
          <td colspan="9" class="px-3 py-6 text-center" style="color:#8a7aa5">
            No hay vencimientos semanales en el horizonte seleccionado.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import Button from 'primevue/button'
import { SearchIcon } from '@lucide/vue'
import { fmtCOP } from '../AjustesXM/utils/formatters.js'
import { chipEstado, chipProcedencia, fechaCorta, rangoCorto } from './utils/modeloPredictivo'

defineProps({
  filas: { type: Array, default: () => [] },
})
const emit = defineEmits(['detalle'])
</script>
