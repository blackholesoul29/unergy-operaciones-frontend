<template>
  <div class="space-y-4">
    <PageHeader title="Registros" :subtitle="`${filas.length} proyecto(s)`">
      <template #actions>
        <IconField class="flex-1 sm:flex-none">
          <InputIcon class="pi pi-search" />
          <InputText v-model="filtro" placeholder="Buscar proyecto…" class="w-full sm:w-64" />
        </IconField>
      </template>
    </PageHeader>

    <p class="text-xs" style="color:#9b89b5;">
      Expediente documental de cada proyecto: los 28 ítems del proceso SIC y los 10 del proceso CND.
      Los datos que se repiten entre documentos se diligencian una sola vez.
    </p>

    <div class="bg-white rounded-xl shadow-sm overflow-hidden" style="border:1px solid #e8e0f0;">
      <DataTable :value="filas" :loading="cargando" class="text-sm" rowHover
        :rows="50" paginator :rowsPerPageOptions="[25, 50, 100]"
        @row-click="abrir($event.data)">
        <template #empty>
          <div class="py-12 text-center text-sm" style="color:#9b89b5;">Sin proyectos.</div>
        </template>

        <Column field="nombre_comercial" header="Proyecto" sortable>
          <template #body="{ data }">
            <div class="font-medium" style="color:#2C2039;">{{ data.nombre_comercial }}</div>
            <div class="text-xs" style="color:#9b89b5;">
              {{ data.codigo_cnd || '—' }}
              · {{ data.parametros_diligenciados }} dato(s) diligenciado(s)
            </div>
          </template>
        </Column>

        <Column header="SIC / ASIC" style="width:210px" sortable field="sic.pct">
          <template #body="{ data }"><BarraAvance :avance="data.sic" /></template>
        </Column>

        <Column header="CND" style="width:210px" sortable field="cnd.pct">
          <template #body="{ data }"><BarraAvance :avance="data.cnd" /></template>
        </Column>

        <Column header="" style="width:60px">
          <template #body="{ data }">
            <div class="flex justify-end">
              <Button icon="pi pi-eye" text rounded size="small" @click.stop="abrir(data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import api from '@/api/client'

// Barra de avance por proceso. Va inline porque solo la usa esta tabla; si
// hiciera falta en otra vista, se saca a components/.
const BarraAvance = (props) => {
  const a = props.avance || { pct: 0, cargados: 0, total: 0 }
  return h('div', { class: 'flex items-center gap-2' }, [
    h('div', { class: 'flex-1 rounded-full overflow-hidden', style: 'height:8px;background:#ECE7F2;' }, [
      h('div', { style: `height:100%;width:${Math.min(100, a.pct)}%;background:#915BD8;` }),
    ]),
    h('span', { class: 'text-xs font-semibold', style: 'color:#6E3FB8;width:56px;text-align:right;' },
      `${a.cargados}/${a.total}`),
  ])
}
BarraAvance.props = ['avance']

const router = useRouter()
const toast = useToast()

const cargando = ref(false)
const proyectos = ref([])
const filtro = ref('')

const filas = computed(() => {
  const q = filtro.value.trim().toLowerCase()
  if (!q) return proyectos.value
  return proyectos.value.filter(p =>
    (p.nombre_comercial || '').toLowerCase().includes(q) ||
    (p.codigo_cnd || '').toLowerCase().includes(q))
})

async function cargar() {
  cargando.value = true
  try {
    const { data } = await api.get('/registros-proyecto')
    proyectos.value = data
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error al cargar', detail: e.response?.data?.detail ?? '', life: 5000 })
  } finally {
    cargando.value = false
  }
}

function abrir(fila) {
  router.push(`/registros/${fila.proyecto_id}`)
}

onMounted(cargar)
</script>
