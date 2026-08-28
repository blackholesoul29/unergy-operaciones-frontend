<template>
  <div class="space-y-5 pt-3">
    <!-- ── Barra superior: navegación + upload + descarga ──────────────────── -->
    <div
      class="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-white p-3 shadow-sm"
      style="border-color: #ece7f2"
    >
      <!-- Navegación por período (solo si hay datos) -->
      <div class="flex items-center gap-3">
        <template v-if="periodos.length">
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="irAnterior"
              :disabled="periodoIndex <= 0"
              class="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <i class="pi pi-chevron-left text-xs text-gray-500" />
            </button>
            <span
              class="text-sm font-semibold"
              style="color: #2c2039; min-width: 100px; text-align: center"
            >
              {{ periodoLabel }}
            </span>
            <button
              type="button"
              @click="irSiguiente"
              :disabled="periodoIndex >= periodos.length - 1"
              class="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <i class="pi pi-chevron-right text-xs text-gray-500" />
            </button>
          </div>
          <Tag :value="periodoActual" severity="secondary" class="font-mono text-xs" />
        </template>
        <span v-else class="text-sm text-gray-400">Sin facturas procesadas</span>
      </div>

      <!-- Acciones -->
      <div class="flex items-center gap-2">
        <input
          ref="fileInputRef"
          type="file"
          accept=".pdf"
          class="hidden"
          @change="onFileSelected"
        />
        <Button
          label="Subir PDF"
          icon="pi pi-upload"
          size="small"
          :loading="procesando"
          @click="fileInputRef.click()"
          style="background: #06b6d4; border-color: #06b6d4"
        />
        <Button
          v-if="facturaActual"
          label="Descargar Excel"
          icon="pi pi-download"
          size="small"
          outlined
          :loading="descargando"
          @click="descargarExcel"
          style="border-color: #1f4e79; color: #1f4e79"
        />
      </div>
    </div>

    <!-- ── Filtros ──────────────────────────────────────────────────────────── -->
    <div
      v-if="facturaActual"
      class="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-3 shadow-sm"
      style="border-color: #ece7f2"
    >
      <div>
        <label class="field-label">Buscar</label>
        <IconField>
          <InputIcon class="pi pi-search" />
          <InputText v-model="filtroTexto" placeholder="Nombre de la minigranja…" class="w-56" />
        </IconField>
      </div>
      <div class="ml-auto pb-1.5 text-xs text-gray-400">
        {{ filasFiltradas.length }} de {{ lineas.length }}
      </div>
    </div>

    <!-- ── Estado vacío ─────────────────────────────────────────────────────── -->
    <div v-if="!periodos.length && !procesando" class="mon-tab-empty">
      <i class="pi pi-wifi" style="font-size: 2.5rem; color: #c4b8d4" />
      <p class="mt-3 text-sm font-semibold" style="color: #6b5a8a">Sin facturas procesadas</p>
      <p class="mt-1 text-xs" style="color: #a094b8; max-width: 300px; margin: 4px auto 0">
        Haz clic en <strong>Subir PDF</strong> para cargar la primera factura Starlink y comenzar a
        registrar los costos por mes.
      </p>
    </div>

    <!-- ── Spinner de carga ──────────────────────────────────────────────────── -->
    <div v-else-if="cargandoFactura" class="flex justify-center py-10">
      <i class="pi pi-spin pi-spinner" style="font-size: 1.5rem; color: #915bd8" />
    </div>

    <!-- ── Datos del período seleccionado ───────────────────────────────────── -->
    <template v-else-if="facturaActual">
      <!-- Resumen -->
      <div class="flex flex-wrap items-center gap-4">
        <div class="text-xs text-gray-500">
          <span class="font-semibold" style="color: #2c2039">{{ facturaActual.items.length }}</span>
          ítems
        </div>
        <div class="text-xs text-gray-500">
          Suma:
          <span class="font-semibold" style="color: #7c3aed">{{
            formatCOP(facturaActual.suma_items)
          }}</span>
        </div>
        <div v-if="facturaActual.cargos_totales" class="text-xs text-gray-500">
          Cargos totales PDF:
          <span class="font-semibold" style="color: #166534">{{
            formatCOP(facturaActual.cargos_totales)
          }}</span>
        </div>
        <div v-if="facturaActual.updated_at" class="text-xs text-gray-400">
          Procesado: {{ fmtFecha(facturaActual.updated_at) }}
        </div>
      </div>

      <!-- Tabla por proyecto, agrupada por tipo (igual que Arriendos) -->
      <template v-if="secciones.length">
        <div
          v-for="sec in secciones"
          :key="sec.tipo"
          class="overflow-hidden rounded-xl border bg-white shadow-sm"
          style="border-color: #ece7f2"
        >
          <button
            type="button"
            class="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors duration-150 select-none hover:bg-gray-50"
            @click="toggleSection(sec.tipo)"
          >
            <span class="h-2.5 w-2.5 flex-shrink-0 rounded-full" :style="{ background: sec.dot }" />
            <span class="flex-1 text-sm font-semibold text-gray-800">{{ sec.label }}</span>
            <span class="text-xs font-medium text-gray-400">({{ sec.items.length }})</span>
            <i
              class="pi pi-chevron-down ml-2 text-xs text-gray-400 transition-transform duration-200"
              :class="{ 'rotate-180': openSections.has(sec.tipo) }"
            />
          </button>
          <div class="section-collapse" :class="{ open: openSections.has(sec.tipo) }">
            <div class="overflow-x-auto">
              <table
                class="w-full border-collapse text-sm"
                style="min-width: 760px; table-layout: fixed"
              >
                <thead>
                  <tr class="border-t border-b border-gray-100 bg-gray-50">
                    <th
                      class="px-4 py-2.5 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase"
                    >
                      Minigranja
                    </th>
                    <th
                      class="px-4 py-2.5 text-center text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase"
                      style="width: 90px"
                    >
                      Cantidad
                    </th>
                    <th
                      class="px-4 py-2.5 text-right text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase"
                      style="width: 140px"
                    >
                      Precio unit. prom.
                    </th>
                    <th
                      class="bg-purple-50 px-4 py-2.5 text-right text-xs font-semibold tracking-wide whitespace-nowrap uppercase"
                      style="color: #7c3aed; width: 130px"
                    >
                      Sin IVA
                    </th>
                    <th
                      class="bg-purple-50 px-4 py-2.5 text-right text-xs font-semibold tracking-wide whitespace-nowrap uppercase"
                      style="color: #7c3aed; width: 120px"
                    >
                      IVA
                    </th>
                    <th
                      class="bg-purple-50 px-4 py-2.5 text-right text-xs font-semibold tracking-wide whitespace-nowrap uppercase"
                      style="color: #7c3aed; width: 140px"
                    >
                      Monto total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(fila, i) in sec.items"
                    :key="i"
                    class="border-t border-gray-100 transition-colors duration-100 hover:bg-gray-50/70"
                  >
                    <td class="px-4 py-2 font-medium" style="color: #2c2039">
                      <span v-if="fila.nombre_comercial">
                        <span
                          class="block text-[11px] leading-tight"
                          :class="fila.codigo_tsf ? 'text-gray-400' : 'text-gray-300'"
                        >
                          {{ fila.codigo_tsf || '—' }}
                        </span>
                        {{ fila.nombre_comercial }}
                      </span>
                      <div v-else-if="fila.excluido" class="flex items-center gap-1.5">
                        <Tag severity="secondary" value="No aplica" />
                        <span class="text-[11px] text-gray-400">{{ fila.descripcion }}</span>
                      </div>
                      <div v-else class="flex items-center gap-1.5">
                        <Tag severity="warn" value="Sin asignar" />
                        <button
                          type="button"
                          class="mn-asignar-btn"
                          title="Asignar minigranja"
                          @click="abrirAsignarMinigranja(fila.descripcion)"
                        >
                          <i class="pi pi-link text-xs" />
                        </button>
                      </div>
                    </td>
                    <td class="px-4 py-2 text-center text-xs text-gray-600">
                      {{ fila.cantidad_total }}
                    </td>
                    <td class="px-4 py-2 text-right font-mono text-xs text-gray-600">
                      {{ formatCOP(fila.precio_unitario_promedio) }}
                    </td>
                    <td class="bg-purple-50/30 px-4 py-2 text-right font-mono text-xs">
                      {{ formatCOP(fila.sin_iva) }}
                    </td>
                    <td class="bg-purple-50/30 px-4 py-2 text-right font-mono text-xs">
                      {{ formatCOP(fila.iva) }}
                    </td>
                    <td
                      class="bg-purple-50/30 px-4 py-2 text-right font-semibold tabular-nums"
                      style="color: #7c3aed"
                    >
                      {{ formatCOP(fila.monto_total) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Total general -->
        <div
          class="flex flex-wrap items-center justify-between gap-x-8 gap-y-2 rounded-xl border bg-white px-4 py-3 shadow-sm"
          style="border-color: #ece7f2"
        >
          <span class="text-xs font-semibold text-gray-600">Total del período</span>
          <div class="ml-auto flex items-center gap-6">
            <div class="text-right">
              <p class="text-[10px] font-medium tracking-wide text-gray-400 uppercase">
                Subtotal (Sin IVA)
              </p>
              <p class="text-sm font-semibold tabular-nums" style="color: #2c2039">
                {{ formatCOP(totalSinIVAGeneral) }}
              </p>
            </div>
            <div class="text-right">
              <p class="text-[10px] font-medium tracking-wide text-gray-400 uppercase">IVA</p>
              <p class="text-sm font-semibold tabular-nums" style="color: #2c2039">
                {{ formatCOP(totalIVAGeneral) }}
              </p>
            </div>
            <div class="text-right">
              <p class="text-[10px] font-medium tracking-wide text-gray-400 uppercase">Total</p>
              <p class="text-base font-bold tabular-nums" style="color: #06b6d4">
                {{ formatCOP(totalGeneral) }}
              </p>
            </div>
          </div>
        </div>
      </template>
      <div
        v-else
        class="rounded-xl border bg-white p-10 text-center text-sm text-gray-400 shadow-sm"
        style="border-color: #ece7f2"
      >
        {{
          filtroTexto
            ? 'No se encontraron minigranjas con ese nombre.'
            : 'Sin líneas para este período.'
        }}
      </div>
    </template>

    <!-- ── Dialog: confirmar período antes de guardar ────────────────────────── -->
    <Dialog
      v-model:visible="showGuardarDialog"
      modal
      header="Guardar factura procesada"
      :style="{ width: '420px' }"
      :closable="!guardando"
    >
      <div class="space-y-4 pt-1">
        <!-- Alerta de discrepancia si existe -->
        <div
          v-if="resultadoPendiente?.advertencia"
          class="flex items-start gap-3 rounded-xl border p-3"
          style="background: #fef3c7; border-color: #f59e0b40"
        >
          <i
            class="pi pi-exclamation-triangle mt-0.5 flex-shrink-0 text-sm"
            style="color: #d97706"
          />
          <p class="text-xs" style="color: #92400e">{{ resultadoPendiente.advertencia }}</p>
        </div>

        <!-- Selector de período -->
        <div class="flex flex-col gap-2">
          <label class="text-xs font-medium text-gray-600">
            Período de la factura
            <span class="font-normal text-gray-400"
              >(detectado automáticamente — puedes corregirlo)</span
            >
          </label>
          <input
            type="month"
            v-model="periodoParaGuardar"
            class="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-purple-200 focus:outline-none"
          />
        </div>

        <!-- Advertencia de sobreescritura -->
        <div
          v-if="periodoYaExiste"
          class="flex items-start gap-2 rounded-lg border p-2.5"
          style="background: #fef3c7; border-color: #f59e0b60"
        >
          <i
            class="pi pi-exclamation-triangle mt-0.5 flex-shrink-0 text-xs"
            style="color: #d97706"
          />
          <p class="text-xs" style="color: #92400e">
            Ya existen datos para <strong>{{ periodoLabelFrom(periodoParaGuardar) }}</strong
            >. Al confirmar se sobreescribirán.
          </p>
        </div>

        <!-- Resumen -->
        <div class="space-y-0.5 text-xs text-gray-500">
          <p>
            {{ resultadoPendiente?.items?.length }} ítems · Suma:
            <strong>{{ formatCOP(resultadoPendiente?.suma_items) }}</strong>
          </p>
          <p v-if="resultadoPendiente?.cargos_totales">
            Cargos totales PDF: <strong>{{ formatCOP(resultadoPendiente?.cargos_totales) }}</strong>
            <span :style="resultadoPendiente?.coincide ? 'color:#166534' : 'color:#dc2626'">
              {{ resultadoPendiente?.coincide ? '✓ Coincide' : '✗ No coincide' }}
            </span>
          </p>
        </div>

        <div class="flex justify-end gap-2 pt-1">
          <Button
            label="Cancelar"
            size="small"
            outlined
            severity="secondary"
            :disabled="guardando"
            @click="showGuardarDialog = false"
          />
          <Button
            label="Guardar"
            icon="pi pi-check"
            size="small"
            :loading="guardando"
            :disabled="!periodoParaGuardar"
            @click="guardarFactura"
            style="background: #915bd8; border-color: #915bd8"
          />
        </div>
      </div>
    </Dialog>

    <!-- ── Dialog: asignar minigranja a un sitio sin mapear ─────────────────── -->
    <Dialog
      v-model:visible="showAsignarDialog"
      modal
      header="Asignar minigranja"
      :style="{ width: '420px' }"
      :closable="!asignando"
    >
      <div class="space-y-4 pt-1">
        <p class="text-xs text-gray-500">
          Sitio Starlink: <strong style="color: #2c2039">{{ descripcionParaAsignar }}</strong>
        </p>

        <div class="flex flex-col gap-2">
          <label class="text-xs font-medium text-gray-600">Minigranja / proyecto</label>
          <Select
            v-model="proyectoParaAsignar"
            :options="proyectos"
            optionLabel="nombre_comercial"
            optionValue="id"
            placeholder="Selecciona un proyecto…"
            filter
            showClear
            :loading="loadingProyectos"
            class="w-full"
          />
        </div>

        <p class="text-[11px] text-gray-400">
          Si el sitio no corresponde a un proyecto nuestro (ej. tema contable, oficina), márcalo
          como "No aplica" en vez de asignarle una minigranja.
        </p>

        <div class="flex justify-end gap-2 pt-1">
          <Button
            label="No aplica"
            size="small"
            outlined
            severity="secondary"
            :disabled="asignando"
            :loading="excluyendo"
            @click="confirmarExcluirSitio"
          />
          <Button
            label="Cancelar"
            size="small"
            outlined
            severity="secondary"
            :disabled="asignando || excluyendo"
            @click="showAsignarDialog = false"
          />
          <Button
            label="Asignar"
            icon="pi pi-check"
            size="small"
            :loading="asignando"
            :disabled="!proyectoParaAsignar || excluyendo"
            @click="confirmarAsignarMinigranja"
            style="background: #915bd8; border-color: #915bd8"
          />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import { useToast } from 'primevue/usetoast'
import api from '@/api/client'

const toast = useToast()

// ── Períodos guardados ────────────────────────────────────────────────────────
const periodos = ref([]) // ['2026-05', '2026-04', ...] — desc
const periodoIndex = ref(0) // índice actual (0 = más reciente)
const facturaActual = ref(null)
const cargandoFactura = ref(false)

// ── Líneas resueltas a proyecto (minigranja), enriquecidas con cantidad/precio ──
const lineas = ref([]) // [{ descripcion, proyecto_id, nombre_comercial, tipo_proyecto, cantidad_total, precio_unitario_promedio, sin_iva, iva, monto_total }, ...]

// Agrupación por tipo de proyecto (mismo patrón que ArriendosOperaciones.vue)
const TIPO_ORDER = [
  'sin_asignar',
  'minigranja',
  'autoconsumo',
  'gd',
  'movilidad_electrica',
  'otro',
  'excluido',
]
const TIPO_LABELS_FULL = {
  sin_asignar: 'Sin asignar',
  minigranja: 'Minigranja',
  autoconsumo: 'Autoconsumo',
  gd: 'GD',
  movilidad_electrica: 'Movilidad',
  otro: 'Otro',
  excluido: 'No aplica',
}
const TIPO_DOT_FULL = {
  sin_asignar: '#F59E0B',
  minigranja: '#10B981',
  autoconsumo: '#6366F1',
  gd: '#3B82F6',
  movilidad_electrica: '#8B5CF6',
  otro: '#9CA3AF',
  excluido: '#D1D5DB',
}

// ── Filtro de búsqueda por nombre de minigranja ────────────────────────────────
const filtroTexto = ref('')
const filasFiltradas = computed(() => {
  const q = filtroTexto.value.trim().toLowerCase()
  if (!q) return lineas.value
  return lineas.value.filter((f) =>
    (f.nombre_comercial || f.descripcion || '').toLowerCase().includes(q),
  )
})

const secciones = computed(() => {
  const groups = {}
  for (const f of filasFiltradas.value) {
    const t =
      f.proyecto_id != null ? f.tipo_proyecto || 'otro' : f.excluido ? 'excluido' : 'sin_asignar'
    ;(groups[t] ||= []).push(f)
  }
  return TIPO_ORDER.filter((t) => groups[t]?.length).map((t) => ({
    tipo: t,
    label: TIPO_LABELS_FULL[t] || t,
    dot: TIPO_DOT_FULL[t] || '#9CA3AF',
    items: groups[t],
  }))
})
const openSections = ref(new Set())
function toggleSection(tipo) {
  const s = new Set(openSections.value)
  s.has(tipo) ? s.delete(tipo) : s.add(tipo)
  openSections.value = s
}
watch(
  secciones,
  (s) => {
    if (openSections.value.size === 0 && s.length)
      openSections.value = new Set(s.map((x) => x.tipo))
  },
  { immediate: true },
)

const totalGeneral = computed(() => lineas.value.reduce((s, f) => s + (f.monto_total || 0), 0))
const totalSinIVAGeneral = computed(() => lineas.value.reduce((s, f) => s + (f.sin_iva || 0), 0))
const totalIVAGeneral = computed(() => lineas.value.reduce((s, f) => s + (f.iva || 0), 0))

const periodoActual = computed(() => periodos.value[periodoIndex.value] ?? null)
const periodoLabel = computed(() => periodoLabelFrom(periodoActual.value))

function periodoLabelFrom(periodo) {
  if (!periodo) return ''
  const [yyyy, mm] = periodo.split('-')
  const MESES = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ]
  return `${MESES[parseInt(mm) - 1]} ${yyyy}`
}

function irAnterior() {
  if (periodoIndex.value > 0) periodoIndex.value--
}
function irSiguiente() {
  if (periodoIndex.value < periodos.value.length - 1) periodoIndex.value++
}

async function cargarPeriodos() {
  try {
    const { data } = await api.get('/starlink/periodos')
    periodos.value = data // ya viene ordenado desc
    periodoIndex.value = 0
  } catch {
    periodos.value = []
  }
}

async function cargarFactura(periodo) {
  if (!periodo) {
    facturaActual.value = null
    lineas.value = []
    return
  }
  cargandoFactura.value = true
  try {
    const { data } = await api.get(`/starlink/factura/${periodo}`)
    facturaActual.value = data
    const agrupadoPorDesc = {}
    ;(data?.agrupado ?? []).forEach((it) => {
      agrupadoPorDesc[it.descripcion] = it
    })
    lineas.value = (data?.lineas ?? []).map((l) => ({
      ...l,
      cantidad_total: agrupadoPorDesc[l.descripcion]?.cantidad_total ?? 0,
      precio_unitario_promedio: agrupadoPorDesc[l.descripcion]?.precio_unitario_promedio ?? 0,
    }))
  } catch {
    facturaActual.value = null
    lineas.value = []
  } finally {
    cargandoFactura.value = false
  }
}

watch(
  periodoActual,
  (p) => {
    if (p) cargarFactura(p)
  },
  { immediate: false },
)

// ── Upload PDF ────────────────────────────────────────────────────────────────
const fileInputRef = ref(null)
const procesando = ref(false)
const resultadoPendiente = ref(null)

// Dialog de guardar
const showGuardarDialog = ref(false)
const periodoParaGuardar = ref('')
const guardando = ref(false)

const periodoYaExiste = computed(
  () => !!periodoParaGuardar.value && periodos.value.includes(periodoParaGuardar.value),
)

async function onFileSelected(e) {
  const file = e.target.files?.[0]
  if (!file) return
  e.target.value = ''
  procesando.value = true
  try {
    const form = new FormData()
    form.append('file', file)
    const { data } = await api.post('/starlink/procesar-pdf', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    resultadoPendiente.value = data
    // Preseleccionar el período detectado
    periodoParaGuardar.value = data.periodo || ''
    showGuardarDialog.value = true
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Error al procesar PDF',
      detail: err.response?.data?.detail ?? err.message,
      life: 6000,
    })
  } finally {
    procesando.value = false
  }
}

