<template>
  <div class="space-y-5">
    <!-- Page header -->
    <PageHeader title="Dashboard" subtitle="Resumen operativo de la plataforma" />

    <!-- Critical Alerts Banner -->
    <div
      v-if="criticalAlerts.length"
      class="overflow-hidden rounded-xl"
      style="border: 2px solid #d64455"
    >
      <div class="flex items-center gap-2 px-4 py-2.5" style="background-color: #d64455">
        <i class="pi pi-exclamation-triangle text-white" />
        <span class="text-sm font-bold text-white">Alertas Operacionales</span>
        <span
          class="ml-auto rounded-full px-2 py-0.5 text-xs font-semibold"
          style="background: rgba(255, 255, 255, 0.2); color: white"
        >
          {{ criticalAlerts.length }}
        </span>
      </div>
      <div
        class="divide-y"
        style="background-color: #fef2f2; border-color: rgba(214, 68, 85, 0.15)"
      >
        <RouterLink
          v-for="alert in criticalAlerts"
          :key="alert.key"
          :to="alert.to"
          class="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-red-100/60"
        >
          <div
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            :style="{ backgroundColor: alert.bgColor }"
          >
            <i :class="[alert.icon, 'text-sm']" :style="{ color: alert.iconColor }" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold" style="color: #2c2039">{{ alert.title }}</p>
            <p class="text-xs" style="color: #6b5a8a">{{ alert.detail }}</p>
          </div>
          <i class="pi pi-angle-right text-sm" style="color: #d64455" />
        </RouterLink>
      </div>
    </div>

    <!-- KPI Cards Row 1 -->
    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <div
        v-for="kpi in topKpis"
        :key="kpi.label"
        class="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm"
        style="border: 1px solid #e8e0f0"
      >
        <div>
          <p class="text-xs font-semibold tracking-wide uppercase" style="color: #6b5a8a">
            {{ kpi.label }}
          </p>
          <p class="mt-1 text-2xl font-bold" style="color: #2c2039">{{ kpi.value ?? '—' }}</p>
          <p v-if="kpi.sub" class="mt-0.5 text-xs" :style="{ color: kpi.subColor || '#915BD8' }">
            {{ kpi.sub }}
          </p>
        </div>
        <div
          class="flex h-12 w-12 items-center justify-center rounded-xl"
          :style="{ backgroundColor: kpi.bg }"
        >
          <i :class="[kpi.icon, 'text-xl']" :style="{ color: kpi.color }" />
        </div>
      </div>
    </div>

    <!-- Row 2: Fleet Power + Precio Bolsa + MGS Alarms -->
    <div class="grid grid-cols-1 gap-3 lg:grid-cols-3">
      <div class="rounded-xl bg-white p-4 shadow-sm" style="border: 1px solid #e8e0f0">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="text-sm font-semibold" style="color: #2c2039">Generación Flota</h3>
          <RouterLink to="/generacion-solar" class="text-xs font-medium" style="color: #915bd8"
            >Ver detalle →</RouterLink
          >
        </div>
        <div v-if="data.fleet_power_kw != null" class="flex items-baseline gap-2">
          <span
            class="text-3xl font-bold"
            :style="{ color: data.fleet_power_kw > 0 ? '#10B981' : '#6b5a8a' }"
          >
            {{
              data.fleet_power_kw > 1000
                ? (data.fleet_power_kw / 1000).toFixed(1)
                : data.fleet_power_kw
            }}
          </span>
          <span class="text-sm" style="color: #6b5a8a">{{
            data.fleet_power_kw > 1000 ? 'MW' : 'kW'
          }}</span>
          <span
            v-if="data.fleet_online != null"
            class="ml-2 rounded-full px-2 py-0.5 text-xs"
            style="background: rgba(16, 185, 129, 0.1); color: #10b981"
          >
            {{ data.fleet_online }}/{{ data.fleet_total || '?' }} online
          </span>
        </div>
        <p v-else class="text-sm" style="color: #6b5a8a">Solenium no disponible</p>
        <div v-if="data.gen_solenium_last_date" class="mt-2 text-xs" style="color: #6b5a8a">
          <i class="pi pi-database mr-1 text-[10px]" style="color: #10b981" />
          {{ data.gen_solenium_projects }} plantas sincronizadas · último dato
          {{ data.gen_solenium_last_date }}
        </div>
      </div>

      <div class="rounded-xl bg-white p-4 shadow-sm" style="border: 1px solid #e8e0f0">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="text-sm font-semibold" style="color: #2c2039">Precio de Bolsa</h3>
          <RouterLink to="/mem/precio-bolsa" class="text-xs font-medium" style="color: #915bd8"
            >Ver detalle →</RouterLink
          >
        </div>
        <div v-if="data.precio_bolsa_cop_kwh != null" class="flex items-baseline gap-2">
          <span class="text-3xl font-bold" style="color: #2c2039"
            >${{ data.precio_bolsa_cop_kwh }}</span
          >
          <span class="text-sm" style="color: #6b5a8a">COP/kWh</span>
        </div>
        <p v-else class="text-sm" style="color: #6b5a8a">Sin datos de precio disponibles</p>
      </div>

      <div class="rounded-xl bg-white p-4 shadow-sm" style="border: 1px solid #e8e0f0">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="text-sm font-semibold" style="color: #2c2039">Alarmas MGS</h3>
        </div>
        <div class="flex items-baseline gap-2">
          <span
            class="text-3xl font-bold"
            :style="{ color: data.alarmas_mgs > 0 ? '#D64455' : '#10B981' }"
          >
            {{ data.alarmas_mgs ?? 0 }}
          </span>
          <span class="text-sm" style="color: #6b5a8a">{{
            data.alarmas_mgs === 1 ? 'alarma activa' : 'alarmas activas'
          }}</span>
        </div>
        <div v-if="data.alarmas_mgs_criticas > 0" class="mt-2">
          <span
            class="rounded-full px-2 py-0.5 text-xs font-semibold"
            style="background: rgba(214, 68, 85, 0.1); color: #d64455"
          >
            {{ data.alarmas_mgs_criticas }} críticas
          </span>
        </div>
      </div>
    </div>

    <!-- Row 3: Fallas Severity Breakdown + Cumplimiento Status -->
    <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <div class="rounded-xl bg-white p-4 shadow-sm" style="border: 1px solid #e8e0f0">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-sm font-semibold" style="color: #2c2039">Fallas por Prioridad</h3>
          <RouterLink to="/fallas" class="text-xs font-medium" style="color: #915bd8"
            >Ver fallas →</RouterLink
          >
        </div>
        <div v-if="data.fallas_abiertas > 0" class="space-y-2.5">
          <div v-for="bar in fallasBreakdown" :key="bar.code" class="flex items-center gap-3">
            <span class="w-14 text-right text-xs font-medium" :style="{ color: bar.color }">{{
              bar.label
            }}</span>
            <div class="h-5 flex-1 overflow-hidden rounded-full" style="background: #f3f0f7">
              <div
                class="h-full rounded-full transition-all duration-500"
                :style="{
                  width: bar.pct + '%',
                  backgroundColor: bar.color,
                  minWidth: bar.count > 0 ? '1.5rem' : '0',
                }"
              />
            </div>
            <span class="w-8 text-sm font-bold" style="color: #2c2039">{{ bar.count }}</span>
          </div>
        </div>
        <p v-else class="text-sm" style="color: #10b981">Sin fallas activas</p>
      </div>

      <div class="rounded-xl bg-white p-4 shadow-sm" style="border: 1px solid #e8e0f0">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-sm font-semibold" style="color: #2c2039">Cumplimiento PPA</h3>
          <RouterLink to="/mem/cumplimiento" class="text-xs font-medium" style="color: #915bd8"
            >Ver detalle →</RouterLink
          >
        </div>
        <div v-if="cumplimiento" class="space-y-3">
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-bold" :style="{ color: cumplimientoColor }">
              {{
                cumplimiento.totales?.estado === 'deficit'
                  ? 'DÉFICIT'
                  : cumplimiento.totales?.estado === 'excedente'
                    ? 'EXCEDENTE'
                    : cumplimiento.totales?.estado === 'ok'
                      ? 'OK'
                      : '—'
              }}
            </span>
          </div>
          <div
            v-if="cumplimiento.totales?.gen_total_mwh != null"
            class="grid grid-cols-2 gap-3 text-center"
          >
            <div class="rounded-lg p-2.5" style="background: #f3f0f7">
              <p class="text-lg font-bold" style="color: #2c2039">
                {{
                  cumplimiento.totales.gen_proyectada_mwh?.toFixed(1) ||
                  cumplimiento.totales.gen_total_mwh?.toFixed(1)
                }}
              </p>
              <p class="text-[10px] font-semibold uppercase" style="color: #6b5a8a">
                MWh Generados
              </p>
            </div>
            <div class="rounded-lg p-2.5" style="background: #f3f0f7">
              <p class="text-lg font-bold" style="color: #2c2039">
                {{ cumplimiento.totales.energia_minima_mwh?.toFixed(1) || '—' }}
              </p>
              <p class="text-[10px] font-semibold uppercase" style="color: #6b5a8a">
                MWh Comprometidos
              </p>
            </div>
          </div>
          <div
            v-if="cumplimiento.totales?.compras_bolsa_mwh > 0"
            class="rounded-lg px-2.5 py-1.5 text-xs font-medium"
            style="background: rgba(214, 68, 85, 0.08); color: #d64455"
          >
            Compras en bolsa necesarias: {{ cumplimiento.totales.compras_bolsa_mwh.toFixed(1) }} MWh
          </div>
          <div v-if="cumplimientoDeficits.length > 0" class="space-y-1">
            <p class="text-[10px] font-bold uppercase" style="color: #d64455">
              Contratos en déficit:
            </p>
            <p v-for="d in cumplimientoDeficits" :key="d.id" class="text-xs" style="color: #6b5a8a">
              <span class="font-semibold" style="color: #2c2039">{{
                d.nombre_interno || d.comprador_nombre
              }}</span>
              — {{ d.compras_bolsa_mwh?.toFixed(1) }} MWh faltantes
            </p>
          </div>
        </div>
        <div v-else-if="cumplimientoLoading" class="flex items-center gap-2">
          <i class="pi pi-spin pi-spinner text-sm" style="color: #915bd8" />
          <span class="text-sm" style="color: #6b5a8a">Consultando generación...</span>
        </div>
        <div v-else>
          <p class="text-sm" style="color: #6b5a8a">
            {{ data.ppa_con_compromisos || 0 }} contratos con compromisos este mes
          </p>
        </div>
      </div>
    </div>

    <!-- Quick links -->
    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <RouterLink
        v-for="link in quickLinks"
        :key="link.to"
        :to="link.to"
        class="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm transition-all duration-150 hover:shadow-md"
        style="border: 1px solid #e8e0f0"
      >
        <div
          class="flex h-10 w-10 items-center justify-center rounded-lg"
          :style="{ backgroundColor: link.bg }"
        >
          <i :class="[link.icon, 'text-base']" :style="{ color: link.color }" />
        </div>
        <span class="text-sm font-medium" style="color: #2c2039">{{ link.label }}</span>
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/api/client'

