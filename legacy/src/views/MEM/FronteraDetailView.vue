<template>
  <div v-if="frontera">
    <DetalleLayout
      :volver="{ to: '/mem/fronteras', label: 'Fronteras' }"
      :titulo="frontera.nombre_frontera"
      :codigo="frontera.codigo_frontera || ''"
      :tabs="TABS"
      v-model="activeTab"
    >
      <template v-if="isEditMode" #titulo>
        <InputText v-model="editForm.nombre_frontera" size="small" class="w-64" />
      </template>
      <template v-if="!isEditMode" #chips>
        <Tag
          :value="tipoLabel(frontera.tipo_frontera)"
          :severity="tipoSeverity(frontera.tipo_frontera)"
          class="text-[10px]"
        />
        <Tag
          :value="frontera.estado"
          :severity="estadoSeverity(frontera.estado)"
          class="text-[10px]"
        />
      </template>
      <template #acciones>
        <template v-if="isEditMode">
          <Button label="Cancelar" severity="secondary" outlined size="small" @click="cancelEdit" />
          <Button
            label="Guardar cambios"
            icon="pi pi-check"
            size="small"
            :loading="guardando"
            @click="guardarEdit"
          />
        </template>
        <Button
          v-else
          label="Editar"
          icon="pi pi-pencil"
          outlined
          size="small"
          @click="entrarEdicion"
        />
      </template>
      <template #default="{ tab }">
        <!-- ══ GENERAL ══ -->
        <div v-if="tab === 'general'">
          <div class="space-y-6 p-4 text-sm">
            <div>
              <p class="mb-3 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                Identidad
              </p>

              <div v-if="!isEditMode" class="grid grid-cols-2 gap-4 md:grid-cols-3">
                <InfoField label="Código frontera" :value="frontera.codigo_frontera" />
                <InfoField label="Tipo" :value="tipoLabel(frontera.tipo_frontera)" />
                <InfoField label="Estado" :value="frontera.estado" />
                <div class="flex flex-col gap-0.5">
                  <span class="text-xs font-medium" style="color: #9b89b5">Proyecto</span>
                  <RouterLink
                    v-if="frontera.proyecto_id"
                    :to="`/proyectos/${frontera.proyecto_id}`"
                    class="text-sm underline"
                    style="color: #915bd8"
                  >
                    {{ frontera.proyecto_nombre || `#${frontera.proyecto_id}` }}
                  </RouterLink>
                  <span v-else class="text-sm" style="color: #2c2039">—</span>
                </div>
                <InfoField label="Operador de red" :value="frontera.operador_comercial" />
                <InfoField
                  label="Fecha registro ASIC"
                  :value="fmtFecha(frontera.fecha_registro_asic)"
                />
              </div>

              <div v-else class="grid grid-cols-2 gap-4 md:grid-cols-3">
                <div>
                  <label class="mb-1 block text-xs font-medium" style="color: #9b89b5"
                    >Código frontera</label
                  >
                  <InputText v-model="editForm.codigo_frontera" class="w-full" />
                </div>
                <div>
                  <label class="mb-1 block text-xs font-medium" style="color: #9b89b5">Tipo</label>
                  <Dropdown
                    v-model="editForm.tipo_frontera"
                    :options="tipoOptions"
                    optionLabel="label"
                    optionValue="value"
                    class="w-full"
                  />
                </div>
                <div>
                  <label class="mb-1 block text-xs font-medium" style="color: #9b89b5"
                    >Estado</label
                  >
                  <Dropdown
                    v-model="editForm.estado"
                    :options="estadoOptions"
                    optionLabel="label"
                    optionValue="value"
                    class="w-full"
                  />
                </div>
                <div>
                  <label class="mb-1 block text-xs font-medium" style="color: #9b89b5"
                    >Proyecto</label
                  >
                  <Dropdown
                    v-model="editForm.proyecto_id"
                    :options="proyectosAll"
                    optionLabel="nombre_comercial"
                    optionValue="id"
                    class="w-full"
                    placeholder="Seleccionar"
                    showClear
                    filter
                  />
                </div>
                <div>
                  <label class="mb-1 block text-xs font-medium" style="color: #9b89b5"
                    >Operador de red</label
                  >
                  <Dropdown
                    v-model="editForm.operador_red_id"
                    :options="operadoresRedOptions"
                    optionLabel="label"
                    optionValue="id"
                    class="w-full"
                    placeholder="Seleccionar"
                    showClear
                    filter
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ══ INFORMACIÓN QUOIA ══ -->
        <div v-if="tab === 'quoia'">
          <div class="space-y-6 p-4 text-sm">
            <p class="text-xs" style="color: #9b89b5">
              <i class="pi pi-info-circle mr-1" />
              Estos datos los sincroniza Quoia automáticamente
            </p>
            <div>
              <p class="mb-3 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                Medidor principal
              </p>
              <div class="grid grid-cols-2 gap-4 md:grid-cols-3">
                <InfoField label="Marca" :value="frontera.marca_med_ppal" />
                <InfoField label="Modelo" :value="frontera.modelo_med_ppal" />
                <InfoField label="Serial" :value="frontera.nro_serie_med_ppal" />
              </div>
            </div>
            <div>
              <p class="mb-3 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                Medidor respaldo
              </p>
              <div class="grid grid-cols-2 gap-4 md:grid-cols-3">
                <InfoField label="Marca" :value="frontera.marca_med_resp" />
                <InfoField label="Modelo" :value="frontera.modelo_med_resp" />
                <InfoField label="Serial" :value="frontera.nro_serie_med_resp" />
              </div>
            </div>
            <div>
              <p class="mb-3 text-xs font-semibold tracking-wide text-gray-400 uppercase">Otros</p>
              <div class="grid grid-cols-2 gap-4 md:grid-cols-3">
                <InfoField label="ID border Quoia" :value="frontera.quoia_border_id" />
              </div>
            </div>
          </div>
        </div>

        <!-- ══ INFORMACIÓN REGULATORIA (GESCON) ══ -->
        <div v-if="tab === 'gescon'">
          <div class="space-y-6 p-4 text-sm">
            <div>
              <p class="mb-3 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                Registro ASIC
              </p>
              <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
                <InfoField label="Nivel de tensión" :value="frontera.nivel_tension" />
                <InfoField label="Nivel de tensión (kV)" :value="frontera.nivel_tension_kv" />
                <InfoField label="Tipo punto de medición" :value="frontera.tipo_punto_medicion" />
                <InfoField
                  label="Transferencia máxima (kWh)"
                  :value="frontera.transferencia_maxima_kwh"
                />
                <InfoField
                  label="Fecha inicio representación"
                  :value="fmtFecha(frontera.fecha_inicio_representacion)"
                />
              </div>
            </div>

            <div>
              <p class="mb-3 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                Capacidad y transporte
              </p>
              <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
                <InfoField
                  label="Potencia instalada (MW)"
                  :value="frontera.proyecto_potencia_instalada_mw"
                />
                <InfoField v-if="!isEditMode" label="Clase CT" :value="frontera.clase_ct" />
                <div v-else class="flex flex-col gap-1">
                  <label class="text-xs font-medium" style="color: #9b89b5">Clase CT</label>
                  <Dropdown
                    v-model="editForm.clase_ct"
                    :options="claseCtOptions"
                    showClear
                    class="w-full"
                    placeholder="Seleccionar"
                  />
                </div>
                <InfoField v-if="!isEditMode" label="Clase PT" :value="frontera.clase_pt" />
                <div v-else class="flex flex-col gap-1">
                  <label class="text-xs font-medium" style="color: #9b89b5">Clase PT</label>
                  <Dropdown
                    v-model="editForm.clase_pt"
                    :options="clasePtOptions"
                    showClear
                    class="w-full"
                    placeholder="Seleccionar"
                  />
                </div>
              </div>
            </div>

            <div>
              <p class="mb-3 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                Ubicación
              </p>
              <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
                <InfoField label="Municipio" :value="frontera.proyecto_municipio" />
                <InfoField label="Departamento" :value="frontera.proyecto_departamento" />
                <InfoField label="Dirección" :value="frontera.proyecto_direccion" />
                <InfoField label="Latitud" :value="frontera.proyecto_latitud" />
                <InfoField label="Longitud" :value="frontera.proyecto_longitud" />
                <InfoField label="Altitud (msnm)" :value="frontera.proyecto_altitud_msnm" />
              </div>
            </div>

            <div>
              <p class="mb-3 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                Agentes
              </p>
              <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
                <InfoField label="Agente exportador" :value="frontera.agente_exportador" />
                <InfoField label="Agente importador" :value="frontera.agente_importador" />
              </div>
            </div>

            <div>
              <p class="mb-3 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                Medidor — ficha regulatoria
              </p>
              <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
                <InfoField
                  v-if="!isEditMode"
                  label="Clase medidor"
                  :value="frontera.clase_medidor"
                />
                <div v-else class="flex flex-col gap-1">
                  <label class="text-xs font-medium" style="color: #9b89b5">Clase medidor</label>
                  <Dropdown
                    v-model="editForm.clase_medidor"
                    :options="claseMedidorOptions"
                    showClear
                    class="w-full"
                    placeholder="Seleccionar"
                  />
                </div>
                <InfoField label="N° elementos ppal" :value="frontera.num_elementos_med_ppal" />
                <InfoField
                  label="Fecha cambio ppal"
                  :value="fmtFecha(frontera.fecha_cambio_med_ppal)"
                />
                <InfoField
                  label="Entidad calibradora ppal"
                  :value="frontera.entidad_calibradora_med_ppal"
                />
                <InfoField
                  label="Fecha calibración ppal"
                  :value="fmtFecha(frontera.fecha_calibracion_med_ppal)"
                />
                <InfoField
                  label="Fecha actualización ppal"
                  :value="fmtFecha(frontera.fecha_actualizacion_ppal)"
                />
                <InfoField label="N° elementos resp" :value="frontera.num_elementos_med_resp" />
                <InfoField
                  label="Fecha cambio resp"
                  :value="fmtFecha(frontera.fecha_cambio_med_resp)"
                />
                <InfoField
                  label="Entidad calibradora resp"
                  :value="frontera.entidad_calibradora_med_resp"
                />
                <InfoField
                  label="Fecha calibración resp"
                  :value="fmtFecha(frontera.fecha_calibracion_med_resp)"
                />
                <InfoField
                  label="Fecha actualización resp"
                  :value="fmtFecha(frontera.fecha_actualizacion_resp)"
                />
              </div>
            </div>

            <div>
              <p class="mb-3 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                Clasificación industrial y SIC
              </p>
              <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
                <InfoField label="Tipo tecnología" :value="frontera.proyecto_tipo_tecnologia" />
                <InfoField
                  label="SIC submercado exportador"
                  :value="frontera.codigo_sic_submercado_exportador"
                />
                <InfoField
                  label="SIC submercado consumo"
                  :value="frontera.codigo_sic_submercado_consumo"
                />
              </div>
            </div>
          </div>
        </div>
      </template>
    </DetalleLayout>

    <!-- Dialog: nombre parecido a una frontera existente -->
    <Dialog
      v-model:visible="duplicadoVisible"
      header="Frontera parecida ya existe"
      modal
      class="w-full max-w-sm"
    >
      <p class="mb-4 text-sm" style="color: #6b5a8a">
        Ya existe una frontera con un nombre muy parecido:
        <strong>{{ duplicadoInfo?.candidato_nombre }}</strong>
        (ID {{ duplicadoInfo?.candidato_id }}). Si de verdad es una frontera distinta, puedes
        guardar igual.
      </p>
      <div class="flex justify-end gap-2">
        <Button label="Cancelar" severity="secondary" text @click="duplicadoVisible = false" />
        <Button label="Guardar de todos modos" :loading="guardando" @click="guardarEdit(true)" />
      </div>
    </Dialog>
  </div>

  <div v-else-if="loading" class="flex justify-center py-20">
    <ProgressSpinner />
  </div>

  <div v-else class="flex flex-col items-center gap-3 py-20 text-gray-500">
    <i class="pi pi-exclamation-circle text-3xl text-red-400"></i>
    <p class="text-sm">{{ errorMsg || 'No se pudo cargar la frontera.' }}</p>
    <Button label="Reintentar" icon="pi pi-refresh" outlined size="small" @click="$router.go(0)" />
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Dialog from 'primevue/dialog'
import api from '@/api/client'
import DetalleLayout from '@/components/DetalleLayout.vue'
import InfoField from '@/components/InfoField.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const frontera = ref(null)
const loading = ref(true)
const errorMsg = ref('')
const activeTab = ref('general')

