<template>
  <div class="space-y-4">
    <PageHeader title="Costos comercialización"
                subtitle="Costos e ingresos fijos por proyecto">
      <template #actions>
        <Button label="Subir Excel costos" icon="pi pi-file-excel" size="small" outlined
                @click="abrirSubirExcel" />
        <Button label="Repartir costos de XM" icon="pi pi-bolt" size="small" @click="abrirAcPower" />
      </template>
    </PageHeader>

    <input ref="excelInput" type="file" accept=".xlsx,.xls" class="hidden" @change="onExcelSeleccionado" />

    <!-- Dialog: subir Excel -->
    <Dialog v-model:visible="excelVisible" header="Subir Excel de costos" modal class="w-full max-w-lg">
      <div class="space-y-4 pt-1">
        <button type="button" class="dropzone" :disabled="subiendoExcel" @click="seleccionarExcel">
          <i class="pi pi-file-excel text-3xl" style="color:#915BD8" />
          <p class="text-sm font-semibold text-gray-700 mt-2">Seleccionar Excel</p>
          <p class="text-xs text-gray-400">.xlsx o .xls · un archivo por carga</p>
        </button>

        <div v-if="excel" class="flex items-center gap-3 rounded-lg border px-3 py-2" style="border-color:#ECE7F2">
          <i class="pi pi-file-excel text-sm shrink-0" style="color:#9b8fb0" />
          <span class="flex-1 min-w-0 text-xs font-medium text-gray-700 truncate">{{ excel.nombre }}</span>
          <span class="text-[10px] text-gray-400 shrink-0">{{ fmtTamano(excel.tamano) }}</span>
        </div>

        <div v-if="subiendoExcel" class="h-1.5 rounded-full overflow-hidden" style="background:#F1EAF9">
          <div class="h-full rounded-full transition-all duration-200"
               :style="{ width: progresoExcel + '%', background:'#915BD8' }" />
        </div>

        <p class="text-[11px] text-gray-400">
          <i class="pi pi-info-circle mr-1" />
          No se aceptan los tipos del grupo <strong>xm</strong>: esos los genera el reparto.
          Los anuales se prorratean como valor ÷ 12.
        </p>

        <div class="flex justify-end gap-2 pt-1">
          <Button label="Cerrar" severity="secondary" size="small" :disabled="subiendoExcel"
                  @click="excelVisible = false" />
          <Button label="Subir" icon="pi pi-upload" size="small" :disabled="!excel"
                  :loading="subiendoExcel" @click="subirExcel" />
        </div>
      </div>
    </Dialog>

    <!-- Dialog: repartir costos de XM -->
    <Dialog v-model:visible="acVisible" header="Repartir costos de XM" modal class="w-full max-w-md">
      <div class="space-y-3 pt-1">
        <p class="text-xs text-gray-500">
          Reparte las facturas de XM entre los proyectos a prorrata del AC Power.
          Requiere haber liquidado primero y que las facturas del período estén listas.
        </p>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="field-label">Mes</label>
            <Select v-model="ac.month" :options="MESES" optionLabel="label" optionValue="value" class="w-full" />
          </div>
          <div>
            <label class="field-label">Año</label>
            <InputNumber v-model="ac.year" :useGrouping="false" class="w-full" />
          </div>
        </div>
        <div>
          <label class="field-label">Versión</label>
          <Select v-model="ac.version" :options="VERSIONES" class="w-full" />
        </div>
        <div>
          <label class="field-label">AC Power total del período (kW)</label>
          <InputNumber v-model="ac.total_ac_power" :maxFractionDigits="4" :useGrouping="false"
                       class="w-full" placeholder="ej: 12345.6789" />
          <p class="text-[11px] text-gray-400 mt-1">Es el divisor de la prorrata.</p>
        </div>

        <div class="flex items-start gap-2 rounded-lg px-3 py-2"
             style="background:#FFF8E6; border:1px solid #F5E3B3">
          <Checkbox v-model="ac.override" inputId="ov" binary />
          <label for="ov" class="text-[11px] leading-snug" style="color:#7A5C00">
            <strong>Sobrescribir el reparto anterior.</strong>
            Debe quedar marcado la primera vez que se corre este período: sin marcar y
            sin un reparto previo, la API borra los costos de XM y no crea nada, sin avisar.
          </label>
        </div>

        <p v-if="progresoReparto" class="text-[11px] text-gray-500 flex items-center gap-2">
          <i class="pi pi-spin pi-spinner" /> {{ progresoReparto }}
        </p>

        <div class="flex justify-end gap-2 pt-1">
          <Button label="Cancelar" severity="secondary" size="small" :disabled="repartiendo"
                  @click="acVisible = false" />
          <Button label="Repartir" size="small" :loading="repartiendo" @click="repartir" />
        </div>
      </div>
    </Dialog>

    <!-- Filtros -->
    <div class="bg-white rounded-xl shadow-sm p-3 flex flex-wrap gap-3 items-end border" style="border-color:#ECE7F2">
      <div>
        <label class="field-label">Proyecto (tópico)</label>
        <InputText v-model="filtros.project" placeholder="ej: perija" class="w-44"
                   @keyup.enter="recargar" />
      </div>
      <div>
        <label class="field-label">Versión</label>
        <Select v-model="filtros.version" :options="VERSIONES" class="w-28" showClear
                placeholder="Todas" @change="recargar" />
      </div>
      <div>
        <label class="field-label">Buscar en la página</label>
        <IconField>
          <InputIcon class="pi pi-search" />
          <InputText v-model="q" placeholder="Proyecto, costo…" class="w-56" />
        </IconField>
      </div>
      <div class="flex-1" />
      <Button icon="pi pi-refresh" size="small" text rounded :loading="loading"
              v-tooltip.left="'Recargar'" @click="recargar" />
      <div class="text-xs text-gray-400 self-center">
        {{ total.toLocaleString('es-CO') }} registro{{ total === 1 ? '' : 's' }}
      </div>
    </div>

    <div v-if="error" class="rounded-lg px-3 py-2 text-xs flex items-center gap-2"
         style="background:#FEF2F2; border:1px solid #FECACA; color:#B42318">
      <i class="pi pi-times-circle" /> {{ error }}
    </div>

    <!-- Tabla -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden border" style="border-color:#ECE7F2">
      <div class="overflow-x-auto">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100">
              <th v-for="col in COLUMNAS" :key="col.key"
                  class="px-4 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wide whitespace-nowrap"
                  :class="col.right ? 'text-right' : 'text-left'">
                {{ col.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filtrados" :key="row.id"
                class="border-t border-gray-100 hover:bg-gray-50/70 transition-colors duration-100">
              <td class="px-4 py-2 whitespace-nowrap">{{ row.fecha_desde || '—' }}</td>
              <td class="px-4 py-2 whitespace-nowrap">{{ row.fecha_hasta || '—' }}</td>
              <td class="px-4 py-2">{{ row.proyecto || '—' }}</td>
              <td class="px-4 py-2 text-right font-mono text-xs">{{ fmtNum(row.valor) }}</td>
              <td class="px-4 py-2 whitespace-nowrap">{{ FRECUENCIAS[row.frecuencia_pago] || row.frecuencia_pago || '—' }}</td>
              <td class="px-4 py-2">
                {{ row.tipo_pago_nombre || row.tipo_pago || '—' }}
                <Tag v-if="row.grupo" :value="row.grupo" class="ml-1"
                     :severity="row.grupo === 'xm' ? 'warn' : 'secondary'" />
              </td>
              <td class="px-4 py-2 whitespace-nowrap uppercase text-xs">{{ row.version || '—' }}</td>
            </tr>
            <tr v-if="loading">
              <td :colspan="COLUMNAS.length" class="px-4 py-12 text-center text-gray-400">
                <i class="pi pi-spin pi-spinner text-2xl" />
              </td>
            </tr>
            <tr v-else-if="!filtrados.length">
              <td :colspan="COLUMNAS.length" class="px-4 py-12 text-center text-sm text-gray-400">
                <i class="pi pi-wallet text-2xl mb-2 block text-gray-300" />
                No hay costos con esos filtros.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginación: la tabla completa pasa de 10.000 filas -->
      <div v-if="total > filtros.size" class="flex items-center justify-between px-4 py-2.5 border-t"
           style="border-color:#ECE7F2">
        <span class="text-xs text-gray-400">
          {{ ((filtros.page - 1) * filtros.size + 1).toLocaleString('es-CO') }}–{{
            Math.min(filtros.page * filtros.size, total).toLocaleString('es-CO') }} de {{ total.toLocaleString('es-CO') }}
        </span>
        <div class="flex gap-1">
          <Button icon="pi pi-chevron-left" text rounded size="small"
                  :disabled="filtros.page === 1 || loading" @click="irA(filtros.page - 1)" />
          <Button icon="pi pi-chevron-right" text rounded size="small"
                  :disabled="filtros.page >= ultimaPagina || loading" @click="irA(filtros.page + 1)" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Checkbox from 'primevue/checkbox'
import Tag from 'primevue/tag'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import { useToast } from 'primevue/usetoast'
import {
  VERSIONES, VERSION_INICIAL, listarCostos, subirExcelCostos, repartirFacturasXm,
} from '@/api/liquidacionesApi'

const toast = useToast()

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
].map((label, i) => ({ label, value: i + 1 }))

const FRECUENCIAS = { monthly: 'Mensual', yearly: 'Anual' }

const COLUMNAS = [
  { key: 'fecha_desde',     label: 'Fecha desde' },
  { key: 'fecha_hasta',     label: 'Fecha hasta' },
  { key: 'proyecto',        label: 'Proyecto' },
  { key: 'valor',           label: 'Valor', right: true },
  { key: 'frecuencia_pago', label: 'Frecuencia' },
  { key: 'tipo_pago',       label: 'Costo' },
  { key: 'version',         label: 'Versión' },
]

// ── Listado ──────────────────────────────────────────────────────────────────
const filtros = reactive({ project: '', version: null, page: 1, size: 100 })
const q = ref('')
const loading = ref(false)
const error = ref(null)
const costos = ref([])
const total = ref(0)

const ultimaPagina = computed(() => Math.max(1, Math.ceil(total.value / filtros.size)))

const filtrados = computed(() => {
  const term = q.value.trim().toLowerCase()
  if (!term) return costos.value
  return costos.value.filter(d =>
    [d.proyecto, d.tipo_pago, d.tipo_pago_nombre, d.frecuencia_pago, d.version]
      .filter(Boolean).some(v => String(v).toLowerCase().includes(term)),
  )
})

async function cargar() {
  loading.value = true
  error.value = null
  try {
    const data = await listarCostos({
      project: filtros.project || undefined,
      version: filtros.version || undefined,
      page: filtros.page,
      size: filtros.size,
    })
    costos.value = data.results || []
    total.value = data.total || 0
  } catch (e) {
    error.value = e.response?.data?.detail || 'No se pudieron cargar los costos.'
    costos.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// Cambiar un filtro vuelve a la primera página: si no, se queda en una página
// que ya no existe y la tabla sale vacía sin explicación.
function recargar() {
  filtros.page = 1
  cargar()
}

function irA(pagina) {
  filtros.page = pagina
  cargar()
}

// ── Subir Excel ──────────────────────────────────────────────────────────────
const excelVisible = ref(false)
const excelInput = ref(null)
const excel = ref(null)
const subiendoExcel = ref(false)
const progresoExcel = ref(0)

function abrirSubirExcel() {
  excel.value = null
  progresoExcel.value = 0
  excelVisible.value = true
}
function seleccionarExcel() {
  excelInput.value?.click()
}
function onExcelSeleccionado(e) {
  const f = (e.target.files || [])[0]
  e.target.value = ''
  if (f) excel.value = { nombre: f.name, tamano: f.size, file: f }
}

async function subirExcel() {
  subiendoExcel.value = true
  progresoExcel.value = 0
  try {
    await subirExcelCostos(excel.value.file, { onProgreso: (p) => { progresoExcel.value = p } })
    toast.add({ severity: 'success', summary: 'Excel cargado', life: 4000 })
    excelVisible.value = false
    excel.value = null
    await cargar()
  } catch (e) {
    toast.add({
      severity: 'error', summary: 'No se pudo cargar',
      detail: e.response?.data?.detail || e.message, life: 8000,
    })
  } finally {
    subiendoExcel.value = false
  }
}

// ── Repartir costos de XM ────────────────────────────────────────────────────
const hoy = new Date()
const anterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)

const acVisible = ref(false)
const repartiendo = ref(false)
const progresoReparto = ref('')
const ac = reactive({
  month: null, year: null, version: VERSION_INICIAL, total_ac_power: null, override: true,
})

function abrirAcPower() {
  Object.assign(ac, {
    month: anterior.getMonth() + 1,
    year: anterior.getFullYear(),
    version: VERSION_INICIAL,
    total_ac_power: null,
    override: true,
  })
  progresoReparto.value = ''
  acVisible.value = true
}

async function repartir() {
  if (ac.month == null || ac.year == null || !ac.version || ac.total_ac_power == null) {
    toast.add({
      severity: 'warn', summary: 'Faltan campos',
      detail: 'Completa mes, año, versión y AC Power total.', life: 4000,
    })
    return
  }

  repartiendo.value = true
  progresoReparto.value = ''
  try {
    const res = await repartirFacturasXm(
      { ...ac },
      { onEstado: (t) => { progresoReparto.value = t.mensaje } },
    )
    toast.add({
      severity: 'success', summary: 'Costos repartidos',
      detail: res.message || 'Terminó correctamente.', life: 6000,
    })
    acVisible.value = false
    recargar()
  } catch (e) {
    toast.add({
      severity: 'error', summary: 'El reparto falló',
      detail: e.response?.data?.detail || e.message, life: 10000,
    })
  } finally {
    repartiendo.value = false
    progresoReparto.value = ''
  }
}

// ── Formato ──────────────────────────────────────────────────────────────────
function fmtTamano(bytes) {
  if (!bytes && bytes !== 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fmtNum(v) {
  if (v === null || v === undefined || v === '') return '—'
  const n = Number(v)
  if (Number.isNaN(n)) return String(v)
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(n)
}

onMounted(cargar)
</script>

<style scoped>
.field-label { @apply block text-xs font-medium text-gray-600 mb-1; }

.dropzone {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 22px 16px;
  border: 2px dashed #D9CCEE;
  border-radius: 12px;
  background: #FBF7FF;
  cursor: pointer;
  transition: border-color .15s, background .15s;
}
.dropzone:hover { border-color: #915BD8; background: #F4ECFC; }
.dropzone:disabled { opacity: .6; cursor: default; }
</style>
