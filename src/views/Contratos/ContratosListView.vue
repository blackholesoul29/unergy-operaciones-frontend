<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h2 class="text-xl font-bold text-gray-800">Servicios</h2>
      <p class="text-xs text-gray-400 mt-0.5">Gestión de contratos y servicios por tipo</p>
    </div>

    <!-- Acción principal -->
    <div class="flex justify-end">
      <Button v-if="servicioActivo === 'ppa'" label="Nuevo contrato PPA" icon="pi pi-plus"
        class="bg-amber-500 border-amber-500 hover:bg-amber-600" @click="showWizard = true" />
    </div>

    <!-- Tarjetas de servicio -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <div
        v-for="srv in SERVICIOS" :key="srv.key"
        class="flex flex-col items-center gap-3 rounded-xl border-2 p-5 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 select-none"
        :class="servicioActivo === srv.key
          ? 'shadow-sm'
          : 'border-gray-100 bg-gray-50 opacity-70 hover:opacity-90'"
        :style="servicioActivo === srv.key
          ? `background:${srv.bg}; border-color:${srv.color}50`
          : ''"
        @click="seleccionarServicio(srv.key)"
      >
        <div class="w-12 h-12 rounded-full flex items-center justify-center"
          :style="servicioActivo === srv.key ? `background:${srv.color}25` : 'background:#e5e7eb'">
          <i :class="srv.icon" class="text-2xl"
            :style="servicioActivo === srv.key ? `color:${srv.color}` : 'color:#9ca3af'" />
        </div>
        <span class="text-sm font-semibold text-center"
          :style="servicioActivo === srv.key ? `color:${srv.color}` : 'color:#6b7280'">
          {{ srv.label }}
        </span>
        <span v-if="srv.key === 'ppa' && contratos.length > 0 && servicioActivo === srv.key"
          class="text-xs font-medium px-2 py-0.5 rounded-full"
          :style="`background:${srv.color}20; color:${srv.color}`">
          {{ contratos.length }}
        </span>
      </div>
    </div>

    <!-- Contenido por servicio -->
    <template v-if="servicioActivo === 'ppa'">
      <!-- Filtros -->
      <div class="flex gap-3 items-center">
        <IconField class="flex-1 max-w-sm">
          <InputIcon class="pi pi-search" />
          <InputText v-model="filtroQ" placeholder="Buscar por proyecto, nombre, comprador…"
            class="w-full" @input="buscar" />
        </IconField>
        <Select v-model="filtroTipo" :options="TIPOS_CONTRATO" optionLabel="label" optionValue="value"
          placeholder="Todos los tipos" showClear class="w-44" @change="buscar" />
      </div>

      <!-- Tabla PPA -->
      <DataTable
        :value="contratosFiltrados"
        :loading="loading"
        stripedRows
        class="text-sm"
        paginator
        :rows="20"
        :rowsPerPageOptions="[10, 20, 50]"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
        emptyMessage="No hay contratos PPA registrados."
        rowHover
      >
        <Column header="Proyectos">
          <template #body="{ data }">
            <span v-if="data.proyectos?.length" class="text-sm text-gray-700">
              {{ data.proyectos.map(p => p.nombre_comercial).join(', ') }}
            </span>
            <span v-else class="text-gray-300">—</span>
          </template>
        </Column>
        <Column header="Contrato" sortable sortField="nombre_interno">
          <template #body="{ data }">
            <div>
              <p class="font-medium text-gray-700">{{ data.nombre_interno || data.numero_codigo_contrato || '—' }}</p>
              <p v-if="data.nombre_interno && data.numero_codigo_contrato" class="text-xs text-gray-400">
                {{ data.numero_codigo_contrato }}
              </p>
            </div>
          </template>
        </Column>
        <Column header="Índice" style="width:80px">
          <template #body="{ data }">{{ data.indice_indexacion || '—' }}</template>
        </Column>
        <Column header="Comprador">
          <template #body="{ data }">{{ data.comprador_nombre || '—' }}</template>
        </Column>
        <Column header="Vendedor">
          <template #body="{ data }">{{ data.vendedor_nombre || '—' }}</template>
        </Column>
        <Column header="Inicio" sortable sortField="fecha_inicio" style="width:100px">
          <template #body="{ data }">{{ formatFecha(data.fecha_inicio) }}</template>
        </Column>
        <Column header="Fin" sortable sortField="fecha_fin" style="width:100px">
          <template #body="{ data }">{{ formatFecha(data.fecha_fin) }}</template>
        </Column>
        <Column header="Tarifa base" sortable sortField="tarifa_base" style="width:110px">
          <template #body="{ data }">
            {{ data.tarifa_base != null ? `$${Number(data.tarifa_base).toFixed(4)}` : '—' }}
          </template>
        </Column>
        <Column style="width:50px">
          <template #body="{ data }">
            <Button icon="pi pi-arrow-right" text size="small" severity="secondary"
              @click.stop="irAContrato(data)" v-tooltip="'Ver detalle'" />
          </template>
        </Column>
      </DataTable>
    </template>

    <!-- Wizard nuevo contrato -->
    <PPAContratoWizard v-if="showWizard" :visible="showWizard"
      @cerrar="showWizard = false" @creado="onContratoCreado" />

    <!-- Próximamente para otros servicios -->
    <template v-else>
      <div class="flex flex-col items-center py-16 gap-3 text-gray-400">
        <i :class="servicioInfo?.icon" class="text-4xl" :style="`color:${servicioInfo?.color}60`" />
        <p class="text-sm font-medium text-gray-500">{{ servicioInfo?.label }}</p>
        <p class="text-xs">Módulo en desarrollo</p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import PPAContratoWizard from './PPAContratoWizard.vue'
