<template>
  <div v-if="contrato" class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <Button icon="pi pi-arrow-left" text @click="$router.back()" class="-ml-2 mb-1" />
        <h2 class="text-xl font-bold text-gray-800">
          {{ contrato.nombre_interno || contrato.numero_codigo_contrato || 'Contrato PPA' }}
        </h2>
        <div class="flex items-center gap-2 mt-1">
          <span v-if="contrato.numero_codigo_contrato" class="text-xs text-gray-400 font-mono">
            {{ contrato.numero_codigo_contrato }}
          </span>
          <Tag value="PPA" severity="warning" class="text-xs" />
          <span class="text-xs text-gray-400">{{ contrato.proyectos?.length || 0 }} proyectos</span>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <TabView>
      <!-- ══ DATOS ══ -->
      <TabPanel header="Datos">
        <div class="space-y-6 p-2">
          <!-- Partes -->
          <div>
            <p class="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-3">Partes del contrato</p>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <InfoField label="Comprador" :value="contrato.comprador_nombre" />
              <InfoField label="NIT comprador" :value="contrato.comprador_nit" />
              <div />
              <InfoField label="Vendedor" :value="contrato.vendedor_nombre" />
              <InfoField label="NIT vendedor" :value="contrato.vendedor_nit" />
            </div>
          </div>

          <Divider />

          <!-- Vigencia -->
          <div>
            <p class="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-3">Vigencia</p>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <InfoField label="Fecha inicio" :value="formatFecha(contrato.fecha_inicio)" />
              <InfoField label="Fecha fin" :value="formatFecha(contrato.fecha_fin)" />
              <InfoField label="Duración" :value="duracion" />
            </div>
          </div>

          <Divider />

          <!-- Condiciones comerciales -->
          <div>
            <p class="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-3">Condiciones comerciales</p>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <InfoField label="Índice de indexación" :value="contrato.indice_indexacion" />
              <InfoField label="Periodicidad indexación" :value="contrato.periodicidad_indexacion" />
              <InfoField label="Período base indexación" :value="contrato.periodo_indexacion_base" />
              <InfoField label="Valor indexación base" :value="contrato.valor_indexacion_base != null ? String(contrato.valor_indexacion_base) : null" />
              <InfoField label="Periodicidad facturación" :value="contrato.periodicidad_facturacion" />
              <InfoField label="Tiempo de pago (días)" :value="contrato.tiempo_pago != null ? String(contrato.tiempo_pago) : null" />
              <div v-if="contrato.condiciones_pago" class="col-span-2 md:col-span-3 flex flex-col gap-0.5">
                <span class="text-xs font-medium" style="color:#9b89b5">Condiciones de pago</span>
                <span class="text-sm" style="color:#2C2039">{{ contrato.condiciones_pago }}</span>
              </div>
            </div>
          </div>

          <Divider />

          <!-- GESCON / SIC -->
          <div>
            <p class="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-3">GESCON / SIC</p>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <InfoField label="Código SIC" :value="contrato.codigo_sic" />
              <InfoField label="Código GESCON" :value="contrato.gescon_codigo" />
              <InfoField label="GESCON inicio" :value="formatFecha(contrato.gescon_fecha_inicio)" />
              <InfoField label="GESCON fin" :value="formatFecha(contrato.gescon_fecha_fin)" />
              <InfoField label="Precio GESCON" :value="contrato.gescon_precio != null ? `$${Number(contrato.gescon_precio).toFixed(4)}` : null" />
              <InfoField label="Cantidades GESCON (kWh)" :value="contrato.gescon_cantidades_kwh != null ? Number(contrato.gescon_cantidades_kwh).toLocaleString('es-CO') : null" />
            </div>
          </div>

        </div>
      </TabPanel>

      <!-- ══ CANTIDADES ══ -->
      <TabPanel :header="`Cantidades (${contrato.compromisos_energia?.length || 0})`">
        <DataTable
          :value="contrato.compromisos_energia"
          stripedRows
          class="text-sm"
          paginator
          :rows="24"
          :rowsPerPageOptions="[12, 24, 60, 120]"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
          emptyMessage="Sin compromisos de energía registrados."
          sortField="año"
          :sortOrder="1"
        >
          <Column field="año" header="Año" sortable style="width:70px" />
          <Column field="mes" header="Mes" sortable style="width:110px">
            <template #body="{ data }">{{ MESES[data.mes - 1] }}</template>
          </Column>
          <Column field="energia_minima" header="Mín (MWh/mes)" sortable>
            <template #body="{ data }">
              {{ data.energia_minima != null ? Number(data.energia_minima).toLocaleString('es-CO') : '—' }}
            </template>
          </Column>
          <Column field="energia_maxima" header="Máx (MWh/mes)" sortable>
            <template #body="{ data }">
              {{ data.energia_maxima != null ? Number(data.energia_maxima).toLocaleString('es-CO') : '—' }}
            </template>
          </Column>
          <Column header="Rango">
            <template #body="{ data }">
              <div v-if="data.energia_minima != null && data.energia_maxima != null"
                class="text-xs text-gray-400">
                {{ ((data.energia_maxima / data.energia_minima - 1) * 100).toFixed(0) }}% flex
              </div>
            </template>
          </Column>
        </DataTable>
      </TabPanel>

      <!-- ══ TARIFAS ══ -->
      <TabPanel :header="`Tarifas (${contrato.tarifas?.length || 0})`">
        <DataTable
          :value="contrato.tarifas"
          stripedRows
          class="text-sm"
          paginator
          :rows="24"
          :rowsPerPageOptions="[12, 24, 60, 120]"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
          emptyMessage="Sin tarifas registradas."
          sortField="año"
          :sortOrder="1"
        >
          <Column field="año" header="Año" sortable style="width:70px" />
          <Column field="mes" header="Mes" sortable style="width:110px">
            <template #body="{ data }">{{ MESES[data.mes - 1] }}</template>
          </Column>
          <Column field="tarifa" header="Tarifa (COP/kWh)" sortable>
            <template #body="{ data }">
              <span class="font-mono font-medium text-amber-700">
                {{ data.tarifa != null ? `$${Number(data.tarifa).toLocaleString('es-CO')}` : '—' }}
              </span>
            </template>
          </Column>
          <Column header="Variación">
            <template #body="{ data, index }">
              <template v-if="index > 0 && contrato.tarifas[index - 1]?.tarifa != null && data.tarifa != null">
                <span
                  class="text-xs font-medium"
                  :class="data.tarifa < contrato.tarifas[index-1].tarifa ? 'text-green-600' : data.tarifa > contrato.tarifas[index-1].tarifa ? 'text-red-500' : 'text-gray-400'"
                >
                  {{ variacion(contrato.tarifas[index-1].tarifa, data.tarifa) }}
                </span>
              </template>
            </template>
          </Column>
        </DataTable>
      </TabPanel>

      <!-- ══ PROYECTOS ══ -->
      <TabPanel :header="`Proyectos (${contrato.proyectos?.length || 0})`">
        <div v-if="contrato.proyectos?.length" class="p-2">
          <DataTable :value="contrato.proyectos" stripedRows class="text-sm" rowHover>
            <Column field="id" header="ID" style="width:60px" />
            <Column field="nombre_comercial" header="Nombre comercial" sortable>
              <template #body="{ data }">
                <router-link :to="`/proyectos/${data.id}`"
                  class="font-medium text-amber-700 hover:underline">
                  {{ data.nombre_comercial }}
                </router-link>
              </template>
            </Column>
          </DataTable>
        </div>
        <div v-else class="flex flex-col items-center py-16 gap-2 text-gray-400">
          <i class="pi pi-sitemap text-3xl" />
          <span class="text-sm">Sin proyectos asociados</span>
        </div>
      </TabPanel>
    </TabView>
  </div>

  <!-- Loading -->
  <div v-else-if="loading" class="flex items-center justify-center py-24 text-gray-400 gap-3">
    <i class="pi pi-spin pi-spinner text-xl" />
    <span>Cargando contrato…</span>
  </div>

  <!-- Error -->
  <div v-else class="flex flex-col items-center py-24 text-gray-400 gap-2">
    <i class="pi pi-exclamation-triangle text-3xl text-amber-400" />
    <span class="text-sm">No se encontró el contrato</span>
    <Button label="Volver" text @click="$router.back()" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Divider from 'primevue/divider'
import InfoField from '@/components/InfoField.vue'
import api from '@/api/client'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const route = useRoute()
const toast = useToast()
const contrato = ref(null)
const loading = ref(true)

const duracion = computed(() => {
  if (!contrato.value?.fecha_inicio || !contrato.value?.fecha_fin) return null
  const a = new Date(contrato.value.fecha_inicio)
  const b = new Date(contrato.value.fecha_fin)
  const meses = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth())
  const años = Math.floor(meses / 12)
  const resto = meses % 12
  return años > 0
    ? `${años} año${años !== 1 ? 's' : ''}${resto > 0 ? ` ${resto} mes${resto !== 1 ? 'es' : ''}` : ''}`
    : `${meses} mes${meses !== 1 ? 'es' : ''}`
})

function formatFecha(f) {
  if (!f) return null
  return String(f).slice(0, 10)
}

function variacion(prev, curr) {
  const pct = ((curr - prev) / prev) * 100
  if (pct === 0) return '—'
  return `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`
}

async function cargar() {
  loading.value = true
  try {
    const { data } = await api.get(`/ppa/${route.params.id}`)
    contrato.value = data
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 3000 })
  } finally {
    loading.value = false
  }
}

onMounted(cargar)
</script>
