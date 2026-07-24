<template>
  <div class="space-y-4">
    <PageHeader title="Costos comercialización"
                subtitle="Costos de comercialización por proyecto">
      <template #actions>
        <Button label="Subir Excel costos" icon="pi pi-file-excel" size="small" outlined @click="abrirSubirExcel" />
        <Button label="Ingresar AC Power" icon="pi pi-bolt" size="small" @click="abrirAcPower" />
      </template>
    </PageHeader>

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

    <!-- Dialog: Ingresar AC Power de XM -->
    <Dialog v-model:visible="acVisible" header="Ingresar AC Power de XM" modal class="w-full max-w-md">
      <form @submit.prevent="guardarAcPower" class="space-y-4 pt-1">
        <p class="text-xs text-gray-500">
          Crea automáticamente los registros de ingresos (revenue) y costos (costs) del período.
        </p>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="field-label">Mes</label>
            <InputNumber v-model="ac.month" :min="1" :max="12" :useGrouping="false" class="w-full" placeholder="1–12" />
          </div>
          <div>
            <label class="field-label">Año</label>
            <InputNumber v-model="ac.year" :useGrouping="false" class="w-full" placeholder="ej: 2026" />
          </div>
        </div>
        <div>
          <label class="field-label">Nueva versión</label>
          <InputText v-model="ac.new_version" class="w-full" placeholder="ej: TXF, TX3…" />
        </div>
        <div>
          <label class="field-label">Total AC Power</label>
          <InputNumber v-model="ac.total_ac_power" :maxFractionDigits="4" :useGrouping="false" class="w-full" placeholder="ej: 12345.6789" />
        </div>
        <div class="flex items-center gap-2">
          <Checkbox v-model="ac.sobreescribir" :binary="true" inputId="ac-sobreescribir" />
          <label for="ac-sobreescribir" class="text-sm text-gray-600 cursor-pointer">Sobreescribir</label>
          <span class="text-[11px] text-gray-400">(reemplaza los registros del período si ya existen)</span>
        </div>
        <div class="flex justify-end gap-2 pt-1">
          <Button type="button" label="Cancelar" severity="secondary" @click="acVisible = false" />
          <Button type="submit" label="Ingresar" icon="pi pi-check" />
        </div>
      </form>
    </Dialog>

    <!-- Input Excel oculto -->
    <input ref="excelInput" type="file" accept=".xlsx,.xls" class="hidden" @change="onExcelSeleccionado" />

    <!-- Dialog: Subir Excel de costos -->
    <Dialog v-model:visible="excelVisible" header="Subir Excel de costos" modal class="w-full max-w-lg">
      <div class="space-y-4 pt-1">
        <button type="button" class="dropzone" @click="seleccionarExcel">
          <i class="pi pi-file-excel text-3xl" style="color:#1D6F42" />
          <p class="text-sm font-semibold text-gray-700 mt-2">Seleccionar Excel de costos</p>
          <p class="text-xs text-gray-400">Formato .xlsx o .xls</p>
        </button>

        <div v-if="excel" class="flex items-center gap-3 rounded-lg border px-3 py-2" style="border-color:#ECE7F2">
          <i class="pi pi-file-excel text-sm shrink-0" style="color:#1D6F42" />
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs font-medium text-gray-700 truncate">{{ excel.nombre }}</span>
              <span class="text-[10px] text-gray-400 shrink-0">{{ fmtTamano(excel.tamano) }}</span>
            </div>
            <div class="mt-1 h-1.5 rounded-full overflow-hidden" style="background:#F1EAF9">
              <div class="h-full rounded-full transition-all duration-200"
                   :style="{ width: excel.progreso + '%', background: excel.estado === 'error' ? '#D64455' : '#915BD8' }" />
            </div>
          </div>
          <span class="shrink-0 w-16 text-right">
            <i v-if="excel.estado === 'completado'" class="pi pi-check-circle" style="color:#10B981" />
            <span v-else class="text-[10px] text-gray-400">{{ excel.progreso }}%</span>
          </span>
        </div>

        <p class="text-[11px] text-gray-400">
          <i class="pi pi-info-circle mr-1" />
          El envío del Excel a la API se conectará próximamente.
        </p>

        <div class="flex justify-end gap-2 pt-1">
          <Button label="Cerrar" severity="secondary" size="small" @click="excelVisible = false" />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Checkbox from 'primevue/checkbox'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import { useToast } from 'primevue/usetoast'

const toast = useToast()

// AC Power de XM
// ── Ingresar AC Power de XM (crea revenue + costs automáticamente) ────────────
// Frontend envía: month:int, year:int, new_version:string, total_ac_power:float
const acVisible = ref(false)
const ac = reactive({ month: null, year: null, new_version: '', total_ac_power: null, sobreescribir: false })

function abrirAcPower() {
  Object.assign(ac, { month: null, year: null, new_version: '', total_ac_power: null, sobreescribir: false })
  acVisible.value = true
}
// ── Subir Excel de costos (selección + progreso · se enviará por API) ─────────
const excelVisible = ref(false)
const excelInput = ref(null)
const excel = ref(null)

function abrirSubirExcel() {
  excelVisible.value = true
}
function seleccionarExcel() {
  excelInput.value?.click()
}
function onExcelSeleccionado(e) {
  const f = (e.target.files || [])[0]
  e.target.value = ''
  if (!f) return
  excel.value = { nombre: f.name, tamano: f.size, progreso: 0, estado: 'subiendo', file: f }
  // Simula la carga; al conectar la API reemplazar por:
  //   const fd = new FormData(); fd.append('file', f)
  //   await api.post('/costos-comercializacion/upload-excel', fd,
  //     { onUploadProgress: (ev) => { excel.value.progreso = Math.round(ev.loaded/ev.total*100) } })
  const timer = setInterval(() => {
    if (!excel.value) { clearInterval(timer); return }
    excel.value.progreso = Math.min(100, excel.value.progreso + 12)
    if (excel.value.progreso >= 100) { clearInterval(timer); excel.value.estado = 'completado' }
  }, 180)
}
function fmtTamano(bytes) {
  if (!bytes && bytes !== 0) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function guardarAcPower() {
  if (ac.month == null || ac.year == null || !ac.new_version || ac.total_ac_power == null) {
    toast.add({ severity: 'warn', summary: 'Faltan campos', detail: 'Completa mes, año, nueva versión y total AC Power.', life: 4000 })
    return
  }
  toast.add({
    severity: 'info',
    summary: 'AC Power listo para enviar',
    detail: 'Se conectará a la API próximamente (creará ingresos y costos automáticamente).',
    life: 4500,
  })
  acVisible.value = false
}

// Columnas (en español) — los datos vienen de la API:
// FROM DATE, TO DATE, PROJECT, VALUE, PAYMENT FRECUENCY,
// GET PAYMENT TYPE LONG NAME, VERSION.
const COLUMNAS = [
  { key: 'fecha_desde',      label: 'Fecha desde' },
  { key: 'fecha_hasta',      label: 'Fecha hasta' },
  { key: 'proyecto',         label: 'Proyecto' },
  { key: 'valor',            label: 'Valor',              right: true },
  { key: 'frecuencia_pago',  label: 'Frecuencia de pago' },
  { key: 'tipo_pago',        label: 'Costo' },
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