const data = ref({})
const cumplimiento = ref(null)
const cumplimientoLoading = ref(false)

const PRIORIDAD_CONFIG = {
  critica: { label: 'Crítica', color: '#DC2626' },
  grave: { label: 'Grave', color: '#EA580C' },
  media: { label: 'Media', color: '#CA8A04' },
  leve: { label: 'Leve', color: '#16A34A' },
}

const topKpis = computed(() => [
  {
    label: 'Proyectos',
    value: data.value.proyectos_total,
    sub: data.value.proyectos_operacion ? `${data.value.proyectos_operacion} en operación` : null,
    icon: 'pi pi-bolt',
    bg: 'rgba(145,91,216,0.1)',
    color: '#915BD8',
  },
  {
    label: 'Clientes',
    value: data.value.clientes_total,
    icon: 'pi pi-building',
    bg: 'rgba(44,32,57,0.08)',
    color: '#2C2039',
  },
  {
    label: 'Fallas abiertas',
    value: data.value.fallas_abiertas,
    sub:
      data.value.fallas_criticas_antiguas > 0
        ? `${data.value.fallas_criticas_antiguas} críticas >7 días`
        : null,
    subColor: data.value.fallas_criticas_antiguas > 0 ? '#D64455' : '#915BD8',
    icon: 'pi pi-exclamation-triangle',
    bg: data.value.fallas_abiertas > 0 ? 'rgba(214,68,85,0.1)' : 'rgba(16,185,129,0.1)',
    color: data.value.fallas_abiertas > 0 ? '#D64455' : '#10B981',
  },
  {
    label: 'Generación mes',
    value: data.value.mwh_mes ? `${data.value.mwh_mes}` : '—',
    sub: 'MWh',
    icon: 'pi pi-sun',
    bg: 'rgba(240,192,64,0.15)',
    color: '#D4A017',
  },
])

