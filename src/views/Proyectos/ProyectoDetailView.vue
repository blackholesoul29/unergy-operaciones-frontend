<template>
  <div v-if="proyecto" class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <Button icon="pi pi-arrow-left" text @click="$router.back()" class="-ml-2 mb-1" />
        <h2 class="text-xl font-bold text-gray-800">{{ proyecto.nombre_comercial }}</h2>
        <Tag :value="proyecto.estado" :severity="estadoSeverity(proyecto.estado)" class="mt-1" />
      </div>
      <Button label="Editar" icon="pi pi-pencil" outlined @click="editVisible = true" />
    </div>

    <!-- Tabs -->
    <TabView>
      <TabPanel header="General">
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 text-sm">
          <InfoField label="Cliente" :value="proyecto.cliente_id" />
          <InfoField label="Tipo" :value="proyecto.tipo_proyecto" />
          <InfoField label="Tecnología" :value="proyecto.tipo_tecnologia" />
          <InfoField label="Potencia (kWp)" :value="proyecto.potencia_instalada_kwp" />
          <InfoField label="Departamento" :value="proyecto.departamento" />
          <InfoField label="Municipio" :value="proyecto.municipio" />
          <InfoField label="Operador de red" :value="proyecto.operador_red" />
          <InfoField label="Clasificación" :value="proyecto.clasificacion_regulatoria" />
          <InfoField label="Código base (topic)" :value="proyecto.sub_project" />
          <InfoField label="Código TSF" :value="proyecto.codigo_tsf" />
        </div>
      </TabPanel>

      <TabPanel header="Técnico">
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 text-sm">
          <InfoField label="Potencia instalada (kWp)" :value="proyecto.potencia_instalada_kwp" />
          <InfoField label="Cantidad de paneles" :value="proyecto.cantidad_total_paneles" />
          <InfoField label="Producción específica (kWh/kWp)" :value="proyecto.produccion_especifica_kwh_kwp" />
        </div>
      </TabPanel>

      <TabPanel header="Inversionistas">
        <div class="p-4 space-y-4">
          <!-- Tabla inversionistas -->
          <DataTable :value="proyecto.inversionistas" class="text-sm" stripedRows>
            <Column field="cliente_nombre" header="Inversionista" />
            <Column header="Participación (%)">
              <template #body="{ data }">
                <template v-if="editandoInvId === data.id">
                  <div class="flex items-center gap-2">
                    <InputNumber v-model="editPct" :min="0" :max="100" :minFractionDigits="2" :maxFractionDigits="7"
                      suffix="%" class="w-32" />
                    <Button icon="pi pi-check" text severity="success" size="small" :loading="guardando"
                      @click="guardarEdicionInversionista(data.id)" />
                    <Button icon="pi pi-times" text severity="secondary" size="small"
                      @click="editandoInvId = null" />
                  </div>
                </template>
                <template v-else>
                  {{ data.porcentaje_participacion != null ? (data.porcentaje_participacion * 100).toFixed(4) + '%' : '—' }}
                </template>
              </template>
            </Column>
            <Column header="Patrimonio autónomo">
              <template #body="{ data }">
                <Tag :value="data.es_patrimonio_autonomo ? 'Sí' : 'No'"
                     :severity="data.es_patrimonio_autonomo ? 'info' : 'secondary'" />
              </template>
            </Column>
            <Column header="" style="width:100px">
              <template #body="{ data }">
                <div class="flex gap-1">
                  <Button icon="pi pi-pencil" text severity="info" size="small"
                    @click="iniciarEdicionInversionista(data)" v-tooltip="'Editar porcentaje'" />
                  <Button icon="pi pi-trash" text severity="danger" size="small"
                    @click="eliminarInversionista(data.id)" v-tooltip="'Eliminar'" />
                </div>
              </template>
            </Column>
            <template #empty>
              <p class="text-center text-gray-400 py-4">Sin inversionistas registrados.</p>
            </template>
          </DataTable>

          <!-- Formulario agregar inversionista -->
          <Divider />
          <p class="font-semibold text-gray-700">Agregar inversionista</p>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div class="flex flex-col gap-1">
              <label class="text-xs text-gray-500">Cliente</label>
              <Select v-model="nuevoInv.cliente_id" :options="clientes"
                optionLabel="razon_social_nombre" optionValue="id"
                placeholder="Seleccionar cliente" filter class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs text-gray-500">Porcentaje de participación (%)</label>
              <InputNumber v-model="nuevoInv.porcentaje_pct" :min="0" :max="100"
                :minFractionDigits="2" :maxFractionDigits="7" suffix="%" class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs text-gray-500">Patrimonio autónomo</label>
              <div class="flex items-center gap-2 h-10">
                <ToggleSwitch v-model="nuevoInv.es_patrimonio_autonomo" />
                <span class="text-sm text-gray-600">{{ nuevoInv.es_patrimonio_autonomo ? 'Sí' : 'No' }}</span>
              </div>
            </div>
          </div>
          <Button label="Agregar" icon="pi pi-plus" :loading="guardando"
            :disabled="!nuevoInv.cliente_id" @click="agregarInversionista" class="mt-2" />
        </div>
      </TabPanel>

      <TabPanel header="Servicios">
        <div class="p-4 space-y-3">
          <p class="text-xs text-gray-500 mb-4">Activa o desactiva los servicios contratados para este proyecto.</p>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div v-for="srv in servicios" :key="srv.key"
              class="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
              <span class="text-sm font-medium text-gray-700">{{ srv.label }}</span>
              <ToggleSwitch v-model="srvFlags[srv.key]" @change="toggleServicio(srv.key, srvFlags[srv.key])" />
            </div>
          </div>
        </div>
      </TabPanel>
    </TabView>
  </div>

  <div v-else-if="loading" class="flex justify-center py-20">
    <ProgressSpinner />
  </div>

  <div v-else class="flex flex-col items-center py-20 gap-3 text-gray-500">
    <i class="pi pi-exclamation-circle text-3xl text-red-400"></i>
    <p class="text-sm">{{ errorMsg || 'No se pudo cargar el proyecto.' }}</p>
    <Button label="Reintentar" icon="pi pi-refresh" outlined size="small" @click="$router.go(0)" />
  </div>

  <!-- Dialog: Editar proyecto -->
  <Dialog v-model:visible="editVisible" header="Editar proyecto" modal class="w-full max-w-xl"
    @hide="onEditDialogHide">
    <ProyectoForm :clientes="clientes" :proyecto="proyecto" :proyectoId="proyecto?.id" @save="onEdit" @cancel="editVisible = false" />
  </Dialog>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import ToggleSwitch from 'primevue/toggleswitch'
