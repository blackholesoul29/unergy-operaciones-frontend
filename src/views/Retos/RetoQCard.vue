<template>
  <div
    class="rq-card-q"
    :class="{ 'rq-q-actual': esEnCurso }"
    role="link"
    tabindex="0"
    :aria-label="`Abrir ${reto.nombre || `Retos Q${reto.trimestre}`}`"
    @click="abrir"
    @keydown.enter.prevent="abrir"
    @keydown.space.prevent="abrir"
  >
    <!-- a) Eyebrow -->
    <div class="rq-q-eyebrow">
      <span class="rq-q-eyebrow-l">
        <span class="rq-q-num">Q{{ reto.trimestre }}</span>
        <span class="rq-q-punto-sep">·</span>
        <span class="rq-q-meses">{{ mesesRango }}</span>
      </span>
      <span class="rq-chip" :style="periodoBadge(reto.estado_periodo)">
        <span v-if="esEnCurso" class="rq-punto-vivo" />
        {{ periodoLabel(reto.estado_periodo) }}
      </span>
    </div>

    <!-- b) Identidad + anillo -->
    <div class="rq-q-identidad">
      <div class="rq-q-ident-txt">
        <div class="rq-q-nombre">{{ reto.nombre || `Retos Q${reto.trimestre} ${reto.anio}` }}</div>
        <div class="rq-q-rango">{{ rangoTxt }}</div>
        <div class="rq-q-semanas">{{ semanasTxt }}</div>
      </div>
      <div class="rq-q-anillo">
        <AnilloAvance :pct="pctGlobal" :estado="estadoQ" />
        <span class="rq-q-ritmo">ritmo</span>
      </div>
    </div>

    <!-- c) Chip de estado agregado -->
    <div>
      <span class="rq-chip" :style="estadoBadge(estadoQ)">{{ estadoLabel(estadoQ) }}</span>
    </div>

    <template v-if="sinMetricas">
      <!-- Tarjeta sin métricas -->
      <div class="rq-q-vacio">
        <div class="rq-q-vacio-titulo">Sin métricas definidas</div>
        <div class="rq-q-vacio-cta">Definir métricas</div>
      </div>
    </template>

    <template v-else>
      <!-- d) Separador -->
      <div class="rq-q-sep" />

      <!-- e) Lista de métricas (máx. 3) -->
      <div class="rq-q-metricas">
        <div v-for="m in metricasVisibles" :key="m.id" class="rq-q-metrica">
          <div class="rq-q-m-nombre">{{ m.nombre }}</div>
          <div class="rq-q-m-linea">
            <Sparkline :serie="m.serie || []" :estado="m.estado" />
            <span class="rq-q-m-spacer" />
            <span v-if="consolidadoDe(m) === null" class="rq-q-m-vacio">—</span>
            <template v-else>
              <span class="rq-q-m-valor">{{ consolidadoDe(m) }}</span>
              <span
                v-if="m.unidad"
                class="rq-q-m-unidad"
                :class="{ 'rq-q-m-unidad-pegada': m.unidad === '%' }"
              >{{ m.unidad }}</span>
            </template>
          </div>
        </div>
        <div v-if="metricasRestantes > 0" class="rq-q-mas">
          +{{ metricasRestantes }} {{ metricasRestantes === 1 ? 'métrica más' : 'métricas más' }}
        </div>
      </div>

      <!-- f) Pie -->
      <div class="rq-q-pie">{{ pieTxt }}</div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  estadoBadge,
  estadoLabel,
  periodoBadge,
  periodoLabel,
  fmtNumero,
  fmtRango,
} from './retosUi'
import AnilloAvance from './viz/AnilloAvance.vue'
import Sparkline from './viz/Sparkline.vue'

const props = defineProps({
  /** `RetoResumen` del contrato (§5). */
  reto: { type: Object, required: true },
})

const emit = defineEmits(['abrir'])

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function abrir() {
  emit('abrir', props.reto)
}

const esEnCurso = computed(() => props.reto.estado_periodo === 'en_curso')

const pctGlobal = computed(() => {
  const n = Number(props.reto.avance_global_pct)
  const crudo = props.reto.avance_global_pct
  if (crudo === null || crudo === undefined || !Number.isFinite(n)) return null
  return n
})

/** Mismos umbrales del contrato §4, aplicados al roll-up del trimestre. */
const estadoQ = computed(() => {
  const p = pctGlobal.value
  if (p === null) return 'sin_datos'
  if (p < 70) return 'en_riesgo'
  if (p < 100) return 'atencion'
  if (p < 110) return 'cumple'
  return 'excede'
})

function mesDe(iso) {
  const m = Number(String(iso || '').split('-')[1])
  return m >= 1 && m <= 12 ? MESES[m - 1] : ''
}

/** `jul–sep` (un solo mes si el trimestre no cruza de mes). */
const mesesRango = computed(() => {
  const a = mesDe(props.reto.fecha_inicio)
  const b = mesDe(props.reto.fecha_fin)
  if (!a && !b) return ''
  if (!b || a === b) return a
  if (!a) return b
  return `${a}–${b}`
})

const rangoTxt = computed(() => fmtRango(props.reto.fecha_inicio, props.reto.fecha_fin))

const semanasTxt = computed(() => {
  const total = Number(props.reto.total_semanas) || 0
  const base = `${total} ${total === 1 ? 'semana' : 'semanas'}`
  const actual = props.reto.semana_actual
  if (actual !== null && actual !== undefined) return `${base} · S${actual} de ${total}`
  if (props.reto.estado_periodo === 'cerrado') return `${base} · cerrado`
  return base
})

