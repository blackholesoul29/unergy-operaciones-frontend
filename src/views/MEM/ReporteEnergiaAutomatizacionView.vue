<template>
  <div class="space-y-5">
    <PageHeader title="Reporte de Energía" :subtitle="`Revisión diaria · ${fechaLabel}`">
      <template #actions>
        <Calendar v-model="fecha" dateFormat="yy-mm-dd" class="w-40" :maxDate="hoy" showIcon />
        <Button icon="pi pi-file-excel" label="Generar Excel" severity="secondary" outlined
                :loading="generandoExcel" @click="generarExcel" />
        <Button icon="pi pi-send" label="Enviar reporte"
                :disabled="!resumen || !resumen.puede_enviar" :loading="enviando"
                v-tooltip.bottom="!resumen?.puede_enviar ? 'Quedan fronteras con horas sin fuente por revisar' : null"
                style="background: #915BD8; border-color: #915BD8;" @click="enviarReporte" />
      </template>
    </PageHeader>

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
          <Dropdown v-model="tipoFilter" :options="tipoOptions" optionLabel="label" optionValue="value"
                    placeholder="Tipo" class="w-40" showClear />
          <div class="flex items-center gap-2">
            <ToggleSwitch v-model="soloPendientes" />
            <span class="text-sm" style="color: #6b5a8a;">Solo pendientes</span>
          </div>
        </div>

        <div v-if="loadingLista" class="flex items-center justify-center py-12">
          <i class="pi pi-spin pi-spinner text-3xl" style="color: #915BD8;" />
        </div>
        <div v-else class="bg-white rounded-xl shadow-sm overflow-hidden" style="border: 1px solid #e8e0f0;">
          <DataTable :value="filasFiltradas" :paginator="true" :rows="20" :rowsPerPageOptions="[20, 50, 100]"
                     responsiveLayout="scroll" stripedRows class="p-datatable-sm"
                     @row-click="(e) => abrirDetalle(e.data)" selectionMode="single">
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
            <Column field="tipo" header="Tipo" style="min-width: 100px">
              <template #body="{ data }">
                <Tag :value="data.tipo === 'generacion' ? 'Gen' : 'Con'"
                     :severity="data.tipo === 'generacion' ? 'success' : 'info'" />
              </template>
            </Column>
            <Column field="medidor_usado" header="Cómo se reportó" style="min-width: 200px">
              <template #body="{ data }">
                <span style="color: #6b5a8a;">{{ etiquetaFuente(data) }}</span>
              </template>
            </Column>
            <Column field="energia_final_kwh" header="Energía final" style="min-width: 130px">
              <template #body="{ data }">
                <span class="font-mono">{{ fmtKwh(data.energia_final_kwh) }}</span>
              </template>
            </Column>
            <Column header="Estado" style="min-width: 160px">
              <template #body="{ data }">
                <Tag v-if="data.revisar_manualmente" value="Revisar manualmente" severity="danger" />
                <Tag v-else-if="data.editado_manualmente" value="Editado" severity="warn" />
                <Tag v-else-if="['1', 'CGM'].includes(String(data.caso))" value="Confiado" severity="success" />
                <Tag v-else value="Corregido automático" severity="warn" />
              </template>
            </Column>
          </DataTable>
        </div>
      </TabPanel>

      <TabPanel header="Historial">
        <div class="flex flex-wrap items-center gap-3 mb-4">
          <span class="text-sm" style="color: #6b5a8a;">Ver el reporte de otro día:</span>
          <Calendar v-model="fechaHistorial" dateFormat="yy-mm-dd" class="w-40" :maxDate="hoy" showIcon />
          <Button label="Ver" size="small" @click="cargarHistorial" />
        </div>
        <div v-if="loadingHistorial" class="flex items-center justify-center py-12">
          <i class="pi pi-spin pi-spinner text-3xl" style="color: #915BD8;" />
        </div>
        <div v-else-if="filasHistorial.length" class="bg-white rounded-xl shadow-sm overflow-hidden" style="border: 1px solid #e8e0f0;">
          <DataTable :value="filasHistorial" :paginator="true" :rows="20" responsiveLayout="scroll"
                     stripedRows class="p-datatable-sm" @row-click="(e) => abrirDetalle(e.data, fechaHistorial)">
            <Column field="nombre_proyecto" header="Proyecto" sortable style="min-width: 220px" />
            <Column field="tipo" header="Tipo" style="min-width: 100px">
              <template #body="{ data }">
                <Tag :value="data.tipo === 'generacion' ? 'Gen' : 'Con'" :severity="data.tipo === 'generacion' ? 'success' : 'info'" />
              </template>
            </Column>
            <Column field="medidor_usado" header="Cómo se reportó" style="min-width: 200px">
              <template #body="{ data }">{{ etiquetaFuente(data) }}</template>
            </Column>
            <Column field="energia_final_kwh" header="Energía final" style="min-width: 130px">
              <template #body="{ data }"><span class="font-mono">{{ fmtKwh(data.energia_final_kwh) }}</span></template>
            </Column>
            <Column header="Estado" style="min-width: 160px">
              <template #body="{ data }">
                <Tag v-if="data.revisar_manualmente" value="Revisar manualmente" severity="danger" />
                <Tag v-else-if="data.editado_manualmente" value="Editado" severity="warn" />
                <Tag v-else value="OK" severity="success" />
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
    <Dialog v-model:visible="showDetalle" modal class="w-full max-w-3xl" :header="detalle?.nombre_proyecto || 'Detalle'">
      <div v-if="loadingDetalle" class="flex items-center justify-center py-12">
        <i class="pi pi-spin pi-spinner text-3xl" style="color: #915BD8;" />
      </div>
      <div v-else-if="detalle" class="space-y-5">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div class="text-xs font-mono" style="color: #9b89b5;">
            {{ detalle.tipo === 'generacion' ? 'Generación' : 'Consumo' }} · {{ detalle.fecha }}
            <span v-if="detalle.estado_reporte"> · Estado reporte {{ detalle.estado_reporte }}</span>
          </div>
          <Tag v-if="detalle.revisar_manualmente" value="Revisar manualmente" severity="danger" />
          <Tag v-else value="OK" severity="success" />
        </div>

        <!-- Curva -->
        <div class="rounded-xl p-4" style="border: 1px solid #e8e0f0;">
          <p class="text-xs font-semibold uppercase mb-3" style="color: #6b5a8a;">Curva reportada (24 h)</p>
          <CurvaChart
            :final="detalle.curva_final"
            :medidor="detalle.curva_medidor_principal || detalle.curva_medidor_respaldo"
            :solenium="detalle.curva_solenium"
            :horasReconectador="detalle.horas_rellenadas_reconectador"
            :horasSolenium="detalle.horas_rellenadas_solenium"
            :horasHistorico="detalle.horas_rellenadas_historico"
          />
        </div>

        <!-- Metadata -->
        <div class="rounded-xl p-4" style="border: 1px solid #e8e0f0;">
          <p class="text-xs font-semibold uppercase mb-3" style="color: #6b5a8a;">Detalle de la clasificación</p>
          <dl class="grid grid-cols-2 gap-y-2 text-sm">
            <dt style="color: #9b89b5;">Caso</dt><dd class="font-mono">{{ detalle.caso }}</dd>
            <dt style="color: #9b89b5;">Medidor usado</dt><dd class="font-mono">{{ detalle.medidor_usado || '—' }}</dd>
            <template v-if="detalle.tipo === 'generacion'">
              <dt style="color: #9b89b5;">Factor de pérdida (FP)</dt>
              <dd class="font-mono">{{ detalle.fp != null ? detalle.fp.toFixed(4) : '—' }}</dd>
              <dt style="color: #9b89b5;">API Solenium</dt>
              <dd>{{ detalle.nota_solenium || 'Registrado' }}</dd>
            </template>
            <dt style="color: #9b89b5;">Horas rellenadas (histórico)</dt>
            <dd class="font-mono">{{ (detalle.horas_rellenadas_historico || []).join(', ') || '—' }}</dd>
          </dl>
        </div>

        <!-- Edición manual -->
        <div class="rounded-xl p-4" style="border: 1px solid #e8e0f0;">
          <div class="flex items-center justify-between mb-3">
            <p class="text-xs font-semibold uppercase" style="color: #6b5a8a;">Corrección manual (kWh)</p>
            <Button label="Validar y confiar" size="small" severity="success"
                    :loading="validando" @click="validar" />
          </div>
          <div class="grid grid-cols-6 sm:grid-cols-8 gap-2">
            <div v-for="h in 24" :key="h">
              <label class="text-[10px] font-mono block" style="color: #9b89b5;">{{ h - 1 }}h</label>
              <InputNumber v-model="curvaEditable[h - 1]" :minFractionDigits="2" :maxFractionDigits="2"
                           inputClass="w-full text-xs"
                           :class="esHoraRellenada(h - 1) ? 'campo-rellenado' : ''" />
            </div>
          </div>
          <p class="text-xs mt-3" style="color: #9b89b5;">
            Las horas resaltadas se completaron con reconectador, Solenium o histórico -- corrígelas solo si tienes
            un valor real más confiable. La corrección queda registrada con tu nombre.
          </p>
          <div class="flex justify-end mt-2">
            <Button label="Guardar corrección" size="small" :loading="guardando" @click="guardarCurva" />
          </div>
        </div>
      </div>
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
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Calendar from 'primevue/calendar'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import ToggleSwitch from 'primevue/toggleswitch'
import CurvaChart from './ReporteEnergiaCurvaChart.vue'

