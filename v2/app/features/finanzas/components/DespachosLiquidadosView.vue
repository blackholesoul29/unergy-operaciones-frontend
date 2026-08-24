<template>
  <div class="space-y-4">
    <PageHeader title="Despachos liquidados"
                subtitle="Energía ya liquidada por proyecto y concepto">
      <template #actions>
        <Button label="Consultar IPP" size="small" outlined :loading="accion === 'ipp'" @click="abrir('ipp')">
          <template #icon><PercentIcon class="size-[1em]" /></template>
        </Button>
        <Button label="Consultar FTP" size="small" outlined :loading="accion === 'ftp'" @click="abrir('ftp')">
          <template #icon><DownloadIcon class="size-[1em]" /></template>
        </Button>
        <Button label="Liquidar" size="small" :loading="accion === 'liquidar'" @click="abrir('liquidar')">
          <template #icon><ZapIcon class="size-[1em]" /></template>
        </Button>
      </template>
    </PageHeader>

    <!-- Dialog de acción -->
    <Dialog v-model:visible="dialogVisible" :header="cfg.header" modal class="w-full max-w-md">
      <div class="space-y-3 pt-1">
        <p class="text-xs text-gray-500">{{ cfg.ayuda }}</p>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="field-label">Mes</label>
            <Select v-model="c.mes" :options="MESES" optionLabel="label" optionValue="value" class="w-full" />
          </div>
          <div>
            <label class="field-label">Año</label>
            <InputNumber v-model="c.anio" :useGrouping="false" class="w-full" />
          </div>
        </div>
        <div v-if="cfg.version">
          <label class="field-label">Versión</label>
          <Select v-model="c.version" :options="VERSIONES" class="w-full" />
        </div>

        <p v-if="progreso" class="text-[11px] text-gray-500 flex items-center gap-2">
          <LoaderCircleIcon class="size-[1em] animate-spin" /> {{ progreso }}
        </p>

        <div class="flex justify-end gap-2 pt-1">
          <Button label="Cancelar" severity="secondary" size="small" :disabled="!!accion"
                  @click="dialogVisible = false" />
          <Button :label="cfg.submit" size="small" :loading="!!accion" @click="ejecutar" />
        </div>
      </div>
    </Dialog>

    <!-- Diagnóstico de un proyecto -->
    <Dialog v-model:visible="diagVisible" header="Diagnóstico del proyecto" modal class="w-full max-w-2xl">
      <div class="space-y-3 pt-1">
        <p class="text-xs text-gray-500">
          Por qué <strong>{{ diagProyecto }}</strong> sale o no en el estado de resultados
          de {{ filtros.month }}/{{ filtros.year }}.
        </p>
        <div v-if="diagCargando" class="py-8 text-center text-gray-400">
          <LoaderCircleIcon class="text-2xl size-[1em] animate-spin" />
        </div>
        <div v-else-if="diag" class="space-y-1.5 max-h-96 overflow-y-auto">
          <div v-for="ch in diag.checks" :key="ch.key"
               class="flex items-start gap-2 rounded-lg border px-3 py-2 text-xs"
               :style="ch.status === 'ok'
                 ? 'border-color:#BBF7D0; background:#F0FDF4'
                 : 'border-color:#FECACA; background:#FEF2F2'">
            <CircleCheckIcon v-if="ch.status === 'ok'" class="size-[1em]" :style="ch.status === 'ok' ? 'color:#10B981' : 'color:#D64455'" />
            <CircleXIcon v-else class="size-[1em]" :style="ch.status === 'ok' ? 'color:#10B981' : 'color:#D64455'" />
            <div class="min-w-0">
              <span class="font-mono text-[10px] text-gray-400">{{ ch.key }}</span>
              <p class="text-gray-700">{{ ch.message }}</p>
            </div>
          </div>
        </div>
      </div>
    </Dialog>

    <!-- Filtros -->
    <div class="bg-white rounded-xl shadow-sm p-3 flex flex-wrap gap-3 items-end border" style="border-color:#ECE7F2">
      <div>
        <label class="field-label">Mes</label>
        <Select v-model="filtros.month" :options="MESES" optionLabel="label" optionValue="value"
                class="w-36" @change="cargar" />
      </div>
      <div>
        <label class="field-label">Año</label>
        <InputNumber v-model="filtros.year" :useGrouping="false" class="w-28" @update:modelValue="cargar" />
      </div>
      <div>
        <label class="field-label">Versión</label>
        <Select v-model="filtros.version" :options="VERSIONES" class="w-28" @change="cargar" />
      </div>
      <div>
        <label class="field-label">Buscar</label>
        <IconField>
          <InputIcon><SearchIcon class="size-[1em]" /></InputIcon>
          <InputText v-model="q" placeholder="Proyecto, concepto, tipo…" class="w-64" />
        </IconField>
      </div>
      <div class="flex-1" />
      <Button size="small" text rounded :loading="loading" v-tooltip.left="'Recargar'" @click="cargar">
        <template #icon><RefreshCwIcon class="size-[1em]" /></template>
      </Button>
      <div class="text-xs text-gray-400 self-center">
        {{ filtrados.length }} registro{{ filtrados.length === 1 ? '' : 's' }}
      </div>
    </div>

    <!-- Los warnings del ER significan que las cifras están incompletas -->
    <div v-if="!loading && avisos.length" class="rounded-xl px-4 py-3 border text-xs"
         style="background:#FFF8E6; border-color:#F5E3B3; color:#7A5C00">
      <div class="flex items-center gap-2 font-semibold">
        <TriangleAlertIcon class="size-[1em]" />
        {{ avisos.length }} proyecto{{ avisos.length === 1 ? '' : 's' }} con cifras incompletas
        <button class="underline ml-1" @click="avisosAbiertos = !avisosAbiertos">
          {{ avisosAbiertos ? 'ocultar' : 'ver detalle' }}
        </button>
      </div>
      <div v-if="avisosAbiertos" class="mt-2 space-y-1 max-h-56 overflow-y-auto">
        <div v-for="a in avisos" :key="a.proyecto">
          <span class="font-medium">{{ a.proyecto }}</span>
          <ul class="ml-4 list-disc">
            <li v-for="(t, i) in a.avisos" :key="i">{{ t }}</li>
          </ul>
        </div>
      </div>
    </div>

    <div v-if="error" class="rounded-lg px-3 py-2 text-xs flex items-center gap-2"
         style="background:#FEF2F2; border:1px solid #FECACA; color:#B42318">
      <CircleXIcon class="size-[1em]" /> {{ error }}
    </div>

    <!-- Tabla -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden border" style="border-color:#ECE7F2">
      <div class="overflow-x-auto">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100">
              <th v-for="col in COLUMNAS" :key="col.key"
                  class="px-4 py-2.5 font-medium text-gray-500 text-xs uppercase tracking-wide whitespace-nowrap"
                  :class="col.right ? 'text-right' : 'text-left'">
                {{ col.label }}
              </th>
              <th class="px-4 py-2.5 w-10" />
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in filtrados" :key="i"
                class="border-t border-gray-100 hover:bg-gray-50/70 transition-colors duration-100">
              <td class="px-4 py-2">{{ row.proyecto_nombre || row.proyecto || '—' }}</td>
              <td class="px-4 py-2">{{ row.concepto || '—' }}</td>
              <td class="px-4 py-2 whitespace-nowrap">
                <span class="text-xs font-mono text-gray-500">{{ row.tipo_dato || '—' }}</span>
              </td>
              <td class="px-4 py-2 text-right font-mono text-xs">{{ fmtNum(row.energia_kwh) }}</td>
              <td class="px-4 py-2 text-right font-mono text-xs"
                  :style="row.valor < 0 ? 'color:#D64455' : ''">{{ fmtNum(row.valor) }}</td>
              <td class="px-4 py-2 whitespace-nowrap uppercase text-xs">{{ row.version || '—' }}</td>
              <td class="px-4 py-2">
                <Button text rounded size="small" v-tooltip.left="'Diagnosticar este proyecto'" @click="diagnosticar(row.proyecto)">
                  <template #icon><SearchIcon class="size-[1em]" /></template>
                </Button>
              </td>
            </tr>
            <tr v-if="loading">
              <td :colspan="COLUMNAS.length + 1" class="px-4 py-12 text-center text-gray-400">
                <LoaderCircleIcon class="text-2xl size-[1em] animate-spin" />
              </td>
            </tr>
            <tr v-else-if="!filtrados.length">
              <td :colspan="COLUMNAS.length + 1" class="px-4 py-12 text-center text-sm text-gray-400">
                <ZapIcon class="text-2xl mb-2 block text-gray-300 size-[1em]" />
                No hay despachos liquidados para este período.<br>
                <span class="text-xs">Corre «Consultar FTP» y después «Liquidar».</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import { toast } from 'vue-sonner'