const metricasActivas = computed(() => {
  const lista = Array.isArray(props.reto.metricas) ? props.reto.metricas : []
  return lista
    .filter(m => m && m.activa !== false)
    .slice()
    .sort((a, b) => (Number(a.orden) || 0) - (Number(b.orden) || 0) || (Number(a.id) || 0) - (Number(b.id) || 0))
})

const metricasVisibles = computed(() => metricasActivas.value.slice(0, 3))
const metricasRestantes = computed(() => Math.max(metricasActivas.value.length - 3, 0))

const sinMetricas = computed(
  () => !metricasActivas.value.length && !(Number(props.reto.total_metricas) > 0)
)

function consolidadoDe(m) {
  return fmtNumero(m.consolidado, m.decimales)
}

const pieTxt = computed(() => {
  const nm = Number(props.reto.total_metricas) || 0
  const ns = Number(props.reto.semanas_con_datos) || 0
  const metricas = `${nm} ${nm === 1 ? 'métrica' : 'métricas'}`
  const semanas = `${ns} ${ns === 1 ? 'semana con datos' : 'semanas con datos'}`
  return `${metricas} · ${semanas}`
})
</script>

<style scoped>
/* ── Superficie (§1.4) ─────────────────────────────────────────────────── */
.rq-card-q {
  background: #fff;
  border: 1px solid #e8e0f0;
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 1px 2px rgba(44, 32, 57, .04);
  display: flex;
  flex-direction: column;
  gap: 10px;
  cursor: pointer;
  transition: all .14s ease;
}
.rq-card-q:hover {
  border-color: #B08AE2;
  box-shadow: 0 6px 18px rgba(44, 32, 57, .09);
  transform: translateY(-1px);
}
.rq-card-q:focus-visible {
  outline: 2px solid #915BD8;
  outline-offset: 2px;
}
/* Trimestre en curso: se mantiene también en hover */
.rq-q-actual {
  border: 1.5px solid #915BD8;
  box-shadow: 0 0 0 3px rgba(145, 91, 216, .10);
}
.rq-q-actual:hover {
  border-color: #915BD8;
  box-shadow: 0 0 0 3px rgba(145, 91, 216, .10), 0 6px 18px rgba(44, 32, 57, .09);
}

/* ── a) Eyebrow ────────────────────────────────────────────────────────── */
.rq-q-eyebrow { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.rq-q-eyebrow-l { display: inline-flex; align-items: center; gap: 4px; min-width: 0; }
.rq-q-num { font-size: 11px; font-weight: 800; color: #915BD8; }
.rq-q-punto-sep { font-size: 11px; color: #9b8fb0; }
.rq-q-meses { font-size: 11px; font-weight: 600; color: #9b8fb0; }

.rq-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 999px;
  white-space: nowrap;
}
.rq-punto-vivo {
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: #915BD8;
  animation: rq-pulse 2s ease-in-out infinite;
}
@keyframes rq-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }

/* ── b) Identidad + anillo ─────────────────────────────────────────────── */
.rq-q-identidad { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
.rq-q-ident-txt { min-width: 0; }
.rq-q-nombre {
  font-size: 15px; font-weight: 800; color: #2C2039; line-height: 1.2;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.rq-q-rango { font-size: 11px; color: #6b5a8a; margin-top: 2px; }
.rq-q-semanas { font-size: 11px; color: #9b8fb0; }
.rq-q-anillo { display: flex; flex-direction: column; align-items: center; gap: 2px; flex-shrink: 0; }
.rq-q-ritmo {
  font-size: 8px; font-weight: 700; color: #9b8fb0;
  text-transform: uppercase; letter-spacing: .06em;
}

/* ── d) Separador ──────────────────────────────────────────────────────── */
.rq-q-sep { height: 1px; background: #ECE7F2; }

/* ── e) Lista de métricas ──────────────────────────────────────────────── */
.rq-q-metricas { display: flex; flex-direction: column; gap: 6px; }
.rq-q-m-nombre {
  font-size: 11px; font-weight: 600; color: #2C2039;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.rq-q-m-linea { display: flex; align-items: center; gap: 8px; }
.rq-q-m-spacer { flex: 1; }
.rq-q-m-valor {
  font-size: 12px; font-weight: 700; color: #2C2039;
  font-variant-numeric: tabular-nums;
}
.rq-q-m-unidad { font-size: 10px; font-weight: 600; color: #9b8fb0; margin-left: 3px; }
.rq-q-m-unidad-pegada { margin-left: 0; }
.rq-q-m-vacio { font-size: 12px; font-weight: 700; color: #c7bdd8; }
.rq-q-mas { font-size: 10px; font-weight: 600; color: #915BD8; }

/* ── f) Pie ────────────────────────────────────────────────────────────── */
.rq-q-pie { font-size: 10px; font-weight: 600; color: #6b5a8a; }

/* ── Tarjeta sin métricas ──────────────────────────────────────────────── */
.rq-q-vacio {
  border: 1px dashed #d9d0e6;
  border-radius: 10px;
  padding: 14px 10px;
  text-align: center;
}
.rq-q-vacio-titulo { font-size: 11px; font-weight: 600; color: #9b8fb0; }
.rq-q-vacio-cta { font-size: 11px; font-weight: 700; color: #915BD8; margin-top: 3px; }

@media (prefers-reduced-motion: reduce) {
  .rq-card-q { transition: none; }
  .rq-card-q:hover { transform: none; }
  .rq-punto-vivo { animation: none; }
}
</style>
