<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-xl font-bold" style="color: #2C2039;">GESCON — Contratos ASIC</h2>
      <span class="text-sm" style="color: #9b89b5;">{{ total }} registros</span>
    </div>

    <!-- Filtros -->
    <div class="bg-white rounded-xl px-4 py-3 flex flex-wrap gap-3 items-center"
      style="border: 1px solid #e8e0f0;">
      <IconField class="flex-1 min-w-[200px]">
        <InputIcon class="pi pi-search" />
        <InputText v-model="filtroTexto" placeholder="Buscar SIC, contrato, planta…"
          class="w-full" @input="aplicarFiltros" />
      </IconField>

      <SelectButton v-model="filtroEstado" :options="opcionesEstado" optionLabel="label" optionValue="value"
        :pt="{ button: { style: 'font-size:12px; padding: 6px 14px;' } }" />

      <Select v-model="filtroTipo" :options="opcionesTipo" optionLabel="label" optionValue="value"
        placeholder="Tipo" showClear class="min-w-[160px]" @change="aplicarFiltros" />

      <Button v-if="filtroTexto || filtroTipo" label="Limpiar" icon="pi pi-times"
        severity="secondary" size="small" @click="limpiar" />
    </div>

    <!-- Tabla -->
    <div class="bg-white rounded-xl overflow-hidden shadow-sm" style="border: 1px solid #e8e0f0;">
      <DataTable :value="rowsFiltrados" :loading="loading" class="text-sm" rowHover
        :rows="50" paginator :rowsPerPageOptions="[25, 50, 100]"
        sortField="fecha_solicitud" :sortOrder="-1">
        <template #empty>
          <div class="py-12 text-center text-sm" style="color: #9b89b5;">
            No hay contratos con los filtros actuales.
          </div>
        </template>

        <!-- SIC -->
        <Column field="codigo_sic_contrato" header="SIC" sortable style="width: 100px;">
          <template #body="{ data }">
            <span class="font-mono text-xs" style="color: #5b3fa6;">{{ data.codigo_sic_contrato || '—' }}</span>
          </template>
        </Column>

        <!-- Contrato interno -->
        <Column field="contrato_interno" header="Contrato" sortable style="min-width: 160px;">
          <template #body="{ data }">
            <span class="font-medium text-xs" style="color: #2C2039;">{{ data.contrato_interno || '—' }}</span>
          </template>
        </Column>

        <!-- Nombre interno -->
        <Column field="nombre_interno" header="Nombre interno" style="min-width: 140px;">
          <template #body="{ data }">
            <span class="text-xs" style="color: #6b5a8a;">{{ data.nombre_interno || '—' }}</span>
          </template>
        </Column>

        <!-- Planta -->
        <Column header="Planta" style="min-width: 160px;">
          <template #body="{ data }">
            <span class="text-xs font-medium" style="color: #2C2039;">{{ data.planta_nombre || '—' }}</span>
          </template>
        </Column>

        <!-- Tipo -->
        <Column field="tipo_solicitud" header="Tipo" sortable style="width: 130px;">
          <template #body="{ data }">
            <Tag :value="tipoLabel(data.tipo_solicitud)" :severity="tipoSeverity(data.tipo_solicitud)"
              class="text-xs" />
          </template>
        </Column>

        <!-- Requerimiento -->
        <Column field="requerimiento_asic" header="Req." style="width: 115px;">
          <template #body="{ data }">
            <span class="font-mono text-xs" style="color: #6b5a8a;">{{ data.requerimiento_asic || '—' }}</span>
          </template>
        </Column>

        <!-- Inicio -->
        <Column field="fecha_inicio" header="Inicio" sortable style="width: 100px;">
          <template #body="{ data }">
            <span class="text-xs" style="color: #6b5a8a;">{{ fmt(data.fecha_inicio) }}</span>
          </template>
        </Column>

        <!-- Fin -->
        <Column field="fecha_fin" header="Fin" sortable style="width: 100px;">
          <template #body="{ data }">
            <span class="text-xs" :style="{ color: esVencido(data.fecha_fin) ? '#ef4444' : '#6b5a8a' }">
              {{ fmt(data.fecha_fin) }}
            </span>
          </template>
        </Column>

        <!-- Estado -->
        <Column field="estado_solicitud" header="Estado" sortable style="width: 110px;">
          <template #body="{ data }">
            <Tag :value="estadoLabel(data.estado_solicitud)"
              :severity="estadoSeverity(data.estado_solicitud)" class="text-xs" />
          </template>
        </Column>

        <!-- Despacho -->
        <Column field="porcentaje_despacho" header="Desp." style="width: 70px;">
          <template #body="{ data }">
            <span class="text-xs" style="color: #6b5a8a;">
              {{ data.porcentaje_despacho != null ? data.porcentaje_despacho + '%' : '—' }}
            </span>
          </template>
        </Column>

        <!-- Link -->
        <Column header="" style="width: 46px;">
          <template #body="{ data }">
            <a v-if="data.link_archivo" :href="data.link_archivo" target="_blank"
              class="text-purple-500 hover:text-purple-700">
              <i class="pi pi-external-link text-xs" />
            </a>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/api/client.js'

