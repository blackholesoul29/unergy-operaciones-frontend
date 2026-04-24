<template>
  <div class="space-y-4" v-if="cliente">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <button @click="$router.push('/clientes')"
        class="text-sm flex items-center gap-1 hover:underline" style="color: #915BD8;">
        <i class="pi pi-arrow-left text-xs" /> Clientes
      </button>
      <span style="color: #c5b9db;">/</span>
      <span class="text-sm font-semibold" style="color: #2C2039;">{{ cliente.razon_social_nombre }}</span>
    </div>

    <!-- Tabs -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden" style="border: 1px solid #e8e0f0;">
      <div class="flex border-b" style="border-color: #e8e0f0;">
        <button v-for="tab in tabs" :key="tab.key"
          @click="activeTab = tab.key"
          class="px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px"
          :style="activeTab === tab.key
            ? 'border-color: #915BD8; color: #915BD8;'
            : 'border-color: transparent; color: #6b5a8a;'">
          <i :class="tab.icon + ' mr-1.5 text-xs'" />{{ tab.label }}
        </button>
      </div>

      <div class="p-6">

        <!-- ── Tab: Información ── -->
        <div v-if="activeTab === 'info'">
          <ClienteForm :initial="cliente" @save="saveInfo" @cancel="() => {}" :inline="true" />
        </div>

        <!-- ── Tab: RUT ── -->
        <div v-if="activeTab === 'rut'" class="max-w-lg space-y-4">
          <p class="text-sm" style="color: #6b5a8a;">
            Pega el enlace al RUT del cliente (Google Drive, OneDrive, etc.)
          </p>
          <div>
            <label class="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style="color: #2C2039;">
              URL del RUT
            </label>
            <input v-model="rutUrl" type="url" placeholder="https://drive.google.com/..."
              class="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
              style="border: 1.5px solid #d4c8e8;" />
          </div>
          <div class="flex gap-2 items-center">
            <button @click="saveRut" class="px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style="background: #915BD8;">Guardar enlace</button>
            <a v-if="cliente.rut_url" :href="cliente.rut_url" target="_blank"
              class="text-sm flex items-center gap-1 hover:underline" style="color: #915BD8;">
              <i class="pi pi-external-link text-xs" /> Ver RUT actual
            </a>
          </div>
        </div>

        <!-- ── Tab: Servicios ── -->
        <div v-if="activeTab === 'servicios'" class="space-y-4">
          <div class="flex items-center justify-between">
            <p class="text-sm" style="color: #6b5a8a;">Servicios que Unergy presta a este cliente.</p>
            <button @click="abrirDialogoServicio"
              class="px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-1.5"
              style="background: #915BD8;">
              <i class="pi pi-plus text-xs" /> Agregar servicio
            </button>
          </div>

          <div v-if="cliente.servicios.length === 0" class="text-center py-10 text-sm" style="color: #9b89b5;">
            Ningún servicio registrado aún.
          </div>

          <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div v-for="s in cliente.servicios" :key="s.id"
              class="flex items-center justify-between rounded-xl p-4"
              style="border: 1.5px solid #e8e0f0;">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                  :style="{ background: servicioColor(s.tipo) }">
                  {{ s.tipo[0].toUpperCase() }}
                </div>
                <div>
                  <p class="text-sm font-semibold capitalize" style="color: #2C2039;">{{ servicioLabel(s.tipo) }}</p>
                  <p v-if="s.fecha_inicio" class="text-xs" style="color: #9b89b5;">
                    Desde {{ formatDate(s.fecha_inicio) }}
                  </p>
                </div>
              </div>
              <button @click="confirmarEliminarServicio(s)"
                class="text-red-400 hover:text-red-600 transition-colors">
                <i class="pi pi-trash text-sm" />
              </button>
            </div>
          </div>
        </div>

        <!-- ── Tab: Contratos/Ofertas ── -->
        <div v-if="activeTab === 'documentos'" class="space-y-4">
          <div class="flex items-center justify-between">
            <p class="text-sm" style="color: #6b5a8a;">Primero se registra la oferta, luego el contrato.</p>
            <button @click="abrirDialogoDocumento(null)"
              class="px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-1.5"
              style="background: #915BD8;">
              <i class="pi pi-plus text-xs" /> Agregar
            </button>
          </div>

          <div v-if="documentosOrdenados.length === 0" class="text-center py-10 text-sm" style="color: #9b89b5;">
            Sin ofertas ni contratos registrados.
          </div>

          <div v-else class="space-y-2">
            <div v-for="doc in documentosOrdenados" :key="doc.id"
              class="flex items-center justify-between rounded-xl px-4 py-3"
              style="border: 1.5px solid #e8e0f0;">
              <div class="flex items-center gap-3">
                <span class="text-xs font-bold px-2 py-0.5 rounded-full"
                  :style="doc.tipo === 'oferta'
                    ? 'background:#f5f0fb; color:#915BD8;'
                    : 'background:#e8f5e9; color:#2e7d32;'">
                  {{ doc.tipo === 'oferta' ? 'Oferta' : 'Contrato' }}
                </span>
                <div>
                  <p class="text-sm font-medium" style="color: #2C2039;">{{ doc.nombre }}</p>
                  <p class="text-xs" style="color: #9b89b5;">
                    {{ doc.numero ? `N° ${doc.numero} · ` : '' }}{{ estadoLabel(doc.estado) }}{{ doc.fecha ? ' · ' + formatDate(doc.fecha) : '' }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <a v-if="doc.archivo_url" :href="doc.archivo_url" target="_blank"
                  class="text-xs hover:underline flex items-center gap-1" style="color: #915BD8;">
                  <i class="pi pi-external-link text-xs" /> Ver
                </a>
                <button @click="abrirDialogoDocumento(doc)" style="color: #6b5a8a;" class="hover:text-purple-700">
                  <i class="pi pi-pencil text-sm" />
                </button>
                <button @click="eliminarDocumento(doc)" class="text-red-400 hover:text-red-600">
                  <i class="pi pi-trash text-sm" />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>

  <!-- Loading -->
  <div v-else class="flex items-center justify-center py-20">
    <i class="pi pi-spin pi-spinner text-2xl" style="color: #915BD8;" />
  </div>

  <!-- ── Dialog: Confirmar servicio ── -->
  <Dialog v-model:visible="dialogServicio" modal header="Agregar servicio" class="w-full max-w-sm">
    <div class="space-y-4 pt-2">
      <div>
        <label class="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style="color: #2C2039;">
          Tipo de servicio *
        </label>
        <Select v-model="nuevoServicio.tipo" :options="serviciosDisponibles"
          optionLabel="label" optionValue="value" class="w-full" placeholder="Seleccionar" />
      </div>
      <div>
        <label class="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style="color: #2C2039;">
          Fecha de inicio
        </label>
        <DatePicker v-model="nuevoServicio.fecha_inicio" class="w-full" dateFormat="dd/mm/yy" showButtonBar />
      </div>
      <div>
        <label class="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style="color: #2C2039;">Notas</label>
        <Textarea v-model="nuevoServicio.notas" class="w-full" rows="2" />
      </div>
    </div>
    <template #footer>
      <Button label="Cancelar" severity="secondary" @click="dialogServicio = false" />
      <Button label="Confirmar y agregar" :disabled="!nuevoServicio.tipo" @click="confirmarServicio"
        style="background: #915BD8; border-color: #915BD8;" />
    </template>
  </Dialog>

  <!-- ── Dialog: Confirmar agregar servicio ── -->
  <Dialog v-model:visible="dialogConfirmServicio" modal header="¿Está seguro?" class="w-full max-w-sm">
    <div class="py-2 text-sm" style="color: #2C2039;">
      ¿Confirma agregar el servicio
      <strong>{{ servicioLabel(nuevoServicio.tipo) }}</strong>
      al cliente <strong>{{ cliente?.razon_social_nombre }}</strong>?
    </div>
    <template #footer>
      <Button label="Cancelar" severity="secondary" @click="dialogConfirmServicio = false" />
      <Button label="Sí, agregar" @click="guardarServicio"
        style="background: #915BD8; border-color: #915BD8;" />
    </template>
  </Dialog>

  <!-- ── Dialog: Documento comercial ── -->
  <Dialog v-model:visible="dialogDocumento" modal
    :header="editandoDocumento?.id ? 'Editar documento' : 'Nueva oferta / contrato'"
    class="w-full max-w-lg">
    <div class="space-y-4 pt-2">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style="color: #2C2039;">Tipo *</label>
          <Select v-model="formDoc.tipo" :options="[{label:'Oferta',value:'oferta'},{label:'Contrato',value:'contrato'}]"
            optionLabel="label" optionValue="value" class="w-full" placeholder="Seleccionar" />
        </div>
        <div>
          <label class="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style="color: #2C2039;">Estado</label>
          <Select v-model="formDoc.estado" :options="estadosDoc" optionLabel="label" optionValue="value" class="w-full" />
        </div>
        <div class="col-span-2">
          <label class="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style="color: #2C2039;">Nombre *</label>
          <InputText v-model="formDoc.nombre" class="w-full" placeholder="Ej: Oferta de operación 2025" />
        </div>
        <div>
          <label class="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style="color: #2C2039;">Número</label>
          <InputText v-model="formDoc.numero" class="w-full" placeholder="Ej: OFR-001" />
        </div>
        <div>
          <label class="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style="color: #2C2039;">Fecha</label>
          <DatePicker v-model="formDoc.fecha" class="w-full" dateFormat="dd/mm/yy" showButtonBar />
        </div>
        <div class="col-span-2">
          <label class="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style="color: #2C2039;">Enlace al documento</label>
          <InputText v-model="formDoc.archivo_url" class="w-full" placeholder="https://drive.google.com/..." />
        </div>
        <div class="col-span-2">
          <label class="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style="color: #2C2039;">Notas</label>
          <Textarea v-model="formDoc.notas" class="w-full" rows="2" />
        </div>
      </div>
    </div>
    <template #footer>
      <Button label="Cancelar" severity="secondary" @click="dialogDocumento = false" />
      <Button label="Guardar" :disabled="!formDoc.tipo || !formDoc.nombre" @click="guardarDocumento"
        style="background: #915BD8; border-color: #915BD8;" />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import DatePicker from 'primevue/datepicker'
import api from '@/api/client'
import ClienteForm from './ClienteForm.vue'

const route = useRoute()
const toast = useToast()
const cliente = ref(null)
const activeTab = ref('info')
const rutUrl = ref('')

const tabs = [
  { key: 'info',       label: 'Información',       icon: 'pi pi-user' },
  { key: 'rut',        label: 'RUT',               icon: 'pi pi-file' },
  { key: 'servicios',  label: 'Servicios',          icon: 'pi pi-briefcase' },
  { key: 'documentos', label: 'Contratos / Ofertas', icon: 'pi pi-file-edit' },
]

const SERVICIOS = [
  { value: 'operacion',      label: 'Operación & Mantenimiento' },
  { value: 'representacion', label: 'Representación en mercado' },
  { value: 'cgm',            label: 'CGM' },
  { value: 'promotor',       label: 'Promotor' },
]

const ESTADOS_DOC = [
  { value: 'borrador',  label: 'Borrador' },
  { value: 'enviado',   label: 'Enviado' },
  { value: 'aceptado',  label: 'Aceptado' },
  { value: 'firmado',   label: 'Firmado' },
  { value: 'rechazado', label: 'Rechazado' },
]

const estadosDoc = ESTADOS_DOC

// ── Servicios ──
const dialogServicio = ref(false)
const dialogConfirmServicio = ref(false)
const nuevoServicio = reactive({ tipo: '', fecha_inicio: null, notas: '' })

const serviciosDisponibles = computed(() => {
  const existentes = (cliente.value?.servicios || []).map(s => s.tipo)
  return SERVICIOS.filter(s => !existentes.includes(s.value))
})

function abrirDialogoServicio() {
  nuevoServicio.tipo = ''
  nuevoServicio.fecha_inicio = null
  nuevoServicio.notas = ''
  dialogServicio.value = true
}

function confirmarServicio() {
  dialogServicio.value = false
  dialogConfirmServicio.value = true
}

async function guardarServicio() {
  try {
    await api.post(`/clientes/${route.params.id}/servicios`, {
      tipo: nuevoServicio.tipo,
      fecha_inicio: nuevoServicio.fecha_inicio ? nuevoServicio.fecha_inicio.toISOString().split('T')[0] : null,
      notas: nuevoServicio.notas || null,
    })
    dialogConfirmServicio.value = false
    toast.add({ severity: 'success', summary: 'Servicio agregado', life: 3000 })
    await cargar()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.detail, life: 4000 })
  }
}

