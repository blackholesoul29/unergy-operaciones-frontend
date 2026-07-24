<template>
  <div class="space-y-4">
    <PageHeader title="Verificación de costos"
                subtitle="Edita los costos por proyecto · GD y minigranjas en operación" />

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
        {{ filas.length }} proyecto{{ filas.length === 1 ? '' : 's' }}
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
              <th class="px-4 py-2.5" style="width:70px"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="fila in filas" :key="fila.proyecto_id"
                class="border-t border-gray-100 hover:bg-gray-50/70 transition-colors duration-100">
              <td class="px-4 py-2">{{ fila.proyecto_nombre }}</td>
              <td class="px-4 py-2 text-right font-mono text-xs">{{ fmtNum(fila.costos_generador) }}</td>
              <td class="px-4 py-2 text-right font-mono text-xs">{{ fmtNum(fila.costos_comercializador) }}</td>
              <td class="px-4 py-2 text-right font-mono text-xs">{{ fmtNum(fila.ac_power) }}</td>
              <td class="px-4 py-2">
                <div class="flex justify-end">
                  <Button icon="pi pi-pencil" text rounded size="small" severity="info"
                          v-tooltip.left="'Editar valores'" @click="abrirEditar(fila)" />
                </div>
              </td>
            </tr>
            <tr v-if="!filas.length">
              <td colspan="5" class="px-4 py-12 text-center text-sm text-gray-400">
                <i class="pi pi-check-square text-2xl mb-2 block text-gray-300" />
                No hay proyectos GD/minigranja en operación.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Dialog: editar valores de la fila -->
    <Dialog v-model:visible="formVisible" header="Editar verificación de costos" modal class="w-full max-w-md">
      <form @submit.prevent="guardar" class="space-y-4 pt-1">
        <div class="text-sm font-medium text-gray-700 pb-1">{{ f.proyecto_nombre }}</div>
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
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import { useToast } from 'primevue/usetoast'
import api from '@/api/client'
import { formatearNombreProyecto } from '@/views/Proyectos/proyectosUi'

const toast = useToast()

// Filas = proyectos GD + minigranja en operación (mismo criterio que las
// demás vistas). Cada fila muestra los valores guardados (si existen) y se
// editan en sitio; no se crean filas nuevas.
const TIPOS_INCLUIDOS = ['gd', 'minigranja']
const ESTADO_OPERATIVA = 'en_operacion'

const q = ref('')
const loading = ref(true)
const proyectos = ref([])
const registros = ref([])   // verificacion_costos existentes, por proyecto

const filas = computed(() => {
  const term = q.value.trim().toLowerCase()
  const porProy = new Map(registros.value.map(r => [r.proyecto_id, r]))
  return proyectos.value
    .filter(p => TIPOS_INCLUIDOS.includes(p.tipo_proyecto) && p.estado === ESTADO_OPERATIVA)
    .map(p => {
      const rec = porProy.get(p.id)
      return {
        proyecto_id: p.id,
        proyecto_nombre: formatearNombreProyecto(p.nombre_comercial),
        record_id: rec?.id ?? null,
        costos_generador: rec?.costos_generador ?? null,
        costos_comercializador: rec?.costos_comercializador ?? null,
        ac_power: rec?.ac_power ?? null,
      }
    })
    .filter(f => !term || f.proyecto_nombre.toLowerCase().includes(term))
    .sort((a, b) => a.proyecto_nombre.localeCompare(b.proyecto_nombre))
})

function fmtNum(v) {
  if (v === null || v === undefined || v === '') return '—'
  const n = Number(v)
  if (Number.isNaN(n)) return String(v)
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(n)
}

// ── Editar valores ───────────────────────────────────────────────────────────
const formVisible = ref(false)
const guardando = ref(false)
const f = reactive({ record_id: null, proyecto_id: null, proyecto_nombre: '', costos_generador: null, costos_comercializador: null, ac_power: null })

function abrirEditar(fila) {
  Object.assign(f, {
    record_id: fila.record_id, proyecto_id: fila.proyecto_id, proyecto_nombre: fila.proyecto_nombre,
    costos_generador: fila.costos_generador, costos_comercializador: fila.costos_comercializador, ac_power: fila.ac_power,
  })
  formVisible.value = true
}

async function guardar() {
  guardando.value = true
  try {
    const payload = {
      costos_generador: f.costos_generador,
      costos_comercializador: f.costos_comercializador,
      ac_power: f.ac_power,
    }
    if (f.record_id) {
      await api.patch(`/verificacion-costos/${f.record_id}`, payload)
    } else {
      // Primera edición del proyecto: crea su registro (transparente para el usuario).
      await api.post('/verificacion-costos', { proyecto_id: f.proyecto_id, ...payload })
    }
    formVisible.value = false
    await loadRegistros()
    toast.add({ severity: 'success', summary: 'Costos guardados', life: 2000 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.detail || 'No se pudo guardar', life: 4000 })
  } finally {
    guardando.value = false
  }
}

// ── Carga ──────────────────────────────────────────────────────────────────────
async function loadRegistros() {
  const { data } = await api.get('/verificacion-costos')
  registros.value = Array.isArray(data) ? data : (data.items ?? [])
}
async function loadProyectos() {
  const { data } = await api.get('/proyectos', { params: { page: 1, size: 500 } })
  proyectos.value = data.items ?? data
}

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([loadProyectos(), loadRegistros()])
  } catch { /* graceful degrade */ }
  finally { loading.value = false }
})
</script>

<style scoped>
.field-label { @apply block text-xs font-medium text-gray-600 mb-1; }
</style>