import { VERSIONES, VERSION_INICIAL, AccionCiclo } from '~/features/liquidaciones/types'
import { LiquidacionesApiService } from '~/features/liquidaciones/services/liquidaciones-api'
import { CircleCheckIcon, CircleXIcon, DownloadIcon, LoaderCircleIcon, PercentIcon, RefreshCwIcon, SearchIcon, TriangleAlertIcon, ZapIcon } from '@lucide/vue'

const liquidacionesApi = new LiquidacionesApiService()


const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
].map((label, i) => ({ label, value: i + 1 }))

const COLUMNAS = [
  { key: 'proyecto',    label: 'Proyecto' },
  { key: 'concepto',    label: 'Concepto' },
  { key: 'tipo_dato',   label: 'Tipo de dato' },
  { key: 'energia_kwh', label: 'Energía (kWh)', right: true },
  { key: 'valor',       label: 'Valor',         right: true },
  { key: 'version',     label: 'Versión' },
]

// Las tres acciones del ciclo que arrancan aquí. IPP y FTP son independientes;
// liquidar necesita el FTP ya descargado y va ANTES de repartir.
const MODOS = {
  ipp: {
    header: 'Consultar IPP', submit: 'Consultar', version: false,
    ayuda: 'Trae el IPP del mes desde el DANE. Es inmediato y no se puede enviar uno propio.',
  },
  ftp: {
    header: 'Consultar FTP', submit: 'Descargar', version: true,
    ayuda: 'Descarga los ocho archivos del FTP de XM. Requiere los códigos SIC y FRT del proyecto y contratos vigentes en el mes.',
  },
  liquidar: {
    header: 'Liquidar', submit: 'Liquidar', version: true,
    ayuda: 'Liquida los contratos del período. Requiere el FTP ya descargado y va antes de repartir los costos de XM.',
  },
}

