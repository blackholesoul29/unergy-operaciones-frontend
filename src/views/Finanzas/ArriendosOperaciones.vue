<template>
  <div class="space-y-4 pt-3">

    <!-- ── Barra superior ────────────────────────────────────────────────── -->
    <div class="bg-white rounded-xl shadow-sm p-3 flex items-center justify-between flex-wrap gap-2 border" style="border-color:#ECE7F2">
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2">
          <button type="button" @click="cambiarMes(-1)"
            class="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50">
            <i class="pi pi-chevron-left text-xs text-gray-500" />
          </button>
          <span class="text-sm font-semibold" style="color:#2C2039; min-width:100px; text-align:center">
            {{ periodoLabel }}
          </span>
          <button type="button" @click="cambiarMes(1)"
            class="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50">
            <i class="pi pi-chevron-right text-xs text-gray-500" />
          </button>
        </div>
        <Tag :value="periodoActual" severity="secondary" class="text-xs font-mono" />
      </div>

      <div class="flex items-center gap-2">
        <div class="relative">
          <Button label="Columnas" icon="pi pi-table" size="small" outlined severity="secondary"
            @click="showColMenu = !showColMenu" />
          <div v-if="showColMenu"
            class="absolute right-0 top-8 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-3 space-y-1"
            style="min-width:240px">
            <p class="text-xs font-semibold text-gray-500 mb-2">Mostrar columnas</p>
            <label v-for="col in columnasOpcionales" :key="col.key"
              class="flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded">
              <input type="checkbox" v-model="colsVisibles[col.key]" class="accent-purple-600" />
              {{ col.label }}
            </label>
          </div>
        </div>
        <Button label="IPC" icon="pi pi-chart-line" size="small" outlined
          @click="showIPCDialog = true"
          style="border-color:#915BD8;color:#915BD8" />
        <ArriendosZipUpload
          :proyectos="filasParaZip"
          :periodo="periodoActual"
          :periodo-label="periodoLabel"
          @docs-actualizados="() => loadDocs(periodoActual.value)" />
        <Button label="Guardar selección" icon="pi pi-save" size="small"
          :loading="guardando"
          style="background:#915BD8;border-color:#915BD8"
          @click="guardarSeleccion" />
      </div>
    </div>

    <!-- ── Tabla ──────────────────────────────────────────────────────────── -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden border" style="border-color:#ECE7F2">
      <div class="overflow-x-auto">
        <table class="w-full text-sm border-collapse" style="min-width:980px; table-layout:fixed">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100">
              <th class="px-3 py-2.5 text-left" style="width:40px">
                <input type="checkbox" :checked="todosMarcados" @change="toggleTodos"
                  class="accent-purple-600" />
              </th>
              <th class="px-3 py-2.5 text-left text-xs font-semibold text-gray-500" style="width:220px">Proyecto</th>
              <th class="px-3 py-2.5 text-left text-xs font-semibold text-gray-500" style="width:120px">Estado contrato</th>
              <th class="px-3 py-2.5 text-left text-xs font-semibold text-gray-500" style="width:130px">Periodo a facturar</th>
              <th v-if="colsVisibles.n_indexaciones"
                class="px-3 py-2.5 text-right text-xs font-semibold text-gray-500" style="width:70px">N° IPC</th>
              <th class="px-3 py-2.5 text-right text-xs font-semibold text-gray-500" style="width:130px">Valor Base</th>
              <th v-if="colsVisibles.factor_acumulado"
                class="px-3 py-2.5 text-right text-xs font-semibold text-gray-500" style="width:100px">Factor Acum.</th>
              <th v-if="colsVisibles.valor_anual_indexado"
                class="px-3 py-2.5 text-right text-xs font-semibold text-gray-500" style="width:150px">Val. Anual Indexado</th>
              <th class="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 bg-purple-50" style="width:160px">
                Canon Arrendamiento
              </th>
              <th v-if="colsVisibles.historial"
                class="px-3 py-2.5 text-left text-xs font-semibold text-gray-500" style="width:240px">Historial IPC</th>
              <th class="px-3 py-2.5 text-center text-xs font-semibold text-gray-500" style="width:100px">Documento</th>
              <th class="px-3 py-2.5 text-center text-xs font-semibold text-gray-500" style="width:90px">Facturado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="fila in filas" :key="fila.id"
              class="border-t border-gray-100 hover:bg-gray-50/70 transition-colors duration-100 group"
              :class="!esFacturable(fila) ? 'opacity-40' : ''">
              <!-- Checkbox — solo facturable (con contrato + aplica este mes) -->
              <td class="px-3 py-2 text-center">
                <input type="checkbox" :disabled="!esFacturable(fila)"
                  v-model="seleccion[fila.id]" class="accent-purple-600" />
              </td>
              <!-- Proyecto -->
              <td class="px-3 py-2 font-medium" style="color:#2C2039; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" :title="fila.proyecto">
                <span class="inline-flex items-center gap-1.5 max-w-full">
                  <span class="truncate">{{ fila.proyecto }}</span>
                  <span v-if="!fila.aplica_este_mes && conContrato(fila)"
                    class="inline-flex items-center gap-1 text-[10px] font-normal px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style="background:#e5e7eb; color:#4b5563"
                    title="Según su periodicidad, a este arriendo no le corresponde cobro este mes.">
                    <i class="pi pi-clock text-[9px]" />no aplica este mes
                  </span>
                  <span v-if="fila.motivo_exclusion"
                    class="inline-flex items-center gap-1 text-[10px] font-normal px-1.5 py-0.5 rounded-full cursor-help flex-shrink-0"
                    style="background:#fee2e2; color:#991b1b"
                    :title="'Excluido este mes — motivo: ' + fila.motivo_exclusion">
                    <i class="pi pi-comment text-[9px]" />excluido
                  </span>
                </span>
              </td>
              <!-- Estado contrato -->
              <td class="px-3 py-2 whitespace-nowrap">
                <span class="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full"
                  :style="{ background: estadoContratoMeta(fila).bg, color: estadoContratoMeta(fila).fg }">
                  {{ estadoContratoMeta(fila).label }}
                </span>
              </td>
              <td class="px-3 py-2 text-xs text-gray-600 whitespace-nowrap">{{ periodoLabel }}</td>
              <td v-if="colsVisibles.n_indexaciones" class="px-3 py-2 text-right text-xs text-gray-500">
                {{ fila.n_indexaciones ?? '—' }}
              </td>
              <td class="px-3 py-2 text-right font-mono text-xs text-gray-600">
                {{ fila.valor_base != null ? formatCOP(fila.valor_base) : '—' }}
              </td>
              <td v-if="colsVisibles.factor_acumulado" class="px-3 py-2 text-right font-mono text-xs">
                {{ fila.factor_acumulado != null ? fila.factor_acumulado.toFixed(6) : '—' }}
              </td>
              <td v-if="colsVisibles.valor_anual_indexado" class="px-3 py-2 text-right font-mono text-xs">
                {{ fila.valor_anual_indexado != null ? formatCOP(fila.valor_anual_indexado) : '—' }}
              </td>
              <!-- Canon — muestra valor del archivo; ícono si difiere del calculado -->
              <td class="px-3 py-2 text-right tabular-nums bg-purple-50/30"
                :style="seleccion[fila.id] ? 'color:#7c3aed' : 'color:#9ca3af'">
                <span class="inline-flex items-center justify-end gap-1">
                  <span v-if="fila.canon_archivo != null" class="font-semibold">
                    {{ formatCOP(fila.canon_archivo) }}
                  </span>
                  <span v-else-if="fila.canon_calculado != null" class="font-semibold">
                    {{ formatCOP(fila.canon_calculado) }}
                  </span>
                  <span v-else class="text-gray-300">—</span>
                  <i v-if="fila.canon_calculado != null"
                    class="pi pi-info-circle flex-shrink-0 cursor-help opacity-0 group-hover:opacity-100 transition-opacity"
                    style="font-size:11px;color:#915BD8"
                    title="Ver cálculo"
                    @mouseenter="mostrarCanon($event, fila)"
                    @mouseleave="ocultarCanon()" />
                </span>
              </td>
              <td v-if="colsVisibles.historial" class="px-3 py-2 text-xs text-gray-400"
                style="white-space:nowrap;max-width:320px;overflow:hidden;text-overflow:ellipsis"
                :title="fila.historial_detalle">
                {{ fila.historial_texto || '—' }}
              </td>
              <!-- Documento adjunto -->
              <td class="px-3 py-2 text-center">
                <div class="inline-flex items-center gap-0.5 flex-wrap justify-center">
                  <template v-if="docsPorProyecto[fila.id]?.length">
                    <DocumentoIcon
                      v-for="doc in docsPorProyecto[fila.id]"
                      :key="doc.id"
                      :doc="doc"
                      :tooltip="tooltipDoc(doc)"
                      @click="downloadDoc(doc.id, doc.nombre_archivo)" />
                  </template>
                  <DocumentoIcon v-else :doc="null" />
                </div>
              </td>
              <td class="px-3 py-2 text-center">
                <button type="button" @click="toggleFacturado(fila.id)">
                  <span v-if="facturadoActual[fila.id]"
                    class="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-medium"
                    style="background:#dcfce7;color:#166534">
                    <i class="pi pi-check text-[10px]"/>Sí
                  </span>
                  <span v-else class="text-xs text-gray-300">—</span>
                </button>
              </td>
            </tr>
            <!-- Fila total -->
            <tr v-if="filas.length" class="bg-gray-50 border-t-2 border-gray-200">
              <td colspan="4" class="px-3 py-2.5 text-xs font-semibold text-gray-600">
                Total ({{ filasSeleccionadas }} proyectos seleccionados)
              </td>
              <td v-if="colsVisibles.n_indexaciones"></td>
              <td></td>
              <td v-if="colsVisibles.factor_acumulado"></td>
              <td v-if="colsVisibles.valor_anual_indexado"></td>
              <td class="px-3 py-2.5 text-right font-bold tabular-nums" style="color:#7c3aed">
                {{ formatCOP(totalSeleccionado) }}
              </td>
              <td v-if="colsVisibles.historial"></td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── Notificación IPC pendiente ─────────────────────────────────────── -->
    <div v-if="proyectosSinIPC.length"
      class="rounded-xl border p-3 flex items-start gap-3"
      style="background:#fef3c7;border-color:#f59e0b40">
      <i class="pi pi-exclamation-triangle text-sm flex-shrink-0 mt-0.5" style="color:#d97706"/>
      <div class="flex-1 text-xs" style="color:#92400e">
        <p class="font-semibold mb-1">IPC pendiente para próximos períodos</p>
        <p>{{ proyectosSinIPC.join(', ') }} — agrégalo en el diálogo IPC.</p>
      </div>
    </div>

    <!-- ── Diálogo: motivo de exclusión ─────────────────────────────────── -->
    <Dialog v-model:visible="showExclusionDialog" modal header="Motivo de exclusión" :style="{ width: '30rem' }">
      <p class="text-sm text-gray-600 mb-3">
        Estos arriendos son facturables este mes pero los desmarcaste. Indica el motivo de cada exclusión (queda registrado):
      </p>
      <div v-for="e in exclusionPendientes" :key="e.id" class="mb-3">
        <label class="text-xs font-semibold text-gray-700">{{ e.nombre }}</label>
        <textarea v-model="e.motivo" rows="2"
          class="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 mt-1"
          placeholder="Motivo de la exclusión…"></textarea>
      </div>
      <template #footer>
        <button type="button" class="text-xs px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
          @click="showExclusionDialog = false">Cancelar</button>
        <button type="button" :disabled="!exclusionValida"
          class="text-xs font-semibold px-3 py-1.5 rounded-lg"
          style="background:#915BD8;color:#fff;border:none"
          :style="!exclusionValida ? 'opacity:0.4;cursor:not-allowed' : 'cursor:pointer'"
          @click="confirmarExclusiones">Guardar</button>
      </template>
    </Dialog>

    <!-- ── Dialog IPC ─────────────────────────────────────────────────────── -->
    <Dialog v-model:visible="showIPCDialog" modal header="Tasas IPC — Arriendos" :style="{ width: '460px' }">
      <div class="space-y-3 pt-1">
        <p class="text-xs text-gray-500">
          El IPC de diciembre del año N (columna "Año dic") se aplica en el
          <b>aniversario del contrato</b> del año N+1, no cada 1 de enero.
        </p>
        <DataTable :value="ipcTasas" class="text-sm" stripedRows>
          <Column field="año" header="Año dic" style="width:80px" />
          <Column header="Tasa (%)">
            <template #body="{ data }">{{ (data.tasa * 100).toFixed(2) }}%</template>
          </Column>
          <Column header="Estado">
            <template #body="{ data }">
              <Tag :value="data.confirmado ? 'Confirmado' : 'Pendiente'"
                :severity="data.confirmado ? 'success' : 'warn'" />
            </template>
          </Column>
          <Column header="Fuente">
            <template #body="{ data }">{{ data.fuente || '—' }}</template>
          </Column>
        </DataTable>
        <div class="border-t pt-3 space-y-2">
          <p class="text-xs font-semibold text-gray-600">Agregar / actualizar tasa</p>
          <div class="grid grid-cols-3 gap-2">
            <div class="flex flex-col gap-1">
              <label class="text-xs text-gray-500">Año (dic)</label>
              <InputNumber v-model="ipcForm.año" :useGrouping="false" class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs text-gray-500">Tasa (%)</label>
              <InputNumber v-model="ipcForm.tasaPct" :minFractionDigits="2" :maxFractionDigits="4"
                suffix="%" locale="en-US" class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs text-gray-500">Fuente</label>
              <InputText v-model="ipcForm.fuente" class="w-full" placeholder="DANE" />
            </div>
          </div>
          <Button label="Guardar tasa" icon="pi pi-check" size="small"
            @click="guardarIPC"
            style="background:#915BD8;border-color:#915BD8" />
        </div>
      </div>
    </Dialog>

    <!-- ── Popover desglose del canon (hover sobre ⚠️) ───────────────────────── -->
    <CalculoIpcPopover
      ref="canonPopover"
      :valor-base-anual="filaCanon && filaCanon.valor_base != null ? filaCanon.valor_base * 12 : null"
      :factor="filaCanon ? filaCanon.factor_acumulado : null"
      :valor-a-facturar="filaCanon ? filaCanon.canon_a_facturar : null" />

  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch } from 'vue'
