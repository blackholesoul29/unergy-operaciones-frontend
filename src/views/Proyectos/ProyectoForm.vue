<template>
  <form @submit.prevent="submit" class="space-y-4 pt-2">
    <div class="grid grid-cols-2 gap-4">
      <div class="col-span-2">
        <label class="field-label">Nombre comercial *</label>
        <InputText v-model="f.nombre_comercial" class="w-full" required />
      </div>
      <div class="col-span-2">
        <label class="field-label">Cliente *</label>
        <Select v-model="f.cliente_id" :options="clientes" optionLabel="razon_social_nombre" optionValue="id"
          class="w-full" placeholder="Seleccionar cliente" filter required />
      </div>
      <div>
        <label class="field-label">Tipo de proyecto</label>
        <Select v-model="f.tipo_proyecto" :options="tipos" class="w-full" placeholder="Seleccionar" showClear />
      </div>
      <div>
        <label class="field-label">Estado</label>
        <Select v-model="f.estado" :options="estados" class="w-full" />
      </div>
      <div>
        <label class="field-label">Potencia instalada (kWp)</label>
        <InputNumber v-model="f.potencia_instalada_kwp" :maxFractionDigits="2" class="w-full" />
      </div>
      <div>
        <label class="field-label">Tipo tecnología</label>
        <Select v-model="f.tipo_tecnologia" :options="tecnologias" class="w-full" placeholder="Seleccionar" showClear />
      </div>
      <div>
        <label class="field-label">Departamento</label>
        <InputText v-model="f.departamento" class="w-full" />
      </div>
      <div>
        <label class="field-label">Municipio</label>
        <InputText v-model="f.municipio" class="w-full" />
      </div>
      <div>
        <label class="field-label">Operador de red</label>
        <InputText v-model="f.operador_red" class="w-full" />
      </div>
      <div>
        <label class="field-label">Clasificación regulatoria</label>
        <Select v-model="f.clasificacion_regulatoria" :options="clasificaciones" class="w-full" placeholder="Seleccionar" showClear />
      </div>
      <div>
        <label class="field-label">Carpeta Drive (código)</label>
        <InputText v-model="f.carpeta_drive_codigo" class="w-full" />
      </div>
      <div>
        <label class="field-label">Topic slug</label>
        <InputText v-model="f.topic_slug" class="w-full" />
      </div>
      <div>
        <label class="field-label">Código base (topic / sub project)</label>
        <InputText v-model="f.sub_project" class="w-full" placeholder="ej: perija, vallenata" />
      </div>
      <div>
        <label class="field-label">Código TSF</label>
        <InputText v-model="f.codigo_tsf" class="w-full" placeholder="ej: COLCEST58P2" />
      </div>
    </div>

    <!-- Simulación P50 / P90 -->
    <div class="border border-gray-200 rounded-lg p-4 space-y-4">
      <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Generación simulada mensual (kWh)</p>

      <!-- P90 -->
      <div>
        <p class="text-xs font-medium text-gray-600 mb-2">P90</p>
        <div class="grid grid-cols-6 gap-2">
          <div v-for="(mes, i) in MESES" :key="'p90-' + i">
            <label class="block text-[10px] text-gray-400 mb-0.5 text-center">{{ mes }}</label>
            <InputNumber
              v-model="p90Array[i]"
              :maxFractionDigits="1"
              class="w-full"
              inputClass="text-center text-xs px-1 py-1"
              :placeholder="'—'"
            />
          </div>
        </div>
      </div>

      <!-- P50 -->
      <div>
        <p class="text-xs font-medium text-gray-600 mb-2">P50</p>
        <div class="grid grid-cols-6 gap-2">
          <div v-for="(mes, i) in MESES" :key="'p50-' + i">
            <label class="block text-[10px] text-gray-400 mb-0.5 text-center">{{ mes }}</label>
            <InputNumber
              v-model="p50Array[i]"
              :maxFractionDigits="1"
              class="w-full"
              inputClass="text-center text-xs px-1 py-1"
              :placeholder="'—'"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="flex justify-end gap-2 pt-2">
      <Button type="button" label="Cancelar" severity="secondary" @click="$emit('cancel')" />
      <Button type="submit" :label="editMode ? 'Guardar cambios' : 'Crear proyecto'" />
    </div>
  </form>
</template>

<script setup>
import { reactive, ref, watch, computed } from 'vue'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Button from 'primevue/button'

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const props = defineProps({
  clientes: Array,
  proyecto: { type: Object, default: null },
})
const emit = defineEmits(['save', 'cancel'])

const editMode = computed(() => !!props.proyecto)

const estados = ['en_desarrollo', 'en_operacion', 'suspendido', 'inactivo', 'terminado']
const tipos = ['autogeneracion', 'autoconsumo', 'gd_mercado', 'estandar']
const tecnologias = ['solar_fotovoltaico', 'eolico', 'hidraulico', 'cogeneracion', 'biomasa', 'otro']
const clasificaciones = ['autogeneracion_a_gran_escala', 'autogeneracion_a_pequena_escala', 'generacion_distribuida', 'no_aplica']

const f = reactive({
  nombre_comercial: '',
  cliente_id: null,
  estado: 'en_desarrollo',
  tipo_proyecto: null,
  potencia_instalada_kwp: null,
  tipo_tecnologia: null,
  departamento: null,
  municipio: null,
  operador_red: null,
  clasificacion_regulatoria: null,
  carpeta_drive_codigo: null,
  topic_slug: null,
  sub_project: null,
  codigo_tsf: null,
})

function parseMonthArray(jsonStr) {
  if (!jsonStr) return Array(12).fill(null)
  try {
    const arr = JSON.parse(jsonStr)
    if (!Array.isArray(arr)) return Array(12).fill(null)
    return arr.map(v => (v === null || v === undefined ? null : Number(v)))
  } catch {
    return Array(12).fill(null)
  }
}

const p90Array = ref(Array(12).fill(null))
const p50Array = ref(Array(12).fill(null))

watch(() => props.proyecto, (p) => {
  if (p) {
    Object.keys(f).forEach(k => { if (k in p) f[k] = p[k] })
    p90Array.value = parseMonthArray(p.p90_mensual_kwh)
    p50Array.value = parseMonthArray(p.p50_mensual_kwh)
  }
}, { immediate: true })

function serializeMonthArray(arr) {
  if (arr.every(v => v === null || v === undefined)) return null
  return JSON.stringify(arr.map(v => (v === null || v === undefined ? null : v)))
}

function submit() {
  const payload = {}
  for (const [k, v] of Object.entries(f)) {
    if (v !== null && v !== undefined && v !== '') payload[k] = v
  }
  const p90json = serializeMonthArray(p90Array.value)
  const p50json = serializeMonthArray(p50Array.value)
  if (p90json !== null) payload.p90_mensual_kwh = p90json
  if (p50json !== null) payload.p50_mensual_kwh = p50json
  emit('save', payload)
}
</script>

<style scoped>
.field-label { @apply block text-xs font-medium text-gray-600 mb-1; }
</style>
