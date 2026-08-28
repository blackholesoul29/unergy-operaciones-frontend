<template>
  <div
    v-if="atrasada"
    class="flex items-center gap-3 rounded-lg px-3 py-2.5"
    style="background: #fef2f2; border: 1px solid rgba(214, 68, 85, 0.2)"
  >
    <i class="pi pi-exclamation-triangle" style="color: #d64455" />
    <span class="text-xs" style="color: #d64455">
      Generación al {{ fechaCorta(frescura.fecha_dato_generacion) }} — {{ frescura.dias_atraso }}
      {{ frescura.dias_atraso === 1 ? 'día' : 'días' }} de atraso. El margen de la anticipación
      mensual está comprometido.
    </span>
  </div>
  <div v-else-if="frescura" class="flex items-center gap-2 text-[11px]" style="color: #6b5a8a">
    <i class="pi pi-check-circle" style="color: #059669; font-size: 0.8rem" />
    <span>Generación al día ({{ fechaCorta(frescura.fecha_dato_generacion) }})</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { fechaCorta, generacionAtrasada } from './utils/modeloPredictivo'

const props = defineProps({
  frescura: { type: Object, default: null },
})

const atrasada = computed(() => generacionAtrasada(props.frescura))
</script>