import Button      from 'primevue/button'
import Tag         from 'primevue/tag'
import Dialog      from 'primevue/dialog'
import DataTable   from 'primevue/datatable'
import Column      from 'primevue/column'
import InputNumber from 'primevue/inputnumber'
import InputText   from 'primevue/inputtext'
import { useToast } from 'primevue/usetoast'
import api          from '@/api/client'
import ArriendosZipUpload from './ArriendosZipUpload.vue'
import CalculoIpcPopover from '@/components/CalculoIpcPopover.vue'
import { docsPorProyecto, loadDocs, downloadDoc } from '@/composables/useArriendosDocs'
import DocumentoIcon from '@/components/DocumentoIcon.vue'

const toast = useToast()

// ── Tooltip de cálculo del canon (mismo diseño que Mantenimiento) ──────────────
const canonPopover = ref(null)
const filaCanon    = ref(null)
function mostrarCanon(ev, fila) {
  filaCanon.value = fila
  canonPopover.value?.show(ev)
}
function ocultarCanon() {
  canonPopover.value?.hide()
}

// ── Período ────────────────────────────────────────────────────────────────────
const hoy           = new Date()
const periodoOffset = ref(0)

const periodoActual = computed(() => {
  const d    = new Date(hoy.getFullYear(), hoy.getMonth() + periodoOffset.value, 1)
  const yyyy = d.getFullYear()
  const mm   = String(d.getMonth() + 1).padStart(2, '0')
  return `${yyyy}-${mm}`
})

