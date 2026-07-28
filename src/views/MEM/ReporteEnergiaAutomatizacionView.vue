<template>
  <div class="space-y-5">
    <!-- Barra de acciones (el título ya lo pone el wrapper ReporteEnergiaView) -->
    <div class="flex flex-wrap items-center justify-end gap-2">
      <Calendar v-model="fecha" dateFormat="yy-mm-dd" class="w-40" :maxDate="maxFecha" showIcon />
      <Button icon="pi pi-play" label="Ejecutar clasificación" severity="secondary" outlined
              :loading="ejecutando"
              v-tooltip.bottom="'Vuelve a correr Quoia/Solenium para este día -- puede interrogar medidores incompletos'"
              @click="ejecutarClasificacion" />
      <Button icon="pi pi-file-excel" label="Generar Excel" severity="secondary" outlined
              :loading="generandoExcel" @click="generarExcel" />
      <Button icon="pi pi-send" label="Enviar reporte"
              :disabled="!resumen || !resumen.puede_enviar" :loading="enviando"
              v-tooltip.bottom="!resumen?.puede_enviar ? 'Quedan fronteras con horas sin fuente por revisar' : null"
              style="background: #915BD8; border-color: #915BD8;" @click="enviarReporte" />
    </div>

    <!-- Stat cards -->
    <div class="flex flex-wrap gap-4">
      <div v-for="stat in stats" :key="stat.label"
           class="bg-white rounded-xl shadow-sm p-4 h-20 flex-1 min-w-[9rem] flex flex-col justify-center cursor-pointer"
           style="border: 1px solid #e8e0f0;" @click="filtroSemaforo = stat.filtro">
        <p class="text-xs uppercase tracking-wide font-semibold" style="color: #6b5a8a;">{{ stat.label }}</p>
        <p class="text-2xl font-bold mt-1" :style="{ color: stat.color }">{{ stat.value }}</p>
      </div>
    </div>

    <TabView v-model:activeIndex="activeTab">
      <TabPanel header="Revisión de hoy">
        <div class="flex flex-wrap gap-3 mb-4">
          <span class="p-input-icon-left flex-1 sm:flex-none">
            <i class="pi pi-search" />
            <InputText v-model="search" placeholder="Buscar proyecto..." class="w-full sm:w-64" />
          </span>
        </div>

        <div v-if="loadingLista" class="flex items-center justify-center py-12">
          <i class="pi pi-spin pi-spinner text-3xl" style="color: #915BD8;" />
        </div>
        <div v-else-if="!filas.length" class="text-center py-12" style="color: #9b89b5;">
          <p class="mb-3">Todavía no se ha corrido la clasificación para este día.</p>
          <Button icon="pi pi-play" label="Ejecutar clasificación" :loading="ejecutando" @click="ejecutarClasificacion" />
        </div>
        <div v-else class="bg-white rounded-xl shadow-sm overflow-hidden" style="border: 1px solid #e8e0f0;">
          <DataTable :value="proyectosFiltrados" :paginator="true" :rows="20" :rowsPerPageOptions="[20, 50, 100]"
                     responsiveLayout="scroll" stripedRows class="p-datatable-sm"
                     @row-click="(e) => abrirDetalle(e.data, 'hoy')" selectionMode="single">
            <Column header="" style="width: 8px" bodyStyle="padding:0">
              <template #body="{ data }">
                <div :style="{ background: semaforoColor(data), width: '4px', height: '100%' }" />
              </template>
            </Column>
            <Column field="nombre_proyecto" header="Proyecto" sortable style="min-width: 220px">
              <template #body="{ data }">
                <span class="font-medium" style="color: #2C2039;">{{ data.nombre_proyecto }}</span>
              </template>
            </Column>
            <Column header="Generación" style="min-width: 140px">
              <template #body="{ data }">
                <Tag v-if="tagTipo(data.generacion)" :value="tagTipo(data.generacion).value" :severity="tagTipo(data.generacion).severity" />
                <span v-else style="color: #c9c0d9;">—</span>
              </template>
            </Column>
            <Column header="Consumo" style="min-width: 140px">
              <template #body="{ data }">
                <Tag v-if="tagTipo(data.consumo)" :value="tagTipo(data.consumo).value" :severity="tagTipo(data.consumo).severity" />
                <span v-else style="color: #c9c0d9;">—</span>
              </template>
            </Column>
          </DataTable>
        </div>
      </TabPanel>

      <TabPanel header="Historial">
        <div class="flex flex-wrap items-center gap-3 mb-4">
          <span class="text-sm" style="color: #6b5a8a;">Ver el reporte de otro día:</span>
          <Calendar v-model="fechaHistorial" dateFormat="yy-mm-dd" class="w-40" :maxDate="maxFecha" showIcon />
          <Button label="Ver" size="small" @click="cargarHistorial" />
        </div>
        <div v-if="loadingHistorial" class="flex items-center justify-center py-12">
          <i class="pi pi-spin pi-spinner text-3xl" style="color: #915BD8;" />
        </div>
        <div v-else-if="proyectosHistorial.length" class="bg-white rounded-xl shadow-sm overflow-hidden" style="border: 1px solid #e8e0f0;">
          <DataTable :value="proyectosHistorial" :paginator="true" :rows="20" responsiveLayout="scroll"
                     stripedRows class="p-datatable-sm" @row-click="(e) => abrirDetalle(e.data, 'historial')">
            <Column field="nombre_proyecto" header="Proyecto" sortable style="min-width: 220px" />
            <Column header="Generación" style="min-width: 140px">
              <template #body="{ data }">
                <Tag v-if="tagTipo(data.generacion)" :value="tagTipo(data.generacion).value" :severity="tagTipo(data.generacion).severity" />
                <span v-else style="color: #c9c0d9;">—</span>
              </template>
            </Column>
            <Column header="Consumo" style="min-width: 140px">
              <template #body="{ data }">
                <Tag v-if="tagTipo(data.consumo)" :value="tagTipo(data.consumo).value" :severity="tagTipo(data.consumo).severity" />
                <span v-else style="color: #c9c0d9;">—</span>
              </template>
            </Column>
          </DataTable>
        </div>
        <p v-else class="text-sm text-center py-8" style="color: #9b89b5;">
          Elige una fecha y pulsa "Ver" para revisar ese día.
        </p>
      </TabPanel>
    </TabView>

    <!-- Detalle -->
    <Dialog v-model:visible="showDetalle" modal class="w-full max-w-3xl" :header="detalleProyecto?.nombre_proyecto || 'Detalle'">
      <TabView v-if="detalleProyecto" v-model:activeIndex="detalleTab">
        <TabPanel v-if="detalleProyecto.generacion" header="Generación">
          <ReporteEnergiaDetalleTab
            :frontera-id="detalleProyecto.generacion.frontera_id"
            :fecha="detalleFecha"
            @actualizado="refrescarTrasEdicion"
          />
        </TabPanel>
        <TabPanel v-if="detalleProyecto.consumo" header="Consumo">
          <ReporteEnergiaDetalleTab
            :frontera-id="detalleProyecto.consumo.frontera_id"
            :fecha="detalleFecha"
            @actualizado="refrescarTrasEdicion"
          />
        </TabPanel>
      </TabView>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import api from '@/api/client'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Calendar from 'primevue/calendar'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import ReporteEnergiaDetalleTab from './ReporteEnergiaDetalleTab.vue'

