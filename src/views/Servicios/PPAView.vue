<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <Button icon="pi pi-arrow-left" text @click="$router.back()" class="-ml-2" />
        <div>
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
              <i class="pi pi-bolt text-amber-500 text-sm" />
            </div>
            <h2 class="text-xl font-bold text-gray-800">Contratos PPA</h2>
          </div>
          <p v-if="proyectoNombre" class="text-xs text-gray-400 mt-0.5 ml-11">{{ proyectoNombre }}</p>
        </div>
      </div>
      <Button label="Nuevo contrato" icon="pi pi-plus" @click="abrirFormNuevo" />
    </div>

    <!-- Lista de contratos -->
    <div v-if="loading" class="flex justify-center py-16"><ProgressSpinner /></div>

    <div v-else-if="contratos.length === 0" class="flex flex-col items-center py-16 gap-3 text-gray-400">
      <i class="pi pi-bolt text-4xl text-amber-300" />
      <p class="text-sm">No hay contratos PPA registrados para este proyecto.</p>
      <Button label="Registrar primer contrato" icon="pi pi-plus" outlined @click="abrirFormNuevo" />
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="c in contratos" :key="c.id"
        class="border border-gray-100 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between mb-3">
          <div>
            <p class="font-semibold text-gray-800">{{ c.nombre_interno || c.numero_codigo_contrato || 'Sin nombre' }}</p>
            <p v-if="c.nombre_interno && c.numero_codigo_contrato" class="text-xs text-gray-400 mt-0.5">{{ c.numero_codigo_contrato }}</p>
          </div>
          <div class="flex items-center gap-1">
            <Tag :value="c.tipo_contrato || '—'" :severity="c.tipo_contrato === 'venta' ? 'success' : 'info'" class="text-xs" />
            <Button icon="pi pi-pencil" text size="small" severity="secondary" @click="abrirFormEditar(c)" />
            <Button icon="pi pi-trash" text size="small" severity="danger" @click="confirmarEliminar(c)" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
          <span><b class="text-gray-600">Comprador:</b> {{ c.comprador_nombre || '—' }}</span>
          <span><b class="text-gray-600">Vendedor:</b> {{ c.vendedor_nombre || '—' }}</span>
          <span><b class="text-gray-600">Vigencia:</b> {{ formatFecha(c.fecha_inicio) }} → {{ formatFecha(c.fecha_fin) }}</span>
          <span><b class="text-gray-600">Tarifa base:</b> {{ c.tarifa_base != null ? `$${c.tarifa_base}/kWh` : '—' }}</span>
          <span><b class="text-gray-600">Índice:</b> {{ c.indice_indexacion || '—' }}</span>
          <span><b class="text-gray-600">Tiempo pago:</b> {{ c.tiempo_pago != null ? `${c.tiempo_pago} días` : '—' }}</span>
        </div>
        <div v-if="c.tarifas?.length || c.compromisos_energia?.length" class="mt-3 flex gap-2">
          <Tag v-if="c.tarifas?.length" :value="`${c.tarifas.length} tarifas`" severity="secondary" class="text-xs" />
          <Tag v-if="c.compromisos_energia?.length" :value="`${c.compromisos_energia.length} compromisos`" severity="secondary" class="text-xs" />
        </div>
      </div>
    </div>

    <!-- Dialog formulario -->
    <Dialog v-model:visible="showForm" :header="editando ? 'Editar contrato PPA' : 'Nuevo contrato PPA'"
      modal :style="{ width: '780px' }" :breakpoints="{ '960px': '90vw' }" @hide="resetForm">
      <div class="space-y-5 pt-1">

        <!-- Identificación -->
        <fieldset class="border border-gray-100 rounded-lg p-4 space-y-3">
          <legend class="text-xs font-semibold text-amber-600 uppercase tracking-wide px-1">Identificación</legend>
          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1">
              <label class="field-label">Número de contrato</label>
              <InputText v-model="form.numero_codigo_contrato" placeholder="Ej: PPA-2024-001" class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="field-label">Nombre interno</label>
              <InputText v-model="form.nombre_interno" placeholder="Ej: PPA Planta Laureles" class="w-full" />
            </div>
          </div>
          <div class="flex flex-col gap-1 w-48">
            <label class="field-label">Tipo de contrato</label>
            <Select v-model="form.tipo_contrato" :options="TIPOS_CONTRATO" optionLabel="label" optionValue="value"
              placeholder="Seleccionar" class="w-full" />
          </div>
        </fieldset>

        <!-- Partes -->
        <fieldset class="border border-gray-100 rounded-lg p-4 space-y-3">
          <legend class="text-xs font-semibold text-amber-600 uppercase tracking-wide px-1">Partes</legend>
          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1">
              <label class="field-label">Comprador — Nombre / Razón social</label>
              <InputText v-model="form.comprador_nombre" class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="field-label">Comprador — NIT</label>
              <InputText v-model="form.comprador_nit" class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="field-label">Vendedor — Nombre / Razón social</label>
              <InputText v-model="form.vendedor_nombre" class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="field-label">Vendedor — NIT</label>
              <InputText v-model="form.vendedor_nit" class="w-full" />
            </div>
          </div>
        </fieldset>

        <!-- Vigencia -->
        <fieldset class="border border-gray-100 rounded-lg p-4 space-y-3">
          <legend class="text-xs font-semibold text-amber-600 uppercase tracking-wide px-1">Vigencia</legend>
          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1">
              <label class="field-label">Fecha inicio de despacho</label>
              <DatePicker v-model="form.fecha_inicio" dateFormat="yy-mm-dd" showIcon class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="field-label">Fecha final del despacho</label>
              <DatePicker v-model="form.fecha_fin" dateFormat="yy-mm-dd" showIcon class="w-full" />
            </div>
          </div>
        </fieldset>

        <!-- Condiciones comerciales -->
        <fieldset class="border border-gray-100 rounded-lg p-4 space-y-3">
          <legend class="text-xs font-semibold text-amber-600 uppercase tracking-wide px-1">Condiciones comerciales</legend>
          <div class="grid grid-cols-3 gap-3">
            <div class="flex flex-col gap-1">
              <label class="field-label">Tarifa base ($/kWh)</label>
              <InputNumber v-model="form.tarifa_base" :maxFractionDigits="4" class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="field-label">Índice de indexación</label>
              <InputText v-model="form.indice_indexacion" placeholder="Ej: IPP, IPC" class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="field-label">Periodicidad indexación</label>
              <Select v-model="form.periodicidad_indexacion" :options="PERIODICIDADES" optionLabel="label" optionValue="value"
                placeholder="Seleccionar" class="w-full" showClear />
            </div>
            <div class="flex flex-col gap-1">
              <label class="field-label">Período base indexación (AAAA-MM)</label>
              <InputText v-model="form.periodo_indexacion_base" placeholder="2024-01" maxlength="7" class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="field-label">Valor base indexación</label>
              <InputNumber v-model="form.valor_indexacion_base" :maxFractionDigits="4" class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="field-label">Tiempo de pago (días)</label>
              <InputNumber v-model="form.tiempo_pago" :useGrouping="false" placeholder="Ej: 30" class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="field-label">Periodicidad facturación</label>
              <Select v-model="form.periodicidad_facturacion" :options="PERIODICIDADES" optionLabel="label" optionValue="value"
                placeholder="Seleccionar" class="w-full" showClear />
            </div>
          </div>
          <div class="flex flex-col gap-1">
            <label class="field-label">Condiciones de pago</label>
            <Textarea v-model="form.condiciones_pago" rows="2" class="w-full" autoResize />
          </div>
        </fieldset>

        <!-- Energía comprometida -->
        <fieldset class="border border-gray-100 rounded-lg p-4 space-y-3">
          <legend class="text-xs font-semibold text-amber-600 uppercase tracking-wide px-1">Energía comprometida</legend>
          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1">
              <label class="field-label">Cantidad mínima (kWh/mes)</label>
              <InputNumber v-model="form.cantidad_minima_kwh_mes" :maxFractionDigits="3" class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="field-label">Cantidad máxima (kWh/mes)</label>
              <InputNumber v-model="form.cantidad_maxima_kwh_mes" :maxFractionDigits="3" class="w-full" />
            </div>
          </div>
        </fieldset>

        <!-- GESCON / ASIC -->
        <fieldset class="border border-gray-100 rounded-lg p-4 space-y-3">
          <legend class="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">Registro GESCON / ASIC</legend>
          <div class="grid grid-cols-3 gap-3">
            <div class="flex flex-col gap-1">
              <label class="field-label">Código SIC</label>
              <InputText v-model="form.codigo_sic" class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="field-label">Código GESCON</label>
              <InputText v-model="form.gescon_codigo" class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="field-label">Precio GESCON ($/kWh)</label>
              <InputNumber v-model="form.gescon_precio" :maxFractionDigits="4" class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="field-label">Fecha inicio GESCON</label>
              <DatePicker v-model="form.gescon_fecha_inicio" dateFormat="yy-mm-dd" showIcon class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="field-label">Fecha fin GESCON</label>
              <DatePicker v-model="form.gescon_fecha_fin" dateFormat="yy-mm-dd" showIcon class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="field-label">Cantidades GESCON (kWh)</label>
              <InputNumber v-model="form.gescon_cantidades_kwh" :maxFractionDigits="3" class="w-full" />
            </div>
          </div>
        </fieldset>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="secondary" outlined @click="showForm = false" />
        <Button :label="editando ? 'Guardar cambios' : 'Crear contrato'" icon="pi pi-check"
          :loading="guardando" @click="guardar" />
      </template>
    </Dialog>

    <!-- Confirm eliminar -->
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Textarea from 'primevue/textarea'
import ConfirmDialog from 'primevue/confirmdialog'
import api from '@/api/client'

