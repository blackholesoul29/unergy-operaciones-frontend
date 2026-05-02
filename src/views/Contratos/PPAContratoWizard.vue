<template>
  <Dialog v-model:visible="visible" modal :style="{ width: '780px' }" :breakpoints="{ '900px': '95vw' }"
    :header="null" :closable="true" @hide="$emit('cerrar')">

    <!-- Step indicator -->
    <div class="px-6 pt-5 pb-4 border-b border-gray-100">
      <div class="flex items-start">
        <template v-for="(s, i) in STEPS" :key="i">
          <div class="flex flex-col items-center gap-1.5" style="flex:1">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
              :class="{
                'bg-amber-500 text-white shadow-sm shadow-amber-200': step === i,
                'bg-amber-400 text-white': step > i,
                'bg-gray-100 text-gray-400': step < i,
              }">
              <i v-if="step > i" class="pi pi-check text-xs" />
              <span v-else>{{ i + 1 }}</span>
            </div>
            <span class="text-[11px] text-center leading-tight px-1"
              :class="step === i ? 'text-amber-600 font-semibold' : step > i ? 'text-gray-500' : 'text-gray-300'">
              {{ s.label }}
            </span>
          </div>
          <div v-if="i < STEPS.length - 1" class="h-0.5 mt-4 mx-1 transition-all" style="flex:1"
            :class="step > i ? 'bg-amber-400' : 'bg-gray-100'" />
        </template>
      </div>
    </div>

    <!-- Contenido -->
    <div class="px-6 py-5 min-h-64">

      <!-- ── PASO 0: Proyectos e identificación ─────────────────────────── -->
      <template v-if="step === 0">
        <p class="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-4">Proyectos e identificación</p>
        <div class="space-y-4">
          <div class="flex flex-col gap-1">
            <label class="field-label">Proyectos asociados <span class="text-red-400">*</span></label>
            <MultiSelect
              v-model="proyectosSeleccionados"
              :options="todosProyectos"
              optionLabel="nombre_comercial"
              placeholder="Buscar y seleccionar proyectos…"
              filter
              filterPlaceholder="Buscar proyecto"
              :maxSelectedLabels="3"
              selectedItemsLabel="{0} proyectos seleccionados"
              class="w-full"
              display="chip"
            />
            <p v-if="errores.proyectos" class="text-xs text-red-400 mt-0.5">{{ errores.proyectos }}</p>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1">
              <label class="field-label">Número de contrato</label>
              <InputText v-model="form.numero_codigo_contrato" placeholder="Ej: UNERGY 001-2023" class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="field-label">Nombre interno</label>
              <InputText v-model="form.nombre_interno" placeholder="Ej: Terpel 1" class="w-full" />
            </div>
          </div>
        </div>
      </template>

      <!-- ── PASO 1: Partes ─────────────────────────────────────────────── -->
      <template v-if="step === 1">
        <p class="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-4">Partes del contrato</p>
        <div class="grid grid-cols-2 gap-1 mb-1 px-1">
          <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Comprador</span>
          <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Vendedor</span>
        </div>
        <div class="grid grid-cols-2 gap-4 p-4 rounded-lg bg-gray-50">
          <div class="space-y-3">
            <div class="flex flex-col gap-1">
              <label class="field-label">Nombre / Razón social</label>
              <InputText v-model="form.comprador_nombre" class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="field-label">NIT</label>
              <InputText v-model="form.comprador_nit" class="w-full" />
            </div>
          </div>
          <div class="space-y-3">
            <div class="flex flex-col gap-1">
              <label class="field-label">Nombre / Razón social</label>
              <InputText v-model="form.vendedor_nombre" class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="field-label">NIT</label>
              <InputText v-model="form.vendedor_nit" class="w-full" />
            </div>
          </div>
        </div>
      </template>

      <!-- ── PASO 2: Condiciones comerciales ───────────────────────────── -->
      <template v-if="step === 2">
        <p class="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-4">Condiciones comerciales</p>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1">
              <label class="field-label">Fecha inicio de despacho</label>
              <DatePicker v-model="form.fecha_inicio" dateFormat="yy-mm-dd" showIcon class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="field-label">Fecha final del despacho</label>
              <DatePicker v-model="form.fecha_fin" dateFormat="yy-mm-dd" showIcon class="w-full" />
            </div>
          </div>
          <div class="grid grid-cols-3 gap-4">
            <div class="flex flex-col gap-1">
              <label class="field-label">Tarifa base ($/kWh)</label>
              <InputNumber v-model="form.tarifa_base" :maxFractionDigits="4" class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="field-label">Índice de indexación</label>
              <InputText v-model="form.indice_indexacion" placeholder="IPP, IPC…" class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="field-label">Periodicidad indexación</label>
              <Select v-model="form.periodicidad_indexacion" :options="PERIODICIDADES"
                optionLabel="label" optionValue="value" placeholder="Seleccionar" showClear class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="field-label">Período base (AAAA-MM)</label>
              <InputText v-model="form.periodo_indexacion_base" placeholder="2024-01" maxlength="7" class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="field-label">Valor base indexación</label>
              <InputNumber v-model="form.valor_indexacion_base" :maxFractionDigits="4" class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="field-label">Tiempo de pago (días)</label>
              <InputNumber v-model="form.tiempo_pago" :useGrouping="false" placeholder="30" class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="field-label">Periodicidad facturación</label>
              <Select v-model="form.periodicidad_facturacion" :options="PERIODICIDADES"
                optionLabel="label" optionValue="value" placeholder="Seleccionar" showClear class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="field-label">Energía mín. (kWh/mes)</label>
              <InputNumber v-model="form.cantidad_minima_kwh_mes" :maxFractionDigits="3" class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="field-label">Energía máx. (kWh/mes)</label>
              <InputNumber v-model="form.cantidad_maxima_kwh_mes" :maxFractionDigits="3" class="w-full" />
            </div>
          </div>
          <div class="flex flex-col gap-1">
            <label class="field-label">Condiciones de pago</label>
            <Textarea v-model="form.condiciones_pago" rows="2" autoResize class="w-full" />
          </div>
        </div>
      </template>

      <!-- ── PASO 3: GESCON + Resumen ───────────────────────────────────── -->
      <template v-if="step === 3">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
          Registro GESCON / ASIC <span class="normal-case font-normal">(opcional)</span>
        </p>
        <div class="grid grid-cols-3 gap-4 mb-6">
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

        <!-- Resumen -->
        <div class="rounded-lg border border-amber-100 bg-amber-50 p-4">
          <p class="text-xs font-semibold text-amber-700 mb-3">Resumen del contrato</p>
          <div class="mb-2">
            <span class="text-xs text-gray-400">Proyectos:</span>
            <div class="flex flex-wrap gap-1 mt-1">
              <span v-for="p in proyectosSeleccionados" :key="p.id"
                class="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                {{ p.nombre_comercial }}
              </span>
              <span v-if="!proyectosSeleccionados.length" class="text-xs text-gray-300">—</span>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-gray-600 mt-3">
            <ResumenFila label="Número" :value="form.numero_codigo_contrato" />
            <ResumenFila label="Nombre interno" :value="form.nombre_interno" />
            <ResumenFila label="Comprador" :value="form.comprador_nombre" />
            <ResumenFila label="Vendedor" :value="form.vendedor_nombre" />
            <ResumenFila label="Inicio despacho" :value="formatFecha(form.fecha_inicio)" />
            <ResumenFila label="Fin despacho" :value="formatFecha(form.fecha_fin)" />
            <ResumenFila label="Tarifa base" :value="form.tarifa_base != null ? `$${form.tarifa_base}/kWh` : null" />
            <ResumenFila label="Índice" :value="form.indice_indexacion" />
            <ResumenFila label="Tiempo de pago" :value="form.tiempo_pago != null ? `${form.tiempo_pago} días` : null" />
            <ResumenFila label="Código SIC" :value="form.codigo_sic" />
          </div>
        </div>
      </template>

    </div>

    <!-- Footer -->
    <div class="px-6 py-4 border-t border-gray-100 flex justify-between items-center">
      <Button v-if="step > 0" label="Anterior" icon="pi pi-arrow-left" severity="secondary" outlined @click="step--" />
      <span v-else />
      <div class="flex gap-2">
        <Button label="Cancelar" severity="secondary" text @click="$emit('cerrar')" />
        <Button v-if="step < STEPS.length - 1" label="Siguiente" icon="pi pi-arrow-right" iconPos="right" @click="avanzar" />
        <Button v-else label="Guardar contrato" icon="pi pi-check" :loading="guardando" @click="guardar" />
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import MultiSelect from 'primevue/multiselect'
import DatePicker from 'primevue/datepicker'
import Textarea from 'primevue/textarea'
import api from '@/api/client'

