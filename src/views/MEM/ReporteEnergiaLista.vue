<template>
  <div class="list-pane bg-white rounded-xl shadow-sm overflow-hidden flex flex-col" style="border: 1px solid #e8e0f0;">
    <div class="p-3" style="border-bottom: 1px solid #f1ecf7;">
      <span class="p-input-icon-left w-full">
        <i class="pi pi-search" />
        <InputText v-model="search" placeholder="Buscar proyecto..." class="w-full" />
      </span>
    </div>
    <ul class="list-scroll flex-1 overflow-y-auto" style="list-style: none; margin: 0; padding: 0;">
      <li v-for="f in filtradas" :key="f.frontera_id">
        <button
          class="row w-full text-left"
          :class="{ 'row-selected': f.frontera_id === seleccionada }"
          :style="{ borderLeftColor: semaforoColor(f) }"
          @click="$emit('seleccionar', f)"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="font-medium text-sm truncate" style="color: #2C2039;">{{ f.nombre_proyecto }}</span>
            <span class="font-mono text-xs flex-none" style="color: #6b5a8a;">{{ fmtKwh(f.energia_final_kwh) }}</span>
          </div>
          <div class="flex items-center gap-2 mt-1">
            <span class="tipo-tag" :style="{ color: f.tipo === 'generacion' ? '#10B981' : '#3B82F6', borderColor: f.tipo === 'generacion' ? '#10B981' : '#3B82F6' }">
              {{ f.tipo === 'generacion' ? 'Gen' : 'Con' }}
            </span>
            <span class="text-xs truncate" style="color: #9b89b5;">{{ etiquetaFuente(f) }}</span>
          </div>
        </button>
      </li>
      <li v-if="!filtradas.length" class="text-sm text-center py-8" style="color: #9b89b5;">
        Sin resultados para esa búsqueda.
      </li>
    </ul>
    <div class="text-xs px-3 py-2" style="border-top: 1px solid #f1ecf7; color: #9b89b5;">
      Mostrando {{ filtradas.length }} de {{ filas.length }} fronteras
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import InputText from 'primevue/inputtext'

const props = defineProps({
  filas: { type: Array, default: () => [] },
  seleccionada: { type: Number, default: null },
})
defineEmits(['seleccionar'])

const search = ref('')

const filtradas = computed(() => {
  if (!search.value) return props.filas
  const s = search.value.toLowerCase()
  return props.filas.filter(f => (f.nombre_proyecto || '').toLowerCase().includes(s))
})

function semaforo(f) {
  if (f.revisar_manualmente) return 'critical'
  if (['1', 'CGM'].includes(String(f.caso))) return 'success'
  return 'warning'
}
function semaforoColor(f) {
  const map = { critical: '#D64455', warning: '#F0C040', success: '#10B981' }
  return map[semaforo(f)]
}

const ETIQUETAS_FUENTE = {
  cgm: 'CGM', principal: 'Medidor principal', respaldo: 'Medidor respaldo',
  inversores: 'Inversores × FP', crudos: 'Datos crudos', crudos_parcial: 'Datos crudos (parcial)',
  reconectador: 'Reconectador', solenium_power: 'Solenium (power)', ninguno: 'Apagado',
  revisar: 'Sin fuente', externo: 'Reporta otra empresa', historico: 'Histórico propio',
  historico_vecino: 'Histórico (vecino de predio)',
}
function etiquetaFuente(f) {
  return ETIQUETAS_FUENTE[f.medidor_usado] || f.medidor_usado || '—'
}
function fmtKwh(v) {
  if (v === null || v === undefined) return '—'
  return Number(v).toLocaleString('es-CO', { maximumFractionDigits: 1 }) + ' kWh'
}
</script>

<style scoped>
.list-scroll { max-height: 32rem; }
.row {
  display: block;
  width: 100%;
  padding: 10px 14px 10px 12px;
  border: none;
  background: none;
  border-bottom: 1px solid #f5f1fa;
  border-left: 3px solid transparent;
  cursor: pointer;
}
.row:hover { background: #faf8fd; }
.row-selected { background: #f5eefc; }
.tipo-tag {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 1px 6px;
  border-radius: 4px;
  border: 1px solid;
  flex: none;
}
</style>