async function confirmarEliminarServicio(s) {
  if (!confirm(`¿Eliminar el servicio "${servicioLabel(s.tipo)}"?`)) return
  await api.delete(`/clientes/${route.params.id}/servicios/${s.id}`)
  toast.add({ severity: 'success', summary: 'Servicio eliminado', life: 3000 })
  await cargar()
}

// ── Documentos ──
const dialogDocumento = ref(false)
const editandoDocumento = ref(null)
const formDoc = reactive({ tipo: '', nombre: '', numero: '', fecha: null, estado: 'borrador', archivo_url: '', notas: '' })

const documentosOrdenados = computed(() => {
  const docs = cliente.value?.documentos_comerciales || []
  return [...docs].sort((a, b) => {
    if (a.tipo === b.tipo) return 0
    return a.tipo === 'oferta' ? -1 : 1
  })
})

function abrirDialogoDocumento(doc) {
  editandoDocumento.value = doc
  if (doc) {
    Object.assign(formDoc, { ...doc, fecha: doc.fecha ? new Date(doc.fecha) : null })
  } else {
    Object.assign(formDoc, { tipo: '', nombre: '', numero: '', fecha: null, estado: 'borrador', archivo_url: '', notas: '' })
  }
  dialogDocumento.value = true
}

async function guardarDocumento() {
  const payload = {
    tipo: formDoc.tipo,
    nombre: formDoc.nombre,
    numero: formDoc.numero || null,
    fecha: formDoc.fecha ? new Date(formDoc.fecha).toISOString().split('T')[0] : null,
    estado: formDoc.estado,
    archivo_url: formDoc.archivo_url || null,
    notas: formDoc.notas || null,
  }
  try {
    if (editandoDocumento.value?.id) {
      await api.patch(`/clientes/${route.params.id}/documentos/${editandoDocumento.value.id}`, payload)
      toast.add({ severity: 'success', summary: 'Documento actualizado', life: 3000 })
    } else {
      await api.post(`/clientes/${route.params.id}/documentos`, payload)
      toast.add({ severity: 'success', summary: 'Documento guardado', life: 3000 })
    }
    dialogDocumento.value = false
    await cargar()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.detail, life: 4000 })
  }
}

