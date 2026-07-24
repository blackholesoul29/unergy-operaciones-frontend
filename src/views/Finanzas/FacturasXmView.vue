<template>
  <div class="space-y-4">
    <PageHeader title="Facturas de XM"
                subtitle="Facturas y documentos de XM por período">
      <template #actions>
        <Button label="Subir facturas" icon="pi pi-upload" size="small" @click="abrirSubida" />
      </template>
    </PageHeader>

    <!-- Input de archivos oculto -->
    <input ref="fileInput" type="file" multiple accept=".pdf,.xml,.zip" class="hidden"
           @change="onArchivosSeleccionados" />

    <!-- Dialog: Subir facturas -->
    <Dialog v-model:visible="subidaVisible" header="Subir facturas de XM" modal class="w-full max-w-lg">
      <div class="space-y-4 pt-1">
        <!-- Zona de selección -->
        <button type="button" class="dropzone" @click="seleccionarArchivos">
          <i class="pi pi-cloud-upload text-3xl" style="color:#915BD8" />
          <p class="text-sm font-semibold text-gray-700 mt-2">Seleccionar facturas</p>
          <p class="text-xs text-gray-400">PDF, XML o ZIP · puedes elegir varias</p>
        </button>

        <!-- Lista de cargas -->
        <div v-if="archivos.length" class="space-y-2 max-h-72 overflow-y-auto">
          <div v-for="a in archivos" :key="a.id"
               class="flex items-center gap-3 rounded-lg border px-3 py-2" style="border-color:#ECE7F2">
            <i class="pi pi-file text-sm shrink-0" style="color:#9b8fb0" />
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs font-medium text-gray-700 truncate">{{ a.nombre }}</span>
                <span class="text-[10px] text-gray-400 shrink-0">{{ fmtTamano(a.tamano) }}</span>
              </div>
              <!-- Barra de progreso -->
              <div class="mt-1 h-1.5 rounded-full overflow-hidden" style="background:#F1EAF9">
                <div class="h-full rounded-full transition-all duration-200"
                     :style="{ width: a.progreso + '%', background: a.estado === 'error' ? '#D64455' : '#915BD8' }" />
              </div>
            </div>
            <span class="shrink-0 w-16 text-right">
              <i v-if="a.estado === 'completado'" class="pi pi-check-circle" style="color:#10B981" />
              <i v-else-if="a.estado === 'error'" class="pi pi-times-circle" style="color:#D64455" />
              <span v-else class="text-[10px] text-gray-400">{{ a.progreso }}%</span>
            </span>
          </div>
        </div>

        <p class="text-[11px] text-gray-400">
          <i class="pi pi-info-circle mr-1" />
          El envío a la API de facturas se conectará próximamente.
        </p>

        <div class="flex justify-end gap-2 pt-1">
          <Button label="Cerrar" severity="secondary" size="small" @click="subidaVisible = false" />
          <Button label="Agregar más" icon="pi pi-plus" size="small" outlined @click="seleccionarArchivos" />
        </div>
      </div>
    </Dialog>

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
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
// import api from '@/api/client'   // habilitar al conectar el endpoint de subida

// ── Subir facturas (selección desde el navegador + progreso de carga) ─────────
const subidaVisible = ref(false)
const fileInput = ref(null)
const archivos = ref([])
let _seq = 0

function abrirSubida() {
  subidaVisible.value = true
}
function seleccionarArchivos() {
  fileInput.value?.click()
}
function onArchivosSeleccionados(e) {
  const files = Array.from(e.target.files || [])
  for (const f of files) {
    const item = { id: ++_seq, nombre: f.name, tamano: f.size, progreso: 0, estado: 'subiendo', file: f }
    archivos.value.push(item)
    subir(item.id)
  }
  e.target.value = ''   // permite volver a elegir el mismo archivo
  subidaVisible.value = true
}

// Carga: hoy simula el progreso para mostrar la experiencia. Cuando exista el
// endpoint, reemplazar por un POST real con onUploadProgress:
//   const fd = new FormData(); fd.append('file', item.file)
//   await api.post('/facturas-xm/upload', fd, {
//     onUploadProgress: (ev) => { item.progreso = Math.round((ev.loaded / ev.total) * 100) },
//   })
// Se muta el elemento vía el array reactivo (por id), no el objeto original,
// para que Vue detecte el cambio y actualice la barra.
function subir(id) {
  const timer = setInterval(() => {
    const item = archivos.value.find(a => a.id === id)
    if (!item) { clearInterval(timer); return }
    item.progreso = Math.min(100, item.progreso + 12)
    if (item.progreso >= 100) {
      clearInterval(timer)
      item.estado = 'completado'
    }
  }, 180)
}

function fmtTamano(bytes) {
  if (!bytes && bytes !== 0) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

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

.dropzone {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 22px 16px;
  border: 2px dashed #D9CCEE;
  border-radius: 12px;
  background: #FBF7FF;
  cursor: pointer;
  transition: border-color .15s, background .15s;
}
.dropzone:hover { border-color: #915BD8; background: #F4ECFC; }
</style>
