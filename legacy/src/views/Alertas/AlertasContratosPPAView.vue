<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <Button icon="pi pi-arrow-left" text @click="$router.back()" class="-ml-2" />
      <div class="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
        <i class="pi pi-bolt text-sm text-amber-500" />
      </div>
      <div>
        <h2 class="text-xl font-bold text-gray-800">Alertas — Contratos PPA</h2>
        <p v-if="fechaConsulta" class="mt-0.5 text-xs text-gray-400">
          Fecha de consulta: {{ fechaConsulta }}
        </p>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <template v-else>
      <!-- Resumen -->
      <div class="grid grid-cols-2 gap-4">
        <div class="flex items-center gap-4 rounded-xl border border-orange-100 bg-orange-50 p-5">
          <div
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-100"
          >
            <i class="pi pi-user-minus text-xl text-orange-500" />
          </div>
          <div>
            <p class="text-2xl font-bold text-orange-600">{{ huerfanos.length }}</p>
            <p class="text-sm font-medium text-orange-700">Proyectos huérfanos</p>
            <p class="mt-0.5 text-xs text-orange-400">Sin contrato activo en GESCON hoy</p>
          </div>
        </div>
        <div class="flex items-center gap-4 rounded-xl border border-red-100 bg-red-50 p-5">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100">
            <i class="pi pi-copy text-xl text-red-500" />
          </div>
          <div>
            <p class="text-2xl font-bold text-red-600">{{ duplicados.length }}</p>
            <p class="text-sm font-medium text-red-700">Proyectos duplicados</p>
            <p class="mt-0.5 text-xs text-red-400">Asociados a 2+ contratos activos a la vez</p>
          </div>
        </div>
      </div>

      <!-- ── Sección Huérfanos ── -->
      <div class="space-y-3">
        <div class="flex items-center gap-2">
          <i class="pi pi-user-minus text-orange-500" />
          <h3 class="font-semibold text-gray-700">Proyectos huérfanos</h3>
          <Tag :value="`${huerfanos.length}`" severity="warn" class="text-xs" />
        </div>
        <p class="text-xs text-gray-400">
          Proyectos que no aparecen en ningún contrato activo del GESCON hoy. Pueden estar
          pendientes de registro o sus contratos haber vencido/terminado.
        </p>

        <div
          v-if="huerfanos.length === 0"
          class="flex flex-col items-center gap-2 py-8 text-gray-400"
        >
          <i class="pi pi-check-circle text-3xl text-green-400" />
          <p class="text-sm">Todos los proyectos tienen contrato activo en GESCON.</p>
        </div>

        <DataTable
          v-else
          :value="huerfanosTabla"
          size="small"
          stripedRows
          :rowHover="true"
          :paginator="huerfanos.length > 15"
          :rows="15"
          class="text-sm"
        >
          <Column header="Proyecto" style="min-width: 240px">
            <template #body="{ data }">
              <RouterLink
                :to="`/proyectos/${data.proyecto_id}`"
                class="font-medium text-blue-600 hover:underline"
              >
                {{ data.nombre_comercial }}
              </RouterLink>
            </template>
          </Column>
          <Column header="Tipo" style="min-width: 110px">
            <template #body="{ data }">
              <Tag :value="data.tipo_proyecto || '—'" severity="secondary" class="text-xs" />
            </template>
          </Column>
          <Column header="Estado" style="min-width: 110px">
            <template #body="{ data }">
              <Tag :value="data.estado" :severity="estadoSev(data.estado)" class="text-xs" />
            </template>
          </Column>
          <Column header="" style="width: 60px">
            <template #body="{ data }">
              <RouterLink :to="`/proyectos/${data.proyecto_id}/ppa`">
                <Button
                  icon="pi pi-bolt"
                  text
                  size="small"
                  severity="warning"
                  v-tooltip="'Ver PPA'"
                />
              </RouterLink>
            </template>
          </Column>
        </DataTable>
      </div>

      <Divider />

      <!-- ── Sección Duplicados ── -->
      <div class="space-y-3">
        <div class="flex items-center gap-2">
          <i class="pi pi-copy text-red-500" />
          <h3 class="font-semibold text-gray-700">Proyectos duplicados</h3>
          <Tag :value="`${duplicados.length}`" severity="danger" class="text-xs" />
        </div>
        <p class="text-xs text-gray-400">
          Proyectos que están activos en 2 o más contratos GESCON simultáneamente. Revisar si los
          porcentajes de despacho suman 100 % o si es un error de registro.
        </p>

        <div
          v-if="duplicados.length === 0"
          class="flex flex-col items-center gap-2 py-8 text-gray-400"
        >
          <i class="pi pi-check-circle text-3xl text-green-400" />
          <p class="text-sm">No hay proyectos con contratos duplicados.</p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="dup in duplicados"
            :key="dup.proyecto_id"
            class="space-y-3 rounded-xl border border-red-100 bg-white p-4"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <RouterLink
                  :to="`/proyectos/${dup.proyecto_id}`"
                  class="font-semibold text-gray-800 hover:text-blue-600"
                >
                  {{ dup.nombre_comercial }}
                </RouterLink>
                <Tag :value="dup.tipo_proyecto || '—'" severity="secondary" class="text-xs" />
              </div>
              <Tag
                :value="`${dup.sics.length} contratos activos`"
                severity="danger"
                class="text-xs"
              />
            </div>

            <DataTable :value="dup.sics" size="small" class="text-xs">
              <Column field="codigo_sic_contrato" header="SIC" style="min-width: 90px" />
              <Column field="contrato_interno" header="Contrato" style="min-width: 130px" />
              <Column header="Tipo" style="min-width: 110px">
                <template #body="{ data }">
                  <Tag
                    :value="data.tipo_solicitud"
                    :severity="tipoSev(data.tipo_solicitud)"
                    class="text-xs"
                  />
                </template>
              </Column>
              <Column header="Inicio" style="min-width: 90px">
                <template #body="{ data }">{{ data.fecha_inicio || '—' }}</template>
              </Column>
              <Column header="Fin" style="min-width: 90px">
                <template #body="{ data }">{{ data.fecha_fin || '—' }}</template>
              </Column>
              <Column header="% Desp." style="min-width: 80px">
                <template #body="{ data }">
                  {{ data.porcentaje_fncer != null ? `${data.porcentaje_fncer}%` : '—' }}
                </template>
              </Column>
              <Column header="" style="width: 50px">
                <template #body="{ data }">
                  <RouterLink :to="`/mem/gescon`">
                    <Button
                      icon="pi pi-external-link"
                      text
                      size="small"
                      severity="secondary"
                      v-tooltip="`SIC ${data.codigo_sic_contrato}`"
                    />
                  </RouterLink>
                </template>
              </Column>
            </DataTable>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Divider from 'primevue/divider'
import api from '@/api/client'

const loading = ref(true)
const fechaConsulta = ref('')
const huerfanos = ref([])
const duplicados = ref([])

// Tabla de huérfanos como ref plano (evita bug PrimeVue 4 con computed)
const huerfanosTabla = ref([])

function estadoSev(e) {
  return { en_operacion: 'success', en_desarrollo: 'info', suspendido: 'warn' }[e] || 'secondary'
}

function tipoSev(t) {
  return (
    { registro: 'success', modificacion: 'info', terminacion: 'danger', desistimiento: 'warn' }[
      t
    ] || 'secondary'
  )
}

onMounted(async () => {
  try {
    const { data } = await api.get('/alertas/contratos-ppa')
    fechaConsulta.value = data.fecha_consulta
    huerfanos.value = data.huerfanos
    duplicados.value = data.duplicados
    huerfanosTabla.value = data.huerfanos
  } catch (e) {
    console.error('Error cargando alertas:', e)
  } finally {
    loading.value = false
  }
})
</script>
