<template>
  <div class="space-y-4 pt-3">

    <!-- ── Barra superior ──────────────────────────────────────────────────── -->
    <div class="flex items-center justify-between flex-wrap gap-2">
      <p class="text-xs text-gray-400">
        {{ filas.length }} proyectos · {{ periodoLabel }} ·
        Edita estos datos en Proyecto&gt;Detalle&gt;Servicios&gt;Operación&gt;Arriendos (sección Arrendadores).
      </p>
    </div>

    <!-- ── Tabla ──────────────────────────────────────────────────────────── -->
    <div class="rounded-xl border border-gray-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm border-collapse" style="min-width:860px">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100">
              <th class="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">Proyecto</th>
              <th class="px-3 py-2.5 text-left text-xs font-semibold text-gray-500" style="width:140px">
                Tipo de pago
              </th>
              <th class="px-3 py-2.5 text-left text-xs font-semibold text-gray-500" style="width:170px">
                Anticipo pagado hasta
              </th>
              <th class="px-3 py-2.5 text-left text-xs font-semibold text-gray-500" style="width:160px">
                Próxima fecha por cobrar
              </th>
              <th class="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">Observaciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="5" class="px-3 py-6 text-center text-xs text-gray-400">Cargando…</td>
            </tr>
            <tr v-else-if="!filas.length">
              <td colspan="5" class="px-3 py-6 text-center text-xs text-gray-400">No hay proyectos para este período.</td>
            </tr>
            <tr v-for="fila in filas" v-else :key="fila.id"
              class="border-b border-gray-50 hover:bg-gray-50/40">

              <td class="px-3 py-2.5 font-medium text-sm" style="color:#2C2039">
                <div class="flex flex-col gap-0.5">
                  <span>{{ fila.proyecto }}</span>
                  <span v-if="mostrarArrendador(fila)" class="text-[11px] text-gray-400">
                    {{ fila.nombre_arrendador }}
                  </span>
                </div>
              </td>
              <td class="px-3 py-2.5">
                <span v-if="fila.periodicidad"
                  class="text-xs px-2 py-0.5 rounded-full font-medium"
                  :style="tipoPagoStyle(fila.periodicidad)">
                  {{ capitalizar(fila.periodicidad) }}
                </span>
                <span v-else class="text-xs text-gray-300">—</span>
              </td>
              <td class="px-3 py-2.5 text-xs text-gray-600">
                {{ fmtFecha(fila.anticipo_pagado_hasta) }}
              </td>
              <td class="px-3 py-2.5 text-xs text-gray-600">
                {{ proximaFecha(fila.anticipo_pagado_hasta) }}
              </td>
              <td class="px-3 py-2.5 text-xs text-gray-500 max-w-xs truncate"
                :title="fila.observaciones_arrendador">
                {{ fila.observaciones_arrendador || '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import api from '@/api/client'

// ── Período (mismo criterio de "período actual" que Panel, sin selector — vista informativa) ──
const hoy = new Date()
const periodoActual = computed(() => {
  const yyyy = hoy.getFullYear()
  const mm   = String(hoy.getMonth() + 1).padStart(2, '0')
  return `${yyyy}-${mm}`
})
const periodoLabel = computed(() => {
  const [yyyy, mm] = periodoActual.value.split('-')
  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  return `${MESES[parseInt(mm) - 1]} ${yyyy}`
})

// ── Datos (API — motor real de cálculo) ─────────────────────────────────────────
const loading = ref(false)
const filas   = ref([])

async function cargarDatos() {
  loading.value = true
  try {
    const { data } = await api.get(`/arriendos/calculo/${periodoActual.value}`)
    filas.value = data.filas || []
  } catch {
    filas.value = []
  } finally {
    loading.value = false
  }
}

// Mostrar el arrendador como subtítulo solo cuando hay más de un arrendador
// para el mismo proyecto (mismo patrón visual que ArriendosOperaciones.vue).
const conteoPorProyecto = computed(() => {
  const m = {}
  filas.value.forEach(f => { m[f.proyecto] = (m[f.proyecto] || 0) + 1 })
  return m
})
function mostrarArrendador(fila) {
  return !!fila.nombre_arrendador && (conteoPorProyecto.value[fila.proyecto] || 0) > 1
}

// ── Helpers visuales ───────────────────────────────────────────────────────────
function capitalizar(s) {
  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function tipoPagoStyle(periodicidad) {
  const p = (periodicidad || '').toLowerCase()
  if (p === 'mensual')    return 'background:#ede9fe;color:#6d28d9'
  if (p === 'bimestral')  return 'background:#e0e7ff;color:#3730a3'
  if (p === 'trimestral') return 'background:#dbeafe;color:#1e40af'
  if (p === 'semestral')  return 'background:#dcfce7;color:#166534'
  if (p === 'anual')      return 'background:#fef3c7;color:#92400e'
  return 'background:#f3f4f6;color:#6b7280'
}

function fmtFecha(iso) {
  if (!iso) return '—'
  try {
    const [y, m, d] = iso.split('-')
    const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
    return `${parseInt(d)} ${MESES[parseInt(m) - 1]} ${y}`
  } catch { return iso }
}

// Informativo: mes siguiente al anticipo pagado hasta (no calcula periodicidad exacta).
function proximaFecha(iso) {
  if (!iso) return '—'
  try {
    const [y, m] = iso.split('-').map(Number)
    const d = new Date(y, m, 1) // m ya es "mes siguiente" en índice 0-based del mes original
    const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
    return `${MESES[d.getMonth()]} ${d.getFullYear()}`
  } catch { return '—' }
}

watch(periodoActual, cargarDatos)
onMounted(cargarDatos)
</script>