const route = useRoute()
const toast = useToast()
const confirm = useConfirm()

const TIPOS_CONTRATO = [
  { label: 'Venta', value: 'venta' },
  { label: 'Compra', value: 'compra' },
]
const PERIODICIDADES = [
  { label: 'Mensual', value: 'mensual' },
  { label: 'Bimestral', value: 'bimestral' },
  { label: 'Trimestral', value: 'trimestral' },
  { label: 'Anual', value: 'anual' },
]

const proyectoId = Number(route.params.id)
const proyectoNombre = ref('')
const contratos = ref([])
const loading = ref(true)
const showForm = ref(false)
const guardando = ref(false)
const editando = ref(null)

const FORM_EMPTY = {
  numero_codigo_contrato: null, nombre_interno: null, tipo_contrato: null,
  comprador_nombre: null, comprador_nit: null,
  vendedor_nombre: null, vendedor_nit: null,
  fecha_inicio: null, fecha_fin: null,
  tarifa_base: null, indice_indexacion: null,
  periodicidad_indexacion: null, periodo_indexacion_base: null, valor_indexacion_base: null,
  cantidad_minima_kwh_mes: null, cantidad_maxima_kwh_mes: null,
  periodicidad_facturacion: null, tiempo_pago: null, condiciones_pago: null,
  codigo_sic: null,
  gescon_codigo: null, gescon_fecha_inicio: null, gescon_fecha_fin: null,
  gescon_precio: null, gescon_cantidades_kwh: null,
}
const form = reactive({ ...FORM_EMPTY })

