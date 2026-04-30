<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <Button icon="pi pi-arrow-left" text @click="$router.back()" />
      <div>
        <h2 class="text-lg font-semibold text-gray-800">
          {{ liq?.proyecto_nombre }} — {{ formatPeriodo(liq?.periodo) }}
        </h2>
        <Tag v-if="liq" :value="liq.estado" :severity="estadoSeverity(liq.estado)" class="text-xs" />
      </div>
      <div class="ml-auto flex gap-2">
        <Button label="Editar estado" icon="pi pi-pencil" outlined size="small" @click="dialogEstado = true" />
      </div>
    </div>

    <ProgressSpinner v-if="loading" class="block mx-auto" />

    <div v-else-if="liq" class="space-y-4">
      <!-- Resumen financiero -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="bg-white rounded-xl shadow-sm p-4 text-center">
          <div class="text-xs text-gray-500 mb-1">Ingresos brutos</div>
          <div class="text-base font-semibold text-green-700">{{ fmt(liq.ingresos_energia_cop) }}</div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-4 text-center">
          <div class="text-xs text-gray-500 mb-1">Comercialización XM</div>
          <div class="text-base font-semibold text-red-600">{{ fmt(liq.costos_comercializacion_xm_cop) }}</div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-4 text-center">
          <div class="text-xs text-gray-500 mb-1">Costos operativos</div>
          <div class="text-base font-semibold text-red-600">{{ fmt(liq.costos_operativos_cop) }}</div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-4 text-center">
          <div class="text-xs text-gray-500 mb-1">Ingreso neto</div>
          <div class="text-base font-semibold text-blue-700">{{ fmt(liq.ingreso_neto_cop) }}</div>
        </div>
      </div>

      <!-- Tabla detalle estilo imagen -->
      <div class="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table class="w-full text-xs">
          <thead>
            <tr class="bg-gray-800 text-white">
              <th class="px-3 py-2 text-left w-36">Inversionista</th>
              <th class="px-3 py-2 text-left w-28">Doc. contable</th>
              <th class="px-3 py-2 text-left w-32">Concepto</th>
              <th class="px-3 py-2 text-right w-36">Total</th>
              <th class="px-3 py-2 text-left w-32">Ref. Factura</th>
              <th class="px-3 py-2 text-left w-24">Consecutivo</th>
            </tr>
          </thead>
          <tbody>
            <!-- FILA TOTALES DEL PROYECTO -->
            <template v-if="filasProyecto.length">
              <tr class="bg-indigo-50 font-semibold border-b-2 border-indigo-300">
                <td class="px-3 py-2 text-indigo-800" colspan="2">Total Proyecto</td>
                <td class="px-3 py-2 text-indigo-600">Porcentaje de Participación</td>
                <td class="px-3 py-2 text-right text-indigo-800">100.00%</td>
                <td colspan="2" />
              </tr>
              <template v-for="fila in filasProyecto" :key="fila.key">
                <tr :class="filaClass(fila)" class="border-b border-gray-100 hover:bg-gray-50">
                  <td class="px-3 py-1.5" />
                  <td class="px-3 py-1.5">
                    <span :class="docClass(fila.doc)">{{ fila.doc }}</span>
                  </td>
                  <td class="px-3 py-1.5">{{ fila.concepto }}</td>
                  <td class="px-3 py-1.5 text-right font-mono" :class="fila.negativo ? 'text-red-600' : ''">
                    {{ fila.valor != null ? fmt(fila.valor) : '' }}
                  </td>
                  <td class="px-3 py-1.5 text-blue-600">
                    <a v-if="fila.url" :href="fila.url" target="_blank" class="flex items-center gap-1 hover:underline">
                      <i class="pi pi-file-pdf text-red-500" />{{ fila.ref }}
                    </a>
                    <span v-else>{{ fila.ref }}</span>
                  </td>
                  <td class="px-3 py-1.5 text-gray-500">{{ fila.consecutivo }}</td>
                </tr>
              </template>
            </template>

            <!-- FILAS POR INVERSIONISTA -->
            <template v-for="inv in liq.mandatos && inversionistasAgrupados" :key="inv.inversionista_id">
              <tr class="bg-gray-900 text-white font-semibold border-t-2 border-gray-700">
                <td class="px-3 py-2 truncate max-w-[140px]" :title="inv.nombre">{{ inv.nombre }}</td>
                <td class="px-3 py-2">Información</td>
                <td class="px-3 py-2 text-gray-300">Porcentaje de Participación</td>
                <td class="px-3 py-2 text-right">{{ pct(inv.porcentaje) }}</td>
                <td colspan="2" />
              </tr>
              <template v-for="fila in inv.filas" :key="fila.key">
                <tr :class="filaClass(fila)" class="border-b border-gray-100 hover:bg-gray-50">
                  <td class="px-3 py-1.5" />
                  <td class="px-3 py-1.5">
                    <span :class="docClass(fila.doc)">{{ fila.doc }}</span>
                  </td>
                  <td class="px-3 py-1.5">{{ fila.concepto }}</td>
                  <td class="px-3 py-1.5 text-right font-mono" :class="fila.negativo ? 'text-red-600' : ''">
                    {{ fila.valor != null ? fmt(fila.valor) : '' }}
                  </td>
                  <td class="px-3 py-1.5 text-blue-600">
                    <a v-if="fila.url" :href="fila.url" target="_blank" class="flex items-center gap-1 hover:underline">
                      <i class="pi pi-file-pdf text-red-500" />{{ fila.ref }}
                    </a>
                    <span v-else>{{ fila.ref }}</span>
                  </td>
                  <td class="px-3 py-1.5 text-gray-500">{{ fila.consecutivo }}</td>
                </tr>
              </template>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Costos del proyecto (nivel proyecto, sin desglose por inversionista) -->
      <div v-if="liq.costos?.length" class="bg-white rounded-xl shadow-sm p-4">
        <h3 class="text-sm font-semibold text-gray-700 mb-3">Costos registrados</h3>
        <DataTable :value="liq.costos" size="small" class="text-xs">
          <Column field="tipo_costo" header="Tipo" style="width:160px" />
          <Column field="descripcion" header="Descripción" />
          <Column field="proveedor" header="Proveedor" style="width:160px" />
          <Column field="nro_soporte" header="Soporte" style="width:120px" />
          <Column header="Soporte Doc" style="width:120px">
            <template #body="{ data }">
              <a v-if="data.soporte_url" :href="data.soporte_url" target="_blank"
                class="flex items-center gap-1 text-blue-600 hover:underline text-xs">
                <i class="pi pi-external-link" />Ver
              </a>
            </template>
          </Column>
          <Column header="Valor COP" style="width:140px;text-align:right">
            <template #body="{ data }">
              <span class="font-mono">{{ fmt(data.valor_cop) }}</span>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Facturas de servicio -->
      <div v-if="liq.facturas?.length" class="bg-white rounded-xl shadow-sm p-4">
        <h3 class="text-sm font-semibold text-gray-700 mb-3">Facturas de servicio</h3>
        <DataTable :value="liq.facturas" size="small" class="text-xs">
          <Column field="tipo_servicio" header="Servicio" style="width:160px" />
          <Column field="numero_factura" header="N° Factura" style="width:120px" />
          <Column field="nro_soporte" header="Soporte" style="width:120px" />
          <Column header="Doc" style="width:80px">
            <template #body="{ data }">
              <a v-if="data.soporte_url" :href="data.soporte_url" target="_blank"
                class="text-blue-600 hover:underline text-xs flex items-center gap-1">
                <i class="pi pi-external-link" />Ver
              </a>
            </template>
          </Column>
          <Column field="fecha_emision" header="Emisión" style="width:110px" />
          <Column header="Estado">
            <template #body="{ data }">
              <Tag :value="data.estado" :severity="facturaEstadoSeverity(data.estado)" />
            </template>
          </Column>
          <Column header="Valor COP" style="width:140px;text-align:right">
            <template #body="{ data }">
              <span class="font-mono">{{ fmt(data.valor_cop) }}</span>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <!-- Dialog cambio estado -->
    <Dialog v-model:visible="dialogEstado" header="Actualizar estado" modal class="w-72">
      <div class="space-y-3 py-2">
        <Select v-model="nuevoEstado" :options="estadosOpciones" class="w-full" />
        <div class="flex justify-end gap-2">
          <Button label="Cancelar" severity="secondary" size="small" @click="dialogEstado = false" />
          <Button label="Guardar" size="small" @click="guardarEstado" />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import api from '@/api/client'

