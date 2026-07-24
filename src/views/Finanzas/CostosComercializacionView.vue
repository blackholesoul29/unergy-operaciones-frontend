<template>
  <div class="space-y-4">
    <PageHeader title="Costos comercialización"
                subtitle="Costos de comercialización por proyecto" />

    <!-- Filtro de búsqueda -->
    <div class="bg-white rounded-xl shadow-sm p-3 flex flex-wrap gap-3 items-end border" style="border-color:#ECE7F2">
      <div>
        <label class="field-label">Buscar</label>
        <IconField>
          <InputIcon class="pi pi-search" />
          <InputText v-model="q" placeholder="Proyecto, tipo de pago…" class="w-72" />
        </IconField>
      </div>
      <div class="flex-1" />
      <div class="text-xs text-gray-400 self-center">
        {{ filtrados.length }} registro{{ filtrados.length === 1 ? '' : 's' }}
      </div>
    </div>

    <!-- Tabla -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden border" style="border-color:#ECE7F2">
      <div class="overflow-x-auto">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100">
              <th v-for="col in COLUMNAS" :key="col.key"
                  class="px-4 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wide whitespace-nowrap"
                  :class="col.right ? 'text-right' : 'text-left'">
                {{ col.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in filtrados" :key="i"
                class="border-t border-gray-100 hover:bg-gray-50/70 transition-colors duration-100">
              <td class="px-4 py-2 whitespace-nowrap">{{ row.fecha_desde || '—' }}</td>
              <td class="px-4 py-2 whitespace-nowrap">{{ row.fecha_hasta || '—' }}</td>
              <td class="px-4 py-2">{{ row.proyecto || '—' }}</td>
              <td class="px-4 py-2 text-right font-mono text-xs">{{ fmtNum(row.valor) }}</td>
              <td class="px-4 py-2 whitespace-nowrap">{{ row.frecuencia_pago || '—' }}</td>
              <td class="px-4 py-2">{{ row.tipo_pago || '—' }}</td>
              <td class="px-4 py-2 whitespace-nowrap">{{ row.version || '—' }}</td>
            </tr>
            <tr v-if="!filtrados.length">
              <td :colspan="COLUMNAS.length" class="px-4 py-12 text-center text-sm text-gray-400">
                <i class="pi pi-credit-card text-2xl mb-2 block text-gray-300" />
                Aún no hay costos de comercialización.<br>
                <span class="text-xs">La carga de datos se conectará a la API próximamente.</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'

// Columnas (en español) — los datos vienen de la API:
// FROM DATE, TO DATE, PROJECT, VALUE, PAYMENT FRECUENCY,
// GET PAYMENT TYPE LONG NAME, VERSION.
const COLUMNAS = [
  { key: 'fecha_desde',      label: 'Fecha desde' },
  { key: 'fecha_hasta',      label: 'Fecha hasta' },
  { key: 'proyecto',         label: 'Proyecto' },
  { key: 'valor',            label: 'Valor',              right: true },
  { key: 'frecuencia_pago',  label: 'Frecuencia de pago' },
  { key: 'tipo_pago',        label: 'Tipo de pago' },
  { key: 'version',          label: 'Versión' },
]

const q = ref('')
const costos = ref([])   // se llenará con la API más adelante

const filtrados = computed(() => {
  const term = q.value.trim().toLowerCase()
  if (!term) return costos.value
  return costos.value.filter(d =>
    [d.proyecto, d.tipo_pago, d.frecuencia_pago, d.version]
      .filter(Boolean).some(v => String(v).toLowerCase().includes(term))
  )
})

function fmtNum(v) {
  if (v === null || v === undefined || v === '') return '—'
  const n = Number(v)
  if (Number.isNaN(n)) return String(v)
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(n)
}
</script>

<style scoped>
.field-label { @apply block text-xs font-medium text-gray-600 mb-1; }
</style>
