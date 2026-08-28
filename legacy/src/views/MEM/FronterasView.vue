<template>
  <div class="space-y-5">
    <!-- Header -->
    <PageHeader
      title="Fronteras Comerciales"
      :subtitle="`${filteredFronteras.length} fronteras registradas`"
    >
      <template #actions>
        <Button
          icon="pi pi-file-excel"
          label="Descargar Excel"
          size="small"
          severity="secondary"
          outlined
          @click="descargarExcel"
        />
        <Button icon="pi pi-plus" label="Nueva Frontera" size="small" @click="abrirCrear" />
      </template>
    </PageHeader>

    <!-- Filtros -->
    <!-- flex-nowrap + overflow-x-auto en vez de flex-wrap: si no caben los 5
         grupos en el ancho disponible, se desplaza horizontal en vez de
         partirse en dos líneas o truncar el texto de los dropdowns. -->
    <div
      class="flex flex-nowrap items-end gap-3 overflow-x-auto rounded-xl border bg-white p-3 shadow-sm"
      style="border-color: #ece7f2"
    >
      <div class="flex-shrink-0">
        <label class="mb-1 block text-xs font-medium text-gray-600">Buscar</label>
        <span class="p-input-icon-left">
          <i class="pi pi-search" />
          <InputText v-model="search" placeholder="Buscar frontera..." class="w-48" />
        </span>
      </div>
      <div class="flex-shrink-0">
        <label class="mb-1 block text-xs font-medium text-gray-600">Estado</label>
        <Dropdown
          v-model="estadoFilter"
          :options="estadoOptions"
          optionLabel="label"
          optionValue="value"
          class="w-40"
          placeholder="Todos"
          showClear
        />
      </div>
      <div class="flex-shrink-0">
        <label class="mb-1 block text-xs font-medium text-gray-600">Proyecto</label>
        <Dropdown
          v-model="proyectoFilter"
          :options="proyectoOptions"
          optionLabel="label"
          optionValue="value"
          class="w-48"
          placeholder="Todos"
          showClear
          filter
        />
      </div>
      <div class="flex-shrink-0">
        <label class="mb-1 block text-xs font-medium text-gray-600">Operador</label>
        <Dropdown
          v-model="operadorFilter"
          :options="operadorOptions"
          optionLabel="label"
          optionValue="value"
          class="w-40"
          placeholder="Todos"
          showClear
        />
      </div>
      <div class="flex-shrink-0">
        <label class="mb-1 block text-xs font-medium text-gray-600">Registro ASIC</label>
        <div class="flex gap-2">
          <Dropdown
            v-model="mesFilter"
            :options="mesOptions"
            optionLabel="label"
            optionValue="value"
            class="w-44"
            placeholder="Mes"
            showClear
          />
          <Dropdown
            v-model="anioFilter"
            :options="anioOptions"
            optionLabel="label"
            optionValue="value"
            class="w-32"
            placeholder="Año"
            showClear
          />
        </div>
      </div>
    </div>

    <!-- Resumen Card -->
    <div class="flex flex-wrap gap-4">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="flex h-20 min-w-[9rem] flex-1 flex-col justify-center rounded-xl bg-white p-4 shadow-sm"
        :class="{ 'cursor-pointer select-none': stat.clave }"
        :style="{
          border: stat.clave && soloGenerando ? '1.5px solid #3B82F6' : '1px solid #e8e0f0',
          background: stat.clave && soloGenerando ? 'rgba(59,130,246,0.06)' : '#fff',
        }"
        v-tooltip.top="stat.clave ? 'Clic para filtrar' : undefined"
        @click="stat.clave === 'generando' && (soloGenerando = !soloGenerando)"
      >
        <p class="text-xs font-semibold tracking-wide uppercase" style="color: #6b5a8a">
          {{ stat.label }}
        </p>
        <p class="mt-1 text-2xl font-bold" :style="{ color: stat.color }">{{ stat.value }}</p>
      </div>
    </div>

    <!-- Aviso: fronteras nuevas detectadas en Quoia -->
    <div
      v-if="pendientesQuoia.length"
      class="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
      style="background: rgba(214, 68, 85, 0.06); border: 1.5px solid rgba(214, 68, 85, 0.25)"
    >
      <span class="text-sm font-medium" style="color: #d64455">
        <i class="pi pi-exclamation-triangle mr-1.5 text-xs" />
        {{ pendientesQuoia.length }}
        {{
          pendientesQuoia.length === 1 ? 'frontera nueva detectada' : 'fronteras nuevas detectadas'
        }}
        en Quoia, sin registrar aquí
      </span>
      <Button label="Revisar" size="small" text style="color: #d64455" @click="abrirPendientes" />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <i class="pi pi-spin pi-spinner text-3xl" style="color: #915bd8" />
    </div>

    <!-- Table -->
    <div
      v-else
      class="overflow-hidden rounded-xl bg-white shadow-sm"
      style="border: 1px solid #e8e0f0"
    >
      <DataTable
        :value="filteredFronteras"
        :paginator="true"
        :rows="20"
        :rowsPerPageOptions="[10, 20, 50]"
        responsiveLayout="scroll"
        stripedRows
        class="p-datatable-sm"
        rowHover
        @row-click="(e) => $router.push(`/mem/fronteras/${e.data.id}`)"
      >
        <Column field="codigo_frontera" header="Código" sortable style="min-width: 140px">
          <template #body="{ data }">
            <span class="font-mono text-sm font-semibold" style="color: #915bd8">{{
              data.codigo_frontera || '—'
            }}</span>
          </template>
        </Column>
        <Column field="nombre_frontera" header="Nombre" sortable style="min-width: 200px">
          <template #body="{ data }">
            {{ formatearNombre(data.nombre_frontera) }}
          </template>
        </Column>
        <Column field="proyecto_nombre" header="Proyecto" sortable style="min-width: 180px">
          <template #body="{ data }">
            <RouterLink
              v-if="data.proyecto_id"
              :to="`/proyectos/${data.proyecto_id}`"
              @click.stop
              class="text-sm underline"
              style="color: #915bd8"
            >
              {{ data.proyecto_nombre || `#${data.proyecto_id}` }}
            </RouterLink>
            <span v-else class="text-sm" style="color: #999">—</span>
          </template>
        </Column>
        <Column field="tipo_frontera" header="Tipo" sortable style="min-width: 130px">
          <template #body="{ data }">
            <Tag
              :value="tipoLabel(data.tipo_frontera)"
              :severity="tipoSeverity(data.tipo_frontera)"
            />
          </template>
        </Column>
        <Column field="estado" header="Estado" sortable style="min-width: 120px">
          <template #body="{ data }">
            <Tag :value="data.estado" :severity="estadoSeverity(data.estado)" />
          </template>
        </Column>
        <Column
          field="fecha_registro_asic"
          header="Fecha Registro ASIC"
          sortable
          style="min-width: 150px"
        >
          <template #body="{ data }">
            <span v-if="data.fecha_registro_asic" class="text-sm" style="color: #6b5a8a">{{
              data.fecha_registro_asic
            }}</span>
            <span v-else class="text-xs" style="color: #c4b8d4">—</span>
          </template>
        </Column>
        <Column
          field="nro_serie_med_ppal"
          header="Serial Medidor Principal"
          style="min-width: 170px"
        >
          <template #body="{ data }">
            <span v-if="data.nro_serie_med_ppal" class="font-mono text-xs" style="color: #6b5a8a">{{
              data.nro_serie_med_ppal
            }}</span>
            <span v-else class="text-xs" style="color: #c4b8d4">—</span>
          </template>
        </Column>
        <Column
          field="nro_serie_med_resp"
          header="Serial Medidor Respaldo"
          style="min-width: 170px"
        >
          <template #body="{ data }">
            <span v-if="data.nro_serie_med_resp" class="font-mono text-xs" style="color: #6b5a8a">{{
              data.nro_serie_med_resp
            }}</span>
            <span v-else class="text-xs" style="color: #c4b8d4">—</span>
          </template>
        </Column>
        <Column field="operador_comercial" header="Operador" sortable style="min-width: 120px">
          <template #body="{ data }">
            {{ data.operador_comercial || '—' }}
          </template>
        </Column>
        <Column
          field="proyecto_potencia_instalada_mw"
          header="Cap. MW"
          sortable
          style="min-width: 100px"
        >
          <template #body="{ data }">
            {{
              data.proyecto_potencia_instalada_mw
                ? Number(data.proyecto_potencia_instalada_mw).toFixed(3)
                : '—'
            }}
          </template>
        </Column>
        <Column field="proyecto_municipio" header="Municipio" sortable style="min-width: 130px" />
        <Column header="" style="width: 60px">
          <template #body="{ data }">
            <Button
              icon="pi pi-trash"
              text
              rounded
              size="small"
              severity="danger"
              @click.stop="deleteFrontera(data)"
              v-tooltip="'Eliminar'"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Create Dialog -->
    <Dialog v-model:visible="showCreate" header="Nueva Frontera" modal class="w-full max-w-lg">
      <div class="space-y-4 pt-2">
        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2">
            <label class="mb-1 block text-xs font-semibold uppercase" style="color: #6b5a8a"
              >Proyecto</label
            >
            <Dropdown
              v-model="createForm.proyecto_id"
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
            <label class="mb-1 block text-xs font-semibold uppercase" style="color: #6b5a8a"
              >Código frontera</label
            >
            <InputText v-model="createForm.codigo_frontera" class="w-full" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold uppercase" style="color: #6b5a8a"
              >Nombre *</label
            >
            <InputText v-model="createForm.nombre_frontera" class="w-full" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold uppercase" style="color: #6b5a8a"
              >Tipo *</label
            >
            <Dropdown
              v-model="createForm.tipo_frontera"
              :options="tipoOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
              placeholder="Seleccionar"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold uppercase" style="color: #6b5a8a"
              >Estado</label
            >
            <Dropdown
              v-model="createForm.estado"
              :options="estadoOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold uppercase" style="color: #6b5a8a"
              >Operador red</label
            >
            <Dropdown
              v-model="createForm.operador_red_id"
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
      <template #footer>
        <Button label="Cancelar" severity="secondary" text @click="showCreate = false" />
        <Button
          label="Crear"
          :loading="creating"
          :disabled="!createForm.nombre_frontera || !createForm.tipo_frontera"
          @click="crearFrontera"
        />
      </template>
    </Dialog>

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
        crearla igual.
      </p>
      <div class="flex justify-end gap-2">
        <Button label="Cancelar" severity="secondary" text @click="duplicadoVisible = false" />
        <Button label="Crear de todos modos" :loading="forzando" @click="crearFronteraForzado" />
      </div>
    </Dialog>

    <!-- Pendientes de Quoia Dialog -->
    <Dialog
      v-model:visible="showPendientesDialog"
      header="Fronteras nuevas en Quoia"
      modal
      class="w-full max-w-3xl"
    >
      <p class="mb-4 text-sm" style="color: #6b5a8a">
        Estas fronteras existen en Quoia pero todavía no tienen fila aquí. Asígnales un proyecto
        para agregarlas, o ignóralas si no aplican.
      </p>
      <div v-if="loadingPendientes" class="flex items-center justify-center py-8">
        <i class="pi pi-spin pi-spinner text-2xl" style="color: #915bd8" />
      </div>
      <div
        v-else-if="!pendientesQuoia.length"
        class="py-8 text-center text-sm"
        style="color: #9b89b5"
      >
        No hay fronteras pendientes por revisar.
      </div>
      <div v-else class="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
        <div
          v-for="p in pendientesQuoia"
          :key="p.frt_code"
          class="flex items-center gap-3 rounded-xl p-3"
          style="border: 1.5px solid #e8e0f0"
        >
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold" style="color: #2c2039">
              {{ p.nombre_quoia }}
            </p>
            <p class="font-mono text-xs" style="color: #9b89b5">
              {{ p.frt_code }} · {{ p.categoria }}
            </p>
          </div>
          <Dropdown
            v-model="p._proyectoId"
            :options="proyectosAll"
            optionLabel="nombre_comercial"
            optionValue="id"
            placeholder="Proyecto..."
            filter
            showClear
            class="w-64"
          />
          <Button
            icon="pi pi-check"
            label="Agregar"
            size="small"
            :loading="p._loading === 'confirmar'"
            :disabled="!p._proyectoId"
            @click="confirmarPendiente(p)"
            style="background: #915bd8; border-color: #915bd8"
          />
          <Button
            icon="pi pi-times"
            text
            severity="secondary"
            size="small"
            :loading="p._loading === 'ignorar'"
            @click="ignorarPendiente(p)"
            v-tooltip="'Ignorar'"
          />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import api from '@/api/client'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { formatearNombre } from '@/utils/nombreFormato'
