<template>
  <div>
    <div class="flex items-center justify-between mb-3">
      <span class="text-sm text-gray-500">{{ ofertas.length }} oferta(s) — una por planta × servicio</span>
      <Button label="Agregar oferta" icon="pi pi-plus" size="small" @click="abrirNueva" />
    </div>

    <DataTable :value="ofertas" dataKey="id" class="text-sm" responsiveLayout="scroll">
      <Column field="planta_nombre" header="Planta">
        <template #body="{ data }">{{ data.planta_nombre || '—' }}</template>
      </Column>
      <Column header="Tipo">
        <template #body="{ data }">{{ labelTipo(data.tipo) }}</template>
      </Column>
      <Column header="Servicios buscados">
        <template #body="{ data }">
          <template v-if="data.detalle && data.detalle.servicios && data.detalle.servicios.length">
            <span v-for="s in data.detalle.servicios" :key="s"
                  class="inline-block bg-blue-50 text-blue-700 rounded px-1.5 py-0.5 mr-1 mb-1 text-xs">{{ s }}</span>
          </template>
          <span v-else class="text-gray-400">—</span>
          <div v-if="data.detalle && data.detalle.fpo" class="text-xs text-gray-400 mt-1">FPO: {{ data.detalle.fpo }}</div>
        </template>
      </Column>
      <Column header="Código de seguimiento">
        <template #body="{ data }"><span class="font-mono text-xs">{{ data.codigo_seguimiento || data.numero_oferta || '—' }}</span></template>
      </Column>
      <Column field="precio_detalle" header="Precio">
        <template #body="{ data }">{{ data.precio_detalle || '—' }}</template>
      </Column>
      <!-- La etapa es de la oferta: cada una avanza sola. -->
      <Column header="Etapa" style="min-width:11rem">
        <template #body="{ data }">
          <Dropdown :modelValue="data.estado" :options="ESTADOS" optionLabel="label"
                    optionValue="value" class="w-full text-xs"
                    :loading="moviendo === data.id"
                    @update:modelValue="v => cambiarEtapa(data, v)" />
        </template>
      </Column>
      <Column header="Enviada">
        <template #body="{ data }">
          <span v-if="data.fecha_oferta">{{ fmtFecha(data.fecha_oferta) }}</span>
          <span v-else class="text-gray-300">—</span>
        </template>
      </Column>
      <Column header="Seguimientos">
        <template #body="{ data }">
          <div class="flex items-center gap-2">
            <span :class="sinRespuesta(data) ? 'text-red-600 font-semibold' : ''">
              {{ data.seguimientos || 0 }}
            </span>
            <Button icon="pi pi-send" text rounded size="small" :loading="tocando === data.id"
                    title="Registrar un seguimiento (reenvío o llamada de insistencia)"
                    @click="registrarSeguimiento(data)" />
          </div>
        </template>
      </Column>
      <Column header="Última respuesta">
        <template #body="{ data }">
          <span v-if="data.fecha_ultima_respuesta">{{ fmtFecha(data.fecha_ultima_respuesta) }}</span>
          <span v-else-if="data.fecha_oferta" class="text-red-600 text-xs">sin respuesta</span>
          <span v-else class="text-gray-300">—</span>
        </template>
      </Column>
      <Column header="Documento">
        <template #body="{ data }">
          <a v-if="data.documento_url" :href="data.documento_url" target="_blank" rel="noopener"
             class="text-primary underline text-xs">PDF</a>
          <span v-else class="text-gray-300">—</span>
        </template>
      </Column>
      <Column header="" style="width:6rem">
        <template #body="{ data }">
          <Button icon="pi pi-pencil" text rounded size="small" @click="abrirEditar(data)" />
          <Button icon="pi pi-trash" text rounded size="small" severity="danger" @click="borrar(data)" />
        </template>
      </Column>
      <template #empty><span class="text-gray-400 text-sm">Sin ofertas todavía.</span></template>
    </DataTable>

    <Dialog v-model:visible="showDialog" :header="editId ? 'Editar oferta' : 'Nueva oferta'" modal class="w-full max-w-lg">
      <div class="flex flex-col gap-3">
        <div>
          <label class="block text-sm font-medium mb-1">Tipo de servicio</label>
          <Dropdown v-model="form.tipo" :options="TIPOS_OFERTA" optionLabel="label" optionValue="value" class="w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Planta</label>
          <InputText v-model.trim="form.planta_nombre" class="w-full" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium mb-1">Código de seguimiento</label>
            <InputText v-model.trim="form.numero_oferta" class="w-full" placeholder="Se autogenera (OP.…) si lo dejas vacío" />
          </div>
          <div v-if="!editId">
            <label class="block text-sm font-medium mb-1">Etapa</label>
            <Dropdown v-model="form.estado" :options="ESTADOS" optionLabel="label" optionValue="value" class="w-full" />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Precio (detalle)</label>
          <InputText v-model.trim="form.precio_detalle" class="w-full" placeholder="p. ej. REP: 6 · CGM: 6" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium mb-1">Fecha de oferta</label>
            <Calendar v-model="form.fecha_oferta" dateFormat="yy-mm-dd" showIcon class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Fecha tentativa inicio</label>
            <Calendar v-model="form.fecha_tentativa_inicio" dateFormat="yy-mm-dd" showIcon class="w-full" />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Contrato firmado</label>
          <InputText v-model.trim="form.contrato_firmado" class="w-full" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" text @click="showDialog = false" />
        <Button label="Guardar" icon="pi pi-check" :disabled="!form.tipo || guardando" @click="guardar" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import Calendar from 'primevue/calendar'
