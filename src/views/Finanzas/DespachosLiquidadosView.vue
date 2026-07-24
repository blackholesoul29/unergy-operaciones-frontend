<template>
  <div class="space-y-4">
    <PageHeader title="Despachos liquidados"
                subtitle="Despachos de energía liquidados por contrato">
      <template #actions>
        <Button label="Consultar IPP" icon="pi pi-percentage" size="small" outlined @click="abrirIpp" />
        <Button label="Consultar FTP y liquidar" icon="pi pi-bolt" size="small" @click="abrirFtp" />
      </template>
    </PageHeader>

    <!-- Filtro de búsqueda -->
    <div class="bg-white rounded-xl shadow-sm p-3 flex flex-wrap gap-3 items-end border" style="border-color:#ECE7F2">
      <div>
        <label class="field-label">Buscar</label>
        <IconField>
          <InputIcon class="pi pi-search" />
          <InputText v-model="q" placeholder="Contrato, proyecto, tipo…" class="w-72" />
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
              <td class="px-4 py-2 whitespace-nowrap">{{ row.fecha || '—' }}</td>
              <td class="px-4 py-2 text-right font-mono text-xs">{{ fmtNum(row.energia) }}</td>
              <td class="px-4 py-2 text-right font-mono text-xs">{{ fmtNum(row.precio) }}</td>
              <td class="px-4 py-2 whitespace-nowrap">{{ row.tipo_dato || '—' }}</td>
              <td class="px-4 py-2">{{ row.contrato_energia_proyecto || '—' }}</td>
              <td class="px-4 py-2 whitespace-nowrap">{{ row.version || '—' }}</td>
            </tr>
            <tr v-if="!filtrados.length">
              <td :colspan="COLUMNAS.length" class="px-4 py-12 text-center text-sm text-gray-400">
                <i class="pi pi-bolt text-2xl mb-2 block text-gray-300" />
                Aún no hay despachos liquidados.<br>
                <span class="text-xs">La carga de datos se conectará a la API próximamente.</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Dialog: Consultar IPP / Consultar FTP y liquidar -->
    <Dialog v-model:visible="dialogVisible" :header="modo === 'ftp' ? 'Consultar FTP y liquidar' : 'Consultar IPP'"
            modal class="w-full max-w-sm">
      <form @submit.prevent="consultar" class="space-y-4 pt-1">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="field-label">Mes</label>
            <InputNumber v-model="c.mes" :min="1" :max="12" :useGrouping="false" class="w-full" placeholder="1–12" />
          </div>
          <div>
            <label class="field-label">Año</label>
            <InputNumber v-model="c.anio" :useGrouping="false" class="w-full" placeholder="ej: 2026" />
          </div>
        </div>
        <div v-if="modo === 'ftp'">
          <label class="field-label">Versión</label>
          <Select v-model="c.version" :options="VERSIONES" class="w-full" placeholder="Seleccionar" />
        </div>
        <div class="flex justify-end gap-2 pt-1">
          <Button type="button" label="Cancelar" severity="secondary" @click="dialogVisible = false" />
          <Button type="submit" :label="modo === 'ftp' ? 'Consultar y liquidar' : 'Consultar'" icon="pi pi-check" />
        </div>
      </form>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import { useToast } from 'primevue/usetoast'

const toast = useToast()

// Versiones de liquidación XM (solo aplica a "Consultar FTP y liquidar").
const VERSIONES = ['TXF', 'TX1', 'TX2', 'TX3', 'TX4', 'TX5', 'TX6', 'TX7', 'TX8']

// ── Consulta (IPP: mes+año · FTP: mes+año+versión) ────────────────────────────
const dialogVisible = ref(false)
const modo = ref('ipp')          // 'ipp' | 'ftp'
const c = reactive({ mes: null, anio: null, version: null })

function abrirIpp() {
  modo.value = 'ipp'
  Object.assign(c, { mes: null, anio: null, version: null })
  dialogVisible.value = true
}
function abrirFtp() {
  modo.value = 'ftp'
  Object.assign(c, { mes: null, anio: null, version: null })
  dialogVisible.value = true
}
function consultar() {
  if (c.mes == null || c.anio == null || (modo.value === 'ftp' && !c.version)) {
    toast.add({ severity: 'warn', summary: 'Faltan campos', detail: 'Completa mes, año' + (modo.value === 'ftp' ? ' y versión.' : '.'), life: 4000 })
    return
  }
  toast.add({
    severity: 'info',
    summary: modo.value === 'ftp' ? 'Consulta FTP lista' : 'Consulta IPP lista',
    detail: 'Se conectará a la API próximamente.',
    life: 4500,
  })
  dialogVisible.value = false
}

// Columnas (en español) — los datos vienen de la API:
// DATE, ENERGY, PRICE, DATA TYPE, CONTRACT ENERGY PROJECT, VERSION.
const COLUMNAS = [
  { key: 'fecha',                       label: 'Fecha' },
  { key: 'energia',                     label: 'Energía',                       right: true },
  { key: 'precio',                      label: 'Precio',                        right: true },
  { key: 'tipo_dato',                   label: 'Tipo de dato' },
  { key: 'contrato_energia_proyecto',   label: 'Proyecto contrato de energía' },
  { key: 'version',                     label: 'Versión' },
]

const q = ref('')
const despachos = ref([])   // se llenará con la API más adelante

const filtrados = computed(() => {
  const term = q.value.trim().toLowerCase()
  if (!term) return despachos.value
  return despachos.value.filter(d =>
    [d.contrato_energia_proyecto, d.tipo_dato, d.version, d.fecha]
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
