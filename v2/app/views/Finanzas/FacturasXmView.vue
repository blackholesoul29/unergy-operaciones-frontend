<template>
  <div class="space-y-4">
    <PageHeader title="Facturas de XM"
                subtitle="Facturas del período y su estado de alistamiento para repartir">
      <template #actions>
        <Button label="Subir facturas" icon="pi pi-upload" size="small" @click="abrirSubida" />
      </template>
    </PageHeader>

    <input ref="fileInput" type="file" multiple accept="application/pdf,.pdf" class="hidden"
           @change="onArchivosSeleccionados" />

    <!-- Dialog: Subir facturas -->
    <Dialog v-model:visible="subidaVisible" header="Subir facturas de XM" modal class="w-full max-w-lg">
      <div class="space-y-4 pt-1">
        <button type="button" class="dropzone" :disabled="subiendo" @click="seleccionarArchivos">
          <i class="pi pi-cloud-upload text-3xl" style="color:#915BD8" />
          <p class="text-sm font-semibold text-gray-700 mt-2">Seleccionar facturas</p>
          <p class="text-xs text-gray-400">
            Solo PDF · máximo {{ MAX_FACTURAS_POR_LOTE }} por lote, {{ MAX_MB_POR_FACTURA }} MB cada una
          </p>
        </button>

        <div>
          <label class="field-label">Versión</label>
          <Select v-model="versionSubida" :options="VERSIONES" class="w-full" :disabled="subiendo" />
        </div>

        <div v-if="archivos.length" class="space-y-2 max-h-56 overflow-y-auto">
          <div v-for="a in archivos" :key="a.nombre"
               class="flex items-center gap-3 rounded-lg border px-3 py-2" style="border-color:#ECE7F2">
            <i class="pi pi-file-pdf text-sm shrink-0" style="color:#9b8fb0" />
            <span class="flex-1 min-w-0 text-xs font-medium text-gray-700 truncate">{{ a.nombre }}</span>
            <span class="text-[10px] text-gray-400 shrink-0">{{ fmtTamano(a.tamano) }}</span>
            <Button v-if="!subiendo" icon="pi pi-times" text rounded size="small"
                    @click="quitarArchivo(a.nombre)" />
          </div>
        </div>

        <!-- Progreso: primero sube el archivo, después la API lo procesa en una tarea -->
        <div v-if="subiendo || progresoTarea" class="space-y-1">
          <div class="h-1.5 rounded-full overflow-hidden" style="background:#F1EAF9">
            <div class="h-full rounded-full transition-all duration-200"
                 :style="{ width: (progresoTarea ? 100 : progresoSubida) + '%', background:'#915BD8' }" />
          </div>
          <p class="text-[11px] text-gray-500">
            {{ progresoTarea || `Subiendo… ${progresoSubida}%` }}
          </p>
        </div>

        <p class="text-[11px] text-gray-400">
          <i class="pi pi-info-circle mr-1" />
          El mes y el año no se envían: los extrae la IA del PDF. El lote se procesa
          de a una factura, así que puede tardar.
        </p>

        <div class="flex justify-end gap-2 pt-1">
          <Button label="Cerrar" severity="secondary" size="small" :disabled="subiendo"
                  @click="subidaVisible = false" />
          <Button label="Subir" icon="pi pi-upload" size="small"
                  :disabled="!archivos.length" :loading="subiendo" @click="subir" />
        </div>
      </div>
    </Dialog>

    <!-- Filtros -->
    <div class="bg-white rounded-xl shadow-sm p-3 flex flex-wrap gap-3 items-end border" style="border-color:#ECE7F2">
      <div>
        <label class="field-label">Mes</label>
        <Select v-model="filtros.month" :options="MESES" optionLabel="label" optionValue="value"
                class="w-36" showClear placeholder="Todos" @change="cargar" />
      </div>
      <div>
        <label class="field-label">Año</label>
        <InputNumber v-model="filtros.year" :useGrouping="false" class="w-28" @update:modelValue="cargar" />
      </div>
      <div>
        <label class="field-label">Versión</label>
        <Select v-model="filtros.version" :options="VERSIONES" class="w-28" showClear
                placeholder="Todas" @change="cargar" />
      </div>
      <div>
        <label class="field-label">Buscar</label>
        <IconField>
          <InputIcon class="pi pi-search" />
          <InputText v-model="q" placeholder="Código, nombre, agente…" class="w-64" />
        </IconField>
      </div>
      <div class="flex-1" />
      <Button icon="pi pi-refresh" size="small" text rounded :loading="loading"
              v-tooltip.left="'Recargar'" @click="cargar" />
      <div class="text-xs text-gray-400 self-center">
        {{ filtrados.length }} factura{{ filtrados.length === 1 ? '' : 's' }}
      </div>
    </div>

    <!-- Alistamiento: es la precondición de repartir los costos de XM -->
    <div v-if="!loading && !error && hayPeriodo" class="rounded-xl px-4 py-3 border text-sm"
         :style="readiness.lista_para_repartir
           ? 'background:#F0FDF4; border-color:#BBF7D0; color:#166534'
           : 'background:#FFF8E6; border-color:#F5E3B3; color:#7A5C00'">
      <div class="flex items-center gap-2 font-semibold">
        <i :class="readiness.lista_para_repartir ? 'pi pi-check-circle' : 'pi pi-exclamation-triangle'" />
        <span v-if="readiness.lista_para_repartir">Listo para repartir los costos de XM</span>
        <span v-else>Todavía no se puede repartir</span>
        <span class="font-normal text-xs opacity-75">
          · {{ readiness.completadas }} de {{ readiness.total }} procesadas
          · generador {{ readiness.tiene_factura_generador ? 'sí' : 'no' }}
          · comercializador {{ readiness.tiene_factura_comercializador ? 'sí' : 'no' }}
        </span>
      </div>
      <ul v-if="readiness.bloqueos.length" class="mt-2 ml-6 list-disc text-xs space-y-0.5">
        <li v-for="(b, i) in readiness.bloqueos" :key="i">{{ b }}</li>
      </ul>
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
                  :class="col.align || 'text-left'">
                {{ col.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filtrados" :key="row.id"
                class="border-t border-gray-100 hover:bg-gray-50/70 transition-colors duration-100">
              <td class="px-4 py-2 font-mono text-xs">{{ row.codigo || '—' }}</td>
              <td class="px-4 py-2">{{ row.nombre || '—' }}</td>
              <td class="px-4 py-2 whitespace-nowrap">
                <Tag :value="row.agente || '—'" :severity="row.agente === 'GENERADOR' ? 'success' : 'info'" />
              </td>
              <td class="px-4 py-2 whitespace-nowrap">{{ row.mes_nombre || row.mes || '—' }} {{ row.anio || '' }}</td>
              <td class="px-4 py-2 whitespace-nowrap uppercase text-xs">{{ row.version || '—' }}</td>
              <td class="px-4 py-2 text-right whitespace-nowrap">{{ fmtCOP(row.valor_total) }}</td>
              <td class="px-4 py-2 whitespace-nowrap">
                <Tag :value="row.estado_procesamiento || '—'"
                     :severity="SEVERIDAD_ESTADO[row.estado_procesamiento] || 'secondary'" />
                <i v-if="row.error" class="pi pi-info-circle ml-1 text-xs" style="color:#D64455"
                   v-tooltip.top="row.error" />
              </td>
              <td class="px-4 py-2 text-center">
                <i v-if="row.total_valido" class="pi pi-check-circle" style="color:#10B981" />
                <i v-else class="pi pi-times-circle" style="color:#D64455"
                   v-tooltip.top="'El total extraído no cuadra con la suma de los conceptos'" />
              </td>
              <td class="px-4 py-2 whitespace-nowrap text-xs text-gray-500">{{ fmtFecha(row.vencimiento) }}</td>
            </tr>
            <tr v-if="loading">
              <td :colspan="COLUMNAS.length" class="px-4 py-12 text-center text-sm text-gray-400">
                <i class="pi pi-spin pi-spinner text-2xl" />
              </td>
            </tr>
            <tr v-else-if="!filtrados.length">
              <td :colspan="COLUMNAS.length" class="px-4 py-12 text-center text-sm text-gray-400">
                <i class="pi pi-file-check text-2xl mb-2 block text-gray-300" />
                No hay facturas de XM para este período.
              </td>
            </tr>
          </tbody>
        </table>
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
import Tag from 'primevue/tag'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import { useToast } from 'primevue/usetoast'
import {
  VERSIONES, VERSION_INICIAL, MAX_FACTURAS_POR_LOTE, MAX_MB_POR_FACTURA,
  listarFacturasXm, subirFacturasXm, esperarTarea,
} from '~/api/liquidacionesApi'

const toast = useToast()

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
].map((label, i) => ({ label, value: i + 1 }))

const COLUMNAS = [
  { key: 'codigo',               label: 'Código' },
  { key: 'nombre',               label: 'Nombre' },
  { key: 'agente',               label: 'Agente' },
  { key: 'periodo',              label: 'Período' },
  { key: 'version',              label: 'Versión' },
  { key: 'valor_total',          label: 'Valor total', align: 'text-right' },
  { key: 'estado_procesamiento', label: 'Estado' },
  { key: 'total_valido',         label: 'Total válido', align: 'text-center' },
  { key: 'vencimiento',          label: 'Vence' },
]

const SEVERIDAD_ESTADO = {
  completed: 'success',
  failed: 'danger',
  processing: 'warn',
  pending: 'secondary',
}

// ── Estado ───────────────────────────────────────────────────────────────────
const hoy = new Date()
// El período por defecto es el mes anterior: el ciclo de un mes se liquida
// cuando ya cerró.
const anterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
const filtros = reactive({
  month: anterior.getMonth() + 1,
  year: anterior.getFullYear(),
  version: VERSION_INICIAL,
})

const q = ref('')
const loading = ref(false)
const error = ref(null)
const facturas = ref([])
const readiness = ref(readinessVacia())

function readinessVacia() {
  return {
    lista_para_repartir: false, total: 0, completadas: 0,
    tiene_factura_generador: false, tiene_factura_comercializador: false, bloqueos: [],
  }
}

// El alistamiento solo tiene sentido dentro de un período concreto.
const hayPeriodo = computed(() => Boolean(filtros.month && filtros.year))

const filtrados = computed(() => {
  const term = q.value.trim().toLowerCase()
  if (!term) return facturas.value
  return facturas.value.filter(d =>
    [d.codigo, d.nombre, d.agente, d.version, d.estado_procesamiento]
      .filter(Boolean).some(v => String(v).toLowerCase().includes(term)),
  )
})

async function cargar() {
  loading.value = true
  error.value = null
  try {
    const data = await listarFacturasXm({
      month: filtros.month || undefined,
      year: filtros.year || undefined,
      version: filtros.version || undefined,
    })
    facturas.value = data.results || []
    readiness.value = data.readiness || readinessVacia()
  } catch (e) {
    error.value = e.response?.data?.detail || 'No se pudieron cargar las facturas de XM.'
    facturas.value = []
    readiness.value = readinessVacia()
  } finally {
    loading.value = false
  }
}

// ── Subida ───────────────────────────────────────────────────────────────────
const subidaVisible = ref(false)
const fileInput = ref(null)
const archivos = ref([])
const versionSubida = ref(VERSION_INICIAL)
const subiendo = ref(false)
const progresoSubida = ref(0)
const progresoTarea = ref('')

function abrirSubida() {
  archivos.value = []
  progresoSubida.value = 0
  progresoTarea.value = ''
  versionSubida.value = filtros.version || VERSION_INICIAL
  subidaVisible.value = true
}

function seleccionarArchivos() {
  fileInput.value?.click()
}

function onArchivosSeleccionados(e) {
  const nuevos = Array.from(e.target.files || [])
  e.target.value = ''   // permite volver a elegir el mismo archivo

  const invalido = nuevos.find(f => f.size > MAX_MB_POR_FACTURA * 1024 * 1024)
  if (invalido) {
    toast.add({
      severity: 'warn', summary: 'Archivo muy pesado',
      detail: `«${invalido.name}» supera los ${MAX_MB_POR_FACTURA} MB.`, life: 5000,
    })
    return
  }
  // La API procesa el lote de a una factura: mejor avisar antes de subir.
  if (archivos.value.length + nuevos.length > MAX_FACTURAS_POR_LOTE) {
    toast.add({
      severity: 'warn', summary: 'Lote muy grande',
      detail: `Máximo ${MAX_FACTURAS_POR_LOTE} facturas por lote.`, life: 5000,
    })
    return
  }
  const yaEstan = new Set(archivos.value.map(a => a.nombre))
  for (const f of nuevos) {
    if (!yaEstan.has(f.name)) archivos.value.push({ nombre: f.name, tamano: f.size, file: f })
  }
}

function quitarArchivo(nombre) {
  archivos.value = archivos.value.filter(a => a.nombre !== nombre)
}

async function subir() {
  subiendo.value = true
  progresoSubida.value = 0
  progresoTarea.value = ''
  try {
    const res = await subirFacturasXm(
      archivos.value.map(a => a.file),
      versionSubida.value,
      { onProgreso: (p) => { progresoSubida.value = p } },
    )
    progresoTarea.value = `Procesando ${res.files_queued} factura(s) con la IA…`

    await esperarTarea(res.task_id, {
      onEstado: (t) => { progresoTarea.value = t.mensaje || progresoTarea.value },
    })

    toast.add({
      severity: 'success', summary: 'Facturas procesadas',
      detail: `${res.files_queued} factura(s) cargadas.`, life: 4000,
    })
    subidaVisible.value = false
    archivos.value = []
    await cargar()
  } catch (e) {
    toast.add({
      severity: 'error', summary: 'No se pudieron cargar',
      detail: e.response?.data?.detail || e.message, life: 8000,
    })
  } finally {
    subiendo.value = false
    progresoTarea.value = ''
  }
}

// ── Formato ──────────────────────────────────────────────────────────────────
function fmtTamano(bytes) {
  if (!bytes && bytes !== 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fmtCOP(v) {
  if (v === null || v === undefined) return '—'
  return v.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
}

function fmtFecha(v) {
  return v ? String(v).slice(0, 10) : '—'
}

onMounted(cargar)
</script>

<style scoped>
/* MIGRACIÓN — Fase 1: en Tailwind 4 cada bloque <style> se procesa aislado y no
   ve el tema, así que `@apply` falla con "unknown utility class". `@reference`
   le da acceso al tema sin emitir CSS. Era innecesario en Tailwind 3. */
@reference 'tailwindcss';
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