const TABS = [
  { key: 'general', label: 'General', icon: 'pi pi-info-circle' },
  { key: 'quoia', label: 'Información Quoia', icon: 'pi pi-link' },
  { key: 'gescon', label: 'Información regulatoria', icon: 'pi pi-file' },
]

// ── Edición (inline, en el mismo detalle -- reemplaza el diálogo aparte
// que había en FronterasView.vue) ───────────────────────────────────────
const isEditMode = computed(() => route.query.edit === 'true')
const editForm = reactive({
  codigo_frontera: null,
  nombre_frontera: null,
  tipo_frontera: null,
  estado: null,
  proyecto_id: null,
  operador_red_id: null,
  clase_ct: null,
  clase_pt: null,
  clase_medidor: null,
})
const guardando = ref(false)
const duplicadoVisible = ref(false)
const duplicadoInfo = ref(null)

const estadoOptions = [
  { label: 'Activa', value: 'activa' },
  { label: 'En registro', value: 'en_registro' },
  { label: 'En falla', value: 'en_falla' },
  { label: 'Cancelada', value: 'cancelada' },
]
const tipoOptions = [
  { label: 'Generación', value: 'generacion' },
  { label: 'Consumo', value: 'consumo' },
  { label: 'Gen+Consumo', value: 'generacion_consumo' },
  { label: 'Auxiliar', value: 'consumo_auxiliar' },
  { label: 'Propio', value: 'consumo_propio' },
]
// Acotadas a las clases de precision de metrologia YA en uso (auditoria de
// integridad de Fronteras, 2026-08-25) -- si hace falta una clase nueva, se
// agrega puntualmente (ver backend: ClaseCtEnum/ClasePtEnum/ClaseMedidorEnum).
const claseCtOptions = ['0.2', '0.2s', '0.5s']
const clasePtOptions = ['0.2', '0.5']
const claseMedidorOptions = ['0.2s', '0.5s']

