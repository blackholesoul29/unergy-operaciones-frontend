<template>
  <div class="space-y-4">
    <PageHeader title="Registros CND/ASIC" :subtitle="`${rowsMostrar.length} proyecto(s) en conexión`">
      <template #actions>
        <IconField class="flex-1 sm:flex-none">
          <InputIcon class="pi pi-search" />
          <InputText v-model="filtroTexto" placeholder="Buscar proyecto…" class="w-full sm:w-64" />
        </IconField>
        <Button label="Registrar" icon="pi pi-plus" size="small" @click="abrirNuevo"
          style="background:#915BD8; border-color:#915BD8;" />
      </template>
    </PageHeader>

    <div class="bg-white rounded-xl shadow-sm overflow-hidden" style="border:1px solid #e8e0f0;">
      <DataTable :value="rowsMostrar" :loading="loading" class="text-sm" rowHover
        :rows="50" paginator :rowsPerPageOptions="[25, 50, 100]"
        @row-click="irDetalle($event.data)">
        <template #empty>
          <div class="py-12 text-center text-sm" style="color:#9b89b5;">
            Sin registros. Usa «Registrar» para iniciar el seguimiento de un proyecto.
          </div>
        </template>

        <Column field="nombre_comercial" header="Proyecto" sortable>
          <template #body="{ data }">
            <div class="font-medium" style="color:#2C2039;">{{ data.nombre_comercial }}</div>
            <div class="text-xs" style="color:#9b89b5;">
              {{ [data.codigo_cnd, data.clasificacion_regulatoria, data.tecnologia, data.operador_red].filter(Boolean).join(' · ') || '—' }}
            </div>
          </template>
        </Column>

        <Column header="Avance" style="width:200px" sortable field="avance_pct">
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <div class="flex-1 rounded-full overflow-hidden" style="height:8px;background:#ECE7F2;">
                <div :style="`height:100%;width:${Math.min(100, data.avance_pct)}%;background:#915BD8;`"></div>
              </div>
              <span class="text-xs font-semibold" style="color:#6E3FB8;width:38px;text-align:right;">{{ data.avance_pct }}%</span>
            </div>
          </template>
        </Column>

        <Column header="Siguiente paso">
          <template #body="{ data }">
            <span v-if="data.siguiente_paso" class="text-xs" style="color:#2C2039;">
              <span class="font-mono font-semibold" style="color:#915BD8;">{{ data.siguiente_paso.codigo }}</span>
              — {{ data.siguiente_paso.descripcion }}
            </span>
            <span v-else class="text-xs"><Tag value="Completo" severity="success" class="text-xs" /></span>
          </template>
        </Column>

        <Column header="" style="width:150px">
          <template #body="{ data }">
            <div class="flex gap-1 justify-end items-center">
              <Tag v-if="data.alertas_pendientes" :value="`⚠ ${data.alertas_pendientes}`" severity="warn" class="text-xs" />
              <Tag v-if="data.bloqueos" :value="`⛔ ${data.bloqueos}`" severity="danger" class="text-xs" />
              <Button icon="pi pi-eye" text rounded size="small" @click.stop="irDetalle(data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Diálogo: Registrar (elige un Proyecto existente) -->
    <Dialog v-model:visible="dialogVisible" modal header="Nuevo registro de conexión" :style="{ width: '32rem' }">
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-semibold mb-1" style="color:#2C2039;">Proyecto de la plataforma *</label>
          <Select v-model="form.proyecto_id" :options="proyectosDisponibles" optionLabel="_label" optionValue="id"
            filter :loading="cargandoProyectos" placeholder="Selecciona un proyecto…" class="w-full"
            @filter="buscarProyectos" />
          <p class="text-xs mt-1" style="color:#9b89b5;">Solo aparecen proyectos que aún no tienen registro de conexión.</p>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold mb-1" style="color:#2C2039;">N° expediente</label>
            <InputText v-model="form.numero_expediente" class="w-full" />
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1" style="color:#2C2039;">ID requerimiento OR</label>
            <InputText v-model="form.id_requerimiento_or" class="w-full" />
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1" style="color:#2C2039;">Fecha conexión estimada</label>
            <input type="date" v-model="form.fecha_conexion_estimada" class="w-full border rounded px-2 py-1 text-sm" style="border-color:#e8e0f0;" />
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1" style="color:#2C2039;">Vigencia CREG 174 / ámbito</label>
            <input type="date" v-model="form.vigencia_aprobacion_conexion" class="w-full border rounded px-2 py-1 text-sm" style="border-color:#e8e0f0;" />
          </div>
        </div>
        <div class="flex gap-4">
          <label class="flex items-center gap-2 text-sm" style="color:#2C2039;">
            <Checkbox v-model="form.exporta" :binary="true" /> Exporta energía
          </label>
          <label class="flex items-center gap-2 text-sm" style="color:#2C2039;">
            <Checkbox v-model="form.comercializador_es_or" :binary="true" /> Comercializador es el OR
          </label>
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" text @click="dialogVisible = false" />
        <Button label="Crear" icon="pi pi-check" :loading="guardando" :disabled="!form.proyecto_id"
          @click="crear" style="background:#915BD8; border-color:#915BD8;" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'
