<template>
  <div v-if="proyecto" class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <Button icon="pi pi-arrow-left" text @click="$router.back()" class="-ml-2 mb-1" />
        <div v-if="!isEditMode">
          <h2 class="text-xl font-bold text-gray-800">{{ proyecto.nombre_comercial }}</h2>
          <Tag :value="proyecto.estado" :severity="estadoSeverity(proyecto.estado)" class="mt-1" />
        </div>
        <div v-else class="flex flex-col gap-2 mt-1">
          <InputText v-model="editForm.nombre_comercial" class="text-base font-semibold w-80" />
          <Select v-model="editForm.estado" :options="ESTADOS" class="w-48" />
        </div>
      </div>
      <div class="flex gap-2">
        <template v-if="isEditMode">
          <Button label="Cancelar" severity="secondary" outlined @click="cancelEdit" />
          <Button label="Guardar cambios" icon="pi pi-check" :loading="guardando" @click="saveEdit" />
        </template>
        <Button v-else label="Editar" icon="pi pi-pencil" outlined @click="enterEditMode" />
      </div>
    </div>

    <!-- Tabs -->
    <TabView>
      <!-- ══ GENERAL ══ -->
      <TabPanel header="General">
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 text-sm">
          <template v-if="!isEditMode">
            <InfoField label="Tipo" :value="proyecto.tipo_proyecto" />
            <InfoField label="Tecnología" :value="proyecto.tipo_tecnologia" />
            <InfoField label="Potencia (kWp)" :value="proyecto.potencia_instalada_kwp" />
            <InfoField label="Departamento" :value="proyecto.departamento" />
            <InfoField label="Municipio" :value="proyecto.municipio" />
            <InfoField label="Operador de red" :value="proyecto.operador_red" />
            <InfoField label="Clasificación" :value="proyecto.clasificacion_regulatoria" />
            <InfoField label="Carpeta Drive" :value="proyecto.carpeta_drive_codigo" />
            <InfoField label="Código base (topic)" :value="proyecto.sub_project" />
            <InfoField label="Código TSF" :value="proyecto.codigo_tsf" />
          </template>
          <template v-else>
            <div class="flex flex-col gap-1">
              <label class="field-label">Tipo de proyecto</label>
              <Select v-model="editForm.tipo_proyecto" :options="TIPOS_PROYECTO" class="w-full" placeholder="Seleccionar" showClear />
            </div>
            <div class="flex flex-col gap-1">
              <label class="field-label">Tecnología</label>
              <Select v-model="editForm.tipo_tecnologia" :options="TIPOS_TECNOLOGIA" class="w-full" placeholder="Seleccionar" showClear />
            </div>
            <div class="flex flex-col gap-1">
              <label class="field-label">Potencia (kWp)</label>
              <InputNumber v-model="editForm.potencia_instalada_kwp" :maxFractionDigits="2" class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="field-label">Departamento</label>
              <InputText v-model="editForm.departamento" class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="field-label">Municipio</label>
              <InputText v-model="editForm.municipio" class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="field-label">Operador de red</label>
              <InputText v-model="editForm.operador_red" class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="field-label">Clasificación regulatoria</label>
              <Select v-model="editForm.clasificacion_regulatoria" :options="CLASIFICACIONES" class="w-full" placeholder="Seleccionar" showClear />
            </div>
            <div class="flex flex-col gap-1">
              <label class="field-label">Carpeta Drive</label>
              <InputText v-model="editForm.carpeta_drive_codigo" class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="field-label">Código base (topic)</label>
              <InputText v-model="editForm.sub_project" class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="field-label">Código TSF</label>
              <InputText v-model="editForm.codigo_tsf" class="w-full" />
            </div>
          </template>
        </div>
      </TabPanel>

      <!-- ══ TÉCNICO ══ -->
      <TabPanel header="Técnico">
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 text-sm">
          <template v-if="!isEditMode">
            <InfoField label="Potencia instalada (kWp)" :value="proyecto.potencia_instalada_kwp" />
            <InfoField label="Cantidad de paneles" :value="proyecto.cantidad_total_paneles" />
            <InfoField label="Producción específica (kWh/kWp)" :value="proyecto.produccion_especifica_kwh_kwp" />
          </template>
          <template v-else>
            <div class="flex flex-col gap-1">
              <label class="field-label">Cantidad de paneles</label>
              <InputNumber v-model="editForm.cantidad_total_paneles" :useGrouping="false" class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="field-label">Producción específica (kWh/kWp)</label>
              <InputNumber v-model="editForm.produccion_especifica_kwh_kwp" :maxFractionDigits="2" class="w-full" />
            </div>
          </template>
        </div>
      </TabPanel>

      <!-- ══ SIMULACIÓN ══ -->
      <TabPanel header="Simulación">
        <div class="p-4 space-y-6">
          <div v-for="sim in SIMULACIONES" :key="sim.key">
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{{ sim.label }} (kWh/mes)</p>
            <div class="grid grid-cols-6 gap-2">
              <div v-for="(mes, i) in MESES" :key="sim.key + '-' + i">
                <label class="block text-[10px] text-gray-400 mb-0.5 text-center">{{ mes }}</label>
                <InputNumber
                  v-if="isEditMode"
                  v-model="sim.editArray.value[i]"
                  :maxFractionDigits="1"
                  class="w-full"
                  inputClass="text-center text-xs px-1 py-1"
                />
                <p v-else class="text-center text-sm font-medium text-gray-700 bg-gray-50 rounded py-1">
                  {{ sim.displayArray.value[i] != null ? sim.displayArray.value[i] : '—' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </TabPanel>

      <!-- ══ INVERSIONISTAS ══ -->
      <TabPanel header="Inversionistas">
        <div class="p-4 space-y-4">
          <DataTable :value="proyecto.inversionistas" class="text-sm" stripedRows>
            <Column field="cliente_nombre" header="Inversionista" />
            <Column header="Participación (%)">
              <template #body="{ data }">
                <template v-if="editandoInvId === data.id">
                  <div class="flex items-center gap-2">
                    <InputNumber v-model="editPct" :min="0" :max="100" :minFractionDigits="2" :maxFractionDigits="7"
                      suffix="%" class="w-32" />
                    <Button icon="pi pi-check" text severity="success" size="small" :loading="guardando"
                      @click="guardarEdicionInversionista(data.id)" />
                    <Button icon="pi pi-times" text severity="secondary" size="small"
                      @click="editandoInvId = null" />
                  </div>
                </template>
                <template v-else>
                  {{ data.porcentaje_participacion != null ? (data.porcentaje_participacion * 100).toFixed(4) + '%' : '—' }}
                </template>
              </template>
            </Column>
            <Column header="Patrimonio autónomo">
              <template #body="{ data }">
                <Tag :value="data.es_patrimonio_autonomo ? 'Sí' : 'No'"
                     :severity="data.es_patrimonio_autonomo ? 'info' : 'secondary'" />
              </template>
            </Column>
            <Column header="" style="width:100px">
              <template #body="{ data }">
                <div class="flex gap-1">
                  <Button icon="pi pi-pencil" text severity="info" size="small"
                    @click="iniciarEdicionInversionista(data)" v-tooltip="'Editar porcentaje'" />
                  <Button icon="pi pi-trash" text severity="danger" size="small"
                    @click="eliminarInversionista(data.id)" v-tooltip="'Eliminar'" />
                </div>
              </template>
            </Column>
            <template #empty>
              <p class="text-center text-gray-400 py-4">Sin inversionistas registrados.</p>
            </template>
            <ColumnGroup type="footer">
              <Row>
                <Column footer="Total" footerStyle="font-weight:600" />
                <Column :footer="totalParticipacion.toFixed(4) + '%'" footerStyle="font-weight:600" />
                <Column />
                <Column />
              </Row>
            </ColumnGroup>
          </DataTable>

          <Divider />
          <p class="font-semibold text-gray-700">Agregar inversionista</p>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div class="flex flex-col gap-1">
              <label class="text-xs text-gray-500">Cliente</label>
              <Select v-model="nuevoInv.cliente_id" :options="clientesDisponibles"
                optionLabel="razon_social_nombre" optionValue="id"
                placeholder="Seleccionar cliente" filter class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs text-gray-500">Porcentaje de participación (%)</label>
              <InputNumber v-model="nuevoInv.porcentaje_pct" :min="0" :max="100"
                :minFractionDigits="2" :maxFractionDigits="7" suffix="%" class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs text-gray-500">Patrimonio autónomo</label>
              <div class="flex items-center gap-2 h-10">
                <ToggleSwitch v-model="nuevoInv.es_patrimonio_autonomo" />
                <span class="text-sm text-gray-600">{{ nuevoInv.es_patrimonio_autonomo ? 'Sí' : 'No' }}</span>
              </div>
            </div>
          </div>
          <Button label="Agregar" icon="pi pi-plus" :loading="guardando"
            :disabled="!nuevoInv.cliente_id" @click="agregarInversionista" class="mt-2" />
        </div>
      </TabPanel>

      <!-- ══ SERVICIOS ══ -->
      <TabPanel header="Servicios">
        <div class="p-6">
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div
              v-for="srv in SERVICIOS_CARDS" :key="srv.key"
              class="relative flex flex-col items-center gap-3 rounded-xl border-2 p-5 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 select-none"
              :class="srvFlags[srv.key]
                ? 'border-transparent shadow-sm'
                : 'border-gray-100 bg-gray-50 opacity-60 hover:opacity-80'"
              :style="srvFlags[srv.key] ? `background:${srv.bg}18; border-color:${srv.color}40` : ''"
              @click="$router.push(`/proyectos/${route.params.id}/${srv.route}`)"
            >
              <div class="w-12 h-12 rounded-full flex items-center justify-center"
                :style="srvFlags[srv.key] ? `background:${srv.color}20` : 'background:#e5e7eb'">
                <i :class="srv.icon" class="text-2xl"
                  :style="srvFlags[srv.key] ? `color:${srv.color}` : 'color:#9ca3af'" />
              </div>
              <span class="text-sm font-semibold text-center"
                :style="srvFlags[srv.key] ? `color:${srv.color}` : 'color:#6b7280'">
                {{ srv.label }}
              </span>
              <span v-if="srvFlags[srv.key]"
                class="absolute top-2 right-2 w-2 h-2 rounded-full"
                :style="`background:${srv.color}`" />
            </div>
          </div>
          <div class="mt-6 pt-4 border-t border-gray-100">
            <p class="text-xs text-gray-400 mb-3">Activar / desactivar servicios</p>
            <div class="flex flex-wrap gap-3">
              <div v-for="srv in SERVICIOS_CARDS" :key="srv.key + '_toggle'"
                class="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                <ToggleSwitch v-model="srvFlags[srv.key]" @change="toggleServicio(srv.key, srvFlags[srv.key])" />
                <span class="text-xs text-gray-600">{{ srv.label }}</span>
              </div>
            </div>
          </div>
        </div>
      </TabPanel>
    </TabView>
  </div>

  <div v-else-if="loading" class="flex justify-center py-20">
    <ProgressSpinner />
  </div>

  <div v-else class="flex flex-col items-center py-20 gap-3 text-gray-500">
    <i class="pi pi-exclamation-circle text-3xl text-red-400"></i>
    <p class="text-sm">{{ errorMsg || 'No se pudo cargar el proyecto.' }}</p>
    <Button label="Reintentar" icon="pi pi-refresh" outlined size="small" @click="$router.go(0)" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import ToggleSwitch from 'primevue/toggleswitch'
import ProgressSpinner from 'primevue/progressspinner'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ColumnGroup from 'primevue/columngroup'
import Row from 'primevue/row'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Divider from 'primevue/divider'
import { useToast } from 'primevue/usetoast'
import api from '@/api/client'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// ── Constantes (sin hardcode en template) ────────────────────────────────────
const ESTADOS = ['en_desarrollo', 'en_operacion', 'suspendido', 'cancelado']
const TIPOS_PROYECTO = ['minigranja', 'autoconsumo', 'gd', 'movilidad_electrica', 'otro']
const TIPOS_TECNOLOGIA = ['solar', 'eolica', 'hidraulica', 'biomasa', 'otra']
const CLASIFICACIONES = ['AGP', 'AGPE', 'AGGE', 'GD', 'DER', 'otra']
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const SERVICIOS_CARDS = [
  { key: 'srv_ppa',           label: 'PPA',           icon: 'pi pi-bolt',       color: '#f59e0b', bg: '#fef3c7', route: 'ppa' },
  { key: 'srv_representacion',label: 'Representación', icon: 'pi pi-file-edit',  color: '#3b82f6', bg: '#eff6ff', route: 'representacion' },
  { key: 'srv_cgm',           label: 'CGM',           icon: 'pi pi-chart-bar',  color: '#10b981', bg: '#ecfdf5', route: 'cgm' },
  { key: 'srv_promotor',      label: 'Promotor',      icon: 'pi pi-briefcase',  color: '#8b5cf6', bg: '#f5f3ff', route: 'promotor' },
  { key: 'srv_rec',           label: 'REC',           icon: 'pi pi-verified',   color: '#14b8a6', bg: '#f0fdfa', route: 'rec' },
]
const SERVICIOS = SERVICIOS_CARDS

// ── Estado base ───────────────────────────────────────────────────────────────
const proyecto = ref(null)
const clientes = ref([])
const loading = ref(true)
const errorMsg = ref(null)
const guardando = ref(false)
const srvFlags = reactive({})

// ── Modo edición ──────────────────────────────────────────────────────────────
const isEditMode = computed(() => route.query.edit === 'true')

const editForm = reactive({
  nombre_comercial: '',
  estado: '',
  tipo_proyecto: null,
  tipo_tecnologia: null,
  potencia_instalada_kwp: null,
  departamento: null,
  municipio: null,
  operador_red: null,
  clasificacion_regulatoria: null,
  carpeta_drive_codigo: null,
  sub_project: null,
  codigo_tsf: null,
  cantidad_total_paneles: null,
  produccion_especifica_kwh_kwp: null,
})

// ── Simulación P90 / P50 ──────────────────────────────────────────────────────
const editP90 = ref(Array(12).fill(null))
const editP50 = ref(Array(12).fill(null))

const p90Display = computed(() => parseMonthArray(proyecto.value?.p90_mensual_kwh))
const p50Display = computed(() => parseMonthArray(proyecto.value?.p50_mensual_kwh))

const SIMULACIONES = [
  { key: 'p90', label: 'P90', editArray: editP90, displayArray: p90Display },
  { key: 'p50', label: 'P50', editArray: editP50, displayArray: p50Display },
]

function parseMonthArray(jsonStr) {
  if (!jsonStr) return Array(12).fill(null)
  try {
    const arr = JSON.parse(jsonStr)
    return Array.isArray(arr) ? arr.map(v => (v ?? null)) : Array(12).fill(null)
  } catch {
    return Array(12).fill(null)
  }
}

function serializeMonthArray(arr) {
  if (arr.every(v => v === null || v === undefined)) return null
  return JSON.stringify(arr.map(v => v ?? null))
}

function populateEditForm() {
  if (!proyecto.value) return
  const p = proyecto.value
  Object.keys(editForm).forEach(k => { if (k in p) editForm[k] = p[k] ?? null })
  editP90.value = parseMonthArray(p.p90_mensual_kwh)
  editP50.value = parseMonthArray(p.p50_mensual_kwh)
}

watch(isEditMode, (entering) => {
  if (entering && proyecto.value) populateEditForm()
})

function enterEditMode() {
  router.push({ query: { edit: 'true' } })
}

function cancelEdit() {
  router.push({ query: {} })
}

async function saveEdit() {
  guardando.value = true
  try {
    const payload = {}
    for (const [k, v] of Object.entries(editForm)) {
      if (v !== null && v !== undefined && v !== '') payload[k] = v
    }
    const p90json = serializeMonthArray(editP90.value)
    const p50json = serializeMonthArray(editP50.value)
    if (p90json !== null) payload.p90_mensual_kwh = p90json
    if (p50json !== null) payload.p50_mensual_kwh = p50json

    await api.patch(`/proyectos/${route.params.id}`, payload)
    const [proyRes, invRes] = await Promise.all([
      api.get(`/proyectos/${route.params.id}`),
      api.get(`/proyectos/${route.params.id}/inversionistas`),
    ])
    proyecto.value = {
      ...proyRes.data,
      inversionistas: Array.isArray(invRes.data) ? invRes.data : (invRes.data.items ?? []),
    }
    router.push({ query: {} })
    toast.add({ severity: 'success', summary: 'Proyecto actualizado', life: 3000 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.detail, life: 4000 })
  } finally {
    guardando.value = false
  }
}

// ── Inversionistas ────────────────────────────────────────────────────────────
const nuevoInv = reactive({ cliente_id: null, porcentaje_pct: null, es_patrimonio_autonomo: false })
const editandoInvId = ref(null)
const editPct = ref(null)

const clientesDisponibles = computed(() => {
  if (!proyecto.value) return clientes.value
  const yaAgregados = new Set(proyecto.value.inversionistas.map(i => i.cliente_id))
  return clientes.value.filter(c => !yaAgregados.has(c.id))
})

const totalParticipacion = computed(() => {
  if (!proyecto.value?.inversionistas?.length) return 0
  return proyecto.value.inversionistas.reduce((sum, i) => sum + (i.porcentaje_participacion ?? 0) * 100, 0)
})

async function agregarInversionista() {
  if (!nuevoInv.cliente_id) {
    toast.add({ severity: 'warn', summary: 'Selecciona un cliente', life: 2000 })
    return
  }
  guardando.value = true
  try {
    await api.post(`/proyectos/${route.params.id}/inversionistas`, {
      cliente_id: nuevoInv.cliente_id,
      porcentaje_participacion: nuevoInv.porcentaje_pct != null ? nuevoInv.porcentaje_pct / 100 : null,
      es_patrimonio_autonomo: nuevoInv.es_patrimonio_autonomo,
    })
    const { data } = await api.get(`/proyectos/${route.params.id}/inversionistas`)
    proyecto.value.inversionistas = Array.isArray(data) ? data : (data.items ?? [])
    nuevoInv.cliente_id = null
    nuevoInv.porcentaje_pct = null
    nuevoInv.es_patrimonio_autonomo = false
    toast.add({ severity: 'success', summary: 'Inversionista agregado', life: 2000 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error al agregar', detail: e.response?.data?.detail, life: 3000 })
  } finally {
    guardando.value = false
  }
}

async function eliminarInversionista(invId) {
  try {
    await api.delete(`/proyectos/${route.params.id}/inversionistas/${invId}`)
    proyecto.value.inversionistas = proyecto.value.inversionistas.filter(i => i.id !== invId)
    toast.add({ severity: 'success', summary: 'Inversionista eliminado', life: 2000 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error al eliminar', detail: e.response?.data?.detail, life: 3000 })
  }
}

function iniciarEdicionInversionista(inv) {
  editandoInvId.value = inv.id
  editPct.value = inv.porcentaje_participacion != null ? +(inv.porcentaje_participacion * 100).toFixed(7) : null
}

async function guardarEdicionInversionista(invId) {
  guardando.value = true
  try {
    await api.patch(`/proyectos/${route.params.id}/inversionistas/${invId}`, {
      porcentaje_participacion: editPct.value != null ? editPct.value / 100 : null,
    })
    editandoInvId.value = null
    editPct.value = null
    const { data } = await api.get(`/proyectos/${route.params.id}/inversionistas`)
    proyecto.value.inversionistas = Array.isArray(data) ? data : (data.items ?? [])
    toast.add({ severity: 'success', summary: 'Porcentaje actualizado', life: 2000 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error al actualizar', detail: e.response?.data?.detail, life: 3000 })
  } finally {
    guardando.value = false
  }
}

// ── Servicios ─────────────────────────────────────────────────────────────────
async function toggleServicio(key, value) {
  try {
    await api.patch(`/proyectos/${route.params.id}/servicios`, { [key]: value })
    const [proyRes, invRes] = await Promise.all([
      api.get(`/proyectos/${route.params.id}`),
      api.get(`/proyectos/${route.params.id}/inversionistas`),
    ])
    proyecto.value = {
      ...proyRes.data,
      inversionistas: Array.isArray(invRes.data) ? invRes.data : (invRes.data.items ?? []),
    }
    toast.add({ severity: 'success', summary: 'Servicio actualizado', life: 2000 })
  } catch {
    srvFlags[key] = !value
    toast.add({ severity: 'error', summary: 'Error al actualizar', life: 3000 })
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const estadoSeverity = (e) => (
  { en_operacion: 'success', en_desarrollo: 'info', suspendido: 'warn', cancelado: 'secondary' }[e] || 'secondary'
)

// ── Carga inicial ─────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    const [proyRes, clientesRes, invRes] = await Promise.all([
      api.get(`/proyectos/${route.params.id}`),
      api.get('/clientes', { params: { size: 200 } }),
      api.get(`/proyectos/${route.params.id}/inversionistas`),
    ])
    proyecto.value = {
      ...proyRes.data,
      inversionistas: Array.isArray(invRes.data) ? invRes.data : (invRes.data.items ?? []),
    }
    clientes.value = clientesRes.data.items
    for (const s of SERVICIOS) srvFlags[s.key] = proyRes.data[s.key]
    if (isEditMode.value) populateEditForm()
  } catch (e) {
    errorMsg.value = e.response?.data?.detail || e.message || 'Error de conexión con el servidor'
  } finally {
    loading.value = false
  }
})
</script>

<script>
const InfoField = {
  props: { label: String, value: [String, Number, Boolean] },
  template: `<div><p class="text-xs text-gray-400 uppercase tracking-wide">{{ label }}</p><p class="text-gray-800 font-medium mt-0.5">{{ value ?? '—' }}</p></div>`,
}
export default { components: { InfoField } }
</script>

<style scoped>
.field-label { @apply block text-xs font-medium text-gray-600 mb-1; }
</style>