const toast = useToast()

function hoyColombia() {
  // Colombia es UTC-5 fijo (sin horario de verano) -- se calcula así en vez
  // de usar la hora local del navegador, que puede estar en cualquier zona.
  const utc = new Date(Date.now())
  return new Date(utc.getTime() - 5 * 60 * 60 * 1000)
}
const hoy = hoyColombia()
const fecha = ref(hoyColombia())
const fechaHistorial = ref(hoyColombia())
const activeTab = ref(0)

const fechaISO = computed(() => fecha.value.toISOString().slice(0, 10))
const fechaLabel = computed(() => fechaISO.value)

const resumen = ref(null)
const filas = ref([])
const loadingLista = ref(true)
const search = ref('')
const tipoFilter = ref(null)
const soloPendientes = ref(false)
const filtroSemaforo = ref(null)

const filasHistorial = ref([])
const loadingHistorial = ref(false)

const generandoExcel = ref(false)
const enviando = ref(false)

async function cargarResumen() {
  try {
    const { data } = await api.get('/reporte-energia/resumen', { params: { fecha: fechaISO.value } })
    resumen.value = data
  } catch (e) {
    resumen.value = null
  }
}

async function cargarLista() {
  loadingLista.value = true
  try {
    const { data } = await api.get('/reporte-energia/fronteras', { params: { fecha: fechaISO.value } })
    filas.value = data
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el reporte de ese día.', life: 4000 })
    filas.value = []
  } finally {
    loadingLista.value = false
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

const tipoOptions = [
  { label: 'Generación', value: 'generacion' },
  { label: 'Consumo', value: 'consumo' },
]

const filasFiltradas = computed(() => {
  let list = filas.value
  if (tipoFilter.value) list = list.filter(f => f.tipo === tipoFilter.value)
  if (soloPendientes.value) list = list.filter(f => f.revisar_manualmente)
  if (filtroSemaforo.value) list = list.filter(f => semaforo(f) === filtroSemaforo.value)
  if (search.value) {
    const s = search.value.toLowerCase()
    list = list.filter(f => (f.nombre_proyecto || '').toLowerCase().includes(s))
  }
  return list
})

function semaforo(f) {
  if (f.revisar_manualmente) return 'critical'
  if (['1', 'CGM'].includes(String(f.caso))) return 'success'
  return 'warning'
}
function semaforoColor(f) {
  const map = { critical: '#D64455', warning: '#F0C040', success: '#10B981' }
  return map[semaforo(f)]
}

const stats = computed(() => {
  const all = filas.value
  return [
    { label: 'Total', value: all.length, color: '#2C2039', filtro: null },
    { label: 'Revisar', value: all.filter(f => f.revisar_manualmente).length, color: '#D64455', filtro: 'critical' },
    { label: 'Corregido automático', value: all.filter(f => semaforo(f) === 'warning').length, color: '#F0C040', filtro: 'warning' },
    { label: 'Confiado', value: all.filter(f => semaforo(f) === 'success').length, color: '#10B981', filtro: 'success' },
  ]
})

const ETIQUETAS_FUENTE = {
  cgm: 'CGM', principal: 'Medidor principal', respaldo: 'Medidor respaldo',
  inversores: 'Inversores × FP', crudos: 'Datos crudos', crudos_parcial: 'Datos crudos (parcial)',
  reconectador: 'Reconectador', solenium_power: 'Solenium (power)', ninguno: 'Apagado',
  revisar: 'Sin fuente', externo: 'Reporta otra empresa', historico: 'Histórico propio',
  historico_vecino: 'Histórico (vecino de predio)',
}
function etiquetaFuente(f) {
  return ETIQUETAS_FUENTE[f.medidor_usado] || f.medidor_usado || '—'
}
function fmtKwh(v) {
  if (v === null || v === undefined) return '—'
  return Number(v).toLocaleString('es-CO', { maximumFractionDigits: 1 }) + ' kWh'
}

// ── Detalle ──────────────────────────────────────────────────────────────
const showDetalle = ref(false)
const loadingDetalle = ref(false)
const detalle = ref(null)
const detalleFrontera = ref(null)
const detalleFecha = ref(null)
const curvaEditable = ref(Array(24).fill(null))
const validando = ref(false)
const guardando = ref(false)

async function abrirDetalle(fila, fechaOverride) {
  detalleFrontera.value = fila.frontera_id
  detalleFecha.value = fechaOverride ? fechaOverride.toISOString().slice(0, 10) : fechaISO.value
  showDetalle.value = true
  loadingDetalle.value = true
  try {
    const { data } = await api.get(`/reporte-energia/fronteras/${fila.frontera_id}`, {
      params: { fecha: detalleFecha.value },
    })
    detalle.value = data
    curvaEditable.value = [...(data.curva_final || Array(24).fill(null))]
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el detalle.', life: 4000 })
    showDetalle.value = false
  } finally {
    loadingDetalle.value = false
  }
}

function esHoraRellenada(h) {
  const d = detalle.value
  if (!d) return false
  return (d.horas_rellenadas_reconectador || []).includes(h)
    || (d.horas_rellenadas_solenium || []).includes(h)
    || (d.horas_rellenadas_historico || []).includes(h)
}

async function guardarCurva() {
  guardando.value = true
  try {
    const { data } = await api.patch(
      `/reporte-energia/fronteras/${detalleFrontera.value}`,
      { curva_final: curvaEditable.value },
      { params: { fecha: detalleFecha.value } },
    )
    detalle.value = data
    toast.add({ severity: 'success', summary: 'Corrección guardada', life: 2500 })
    await cargarLista()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la corrección.', life: 4000 })
  } finally {
    guardando.value = false
  }
}

async function validar() {
  validando.value = true
  try {
    await api.post(`/reporte-energia/fronteras/${detalleFrontera.value}/validar`, null, {
      params: { fecha: detalleFecha.value },
    })
    detalle.value.revisar_manualmente = false
    toast.add({ severity: 'success', summary: 'Validado', life: 2000 })
    await cargarLista()
    await cargarResumen()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo validar.', life: 4000 })
  } finally {
    validando.value = false
  }
}

// ── Acciones globales ──────────────────────────────────────────────────
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
:deep(.campo-rellenado input) {
  border-color: #F0C040 !important;
  background: rgba(240, 192, 64, 0.08);
}
</style>
