<template>
  <div class="space-y-4">
    <PageHeader title="Consumo" subtitle="Energía contratada hora por hora, según el FTP de XM">
      <template #actions>
        <Button
          label="Exportar"
          icon="pi pi-download"
          size="small"
          outlined
          :disabled="!filtrados.length"
          @click="exportar"
        />
      </template>
    </PageHeader>

    <!-- Filtros -->
    <div
      class="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-3 shadow-sm"
      style="border-color: #ece7f2"
    >
      <div>
        <label class="field-label">Proyecto</label>
        <Select
          v-model="filtros.proyecto"
          :options="proyectosOptions"
          optionLabel="label"
          optionValue="value"
          class="w-52"
          showClear
          filter
          placeholder="Todos"
        />
      </div>
      <!-- Mes, año y versión definen el período que se le pide a XM: no se
           filtran en pantalla, se recarga. Por eso no admiten "todos". -->
      <div>
        <label class="field-label">Mes</label>
        <Select
          v-model="filtros.mes"
          :options="MESES"
          optionLabel="label"
          optionValue="value"
          class="w-32"
          @change="cargar"
        />
      </div>
      <div>
        <label class="field-label">Año</label>
        <Select v-model="filtros.anio" :options="aniosOptions" class="w-28" @change="cargar" />
      </div>
      <div>
        <label class="field-label">Versión</label>
        <Select v-model="filtros.version" :options="VERSIONES" class="w-24" @change="cargar" />
      </div>
      <div>
        <label class="field-label">Buscar</label>
        <IconField>
          <InputIcon class="pi pi-search" />
          <InputText v-model="q" placeholder="Proyecto…" class="w-48" />
        </IconField>
      </div>
      <div class="flex-1" />
      <Button
        icon="pi pi-refresh"
        size="small"
        text
        rounded
        :loading="loading"
        v-tooltip.left="'Recargar'"
        @click="cargar"
      />
      <div class="self-center text-xs text-gray-400">
        {{ filtrados.length }} registro{{ filtrados.length === 1 ? '' : 's' }}
        <span v-if="filtrados.length" class="block font-mono" style="color: #915bd8">
          {{ fmtNum(totalPeriodo) }} kWh
        </span>
      </div>
    </div>

    <div
      v-if="error"
      class="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
      style="background: #fef2f2; border: 1px solid #fecaca; color: #991b1b"
    >
      <i class="pi pi-times-circle" />{{ error }}
    </div>

    <!-- Tabla: 24 horas + total. Las tres primeras columnas quedan fijas para no
         perder de vista el proyecto al desplazarse por las horas. -->
    <div class="overflow-hidden rounded-xl border bg-white shadow-sm" style="border-color: #ece7f2">
      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-sm">
          <thead>
            <tr class="border-b border-gray-100 bg-gray-50">
              <th
                class="col-fija col-proyecto px-4 py-2.5 text-left text-xs font-medium tracking-wide text-gray-500 uppercase"
              >
                Proyecto
              </th>
              <th
                class="col-fija col-fecha px-3 py-2.5 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase"
              >
                Fecha
              </th>
              <th
                class="col-fija col-version px-3 py-2.5 text-left text-xs font-medium tracking-wide text-gray-500 uppercase"
              >
                Versión
              </th>
              <th
                v-for="h in HORAS"
                :key="h"
                class="px-2 py-2.5 text-right text-[10px] font-medium whitespace-nowrap text-gray-500 uppercase"
              >
                {{ h }}
              </th>
              <th
                class="px-3 py-2.5 text-right text-[11px] font-semibold whitespace-nowrap uppercase"
                style="color: #2c2039; border-left: 1px solid #eee"
              >
                Total diario
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, i) in filtrados"
              :key="i"
              class="row-hover border-t border-gray-100 transition-colors duration-100 hover:bg-gray-50/70"
            >
              <td class="col-fija col-proyecto px-4 py-2">{{ row.proyecto || '—' }}</td>
              <td class="col-fija col-fecha px-3 py-2 text-xs whitespace-nowrap text-gray-500">
                {{ row.fecha || '—' }}
              </td>
              <td class="col-fija col-version px-3 py-2 font-mono text-xs uppercase">
                {{ row.version || '—' }}
              </td>
              <td
                v-for="(v, j) in row.horas"
                :key="j"
                class="px-2 py-2 text-right font-mono text-[11px] text-gray-600"
              >
                {{ fmtNum(v) }}
              </td>
              <td
                class="px-3 py-2 text-right font-mono text-xs font-semibold"
                style="color: #915bd8; border-left: 1px solid #f1f1f1"
              >
                {{ fmtNum(row.total_diario) }}
              </td>
            </tr>
            <tr v-if="loading">
              <td :colspan="HORAS.length + 4" class="px-4 py-12 text-center text-gray-400">
                <i class="pi pi-spin pi-spinner text-2xl" />
              </td>
            </tr>
            <tr v-else-if="!filtrados.length">
              <td :colspan="HORAS.length + 4" class="px-4 py-12 text-center text-sm text-gray-400">
                <i class="pi pi-bolt mb-2 block text-2xl text-gray-300" />
                No hay consumo para este período.<br />
                <span class="text-xs">
                  Estos datos los trae «Descargar FTP» desde Despachos liquidados.
                </span>
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
import api from '@/api/client'
import { VERSIONES, VERSION_INICIAL, listarConsumo } from '@/api/liquidacionesApi'

