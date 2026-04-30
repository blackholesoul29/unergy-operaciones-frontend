<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-800">Liquidaciones</h2>
      <Button label="Nueva liquidación" icon="pi pi-plus" size="small" @click="dialogNueva = true" />
    </div>

    <!-- Filtros -->
    <div class="bg-white rounded-xl shadow-sm p-3 flex flex-wrap gap-3 items-end">
      <div class="flex flex-col gap-1">
        <label class="text-xs text-gray-500">Desde</label>
        <DatePicker v-model="filtros.desde" view="month" dateFormat="mm/yy" showButtonBar
          placeholder="Mes inicio" class="w-36" />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs text-gray-500">Hasta</label>
        <DatePicker v-model="filtros.hasta" view="month" dateFormat="mm/yy" showButtonBar
          placeholder="Mes fin" class="w-36" />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs text-gray-500">Estado</label>
        <Select v-model="filtros.estado" :options="estadosOpciones" showClear placeholder="Todos"
          class="w-44" />
      </div>
      <Button icon="pi pi-search" label="Buscar" size="small" @click="recargar" />
      <Button icon="pi pi-times" severity="secondary" text size="small" @click="limpiarFiltros" />
    </div>

    <!-- Tabs -->
    <TabView v-model:activeIndex="tabActivo">
      <!-- ── Tab Lista general ── -->
      <TabPanel header="Lista">
        <div class="bg-white rounded-xl shadow-sm overflow-hidden">
          <DataTable :value="items" lazy :loading="loadingLista" :rows="size" :totalRecords="total"
            paginator @page="onPage" rowHover class="text-sm">
            <Column field="periodo" header="Período" style="width:100px">
              <template #body="{ data }">{{ formatPeriodo(data.periodo) }}</template>
            </Column>
            <Column field="proyecto_nombre" header="Proyecto" />
            <Column header="Estado" style="width:160px">
              <template #body="{ data }">
                <Tag :value="data.estado" :severity="estadoSeverity(data.estado)" />
              </template>
            </Column>
            <Column header="Ing. Neto COP" style="width:150px;text-align:right">
              <template #body="{ data }">
                <span class="font-mono text-xs">{{ fmt(data.ingreso_neto_cop) }}</span>
              </template>
            </Column>
            <Column field="fecha_firma" header="Firma" style="width:100px" />
            <Column header="" style="width:60px">
              <template #body="{ data }">
                <Button icon="pi pi-eye" text size="small"
                  @click="$router.push(`/liquidaciones/${data.id}`)" />
              </template>
            </Column>
          </DataTable>
        </div>
      </TabPanel>

      <!-- ── Tab Por Proyecto ── -->
      <TabPanel header="Por Proyecto">
        <ProgressSpinner v-if="loadingVista" class="block mx-auto my-8" />
        <div v-else class="space-y-4">
          <div v-if="!vistaProyectos.length" class="text-center text-gray-400 py-8 text-sm">
            No hay liquidaciones para los filtros seleccionados.
          </div>
          <div v-for="proy in vistaProyectos" :key="proy.proyecto_id"
            class="bg-white rounded-xl shadow-sm overflow-hidden">
            <!-- Header proyecto -->
            <div class="bg-gray-800 text-white px-4 py-2 flex items-center gap-3">
              <span class="font-semibold">{{ proy.proyecto_nombre }}</span>
              <span class="text-gray-400 text-xs">{{ proy.liquidaciones.length }} liquidación(es)</span>
            </div>
            <!-- Liquidaciones del proyecto -->
            <div v-for="liq in proy.liquidaciones" :key="liq.liquidacion_id" class="border-b last:border-b-0">
              <!-- Sub-header período -->
              <div class="px-4 py-2 bg-gray-50 flex items-center gap-4 cursor-pointer"
                @click="toggleLiq(liq.liquidacion_id)">
                <i :class="expandidos.has(liq.liquidacion_id) ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
                  class="text-xs text-gray-400" />
                <span class="font-medium text-sm">{{ formatPeriodo(liq.periodo) }}</span>
                <Tag :value="liq.estado" :severity="estadoSeverity(liq.estado)" />
                <span class="text-xs text-gray-500 ml-auto">
                  Ingreso neto: <span class="font-mono font-semibold text-blue-700">{{ fmt(liq.resumen.ingreso_neto_cop) }}</span>
                </span>
                <Button icon="pi pi-eye" text size="small"
                  @click.stop="$router.push(`/liquidaciones/${liq.liquidacion_id}`)" />
              </div>
              <!-- Tabla detalle inversionistas -->
              <div v-if="expandidos.has(liq.liquidacion_id)" class="overflow-x-auto">
                <TablaDetalleLiquidacion :liquidacion="liq" />
              </div>
            </div>
          </div>
        </div>
      </TabPanel>

      <!-- ── Tab Por Inversionista ── -->
      <TabPanel header="Por Inversionista">
        <ProgressSpinner v-if="loadingVista" class="block mx-auto my-8" />
        <div v-else class="space-y-4">
          <div v-if="!vistaInversionistas.length" class="text-center text-gray-400 py-8 text-sm">
            No hay liquidaciones para los filtros seleccionados.
          </div>
          <div v-for="inv in vistaInversionistas" :key="inv.cliente_id"
            class="bg-white rounded-xl shadow-sm overflow-hidden">
            <!-- Header inversionista -->
            <div class="bg-indigo-800 text-white px-4 py-2 flex items-center gap-3">
              <i class="pi pi-user" />
              <span class="font-semibold">{{ inv.cliente_nombre }}</span>
              <span class="text-indigo-300 text-xs">{{ inv.proyectos.length }} proyecto(s)</span>
            </div>
            <!-- Proyectos del inversionista -->
            <div v-for="proy in inv.proyectos" :key="`${proy.proyecto_id}_${proy.periodo}`"
              class="border-b last:border-b-0">
              <div class="px-4 py-2 bg-gray-50 flex items-center gap-4 cursor-pointer"
                @click="toggleInv(`${inv.cliente_id}_${proy.liquidacion_id}`)">
                <i :class="expandidosInv.has(`${inv.cliente_id}_${proy.liquidacion_id}`) ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
                  class="text-xs text-gray-400" />
                <span class="font-medium text-sm">{{ proy.proyecto_nombre }}</span>
                <span class="text-xs text-gray-400">{{ formatPeriodo(proy.periodo) }}</span>
                <Tag :value="proy.estado" :severity="estadoSeverity(proy.estado)" />
                <span class="text-xs text-gray-500 ml-2">
                  Part.: <strong>{{ pct(proy.porcentaje_participacion) }}</strong>
                </span>
                <Button icon="pi pi-eye" text size="small" class="ml-auto"
                  @click.stop="$router.push(`/liquidaciones/${proy.liquidacion_id}`)" />
              </div>
              <div v-if="expandidosInv.has(`${inv.cliente_id}_${proy.liquidacion_id}`)"
                class="overflow-x-auto">
                <TablaDetalleLiquidacion :liquidacion="proy" :modo-inversionista="true" />
              </div>
            </div>
          </div>
        </div>
      </TabPanel>
    </TabView>

    <!-- Dialog nueva liquidación -->
    <Dialog v-model:visible="dialogNueva" header="Nueva liquidación" modal class="w-full max-w-md">
      <div class="space-y-3 py-2">
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-600">Proyecto ID</label>
          <InputNumber v-model="nueva.proyecto_id" :useGrouping="false" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-600">Período</label>
          <DatePicker v-model="nueva.periodo" view="month" dateFormat="yy-mm-dd" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-600">Tipo venta</label>
          <Select v-model="nueva.tipo_venta" :options="['bolsa','ppa','interno']" class="w-full" />
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <Button label="Cancelar" severity="secondary" size="small" @click="dialogNueva = false" />
          <Button label="Crear" size="small" :loading="creando" @click="crearLiquidacion" />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import InputNumber from 'primevue/inputnumber'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'
