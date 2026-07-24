<template>
  <div class="space-y-4">
    <PageHeader title="Verificación de costos"
                subtitle="Costos por proyecto: generador vs comercializador y AC Power">
      <template #actions>
        <Button label="Nueva verificación" icon="pi pi-plus" size="small" @click="abrirNuevo" />
      </template>
    </PageHeader>

    <!-- Filtro de búsqueda -->
    <div class="bg-white rounded-xl shadow-sm p-3 flex flex-wrap gap-3 items-end border" style="border-color:#ECE7F2">
      <div>
        <label class="field-label">Buscar</label>
        <IconField>
          <InputIcon class="pi pi-search" />
          <InputText v-model="q" placeholder="Proyecto…" class="w-64" />
        </IconField>
      </div>
      <div class="flex-1" />
      <div class="text-xs text-gray-400 self-center">
        {{ filtrados.length }} proyecto{{ filtrados.length === 1 ? '' : 's' }}
      </div>
    </div>

    <!-- Tabla -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden border" style="border-color:#ECE7F2">
      <div v-if="loading" class="p-10 flex justify-center">
        <i class="pi pi-spin pi-spinner text-2xl text-gray-400" />
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100">
              <th class="px-4 py-2.5 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Proyecto</th>
              <th class="px-4 py-2.5 text-right font-medium text-gray-500 text-xs uppercase tracking-wide">Costos generador</th>
              <th class="px-4 py-2.5 text-right font-medium text-gray-500 text-xs uppercase tracking-wide">Costos comercializador</th>
              <th class="px-4 py-2.5 text-right font-medium text-gray-500 text-xs uppercase tracking-wide">AC Power</th>
              <th class="px-4 py-2.5" style="width:90px"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filtrados" :key="row.id"
                class="border-t border-gray-100 hover:bg-gray-50/70 transition-colors duration-100">
              <td class="px-4 py-2">{{ row.proyecto_nombre || '—' }}</td>
              <td class="px-4 py-2 text-right font-mono text-xs">{{ fmtNum(row.costos_generador) }}</td>
              <td class="px-4 py-2 text-right font-mono text-xs">{{ fmtNum(row.costos_comercializador) }}</td>
              <td class="px-4 py-2 text-right font-mono text-xs">{{ fmtNum(row.ac_power) }}</td>
              <td class="px-4 py-2">
                <div class="flex gap-0.5 justify-end">
                  <Button icon="pi pi-pencil" text rounded size="small" severity="info"
                          v-tooltip.left="'Editar'" @click="abrirEditar(row)" />
                  <Button icon="pi pi-trash" text rounded size="small" severity="danger"
                          v-tooltip.left="'Eliminar'" @click="eliminar(row)" />
                </div>
              </td>
            </tr>
            <tr v-if="!filtrados.length">
              <td colspan="5" class="px-4 py-12 text-center text-sm text-gray-400">
                <i class="pi pi-check-square text-2xl mb-2 block text-gray-300" />
                Aún no hay costos para verificar.<br>
                <span class="text-xs">Agrega una verificación con el botón de arriba.</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Dialog: crear / editar verificación -->
    <Dialog v-model:visible="formVisible" :header="editando ? 'Editar verificación' : 'Nueva verificación'"
            modal class="w-full max-w-md">
      <form @submit.prevent="guardar" class="space-y-4 pt-1">
        <div>
          <label class="field-label">Proyecto</label>
          <Select v-if="!editando" v-model="f.proyecto_id" :options="proyectosDisponibles"
                  optionLabel="nombre_comercial" optionValue="id" class="w-full"
                  placeholder="Seleccionar proyecto" filter />
          <div v-else class="text-sm font-medium text-gray-700 py-2">{{ f.proyecto_nombre }}</div>
        </div>
        <div>
          <label class="field-label">Costos generador</label>
          <InputNumber v-model="f.costos_generador" :maxFractionDigits="2" class="w-full" placeholder="ej: 1500000" />
        </div>
        <div>
          <label class="field-label">Costos comercializador</label>
          <InputNumber v-model="f.costos_comercializador" :maxFractionDigits="2" class="w-full" placeholder="ej: 800000" />
        </div>
        <div>
          <label class="field-label">AC Power</label>
          <InputNumber v-model="f.ac_power" :maxFractionDigits="4" :useGrouping="false" class="w-full" placeholder="ej: 1234.56" />
        </div>
        <div class="flex justify-end gap-2 pt-1">
          <Button type="button" label="Cancelar" severity="secondary" @click="formVisible = false" />
          <Button type="submit" label="Guardar" icon="pi pi-check" :loading="guardando" />
        </div>
      </form>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import { useToast } from 'primevue/usetoast'
