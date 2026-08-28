<template>
  <div class="space-y-4" :class="{ 'p-4 sm:p-5': embedded }">
    <PageHeader v-if="!embedded" title="Liquidaciones por Inversionista" />

    <!-- Tabs tipo proyecto + aviso de espejo -->
    <div class="flex flex-wrap items-center gap-3">
      <div class="flex gap-0 border-b border-gray-200">
        <button
          v-for="t in TABS_TIPO"
          :key="t.key"
          class="relative px-4 py-2 text-xs font-medium transition-colors"
          :class="
            tabTipo === t.key
              ? 'text-gray-900 after:absolute after:right-0 after:bottom-0 after:left-0 after:h-0.5 after:bg-gray-800'
              : 'text-gray-400 hover:text-gray-600'
          "
          @click="tabTipo = t.key"
        >
          {{ t.label }}
        </button>
      </div>
      <IconField class="ml-2">
        <InputIcon class="pi pi-search" />
        <InputText v-model="q" placeholder="Buscar inversionista…" class="w-56" />
      </IconField>
      <span class="ml-auto text-[11px]" style="color: #9b8fb0">
        Espejo del Panel Contable · ventana 12 meses a {{ formatPeriodo(periodo) }}
      </span>
    </div>

    <ProgressSpinner v-if="loading" class="mx-auto my-10 block" />

    <div v-else-if="!clientesMostrados.length" class="py-8 text-center text-sm text-gray-400">
      {{
        clientes.length
          ? 'Sin inversionistas para la búsqueda.'
          : 'Sin paneles para este período/tipo. Cárgalos en Panel Contable.'
      }}
    </div>

    <div v-else class="overflow-hidden rounded-xl shadow-sm" style="background: #fdfaf7">
      <div v-for="cli in clientesMostrados" :key="cli.key">
        <!-- Nivel 1: Inversionista -->
        <div
          class="flex cursor-pointer items-center gap-2 bg-gray-100 px-4 py-2.5 transition-colors select-none hover:bg-gray-200"
          @click="toggleCliente(cli.key)"
        >
          <i
            :class="expandidos[cli.key] ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
            class="text-[10px] text-gray-400"
          />
          <span class="flex-1 text-sm font-bold tracking-wide text-gray-800 uppercase">
            {{ cli.cliente_nombre }}
          </span>
          <span
            class="rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style="background: #e5e7eb; color: #6b7280"
          >
            {{ cli.proyectos.length }} proyectos
          </span>
          <span class="ml-2 font-mono text-[11px] font-bold" style="color: #915bd8">
            {{ fmtCompact(cli.kpis.ingresoNeto) }}
          </span>
        </div>

        <template v-if="expandidos[cli.key]">
          <div class="mx-3 my-2 rounded-xl bg-white p-4 shadow-sm">
            <!-- KPI cards -->
            <div class="mb-5 flex flex-wrap gap-3">
              <div
                v-for="k in kpiCards(cli)"
                :key="k.label"
                class="min-w-[140px] flex-1 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div class="mb-2 flex items-start justify-between">
                  <span class="text-xs font-medium tracking-wide text-gray-400 uppercase">{{
                    k.label
                  }}</span>
                  <i :class="k.icon" class="text-[11px] text-gray-300" />
                </div>
                <div class="text-xl font-bold" :style="{ color: k.color }">
                  {{ fmtCompact(k.value) }}
                </div>
              </div>
            </div>

            <!-- Gráfico: valor a pagar por mes -->
            <div v-if="cli.barData.length" class="mb-4">
              <div class="mb-2 text-[10px] font-medium tracking-wide text-gray-400 uppercase">
                Valor a pagar por mes
              </div>
              <NetoMensualBar
                :bars="cli.barData.map((b) => ({ label: shortMes(b.mes), neto: b.neto }))"
              />
            </div>

            <!-- Tabla colapsable por proyecto × mes -->
            <div>
              <button
                class="mb-2 flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600"
                @click="toggleTabla(cli.key)"
              >
                <i
                  :class="tablasAbiertas[cli.key] ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
                  class="text-[9px]"
                />
                Detalle por proyecto
              </button>
              <div v-show="tablasAbiertas[cli.key]" class="overflow-x-auto">
                <table class="w-full min-w-max text-xs">
                  <thead>
                    <tr style="background: #f8f8f8">
                      <th
                        class="sticky left-0 border-r border-gray-200 bg-gray-100 px-2 py-1.5 text-left font-medium text-gray-600"
                      >
                        Proyecto
                      </th>
                      <th
                        v-for="mes in cli.meses"
                        :key="mes"
                        class="px-2 py-1.5 text-right font-normal whitespace-nowrap text-gray-500"
                      >
                        {{ shortMes(mes) }}
                      </th>
                      <th
                        class="border-l border-gray-200 px-2 py-1.5 text-right font-semibold whitespace-nowrap text-gray-700"
                      >
                        Total
                      </th>
                      <th class="px-2 py-1.5" style="width: 36px"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="row in cli.tablaRows"
                      :key="row.nombre"
                      class="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td
                        class="sticky left-0 max-w-[160px] truncate border-r border-gray-100 bg-white px-2 py-1.5 whitespace-nowrap text-gray-700"
                        :title="row.nombre"
                      >
                        {{ row.nombre }}
                      </td>
                      <td
                        v-for="(val, mi) in row.meses"
                        :key="mi"
                        class="px-2 py-1.5 text-right font-mono whitespace-nowrap"
                        :style="val ? 'color:#111827' : 'color:#D1D5DB'"
                      >
                        {{ val ? fmtCompact(val) : '—' }}
                      </td>
                      <td
                        class="border-l border-gray-100 px-2 py-1.5 text-right font-mono font-semibold whitespace-nowrap text-gray-900"
                      >
                        {{ fmtCompact(row.total) }}
                      </td>
                      <td class="px-2 py-1.5 text-right">
                        <button
                          v-if="row.liquidacion_id"
                          class="inline-flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-gray-200"
                          title="Ver detalle operativo"
                          @click="router.push(`/liquidaciones/${row.liquidacion_id}`)"
                        >
                          <i class="pi pi-eye text-xs text-gray-500" />
                        </button>
                      </td>
                    </tr>
                    <tr class="border-t-2 border-gray-300">
                      <td
                        class="sticky left-0 border-r border-gray-200 bg-gray-50 px-2 py-1.5 font-bold text-gray-700"
                      >
                        TOTAL
                      </td>
                      <td
                        v-for="(val, mi) in cli.totalRow.meses"
                        :key="mi"
                        class="px-2 py-1.5 text-right font-mono font-bold whitespace-nowrap text-gray-900"
                      >
                        {{ fmtCompact(val) }}
                      </td>
                      <td
                        class="border-l border-gray-200 px-2 py-1.5 text-right font-mono font-bold whitespace-nowrap text-gray-900"
                      >
                        {{ fmtCompact(cli.totalRow.total) }}
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import ProgressSpinner from 'primevue/progressspinner'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import api from '@/api/client'
import NetoMensualBar from './components/NetoMensualBar.vue'
import { fmtCompact, formatPeriodo } from '@/utils/liquidaciones'