const route = useRoute()
const toast = useToast()
const liq = ref(null)
const loading = ref(false)
const dialogEstado = ref(false)
const nuevoEstado = ref('')

const estadosOpciones = [
  'iniciada', 'costos_registrados', 'xm_procesado', 'mandatos_emitidos',
  'en_contabilidad', 'en_revisoria', 'facturado', 'entregado',
]

const ETIQUETAS_LINEA = {
  ingreso_bruto: 'Ingreso Bruto',
  ajuste_xm: 'Ajuste Xm',
  ajuste_unergy: 'Ajuste Unergy',
  ajuste_comercializacion: 'Comercialización',
  intereses: 'Intereses',
  otro_ingreso: 'Otro Ingreso',
  despacho: 'Despacho',
  ventas_en_bolsa: 'Ventas en Bolsa',
  compras_en_bolsa: 'Compras en Bolsa',
  redistribucion_ingresos: 'Redistribución de Ingresos',
  mantenimiento: 'Mantenimiento',
  arriendo: 'Arriendo',
  servicio_internet: 'Servicio de Internet',
  poliza_cumplimiento: 'Póliza de Cumplimiento',
  servicios_publicos_consumo: 'Servicios Públicos Consumo de energía',
  cambio_equipos_medida: 'Cambio Equipos de Medida',
  seguro: 'Seguro',
  otro_costo: 'Otro Costo',
  comercializacion: 'Comercialización',
  representacion: 'Representación',
  cgm: 'CGM',
  administracion: 'Administración',
  iva: 'IVA',
  retencion_fuente: 'Retención en la Fuente',
  reteica: 'Reteica',
  ica_opex: 'ICA OPEX',
  otro_impuesto: 'Otro Impuesto',
  porcentaje_participacion: 'Porcentaje de Participación',
  valor_a_pagar: 'Valor a Pagar',
}

