<template>
  <div class="space-y-5">
    <!-- Barra de acciones (el título ya lo pone el wrapper ReporteEnergiaView) -->
    <div class="flex items-center justify-between flex-wrap gap-3">
      <Calendar v-model="fecha" dateFormat="yy-mm-dd" class="w-40" :maxDate="maxFecha" showIcon />
      <div class="flex items-center gap-2">
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
        <div v-if="loadingLista" class="flex items-center justify-center py-12">
          <i class="pi pi-spin pi-spinner text-3xl" style="color: #915BD8;" />
        </div>
        <div v-else-if="!filas.length" class="text-center py-12" style="color: #9b89b5;">
          <p class="mb-3">Todavía no se ha corrido la clasificación para este día.</p>
          <Button icon="pi pi-play" label="Ejecutar clasificación" :loading="ejecutando" @click="ejecutarClasificacion" />
        </div>
        <div v-else class="workspace">
          <ReporteEnergiaLista
            :filas="filasFiltradas"
            :seleccionada="seleccion?.frontera_id"
            @seleccionar="(f) => seleccionar(f, 'hoy')"
          />
          <div class="detail-pane">
            <p v-if="!seleccion" class="text-sm text-center py-16" style="color: #9b89b5;">
              Elige una frontera de la lista para ver su detalle.
            </p>
            <ReporteEnergiaDetalleTab
              v-else
              :key="`${seleccion.frontera_id}-${fechaISO}`"
              :frontera-id="seleccion.frontera_id"
              :fecha="fechaISO"
              @actualizado="cargarLista(true); cargarResumen()"
            />
          </div>
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
        <div v-else-if="filasHistorial.length" class="workspace">
          <ReporteEnergiaLista
            :filas="filasHistorial"
            :seleccionada="seleccionHistorial?.frontera_id"
            @seleccionar="(f) => seleccionar(f, 'historial')"
          />
          <div class="detail-pane">
            <p v-if="!seleccionHistorial" class="text-sm text-center py-16" style="color: #9b89b5;">
              Elige una frontera de la lista para ver su detalle.
            </p>
            <ReporteEnergiaDetalleTab
              v-else
              :key="`${seleccionHistorial.frontera_id}-${fechaHistorialISO}`"
              :frontera-id="seleccionHistorial.frontera_id"
              :fecha="fechaHistorialISO"
              @actualizado="cargarHistorial()"
            />
          </div>
        </div>
        <p v-else class="text-sm text-center py-8" style="color: #9b89b5;">
          Elige una fecha y pulsa "Ver" para revisar ese día.
        </p>
      </TabPanel>
    </TabView>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import api from '@/api/client'
import Button from 'primevue/button'
import Calendar from 'primevue/calendar'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import ReporteEnergiaLista from './ReporteEnergiaLista.vue'
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
const fechaHistorialISO = computed(() => fechaHistorial.value.toISOString().slice(0, 10))

const resumen = ref(null)
const filas = ref([])
const loadingLista = ref(true)
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
    const f = fechaHistorialISO.value
    const { data } = await api.get('/reporte-energia/fronteras', { params: { fecha: f } })
    filasHistorial.value = data
  } catch (e) {
    filasHistorial.value = []
  } finally {
    loadingHistorial.value = false
  }
}

watch(fecha, () => { seleccion.value = null; cargarResumen(); cargarLista() })
onMounted(() => { cargarResumen(); cargarLista() })

function semaforo(f) {
  if (f.revisar_manualmente) return 'critical'
  if (['1', 'CGM'].includes(String(f.caso))) return 'success'
  return 'warning'
}

const filasFiltradas = computed(() => {
  if (!filtroSemaforo.value) return filas.value
  return filas.value.filter(f => semaforo(f) === filtroSemaforo.value)
})

const stats = computed(() => {
  const all = filas.value
  return [
    { label: 'Total', value: all.length, color: '#2C2039', filtro: null },
    { label: 'Revisar', value: all.filter(f => f.revisar_manualmente).length, color: '#D64455', filtro: 'critical' },
    { label: 'Corregido automático', value: all.filter(f => semaforo(f) === 'warning').length, color: '#F0C040', filtro: 'warning' },
    { label: 'Reporte válido', value: all.filter(f => semaforo(f) === 'success').length, color: '#10B981', filtro: 'success' },
  ]
})

// ── Selección (vista dividida: lista + detalle) ───────────────────────────
const seleccion = ref(null)
const seleccionHistorial = ref(null)

function seleccionar(fila, origen) {
  if (origen === 'historial') seleccionHistorial.value = fila
  else seleccion.value = fila
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

// La corrida real vive en un hilo del backend (ver orquestador.ejecutar_dia_background)
// y guarda avance parcial cada 5 fronteras -- con ~100+ fronteras puede tardar bastante
// más de lo que un límite fijo de intentos alcanzaría a cubrir. En vez de un tope de
// tiempo, se sigue sondeando MIENTRAS el conteo de filas siga creciendo; solo se
// rinde si pasan varios ciclos seguidos sin ver ninguna fila nueva (terminó o se colgó).
function sondearResultado() {
  const fechaSondeada = fechaISO.value
  let totalAntes = filas.value.length
  let ciclosSinCambio = 0
  const MAX_CICLOS_SIN_CAMBIO = 12 // ~2 minutos sin avance -- ahí sí se rinde

  const intervalo = setInterval(async () => {
    if (fechaISO.value !== fechaSondeada) {
      clearInterval(intervalo)
      ejecutando.value = false
      return
    }
    await cargarResumen()
    await cargarLista(true)
    if (filas.value.length > totalAntes) {
      totalAntes = filas.value.length
      ciclosSinCambio = 0
    } else {
      ciclosSinCambio += 1
    }
    if (ciclosSinCambio >= MAX_CICLOS_SIN_CAMBIO) {
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

<style scoped>
.workspace {
  display: grid;
  grid-template-columns: minmax(280px, 360px) 1fr;
  gap: 1rem;
  align-items: start;
}
@media (max-width: 860px) {
  .workspace { grid-template-columns: 1fr; }
}
.detail-pane {
  background: white;
  border: 1px solid #e8e0f0;
  border-radius: 0.75rem;
  padding: 1.25rem;
  min-height: 20rem;
}
</style>