import { exportarExcel } from '@/utils/exportarExcel'

const toast = useToast()
const confirm = useConfirm()

const route = useRoute()
const router = useRouter()

const fronteras = ref([])
const loading = ref(true)

// Filtros sincronizados con la URL (?q=&estado=&proyecto=&operador=&mes=&anio=&generando=)
// para que se sostengan al volver con el boton "atras" o al refrescar.
const search = ref(route.query.q || '')
const estadoFilter = ref(route.query.estado || null)
const proyectoFilter = ref(route.query.proyecto ? Number(route.query.proyecto) : null)
const operadorFilter = ref(route.query.operador || null)
const mesFilter = ref(route.query.mes ? Number(route.query.mes) : null)
const anioFilter = ref(route.query.anio ? Number(route.query.anio) : null)
const soloGenerando = ref(route.query.generando === '1')

watch(
  [search, estadoFilter, proyectoFilter, operadorFilter, mesFilter, anioFilter, soloGenerando],
  ([q, estado, proyecto, operador, mes, anio, generando]) => {
    const query = {}
    if (q) query.q = q
    if (estado) query.estado = estado
    if (proyecto) query.proyecto = proyecto
    if (operador) query.operador = operador
    if (mes) query.mes = mes
    if (anio) query.anio = anio
    if (generando) query.generando = '1'
    router.replace({ query })
  },
)
function blankCreateForm() {
  return {
    proyecto_id: null,
    codigo_frontera: '',
    nombre_frontera: '',
    tipo_frontera: null,
    estado: 'activa',
    operador_red_id: null,
  }
}