const COSTOS_NEGATIVOS = new Set([
  'ajuste_comercializacion', 'arriendo', 'mantenimiento', 'servicio_internet',
  'poliza_cumplimiento', 'servicios_publicos_consumo', 'cambio_equipos_medida',
  'seguro', 'otro_costo', 'compras_en_bolsa', 'comercializacion',
  'representacion', 'cgm', 'administracion', 'iva', 'retencion_fuente',
  'reteica', 'ica_opex', 'otro_impuesto',
])

function lineasAFilas(mandatos, docLabel, consecutivoBase) {
  const filas = []
  for (const m of mandatos) {
    for (const l of m.lineas) {
      filas.push({
        key: `${m.id}_${l.id}`,
        doc: docLabel,
        concepto: ETIQUETAS_LINEA[l.tipo_linea] || l.concepto,
        valor: l.valor_cop,
        negativo: COSTOS_NEGATIVOS.has(l.tipo_linea),
        ref: l.referencia_factura,
        url: null,
        consecutivo: m.consecutivo ?? consecutivoBase,
      })
    }
  }
  return filas
}

const filasProyecto = computed(() => {
  if (!liq.value) return []
  const filas = []
  const mandatosIng = (liq.value.mandatos || []).filter(m => m.tipo === 'ingresos')
  const mandatosCos = (liq.value.mandatos || []).filter(m => m.tipo === 'costos')

  filas.push(...lineasAFilas(mandatosIng, 'Mandato', liq.value.consecutivo_inicial_ingresos))
  filas.push(...lineasAFilas(mandatosCos, 'Costos', liq.value.consecutivo_inicial_costos))

  for (const f of (liq.value.facturas || [])) {
    filas.push({
      key: `f_${f.id}`,
      doc: 'Factura',
      concepto: { representacion: 'Representación', cgm: 'CGM', administracion_operacion: 'Administración' }[f.tipo_servicio] || f.tipo_servicio,
      valor: f.valor_cop,
      negativo: false,
      ref: f.numero_factura || f.nro_soporte,
      url: f.soporte_url,
      consecutivo: null,
    })
  }
  return filas
})

const inversionistasAgrupados = computed(() => {
  if (!liq.value) return []
  const map = {}
  for (const m of (liq.value.mandatos || [])) {
    if (!m.inversionista) continue
    const id = m.inversionista.id
    if (!map[id]) {
      map[id] = {
        inversionista_id: id,
        nombre: m.inversionista.cliente_nombre || m.beneficiario_nombre,
        porcentaje: m.inversionista.porcentaje_participacion,
        filas: [],
      }
    }
    const docLabel = m.tipo === 'ingresos' ? 'Mandato' : 'Costos'
    map[id].filas.push(...lineasAFilas([m], docLabel, null))
  }
  return Object.values(map)
})

function fmt(v) {
  if (v == null) return '—'
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 2 }).format(v)
}

function pct(v) {
  if (v == null) return '—'
  return (v * 100).toFixed(4) + '%'
}

function formatPeriodo(p) {
  if (!p) return ''
  const [y, m] = p.split('-')
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${meses[parseInt(m) - 1]} ${y}`
}

function filaClass(fila) {
  if (fila.doc === 'Mandato') return 'bg-green-50'
  if (fila.doc === 'Costos') return 'bg-pink-50'
  if (fila.doc === 'Factura') return 'bg-yellow-50'
  return ''
}

function docClass(doc) {
  if (doc === 'Mandato') return 'text-green-700 font-medium'
  if (doc === 'Costos') return 'text-pink-700 font-medium'
  if (doc === 'Factura') return 'text-yellow-700 font-medium'
  return ''
}

function estadoSeverity(e) {
  return {
    iniciada: 'secondary', costos_registrados: 'info', xm_procesado: 'info',
    mandatos_emitidos: 'warn', en_contabilidad: 'warn', en_revisoria: 'warn',
    facturado: 'success', entregado: 'contrast',
  }[e] || 'secondary'
}

function facturaEstadoSeverity(e) {
  return { emitida: 'info', pagada: 'success', vencida: 'danger' }[e] || 'secondary'
}

async function load() {
  loading.value = true
  try {
    const { data } = await api.get(`/liquidaciones/${route.params.id}`)
    liq.value = data
    nuevoEstado.value = data.estado
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la liquidación', life: 3000 })
  } finally {
    loading.value = false
  }
}

async function guardarEstado() {
  try {
    await api.patch(`/liquidaciones/${route.params.id}`, { estado: nuevoEstado.value })
    liq.value.estado = nuevoEstado.value
    dialogEstado.value = false
    toast.add({ severity: 'success', summary: 'Actualizado', life: 2000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar', life: 3000 })
  }
}

onMounted(load)
</script>