// Las 24 horas del día, como las nombra XM (CON HOUR01 … CON HOUR24).
const HORAS = Array.from({ length: 24 }, (_, i) => `H${String(i + 1).padStart(2, '0')}`)

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
].map((label, i) => ({ label, value: i + 1 }))

const aniosOptions = computed(() => {
  const actual = new Date().getFullYear()
  return Array.from({ length: 6 }, (_, i) => actual - i)
})

// Arranca en el mes pasado: el actual todavía no está liquidado.
const mesPasado = new Date()
mesPasado.setMonth(mesPasado.getMonth() - 1)

const filtros = reactive({
  proyecto: null,
  mes: mesPasado.getMonth() + 1,
  anio: mesPasado.getFullYear(),
  version: VERSION_INICIAL,
})
const q = ref('')
const loading = ref(false)
const error = ref('')
const consumos = ref([])
const proyectosOptions = ref([])

// El período ya viene filtrado del servidor; aquí solo se afina por proyecto.
const filtrados = computed(() => {
  const term = q.value.trim().toLowerCase()
  return consumos.value.filter((c) => {
    if (filtros.proyecto && c.topico !== filtros.proyecto) return false
    return (
      !term ||
      String(c.proyecto || '')
        .toLowerCase()
        .includes(term)
    )
  })
})

/** Suma de los totales diarios de lo que se está viendo, en kWh. */
const totalPeriodo = computed(() =>
  filtrados.value.reduce((s, c) => s + (Number(c.total_diario) || 0), 0),
)

function fmtNum(v) {
  if (v === null || v === undefined || v === '') return '—'
  const n = Number(v)
  if (Number.isNaN(n)) return String(v)
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(n)
}

async function cargar() {
  loading.value = true
  error.value = ''
  try {
    const data = await listarConsumo({
      month: filtros.mes,
      year: filtros.anio,
      version: filtros.version,
    })
    consumos.value = data.results || []
  } catch (e) {
    error.value = e?.response?.data?.detail || 'No se pudo consultar el consumo del período.'
    consumos.value = []
  } finally {
    loading.value = false
  }
}

/** Descarga lo que se está viendo, con una columna por hora. */
function exportar() {
  const cabecera = ['Proyecto', 'Fecha', 'Versión', ...HORAS, 'Total diario']
  const filas = filtrados.value.map((c) => [
    c.proyecto ?? '',
    c.fecha ?? '',
    c.version ?? '',
    ...c.horas.map((v) => v ?? ''),
    c.total_diario ?? '',
  ])
  // Se separa con punto y coma: en configuración regional es-CO el Excel espera
  // ese separador, y con coma metería toda la fila en una sola celda.
  const csv = [cabecera, ...filas]
    .map((f) => f.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';'))
    .join('\n')
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `consumo_${filtros.anio}-${String(filtros.mes).padStart(2, '0')}_${filtros.version}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

async function cargarProyectos() {
  try {
    const { data } = await api.get('/liquidaciones-api/proyectos')
    proyectosOptions.value = (data || [])
      .filter((p) => p.nombre_topico)
      .map((p) => ({ value: p.nombre_topico, label: p.nombre_comercial }))
      .sort((a, b) => a.label.localeCompare(b.label))
  } catch {
    /* el filtro queda vacío, la tabla sigue sirviendo */
  }
}

onMounted(() => {
  cargar()
  cargarProyectos()
})
</script>

<style scoped>
.field-label {
  @apply mb-1 block text-xs font-medium text-gray-600;
}

/* Proyecto, fecha y versión quedan fijas: con 24 horas la tabla se desplaza
   mucho y sin esto se pierde de vista a qué fila corresponde cada número. */
.col-fija {
  position: sticky;
  z-index: 2;
  background: #ffffff;
}
thead .col-fija {
  background: #f9fafb;
  z-index: 3;
}
.row-hover:hover .col-fija {
  background: #f8fafc;
}
.col-proyecto {
  left: 0;
  min-width: 190px;
}
.col-fecha {
  left: 190px;
}
.col-version {
  left: 290px;
  border-right: 1px solid #e5e7eb;
}
</style>
