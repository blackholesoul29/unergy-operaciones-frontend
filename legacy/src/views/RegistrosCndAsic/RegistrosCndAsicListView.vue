<template>
  <div class="space-y-4">
    <PageHeader title="Registros CND/ASIC" :subtitle="`${rowsMostrar.length} proyecto(s)`">
      <template #actions>
        <IconField class="flex-1 sm:flex-none">
          <InputIcon class="pi pi-search" />
          <InputText v-model="filtroTexto" placeholder="Buscar proyecto…" class="w-full sm:w-64" />
        </IconField>
      </template>
    </PageHeader>

    <p class="text-xs" style="color: #9b89b5">
      Aparecen todos los proyectos de la plataforma. Abre uno para ir llenando su información; su
      seguimiento se inicia automáticamente con todos los hitos en pendiente.
    </p>

    <div class="overflow-hidden rounded-xl bg-white shadow-sm" style="border: 1px solid #e8e0f0">
      <DataTable
        :value="rowsMostrar"
        :loading="loading"
        class="text-sm"
        rowHover
        :rows="50"
        paginator
        :rowsPerPageOptions="[25, 50, 100]"
        @row-click="irDetalle($event.data)"
      >
        <template #empty>
          <div class="py-12 text-center text-sm" style="color: #9b89b5">Sin proyectos.</div>
        </template>

        <Column field="nombre_comercial" header="Proyecto" sortable>
          <template #body="{ data }">
            <div class="font-medium" style="color: #2c2039">{{ data.nombre_comercial }}</div>
            <div class="text-xs" style="color: #9b89b5">
              {{
                [
                  data.codigo_cnd,
                  data.clasificacion_regulatoria,
                  data.tecnologia,
                  data.operador_red,
                ]
                  .filter(Boolean)
                  .join(' · ') || '—'
              }}
            </div>
          </template>
        </Column>

        <Column header="Avance" style="width: 200px" sortable field="avance_pct">
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <div
                class="flex-1 overflow-hidden rounded-full"
                style="height: 8px; background: #ece7f2"
              >
                <div
                  :style="`height:100%;width:${Math.min(100, data.avance_pct)}%;background:#915BD8;`"
                ></div>
              </div>
              <span
                class="text-xs font-semibold"
                style="color: #6e3fb8; width: 38px; text-align: right"
                >{{ data.avance_pct }}%</span
              >
            </div>
          </template>
        </Column>

        <Column header="Siguiente paso">
          <template #body="{ data }">
            <span v-if="data.avance_pct >= 100" class="text-xs"
              ><Tag value="Completo" severity="success" class="text-xs"
            /></span>
            <span v-else-if="data.siguiente_paso" class="text-xs" style="color: #2c2039">
              <span class="font-mono font-semibold" style="color: #915bd8">{{
                data.siguiente_paso.codigo
              }}</span>
              — {{ data.siguiente_paso.descripcion }}
            </span>
          </template>
        </Column>

        <Column header="" style="width: 170px">
          <template #body="{ data }">
            <div class="flex items-center justify-end gap-1">
              <Tag
                v-if="!data.tiene_registro"
                value="Sin iniciar"
                severity="secondary"
                class="text-xs"
              />
              <Tag
                v-if="data.alertas_pendientes"
                :value="`⚠ ${data.alertas_pendientes}`"
                severity="warn"
                class="text-xs"
              />
              <Tag
                v-if="data.bloqueos"
                :value="`⛔ ${data.bloqueos}`"
                severity="danger"
                class="text-xs"
              />
              <Button icon="pi pi-eye" text rounded size="small" @click.stop="irDetalle(data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
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
    ? rows.value.filter(
        (r) =>
          (r.nombre_comercial || '').toLowerCase().includes(q) ||
          (r.codigo_cnd || '').toLowerCase().includes(q),
      )
    : rows.value.slice()
}
watch([rows, filtroTexto], filtrar)

async function cargar() {
  loading.value = true
  try {
    const { data } = await api.get('/registros-cnd')
    rows.value = data
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'Error al cargar',
      detail: e.response?.data?.detail ?? '',
      life: 5000,
    })
  } finally {
    loading.value = false
  }
}

function irDetalle(row) {
  router.push(`/registros-cnd-asic/${row.proyecto_id}`)
}

onMounted(cargar)
</script>