const showCreate = ref(false)
const creating = ref(false)
const createForm = ref(blankCreateForm())

// Aviso de nombre parecido (409 estructurado, igual que en Proyectos): se
// puede confirmar y crear igual con forzar=true.
const duplicadoVisible = ref(false)
const duplicadoInfo = ref(null) // { mensaje, candidato_id, candidato_nombre }
const forzando = ref(false)

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

const proyectoOptions = computed(() => {
  const seen = new Map()
  for (const f of fronteras.value) {
    if (f.proyecto_id != null && !seen.has(f.proyecto_id)) {
      seen.set(f.proyecto_id, f.proyecto_nombre || `#${f.proyecto_id}`)
    }
  }
  return [...seen.entries()]
    .map(([value, label]) => ({ label, value }))
    .sort((a, b) => a.label.localeCompare(b.label))
})

const operadorOptions = computed(() => {
  const seen = new Set()
  for (const f of fronteras.value) {
    const nombre = f.operador_comercial
    if (nombre) seen.add(nombre)
  }
  return [...seen].sort().map((v) => ({ label: v, value: v }))
})

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]
const mesOptions = MESES.map((label, i) => ({ label, value: i + 1 }))

const anioOptions = computed(() => {
  const seen = new Set()
  for (const f of fronteras.value) {
    if (!f.fecha_registro_asic) continue
    const anio = new Date(f.fecha_registro_asic).getFullYear()
    if (!isNaN(anio)) seen.add(anio)
  }
  return [...seen].sort((a, b) => b - a).map((v) => ({ label: String(v), value: v }))
})

