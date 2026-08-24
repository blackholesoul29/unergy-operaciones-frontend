<template>
  <!--
    Tile de KPI de una métrica del trimestre (spec §4.4).
    No navega: al hacer clic hace scroll a su fila de la matriz y la resalta.
  -->
  <div class="rq-card rq-kpi" @click="emit('foco', metrica)">
    <!-- 1. Fila título -->
    <div class="rq-kpi-head">
      <span class="rq-kpi-nombre" v-tooltip.top="metrica.descripcion || ''">{{ metrica.nombre }}</span>
      <span v-if="!metrica.activa" class="rq-chip rq-chip-neutro">Inactiva</span>
      <span class="rq-chip" :style="estadoBadge(metrica.estado)">{{ estadoLabel(metrica.estado) }}</span>
      <Button text rounded size="small" class="rq-kpi-mas" :aria-label="`Acciones de ${metrica.nombre}`" @click.stop="menu.toggle($event)">
        <template #icon><EllipsisIcon class="size-[1em]" /></template>
      </Button>
      <Menu ref="menu" :model="items" :popup="true">
        <template #itemicon="{ item }"><component :is="item.icon" class="size-[1em]" /></template>
      </Menu>
    </div>

    <!-- 2. Fila metadatos -->
    <div v-if="metaDatos || metrica.direccion === 'menor_mejor'" class="rq-kpi-meta">
      <span v-if="metaDatos">{{ metaDatos }}</span>
      <span v-if="metrica.direccion === 'menor_mejor'" class="rq-chip-dir">menos es mejor</span>
    </div>

    <!-- 3. Fila cifras -->
    <div class="rq-kpi-cifras">
      <span class="rq-kpi-consolidado" :class="{ 'rq-kpi-nulo': consolidadoTxt === null }">
        {{ consolidadoTxt === null ? '—' : consolidadoTxt }}
      </span>
      <span v-if="tieneMeta" class="rq-kpi-meta-valor">/ {{ metaTxt }}</span>
      <span class="flex-1"></span>
      <Sparkline :serie="metrica.serie || []" :estado="metrica.estado" />
    </div>

    <!-- 4. Bullet -->
    <BulletMeta
      :avance-pct="numeroONulo(metrica.avance_pct)"
      :meta="numeroONulo(metrica.meta)"
      :meta-esperada="numeroONulo(metrica.meta_esperada)"
      :estado="metrica.estado"
      :unidad="metrica.unidad || ''"
      :decimales="metrica.decimales || 0"
    />

    <!-- 5 y 6. Pie -->
    <div>
      <div class="rq-kpi-pie1">
        <template v-if="tieneMeta">
          <span>{{ fmtPct(metrica.avance_pct) }} de la meta</span>
          <span class="rq-kpi-punto">·</span>
          <span :style="{ color: estadoColor(metrica.estado) }">ritmo {{ fmtPctEntero(metrica.cumplimiento_pct) }}</span>
        </template>
        <span v-else class="rq-kpi-sin-meta">Sin meta definida</span>
      </div>
      <div class="rq-kpi-pie2">{{ pie2 }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import Button from 'primevue/button'
import Menu from 'primevue/menu'
import Sparkline from './viz/Sparkline.vue'
import BulletMeta from './viz/BulletMeta.vue'
import { EllipsisIcon, EyeIcon, EyeOffIcon, PencilIcon, Trash2Icon } from '@lucide/vue'
import {
  estadoBadge, estadoColor, estadoLabel,
  fmtNumero, fmtPct, fmtPctEntero, fmtValor,
  TIPOS_AGREGACION,
} from './retosUi'

const props = defineProps({
  /** MetricaResumen del contrato. */
  metrica: { type: Object, required: true },
  totalSemanas: { type: Number, default: 0 },
})

const emit = defineEmits(['foco', 'editar', 'alternar-activa', 'eliminar'])

const menu = ref(null)

const items = computed(() => [
  { label: 'Editar métrica', icon: PencilIcon, command: () => emit('editar', props.metrica) },
  {
    label: props.metrica.activa ? 'Desactivar métrica' : 'Activar métrica',
    icon: props.metrica.activa ? EyeOffIcon : EyeIcon,
    command: () => emit('alternar-activa', props.metrica),
  },
  { separator: true },
  { label: 'Eliminar métrica', icon: Trash2Icon, class: 'rq-menu-danger', command: () => emit('eliminar', props.metrica) },
])

function numeroONulo(v) {
  if (v === null || v === undefined) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

const tieneMeta = computed(() => numeroONulo(props.metrica.meta) !== null)

/** `MWh · suma · Laura` — los tramos vacíos se omiten, no dejan huecos. */
const metaDatos = computed(() => {
  const m = props.metrica
  const partes = []
  if (m.unidad) partes.push(m.unidad)
  const agg = TIPOS_AGREGACION.find(t => t.value === m.tipo_agregacion)
  if (agg) partes.push(agg.label.toLowerCase())
  if (m.responsable) partes.push(m.responsable)
  return partes.join(' · ')
})

const consolidadoTxt = computed(() => fmtNumero(props.metrica.consolidado, props.metrica.decimales || 0))

const metaTxt = computed(() => fmtValor(props.metrica.meta, props.metrica.decimales || 0, props.metrica.unidad || ''))

const pie2 = computed(() => {
  const m = props.metrica
  const semanas = `${m.semanas_con_dato ?? 0} de ${props.totalSemanas} semanas con dato`
  if (!tieneMeta.value) return semanas
  const esSuma = m.tipo_agregacion === 'suma'
  // En `suma` la meta se prorratea, así que hay un "esperado a hoy"; en el
  // resto de agregaciones la meta es la misma toda la ventana (contrato §4).
  const valor = fmtValor(esSuma ? m.meta_esperada : m.meta, m.decimales || 0, m.unidad || '')
  return `${esSuma ? 'Esperado a hoy' : 'Meta'} ${valor} · ${semanas}`
})
</script>

<style scoped>
.rq-card {
  background: #fff;
  border: 1px solid #e8e0f0;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(44, 32, 57, .04);
}

.rq-kpi {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
}

/* 1. Título */
.rq-kpi-head { display: flex; align-items: center; gap: 6px; min-width: 0; }
.rq-kpi-nombre {
  flex: 1; min-width: 0;
  font-size: 12.5px; font-weight: 700; color: #2C2039;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.rq-chip {
  flex: none;
  font-size: 10px; font-weight: 700; line-height: 1.5;
  padding: 1px 7px; border-radius: 999px; white-space: nowrap;
}
.rq-chip-neutro { color: #6b5a8a; background: rgba(44, 32, 57, .06); }

/* El menú solo aparece cuando la tarjeta está viva: no compite con el dato */
.rq-kpi-mas {
  flex: none;
  opacity: 0;
  transition: opacity .12s ease;
  width: 24px; height: 24px;
}
.rq-kpi:hover .rq-kpi-mas,
.rq-kpi:focus-within .rq-kpi-mas { opacity: 1; }

/* 2. Metadatos */
.rq-kpi-meta {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
  font-size: 10px; font-weight: 600; color: #6b5a8a; margin-top: -4px;
}
.rq-chip-dir {
  font-size: 10px; font-weight: 700; color: #6b5a8a;
  background: rgba(44, 32, 57, .06); padding: 0 6px; border-radius: 999px;
}

/* 3. Cifras */
.rq-kpi-cifras { display: flex; align-items: baseline; gap: 6px; min-width: 0; }
.rq-kpi-consolidado {
  font-size: 20px; font-weight: 800; color: #2C2039;
  font-variant-numeric: tabular-nums; line-height: 1.1;
}
.rq-kpi-nulo { color: #c7bdd8; }
.rq-kpi-meta-valor {
  font-size: 12px; font-weight: 600; color: #6b5a8a;
  font-variant-numeric: tabular-nums; white-space: nowrap;
}
.rq-kpi-cifras :deep(svg) { align-self: center; flex: none; }

/* 5 y 6. Pie */
.rq-kpi-pie1 {
  display: flex; align-items: center; gap: 5px; flex-wrap: wrap;
  font-size: 11px; font-weight: 600; color: #2C2039;
}
.rq-kpi-punto { color: #c7bdd8; }
.rq-kpi-sin-meta { color: #9b8fb0; font-weight: 600; }
.rq-kpi-pie2 { font-size: 10px; font-weight: 400; color: #9b8fb0; margin-top: 2px; }
</style>