const fallasBreakdown = computed(() => {
  const fp = data.value.fallas_por_prioridad || {}
  const total = data.value.fallas_abiertas || 1
  return ['critica', 'grave', 'media', 'leve'].map((code) => ({
    code,
    label: PRIORIDAD_CONFIG[code]?.label || code,
    color: PRIORIDAD_CONFIG[code]?.color || '#6b5a8a',
    count: fp[code] || 0,
    pct: Math.round(((fp[code] || 0) / total) * 100),
  }))
})

function fmtCOP(v) {
  if (v == null) return '$0'
  return '$' + Math.round(v).toLocaleString('es-CO')
}

const cumplimientoColor = computed(() => {
  const st = cumplimiento.value?.totales?.estado
  if (st === 'deficit') return '#D64455'
  if (st === 'excedente') return '#F0C040'
  if (st === 'ok') return '#10B981'
  return '#6b5a8a'
})

const cumplimientoDeficits = computed(() => {
  if (!cumplimiento.value?.contratos) return []
  return cumplimiento.value.contratos.filter((c) => c.estado === 'deficit')
})

const criticalAlerts = computed(() => {
  const alerts = []
  const fp = data.value.fallas_por_prioridad || {}
  if (fp.critica > 0) {
    alerts.push({
      key: 'fallas-criticas',
      title: `${fp.critica} falla${fp.critica > 1 ? 's' : ''} crítica${fp.critica > 1 ? 's' : ''} sin resolver`,
      detail:
        data.value.fallas_criticas_antiguas > 0
          ? `${data.value.fallas_criticas_antiguas} con más de 7 días sin atender`
          : 'Requieren atención inmediata',
      icon: 'pi pi-exclamation-triangle',
      iconColor: '#DC2626',
      bgColor: 'rgba(220,38,38,0.1)',
      to: '/fallas',
    })
  }
  if (cumplimientoDeficits.value.length > 0) {
    const totalDeficit = cumplimientoDeficits.value.reduce(
      (s, c) => s + (c.compras_bolsa_mwh || 0),
      0,
    )
    alerts.push({
      key: 'cumplimiento-deficit',
      title: `${cumplimientoDeficits.value.length} contrato${cumplimientoDeficits.value.length > 1 ? 's' : ''} PPA en déficit`,
      detail: `${totalDeficit.toFixed(1)} MWh de compras en bolsa necesarias`,
      icon: 'pi pi-shield',
      iconColor: '#D64455',
      bgColor: 'rgba(214,68,85,0.1)',
      to: '/mem/cumplimiento',
    })
  }
  if (data.value.fleet_total && data.value.fleet_online != null) {
    const offline = data.value.fleet_total - data.value.fleet_online
    if (offline > 0 && offline / data.value.fleet_total > 0.2) {
      alerts.push({
        key: 'fleet-offline',
        title: `${offline} planta${offline > 1 ? 's' : ''} sin generación`,
        detail: `${data.value.fleet_online}/${data.value.fleet_total} plantas reportando generación`,
        icon: 'pi pi-power-off',
        iconColor: '#CA8A04',
        bgColor: 'rgba(202,138,4,0.1)',
        to: '/generacion-solar',
      })
    }
  }
  if (data.value.liquidaciones_pendientes > 0) {
    alerts.push({
      key: 'liquidaciones-pendientes',
      title: `${data.value.liquidaciones_pendientes} proyecto${data.value.liquidaciones_pendientes > 1 ? 's' : ''} sin liquidación este mes`,
      detail: 'Proyectos en operación que requieren liquidación',
      icon: 'pi pi-file-edit',
      iconColor: '#915BD8',
      bgColor: 'rgba(145,91,216,0.1)',
      to: '/liquidaciones',
    })
  }
  return alerts
})