const loading = ref(false)
const rows = ref([])
const filtroTexto = ref('')
const filtroEstado = ref('vigentes')
const filtroTipo = ref(null)

const opcionesEstado = [
  { label: 'Vigentes', value: 'vigentes' },
  { label: 'Todos', value: 'todos' },
]
const opcionesTipo = [
  { label: 'Registro', value: 'registro' },
  { label: 'Modificación', value: 'modificacion' },
  { label: 'Terminación', value: 'terminacion' },
  { label: 'Desistimiento', value: 'desistimiento' },
]

async function cargar() {
  loading.value = true
  try {
    const { data } = await api.get('/asic')
    rows.value = data
  } finally {
    loading.value = false
  }
}

const hoy = new Date().toISOString().slice(0, 10)

const rowsFiltrados = computed(() => {
  let r = rows.value

  if (filtroEstado.value === 'vigentes') {
    r = r.filter(x => x.fecha_fin && x.fecha_fin >= hoy)
  }

  if (filtroTipo.value) {
    r = r.filter(x => x.tipo_solicitud === filtroTipo.value)
  }

  if (filtroTexto.value.trim()) {
    const q = filtroTexto.value.trim().toLowerCase()
    r = r.filter(x =>
      (x.codigo_sic_contrato || '').toLowerCase().includes(q) ||
      (x.contrato_interno || '').toLowerCase().includes(q) ||
      (x.nombre_interno || '').toLowerCase().includes(q) ||
      (x.planta_nombre || '').toLowerCase().includes(q) ||
      (x.requerimiento_asic || '').toLowerCase().includes(q)
    )
  }

  return r
})

const total = computed(() => rowsFiltrados.value.length)

function aplicarFiltros() { /* computed handles it reactively */ }
function limpiar() { filtroTexto.value = ''; filtroTipo.value = null }

function fmt(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y.slice(2)}`
}

function esVencido(d) {
  return d && d < hoy
}

const TIPO_LABELS = { registro: 'Registro', modificacion: 'Modificación', terminacion: 'Terminación', desistimiento: 'Desistimiento' }
const TIPO_SEV = { registro: 'success', modificacion: 'info', terminacion: 'warn', desistimiento: 'secondary' }
function tipoLabel(v) { return TIPO_LABELS[v] || v }
function tipoSeverity(v) { return TIPO_SEV[v] || 'secondary' }

const ESTADO_LABELS = { publicado: 'Publicado', en_proceso: 'En proceso', rechazado: 'Rechazado', desistido: 'Desistido' }
const ESTADO_SEV = { publicado: 'success', en_proceso: 'info', rechazado: 'danger', desistido: 'secondary' }
function estadoLabel(v) { return ESTADO_LABELS[v] || v }
function estadoSeverity(v) { return ESTADO_SEV[v] || 'secondary' }

onMounted(cargar)
</script>
