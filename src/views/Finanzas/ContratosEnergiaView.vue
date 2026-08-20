<template>
  <div class="space-y-4">
    <PageHeader title="Contratos de energía"
                subtitle="Contratos de energía y sus proyectos vinculados">
      <template #actions>
        <Button label="Crear nuevo contrato de energía" icon="pi pi-plus" size="small"
                @click="abrirFormulario" />
      </template>
    </PageHeader>

    <!-- Filtros -->
    <div class="bg-white rounded-xl shadow-sm p-3 flex flex-wrap gap-3 items-end border" style="border-color:#ECE7F2">
      <div>
        <label class="field-label">Buscar</label>
        <IconField>
          <InputIcon class="pi pi-search" />
          <InputText v-model="q" placeholder="Comercializador, proyecto, código…" class="w-72" />
        </IconField>
      </div>
      <div>
        <label class="field-label">Tipo de contrato</label>
        <Select v-model="tipoSel" :options="TIPOS_CONTRATO" optionLabel="label" optionValue="value"
                class="w-56" showClear placeholder="Todos" />
      </div>
      <div class="flex-1" />
      <Button icon="pi pi-refresh" size="small" text rounded :loading="loading"
              v-tooltip.left="'Recargar'" @click="cargar" />
      <div class="text-xs text-gray-400 self-center">
        {{ filtrados.length }} contrato{{ filtrados.length === 1 ? '' : 's' }}
      </div>
    </div>

    <!-- Un PLC sin piso y techo hace fallar la liquidación -->
    <div v-if="!loading && plcIncompletos.length" class="rounded-lg px-3 py-2 text-xs"
         style="background:#FFF8E6; border:1px solid #F5E3B3; color:#7A5C00">
      <i class="pi pi-exclamation-triangle mr-1" />
      {{ plcIncompletos.length }} contrato{{ plcIncompletos.length === 1 ? '' : 's' }} PLC
      sin piso o sin techo cargado. La liquidación falla sin los dos:
      <span class="font-mono">{{ plcIncompletos.map(c => c.codigo || c.id).join(', ') }}</span>
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
                  :class="col.center ? 'text-center' : 'text-left'">
                {{ col.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filtrados" :key="row.id"
                class="border-t border-gray-100 hover:bg-gray-50/70 transition-colors duration-100">
              <td class="px-4 py-2 whitespace-nowrap">{{ fmtFecha(row.fecha_desde) }}</td>
              <td class="px-4 py-2 whitespace-nowrap">{{ fmtFecha(row.fecha_hasta) }}</td>
              <td class="px-4 py-2 font-mono text-xs text-gray-500">{{ row.codigo || '—' }}</td>
              <td class="px-4 py-2">{{ row.empresa || '—' }}</td>
              <td class="px-4 py-2">
                <span v-if="!row.proyectos.length" class="text-gray-400">—</span>
                <span v-for="p in row.proyectos" :key="p.id" class="inline-flex items-center gap-1 mr-2">
                  {{ nombreProyecto(p.proyecto) }}
                  <!-- Solo los PLC necesitan piso y techo -->
                  <i v-if="row.tipo_contrato === 'ppa_pay_as_contracted' && !(p.tiene_piso && p.tiene_techo)"
                     class="pi pi-exclamation-triangle text-xs" style="color:#D97706"
                     v-tooltip.top="'Falta ' + faltantes(p)" />
                </span>
              </td>
              <td class="px-4 py-2 whitespace-nowrap">{{ LABEL_TIPO_CONTRATO[row.tipo_contrato] || row.tipo_contrato || '—' }}</td>
              <td class="px-4 py-2 whitespace-nowrap">{{ LABEL_TIPO_TARIFA[row.tipo_tarifa] || row.tipo_tarifa || '—' }}</td>
              <td class="px-4 py-2 text-right font-mono text-xs">{{ row.porcentaje ?? '—' }}</td>
              <td class="px-4 py-2 text-center">
                <i v-if="row.proyectos.some(p => p.precio_energia_id)" class="pi pi-check-circle" style="color:#10B981" />
                <i v-else class="pi pi-times-circle" style="color:#D64455" />
              </td>
            </tr>
            <tr v-if="loading">
              <td :colspan="COLUMNAS.length" class="px-4 py-12 text-center text-gray-400">
                <i class="pi pi-spin pi-spinner text-2xl" />
              </td>
            </tr>
            <tr v-else-if="!filtrados.length">
              <td :colspan="COLUMNAS.length" class="px-4 py-12 text-center text-sm text-gray-400">
                <i class="pi pi-file text-2xl mb-2 block text-gray-300" />
                No hay contratos con esos filtros.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Dialog: nuevo contrato -->
    <Dialog v-model:visible="formVisible" header="Nuevo contrato de energía" modal
            class="w-full max-w-3xl" :dismissableMask="false">
      <form @submit.prevent="guardar" class="space-y-5 pt-1">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="field-label">Fecha desde *</label>
            <DatePicker v-model="f.fecha_desde" dateFormat="yy-mm-dd" showIcon class="w-full" placeholder="Seleccionar" />
          </div>
          <div>
            <label class="field-label">Fecha hasta *</label>
            <DatePicker v-model="f.fecha_hasta" dateFormat="yy-mm-dd" showIcon showClear class="w-full" placeholder="Seleccionar" />
          </div>

          <div>
            <label class="field-label">Código {{ f.tipo_contrato === 'no_contract' ? '' : '*' }}</label>
            <InputText v-model="f.codigo" class="w-full" placeholder="ej: 90060" />
            <p class="text-[11px] text-gray-400 mt-1">Es el código del contrato en XM.</p>
          </div>
          <div>
            <label class="field-label">Comercializador</label>
            <Select v-model="f.comercializador" :options="empresasOptions" optionLabel="label" optionValue="id"
                    class="w-full" placeholder="Seleccionar" filter showClear />
            <p class="text-[11px] text-gray-400 mt-1">Necesario si el proyecto es comercializador.</p>
          </div>

          <div>
            <label class="field-label">Tipo de contrato *</label>
            <Select v-model="f.tipo_contrato" :options="TIPOS_CONTRATO" optionLabel="label" optionValue="value"
                    class="w-full" placeholder="Seleccionar" />
          </div>
          <div>
            <label class="field-label">Tipo de tarifa *</label>
            <Select v-model="f.tipo_tarifa" :options="tarifasDisponibles" optionLabel="label" optionValue="value"
                    class="w-full" placeholder="Seleccionar" />
          </div>

          <div v-if="esPlg">
            <label class="field-label">Porcentaje</label>
            <InputNumber v-model="f.porcentaje" :maxFractionDigits="4" :useGrouping="false"
                         class="w-full" placeholder="ej: 1.0" :min="0" :max="1" />
            <p class="text-[11px] text-gray-400 mt-1">Fracción entre 0 y 1, no porcentaje. Solo PLG.</p>
          </div>
        </div>

        <div class="rounded-lg px-3 py-2.5 space-y-1" style="background:#FBF7FF; border:1px solid #ECE0FB;">
          <p class="text-xs text-gray-600">
            <i class="pi pi-info-circle mr-1" style="color:#915BD8;" />
            <b>Sin contrato</b> obliga a tipo de tarifa <b>Bolsa</b>.
          </p>
          <p class="text-xs text-gray-600">
            <i class="pi pi-info-circle mr-1" style="color:#915BD8;" />
            <b>PPA</b> exige precio de energía; <b>Bolsa</b> no lo admite.
          </p>
          <p v-if="esPlc" class="text-xs text-gray-600">
            <i class="pi pi-info-circle mr-1" style="color:#915BD8;" />
            Cada proyecto de un contrato <b>PLC</b> necesita piso <b>y</b> techo: 24 valores en kWh, de la hora 1 a la 24.
          </p>
        </div>

        <!-- Proyectos del contrato -->
        <div class="border border-gray-200 rounded-lg p-4 space-y-4">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Proyectos del contrato</p>

          <div v-for="(linea, idx) in f.proyectos" :key="idx" class="space-y-2 pb-3"
               :class="idx < f.proyectos.length - 1 ? 'border-b border-gray-100' : ''">
            <div class="grid grid-cols-12 gap-2 items-end">
              <div class="col-span-6">
                <label class="field-label">Proyecto</label>
                <Select v-model="linea.project" :options="proyectosOptions" optionLabel="label" optionValue="value"
                        class="w-full" placeholder="Seleccionar" filter showClear />
              </div>
              <div class="col-span-5">
                <label class="field-label">Precio de energía</label>
                <Select v-model="linea.energy_price" :options="preciosOptions" optionLabel="label" optionValue="id"
                        class="w-full" placeholder="Seleccionar" filter showClear
                        :disabled="f.tipo_tarifa === 'market'" />
              </div>
              <div class="col-span-1 flex justify-center pb-1">
                <Button icon="pi pi-times" text rounded severity="danger" size="small" type="button"
                        @click="quitarProyecto(idx)" v-tooltip="'Eliminar'" />
              </div>
            </div>

            <div v-if="esPlc" class="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label class="field-label">Piso · 24 valores kWh</label>
                <Textarea v-model="linea.floorTexto" rows="2" class="w-full text-xs"
                          placeholder="0, 0, 0, …, 120.5, 340, …" />
              </div>
              <div>
                <label class="field-label">Techo · 24 valores kWh</label>
                <Textarea v-model="linea.roofTexto" rows="2" class="w-full text-xs"
                          placeholder="0, 0, 0, …, 150.2, 400, …" />
              </div>
            </div>
          </div>

          <Button label="Agregar proyecto" icon="pi pi-plus" text size="small" type="button"
                  @click="agregarProyecto" />
        </div>

        <div class="flex justify-end gap-2 pt-1">
          <Button type="button" label="Cancelar" severity="secondary" :disabled="guardando"
                  @click="formVisible = false" />
          <Button type="submit" label="Guardar" icon="pi pi-check" :loading="guardando" />
        </div>
      </form>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import DatePicker from 'primevue/datepicker'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import { useToast } from 'primevue/usetoast'
import api from '@/api/client'
import {
  TIPOS_CONTRATO, TIPOS_TARIFA, listarContratosEnergia, crearContratoEnergia, listarCatalogos,
} from '@/api/liquidacionesApi'
import { formatearNombreProyecto } from '@/views/Proyectos/proyectosUi'

const toast = useToast()

const LABEL_TIPO_CONTRATO = Object.fromEntries(TIPOS_CONTRATO.map(t => [t.value, t.label]))
const LABEL_TIPO_TARIFA = Object.fromEntries(TIPOS_TARIFA.map(t => [t.value, t.label]))
const HORAS_DEL_DIA = 24

const COLUMNAS = [
  { key: 'fecha_desde',   label: 'Fecha desde' },
  { key: 'fecha_hasta',   label: 'Fecha hasta' },
  { key: 'codigo',        label: 'Código' },
  { key: 'empresa',       label: 'Comercializador' },
  { key: 'proyectos',     label: 'Proyectos' },
  { key: 'tipo_contrato', label: 'Tipo de contrato' },
  { key: 'tipo_tarifa',   label: 'Tipo de tarifa' },
  { key: 'porcentaje',    label: 'Porcentaje' },
  { key: 'tiene_precio',  label: 'Tiene precio de energía', center: true },
]

// ── Estado ───────────────────────────────────────────────────────────────────
const q = ref('')
const tipoSel = ref(null)
const loading = ref(false)
const error = ref(null)
const contratos = ref([])
const empresasOptions = ref([])
const preciosOptions = ref([])
// Tópico → nombre comercial, para no mostrar identificadores crudos en la tabla.
const nombrePorTopico = ref({})
const proyectosOptions = ref([])

const filtrados = computed(() => {
  const term = q.value.trim().toLowerCase()
  return contratos.value.filter((c) => {
    if (tipoSel.value && c.tipo_contrato !== tipoSel.value) return false
    if (!term) return true
    return [c.empresa, c.codigo, ...c.proyectos.map(p => nombreProyecto(p.proyecto))]
      .filter(Boolean).some(v => String(v).toLowerCase().includes(term))
  })
})

const plcIncompletos = computed(() =>
  contratos.value.filter(c =>
    c.tipo_contrato === 'ppa_pay_as_contracted' &&
    c.proyectos.some(p => !(p.tiene_piso && p.tiene_techo)),
  ),
)

function nombreProyecto(topico) {
  return nombrePorTopico.value[topico] || topico || '—'
}

function faltantes(p) {
  if (!p.tiene_piso && !p.tiene_techo) return 'piso y techo'
  return p.tiene_piso ? 'techo' : 'piso'
}

function fmtFecha(v) {
  if (!v) return '—'
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  return String(v).slice(0, 10)
}

async function cargar() {
  loading.value = true
  error.value = null
  try {
    contratos.value = await listarContratosEnergia()
  } catch (e) {
    error.value = e.response?.data?.detail || 'No se pudieron cargar los contratos de energía.'
    contratos.value = []
  } finally {
    loading.value = false
  }
}

// La API trae registros con el nombre en null (hoy, dos empresas). Sin
// descartarlos el orden alfabético revienta al comparar contra null y se caían
// los dos catálogos a la vez, aunque los precios estuvieran bien.
function _opciones(filas, campoNombre) {
  return (filas || [])
    .filter(x => x?.[campoNombre])
    .map(x => ({ id: x.id, label: String(x[campoNombre]) }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

async function cargarCatalogos() {
  try {
    const cat = await listarCatalogos()
    empresasOptions.value = _opciones(cat.empresas, 'nombre_empresa')
    preciosOptions.value = _opciones(cat.precios_energia, 'name')
  } catch (e) {
    empresasOptions.value = []
    preciosOptions.value = []
    toast.add({
      severity: 'warn', summary: 'Catálogos no disponibles',
      detail: e.response?.data?.detail
        || 'No se pudieron cargar comercializadores ni precios de energía.',
      life: 5000,
    })
  }
}

// La API externa identifica los proyectos por su tópico, no por nuestro id.
async function cargarProyectos() {
  try {
    const { data } = await api.get('/liquidaciones-api/proyectos')
    const conTopico = (data || []).filter(p => p.nombre_topico)
    nombrePorTopico.value = Object.fromEntries(
      conTopico.map(p => [p.nombre_topico, formatearNombreProyecto(p.nombre_comercial)]),
    )
    proyectosOptions.value = conTopico
      .map(p => ({ value: p.nombre_topico, label: formatearNombreProyecto(p.nombre_comercial) }))
      .sort((a, b) => a.label.localeCompare(b.label))
  } catch { /* la tabla sigue sirviendo mostrando el tópico crudo */ }
}

// ── Formulario ───────────────────────────────────────────────────────────────
const formVisible = ref(false)
const guardando = ref(false)
const f = reactive({
  fecha_desde: null,
  fecha_hasta: null,
  codigo: '',
  comercializador: null,
  tipo_contrato: null,
  tipo_tarifa: null,
  porcentaje: null,
  proyectos: [lineaVacia()],
})

const esPlc = computed(() => f.tipo_contrato === 'ppa_pay_as_contracted')
const esPlg = computed(() => f.tipo_contrato === 'ppa_pay_as_generated')

// 'Sin contrato' solo admite tarifa de bolsa.
const tarifasDisponibles = computed(() =>
  f.tipo_contrato === 'no_contract' ? TIPOS_TARIFA.filter(t => t.value === 'market') : TIPOS_TARIFA,
)
watch(() => f.tipo_contrato, (nuevo) => {
  if (nuevo === 'no_contract') f.tipo_tarifa = 'market'
  if (nuevo !== 'ppa_pay_as_generated') f.porcentaje = null
})
// La tarifa de bolsa no admite precio de energía: se limpia para no mandarlo.
watch(() => f.tipo_tarifa, (nuevo) => {
  if (nuevo === 'market') f.proyectos.forEach(l => { l.energy_price = null })
})

function lineaVacia() {
  return { project: null, energy_price: null, floorTexto: '', roofTexto: '' }
}

function abrirFormulario() {
  Object.assign(f, {
    fecha_desde: null, fecha_hasta: null, codigo: '', comercializador: null,
    tipo_contrato: null, tipo_tarifa: null, porcentaje: null, proyectos: [lineaVacia()],
  })
  formVisible.value = true
}

function agregarProyecto() {
  f.proyectos.push(lineaVacia())
}

function quitarProyecto(idx) {
  f.proyectos.splice(idx, 1)
  if (!f.proyectos.length) agregarProyecto()
}

function fechaISO(v) {
  if (!v) return null
  if (v instanceof Date) {
    // Local, no toISOString(): en Bogotá ese desfase de 5 h corre la fecha un día.
    return `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, '0')}-${String(v.getDate()).padStart(2, '0')}`
  }
  return String(v).slice(0, 10)
}

/** Convierte «0, 12.5, …» en 24 números. Devuelve null si no cuadra. */
function parseHoras(texto) {
  if (!texto?.trim()) return null
  const nums = texto.split(/[\s,;]+/).filter(Boolean).map(Number)
  if (nums.length !== HORAS_DEL_DIA || nums.some(Number.isNaN)) return null
  return nums
}

function validar() {
  if (!f.fecha_desde || !f.fecha_hasta || !f.tipo_contrato || !f.tipo_tarifa) {
    return 'Completa fecha desde, fecha hasta, tipo de contrato y tipo de tarifa.'
  }
  if (f.tipo_contrato !== 'no_contract' && !f.codigo.trim()) {
    return 'El código del contrato en XM es obligatorio salvo en «Sin contrato».'
  }
  if (f.porcentaje != null && (f.porcentaje < 0 || f.porcentaje > 1)) {
    return 'El porcentaje es una fracción entre 0 y 1.'
  }

  const lineas = f.proyectos.filter(l => l.project)
  if (!lineas.length) return 'Agrega al menos un proyecto.'
  if (new Set(lineas.map(l => l.project)).size !== lineas.length) {
    return 'Hay un proyecto repetido.'
  }
  for (const l of lineas) {
    const nombre = nombreProyecto(l.project)
    if (f.tipo_tarifa === 'ppa' && !l.energy_price) {
      return `«${nombre}» necesita precio de energía: el contrato es PPA.`
    }
    if (esPlc.value) {
      if (!parseHoras(l.floorTexto)) return `El piso de «${nombre}» debe traer 24 valores numéricos.`
      if (!parseHoras(l.roofTexto)) return `El techo de «${nombre}» debe traer 24 valores numéricos.`
    }
  }
  return null
}

async function guardar() {
  const problema = validar()
  if (problema) {
    toast.add({ severity: 'warn', summary: 'Revisa el formulario', detail: problema, life: 6000 })
    return
  }

  guardando.value = true
  try {
    await crearContratoEnergia({
      date_from: fechaISO(f.fecha_desde),
      date_to: fechaISO(f.fecha_hasta),
      contract_type: f.tipo_contrato,
      tariff_price_type: f.tipo_tarifa,
      code: f.codigo.trim() || undefined,
      company: f.comercializador ?? undefined,
      percentage: f.porcentaje ?? undefined,
      proyectos: f.proyectos.filter(l => l.project).map(l => ({
        project: l.project,
        energy_price: f.tipo_tarifa === 'market' ? undefined : (l.energy_price ?? undefined),
        floor: esPlc.value ? parseHoras(l.floorTexto) : undefined,
        roof: esPlc.value ? parseHoras(l.roofTexto) : undefined,
      })),
    })
    toast.add({ severity: 'success', summary: 'Contrato creado', life: 4000 })
    formVisible.value = false
    await cargar()
  } catch (e) {
    toast.add({
      severity: 'error', summary: 'No se pudo crear',
      detail: e.response?.data?.detail || e.message, life: 10000,
    })
  } finally {
    guardando.value = false
  }
}

onMounted(() => {
  cargar()
  cargarCatalogos()
  cargarProyectos()
})
</script>

<style scoped>
.field-label { @apply block text-xs font-medium text-gray-600 mb-1; }
</style>