const proyectosAll = ref([])
const operadoresRed = ref([])
const operadoresRedOptions = computed(() =>
  operadoresRed.value.map((o) => ({ id: o.id, label: o.nombre_comercial || o.nombre_legal })),
)

async function cargarCatalogos() {
  try {
    const [{ data: proyectos }, { data: operadores }] = await Promise.all([
      api.get('/proyectos', { params: { size: 500 } }),
      api.get('/operadores-red'),
    ])
    proyectosAll.value = proyectos.items ?? []
    operadoresRed.value = Array.isArray(operadores) ? operadores : (operadores.items ?? [])
  } catch {
    // Catálogos opcionales para los selects -- si fallan, quedan vacíos.
  }
}

function entrarEdicion() {
  editForm.codigo_frontera = frontera.value.codigo_frontera
  editForm.nombre_frontera = frontera.value.nombre_frontera
  editForm.tipo_frontera = frontera.value.tipo_frontera
  editForm.estado = frontera.value.estado
  editForm.proyecto_id = frontera.value.proyecto_id
  editForm.operador_red_id = frontera.value.operador_red_id
  editForm.clase_ct = frontera.value.clase_ct
  editForm.clase_pt = frontera.value.clase_pt
  editForm.clase_medidor = frontera.value.clase_medidor
  cargarCatalogos()
  router.replace({ query: { edit: 'true' } })
}