import api from '@/api/client'

const TablaDetalleLiquidacion = defineAsyncComponent(() =>
  import('@/views/Liquidaciones/TablaDetalleLiquidacion.vue')
)

const toast = useToast()
const router = useRouter()

// Lista general
const items = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(20)
const loadingLista = ref(false)

// Vistas agrupadas
const vistaProyectos = ref([])
const vistaInversionistas = ref([])
const loadingVista = ref(false)

const tabActivo = ref(0)
const expandidos = ref(new Set())
const expandidosInv = ref(new Set())

// Filtros
const filtros = ref({ desde: null, hasta: null, estado: null })
const estadosOpciones = [
  'iniciada', 'costos_registrados', 'xm_procesado', 'mandatos_emitidos',
  'en_contabilidad', 'en_revisoria', 'facturado', 'entregado',
]

// Nueva liquidación
const dialogNueva = ref(false)
const creando = ref(false)
const nueva = ref({ proyecto_id: null, periodo: null, tipo_venta: 'bolsa' })

function buildParams() {
  const p = {}
  if (filtros.value.desde) p.periodo_desde = toISOMonth(filtros.value.desde)
  if (filtros.value.hasta) p.periodo_hasta = toISOMonth(filtros.value.hasta)
  if (filtros.value.estado) p.estado = filtros.value.estado
  return p
}