defineProps({ visible: Boolean })
const emit = defineEmits(['update:visible', 'cerrar', 'creado'])

const toast = useToast()

const STEPS = [
  { label: 'Proyectos' },
  { label: 'Partes' },
  { label: 'Condiciones' },
  { label: 'GESCON' },
]

const PERIODICIDADES = [
  { label: 'Mensual', value: 'mensual' },
  { label: 'Bimestral', value: 'bimestral' },
  { label: 'Trimestral', value: 'trimestral' },
  { label: 'Anual', value: 'anual' },
]

const step = ref(0)
const guardando = ref(false)
const todosProyectos = ref([])
const proyectosSeleccionados = ref([])
const errores = reactive({})

const form = reactive({
  numero_codigo_contrato: null, nombre_interno: null,
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
})

function validarPaso0() {
  errores.proyectos = null
  if (!proyectosSeleccionados.value.length) {
    errores.proyectos = 'Selecciona al menos un proyecto'
    return false
  }
  return true
}

function avanzar() {
  if (step.value === 0 && !validarPaso0()) return
  step.value++
}

function formatFecha(v) {
  if (!v) return null
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  return String(v).slice(0, 10)
}

async function guardar() {
  if (!validarPaso0()) { step.value = 0; return }
  guardando.value = true
  try {
    const payload = { ...form }
    for (const k of ['fecha_inicio', 'fecha_fin', 'gescon_fecha_inicio', 'gescon_fecha_fin']) {
      payload[k] = formatFecha(form[k])
    }
    payload.proyecto_ids = proyectosSeleccionados.value.map(p => p.id)
    const { data } = await api.post('/ppa', payload)
    toast.add({ severity: 'success', summary: 'Contrato creado', detail: data.nombre_interno || data.numero_codigo_contrato, life: 3000 })
    emit('creado', data)
    emit('cerrar')
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error al guardar', detail: e.response?.data?.detail || e.message, life: 4000 })
  } finally {
    guardando.value = false
  }
}

onMounted(async () => {
  try {
    const { data } = await api.get('/proyectos', { params: { size: 500 } })
    todosProyectos.value = data.items
  } catch { /* silencioso */ }
})
</script>

<script>
const ResumenFila = {
  props: { label: String, value: [String, Number] },
  template: `<div v-if="value"><span class="text-gray-400">{{ label }}:</span> <span class="font-medium text-gray-700">{{ value }}</span></div>`,
}
export default { components: { ResumenFila } }
</script>

<style scoped>
.field-label { @apply block text-xs font-medium text-gray-600 mb-1; }
</style>