function resetForm() {
  Object.assign(form, FORM_EMPTY)
  editando.value = null
}

function abrirFormNuevo() {
  resetForm()
  showForm.value = true
}

function abrirFormEditar(contrato) {
  resetForm()
  Object.keys(form).forEach(k => {
    form[k] = contrato[k] ?? null
  })
  editando.value = contrato.id
  showForm.value = true
}

function formatFecha(f) {
  if (!f) return '—'
  return String(f).slice(0, 10)
}

function toISODate(v) {
  if (!v) return null
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  return String(v).slice(0, 10)
}

async function guardar() {
  guardando.value = true
  try {
    const payload = {}
    for (const [k, v] of Object.entries(form)) {
      if (['fecha_inicio', 'fecha_fin', 'gescon_fecha_inicio', 'gescon_fecha_fin'].includes(k)) {
        payload[k] = toISODate(v)
      } else {
        payload[k] = v !== '' ? v : null
      }
    }

    if (editando.value) {
      await api.patch(`/ppa/${editando.value}`, payload)
      toast.add({ severity: 'success', summary: 'Contrato actualizado', life: 3000 })
    } else {
      await api.post('/ppa', { ...payload, proyecto_id: proyectoId })
      toast.add({ severity: 'success', summary: 'Contrato creado', life: 3000 })
    }
    showForm.value = false
    await cargarContratos()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.detail || e.message, life: 4000 })
  } finally {
    guardando.value = false
  }
}

function confirmarEliminar(contrato) {
  confirm.require({
    message: `¿Eliminar el contrato "${contrato.nombre_interno || contrato.numero_codigo_contrato || 'sin nombre'}"? Esta acción no se puede deshacer.`,
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptSeverity: 'danger',
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
    accept: async () => {
      try {
        await api.delete(`/ppa/${contrato.id}`)
        contratos.value = contratos.value.filter(c => c.id !== contrato.id)
        toast.add({ severity: 'success', summary: 'Contrato eliminado', life: 2000 })
      } catch (e) {
        toast.add({ severity: 'error', summary: 'Error al eliminar', detail: e.response?.data?.detail, life: 3000 })
      }
    },
  })
}

async function cargarContratos() {
  const { data } = await api.get('/ppa', { params: { proyecto_id: proyectoId } })
  contratos.value = data
}

onMounted(async () => {
  try {
    const [proyRes] = await Promise.all([
      api.get(`/proyectos/${proyectoId}`),
      cargarContratos(),
    ])
    proyectoNombre.value = proyRes.data.nombre_comercial
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error al cargar', detail: e.message, life: 4000 })
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.field-label { @apply block text-xs font-medium text-gray-600 mb-1; }
</style>
