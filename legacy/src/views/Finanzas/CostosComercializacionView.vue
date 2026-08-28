<template>
  <div class="space-y-4">
    <PageHeader title="Costos comercialización" subtitle="Costos e ingresos fijos por proyecto">
      <template #actions>
        <Button
          label="Subir Excel costos"
          icon="pi pi-file-excel"
          size="small"
          outlined
          @click="abrirSubirExcel"
        />
        <Button
          label="Repartir costos de XM"
          icon="pi pi-bolt"
          size="small"
          @click="abrirAcPower"
        />
      </template>
    </PageHeader>

    <input
      ref="excelInput"
      type="file"
      accept=".xlsx,.xls"
      class="hidden"
      @change="onExcelSeleccionado"
    />

    <!-- Dialog: subir Excel -->
    <Dialog
      v-model:visible="excelVisible"
      header="Subir Excel de costos"
      modal
      class="w-full max-w-lg"
    >
      <div class="space-y-4 pt-1">
        <button type="button" class="dropzone" :disabled="subiendoExcel" @click="seleccionarExcel">
          <i class="pi pi-file-excel text-3xl" style="color: #915bd8" />
          <p class="mt-2 text-sm font-semibold text-gray-700">Seleccionar Excel</p>
          <p class="text-xs text-gray-400">.xlsx o .xls · un archivo por carga</p>
        </button>

        <div
          v-if="excel"
          class="flex items-center gap-3 rounded-lg border px-3 py-2"
          style="border-color: #ece7f2"
        >
          <i class="pi pi-file-excel shrink-0 text-sm" style="color: #9b8fb0" />
          <span class="min-w-0 flex-1 truncate text-xs font-medium text-gray-700">{{
            excel.nombre
          }}</span>
          <span class="shrink-0 text-[10px] text-gray-400">{{ fmtTamano(excel.tamano) }}</span>
        </div>

        <div
          v-if="subiendoExcel"
          class="h-1.5 overflow-hidden rounded-full"
          style="background: #f1eaf9"
        >
          <div
            class="h-full rounded-full transition-all duration-200"
            :style="{ width: progresoExcel + '%', background: '#915BD8' }"
          />
        </div>

        <p class="text-[11px] text-gray-400">
          <i class="pi pi-info-circle mr-1" />
          No se aceptan los tipos del grupo <strong>xm</strong>: esos los genera el reparto. Los
          anuales se prorratean como valor ÷ 12.
        </p>

        <div class="flex justify-end gap-2 pt-1">
          <Button
            label="Cerrar"
            severity="secondary"
            size="small"
            :disabled="subiendoExcel"
            @click="excelVisible = false"
          />
          <Button
            label="Subir"
            icon="pi pi-upload"
            size="small"
            :disabled="!excel"
            :loading="subiendoExcel"
            @click="subirExcel"
          />
        </div>
      </div>
    </Dialog>

    <!-- Dialog: repartir costos de XM -->
    <Dialog
      v-model:visible="acVisible"
      header="Repartir costos de XM"
      modal
      class="w-full max-w-md"
    >
      <div class="space-y-3 pt-1">
        <p class="text-xs text-gray-500">
          Reparte las facturas de XM entre los proyectos a prorrata del AC Power. Requiere haber
          liquidado primero y que las facturas del período estén listas.
        </p>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="field-label">Mes</label>
            <Select
              v-model="ac.month"
              :options="MESES"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
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
          <InputNumber
            v-model="ac.total_ac_power"
            :maxFractionDigits="4"
            :useGrouping="false"
            class="w-full"
            placeholder="ej: 12345.6789"
          />
          <p class="mt-1 text-[11px] text-gray-400">Es el divisor de la prorrata.</p>
        </div>

        <div
          class="flex items-start gap-2 rounded-lg px-3 py-2"
          style="background: #fff8e6; border: 1px solid #f5e3b3"
        >
          <Checkbox v-model="ac.override" inputId="ov" binary />
          <label for="ov" class="text-[11px] leading-snug" style="color: #7a5c00">
            <strong>Sobrescribir el reparto anterior.</strong>
            Debe quedar marcado la primera vez que se corre este período: sin marcar y sin un
            reparto previo, la API borra los costos de XM y no crea nada, sin avisar.
          </label>
        </div>

        <p v-if="progresoReparto" class="flex items-center gap-2 text-[11px] text-gray-500">
          <i class="pi pi-spin pi-spinner" /> {{ progresoReparto }}
        </p>

        <div class="flex justify-end gap-2 pt-1">
          <Button
            label="Cancelar"
            severity="secondary"
            size="small"
            :disabled="repartiendo"
            @click="acVisible = false"
          />
          <Button label="Repartir" size="small" :loading="repartiendo" @click="repartir" />
        </div>
      </div>
    </Dialog>

    <!-- Filtros -->
    <div
      class="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-3 shadow-sm"
      style="border-color: #ece7f2"
    >
      <div>
        <label class="field-label">Proyecto</label>
        <Select
          v-model="filtros.project"
          :options="proyectosOptions"
          optionLabel="label"
          optionValue="value"
          class="w-52"
          showClear
          filter
          placeholder="Todos"
          @change="recargar"
        />
      </div>
      <div>
        <label class="field-label">Tipo de costo</label>
        <Select
          v-model="filtros.payment_type"
          :options="tiposOptions"
          optionLabel="label"
          optionValue="value"
          class="w-56"
          showClear
          filter
          placeholder="Todos"
          @change="recargar"
        />
      </div>
      <div>
        <label class="field-label">Mes</label>
        <Select
          v-model="filtros.mes"
          :options="MESES"
          optionLabel="label"
          optionValue="value"
          class="w-32"
          showClear
          placeholder="Todos"
          @change="recargar"
        />
      </div>
      <div>
        <label class="field-label">Año</label>
        <Select
          v-model="filtros.anio"
          :options="aniosOptions"
          class="w-28"
          showClear
          placeholder="Todos"
          @change="recargar"
        />
      </div>
      <div>
        <label class="field-label">Versión</label>
        <Select
          v-model="filtros.version"
          :options="VERSIONES"
          class="w-24"
          showClear
          placeholder="Todas"
          @change="recargar"
        />
      </div>
      <div>
        <label class="field-label">Buscar en la página</label>
        <IconField>
          <InputIcon class="pi pi-search" />
          <InputText v-model="q" placeholder="Proyecto, costo…" class="w-48" />
        </IconField>
      </div>
      <div class="flex-1" />
      <Button
        label="Exportar"
        icon="pi pi-file-excel"
        size="small"
        outlined
        :loading="exportando"
        :disabled="!total"
        v-tooltip.top="'Exporta a Excel todo lo que coincide con los filtros'"
        @click="exportar"
      />
      <Button
        icon="pi pi-refresh"
        size="small"
        text
        rounded
        :loading="loading"
        v-tooltip.left="'Recargar'"
        @click="recargar"
      />
      <div class="self-center text-xs text-gray-400">
        {{ total.toLocaleString('es-CO') }} registro{{ total === 1 ? '' : 's' }}
      </div>
    </div>

    <!-- Los costos en cero se ocultan por defecto, pero nunca en silencio: en algo
         contable, una fila ausente tiene que poder distinguirse de una inexistente. -->
    <div
      v-if="ocultosEnCero"
      class="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
      style="background: #f1eaf9; color: #5b3391"
    >
      <i class="pi pi-eye-slash" />
      <span v-if="filtros.solo_con_valor">
        Hay <b>{{ ocultosEnCero.toLocaleString('es-CO') }}</b> concepto{{
          ocultosEnCero === 1 ? '' : 's'
        }}
        en cero que no se {{ ocultosEnCero === 1 ? 'está mostrando' : 'están mostrando' }}. Son
        proyectos a los que el reparto les creó la fila aunque el concepto no les aplique.
      </span>
      <span v-else>
        Se están mostrando los <b>{{ ocultosEnCero.toLocaleString('es-CO') }}</b> concepto{{
          ocultosEnCero === 1 ? '' : 's'
        }}
        en cero.
      </span>
      <button class="ml-auto font-medium whitespace-nowrap underline" @click="alternarCeros">
        {{ filtros.solo_con_valor ? 'Mostrarlos' : 'Ocultarlos' }}
      </button>
    </div>

    <div
      v-if="error"
      class="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
      style="background: #fef2f2; border: 1px solid #fecaca; color: #b42318"
    >
      <i class="pi pi-times-circle" /> {{ error }}
    </div>

    <!-- Tabla -->
    <div class="overflow-hidden rounded-xl border bg-white shadow-sm" style="border-color: #ece7f2">
      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-sm">
          <thead>
            <tr class="border-b border-gray-100 bg-gray-50">
              <th
                v-for="col in COLUMNAS"
                :key="col.key"
                class="px-4 py-2.5 text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase"
                :class="col.right ? 'text-right' : 'text-left'"
              >
                {{ col.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in filtrados"
              :key="row.id"
              class="border-t border-gray-100 transition-colors duration-100 hover:bg-gray-50/70"
            >
              <td class="px-4 py-2 whitespace-nowrap">{{ row.fecha_desde || '—' }}</td>
              <td class="px-4 py-2 whitespace-nowrap">{{ row.fecha_hasta || '—' }}</td>
              <td class="px-4 py-2">{{ row.proyecto || '—' }}</td>
              <td class="px-4 py-2 text-right font-mono text-xs">{{ fmtNum(row.valor) }}</td>
              <td class="px-4 py-2 whitespace-nowrap">
                {{ FRECUENCIAS[row.frecuencia_pago] || row.frecuencia_pago || '—' }}
              </td>
              <td class="px-4 py-2">
                {{ row.tipo_pago_nombre || row.tipo_pago || '—' }}
                <Tag
                  v-if="row.grupo"
                  :value="row.grupo"
                  class="ml-1"
                  :severity="row.grupo === 'xm' ? 'warn' : 'secondary'"
                />
              </td>
              <td class="px-4 py-2 text-xs whitespace-nowrap uppercase">
                {{ row.version || '—' }}
              </td>
            </tr>
            <tr v-if="loading">
              <td :colspan="COLUMNAS.length" class="px-4 py-12 text-center text-gray-400">
                <i class="pi pi-spin pi-spinner text-2xl" />
              </td>
            </tr>
            <tr v-else-if="!filtrados.length">
              <td :colspan="COLUMNAS.length" class="px-4 py-12 text-center text-sm text-gray-400">
                <i class="pi pi-wallet mb-2 block text-2xl text-gray-300" />
                No hay costos con esos filtros.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginación: la tabla completa pasa de 10.000 filas -->
      <div
        v-if="total > filtros.size"
        class="flex items-center justify-between border-t px-4 py-2.5"
        style="border-color: #ece7f2"
      >
        <span class="text-xs text-gray-400">
          {{ ((filtros.page - 1) * filtros.size + 1).toLocaleString('es-CO') }}–{{
            Math.min(filtros.page * filtros.size, total).toLocaleString('es-CO')
          }}
          de {{ total.toLocaleString('es-CO') }}
        </span>
        <div class="flex gap-1">
          <Button
            icon="pi pi-chevron-left"
            text
            rounded
            size="small"
            :disabled="filtros.page === 1 || loading"
            @click="irA(filtros.page - 1)"
          />
          <Button
            icon="pi pi-chevron-right"
            text
            rounded
            size="small"
            :disabled="filtros.page >= ultimaPagina || loading"
            @click="irA(filtros.page + 1)"
          />
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
  VERSIONES,
  VERSION_INICIAL,
  listarCostos,
  subirExcelCostos,
  repartirFacturasXm,
  listarCatalogos,
} from '@/api/liquidacionesApi'
import api from '@/api/client'

const toast = useToast()

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
].map((label, i) => ({ label, value: i + 1 }))