const toast = useToast()

function hoyColombia() {
  // Colombia es UTC-5 fijo (sin horario de verano) -- se calcula así en vez
  // de usar la hora local del navegador, que puede estar en cualquier zona.
  const utc = new Date(Date.now())
  return new Date(utc.getTime() - 5 * 60 * 60 * 1000)
}
function ayerColombia() {
  // El reporte siempre es del día ANTERIOR (igual que el pipeline original
  // Reporte-Energia: 'ayer = date.today() - timedelta(days=1)', sin importar
  // qué fecha traiga Quoia) -- ni el día por defecto ni el máximo
  // seleccionable deberían ser "hoy".
  const h = hoyColombia()
  return new Date(h.getTime() - 24 * 60 * 60 * 1000)
}
// La clasificación solo se dispara desde "Revisión de hoy", que ya limita
// a "ayer" -- así que una fila con fecha = hoy nunca existe. Historial
// comparte el mismo límite, no porque dispare algo, sino porque no hay
// ningún día actual con datos que mostrar.
const maxFecha = ayerColombia()
const fecha = ref(ayerColombia())
const fechaHistorial = ref(ayerColombia())
const activeTab = ref(0)

const fechaISO = computed(() => fecha.value.toISOString().slice(0, 10))

const resumen = ref(null)
const filas = ref([])
const loadingLista = ref(true)
const search = ref('')
const filtroSemaforo = ref(null)

