<template>
  <form class="space-y-4 pt-1" @submit.prevent="save">

    <!-- Proyecto -->
    <div class="grid grid-cols-2 gap-3">
      <div class="col-span-2">
        <label class="field-label">Proyecto *</label>
        <Select v-model="form.proyecto_id" :options="proyectos"
                option-value="id" option-label="nombre_display"
                class="w-full" placeholder="Selecciona un proyecto…"
                filter show-clear required />
      </div>

      <!-- Tipo de falla -->
      <div class="col-span-2">
        <label class="field-label">Tipo de falla *</label>
        <Select v-model="form.tipo_falla_id" :options="tiposConCategoria"
                option-value="id" option-label="etiqueta"
                option-group-label="label" option-group-children="items"
                class="w-full" placeholder="Selecciona el tipo…" filter required>
          <template #optiongroup="{ option }">
            <div class="flex items-center gap-2 py-1">
              <span class="text-[10px] font-bold uppercase tracking-wide"
                    style="color:#915BD8;">{{ option.label }}</span>
            </div>
          </template>
        </Select>
      </div>

      <!-- Estado -->
      <div>
        <label class="field-label">Estado inicial</label>
        <Select v-model="form.estado_id" :options="catalogos.estados"
                option-value="id" option-label="etiqueta"
                class="w-full" />
      </div>

      <!-- Prioridad -->
      <div>
        <label class="field-label">Prioridad</label>
        <Select v-model="form.prioridad_id" :options="catalogos.prioridades"
                option-value="id" option-label="etiqueta"
                class="w-full" />
      </div>

      <!-- Fecha identificación -->
      <div>
        <label class="field-label">Fecha identificación *</label>
        <DatePicker v-model="form.fecha_identificacion" date-format="dd/mm/yy"
                    class="w-full" show-icon required />
      </div>

      <!-- Hora -->
      <div>
        <label class="field-label">Hora identificación</label>
        <DatePicker v-model="form.hora_identificacion" time-only
                    hour-format="24" class="w-full" />
      </div>

      <!-- Fecha ocurrencia -->
      <div class="col-span-2">
        <label class="field-label">
          Fecha y hora de ocurrencia
          <span style="color:#9b89b5;">(si difiere de la identificación)</span>
        </label>
        <DatePicker v-model="form.fecha_ocurrencia" date-format="dd/mm/yy"
                    show-time hour-format="24" class="w-full" show-icon />
      </div>
    </div>

    <!-- Descripción -->
    <div>
      <label class="field-label">Descripción adicional</label>
      <Textarea v-model="form.descripcion" rows="3" class="w-full"
                placeholder="Detalla la falla, síntomas observados, equipos afectados…" />
    </div>

    <!-- Nota inicial (seguimiento) -->
    <div>
      <label class="field-label">
        Nota inicial
        <span style="color:#9b89b5;">(crea el primer seguimiento automáticamente)</span>
      </label>
      <Textarea v-model="form.nota_inicial" rows="2" class="w-full"
                placeholder="Ej: Se identificó la falla durante monitoreo remoto…" />
    </div>

    <!-- SLA -->
    <div>
      <label class="field-label">SLA límite (días) <span style="color:#9b89b5;">— se hereda del contrato si se deja vacío</span></label>
      <InputNumber v-model="form.sla_limite_dias" :min="1" :max="365"
                   class="w-full" placeholder="7" />
    </div>

    <!-- Botones -->
    <div class="flex justify-end gap-2 pt-2 border-t" style="border-color:#f0eaf8;">
      <Button type="button" label="Cancelar" severity="secondary" text @click="$emit('cancel')" />
      <Button type="submit" label="Registrar falla" icon="pi pi-plus" :loading="loading" />
    </div>

  </form>
</template>

<script setup>
import { ref, computed } from 'vue'
import Button from 'primevue/button'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import InputNumber from 'primevue/inputnumber'
import DatePicker from 'primevue/datepicker'
import { useToast } from 'primevue/usetoast'
import api from '@/api/client'

const props = defineProps({ catalogos: Object, proyectos: Array })
const emit  = defineEmits(['save', 'cancel'])
const toast = useToast()

const loading = ref(false)

const form = ref({
  proyecto_id:         null,
  tipo_falla_id:       null,
  estado_id:           null,
  prioridad_id:        null,
  fecha_identificacion:new Date(),
  hora_identificacion: null,
  fecha_ocurrencia:    null,
  descripcion:         '',
  nota_inicial:        '',
  sla_limite_dias:     null,
})

// Inicializar estado por defecto = "activa"
const estadoActiva = props.catalogos?.estados?.find(e => e.codigo === 'activa')
if (estadoActiva) form.value.estado_id = estadoActiva.id

// Agrupar tipos por categoría para el select
const tiposConCategoria = computed(() => {
  const grupos = {}
  for (const t of (props.catalogos?.tipos || [])) {
    const cat = t.categoria?.etiqueta || 'Sin categoría'
    if (!grupos[cat]) grupos[cat] = { label: cat, items: [] }
    grupos[cat].items.push({ ...t, etiqueta: `${t.codigo} · ${t.etiqueta}` })
  }
  return Object.values(grupos)
})

async function save() {
  if (!form.value.proyecto_id || !form.value.tipo_falla_id) {
    toast.add({ severity: 'warn', summary: 'Completa los campos requeridos', life: 2500 })
    return
  }
  loading.value = true
  try {
    const payload = {
      ...form.value,
      fecha_identificacion: form.value.fecha_identificacion
        ? form.value.fecha_identificacion.toISOString().split('T')[0] : null,
      hora_identificacion: form.value.hora_identificacion
        ? form.value.hora_identificacion.toTimeString().slice(0, 8) : null,
      nota_inicial: form.value.nota_inicial?.trim() || null,
    }
    await api.post('/fallas', payload)
    emit('save')
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error al registrar',
                detail: e.response?.data?.detail, life: 4000 })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.field-label { @apply block text-xs font-medium mb-1; color: #6b5a8a; }
</style>