const periodoLabel = computed(() => {
  const [yyyy, mm] = periodoActual.value.split('-')
  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  return `${MESES[parseInt(mm) - 1]} ${yyyy}`
})

function cambiarMes(delta) { periodoOffset.value += delta }

// ── Columnas opcionales ────────────────────────────────────────────────────────
const columnasOpcionales = [
  { key: 'n_indexaciones',      label: 'N° de Indexaciones' },
  { key: 'factor_acumulado',    label: 'Factor Acumulado' },
  { key: 'valor_anual_indexado',label: 'Valor Anual Indexado' },
  { key: 'historial',           label: 'Historial de Indexaciones' },
]
const colsVisibles = reactive({
  n_indexaciones:       false,
  factor_acumulado:     false,
  valor_anual_indexado: false,
  historial:            false,
})
const showColMenu = ref(false)

function formatCOP(v) {
  if (v == null) return '—'
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v)
}

// ── Tasas IPC ──────────────────────────────────────────────────────────────────
const showIPCDialog = ref(false)
const ipcForm       = reactive({ año: new Date().getFullYear() - 1, tasaPct: null, fuente: 'DANE' })

async function guardarIPC() {
  if (!ipcForm.año || ipcForm.tasaPct == null) return
  try {
    await api.put(`/arriendos/ipc/${ipcForm.año}`, {
      tasa: ipcForm.tasaPct / 100,
      confirmado: true,
      fuente: ipcForm.fuente || 'DANE',
    })
    toast.add({ severity: 'success', summary: 'Tasa IPC guardada', life: 2500 })
    await cargarDatos()
  } catch {
    toast.add({ severity: 'error', summary: 'Error al guardar IPC', life: 3000 })
  }
}

