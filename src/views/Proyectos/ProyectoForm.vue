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
    </div>

    <div class="flex justify-end gap-2 pt-2">
      <Button type="button" label="Cancelar" severity="secondary" @click="$emit('cancel')" />
      <Button type="submit" :label="editMode ? 'Guardar cambios' : 'Crear proyecto'" />
    </div>
  </form>
</template>

<script setup>
import { reactive, watch, computed } from 'vue'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Button from 'primevue/button'

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
})

watch(() => props.proyecto, (p) => {
  if (p) {
    Object.keys(f).forEach(k => { if (k in p) f[k] = p[k] })
  }
}, { immediate: true })

function submit() {
  const payload = {}
  for (const [k, v] of Object.entries(f)) {
    if (v !== null && v !== undefined && v !== '') payload[k] = v
  }
  emit('save', payload)
}
</script>


<style scoped>
.field-label { @apply block text-xs font-medium text-gray-600 mb-1; }
</style>