const filasHistorial = ref([])
const loadingHistorial = ref(false)

const generandoExcel = ref(false)
const enviando = ref(false)
const ejecutando = ref(false)

async function cargarResumen() {
  try {
    const { data } = await api.get('/reporte-energia/resumen', { params: { fecha: fechaISO.value } })
    resumen.value = data
  } catch (e) {
    resumen.value = null
  }
}

async function cargarLista(silent = false) {
  if (!silent) loadingLista.value = true
  try {
    const { data } = await api.get('/reporte-energia/fronteras', { params: { fecha: fechaISO.value } })
    filas.value = data
  } catch (e) {
    if (!silent) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el reporte de ese día.', life: 4000 })
      filas.value = []
    }
  } finally {
    if (!silent) loadingLista.value = false
  }
}

async function cargarHistorial() {
  loadingHistorial.value = true
  try {
    const f = fechaHistorial.value.toISOString().slice(0, 10)
    const { data } = await api.get('/reporte-energia/fronteras', { params: { fecha: f } })
    filasHistorial.value = data
  } catch (e) {
    filasHistorial.value = []
  } finally {
    loadingHistorial.value = false
  }
}

watch(fecha, () => { cargarResumen(); cargarLista() })
onMounted(() => { cargarResumen(); cargarLista() })

// ── Agrupar fronteras (Generación + Consumo) por proyecto ─────────────────
// Cada proyecto reporta como máximo una frontera de Generación y una de
// Consumo -- se agrupan en una sola fila para no repetir el nombre del
// proyecto ni necesitar una columna/filtro de Tipo.
function agruparPorProyecto(lista) {
  const map = new Map()
  for (const f of lista) {
    const key = f.proyecto_id ?? `sin-proyecto-${f.frontera_id}`
    if (!map.has(key)) {
      map.set(key, { proyecto_id: f.proyecto_id, nombre_proyecto: f.nombre_proyecto, generacion: null, consumo: null })
    }
    const entry = map.get(key)
    if (f.tipo === 'generacion') entry.generacion = f
    else entry.consumo = f
  }
  return Array.from(map.values())
}

const proyectos = computed(() => agruparPorProyecto(filas.value))
const proyectosHistorial = computed(() => agruparPorProyecto(filasHistorial.value))

function estadoTipo(item) {
  if (!item) return null
  if (item.revisar_manualmente) return 'critical'
  if (['1', 'CGM'].includes(String(item.caso))) return 'success'
  return 'warning'
}
function semaforo(p) {
  const estados = [estadoTipo(p.generacion), estadoTipo(p.consumo)].filter(Boolean)
  if (estados.includes('critical')) return 'critical'
  if (estados.includes('warning')) return 'warning'
  return estados.length ? 'success' : 'warning'
}
function semaforoColor(p) {
  const map = { critical: '#D64455', warning: '#F0C040', success: '#10B981' }
  return map[semaforo(p)]
}

function tagTipo(item) {
  if (!item) return null
  if (item.revisar_manualmente) return { value: 'Revisar', severity: 'danger' }
  if (item.editado_manualmente) return { value: 'Editado', severity: 'warn' }
  if (['1', 'CGM'].includes(String(item.caso))) return { value: 'Confiado', severity: 'success' }
  return { value: 'Corregido', severity: 'warn' }
}