// ── Estado (API) ─────────────────────────────────────────────────────────────
const loading   = ref(false)
const guardando = ref(false)
const filas     = ref([])
const seleccion = reactive({})   // { [id]: bool }
const ipcTasas  = ref([])

async function cargarDatos() {
  loading.value = true
  try {
    const [calc, ipc] = await Promise.all([
      api.get(`/arriendos/calculo/${periodoActual.value}`),
      api.get('/arriendos/ipc'),
    ])
    filas.value = calc.data.filas
    ipcTasas.value = ipc.data
    filas.value.forEach(f => { seleccion[f.id] = f.incluido && f.habilitado })
  } catch {
    toast.add({ severity: 'error', summary: 'Error al cargar arriendos', life: 3000 })
  } finally {
    loading.value = false
  }
}

const facturadoActual = computed(() => {
  const m = {}; filas.value.forEach(f => { m[f.id] = f.facturado }); return m
})
// Facturable = con contrato vigente, habilitado y que aplique este mes por periodicidad.
const conContrato  = (f) => (f.estado_contrato || 'con_contrato') === 'con_contrato'
const esFacturable = (f) => f.habilitado && f.aplica_este_mes && conContrato(f)

const ESTADO_CONTRATO_META = {
  con_contrato: { label: 'Con contrato', bg: '#dcfce7', fg: '#166534' },
  en_tramite:   { label: 'En trámite',   bg: '#fef3c7', fg: '#92400e' },
  sin_contrato: { label: 'Sin contrato', bg: '#e5e7eb', fg: '#4b5563' },
}
const estadoContratoMeta = (f) => ESTADO_CONTRATO_META[f.estado_contrato] || ESTADO_CONTRATO_META.con_contrato

