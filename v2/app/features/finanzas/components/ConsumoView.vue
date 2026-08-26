<template>
  <div class="space-y-4">
    <PageHeader title="Consumo"
                subtitle="Consumo horario por proyecto y día" />

    <!-- Filtros -->
    <div class="bg-white rounded-xl shadow-sm p-3 flex flex-wrap gap-3 items-end border" style="border-color:#ECE7F2">
      <div>
        <label class="field-label">Proyecto</label>
        <Select v-model="filtros.proyecto" :options="proyectosOptions" optionLabel="label" optionValue="value"
                class="w-52" showClear filter placeholder="Todos" />
      </div>
      <div>
        <label class="field-label">Mes</label>
        <Select v-model="filtros.mes" :options="MESES" optionLabel="label" optionValue="value"
                class="w-32" showClear placeholder="Todos" />
      </div>
      <div>
        <label class="field-label">Año</label>
        <Select v-model="filtros.anio" :options="aniosOptions" class="w-28" showClear placeholder="Todos" />
      </div>
      <div>
        <label class="field-label">Versión</label>
        <Select v-model="filtros.version" :options="VERSIONES" class="w-24" showClear placeholder="Todas" />
      </div>
      <div>
        <label class="field-label">Buscar</label>
        <IconField>
          <InputIcon><SearchIcon class="size-[1em]" /></InputIcon>
          <InputText v-model="q" placeholder="Proyecto…" class="w-48" />
        </IconField>
      </div>
      <div class="flex-1" />
      <Button size="small" text rounded :loading="loading" v-tooltip.left="'Recargar'" @click="cargar">
        <template #icon><RefreshCwIcon class="size-[1em]" /></template>
      </Button>
      <div class="text-xs text-gray-400 self-center">
        {{ filtrados.length }} registro{{ filtrados.length === 1 ? '' : 's' }}
      </div>
    </div>

    <!-- Tabla: 24 horas + total. Las tres primeras columnas quedan fijas para no
         perder de vista el proyecto al desplazarse por las horas. -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden border" style="border-color:#ECE7F2">
      <div class="overflow-x-auto">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100">
              <th class="col-fija col-proyecto px-4 py-2.5 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Proyecto</th>
              <th class="col-fija col-fecha px-3 py-2.5 text-left font-medium text-gray-500 text-xs uppercase tracking-wide whitespace-nowrap">Fecha</th>
              <th class="col-fija col-version px-3 py-2.5 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Versión</th>
              <th v-for="h in HORAS" :key="h"
                  class="px-2 py-2.5 text-right font-medium text-gray-500 text-[10px] uppercase whitespace-nowrap">
                {{ h }}
              </th>
              <th class="px-3 py-2.5 text-right font-semibold text-[11px] uppercase whitespace-nowrap"
                  style="color:var(--color-unergy-deep); border-left:1px solid #EEE;">Total diario</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in filtrados" :key="i"
                class="border-t border-gray-100 hover:bg-gray-50/70 transition-colors duration-100 row-hover">
              <td class="col-fija col-proyecto px-4 py-2">{{ row.proyecto || '—' }}</td>
              <td class="col-fija col-fecha px-3 py-2 text-xs text-gray-500 whitespace-nowrap">{{ row.fecha || '—' }}</td>
              <td class="col-fija col-version px-3 py-2 text-xs font-mono uppercase">{{ row.version || '—' }}</td>
              <td v-for="(v, j) in row.horas" :key="j"
                  class="px-2 py-2 text-right font-mono text-[11px] text-gray-600">
                {{ fmtNum(v) }}
              </td>
              <td class="px-3 py-2 text-right font-mono text-xs font-semibold"
                  style="color:var(--color-unergy-purple); border-left:1px solid #F1F1F1;">
                {{ fmtNum(row.total_diario) }}
              </td>
            </tr>
            <tr v-if="loading">
              <td :colspan="HORAS.length + 4" class="px-4 py-12 text-center text-gray-400">
                <LoaderCircleIcon class="text-2xl size-[1em] animate-spin" />
              </td>
            </tr>
            <tr v-else-if="!filtrados.length">
              <td :colspan="HORAS.length + 4" class="px-4 py-12 text-center text-sm text-gray-400">
                <ZapIcon class="text-2xl mb-2 block text-gray-300 size-[1em]" />
                Aún no hay consumo registrado.<br>
                <span class="text-xs">La carga de datos se conectará a la API cuando exista.</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Button from 'primevue/button'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import api from '~/core/client'