const proyectosFiltrados = computed(() => {
  let list = proyectos.value
  if (filtroSemaforo.value) list = list.filter(p => semaforo(p) === filtroSemaforo.value)
  if (search.value) {
    const s = search.value.toLowerCase()
    list = list.filter(p => (p.nombre_proyecto || '').toLowerCase().includes(s))
  }
  return list
})

const stats = computed(() => {
  const all = proyectos.value
  return [
    { label: 'Total', value: all.length, color: '#2C2039', filtro: null },
    { label: 'Revisar', value: all.filter(p => semaforo(p) === 'critical').length, color: '#D64455', filtro: 'critical' },
    { label: 'Corregido automático', value: all.filter(p => semaforo(p) === 'warning').length, color: '#F0C040', filtro: 'warning' },
    { label: 'Confiado', value: all.filter(p => semaforo(p) === 'success').length, color: '#10B981', filtro: 'success' },
  ]
})

// ── Detalle ──────────────────────────────────────────────────────────────
const showDetalle = ref(false)
const detalleProyecto = ref(null)
const detalleFecha = ref(null)
const detalleTab = ref(0)
const detalleOrigen = ref('hoy')

function abrirDetalle(p, origen) {
  detalleProyecto.value = p
  detalleFecha.value = origen === 'historial' ? fechaHistorial.value.toISOString().slice(0, 10) : fechaISO.value
  detalleOrigen.value = origen
  detalleTab.value = 0
  showDetalle.value = true
}

async function refrescarTrasEdicion() {
  if (detalleOrigen.value === 'historial') await cargarHistorial()
  else { await cargarLista(); await cargarResumen() }
}

// ── Acciones globales ──────────────────────────────────────────────────
async function ejecutarClasificacion() {
  ejecutando.value = true
  try {
    await api.post('/reporte-energia/ejecutar', null, { params: { fecha: fechaISO.value } })
    toast.add({
      severity: 'info', summary: 'Clasificación iniciada',
      detail: 'Corre en segundo plano -- puede tardar varios minutos si hay medidores incompletos. La tabla se va a ir actualizando sola.',
      life: 6000,
    })
    sondearResultado()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.detail || 'No se pudo iniciar la clasificación.', life: 4000 })
    ejecutando.value = false
  }
}

// La corrida real vive en un hilo del backend (ver orquestador.ejecutar_dia_background) --
// se sondea unos minutos para reflejar el avance sin que el usuario tenga que refrescar a mano.
function sondearResultado() {
  const fechaSondeada = fechaISO.value
  let intentos = 0
  const totalAntes = filas.value.length
  const intervalo = setInterval(async () => {
    intentos += 1
    if (fechaISO.value !== fechaSondeada || intentos > 20) {
      clearInterval(intervalo)
      ejecutando.value = false
      return
    }
    await cargarResumen()
    await cargarLista(true)
    if (filas.value.length > totalAntes) {
      clearInterval(intervalo)
      ejecutando.value = false
    }
  }, 10000)
}

async function generarExcel() {
  generandoExcel.value = true
  try {
    const response = await api.get('/reporte-energia/excel', {
      params: { fecha: fechaISO.value }, responseType: 'blob',
    })
    const url = URL.createObjectURL(response.data)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte-energia-${fechaISO.value}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo generar el Excel.', life: 4000 })
  } finally {
    generandoExcel.value = false
  }
}

async function enviarReporte() {
  enviando.value = true
  try {
    const { data } = await api.post('/reporte-energia/enviar', null, { params: { fecha: fechaISO.value } })
    if (data.bloqueado) {
      toast.add({ severity: 'warn', summary: 'Envío bloqueado', detail: data.motivo_bloqueo, life: 5000 })
    } else {
      toast.add({ severity: 'success', summary: 'Reporte enviado', detail: `${data.enviados} fronteras enviadas`, life: 3000 })
    }
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.detail || 'No se pudo enviar el reporte.', life: 4000 })
  } finally {
    enviando.value = false
  }
}
</script>