async function eliminarDocumento(doc) {
  if (!confirm(`¿Eliminar "${doc.nombre}"?`)) return
  await api.delete(`/clientes/${route.params.id}/documentos/${doc.id}`)
  toast.add({ severity: 'success', summary: 'Eliminado', life: 3000 })
  await cargar()
}

// ── Info & RUT ──
async function saveInfo(payload) {
  await api.patch(`/clientes/${route.params.id}`, payload)
  toast.add({ severity: 'success', summary: 'Información actualizada', life: 3000 })
  await cargar()
}

async function saveRut() {
  await api.patch(`/clientes/${route.params.id}`, { rut_url: rutUrl.value || null })
  toast.add({ severity: 'success', summary: 'RUT guardado', life: 3000 })
  await cargar()
}

// ── Helpers ──
function servicioLabel(tipo) {
  return SERVICIOS.find(s => s.value === tipo)?.label || tipo
}

function servicioColor(tipo) {
  const colors = { operacion: '#915BD8', representacion: '#2C2039', cgm: '#336791', promotor: '#E67E22' }
  return colors[tipo] || '#9b89b5'
}

function estadoLabel(estado) {
  return ESTADOS_DOC.find(e => e.value === estado)?.label || estado
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

async function cargar() {
  const { data } = await api.get(`/clientes/${route.params.id}`)
  cliente.value = data
  rutUrl.value = data.rut_url || ''
}

onMounted(cargar)
</script>
