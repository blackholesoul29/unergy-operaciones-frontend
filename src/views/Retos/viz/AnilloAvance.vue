<template>
  <svg :width="size" :height="size" :viewBox="`0 0 52 52`" role="img" :aria-label="aria">
    <g transform="rotate(-90 26 26)">
      <!-- Pista -->
      <circle cx="26" cy="26" r="22" fill="none" stroke="#F1ECF7" stroke-width="6" />
      <!-- Arco principal -->
      <circle
        v-if="pctSeguro !== null"
        cx="26" cy="26" r="22" fill="none"
        :stroke="color" stroke-width="6" stroke-linecap="round"
        :stroke-dasharray="dashPrincipal"
        class="an-arco"
      />
      <!-- Segunda vuelta: lo que se pasó del 100% -->
      <circle
        v-if="excesoPct > 0"
        cx="26" cy="26" r="22" fill="none"
        stroke="#14B8A6" stroke-width="6" stroke-linecap="round"
        :stroke-dasharray="dashExceso" opacity="0.9"
        class="an-arco"
      />
    </g>
    <text
      x="26" y="26" text-anchor="middle" dominant-baseline="central"
      :font-size="pctSeguro === null ? 13 : 13" font-weight="800"
      :fill="pctSeguro === null ? '#9b8fb0' : '#2C2039'"
      style="font-variant-numeric: tabular-nums"
    >{{ etiquetaCentro }}</text>
  </svg>
</template>

<script setup>
import { computed } from 'vue'
import { estadoColor, estadoLabel } from '../retosUi'

const props = defineProps({
  /** Porcentaje de cumplimiento contra el ritmo esperado. `null` = sin datos. */
  pct: { type: Number, default: null },
  estado: { type: String, default: 'sin_datos' },
  size: { type: Number, default: 52 },
})

const CIRCUNFERENCIA = 2 * Math.PI * 22 // 138.23

const pctSeguro = computed(() => {
  const n = Number(props.pct)
  return props.pct === null || props.pct === undefined || !Number.isFinite(n) ? null : n
})

const color = computed(() => estadoColor(props.estado))

const dashPrincipal = computed(() => {
  const p = Math.max(Math.min(pctSeguro.value ?? 0, 100), 0)
  return `${(p / 100) * CIRCUNFERENCIA} ${CIRCUNFERENCIA}`
})

const excesoPct = computed(() => {
  if (pctSeguro.value === null) return 0
  return Math.min(Math.max(pctSeguro.value - 100, 0), 100)
})

const dashExceso = computed(() => `${(excesoPct.value / 100) * CIRCUNFERENCIA} ${CIRCUNFERENCIA}`)

const etiquetaCentro = computed(() =>
  pctSeguro.value === null ? '—' : String(Math.round(pctSeguro.value))
)

const aria = computed(() => {
  if (pctSeguro.value === null) return 'Ritmo del trimestre: sin datos'
  return `Ritmo del trimestre: ${Math.round(pctSeguro.value)} por ciento, ${estadoLabel(props.estado).toLowerCase()}`
})
</script>

<style scoped>
.an-arco { transition: stroke-dasharray .4s cubic-bezier(.4, 0, .2, 1), stroke .2s; }
</style>