const quickLinks = [
  {
    to: '/generacion-solar',
    label: 'Generación Solar',
    icon: 'pi pi-sun',
    bg: 'rgba(240,192,64,0.15)',
    color: '#D4A017',
  },
  {
    to: '/mem/cumplimiento',
    label: 'Cumplimiento PPA',
    icon: 'pi pi-shield',
    bg: 'rgba(16,185,129,0.1)',
    color: '#10B981',
  },
  {
    to: '/mem/descubrimientos',
    label: 'Descubrimientos',
    icon: 'pi pi-bolt',
    bg: 'rgba(240,192,64,0.1)',
    color: '#F0C040',
  },
  {
    to: '/liquidaciones',
    label: 'Liquidaciones',
    icon: 'pi pi-file-edit',
    bg: 'rgba(145,91,216,0.08)',
    color: '#915BD8',
  },
]

onMounted(async () => {
  try {
    const kpiRes = await api.get('/dashboard/kpis').catch(() => null)
    if (kpiRes?.data) data.value = kpiRes.data
  } catch {
    // degrade gracefully
  }

  // Load cumplimiento in background (calls Unergy API, slower)
  if (data.value.ppa_con_compromisos > 0) {
    cumplimientoLoading.value = true
    try {
      const now = new Date()
      const res = await api.get('/cumplimiento/ppa/resumen', {
        params: { year: now.getFullYear(), month: now.getMonth() + 1 },
        timeout: 15000,
      })
      if (res?.data) cumplimiento.value = res.data
    } catch {
      // non-critical
    } finally {
      cumplimientoLoading.value = false
    }
  }
})
</script>