const props = defineProps({
  embedded: { type: Boolean, default: false },
  periodo: { type: String, default: null }, // "YYYY-MM-01"
  tipo: { type: String, default: 'preliquidacion' },
})

const router = useRouter()

const periodoYYYYMM = computed(() => (props.periodo || '').slice(0, 7))
const ventana = computed(() => {
  const [y, m] = (props.periodo || '').split('-').map(Number)
  const ini = new Date(y, m - 12, 1)
  return {
    desde: `${ini.getFullYear()}-${String(ini.getMonth() + 1).padStart(2, '0')}`,
    hasta: periodoYYYYMM.value,
  }
})

const loading = ref(false)
const periodosData = ref([]) // [{periodo, resumen, proyectos}]

const TABS_TIPO = [
  { key: 'todas', label: 'Todas' },
  { key: 'minigranja', label: 'Minigranjas' },
  { key: 'autoconsumo', label: 'Autoconsumo' },
]
const tabTipo = ref('todas')
const q = ref('')

const expandidos = reactive({})
const tablasAbiertas = reactive({})
function toggleCliente(k) {
  expandidos[k] ? delete expandidos[k] : (expandidos[k] = true)
}
function toggleTabla(k) {
  tablasAbiertas[k] ? delete tablasAbiertas[k] : (tablasAbiertas[k] = true)
}