const filasHabilitadas   = computed(() => filas.value.filter(esFacturable))
const todosMarcados      = computed(() =>
  filasHabilitadas.value.length > 0 && filasHabilitadas.value.every(f => seleccion[f.id]))
const filasSeleccionadas = computed(() => filasHabilitadas.value.filter(f => seleccion[f.id]).length)
const totalSeleccionado  = computed(() =>
  filas.value.filter(f => esFacturable(f) && seleccion[f.id]).reduce((s, f) => s + (f.canon_a_facturar || 0), 0))

// IPC faltante no lo expone el backend → notificación deshabilitada
// Proyectos con indexación incompleta por falta de tasa IPC de algún año.
const proyectosSinIPC = computed(() =>
  filas.value.filter(f => f.ipc_incompleto).map(f => f.proyecto)
)

function toggleTodos(e) {
  filasHabilitadas.value.forEach(f => { seleccion[f.id] = e.target.checked })
}

// Exclusión con observación obligatoria (paridad con Mantenimiento)
const showExclusionDialog = ref(false)
const exclusionPendientes = ref([])   // [{id, nombre, motivo}]
const exclusionValida = computed(() =>
  exclusionPendientes.value.every(e => e.motivo.trim().length > 0)
)

async function guardarSeleccion() {
  // Proyectos facturables que quedaron desmarcados → exigir motivo antes de guardar.
  const excluidos = filas.value.filter(f => esFacturable(f) && !seleccion[f.id])
  if (excluidos.length) {
    exclusionPendientes.value = excluidos.map(f => ({ id: f.id, nombre: f.proyecto, motivo: '' }))
    showExclusionDialog.value = true
    return
  }
  await _ejecutarGuardado({})
}

