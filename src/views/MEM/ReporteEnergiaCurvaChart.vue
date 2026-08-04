<template>
  <div>
    <div class="flex flex-wrap gap-2 mb-3 text-xs">
      <span v-if="!finalVacia" class="chip" style="border-color:#915BD8;color:#915BD8;">● Final reportada</span>
      <span v-if="medidorPath" class="chip" style="border-color:#3B82F6;color:#3B82F6;">■ Medidor</span>
      <span v-if="soleniumPath" class="chip" style="border-color:#0D9488;color:#0D9488;">▲ Solenium</span>
      <span v-if="horasRellenadas.size" class="chip" style="border-color:#F0C040;color:#B8860B;">◆ Rellenado (reconectador/Solenium/histórico)</span>
      <span v-if="capacidadKwh != null" class="chip" style="border-color:#9b89b5;color:#6b5a8a;">┅ Capacidad efectiva ({{ capacidadMwFmt }} MW)</span>
    </div>
    <svg :width="W" :height="H" :viewBox="`0 0 ${W} ${H}`" class="w-full">
      <line v-for="f in [0, 0.25, 0.5, 0.75, 1]" :key="f"
            :x1="padL" :x2="W - padR" :y1="y(maxV * f)" :y2="y(maxV * f)"
            stroke="#eee" stroke-width="1" />
      <text v-for="f in [0, 0.25, 0.5, 0.75, 1]" :key="'t' + f" :x="4" :y="y(maxV * f) + 3"
            font-size="9" fill="#9b89b5">{{ Math.round(maxV * f) }}</text>
      <text v-for="h in [0, 6, 12, 18, 23]" :key="'h' + h" :x="x(h)" :y="H - 4"
            font-size="9" fill="#9b89b5" text-anchor="middle">{{ h }}h</text>

      <!-- 'Final reportada' se dibuja primero, de fondo -- Medidor/Solenium
           van despues, encima, para que sus marcadores sigan siendo visibles
           incluso cuando coinciden casi exacto con el valor final (ej. Caso
           1/2, donde el medidor validado ES la fuente del total). -->
      <template v-if="!finalVacia">
        <path :d="finalArea" fill="#915BD8" opacity="0.08" />
        <path :d="finalPath" fill="none" stroke="#915BD8" stroke-width="3" />
        <template v-for="h in 24" :key="'p' + h">
          <rect v-if="horasRellenadas.has(h - 1)"
                :x="x(h - 1) - 4" :y="y(val(finalCurve, h - 1)) - 4" width="8" height="8"
                fill="#F0C040" stroke="white" stroke-width="1.5"
                :transform="`rotate(45 ${x(h - 1)} ${y(val(finalCurve, h - 1))})`" />
          <circle v-else :cx="x(h - 1)" :cy="y(val(finalCurve, h - 1))" r="3.2" fill="#915BD8" stroke="white" stroke-width="1.5" />
        </template>
      </template>

      <path v-if="medidorPath" :d="medidorPath" fill="none" stroke="#3B82F6" stroke-width="2" />
      <template v-if="medidorPath">
        <rect v-for="h in 24" :key="'m' + h" v-show="tieneValor(medidor, h - 1)"
              :x="x(h - 1) - 3" :y="y(val(medidor, h - 1)) - 3" width="6" height="6"
              fill="#3B82F6" stroke="white" stroke-width="1" />
      </template>

      <path v-if="soleniumPath" :d="soleniumPath" fill="none" stroke="#0D9488" stroke-width="2" stroke-dasharray="6 4" />
      <template v-if="soleniumPath">
        <polygon v-for="h in 24" :key="'s' + h" v-show="tieneValor(solenium, h - 1)"
                 :points="trianguloPoints(x(h - 1), y(val(solenium, h - 1)))"
                 fill="#0D9488" stroke="white" stroke-width="1" />
      </template>

      <!-- Capacidad efectiva -- linea de referencia, no es una serie de datos --
           encima de todo para que siempre se vea si alguna curva la cruza. -->
      <template v-if="capacidadKwh != null">
        <line :x1="padL" :x2="W - padR" :y1="y(capacidadKwh)" :y2="y(capacidadKwh)"
              stroke="#9b89b5" stroke-width="1.5" stroke-dasharray="4 3" />
      </template>
    </svg>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  final: { type: Array, default: () => Array(24).fill(null) },
  medidor: { type: Array, default: null },
  solenium: { type: Array, default: null },
  horasReconectador: { type: Array, default: () => [] },
  horasSolenium: { type: Array, default: () => [] },
  horasHistorico: { type: Array, default: () => [] },
  // Capacidad efectiva de la frontera (MW) -- viene en MW, pero el chart
  // grafica en kWh por hora, así que se convierte (1 MW sostenida 1h = 1.000 kWh).
  capacidadMw: { type: Number, default: null },
})

