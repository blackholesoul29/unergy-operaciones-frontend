<template>
  <div class="space-y-4">
    <FrescuraBanner :frescura="data?.frescura" />

    <div class="flex flex-wrap items-end gap-4 p-4 rounded-xl"
      style="background:rgba(145,91,216,0.06)">
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium" style="color:#6b5a8a">Agente</label>
        <SelectButton v-model="agente" :options="opcionesAgente" :allowEmpty="false"
          @update:modelValue="cargar" />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium" style="color:#6b5a8a">Esquema</label>
        <SelectButton v-model="esquema" :options="opcionesEsquema" optionLabel="label"
          optionValue="value" :allowEmpty="false" @update:modelValue="cargar" />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium" style="color:#6b5a8a">Percentil</label>
        <InputNumber v-model="cuantilPct" :min="50" :max="99" suffix=" %" style="width:7.5rem"
          @update:modelValue="cargar" />
      </div>
      <div v-if="esquema === ESQUEMA.SEMANAL" class="flex flex-col gap-1">
        <label class="text-xs font-medium" style="color:#6b5a8a">Semanas</label>
        <InputNumber v-model="horizonte" :min="1" :max="12" showButtons buttonLayout="horizontal"
          style="width:8.5rem" @update:modelValue="cargar" />
      </div>
      <Button label="Recalcular" icon="pi pi-refresh" :loading="cargando" outlined @click="cargar" />
    </div>

    <div v-if="error" class="rounded-lg p-3"
      style="background:#FEF2F2;border:1px solid rgba(214,68,85,0.2)">
      <p class="text-xs" style="color:#D64455">{{ error }}</p>
    </div>

    <div v-if="cargando" class="text-sm" style="color:#6b5a8a">Calculando…</div>

    <template v-else-if="data">
      <TotalesHeader :totales="data.totales" />

      <SemanalesTabla v-if="esquema === ESQUEMA.SEMANAL" :filas="semanales"
        @detalle="abrirDetalle" />

      <div v-else class="grid gap-4" style="grid-template-columns:repeat(auto-fit,minmax(320px,1fr))">
        <MensualCard v-for="m in mensuales" :key="m.id" :item="m" @detalle="abrirDetalle" />
        <p v-if="!mensuales.length" class="text-sm" style="color:#8a7aa5">
          No hay garantías mensuales en el horizonte.
        </p>
      </div>

      <p v-if="data.backtest" class="text-[11px] pt-3 border-t"
        style="color:#8a7aa5;border-color:rgba(44,32,57,0.10)">
        Cobertura histórica:
        <b>{{ pct(data.backtest.cobertura_semanal) }}</b> semanal ·
        <b>{{ pct(data.backtest.cobertura_mensual) }}</b> mensual —
        ancho mediano <b>{{ fmtCOP(data.backtest.ancho_mediano) }}</b>
        vs. baseline <b>{{ fmtCOP(data.backtest.ancho_baseline) }}</b>
        sobre {{ data.backtest.n_vencimientos }} vencimientos.
      </p>
    </template>

    <DetalleDialog :abierto="detalleAbierto" :detalle="detalle" :cargando="detalleCargando"
      @cerrar="cerrarDetalle" />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import SelectButton from 'primevue/selectbutton'
import { fmtCOP } from '@/views/Garantias/AjustesXM/utils/formatters'
import { useModeloPredictivo } from './composables/useModeloPredictivo'
import { AGENTE, ESQUEMA } from './utils/modeloPredictivo'
import FrescuraBanner from './FrescuraBanner.vue'
import TotalesHeader from './TotalesHeader.vue'
import SemanalesTabla from './SemanalesTabla.vue'
import MensualCard from './MensualCard.vue'
import DetalleDialog from './DetalleDialog.vue'

const {
  agente, esquema, cuantil, horizonte,
  data, cargando, error,
  semanales, mensuales,
  detalle, detalleCargando, detalleAbierto,
  cargar, abrirDetalle, cerrarDetalle,
} = useModeloPredictivo()

const opcionesAgente = [AGENTE.UNGG, AGENTE.UNGC]
const opcionesEsquema = [
  { label: 'Semanal', value: ESQUEMA.SEMANAL },
  { label: 'Mensual', value: ESQUEMA.MENSUAL },
]

const cuantilPct = computed({
  get: () => Math.round(cuantil.value * 100),
  set: (v) => { cuantil.value = Number(v) / 100 },
})

function pct(v) {
  return v == null ? '—' : `${Math.round(v * 100)}%`
}

onMounted(cargar)
</script>