import ProgressSpinner from 'primevue/progressspinner'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import Divider from 'primevue/divider'
import { useToast } from 'primevue/usetoast'
import api from '@/api/client'
import ProyectoForm from './ProyectoForm.vue'

const route = useRoute()
const toast = useToast()
const proyecto = ref(null)
const clientes = ref([])
const loading = ref(true)
const errorMsg = ref(null)
const editVisible = ref(false)
const guardando = ref(false)
const srvFlags = reactive({})

const nuevoInv = reactive({
  cliente_id: null,
  porcentaje_pct: null,
  es_patrimonio_autonomo: false,
})

const editandoInvId = ref(null)
const editPct = ref(null)

const servicios = [
  { key: 'srv_operacion', label: 'Operación' },
  { key: 'srv_representacion', label: 'Representación' },
  { key: 'srv_cgm', label: 'CGM' },
  { key: 'srv_ppa', label: 'PPA' },
  { key: 'srv_promotor', label: 'Promotor' },
  { key: 'srv_rec', label: 'REC' },
]

const estadoSeverity = (e) => ({ en_operacion: 'success', en_desarrollo: 'info', suspendido: 'warn', cancelado: 'secondary' }[e] || 'secondary')

onMounted(async () => {
  try {
    const [proyRes, clientesRes] = await Promise.all([
      api.get(`/proyectos/${route.params.id}`),
      api.get('/clientes', { params: { size: 200 } }),
    ])
    proyecto.value = proyRes.data
    clientes.value = clientesRes.data.items
    for (const s of servicios) srvFlags[s.key] = proyRes.data[s.key]
  } catch (e) {
    errorMsg.value = e.response?.data?.detail || e.message || 'Error de conexión con el servidor'
  } finally {
    loading.value = false
  }
})