const filteredFronteras = computed(() => {
  let list = fronteras.value
  if (estadoFilter.value) list = list.filter((f) => f.estado === estadoFilter.value)
  if (proyectoFilter.value) list = list.filter((f) => f.proyecto_id === proyectoFilter.value)
  if (operadorFilter.value) list = list.filter((f) => f.operador_comercial === operadorFilter.value)
  if (mesFilter.value || anioFilter.value) {
    list = list.filter((f) => {
      if (!f.fecha_registro_asic) return false
      const d = new Date(f.fecha_registro_asic)
      if (isNaN(d.getTime())) return false
      if (mesFilter.value && d.getMonth() + 1 !== mesFilter.value) return false
      if (anioFilter.value && d.getFullYear() !== anioFilter.value) return false
      return true
    })
  }
  if (soloGenerando.value) list = list.filter(generaDeVerdad)
  if (search.value) {
    const s = search.value.toLowerCase()
    list = list.filter(
      (f) =>
        (f.codigo_frontera || '').toLowerCase().includes(s) ||
        (f.nombre_frontera || '').toLowerCase().includes(s) ||
        (f.proyecto_nombre || '').toLowerCase().includes(s) ||
        (f.operador_comercial || '').toLowerCase().includes(s) ||
        (f.proyecto_municipio || '').toLowerCase().includes(s),
    )
  }
  return list
})

const TIPOS_GENERACION = ['generacion', 'generacion_consumo']

