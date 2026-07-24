<template>
  <div class="space-y-4">
    <PageHeader title="Facturas de XM"
                subtitle="Facturas y documentos de XM por período" />

    <!-- Filtro de búsqueda -->
    <div class="bg-white rounded-xl shadow-sm p-3 flex flex-wrap gap-3 items-end border" style="border-color:#ECE7F2">
      <div>
        <label class="field-label">Buscar</label>
        <IconField>
          <InputIcon class="pi pi-search" />
          <InputText v-model="q" placeholder="Código, nombre, agente…" class="w-72" />
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
                  :class="col.center ? 'text-center' : 'text-left'">
                {{ col.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in filtrados" :key="i"
                class="border-t border-gray-100 hover:bg-gray-50/70 transition-colors duration-100">
              <td class="px-4 py-2 font-mono text-xs">{{ row.id ?? '—' }}</td>
              <td class="px-4 py-2 whitespace-nowrap">{{ row.version || '—' }}</td>
              <td class="px-4 py-2 font-mono text-xs">{{ row.codigo || '—' }}</td>
              <td class="px-4 py-2">{{ row.nombre || '—' }}</td>
              <td class="px-4 py-2 whitespace-nowrap">{{ row.agente || '—' }}</td>
              <td class="px-4 py-2 whitespace-nowrap">{{ row.mes || '—' }}</td>
              <td class="px-4 py-2 whitespace-nowrap">{{ row.anio || '—' }}</td>
              <td class="px-4 py-2 whitespace-nowrap">{{ row.estado_procesamiento || '—' }}</td>
              <td class="px-4 py-2 text-center">
                <i v-if="row.total_valido" class="pi pi-check-circle" style="color:#10B981" />
                <i v-else class="pi pi-times-circle" style="color:#D64455" />
              </td>
            </tr>
            <tr v-if="!filtrados.length">
              <td :colspan="COLUMNAS.length" class="px-4 py-12 text-center text-sm text-gray-400">
                <i class="pi pi-file-check text-2xl mb-2 block text-gray-300" />
                Aún no hay facturas de XM.<br>
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
// ID, VERSION, CODIGO, NOMBRE, AGENTE, MONTH, YEAR, PROCESSING STATUS, TOTAL VÁLIDO.
const COLUMNAS = [
  { key: 'id',                    label: 'ID' },
  { key: 'version',               label: 'Versión' },
  { key: 'codigo',                label: 'Código' },
  { key: 'nombre',                label: 'Nombre' },
  { key: 'agente',                label: 'Agente' },
  { key: 'mes',                   label: 'Mes' },
  { key: 'anio',                  label: 'Año' },
  { key: 'estado_procesamiento',  label: 'Estado de procesamiento' },
  { key: 'total_valido',          label: 'Total válido', center: true },
]

const q = ref('')
const facturas = ref([])   // se llenará con la API más adelante

const filtrados = computed(() => {
  const term = q.value.trim().toLowerCase()
  if (!term) return facturas.value
  return facturas.value.filter(d =>
    [d.codigo, d.nombre, d.agente, d.version, d.estado_procesamiento]
      .filter(Boolean).some(v => String(v).toLowerCase().includes(term))
  )
})
</script>

<style scoped>
.field-label { @apply block text-xs font-medium text-gray-600 mb-1; }
</style>
