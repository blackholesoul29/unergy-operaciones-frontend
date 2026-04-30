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
        <DatePicker v-model="filtros.desde" view="month" dateFormat="mm/yy" showButtonBar placeholder="Mes inicio" class="w-36" />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs text-gray-500">Hasta</label>
        <DatePicker v-model="filtros.hasta" view="month" dateFormat="mm/yy" showButtonBar placeholder="Mes fin" class="w-36" />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs text-gray-500">Estado</label>
        <Select v-model="filtros.estado" :options="estadosOpciones" showClear placeholder="Todos" class="w-44" />
      </div>
      <Button icon="pi pi-search" label="Buscar" size="small" @click="recargar" />
      <Button icon="pi pi-times" severity="secondary" text size="small" @click="limpiarFiltros" />
    </div>

    <!-- Tabs -->
    <TabView v-model:activeIndex="tabActivo">

      <!-- ══ Tab Lista ══ -->
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
                <Button icon="pi pi-eye" text size="small" @click="$router.push(`/liquidaciones/${data.id}`)" />
              </template>
            </Column>
          </DataTable>
        </div>
      </TabPanel>

      <!-- ══ Tab Por Proyecto ══ -->
      <TabPanel header="Por Proyecto">
        <ProgressSpinner v-if="loadingVista" class="block mx-auto my-8" />
        <div v-else class="space-y-3">
          <div v-if="!vistaProyectos.length" class="text-center text-gray-400 py-8 text-sm">
            No hay proyectos registrados.
          </div>

          <div v-for="proy in vistaProyectos" :key="proy.proyecto_id"
            class="bg-white rounded-xl shadow-sm overflow-hidden">

            <!-- Header proyecto (siempre visible) -->
            <div class="bg-gray-800 text-white px-4 py-2 flex items-center gap-3 cursor-pointer select-none"
              @click="toggleProy(proy.proyecto_id)">
              <i :class="expandidosProy.has(proy.proyecto_id) ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
                class="text-xs" />
              <span class="font-semibold">{{ proy.proyecto_nombre }}</span>
              <Tag :value="proy.estado" :severity="estadoProySeverity(proy.estado)" class="text-xs" />
              <span class="text-gray-400 text-xs ml-auto">
                {{ proy.inversionistas_registrados.length }} inv. ·
                {{ proy.liquidaciones.length }} liq.
              </span>
            </div>

            <!-- Contenido expandido -->
            <div v-if="expandidosProy.has(proy.proyecto_id)">
              <!-- Inversionistas registrados -->
              <div class="px-4 py-3 bg-indigo-50 border-b border-indigo-100">
                <p class="text-xs font-semibold text-indigo-700 mb-2 uppercase tracking-wide">
                  Inversionistas registrados
                </p>
                <div v-if="proy.inversionistas_registrados.length" class="flex flex-wrap gap-2">
                  <div v-for="inv in proy.inversionistas_registrados" :key="inv.proyecto_inversionista_id"
                    class="bg-white border border-indigo-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
                    <i class="pi pi-user text-indigo-400 text-xs" />
                    <span class="text-xs font-semibold text-gray-800">{{ inv.inversionista_nombre }}</span>
                    <span class="text-xs text-indigo-600 font-mono">{{ pct(inv.porcentaje_participacion) }}</span>
                    <Tag v-if="inv.es_patrimonio_autonomo" value="PA" severity="info" class="text-[10px]" />
                  </div>
                </div>
                <p v-else class="text-xs text-gray-400 italic">Sin inversionistas registrados</p>
              </div>

              <!-- Liquidaciones del proyecto -->
              <div v-if="proy.liquidaciones.length">
                <div v-for="liq in proy.liquidaciones" :key="liq.liquidacion_id" class="border-b last:border-b-0">
                  <div class="px-4 py-2 bg-gray-50 flex items-center gap-3 cursor-pointer"
                    @click="toggleLiq(liq.liquidacion_id)">
                    <i :class="expandidosLiq.has(liq.liquidacion_id) ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
                      class="text-xs text-gray-400" />
                    <span class="font-medium text-sm">{{ formatPeriodo(liq.periodo) }}</span>
                    <Tag :value="liq.estado" :severity="estadoSeverity(liq.estado)" />
                    <span class="text-xs text-gray-500 ml-auto">
                      Ingreso neto:
                      <span class="font-mono font-semibold text-blue-700">{{ fmt(liq.resumen.ingreso_neto_cop) }}</span>
                    </span>
                    <Button icon="pi pi-eye" text size="small"
                      @click.stop="$router.push(`/liquidaciones/${liq.liquidacion_id}`)" />
                  </div>
                  <div v-if="expandidosLiq.has(liq.liquidacion_id)" class="overflow-x-auto">
                    <TablaDetalleLiquidacion :liquidacion="liq" />
                  </div>
                </div>
              </div>
              <div v-else class="px-4 py-4 text-center text-xs text-gray-400">
                Sin liquidaciones para los filtros seleccionados
              </div>
            </div>
          </div>
        </div>
      </TabPanel>

      <!-- ══ Tab Por Inversionista ══ -->
      <TabPanel header="Por Inversionista">
        <ProgressSpinner v-if="loadingVista" class="block mx-auto my-8" />
        <div v-else class="space-y-3">
          <div v-if="!vistaInversionistas.length" class="text-center text-gray-400 py-8 text-sm">
            No hay inversionistas registrados.
          </div>

          <div v-for="inv in vistaInversionistas" :key="inv.cliente_id"
            class="bg-white rounded-xl shadow-sm overflow-hidden">

            <!-- Header inversionista -->
            <div class="bg-indigo-800 text-white px-4 py-2 flex items-center gap-3 cursor-pointer select-none"
              @click="toggleInversionista(inv.cliente_id)">
              <i :class="expandidosInv.has(inv.cliente_id) ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
                class="text-xs" />
              <i class="pi pi-user" />
              <span class="font-semibold">{{ inv.cliente_nombre }}</span>
              <span class="text-indigo-300 text-xs ml-auto">{{ inv.proyectos.length }} proyecto(s)</span>
            </div>

            <!-- Proyectos del inversionista -->
            <div v-if="expandidosInv.has(inv.cliente_id)">
              <div v-for="proy in inv.proyectos" :key="proy.proyecto_inversionista_id"
                class="border-b last:border-b-0">

                <!-- Fila proyecto -->
                <div class="px-4 py-2 bg-gray-50 flex items-center gap-3 cursor-pointer"
                  @click="toggleInvProy(`${inv.cliente_id}_${proy.proyecto_id}`)">
                  <i :class="expandidosInvProy.has(`${inv.cliente_id}_${proy.proyecto_id}`) ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
                    class="text-xs text-gray-400" />
                  <span class="font-medium text-sm">{{ proy.proyecto_nombre }}</span>
                  <span class="text-xs text-gray-500">
                    Part.: <strong class="text-indigo-600">{{ pct(proy.porcentaje_participacion) }}</strong>
                  </span>
                  <Tag v-if="proy.es_patrimonio_autonomo" value="PA" severity="info" class="text-[10px]" />
                  <span class="text-xs text-gray-400 ml-auto">{{ proy.liquidaciones.length }} liq.</span>
                </div>

                <!-- Liquidaciones del proyecto para este inversionista -->
                <div v-if="expandidosInvProy.has(`${inv.cliente_id}_${proy.proyecto_id}`)" class="bg-white">
                  <div v-if="proy.liquidaciones.length" class="divide-y divide-gray-100">
                    <div v-for="liq in proy.liquidaciones" :key="liq.liquidacion_id"
                      class="px-6 py-2 flex items-center gap-3 hover:bg-gray-50">
                      <span class="text-xs text-gray-600 w-20">{{ formatPeriodo(liq.periodo) }}</span>
                      <Tag :value="liq.estado" :severity="estadoSeverity(liq.estado)" class="text-xs" />
                      <span class="text-xs text-gray-500 ml-auto">
                        Neto:
                        <span class="font-mono font-semibold text-blue-600">{{ fmt(liq.ingreso_neto_cop) }}</span>
                      </span>
                      <Button icon="pi pi-eye" text size="small"
                        @click="$router.push(`/liquidaciones/${liq.liquidacion_id}`)" />
                    </div>
                  </div>
                  <div v-else class="px-6 py-3 text-xs text-gray-400 text-center italic">
                    Sin liquidaciones para los filtros seleccionados
                  </div>
                </div>
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
          <label class="text-xs text-gray-600">Proyecto</label>
          <Select v-model="nueva.proyecto_id" :options="proyectosOpciones"
            optionLabel="nombre_comercial" optionValue="id"
            placeholder="Seleccionar proyecto" filter class="w-full" />
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