import { VERSIONES } from '~/features/liquidaciones/types'
import { LoaderCircleIcon, RefreshCwIcon, SearchIcon, ZapIcon } from '@lucide/vue'

// Las 24 horas del día, como las nombra XM (CON HOUR01 … CON HOUR24).
const HORAS = Array.from({ length: 24 }, (_, i) => `H${String(i + 1).padStart(2, '0')}`)

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
].map((label, i) => ({ label, value: i + 1 }))

const aniosOptions = computed(() => {
  const actual = new Date().getFullYear()
  return Array.from({ length: 6 }, (_, i) => actual - i)
})

const filtros = reactive({ proyecto: null, mes: null, anio: null, version: null })
const q = ref('')
const loading = ref(false)
const consumos = ref([])          // se llenará cuando exista la API
const proyectosOptions = ref([])

const filtrados = computed(() => {
  const term = q.value.trim().toLowerCase()
  return consumos.value.filter(c => {
    if (filtros.proyecto && c.proyecto !== filtros.proyecto) return false
    if (filtros.version && c.version !== filtros.version) return false
    const f = String(c.fecha || '')
    if (filtros.anio && f.slice(0, 4) !== String(filtros.anio)) return false
    if (filtros.mes && Number(f.slice(5, 7)) !== filtros.mes) return false
    return !term || String(c.proyecto || '').toLowerCase().includes(term)
  })
})

function fmtNum(v) {
  if (v === null || v === undefined || v === '') return '—'
  const n = Number(v)
  if (Number.isNaN(n)) return String(v)
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(n)
}

/**
 * Normaliza una fila del API a `{ proyecto, fecha, version, horas[24], total_diario }`.
 *
 * Acepta las dos formas en que suele venir este dato — un arreglo `horas` o 24
 * campos sueltos tipo `con_hour01` — para no tener que reescribir la vista
 * cuando se conozca la respuesta real. El total se calcula si no viene.
 */
function normalizar(fila) {
  const horas = Array.isArray(fila.horas)
    ? fila.horas
    : HORAS.map((_, i) => {
        const n = String(i + 1).padStart(2, '0')
        return fila[`con_hour${n}`] ?? fila[`hora_${n}`] ?? fila[`CON HOUR${n}`] ?? null
      })
  const total = fila.total_diario ?? horas.reduce((s, v) => s + (Number(v) || 0), 0)
  return {
    proyecto: fila.proyecto ?? fila.project ?? null,
    fecha: String(fila.fecha ?? fila.date ?? '').slice(0, 10) || null,
    version: fila.version ?? null,
    horas,
    total_diario: total,
  }
}

async function cargar() {
  loading.value = true
  try {
    // TODO: cambiar por el endpoint real cuando exista (no hay API de consumo
    // horario todavía: se probaron consumptions/, aenc/, hourly_consumption/… 404).
    consumos.value = []
  } finally {
    loading.value = false
  }
}

async function cargarProyectos() {
  try {
    const { data } = await api.get('/liquidaciones-api/proyectos')
    proyectosOptions.value = (data || [])
      .filter(p => p.nombre_topico)
      .map(p => ({ value: p.nombre_topico, label: p.nombre_comercial }))
      .sort((a, b) => a.label.localeCompare(b.label))
  } catch { /* el filtro queda vacío, la tabla sigue sirviendo */ }
}

onMounted(() => { cargar(); cargarProyectos() })
</script>

<style scoped>
/* MIGRACIÓN — Fase 1: en Tailwind 4 cada bloque <style> se procesa aislado y no
   ve el tema, así que `@apply` falla con "unknown utility class". `@reference`
   le da acceso al tema sin emitir CSS. Era innecesario en Tailwind 3. */
@reference 'tailwindcss';
.field-label { @apply block text-xs font-medium text-gray-600 mb-1; }

/* Proyecto, fecha y versión quedan fijas: con 24 horas la tabla se desplaza
   mucho y sin esto se pierde de vista a qué fila corresponde cada número. */
.col-fija {
  position: sticky;
  z-index: 2;
  background: #ffffff;
}
thead .col-fija { background: #F9FAFB; z-index: 3; }
.row-hover:hover .col-fija { background: #F8FAFC; }
.col-proyecto { left: 0; min-width: 190px; }
.col-fecha { left: 190px; }
.col-version { left: 290px; border-right: 1px solid #E5E7EB; }
</style>