async function agregarInversionista() {
  if (!nuevoInv.cliente_id) {
    toast.add({ severity: 'warn', summary: 'Selecciona un cliente', life: 2000 })
    return
  }
  guardando.value = true
  try {
    await api.post(`/proyectos/${route.params.id}/inversionistas`, {
      cliente_id: nuevoInv.cliente_id,
      porcentaje_participacion: nuevoInv.porcentaje_pct != null ? nuevoInv.porcentaje_pct / 100 : null,
      es_patrimonio_autonomo: nuevoInv.es_patrimonio_autonomo,
    })
    const { data } = await api.get(`/proyectos/${route.params.id}`)
    proyecto.value = data
    nuevoInv.cliente_id = null
    nuevoInv.porcentaje_pct = null
    nuevoInv.es_patrimonio_autonomo = false
    toast.add({ severity: 'success', summary: 'Inversionista agregado', life: 2000 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error al agregar', detail: e.response?.data?.detail, life: 3000 })
  } finally {
    guardando.value = false
  }
}

async function eliminarInversionista(invId) {
  try {
    await api.delete(`/proyectos/${route.params.id}/inversionistas/${invId}`)
    proyecto.value.inversionistas = proyecto.value.inversionistas.filter(i => i.id !== invId)
    toast.add({ severity: 'success', summary: 'Inversionista eliminado', life: 2000 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error al eliminar', detail: e.response?.data?.detail, life: 3000 })
  }
}

async function onEdit(payload) {
  try {
    const { data } = await api.patch(`/proyectos/${route.params.id}`, payload)
    proyecto.value = data
    editVisible.value = false
    toast.add({ severity: 'success', summary: 'Proyecto actualizado', life: 3000 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.detail, life: 4000 })
  }
}

async function toggleServicio(key, value) {
  try {
    const { data } = await api.patch(`/proyectos/${route.params.id}/servicios`, { [key]: value })
    proyecto.value = data
    toast.add({ severity: 'success', summary: 'Servicio actualizado', life: 2000 })
  } catch {
    srvFlags[key] = !value
    toast.add({ severity: 'error', summary: 'Error al actualizar', life: 3000 })
  }
}

function iniciarEdicionInversionista(inv) {
  editandoInvId.value = inv.id
  editPct.value = inv.porcentaje_participacion != null ? +(inv.porcentaje_participacion * 100).toFixed(7) : null
}

async function guardarEdicionInversionista(invId) {
  guardando.value = true
  try {
    await api.patch(`/proyectos/${route.params.id}/inversionistas/${invId}`, {
      porcentaje_participacion: editPct.value != null ? editPct.value / 100 : null,
    })
    editandoInvId.value = null
    editPct.value = null
    const { data } = await api.get(`/proyectos/${route.params.id}`)
    proyecto.value = data
    toast.add({ severity: 'success', summary: 'Porcentaje actualizado', life: 2000 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error al actualizar', detail: e.response?.data?.detail, life: 3000 })
  } finally {
    guardando.value = false
  }
}

async function onEditDialogHide() {
  try {
    const { data } = await api.get(`/proyectos/${route.params.id}`)
    proyecto.value = data
  } catch { /* silencioso: si falla el refresh no interrumpimos al usuario */ }
}
</script>

<script>
const InfoField = {
  props: { label: String, value: [String, Number, Boolean] },
  template: `<div><p class="text-xs text-gray-400 uppercase tracking-wide">{{ label }}</p><p class="text-gray-800 font-medium mt-0.5">{{ value ?? '—' }}</p></div>`,
}
export default { components: { InfoField } }
</script>