// Proyectos para el selector de nueva liquidación
const proyectosOpciones = ref([])

const tabActivo = ref(0)

// Expansores por tab
const expandidosProy = ref(new Set())
const expandidosLiq = ref(new Set())
const expandidosInv = ref(new Set())
const expandidosInvProy = ref(new Set())

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

// ─── Toggle helpers ───────────────────────────────────────────────────────────
function toggle(set, key) {
  if (set.value.has(key)) set.value.delete(key)
  else set.value.add(key)
  set.value = new Set(set.value)
}
function toggleProy(id) { toggle(expandidosProy, id) }
function toggleLiq(id) { toggle(expandidosLiq, id) }
function toggleInversionista(id) { toggle(expandidosInv, id) }
function toggleInvProy(key) { toggle(expandidosInvProy, key) }

// ─── Params ───────────────────────────────────────────────────────────────────
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

// ─── Carga datos ──────────────────────────────────────────────────────────────
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

async function loadProyectosOpciones() {
  try {
    const { data } = await api.get('/proyectos', { params: { size: 200 } })
    proyectosOpciones.value = data.items || []
  } catch {
    proyectosOpciones.value = []
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

// ─── Nueva liquidación ────────────────────────────────────────────────────────
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

// ─── Formato ──────────────────────────────────────────────────────────────────
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

function estadoProySeverity(e) {
  return {
    en_operacion: 'success', en_desarrollo: 'info',
    suspendido: 'warn', cancelado: 'secondary',
  }[e] || 'secondary'
}

watch(tabActivo, (v) => {
  if (v === 0) loadLista()
  else loadVistas()
})

onMounted(() => {
  loadLista()
  loadProyectosOpciones()
})
</script>