import api from '@/api/client'

const router = useRouter()
const toast = useToast()

const loading = ref(false)
const rows = ref([])
const rowsMostrar = ref([])
const filtroTexto = ref('')

function filtrar() {
  const q = filtroTexto.value.trim().toLowerCase()
  rowsMostrar.value = q
    ? rows.value.filter(r => (r.nombre_comercial || '').toLowerCase().includes(q)
        || (r.codigo_cnd || '').toLowerCase().includes(q))
    : rows.value.slice()
}
watch([rows, filtroTexto], filtrar)

async function cargar() {
  loading.value = true
  try {
    const { data } = await api.get('/registros-cnd')
    rows.value = data
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error al cargar', detail: e.response?.data?.detail ?? '', life: 5000 })
  } finally {
    loading.value = false
  }
}

function irDetalle(row) {
  router.push(`/registros-cnd-asic/${row.id}`)
}

// --- Diálogo Registrar ---
const dialogVisible = ref(false)
const guardando = ref(false)
const cargandoProyectos = ref(false)
const proyectosDisponibles = ref([])
const form = ref(formInicial())

function formInicial() {
  return {
    proyecto_id: null,
    numero_expediente: '',
    id_requerimiento_or: '',
    fecha_conexion_estimada: '',
    vigencia_aprobacion_conexion: '',
    exporta: false,
    comercializador_es_or: false,
  }
}

async function buscarProyectos(ev) {
  const q = ev?.value ?? ''
  cargandoProyectos.value = true
  try {
    const { data } = await api.get('/registros-cnd/proyectos-disponibles', { params: q ? { q } : {} })
    proyectosDisponibles.value = data.map(p => ({ ...p, _label: p.codigo_cnd ? `${p.codigo_cnd} · ${p.nombre_comercial}` : p.nombre_comercial }))
  } finally {
    cargandoProyectos.value = false
  }
}

function abrirNuevo() {
  form.value = formInicial()
  proyectosDisponibles.value = []
  dialogVisible.value = true
  buscarProyectos()
}

async function crear() {
  guardando.value = true
  try {
    const payload = { ...form.value }
    // limpiar vacíos (el backend acepta null/omitido)
    Object.keys(payload).forEach(k => { if (payload[k] === '' ) payload[k] = null })
    const { data } = await api.post('/registros-cnd', payload)
    dialogVisible.value = false
    toast.add({ severity: 'success', summary: 'Registro creado', life: 3000 })
    router.push(`/registros-cnd-asic/${data.id}`)
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo crear', detail: e.response?.data?.detail ?? '', life: 6000 })
  } finally {
    guardando.value = false
  }
}

onMounted(cargar)
</script>