// ── Estado ───────────────────────────────────────────────────────────────────
const hoy = new Date()
const anterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
const filtros = reactive({
  month: anterior.getMonth() + 1,
  year: anterior.getFullYear(),
  version: VERSION_INICIAL,
})

const q = ref('')
const loading = ref(false)
const error = ref(null)
const despachos = ref([])
const avisos = ref([])
const avisosAbiertos = ref(false)

const filtrados = computed(() => {
  const term = q.value.trim().toLowerCase()
  if (!term) return despachos.value
  return despachos.value.filter(d =>
    [d.proyecto_nombre, d.proyecto, d.concepto, d.tipo_dato, d.version]
      .filter(Boolean).some(v => String(v).toLowerCase().includes(term)),
  )
})

async function cargar() {
  loading.value = true
  error.value = null
  try {
    const data = await liquidacionesApi.listarDespachos(filtros)
    despachos.value = data.results || []
    avisos.value = data.avisos || []
  } catch (e) {
    error.value = e.response?.data?.detail || 'No se pudieron cargar los despachos liquidados.'
    despachos.value = []
    avisos.value = []
  } finally {
    loading.value = false
  }
}

// ── Acciones ─────────────────────────────────────────────────────────────────
const dialogVisible = ref(false)
const modo = ref('ipp')
const cfg = computed(() => MODOS[modo.value])
const c = reactive({ mes: null, anio: null, version: VERSION_INICIAL })
const accion = ref(null)      // acción en curso, para el spinner del botón
const progreso = ref('')

function abrir(m) {
  modo.value = m
  Object.assign(c, { mes: filtros.month, anio: filtros.year, version: filtros.version })
  progreso.value = ''
  dialogVisible.value = true
}

async function ejecutar() {
  if (c.mes == null || c.anio == null || (cfg.value.version && !c.version)) {
    toast.warning('Faltan campos', {
      description: 'Completa mes, año' + (cfg.value.version ? ' y versión.' : '.'),
      duration: 4000,
    })
    return
  }

  accion.value = modo.value
  progreso.value = ''
  const periodo = { month: c.mes, year: c.anio, version: c.version }
  try {
    if (modo.value === 'ipp') {
      const ipp = await liquidacionesApi.consultarIpp(periodo)
      toast.success(`IPP de ${c.mes}/${c.anio}`, { description: String(ipp), duration: 6000 })
    } else {
      const opciones = { onEstado: (t) => { progreso.value = t.mensaje } }
      const res = modo.value === 'ftp'
        ? await liquidacionesApi.ejecutarAccionCiclo(AccionCiclo.DESCARGAR_XM, periodo, opciones)
        : await liquidacionesApi.ejecutarAccionCiclo(AccionCiclo.LIQUIDAR, periodo, opciones)
      toast.success(cfg.value.header, {
        description: res.message || 'Terminó correctamente.',
        duration: 6000,
      })
      await cargar()
    }
    dialogVisible.value = false
  } catch (e) {
    toast.error(`${cfg.value.header} falló`, {
      description: e.response?.data?.detail || e.message,
      duration: 10000,
    })
  } finally {
    accion.value = null
    progreso.value = ''
  }
}

// ── Diagnóstico ──────────────────────────────────────────────────────────────
const diagVisible = ref(false)
const diagCargando = ref(false)
const diagProyecto = ref('')
const diag = ref(null)

async function diagnosticar(project) {
  diagProyecto.value = project
  diag.value = null
  diagCargando.value = true
  diagVisible.value = true
  try {
    diag.value = await liquidacionesApi.diagnosticarProyecto({ project, ...filtros })
  } catch (e) {
    diagVisible.value = false
    toast.error('No se pudo diagnosticar', {
      description: e.response?.data?.detail || e.message,
      duration: 6000,
    })
  } finally {
    diagCargando.value = false
  }
}

function fmtNum(v) {
  if (v === null || v === undefined || v === '') return '—'
  const n = Number(v)
  if (Number.isNaN(n)) return String(v)
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(n)
}

onMounted(cargar)
</script>

<style scoped>
/* MIGRACIÓN — Fase 1: en Tailwind 4 cada bloque <style> se procesa aislado y no
   ve el tema, así que `@apply` falla con "unknown utility class". `@reference`
   le da acceso al tema sin emitir CSS. Era innecesario en Tailwind 3. */
@reference 'tailwindcss';
.field-label { @apply block text-xs font-medium text-gray-600 mb-1; }
</style>