import { useToast } from 'primevue/usetoast'
import api from '@/api/client'

const props = defineProps({
  oportunidadId: { type: [Number, String], required: true },
  ofertas: { type: Array, default: () => [] },
})
const emit = defineEmits(['changed'])
const toast = useToast()

const TIPOS_OFERTA = [
  { label: 'Servicios operacionales', value: 'servicios_operacionales' },
  { label: 'Compra de energía', value: 'compra_energia' },
  { label: 'Comunidad energética', value: 'comunidad_energetica' },
]
const ESTADOS = [
  { label: 'Oportunidad', value: 'oportunidad' },
  { label: 'Oferta', value: 'oferta' },
  { label: 'Contrato', value: 'contrato' },
  { label: 'Firmado', value: 'firmado' },
  { label: 'Operando', value: 'operando' },
  { label: 'Terminado', value: 'terminado' },
  { label: 'Declinado', value: 'declinado' },
]

const moviendo = ref(null)

async function cambiarEtapa(oferta, estado) {
  if (!estado || estado === oferta.estado) return
  moviendo.value = oferta.id
  try {
    await api.post(`/comercial/ofertas/${oferta.id}/estado`, { estado })
    emit('changed')
  } catch (err) {
    toast.add({ severity: 'error', summary: 'No se pudo cambiar la etapa',
                detail: err.response?.data?.detail ?? '', life: 5000 })
  } finally {
    moviendo.value = null
  }
}

const showDialog = ref(false)
const editId = ref(null)
const guardando = ref(false)
const form = reactive({
  tipo: null, planta_nombre: '', numero_oferta: '', estado: 'oferta',
  precio_detalle: '', fecha_oferta: null, fecha_tentativa_inicio: null, contrato_firmado: '',
})

const tocando = ref(null)

function fmtFecha(v) {
  return v ? new Date(`${String(v).slice(0, 10)}T00:00:00`).toLocaleDateString('es-CO', { dateStyle: 'medium' }) : '—'
}
// Se envió y el cliente nunca contestó: eso es lo que hay que mirar.
function sinRespuesta(o) { return (o.seguimientos || 0) > 0 && !o.fecha_ultima_respuesta }

async function registrarSeguimiento(oferta) {
  tocando.value = oferta.id
  try {
    await api.post(`/comercial/ofertas/${oferta.id}/seguimiento`)
    emit('changed')
  } catch (err) {
    toast.add({ severity: 'error', summary: 'No se pudo registrar el seguimiento',
                detail: err.response?.data?.detail ?? '', life: 5000 })
  } finally {
    tocando.value = null
  }
}

function labelTipo(v) { return TIPOS_OFERTA.find(t => t.value === v)?.label ?? v }

function aFecha(s) { return s ? new Date(`${String(s).slice(0, 10)}T00:00:00`) : null }
function aFechaStr(v) {
  if (!v) return null
  if (typeof v === 'string') return v.slice(0, 10)
  const d = new Date(v)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function reset() {
  Object.assign(form, {
    tipo: null, planta_nombre: '', numero_oferta: '', estado: 'oferta',
    precio_detalle: '', fecha_oferta: null, fecha_tentativa_inicio: null, contrato_firmado: '',
  })
}
function abrirNueva() { editId.value = null; reset(); showDialog.value = true }
function abrirEditar(o) {
  editId.value = o.id
  Object.assign(form, {
    tipo: o.tipo, planta_nombre: o.planta_nombre || '', numero_oferta: o.numero_oferta || '',
    precio_detalle: o.precio_detalle || '',
    fecha_oferta: aFecha(o.fecha_oferta), fecha_tentativa_inicio: aFecha(o.fecha_tentativa_inicio),
    contrato_firmado: o.contrato_firmado || '',
  })
  showDialog.value = true
}

async function guardar() {
  guardando.value = true
  const payload = {
    tipo: form.tipo,
    planta_nombre: form.planta_nombre || null,
    numero_oferta: form.numero_oferta || null,
    precio_detalle: form.precio_detalle || null,
    fecha_oferta: aFechaStr(form.fecha_oferta),
    fecha_tentativa_inicio: aFechaStr(form.fecha_tentativa_inicio),
    contrato_firmado: form.contrato_firmado || null,
  }
  try {
    if (editId.value) {
      await api.patch(`/comercial/ofertas/${editId.value}`, payload)
    } else {
      await api.post(`/comercial/oportunidades/${props.oportunidadId}/ofertas`, payload)
    }
    showDialog.value = false
    emit('changed')
  } catch (err) {
    toast.add({ severity: 'error', summary: 'No se pudo guardar la oferta', detail: err.response?.data?.detail ?? '', life: 5000 })
  } finally {
    guardando.value = false
  }
}

async function borrar(o) {
  try {
    await api.delete(`/comercial/ofertas/${o.id}`)
    emit('changed')
  } catch (err) {
    toast.add({ severity: 'error', summary: 'No se pudo eliminar', detail: err.response?.data?.detail ?? '', life: 5000 })
  }
}
</script>