function toISOMonth(d) {
  if (!d) return null
  const dt = new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-01`
}

async function loadLista() {
  loadingLista.value = true
  try {
    const { data } = await api.get('/liquidaciones', {
      params: { page: page.value, size: size.value, ...buildParams() },
    })
    items.value = data.items
    total.value = data.total
  } catch {
    items.value = []
  } finally {
    loadingLista.value = false
  }
}

async function loadVistas() {
  loadingVista.value = true
  try {
    const params = buildParams()
    const [rProy, rInv] = await Promise.all([
      api.get('/liquidaciones/vistas/por-proyecto', { params }),
      api.get('/liquidaciones/vistas/por-inversionista', { params }),
    ])
    vistaProyectos.value = rProy.data
    vistaInversionistas.value = rInv.data
  } catch {
    vistaProyectos.value = []
    vistaInversionistas.value = []
  } finally {
    loadingVista.value = false
  }
}

function recargar() {
  page.value = 1
  if (tabActivo.value === 0) loadLista()
  else loadVistas()
}

function limpiarFiltros() {
  filtros.value = { desde: null, hasta: null, estado: null }
  recargar()
}

function toggleLiq(id) {
  if (expandidos.value.has(id)) expandidos.value.delete(id)
  else expandidos.value.add(id)
  expandidos.value = new Set(expandidos.value)
}

function toggleInv(key) {
  if (expandidosInv.value.has(key)) expandidosInv.value.delete(key)
  else expandidosInv.value.add(key)
  expandidosInv.value = new Set(expandidosInv.value)
}

async function crearLiquidacion() {
  if (!nueva.value.proyecto_id || !nueva.value.periodo) return
  creando.value = true
  try {
    const { data } = await api.post('/liquidaciones', {
      proyecto_id: nueva.value.proyecto_id,
      periodo: toISOMonth(nueva.value.periodo),
      tipo_venta: nueva.value.tipo_venta,
    })
    dialogNueva.value = false
    toast.add({ severity: 'success', summary: 'Creada', life: 2000 })
    router.push(`/liquidaciones/${data.id}`)
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear', life: 3000 })
  } finally {
    creando.value = false
  }
}

function onPage(e) { page.value = e.page + 1; loadLista() }

function fmt(v) {
  if (v == null) return '—'
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v)
}

function pct(v) {
  if (v == null) return '—'
  return (v * 100).toFixed(4) + '%'
}

function formatPeriodo(p) {
  if (!p) return ''
  const [y, m] = p.split('-')
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${meses[parseInt(m) - 1]} ${y}`
}

function estadoSeverity(e) {
  return {
    iniciada: 'secondary', costos_registrados: 'info', xm_procesado: 'info',
    mandatos_emitidos: 'warn', en_contabilidad: 'warn', en_revisoria: 'warn',
    facturado: 'success', entregado: 'contrast',
  }[e] || 'secondary'
}

watch(tabActivo, (v) => {
  if (v === 0) loadLista()
  else loadVistas()
})

onMounted(loadLista)
</script>