function cancelEdit() {
  duplicadoVisible.value = false
  router.replace({ query: {} })
}

async function guardarEdit(forzar = false) {
  guardando.value = true
  try {
    await api.patch(`/fronteras/${frontera.value.id}`, editForm, {
      params: forzar ? { forzar: true } : {},
    })
    toast.add({ severity: 'success', summary: 'Frontera actualizada', life: 2500 })
    duplicadoVisible.value = false
    router.replace({ query: {} })
    await cargar()
  } catch (e) {
    const detail = e.response?.data?.detail
    if (e.response?.status === 409 && detail?.duplicado_nombre) {
      duplicadoInfo.value = detail
      duplicadoVisible.value = true
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: typeof detail === 'string' ? detail : 'No se pudo guardar',
        life: 4000,
      })
    }
  } finally {
    guardando.value = false
  }
}

function tipoLabel(t) {
  const map = {
    generacion: 'Generación',
    consumo: 'Consumo',
    generacion_consumo: 'Gen+Consumo',
    consumo_auxiliar: 'Auxiliar',
    consumo_propio: 'Propio',
  }
  return map[t] || t
}
function tipoSeverity(t) {
  if (t === 'generacion') return 'success'
  if (t === 'consumo') return 'info'
  return 'warn'
}
function estadoSeverity(e) {
  const map = { activa: 'success', en_registro: 'warn', en_falla: 'danger', cancelada: 'secondary' }
  return map[e] || 'info'
}
function fmtFecha(v) {
  return v ? String(v).slice(0, 10) : '—'
}

async function cargar() {
  loading.value = true
  try {
    const { data } = await api.get(`/fronteras/${route.params.id}`)
    frontera.value = data
  } catch (e) {
    errorMsg.value = e.response?.data?.detail || 'No se pudo cargar la frontera.'
  } finally {
    loading.value = false
  }
}

onMounted(cargar)
</script>