import api from '@/api/client'

const router = useRouter()
const toast = useToast()

const SERVICIOS = [
  { key: 'ppa',           label: 'PPA',           icon: 'pi pi-bolt',      color: '#f59e0b', bg: '#fffbeb' },
  { key: 'representacion',label: 'Representación', icon: 'pi pi-file-edit', color: '#3b82f6', bg: '#eff6ff' },
  { key: 'cgm',           label: 'CGM',           icon: 'pi pi-chart-bar', color: '#10b981', bg: '#f0fdf4' },
  { key: 'promotor',      label: 'Promotor',      icon: 'pi pi-briefcase', color: '#8b5cf6', bg: '#f5f3ff' },
  { key: 'rec',           label: 'REC',           icon: 'pi pi-verified',  color: '#14b8a6', bg: '#f0fdfa' },
]

const TIPOS_CONTRATO = [
  { label: 'Venta', value: 'venta' },
  { label: 'Compra', value: 'compra' },
]

const servicioActivo = ref('ppa')
const showWizard = ref(false)
const servicioInfo = computed(() => SERVICIOS.find(s => s.key === servicioActivo.value))
const contratos = ref([])
const loading = ref(false)
const filtroQ = ref('')
const filtroTipo = ref(null)

const contratosFiltrados = computed(() => {
  if (!filtroTipo.value) return contratos.value
  return contratos.value.filter(c => c.tipo_contrato === filtroTipo.value)
})

function seleccionarServicio(key) {
  servicioActivo.value = key
  if (key === 'ppa') cargar()
}

function formatFecha(f) {
  if (!f) return '—'
  return String(f).slice(0, 10)
}

function irAContrato(data) {
  router.push(`/contratos/${data.id}`)
}

let buscarTimeout = null
function buscar() {
  clearTimeout(buscarTimeout)
  buscarTimeout = setTimeout(cargar, 350)
}

function onContratoCreado() {
  cargar()
}

async function cargar() {
  loading.value = true
  try {
    const params = {}
    if (filtroQ.value) params.q = filtroQ.value
    const { data } = await api.get('/ppa', { params })
    contratos.value = data
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error al cargar contratos', detail: e.message, life: 3000 })
  } finally {
    loading.value = false
  }
}

onMounted(cargar)
</script>