// "Genera de verdad" = tipo Generacion Y la corrida mas reciente del
// pipeline Reporte Energia (reporte_energia_generacion, via
// f.generando_actual) reporto energia real > 0. Reemplaza el criterio
// anterior (fecha_inicio_comercializacion contra la API de Unergy): esa
// fuente dejaba fuera fronteras sin identificador de monitoreo resuelto o
// sin datos en Unergy (ej. San Pelayo, Chiriguana N1 -- ambas confirmadas
// generando) aunque el pipeline propio ya las viera generar. f.generando_actual
// es null si el pipeline todavia no ha corrido para esa frontera (no
// implica que no genere) -- esas quedan fuera del conteo igual que antes.
function generaDeVerdad(f) {
  return TIPOS_GENERACION.includes(f.tipo_frontera) && f.generando_actual === true
}

const stats = computed(() => {
  const all = fronteras.value
  return [
    { label: 'Total', value: all.length, color: '#2C2039' },
    { label: 'Activas', value: all.filter((f) => f.estado === 'activa').length, color: '#10B981' },
    {
      label: 'En registro',
      value: all.filter((f) => f.estado === 'en_registro').length,
      color: '#F0C040',
    },
    {
      label: 'Generando actualmente',
      value: all.filter(generaDeVerdad).length,
      color: '#3B82F6',
      clave: 'generando',
    },
    {
      label: 'Cap. total MW',
      value: all
        .reduce((s, f) => s + (Number(f.proyecto_potencia_instalada_mw) || 0), 0)
        .toFixed(1),
      color: '#915BD8',
    },
  ]
})

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

async function descargarExcel() {
  await exportarExcel(
    filteredFronteras.value,
    [
      { header: 'Código', value: (f) => f.codigo_frontera || '' },
      { header: 'Nombre', value: (f) => formatearNombre(f.nombre_frontera) },
      { header: 'Proyecto', value: (f) => f.proyecto_nombre || '' },
      { header: 'Tipo', value: (f) => tipoLabel(f.tipo_frontera) },
      { header: 'Estado', value: (f) => f.estado || '' },
      { header: 'Fecha Registro ASIC', value: (f) => f.fecha_registro_asic || '' },
      { header: 'Serial Medidor Principal', value: (f) => f.nro_serie_med_ppal || '' },
      { header: 'Serial Medidor Respaldo', value: (f) => f.nro_serie_med_resp || '' },
      { header: 'Operador', value: (f) => f.operador_comercial || '' },
      {
        header: 'Cap. MW',
        value: (f) =>
          f.proyecto_potencia_instalada_mw
            ? Number(f.proyecto_potencia_instalada_mw).toFixed(3)
            : '',
      },
      { header: 'Municipio', value: (f) => f.proyecto_municipio || '' },
    ],
    `fronteras_${new Date().toISOString().slice(0, 10)}.xlsx`,
    'Fronteras',
  )
}

function abrirCrear() {
  createForm.value = blankCreateForm()
  showCreate.value = true
  loadProyectosAll()
}

const pendingCreatePayload = ref(null) // body a reintentar con forzar=true

async function crearFrontera() {
  if (!createForm.value) return
  creating.value = true
  const body = { ...createForm.value, codigo_frontera: createForm.value.codigo_frontera || null }
  try {
    await api.post('/fronteras', body)
    toast.add({ severity: 'success', summary: 'Frontera creada', life: 2500 })
    showCreate.value = false
    await loadData()
  } catch (e) {
    const detail = e.response?.data?.detail
    // Aviso de nombre parecido (409 estructurado): se puede confirmar y crear
    // igual. Distinto de un choque real de columna unica (detail es un string).
    if (e.response?.status === 409 && detail?.duplicado_nombre) {
      duplicadoInfo.value = detail
      pendingCreatePayload.value = body
      duplicadoVisible.value = true
      return
    }
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: typeof detail === 'string' ? detail : 'No se pudo crear la frontera',
      life: 4000,
    })
  } finally {
    creating.value = false
  }
}

async function crearFronteraForzado() {
  forzando.value = true
  try {
    await api.post('/fronteras', pendingCreatePayload.value, { params: { forzar: true } })
    toast.add({ severity: 'success', summary: 'Frontera creada', life: 2500 })
    duplicadoVisible.value = false
    showCreate.value = false
    await loadData()
  } catch (e) {
    const detail = e.response?.data?.detail
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: typeof detail === 'string' ? detail : 'No se pudo crear la frontera',
      life: 4000,
    })
  } finally {
    forzando.value = false
  }
}