function confirmarExclusiones() {
  const motivos = {}
  exclusionPendientes.value.forEach(e => { motivos[e.id] = e.motivo.trim() })
  showExclusionDialog.value = false
  _ejecutarGuardado(motivos)
}

async function _ejecutarGuardado(motivos) {
  guardando.value = true
  try {
    const items = filas.value.map(f => ({
      proyecto_id: f.id,
      incluido: !!(seleccion[f.id] && esFacturable(f)),
      motivo_exclusion: motivos[f.id] || null,
    }))
    await api.post(`/arriendos/seleccion/${periodoActual.value}`, { items })
    toast.add({ severity: 'success', summary: 'Selección guardada', life: 2500 })
    await cargarDatos()
  } catch {
    toast.add({ severity: 'error', summary: 'Error al guardar', life: 3000 })
  } finally {
    guardando.value = false
  }
}

async function toggleFacturado(id) {
  try {
    await api.patch(`/arriendos/seleccion/${periodoActual.value}/${id}/facturado`)
    await cargarDatos()
  } catch {
    toast.add({ severity: 'error', summary: 'Error al marcar facturado', life: 3000 })
  }
}

// ── Tooltip del ícono de documento: nombre de archivo + pago_id ────────────────
function tooltipDoc(doc) {
  const base = doc.nombre_archivo || doc.numero_cuenta_cobro || 'documento'
  return doc.pago_id ? `${base} · pago ${doc.pago_id}` : base
}

// ── Proyectos para el componente ZipUpload ─────────────────────────────────────
const filasParaZip = computed(() =>
  filas.value.map(f => ({ id: f.id, proyecto: f.proyecto, codigo: f.codigo }))
)

watch(periodoActual, (p) => { loadDocs(p); cargarDatos() })
onMounted(() => { loadDocs(periodoActual.value); cargarDatos() })
</script>