import api from '@/api/client'

const toast = useToast()

const q = ref('')
const loading = ref(true)
const registros = ref([])
const proyectos = ref([])

const filtrados = computed(() => {
  const term = q.value.trim().toLowerCase()
  if (!term) return registros.value
  return registros.value.filter(d => (d.proyecto_nombre || '').toLowerCase().includes(term))
})

// Al crear, solo proyectos que aún no tienen verificación (es única por proyecto).
const proyectosDisponibles = computed(() => {
  const usados = new Set(registros.value.map(r => r.proyecto_id))
  return proyectos.value.filter(p => !usados.has(p.id))
})

function fmtNum(v) {
  if (v === null || v === undefined || v === '') return '—'
  const n = Number(v)
  if (Number.isNaN(n)) return String(v)
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(n)
}

// ── Formulario ───────────────────────────────────────────────────────────────
const formVisible = ref(false)
const editando = ref(false)
const guardando = ref(false)
const f = reactive({ id: null, proyecto_id: null, proyecto_nombre: '', costos_generador: null, costos_comercializador: null, ac_power: null })

function abrirNuevo() {
  editando.value = false
  Object.assign(f, { id: null, proyecto_id: null, proyecto_nombre: '', costos_generador: null, costos_comercializador: null, ac_power: null })
  formVisible.value = true
}
function abrirEditar(row) {
  editando.value = true
  Object.assign(f, {
    id: row.id, proyecto_id: row.proyecto_id, proyecto_nombre: row.proyecto_nombre,
    costos_generador: row.costos_generador, costos_comercializador: row.costos_comercializador, ac_power: row.ac_power,
  })
  formVisible.value = true
}

async function guardar() {
  if (!editando.value && !f.proyecto_id) {
    toast.add({ severity: 'warn', summary: 'Selecciona un proyecto', life: 3000 })
    return
  }
  guardando.value = true
  try {
    const payload = {
      costos_generador: f.costos_generador,
      costos_comercializador: f.costos_comercializador,
      ac_power: f.ac_power,
    }
    if (editando.value) {
      await api.patch(`/verificacion-costos/${f.id}`, payload)
    } else {
      await api.post('/verificacion-costos', { proyecto_id: f.proyecto_id, ...payload })
    }
    formVisible.value = false
    await load()
    toast.add({ severity: 'success', summary: editando.value ? 'Verificación actualizada' : 'Verificación creada', life: 2000 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.detail || 'No se pudo guardar', life: 4000 })
  } finally {
    guardando.value = false
  }
}

async function eliminar(row) {
  if (!confirm(`¿Eliminar la verificación de ${row.proyecto_nombre}?`)) return
  try {
    await api.delete(`/verificacion-costos/${row.id}`)
    await load()
    toast.add({ severity: 'success', summary: 'Verificación eliminada', life: 2000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar', life: 3000 })
  }
}

// ── Carga ──────────────────────────────────────────────────────────────────────
async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/verificacion-costos')
    registros.value = Array.isArray(data) ? data : (data.items ?? [])
  } catch {
    registros.value = []
  } finally {
    loading.value = false
  }
}
async function loadProyectos() {
  try {
    const { data } = await api.get('/proyectos', { params: { page: 1, size: 500 } })
    proyectos.value = data.items ?? data
  } catch { /* graceful degrade */ }
}

onMounted(() => { load(); loadProyectos() })
</script>

<style scoped>
.field-label { @apply block text-xs font-medium text-gray-600 mb-1; }
</style>
