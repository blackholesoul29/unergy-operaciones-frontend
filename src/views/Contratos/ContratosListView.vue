<template>
  <div class="space-y-5">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
          <i class="pi pi-file-edit text-amber-600" />
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-800">Contratos</h2>
          <p class="text-xs text-gray-400">Todos los contratos PPA registrados</p>
        </div>
      </div>
      <span class="text-sm text-gray-400">{{ contratos.length }} contrato{{ contratos.length !== 1 ? 's' : '' }}</span>
    </div>

    <!-- Filtros -->
    <div class="flex gap-3 items-center">
      <IconField class="flex-1 max-w-sm">
        <InputIcon class="pi pi-search" />
        <InputText v-model="filtroQ" placeholder="Buscar por proyecto, nombre, comprador…" class="w-full"
          @input="buscar" />
      </IconField>
      <Select v-model="filtroTipo" :options="TIPOS_CONTRATO" optionLabel="label" optionValue="value"
        placeholder="Todos los tipos" showClear class="w-44" @change="buscar" />
    </div>

    <!-- Tabla -->
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
      @row-click="irAProyecto"
      rowClass="cursor-pointer hover:bg-amber-50"
    >
      <Column field="proyecto_nombre" header="Proyecto" sortable>
        <template #body="{ data }">
          <span class="font-medium text-gray-800">{{ data.proyecto_nombre || '—' }}</span>
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
      <Column header="Tipo">
        <template #body="{ data }">
          <Tag v-if="data.tipo_contrato" :value="data.tipo_contrato"
            :severity="data.tipo_contrato === 'venta' ? 'success' : 'info'" class="text-xs" />
          <span v-else class="text-gray-300">—</span>
        </template>
      </Column>
      <Column header="Comprador">
        <template #body="{ data }">{{ data.comprador_nombre || '—' }}</template>
      </Column>
      <Column header="Vendedor">
        <template #body="{ data }">{{ data.vendedor_nombre || '—' }}</template>
      </Column>
      <Column header="Inicio" sortable sortField="fecha_inicio">
        <template #body="{ data }">{{ formatFecha(data.fecha_inicio) }}</template>
      </Column>
      <Column header="Fin" sortable sortField="fecha_fin">
        <template #body="{ data }">{{ formatFecha(data.fecha_fin) }}</template>
      </Column>
      <Column header="Tarifa base" sortable sortField="tarifa_base">
        <template #body="{ data }">
          {{ data.tarifa_base != null ? `$${Number(data.tarifa_base).toFixed(4)}` : '—' }}
        </template>
      </Column>
      <Column header="Índice">
        <template #body="{ data }">{{ data.indice_indexacion || '—' }}</template>
      </Column>
      <Column header="">
        <template #body="{ data }">
          <Button icon="pi pi-arrow-right" text size="small" severity="secondary"
            @click.stop="irAProyecto({ data })" v-tooltip="'Ver en proyecto'" />
        </template>
      </Column>
    </DataTable>
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
import api from '@/api/client'

const router = useRouter()
const toast = useToast()

const TIPOS_CONTRATO = [
  { label: 'Venta', value: 'venta' },
  { label: 'Compra', value: 'compra' },
]

const contratos = ref([])
const loading = ref(true)
const filtroQ = ref('')
const filtroTipo = ref(null)

const contratosFiltrados = computed(() => {
  let lista = contratos.value
  if (filtroTipo.value) lista = lista.filter(c => c.tipo_contrato === filtroTipo.value)
  return lista
})

function formatFecha(f) {
  if (!f) return '—'
  return String(f).slice(0, 10)
}

function irAProyecto({ data }) {
  router.push(`/proyectos/${data.proyecto_id}/ppa`)
}

let buscarTimeout = null
function buscar() {
  clearTimeout(buscarTimeout)
  buscarTimeout = setTimeout(cargar, 350)
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