const FRECUENCIAS = { monthly: 'Mensual', yearly: 'Anual' }

const COLUMNAS = [
  { key: 'fecha_desde', label: 'Fecha desde' },
  { key: 'fecha_hasta', label: 'Fecha hasta' },
  { key: 'proyecto', label: 'Proyecto' },
  { key: 'valor', label: 'Valor', right: true },
  { key: 'frecuencia_pago', label: 'Frecuencia' },
  { key: 'tipo_pago', label: 'Costo' },
  { key: 'version', label: 'Versión' },
]

// ── Listado ──────────────────────────────────────────────────────────────────
// `xm` es el grupo de comercializacion: lo que produce el reparto de las
// facturas de XM. Intereses, opex, descuentos y ajustes no van en esta vista.
const GRUPO_COMERCIALIZACION = 'xm'
const filtros = reactive({
  project: null,
  payment_type: null,
  mes: null,
  anio: null,
  version: null,
  page: 1,
  size: 100,
  // Más de la mitad de los costos valen cero: el reparto le crea una fila de
  // cada concepto a todos los proyectos, así que uno que no es comercializador
  // arrastra igual su IVA en cero. Se ocultan, pero se dice cuántos son.
  solo_con_valor: true,
})

// Catálogos de los selects.
const proyectosOptions = ref([])
const tiposOptions = ref([])
const aniosOptions = computed(() => {
  const actual = new Date().getFullYear()
  return Array.from({ length: 6 }, (_, i) => actual - i)
})
const q = ref('')
const loading = ref(false)
const error = ref(null)
const costos = ref([])
const total = ref(0)
const ocultosEnCero = ref(0)

