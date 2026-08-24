<template>
  <div class="space-y-4">
    <PageHeader title="IDs proyectos"
                subtitle="Códigos SIC de liquidaciones e IDs de Quoia · GD y minigranjas en operación" />

    <!-- Filtro de búsqueda -->
    <div class="bg-white rounded-xl shadow-sm p-3 flex flex-wrap gap-3 items-end border" style="border-color:#ECE7F2">
      <div>
        <label class="field-label">Buscar</label>
        <IconField>
          <InputIcon class="pi pi-search" />
          <InputText v-model="q" placeholder="Nombre del proyecto…" class="w-64" />
        </IconField>
      </div>
      <div class="flex-1" />
      <Button icon="pi pi-refresh" size="small" text rounded :loading="loading"
              v-tooltip.left="'Recargar'" @click="cargar" />
      <div class="text-xs text-gray-400 self-center">
        {{ filtrados.length }} proyecto{{ filtrados.length === 1 ? '' : 's' }}
      </div>
    </div>

    <div v-if="loading" class="bg-white rounded-xl shadow-sm p-10 flex justify-center">
      <i class="pi pi-spin pi-spinner text-2xl text-gray-400" />
    </div>

    <div v-else-if="errorApi" class="bg-white rounded-xl shadow-sm border p-6 text-center" style="border-color:#ECE7F2">
      <i class="pi pi-exclamation-triangle text-2xl mb-2 block" style="color:#D97706" />
      <p class="text-sm text-gray-600">{{ errorApi }}</p>
      <Button label="Reintentar" icon="pi pi-refresh" size="small" outlined class="mt-3" @click="cargar" />
    </div>

    <template v-else>
      <div v-if="!filtrados.length"
           class="bg-white rounded-xl shadow-sm p-10 text-center text-sm text-gray-400">
        No se encontraron proyectos GD/minigranja en operación.
      </div>

      <div v-else class="bg-white rounded-xl shadow-sm overflow-hidden border" style="border-color:#ECE7F2">
        <div class="overflow-x-auto">
          <table class="w-full text-sm border-collapse">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-100">
                <th rowspan="2" class="sticky-col text-left px-4 py-2.5 font-medium text-gray-500 text-xs
                                        uppercase tracking-wide align-bottom" style="min-width:240px">Proyecto</th>
                <th colspan="2" class="text-center px-3 py-2 font-semibold text-[11px] uppercase tracking-wide"
                    style="color:#2C2039; border-left:1px solid #EEE;">ID liquidaciones</th>
                <th colspan="3" class="text-center px-3 py-2 font-semibold text-[11px] uppercase tracking-wide"
                    style="color:#915BD8; border-left:1px solid #EEE;">ID Quoia</th>
                <th rowspan="2" class="px-3 py-2.5" style="width:56px"></th>
              </tr>
              <tr class="bg-gray-50 border-b border-gray-100">
                <th v-for="col in COLUMNAS" :key="col.key"
                    class="text-center px-3 py-2 font-medium text-gray-500 text-[11px] whitespace-nowrap"
                    :style="col.groupStart ? 'border-left:1px solid #EEE;' : ''">
                  {{ col.short }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in filtrados" :key="row.proyecto_id"
                  class="border-t border-gray-100 hover:bg-gray-50/70 transition-colors duration-100 row-hover">
                <td class="sticky-col px-4 py-2" style="min-width:240px">
                  <span class="text-sm text-gray-800 font-medium">{{ row.nombre_comercial }}</span>
                  <span v-if="!row.nombre_topico" class="ml-2 text-[10px] px-1.5 py-0.5 rounded"
                        style="background:#FEF3C7; color:#92400E"
                        title="Sin código base (API ID Unergy): no se puede identificar en la API de Liquidaciones">
                    sin tópico
                  </span>
                </td>
                <td v-for="col in COLUMNAS" :key="col.key"
                    class="px-3 py-2 text-center id-cell cursor-pointer"
                    :style="col.groupStart ? 'border-left:1px solid #F1F1F1;' : ''"
                    @click="irAlDetalle(row.proyecto_id, col.tab)"
                    v-tooltip.bottom="tieneValor(row[col.key]) ? String(row[col.key]) : 'Sin registrar · clic para abrir el proyecto'">
                  <i v-if="tieneValor(row[col.key])" class="pi pi-check-circle"
                     style="color:#10B981; font-size:1rem;" />
                  <span v-else class="text-gray-300">—</span>
                </td>
                <td class="px-3 py-2">
                  <Button icon="pi pi-pencil" text rounded size="small" severity="info"
                          :disabled="!row.nombre_topico"
                          v-tooltip.left="row.nombre_topico ? 'Editar códigos SIC' : 'Falta el código base del proyecto'"
                          @click="abrirEditar(row)" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Dialog: editar códigos de liquidaciones (van a la API de Liquidaciones) -->
    <Dialog v-model:visible="formVisible" header="Editar códigos SIC" modal class="w-full max-w-md">
      <form @submit.prevent="guardar" class="space-y-4 pt-1">
        <div class="text-sm font-medium text-gray-700">{{ f.nombre_comercial }}</div>
        <p class="text-[11px] text-gray-400 -mt-2">
          Se guardan en la API de Liquidaciones (tópico <b>{{ f.nombre_topico }}</b>).
        </p>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="field-label">SIC generación</label>
            <InputText v-model="f.sic_gen" class="w-full" placeholder="ej: 3A44" />
          </div>
          <div>
            <label class="field-label">SIC consumo</label>
            <InputText v-model="f.sic_con" class="w-full" placeholder="ej: 3A3P" />
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-1">
          <Button type="button" label="Cancelar" severity="secondary" @click="formVisible = false" />
          <Button type="submit" label="Guardar" icon="pi pi-check" :loading="guardando" />
        </div>
      </form>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import { useToast } from 'primevue/usetoast'
import api from '@/api/client'
import { formatearNombreProyecto } from '@/views/Proyectos/proyectosUi'

const router = useRouter()
const toast = useToast()

// Solo GD y minigranjas en operación.
const TIPOS_INCLUIDOS = ['gd', 'minigranja']
const ESTADO_OPERATIVA = 'en_operacion'

// Los códigos SIC viven en la API de Liquidaciones; los IDs de Quoia en esta base.
const COLUMNAS = [
  { key: 'sic_gen', short: 'SIC gen.', groupStart: true,  tab: 'id-liquidaciones' },
  { key: 'sic_con', short: 'SIC con.', groupStart: false, tab: 'id-liquidaciones' },
  { key: 'quoia_reporte_generacion_id', short: 'Rep. Gen.',    groupStart: true,  tab: 'id-quoia' },
  { key: 'quoia_reporte_consumo_id',    short: 'Rep. Consumo', groupStart: false, tab: 'id-quoia' },
  { key: 'quoia_nodo_id',               short: 'Nodo',         groupStart: false, tab: 'id-quoia' },
]

const loading = ref(true)
const errorApi = ref(null)
const filas = ref([])
const q = ref('')

function tieneValor(v) {
  return v !== null && v !== undefined && v !== ''
}

function irAlDetalle(id, tab = 'id-liquidaciones') {
  router.push({ path: `/proyectos/${id}`, query: { edit: 'true', tab } })
}

const filtrados = computed(() => {
  const term = q.value.trim().toLowerCase()
  return filas.value.filter(f => !term || f.nombre_comercial.toLowerCase().includes(term))
})

// ── Edición (va a la API de Liquidaciones vía nuestro backend) ────────────────
const formVisible = ref(false)
const guardando = ref(false)
const f = reactive({ proyecto_id: null, nombre_comercial: '', nombre_topico: '', sic_gen: '', sic_con: '' })

function abrirEditar(row) {
  Object.assign(f, {
    proyecto_id: row.proyecto_id,
    nombre_comercial: row.nombre_comercial,
    nombre_topico: row.nombre_topico,
    sic_gen: row.sic_gen ?? '',
    sic_con: row.sic_con ?? '',
  })
  formVisible.value = true
}

async function guardar() {
  guardando.value = true
  try {
    await api.patch(`/liquidaciones-api/proyectos/${f.proyecto_id}`, {
      sic_gen: f.sic_gen || null,
      sic_con: f.sic_con || null,
    })
    formVisible.value = false
    await cargar()
    toast.add({ severity: 'success', summary: 'Códigos guardados', life: 2000 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.detail || 'No se pudo guardar', life: 4000 })
  } finally {
    guardando.value = false
  }
}

// ── Carga ─────────────────────────────────────────────────────────────────────
async function cargar() {
  loading.value = true
  errorApi.value = null
  try {
    const [liqRes, proyRes] = await Promise.all([
      api.get('/liquidaciones-api/proyectos'),
      api.get('/proyectos', { params: { page: 1, size: 500 } }),
    ])
    const quoiaPorId = new Map(
      (proyRes.data.items ?? proyRes.data).map(p => [p.id, p])
    )
    filas.value = (liqRes.data || [])
      .filter(r => TIPOS_INCLUIDOS.includes(r.tipo_proyecto) && r.estado === ESTADO_OPERATIVA)
      .map(r => {
        const p = quoiaPorId.get(r.proyecto_id) || {}
        return {
          ...r,
          nombre_comercial: formatearNombreProyecto(r.nombre_comercial),
          quoia_reporte_generacion_id: p.quoia_reporte_generacion_id ?? null,
          quoia_reporte_consumo_id: p.quoia_reporte_consumo_id ?? null,
          quoia_nodo_id: p.quoia_nodo_id ?? null,
        }
      })
      .sort((a, b) => a.nombre_comercial.localeCompare(b.nombre_comercial))
  } catch (e) {
    errorApi.value = e.response?.data?.detail || 'No se pudo cargar la configuración de liquidaciones.'
    filas.value = []
  } finally {
    loading.value = false
  }
}

onMounted(cargar)
</script>

<style scoped>
.field-label { @apply block text-xs font-medium text-gray-600 mb-1; }

.sticky-col {
  position: sticky;
  left: 0;
  z-index: 2;
  background: #ffffff;
  border-right: 1px solid #E5E7EB;
}
thead .sticky-col { background: #F9FAFB; z-index: 3; }
.row-hover:hover .sticky-col { background: #F8FAFC; }
.id-cell:hover { background: #F3EEFB; }
</style>