// Pivota el Panel (rango) por cliente, con series multi-mes.
const clientes = computed(() => {
  const map = {}
  for (const entry of periodosData.value) {
    const mes = entry.periodo
    for (const proy of entry.proyectos || []) {
      if (tabTipo.value !== 'todas' && proy.tipo_proyecto !== tabTipo.value) continue
      for (const inv of proy.inversionistas || []) {
        const key =
          inv.cliente_id != null ? `c${inv.cliente_id}` : `n${inv.cliente_nombre || inv.nombre}`
        if (!map[key]) {
          map[key] = {
            key,
            cliente_id: inv.cliente_id,
            cliente_nombre: inv.cliente_nombre || inv.nombre || '—',
            _proy: {}, // { proyNombre: { proyecto_id, liquidacion_id, porcentaje, meses:{mes:valor} } }
            _monthKPI: {}, // { mes: {bruto, comercializacion, costos, facturas} }
            _mesSet: new Set(),
          }
        }
        const c = map[key]
        c._mesSet.add(mes)
        const g = inv.grupos_totales || {}
        if (!c._monthKPI[mes])
          c._monthKPI[mes] = { bruto: 0, comercializacion: 0, costos: 0, facturas: 0 }
        c._monthKPI[mes].bruto += g.ingresos || 0
        c._monthKPI[mes].comercializacion += g.comercializacion || 0
        c._monthKPI[mes].costos += g.costos || 0
        c._monthKPI[mes].facturas += g.facturas || 0

        const nom = proy.proyecto
        if (!c._proy[nom])
          c._proy[nom] = {
            proyecto_id: proy.proyecto_id,
            liquidacion_id: proy.liquidacion_id,
            porcentaje: inv.porcentaje,
            meses: {},
          }
        if (proy.liquidacion_id) c._proy[nom].liquidacion_id = proy.liquidacion_id
        c._proy[nom].meses[mes] = (c._proy[nom].meses[mes] || 0) + (inv.valor_a_pagar || 0)
      }
    }
  }

  return Object.values(map)
    .map((c) => {
      const meses = [...c._mesSet].sort()
      const proyNames = Object.keys(c._proy)

      let ingresoBruto = 0,
        comercializacion = 0,
        costosOperativos = 0,
        serviciosUnergy = 0,
        ingresoNeto = 0
      for (const k of Object.values(c._monthKPI)) {
        ingresoBruto += k.bruto
        comercializacion += k.comercializacion
        costosOperativos += k.costos
        serviciosUnergy += k.facturas
      }
      const barData = meses.map((mes) => {
        let neto = 0
        for (const nom of proyNames) neto += c._proy[nom].meses[mes] || 0
        return { mes, neto }
      })
      ingresoNeto = barData.reduce((s, b) => s + b.neto, 0)

      const tablaRows = proyNames
        .map((nom) => ({
          nombre: nom,
          liquidacion_id: c._proy[nom].liquidacion_id,
          meses: meses.map((m) => c._proy[nom].meses[m] ?? null),
          total: meses.reduce((a, m) => a + (c._proy[nom].meses[m] || 0), 0),
        }))
        .sort((a, b) => b.total - a.total)
      const totalRow = {
        meses: meses.map((m) => proyNames.reduce((a, nom) => a + (c._proy[nom].meses[m] || 0), 0)),
        total: tablaRows.reduce((s, r) => s + r.total, 0),
      }

      return {
        key: c.key,
        cliente_id: c.cliente_id,
        cliente_nombre: c.cliente_nombre,
        proyectos: proyNames,
        kpis: { ingresoBruto, comercializacion, costosOperativos, serviciosUnergy, ingresoNeto },
        meses,
        barData,
        tablaRows,
        totalRow,
      }
    })
    .sort((a, b) => b.kpis.ingresoNeto - a.kpis.ingresoNeto)
})

const clientesMostrados = computed(() => {
  const term = q.value.toLowerCase().trim()
  if (!term) return clientes.value
  return clientes.value.filter((c) => (c.cliente_nombre || '').toLowerCase().includes(term))
})

function kpiCards(cli) {
  const k = cli.kpis
  return [
    {
      label: 'Ingreso Bruto',
      value: k.ingresoBruto,
      icon: 'pi pi-arrow-up-right',
      color: '#111827',
    },
    {
      label: 'Comercialización',
      value: k.comercializacion,
      icon: 'pi pi-chart-bar',
      color: '#D64455',
    },
    {
      label: 'Costos Operativos',
      value: k.costosOperativos,
      icon: 'pi pi-minus',
      color: '#D64455',
    },
    { label: 'Servicios Unergy', value: k.serviciosUnergy, icon: 'pi pi-bolt', color: '#111827' },
    {
      label: 'Valor a pagar',
      value: k.ingresoNeto,
      icon: 'pi pi-wallet',
      color: k.ingresoNeto >= 0 ? '#915BD8' : '#ef4444',
    },
  ]
}

function shortMes(ym) {
  const [y, m] = ym.split('-')
  const M = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${M[parseInt(m) - 1]} ${y.slice(2)}`
}

async function load() {
  if (!periodoYYYYMM.value) return
  loading.value = true
  try {
    const { data } = await api.get('/liquidaciones/resumen-panel-rango', {
      params: {
        periodo_desde: ventana.value.desde,
        periodo_hasta: ventana.value.hasta,
        tipo: props.tipo,
      },
    })
    periodosData.value = data.periodos || []
  } catch {
    periodosData.value = []
  } finally {
    loading.value = false
  }
}

watch([() => props.periodo, () => props.tipo], load)
onMounted(load)
</script>