const ultimaPagina = computed(() => Math.max(1, Math.ceil(total.value / filtros.size)))

const filtrados = computed(() => {
  const term = q.value.trim().toLowerCase()
  if (!term) return costos.value
  return costos.value.filter((d) =>
    [d.proyecto, d.tipo_pago, d.tipo_pago_nombre, d.frecuencia_pago, d.version]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(term)),
  )
})

async function cargar() {
  loading.value = true
  error.value = null
  try {
    const data = await listarCostos({
      grupo: GRUPO_COMERCIALIZACION,
      project: filtros.project || undefined,
      payment_type: filtros.payment_type || undefined,
      mes: filtros.mes || undefined,
      anio: filtros.anio || undefined,
      version: filtros.version || undefined,
      solo_con_valor: filtros.solo_con_valor,
      page: filtros.page,
      size: filtros.size,
    })
    costos.value = data.results || []
    total.value = data.total || 0
    ocultosEnCero.value = data.ocultos_en_cero || 0
  } catch (e) {
    error.value = e.response?.data?.detail || 'No se pudieron cargar los costos.'
    costos.value = []
    total.value = 0
    ocultosEnCero.value = 0
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

function alternarCeros() {
  filtros.solo_con_valor = !filtros.solo_con_valor
  recargar()
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
    await subirExcelCostos(excel.value.file, {
      onProgreso: (p) => {
        progresoExcel.value = p
      },
    })
    toast.add({ severity: 'success', summary: 'Excel cargado', life: 4000 })
    excelVisible.value = false
    excel.value = null
    await cargar()
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'No se pudo cargar',
      detail: e.response?.data?.detail || e.message,
      life: 8000,
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
  month: null,
  year: null,
  version: VERSION_INICIAL,
  total_ac_power: null,
  override: true,
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
      severity: 'warn',
      summary: 'Faltan campos',
      detail: 'Completa mes, año, versión y AC Power total.',
      life: 4000,
    })
    return
  }

  repartiendo.value = true
  progresoReparto.value = ''
  try {
    const res = await repartirFacturasXm(
      { ...ac },
      {
        onEstado: (t) => {
          progresoReparto.value = t.mensaje
        },
      },
    )
    toast.add({
      severity: 'success',
      summary: 'Costos repartidos',
      detail: res.message || 'Terminó correctamente.',
      life: 6000,
    })
    acVisible.value = false
    recargar()
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'El reparto falló',
      detail: e.response?.data?.detail || e.message,
      life: 10000,
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

// ── Catálogos de los filtros ─────────────────────────────────────────────────
async function cargarOpciones() {
  try {
    const [{ data: proyectos }, catalogos] = await Promise.all([
      api.get('/liquidaciones-api/proyectos'),
      listarCatalogos(),
    ])
    // La API identifica por tópico, pero se muestra el nombre de esta base.
    proyectosOptions.value = (proyectos || [])
      .filter((p) => p.nombre_topico)
      .map((p) => ({ value: p.nombre_topico, label: p.nombre_comercial }))
      .sort((a, b) => a.label.localeCompare(b.label))
    tiposOptions.value = (catalogos.tipos_costo || [])
      .filter((t) => t.group === GRUPO_COMERCIALIZACION)
      .map((t) => ({ value: t.name, label: t.long_name || t.name }))
      .sort((a, b) => a.label.localeCompare(b.label))
  } catch {
    // Sin catálogos los filtros quedan vacíos, pero la tabla sigue sirviendo.
  }
}

// ── Exportar ─────────────────────────────────────────────────────────────────
const exportando = ref(false)

async function exportar() {
  exportando.value = true
  try {
    // Se piden todas las filas que cumplen el filtro, no solo la página visible.
    const data = await listarCostos({
      grupo: GRUPO_COMERCIALIZACION,
      project: filtros.project || undefined,
      payment_type: filtros.payment_type || undefined,
      mes: filtros.mes || undefined,
      anio: filtros.anio || undefined,
      version: filtros.version || undefined,
      // Se exporta lo mismo que se está viendo: si los ceros están ocultos en
      // pantalla, aparecer en el archivo sería una sorpresa desagradable.
      solo_con_valor: filtros.solo_con_valor,
      page: 1,
      size: 5000,
    })
    const filas = data.results || []
    if (!filas.length) {
      toast.add({ severity: 'warn', summary: 'Nada que exportar', life: 3000 })
      return
    }

    const XLSX = await import('xlsx-js-style')
    const C = { morado: '915BD8', oscuro: '2C2039', blanco: 'FFFFFF', borde: 'ECE4F5' }
    const encabezados = [
      'Fecha desde',
      'Fecha hasta',
      'Proyecto',
      'Valor',
      'Frecuencia',
      'Costo',
      'Versión',
    ]
    const cuerpo = filas.map((f) => [
      f.fecha_desde || '',
      f.fecha_hasta || '',
      f.proyecto || '',
      f.valor ?? null,
      FRECUENCIAS[f.frecuencia_pago] || f.frecuencia_pago || '',
      f.tipo_pago_nombre || f.tipo_pago || '',
      f.version || '',
    ])
    const ws = XLSX.utils.aoa_to_sheet([encabezados, ...cuerpo])

    const bf = { style: 'thin', color: { rgb: C.borde } }
    const borde = { top: bf, bottom: bf, left: bf, right: bf }
    for (let c = 0; c < encabezados.length; c++) {
      const ref = XLSX.utils.encode_cell({ r: 0, c })
      ws[ref].s = {
        font: { bold: true, sz: 10, color: { rgb: C.blanco } },
        fill: { fgColor: { rgb: C.morado } },
        border: borde,
      }
    }
    for (let r = 1; r <= cuerpo.length; r++) {
      for (let c = 0; c < encabezados.length; c++) {
        const ref = XLSX.utils.encode_cell({ r, c })
        if (!ws[ref]) continue
        ws[ref].s = { border: borde, font: { color: { rgb: C.oscuro } } }
        if (c === 3) {
          ws[ref].s.numFmt = '"$"#,##0.00'
          ws[ref].s.alignment = { horizontal: 'right' }
        }
      }
    }
    ws['!cols'] = [
      { wch: 12 },
      { wch: 12 },
      { wch: 30 },
      { wch: 16 },
      { wch: 12 },
      { wch: 42 },
      { wch: 9 },
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Costos comercializacion')
    const periodo =
      [filtros.anio, filtros.mes ? String(filtros.mes).padStart(2, '0') : null]
        .filter(Boolean)
        .join('-') || 'todos'
    XLSX.writeFile(wb, `Costos_comercializacion_${periodo}.xlsx`)

    if (data.total > filas.length) {
      toast.add({
        severity: 'warn',
        summary: 'Exportación parcial',
        detail: `Se exportaron ${filas.length} de ${data.total}. Filtra por período para bajar el resto.`,
        life: 6000,
      })
    }
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo exportar', detail: e.message, life: 4000 })
  } finally {
    exportando.value = false
  }
}

onMounted(() => {
  cargar()
  cargarOpciones()
})
</script>

<style scoped>
.field-label {
  @apply mb-1 block text-xs font-medium text-gray-600;
}

.dropzone {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 22px 16px;
  border: 2px dashed #d9ccee;
  border-radius: 12px;
  background: #fbf7ff;
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s;
}
.dropzone:hover {
  border-color: #915bd8;
  background: #f4ecfc;
}
.dropzone:disabled {
  opacity: 0.6;
  cursor: default;
}
</style>
