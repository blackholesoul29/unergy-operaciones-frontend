<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <Button icon="pi pi-arrow-left" text @click="$router.back()" class="-ml-2" />
      <div class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
        <i class="pi pi-exclamation-triangle text-red-500 text-sm" />
      </div>
      <div>
        <h2 class="text-xl font-bold text-gray-800">Alertas — Monitoreo</h2>
        <p class="text-xs text-gray-400 mt-0.5">Fallas activas sin resolver</p>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <template v-else>
      <!-- Resumen -->
      <div class="grid grid-cols-3 gap-4">
        <div class="rounded-xl border border-red-100 bg-red-50 p-4 flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <i class="pi pi-exclamation-circle text-red-500" />
          </div>
          <div>
            <p class="text-2xl font-bold text-red-600">{{ stats.total_activas ?? '—' }}</p>
            <p class="text-xs font-medium text-red-500">Fallas activas</p>
          </div>
        </div>
        <div class="rounded-xl border border-orange-100 bg-orange-50 p-4 flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
            <i class="pi pi-clock text-orange-500" />
          </div>
          <div>
            <p class="text-2xl font-bold text-orange-600">{{ stats.alerta_7_dias ?? '—' }}</p>
            <p class="text-xs font-medium text-orange-500">Más de 7 días abiertas</p>
          </div>
        </div>
        <div class="rounded-xl border border-blue-100 bg-blue-50 p-4 flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <i class="pi pi-check-circle text-blue-500" />
          </div>
          <div>
            <p class="text-2xl font-bold text-blue-600">
              {{ stats.cumplimiento_sla_pct != null ? `${stats.cumplimiento_sla_pct}%` : '—' }}
            </p>
            <p class="text-xs font-medium text-blue-500">Cumplimiento SLA (30 días)</p>
          </div>
        </div>
      </div>

      <!-- Tabla de fallas activas -->
      <div class="space-y-3">
        <div class="flex items-center gap-2">
          <h3 class="font-semibold text-gray-700">Fallas sin resolver</h3>
          <Tag :value="`${fallas.length}`" severity="danger" class="text-xs" />
          <span class="text-xs text-gray-400 ml-1">ordenadas por antigüedad</span>
        </div>

        <div v-if="fallas.length === 0"
          class="flex flex-col items-center py-12 gap-2 text-gray-400">
          <i class="pi pi-check-circle text-green-400 text-3xl" />
          <p class="text-sm">No hay fallas activas.</p>
        </div>

        <DataTable v-else :value="fallas" size="small" stripedRows :rowHover="true"
          :paginator="fallas.length > 20" :rows="20" class="text-sm"
          scrollable scrollHeight="520px">

          <Column field="codigo_interno" header="Código" style="min-width:100px">
            <template #body="{ data }">
              <RouterLink :to="`/fallas/${data.id}`"
                class="text-blue-600 hover:underline font-mono text-xs font-semibold">
                {{ data.codigo_interno }}
              </RouterLink>
            </template>
          </Column>

          <Column header="Proyecto" style="min-width:180px">
            <template #body="{ data }">
              <RouterLink :to="`/proyectos/${data.proyecto_id}`"
                class="text-gray-700 hover:text-blue-600 text-xs">
                {{ data.proyecto?.nombre_comercial || '—' }}
              </RouterLink>
            </template>
          </Column>

          <Column header="Estado" style="min-width:110px">
            <template #body="{ data }">
              <span class="inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2 py-0.5"
                :style="data.estado.color_hex
                  ? `background:${data.estado.color_hex}22; color:${data.estado.color_hex}`
                  : 'background:#f3f4f6; color:#6b7280'">
                {{ data.estado.nombre }}
              </span>
            </template>
          </Column>

          <Column header="Prioridad" style="min-width:100px">
            <template #body="{ data }">
              <span class="inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2 py-0.5"
                :style="data.prioridad.color_hex
                  ? `background:${data.prioridad.color_hex}22; color:${data.prioridad.color_hex}`
                  : 'background:#f3f4f6; color:#6b7280'">
                {{ data.prioridad.nombre }}
              </span>
            </template>
          </Column>

          <Column header="Descripción" style="min-width:220px">
            <template #body="{ data }">
              <span class="text-xs text-gray-600 line-clamp-2">{{ data.descripcion }}</span>
            </template>
          </Column>

          <Column header="Días abierta" style="min-width:100px" sortable field="dias_abierta">
            <template #body="{ data }">
              <span :class="[
                'text-xs font-semibold px-2 py-0.5 rounded-full',
                data.dias_abierta >= 30 ? 'bg-red-100 text-red-600' :
                data.dias_abierta >= 7  ? 'bg-orange-100 text-orange-600' :
                'bg-gray-100 text-gray-600'
              ]">
                {{ data.dias_abierta ?? 0 }} días
              </span>
            </template>
          </Column>

          <Column header="" style="width:50px">
            <template #body="{ data }">
              <RouterLink :to="`/fallas/${data.id}`">
                <Button icon="pi pi-arrow-right" text size="small" severity="secondary" />
              </RouterLink>
            </template>
          </Column>

        </DataTable>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import api from '@/api/client'

const loading = ref(true)
const stats = ref({})
const fallas = ref([])

onMounted(async () => {
  try {
    const [statsRes, fallasRes] = await Promise.all([
      api.get('/fallas/stats/resumen'),
      api.get('/fallas', { params: { size: 500 } }),
    ])
    stats.value = statsRes.data

    // Solo fallas no finalizadas, ordenadas por días abierta descendente
    const items = fallasRes.data.items ?? fallasRes.data
    fallas.value = items
      .filter(f => !f.estado?.es_estado_final)
      .sort((a, b) => (b.dias_abierta ?? 0) - (a.dias_abierta ?? 0))
  } catch (e) {
    console.error('Error cargando alertas de monitoreo:', e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