function deleteFrontera(f) {
  confirm.require({
    message: `¿Eliminar la frontera ${f.codigo_frontera}? Esta acción no se puede deshacer.`,
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: 'Cancelar', severity: 'secondary' },
    acceptProps: { label: 'Eliminar', severity: 'danger' },
    accept: async () => {
      try {
        await api.delete(`/fronteras/${f.id}`)
        toast.add({ severity: 'success', summary: 'Frontera eliminada', life: 2000 })
        await loadData()
      } catch (e) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: e.response?.data?.detail || 'Error al eliminar',
          life: 4000,
        })
      }
    },
  })
}

async function loadData() {
  loading.value = true
  try {
    const { data } = await api.get('/fronteras', { params: { limit: 500 } })
    fronteras.value = data
  } catch (e) {
    console.error('Error loading fronteras:', e)
  } finally {
    loading.value = false
  }
}

// ── Fronteras pendientes de Quoia (detectar + confirmar manual) ────────────────
const pendientesQuoia = ref([])
const loadingPendientes = ref(false)
const showPendientesDialog = ref(false)
const proyectosAll = ref([])

async function loadPendientesQuoia() {
  try {
    const { data } = await api.get('/fronteras/quoia/pendientes')
    pendientesQuoia.value = data.map((p) => ({
      ...p,
      _proyectoId: p.proyecto_sugerido_id ?? null,
      _loading: null,
    }))
  } catch (e) {
    // Gaia sin configurar u otro error -- no bloquea la vista, solo no se muestra el aviso.
    pendientesQuoia.value = []
  }
}

async function loadProyectosAll() {
  if (proyectosAll.value.length) return
  try {
    const { data } = await api.get('/proyectos', { params: { size: 500 } })
    proyectosAll.value = data.items ?? []
  } catch {
    proyectosAll.value = []
  }
}

function abrirPendientes() {
  showPendientesDialog.value = true
  loadingPendientes.value = true
  Promise.all([loadPendientesQuoia(), loadProyectosAll()]).finally(() => {
    loadingPendientes.value = false
  })
}

async function confirmarPendiente(p) {
  p._loading = 'confirmar'
  try {
    await api.post(`/fronteras/quoia/pendientes/${p.frt_code}/confirmar`, {
      proyecto_id: p._proyectoId,
    })
    pendientesQuoia.value = pendientesQuoia.value.filter((x) => x.frt_code !== p.frt_code)
    toast.add({ severity: 'success', summary: 'Frontera agregada', life: 2500 })
    await loadData()
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: e.response?.data?.detail || 'No se pudo agregar la frontera',
      life: 4000,
    })
  } finally {
    p._loading = null
  }
}

function ignorarPendiente(p) {
  confirm.require({
    message: `¿Ignorar "${p.nombre_quoia}" (${p.frt_code})? No volverá a aparecer como pendiente.`,
    header: 'Ignorar frontera de Quoia',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: 'Cancelar', severity: 'secondary' },
    acceptProps: { label: 'Ignorar', severity: 'danger' },
    accept: async () => {
      p._loading = 'ignorar'
      try {
        await api.post(`/fronteras/quoia/pendientes/${p.frt_code}/ignorar`, {})
        pendientesQuoia.value = pendientesQuoia.value.filter((x) => x.frt_code !== p.frt_code)
        toast.add({ severity: 'success', summary: 'Ignorada', life: 2000 })
      } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo ignorar', life: 4000 })
      } finally {
        p._loading = null
      }
    },
  })
}

// Catálogo de operadores de red -- select en vez de texto libre, para que
// coincida con el vínculo real que usa Reporte CGM (Frontera.operador_red_id).
const operadoresRed = ref([])
const operadoresRedOptions = computed(() =>
  operadoresRed.value.map((o) => ({ id: o.id, label: o.nombre_comercial || o.nombre_legal })),
)
async function loadOperadoresRed() {
  try {
    const { data } = await api.get('/operadores-red')
    operadoresRed.value = Array.isArray(data) ? data : (data.items ?? [])
  } catch {
    /* graceful degrade -- el select queda vacío */
  }
}

onMounted(() => {
  loadData()
  loadPendientesQuoia()
  loadOperadoresRed()
})

// Nota: el backfill de marca/modelo/serie de medidor (Quoia) ya no tiene
// botón aquí -- ya se corrió y hoy no queda nada por completar (Quoia no
// tiene más info para dar). El endpoint POST /fronteras/backfill-medidor
// se eliminó (commit 6648bb3) -- ahora una frontera nueva con
// codigo_frontera se completa sola al crearla (ver
// _enriquecer_medidor_desde_quoia() en fronteras.py). Corrección de
// comentario desactualizado, auditoría de eficiencia 2026-08-26.
</script>