const W = 700, H = 210, padL = 30, padR = 10, padT = 10, padB = 20
const plotW = W - padL - padR, plotH = H - padT - padB

const finalCurve = computed(() => props.final || Array(24).fill(null))
const horasRellenadas = computed(() => new Set([
  ...(props.horasReconectador || []), ...(props.horasSolenium || []), ...(props.horasHistorico || []),
]))
// Caso 1/CGM (reporte válido): se confía en el total diario que ya validó
// Quoia -- no se reconstruye una curva horaria propia, así que 'final'
// llega en 0 las 24 horas. Mostrar esa línea plana confunde (parece un
// error); mejor ocultarla y dejar solo el medidor de referencia.
const finalVacia = computed(() => finalCurve.value.every(v => v === null || v === undefined || Number(v) === 0))

function val(arr, h) {
  const v = arr?.[h]
  return v === null || v === undefined ? 0 : Number(v)
}
function tieneValor(arr, h) {
  const v = arr?.[h]
  return v !== null && v !== undefined
}
// Triángulo pequeño centrado en (cx, cy) -- marcador propio de Solenium,
// distinto del cuadrado de Medidor y el círculo de Final, para que la
// diferencia no dependa solo del color.
function trianguloPoints(cx, cy) {
  const r = 4
  return `${cx},${cy - r} ${cx - r},${cy + r} ${cx + r},${cy + r}`
}

const capacidadKwh = computed(() => (props.capacidadMw != null ? props.capacidadMw * 1000 : null))
const capacidadMwFmt = computed(() => (props.capacidadMw != null ? props.capacidadMw.toLocaleString('es-CO', { maximumFractionDigits: 2 }) : ''))

const maxV = computed(() => {
  const all = [...finalCurve.value, ...(props.medidor || []), ...(props.solenium || [])]
    .filter((v) => v !== null && v !== undefined)
    .map(Number)
  // La linea de capacidad tambien entra en el calculo del eje -- si la
  // generacion se queda muy por debajo, igual se ve la referencia completa;
  // si la generacion la supera, se ve el cruce en vez de cortarse el chart.
  if (capacidadKwh.value != null) all.push(capacidadKwh.value)
  return Math.max(1, ...all) * 1.15
})

function x(h) { return padL + (h / 23) * plotW }
function y(v) { return padT + plotH - (v / maxV.value) * plotH }

function pathDe(arr) {
  if (!arr) return null
  let d = ''
  let tramo = false
  for (let h = 0; h < 24; h++) {
    const v = arr[h]
    if (v === null || v === undefined) { tramo = false; continue }
    d += (!tramo ? 'M' : 'L') + x(h).toFixed(1) + ',' + y(Number(v)).toFixed(1) + ' '
    tramo = true
  }
  return d || null
}

const finalPath = computed(() => pathDe(finalCurve.value.map((v) => (v === null ? 0 : v))) || '')
const finalArea = computed(() => {
  const base = finalPath.value
  if (!base) return ''
  return base + ` L${x(23).toFixed(1)},${(padT + plotH).toFixed(1)} L${x(0).toFixed(1)},${(padT + plotH).toFixed(1)} Z`
})
const medidorPath = computed(() => pathDe(props.medidor))
const soleniumPath = computed(() => pathDe(props.solenium))
</script>

<style scoped>
.chip { border: 1px solid; border-radius: 999px; padding: 2px 10px; font-weight: 600; }
</style>