async function guardarFactura() {
  if (!periodoParaGuardar.value || !resultadoPendiente.value) return
  guardando.value = true
  try {
    await api.put(`/starlink/factura/${periodoParaGuardar.value}`, {
      items: resultadoPendiente.value.items,
      agrupado: resultadoPendiente.value.agrupado,
      cargos_totales: resultadoPendiente.value.cargos_totales,
      suma_items: resultadoPendiente.value.suma_items,
    })
    toast.add({
      severity: 'success',
      summary: `Factura guardada — ${periodoLabelFrom(periodoParaGuardar.value)}`,
      life: 3000,
    })
    showGuardarDialog.value = false
    resultadoPendiente.value = null

    // Recargar lista de períodos y navegar al nuevo
    await cargarPeriodos()
    const idx = periodos.value.indexOf(periodoParaGuardar.value)
    if (idx >= 0) periodoIndex.value = idx
    await cargarFactura(periodoParaGuardar.value)
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Error al guardar',
      detail: err.response?.data?.detail ?? err.message,
      life: 4000,
    })
  } finally {
    guardando.value = false
  }
}

// ── Descargar Excel ───────────────────────────────────────────────────────────
const descargando = ref(false)

async function descargarExcel() {
  if (!facturaActual.value) return
  descargando.value = true
  try {
    const response = await api.post(
      '/starlink/excel',
      {
        items: facturaActual.value.items,
        agrupado: facturaActual.value.agrupado,
      },
      { responseType: 'blob' },
    )
    const url = URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.download = `starlink_${periodoActual.value}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch {
    toast.add({ severity: 'error', summary: 'Error al generar Excel', life: 4000 })
  } finally {
    descargando.value = false
  }
}

// ── Asignar minigranja a sitio sin mapear ──────────────────────────────────────
const proyectos = ref([])
const loadingProyectos = ref(false)

const showAsignarDialog = ref(false)
const descripcionParaAsignar = ref('')
const proyectoParaAsignar = ref(null)
const asignando = ref(false)
const excluyendo = ref(false)

function _normSitio(s) {
  return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toUpperCase().replace(/\s+/g, ' ')
}

async function cargarProyectos() {
  loadingProyectos.value = true
  try {
    const { data } = await api.get('/proyectos', { params: { size: 500 } })
    const lista = Array.isArray(data) ? data : (data.items ?? [])
    proyectos.value = [...lista].sort((a, b) =>
      a.nombre_comercial.localeCompare(b.nombre_comercial),
    )
  } catch {
    proyectos.value = []
  } finally {
    loadingProyectos.value = false
  }
}

function abrirAsignarMinigranja(descripcion) {
  descripcionParaAsignar.value = descripcion
  proyectoParaAsignar.value = null
  showAsignarDialog.value = true
}

async function confirmarAsignarMinigranja() {
  if (!proyectoParaAsignar.value || !descripcionParaAsignar.value) return
  asignando.value = true
  try {
    await api.put('/starlink/mapeo', {
      patron: _normSitio(descripcionParaAsignar.value),
      proyecto_id: proyectoParaAsignar.value,
      activo: true,
    })
    toast.add({ severity: 'success', summary: 'Minigranja asignada', life: 3000 })
    showAsignarDialog.value = false
    await cargarFactura(periodoActual.value)
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Error al asignar minigranja',
      detail: err.response?.data?.detail ?? err.message,
      life: 4000,
    })
  } finally {
    asignando.value = false
  }
}

async function confirmarExcluirSitio() {
  if (!descripcionParaAsignar.value) return
  excluyendo.value = true
  try {
    await api.put('/starlink/mapeo', {
      patron: _normSitio(descripcionParaAsignar.value),
      proyecto_id: null,
      excluido: true,
      activo: true,
    })
    toast.add({ severity: 'success', summary: 'Sitio marcado como "No aplica"', life: 3000 })
    showAsignarDialog.value = false
    await cargarFactura(periodoActual.value)
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Error al excluir el sitio',
      detail: err.response?.data?.detail ?? err.message,
      life: 4000,
    })
  } finally {
    excluyendo.value = false
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatCOP(v) {
  if (v == null) return '—'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v)
}

function fmtFecha(iso) {
  try {
    return new Date(iso).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

onMounted(async () => {
  await cargarPeriodos()
  if (periodos.value.length) await cargarFactura(periodos.value[0])
  cargarProyectos()
})
</script>

<style scoped>
.field-label {
  @apply mb-1 block text-xs font-medium text-gray-600;
}

.mon-tab-empty {
  text-align: center;
  padding: 80px 20px;
}

/* Secciones colapsables por tipo (igual que ArriendosOperaciones.vue) */
.section-collapse {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.35s ease-out;
}
.section-collapse.open {
  max-height: 20000px;
  transition: max-height 0.45s ease-in;
}

/* Botón de asignar minigranja (columna Minigranja, tabla Agrupado) */
.mn-asignar-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 1px solid #e5e2ec;
  background: #fff;
  color: #915bd8;
  cursor: pointer;
  transition: background 0.15s;
}
.mn-asignar-btn:hover {
  background: #f4f1fa;
}
</style>
