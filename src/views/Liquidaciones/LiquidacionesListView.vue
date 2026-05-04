<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold" style="color:#2C2039">Liquidaciones</h2>
      <Button label="Nueva liquidación" icon="pi pi-plus" size="small" @click="dialogNueva = true" />
    </div>

    <!-- Filtros -->
    <div class="bg-white rounded-xl shadow-sm p-3 flex flex-wrap gap-3 items-end">
      <div class="flex flex-col gap-1">
        <label class="text-xs text-gray-500">Desde</label>
        <DatePicker v-model="filtros.desde" view="month" dateFormat="mm/yy" showButtonBar placeholder="Mes inicio" class="w-36" />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs text-gray-500">Hasta</label>
        <DatePicker v-model="filtros.hasta" view="month" dateFormat="mm/yy" showButtonBar placeholder="Mes fin" class="w-36" />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs text-gray-500">Estado</label>
        <Select v-model="filtros.estado" :options="estadosOpciones" showClear placeholder="Todos" class="w-44" />
      </div>
      <Button icon="pi pi-search" label="Buscar" size="small" @click="recargar" />
      <Button icon="pi pi-times" severity="secondary" text size="small" @click="limpiarFiltros" />
    </div>

    <!-- Tabs -->
    <TabView v-model:activeIndex="tabActivo">

      <!-- ══ Tab Lista (tabla plana) ══ -->
      <TabPanel header="Lista">
        <ProgressSpinner v-if="loadingVista" class="block mx-auto my-8" />
        <div v-else class="rounded-xl shadow-sm overflow-hidden" style="background:#FDFAF7">
          <div v-if="!filasDetalle.length" class="text-center py-8 text-sm text-gray-400">
            No hay liquidaciones para los filtros seleccionados.
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full text-xs border-collapse" style="min-width:1400px">
              <thead>
                <tr class="text-white text-[11px] uppercase tracking-wide" style="background:#2C2039">
                  <th class="px-3 py-2.5 text-left whitespace-nowrap font-semibold">Proyecto</th>
                  <th class="px-3 py-2.5 text-left whitespace-nowrap font-semibold">Inversionista</th>
                  <th class="px-3 py-2.5 text-left whitespace-nowrap font-semibold">Doc. Contable</th>
                  <th class="px-3 py-2.5 text-left whitespace-nowrap font-semibold">Contacto 1</th>
                  <th class="px-3 py-2.5 text-left whitespace-nowrap font-semibold">Contacto 2</th>
                  <th class="px-3 py-2.5 text-left whitespace-nowrap font-semibold">Concepto</th>
                  <th class="px-3 py-2.5 text-right whitespace-nowrap font-semibold">Total</th>
                  <th class="px-3 py-2.5 text-left whitespace-nowrap font-semibold">Ref. Factura / Soporte</th>
                  <th class="px-3 py-2.5 text-left whitespace-nowrap font-semibold">Consec. Ingresos</th>
                  <th class="px-3 py-2.5 text-left whitespace-nowrap font-semibold">Consec. Costos</th>
                  <th class="px-3 py-2.5 text-left whitespace-nowrap font-semibold">Comprobante Contable</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="fila in filasDetalle" :key="fila.key">

                  <!-- Separador proyecto / período -->
                  <tr v-if="fila.separador" style="background:#915BD8">
                    <td colspan="11" class="px-4 py-2 font-bold text-[11px] tracking-widest text-white uppercase">
                      {{ fila.label }}
                      <span class="ml-4 font-normal text-purple-200 normal-case tracking-normal">
                        {{ fila.sublabel }}
                      </span>
                    </td>
                  </tr>

                  <!-- Fila de datos -->
                  <tr v-else :style="estiloFila(fila)"
                    class="border-b transition-colors duration-100"
                    style="border-color:rgba(44,32,57,0.07)">

                    <!-- Proyecto -->
                    <td class="px-3 py-1.5 text-[11px]" style="color:#2C2039; opacity:0.65">
                      {{ fila.proyecto }}
                    </td>

                    <!-- Inversionista -->
                    <td class="px-3 py-1.5 font-medium text-[11px]"
                      :style="fila.inversionista === 'Total'
                        ? 'color:#915BD8; font-weight:700'
                        : 'color:#2C2039'">
                      {{ fila.inversionista }}
                      <!-- Bug 5: indicar que Total = consolidado 100% del proyecto -->
                      <span v-if="fila.inversionista === 'Total'"
                        class="ml-1 px-1 py-0.5 rounded text-[8px] font-semibold tracking-wide"
                        style="background:rgba(145,91,216,0.15); color:#915BD8">
                        100%
                      </span>
                    </td>

                    <!-- Documento contable -->
                    <td class="px-3 py-1.5">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        :style="badgeDoc(fila.doc)">
                        {{ fila.doc }}
                      </span>
                    </td>

                    <!-- Contacto 1 -->
                    <td class="px-3 py-1.5 text-[11px] text-gray-500">{{ fila.contacto1 }}</td>

                    <!-- Contacto 2 -->
                    <td class="px-3 py-1.5 text-[11px] text-gray-500">{{ fila.contacto2 }}</td>

                    <!-- Concepto -->
                    <td class="px-3 py-1.5 text-[11px]" style="color:#2C2039">{{ fila.concepto }}</td>

                    <!-- Total -->
                    <td class="px-3 py-1.5 text-right font-mono text-[11px]"
                      :style="fila.negativo ? 'color:#dc2626' : 'color:#2C2039'">
                      <span v-if="fila.isPercent" class="font-semibold" style="color:#915BD8">{{ fila.pctLabel }}</span>
                      <span v-else>{{ fila.total != null ? fmt(fila.total) : '—' }}</span>
                    </td>

                    <!-- Ref. Factura / Soporte -->
                    <td class="px-3 py-1.5 text-[11px] whitespace-nowrap">
                      <a v-if="fila.soporteUrl" :href="fila.soporteUrl" target="_blank"
                        class="flex items-center gap-1 hover:underline" style="color:#915BD8">
                        <i class="pi pi-file-pdf text-red-500 text-xs" />{{ fila.refFactura || 'Ver' }}
                      </a>
                      <span v-else style="color:#2C2039; opacity:0.7">{{ fila.refFactura }}</span>
                    </td>

                    <!-- Consecutivo Ingresos -->
                    <td class="px-3 py-1.5 text-[11px]" style="color:#2C2039; opacity:0.6">
                      {{ fila.conseIngresos }}
                    </td>

                    <!-- Consecutivo Costos -->
                    <td class="px-3 py-1.5 text-[11px]" style="color:#2C2039; opacity:0.6">
                      {{ fila.conseCostos }}
                    </td>

                    <!-- Comprobante Contable -->
                    <td class="px-3 py-1.5 text-[11px] font-mono" style="color:#2C2039; opacity:0.7">
                      {{ fila.comprobante }}
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>
      </TabPanel>

      <!-- ══ Tab Por Proyecto ══ -->
      <TabPanel header="Por Proyecto">
        <ProgressSpinner v-if="loadingVista" class="block mx-auto my-8" />
        <div v-else class="space-y-3">
          <div v-if="!vistaProyectos.length" class="text-center text-gray-400 py-8 text-sm">
            No hay proyectos registrados.
          </div>

          <div v-for="proy in vistaProyectos" :key="proy.proyecto_id"
            class="rounded-xl shadow-sm overflow-hidden" style="background:#FDFAF7">

            <!-- Header proyecto -->
            <div class="text-white px-4 py-2 flex items-center gap-3 cursor-pointer select-none"
              style="background:#2C2039"
              @click="toggleProy(proy.proyecto_id)">
              <i :class="expandidosProy.has(proy.proyecto_id) ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
                class="text-xs" />
              <span class="font-semibold text-sm">{{ proy.proyecto_nombre }}</span>
              <Tag :value="proy.estado" :severity="estadoProySeverity(proy.estado)" class="text-xs" />
              <span class="text-xs ml-auto" style="color:#915BD8">
                {{ proy.inversionistas_registrados.length }} inv. ·
                {{ proy.liquidaciones.length }} liq.
              </span>
            </div>

            <!-- Contenido expandido -->
            <div v-if="expandidosProy.has(proy.proyecto_id)">
              <!-- Inversionistas registrados -->
              <div class="px-4 py-3 border-b" style="background:rgba(145,91,216,0.05); border-color:rgba(145,91,216,0.15)">
                <p class="text-xs font-semibold mb-2 uppercase tracking-wide" style="color:#915BD8">
                  Inversionistas registrados
                </p>
                <div v-if="proy.inversionistas_registrados.length" class="flex flex-wrap gap-2">
                  <div v-for="inv in proy.inversionistas_registrados" :key="inv.proyecto_inversionista_id"
                    class="bg-white border rounded-lg px-3 py-1.5 flex items-center gap-2"
                    style="border-color:rgba(145,91,216,0.25)">
                    <i class="pi pi-user text-xs" style="color:#915BD8" />
                    <span class="text-xs font-semibold" style="color:#2C2039">{{ inv.inversionista_nombre }}</span>
                    <span class="text-xs font-mono" style="color:#915BD8">{{ pct(inv.porcentaje_participacion) }}</span>
                    <Tag v-if="inv.es_patrimonio_autonomo" value="PA" severity="info" class="text-[10px]" />
                  </div>
                </div>
                <p v-else class="text-xs text-gray-400 italic">Sin inversionistas registrados</p>
              </div>

              <!-- Liquidaciones del proyecto -->
              <div v-if="proy.liquidaciones.length">
                <div v-for="liq in proy.liquidaciones" :key="liq.liquidacion_id" class="border-b last:border-b-0"
                  style="border-color:rgba(44,32,57,0.08)">
                  <div class="px-4 py-2 flex items-center gap-3 cursor-pointer hover:bg-white/50"
                    style="background:rgba(253,250,247,0.8)"
                    @click="toggleLiq(liq.liquidacion_id)">
                    <i :class="expandidosLiq.has(liq.liquidacion_id) ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
                      class="text-xs text-gray-400" />
                    <span class="font-medium text-sm" style="color:#2C2039">{{ formatPeriodo(liq.periodo) }}</span>
                    <Tag :value="liq.estado" :severity="estadoSeverity(liq.estado)" />
                    <span class="text-xs text-gray-500 ml-auto">
                      Ingreso neto:
                      <span class="font-mono font-semibold" style="color:#915BD8">{{ fmt(liq.resumen.ingreso_neto_cop) }}</span>
                    </span>
                    <Button icon="pi pi-eye" text size="small"
                      @click.stop="$router.push(`/liquidaciones/${liq.liquidacion_id}`)" />
                  </div>
                  <div v-if="expandidosLiq.has(liq.liquidacion_id)" class="overflow-x-auto">
                    <TablaDetalleLiquidacion :liquidacion="liq" />
                  </div>
                </div>
              </div>
              <div v-else class="px-4 py-4 text-center text-xs text-gray-400">
                Sin liquidaciones para los filtros seleccionados
              </div>
            </div>
          </div>
        </div>
      </TabPanel>

      <!-- ══ Tab Por Inversionista ══ -->
      <TabPanel header="Por Inversionista">
        <ProgressSpinner v-if="loadingVista" class="block mx-auto my-8" />
        <div v-else class="space-y-3">
          <div v-if="!vistaInversionistas.length" class="text-center text-gray-400 py-8 text-sm">
            No hay inversionistas registrados.
          </div>

          <div v-for="inv in vistaInversionistas" :key="inv.cliente_id"
            class="rounded-xl shadow-sm overflow-hidden bg-white">

            <!-- Header inversionista -->
            <div class="text-white px-4 py-2 flex items-center gap-3 cursor-pointer select-none"
              style="background:#915BD8"
              @click="toggleInversionista(inv.cliente_id)">
              <i :class="expandidosInv.has(inv.cliente_id) ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
                class="text-xs" />
              <i class="pi pi-user text-xs" />
              <span class="font-semibold text-sm">{{ inv.cliente_nombre }}</span>
              <span class="text-xs ml-auto" style="color:#F6FF72">{{ inv.proyectos.length }} proyecto(s)</span>
            </div>

            <!-- Proyectos del inversionista -->
            <div v-if="expandidosInv.has(inv.cliente_id)">
              <div v-for="proy in inv.proyectos" :key="proy.proyecto_inversionista_id"
                class="border-b last:border-b-0" style="border-color:rgba(44,32,57,0.08)">

                <div class="px-4 py-2 flex items-center gap-3 cursor-pointer"
                  style="background:rgba(145,91,216,0.04)"
                  @click="toggleInvProy(`${inv.cliente_id}_${proy.proyecto_id}`)">
                  <i :class="expandidosInvProy.has(`${inv.cliente_id}_${proy.proyecto_id}`) ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
                    class="text-xs text-gray-400" />
                  <span class="font-medium text-sm" style="color:#2C2039">{{ proy.proyecto_nombre }}</span>
                  <span class="text-xs text-gray-500">
                    Part.: <strong style="color:#915BD8">{{ pct(proy.porcentaje_participacion) }}</strong>
                  </span>
                  <Tag v-if="proy.es_patrimonio_autonomo" value="PA" severity="info" class="text-[10px]" />
                  <span class="text-xs text-gray-400 ml-auto">{{ proy.liquidaciones.length }} liq.</span>
                </div>

                <div v-if="expandidosInvProy.has(`${inv.cliente_id}_${proy.proyecto_id}`)" class="bg-white">
                  <div v-if="proy.liquidaciones.length" class="divide-y divide-gray-100">
                    <div v-for="liq in proy.liquidaciones" :key="liq.liquidacion_id"
                      class="px-6 py-2 flex items-center gap-3 hover:bg-gray-50">
                      <span class="text-xs w-20" style="color:#2C2039">{{ formatPeriodo(liq.periodo) }}</span>
                      <Tag :value="liq.estado" :severity="estadoSeverity(liq.estado)" class="text-xs" />
                      <span class="text-xs text-gray-500 ml-auto">
                        Neto:
                        <span class="font-mono font-semibold" style="color:#915BD8">{{ fmt(liq.ingreso_neto_cop) }}</span>
                      </span>
                      <Button icon="pi pi-eye" text size="small"
                        @click="$router.push(`/liquidaciones/${liq.liquidacion_id}`)" />
                    </div>
                  </div>
                  <div v-else class="px-6 py-3 text-xs text-gray-400 text-center italic">
                    Sin liquidaciones para los filtros seleccionados
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </TabPanel>
    </TabView>

    <!-- Dialog nueva liquidación -->
    <Dialog v-model:visible="dialogNueva" header="Nueva liquidación" modal class="w-full max-w-md">
      <div class="space-y-3 py-2">
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-600">Proyecto</label>
          <Select v-model="nueva.proyecto_id" :options="proyectosOpciones"
            optionLabel="nombre_comercial" optionValue="id"
            placeholder="Seleccionar proyecto" filter class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-600">Período</label>
          <DatePicker v-model="nueva.periodo" view="month" dateFormat="yy-mm-dd" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-600">Tipo venta</label>
          <Select v-model="nueva.tipo_venta" :options="['bolsa','ppa','interno']" class="w-full" />
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <Button label="Cancelar" severity="secondary" size="small" @click="dialogNueva = false" />
          <Button label="Crear" size="small" :loading="creando" @click="crearLiquidacion" />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'
import api from '@/api/client'

const TablaDetalleLiquidacion = defineAsyncComponent(() =>
  import('@/views/Liquidaciones/TablaDetalleLiquidacion.vue')
)

const toast = useToast()
const router = useRouter()

const vistaProyectos = ref([])
const vistaInversionistas = ref([])
const loadingVista = ref(false)
const proyectosOpciones = ref([])
const tabActivo = ref(0)

const expandidosProy = ref(new Set())
const expandidosLiq = ref(new Set())
const expandidosInv = ref(new Set())
const expandidosInvProy = ref(new Set())

const filtros = ref({ desde: null, hasta: null, estado: null })
const estadosOpciones = [
  'iniciada', 'costos_registrados', 'xm_procesado', 'mandatos_emitidos',
  'en_contabilidad', 'en_revisoria', 'facturado', 'entregado',
]

const dialogNueva = ref(false)
const creando = ref(false)
const nueva = ref({ proyecto_id: null, periodo: null, tipo_venta: 'bolsa' })

// ─── Etiquetas de líneas ──────────────────────────────────────────────────────
const ETIQUETAS_LISTA = {
  ingreso_bruto: 'Ingreso Bruto',
  ajuste_unergy: 'Ajuste Unergy',
  ajuste_comercializacion: 'Comercialización',
  intereses: 'Intereses',
  otro_ingreso: 'Otro Ingreso',
  despacho: 'Despacho',
  ventas_en_bolsa: 'Ventas en Bolsa',
  compras_en_bolsa: 'Compras en Bolsa',
  redistribucion_ingresos: 'Redistribución de Ingresos de acuerdo al Protocolo',
  mantenimiento: 'Mantenimiento',
  arriendo: 'Arriendo',
  servicio_internet: 'Servicio de Internet',
  iva_internet: 'IVA Internet',   // Bug 2
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
  valor_a_pagar: 'Valor a Pagar',
}

// Bug 1: conceptos que pertenecen solo a la sección Factura
const TIPOS_FACTURA_SET = new Set(['representacion', 'cgm', 'administracion', 'administracion_operacion'])

const COSTOS_NEG = new Set([
  'ajuste_comercializacion', 'arriendo', 'mantenimiento', 'servicio_internet',
  'poliza_cumplimiento', 'servicios_publicos_consumo', 'cambio_equipos_medida',
  'seguro', 'otro_costo', 'compras_en_bolsa', 'comercializacion',
  'representacion', 'cgm', 'administracion', 'iva', 'retencion_fuente',
  'reteica', 'ica_opex', 'otro_impuesto',
])

const LABEL_FACTURA = {
  representacion: 'Representación',
  cgm: 'CGM',
  administracion_operacion: 'Administración',
}

const OMITIR_LINEAS = new Set(['ajuste_xm'])

// ─── Colores ──────────────────────────────────────────────────────────────────
const COLORES_FILA = {
  Información_Total: { background: 'rgba(44,32,57,0.06)' },
  Información_inv:   { background: 'rgba(44,32,57,0.03)' },
  Mandato_Total:     { background: 'rgba(145,91,216,0.12)' },
  Mandato_inv:       { background: 'rgba(145,91,216,0.05)' },
  Costos_Total:      { background: 'rgba(220,38,38,0.08)' },
  Costos_inv:        { background: 'rgba(220,38,38,0.03)' },
  Factura_Total:     { background: 'rgba(246,255,114,0.35)' },
  Factura_inv:       { background: 'rgba(246,255,114,0.15)' },
}

function estiloFila(fila) {
  const nivel = fila.inversionista === 'Total' ? 'Total' : 'inv'
  return COLORES_FILA[`${fila.doc}_${nivel}`] || { background: '#FDFAF7' }
}

function badgeDoc(doc) {
  return {
    Mandato:     { background: '#915BD8', color: '#fff' },
    Costos:      { background: '#fee2e2', color: '#b91c1c' },
    Factura:     { background: '#F6FF72', color: '#2C2039' },
    Información: { background: '#2C2039', color: '#FDFAF7' },
  }[doc] || { background: '#e5e7eb', color: '#374151' }
}

// ─── Filas planas ─────────────────────────────────────────────────────────────
const filasDetalle = computed(() => {
  const rows = []

  for (const proy of vistaProyectos.value) {
    for (const liq of proy.liquidaciones) {
      const proyNombre = proy.proyecto_nombre
      const comprobante = liq.comprobante_contable_ref || ''
      const consIng0 = liq.consecutivo_inicial_ingresos != null ? String(liq.consecutivo_inicial_ingresos) : ''
      const consCos0 = liq.consecutivo_inicial_costos != null ? String(liq.consecutivo_inicial_costos) : ''

      rows.push({
        key: `sep_${liq.liquidacion_id}`,
        separador: true,
        label: `${proyNombre}  —  ${formatPeriodo(liq.periodo)}`,
        sublabel: liq.estado,
      })

      // Fila Total — Información (100%)
      rows.push(_f(`${liq.liquidacion_id}_t_info`, {
        proyecto: proyNombre, inversionista: 'Total', doc: 'Información',
        contacto1: '', contacto2: '',
        concepto: 'Porcentaje de Participación',
        isPercent: true, pctLabel: '100.00%',
        conseIngresos: consIng0, conseCostos: consCos0, comprobante,
      }))

      // Filas Total — Mandato: deduplicar por tipo_linea|ref para tolerar
      // mandatos duplicados en DB (ej: loader ejecutado más de una vez).
      const totalIng = new Map()
      for (const m of (liq.mandatos_total_ingresos || [])) {
        for (const l of (m.lineas || [])) {
          if (OMITIR_LINEAS.has(l.tipo_linea)) continue
          if (TIPOS_FACTURA_SET.has(l.tipo_linea)) continue
          const k = `${l.tipo_linea}|${l.referencia_factura || ''}`
          if (!totalIng.has(k)) totalIng.set(k, { ...l, concepto: ETIQUETAS_LISTA[l.tipo_linea] || l.concepto })
        }
      }
      for (const r of totalIng.values()) {
        rows.push(_f(`${liq.liquidacion_id}_t_ing_${r.tipo_linea}`, {
          proyecto: proyNombre, inversionista: 'Total', doc: 'Mandato',
          contacto1: '', contacto2: '',
          concepto: r.concepto, total: r.valor_cop,
          negativo: COSTOS_NEG.has(r.tipo_linea),
          refFactura: r.referencia_factura || '',
          conseIngresos: consIng0, conseCostos: '', comprobante,
        }))
      }

      // Filas Total — Costos: idem deduplicación
      const totalCos = new Map()
      for (const m of (liq.mandatos_total_costos || [])) {
        for (const l of (m.lineas || [])) {
          if (OMITIR_LINEAS.has(l.tipo_linea)) continue
          const k = `${l.tipo_linea}|${l.referencia_factura || ''}`
          if (!totalCos.has(k)) totalCos.set(k, { ...l, concepto: ETIQUETAS_LISTA[l.tipo_linea] || l.concepto })
        }
      }
      for (const r of totalCos.values()) {
        rows.push(_f(`${liq.liquidacion_id}_t_cos_${r.tipo_linea}`, {
          proyecto: proyNombre, inversionista: 'Total', doc: 'Costos',
          contacto1: '', contacto2: '',
          concepto: r.concepto, total: r.valor_cop, negativo: true,
          refFactura: r.referencia_factura || '',
          conseIngresos: '', conseCostos: consCos0, comprobante,
        }))
      }

      // Filas Total — Facturas de servicio (nivel proyecto)
      for (const f of (liq.facturas_servicio || [])) {
        rows.push(_f(`${liq.liquidacion_id}_t_fac_${f.id}`, {
          proyecto: proyNombre, inversionista: 'Total', doc: 'Factura',
          contacto1: LABEL_FACTURA[f.tipo_servicio] || f.tipo_servicio,
          contacto2: f.numero_factura || '',
          concepto: LABEL_FACTURA[f.tipo_servicio] || f.tipo_servicio,
          total: f.valor_cop, negativo: false,
          refFactura: f.nro_soporte || '', soporteUrl: f.soporte_url || null,
          conseIngresos: '', conseCostos: '', comprobante,
        }))
      }

      // ── Por inversionista ─────────────────────────────────────────────────
      for (const inv of (liq.inversionistas || [])) {
        const pctLabel = inv.porcentaje_participacion != null
          ? (inv.porcentaje_participacion * 100).toFixed(4) + '%' : '—'

        // Fila Inversionista — Información (% participación)
        rows.push(_f(`${liq.liquidacion_id}_${inv.inversionista_id}_info`, {
          proyecto: proyNombre, inversionista: inv.inversionista_nombre, doc: 'Información',
          contacto1: '', contacto2: '',
          concepto: 'Porcentaje de Participación',
          isPercent: true, pctLabel,
          conseIngresos: consIng0, conseCostos: consCos0, comprobante,
        }))

        // Filas Inversionista — Mandato (ingresos)
        for (const m of (inv.mandatos_ingresos || [])) {
          const consIng = m.consecutivo != null ? String(m.consecutivo) : consIng0
          for (const l of (m.lineas || [])) {
            if (OMITIR_LINEAS.has(l.tipo_linea)) continue
            // Bug 1: excluir conceptos de Factura que no pertenecen a Mandato
            if (TIPOS_FACTURA_SET.has(l.tipo_linea)) continue
            rows.push(_f(`${liq.liquidacion_id}_${inv.inversionista_id}_ing_${l.id}`, {
              proyecto: proyNombre, inversionista: inv.inversionista_nombre, doc: 'Mandato',
              contacto1: m.numero_mandato || '',
              contacto2: m.beneficiario_nombre || '',
              concepto: ETIQUETAS_LISTA[l.tipo_linea] || l.concepto,
              total: l.valor_cop, negativo: COSTOS_NEG.has(l.tipo_linea),
              refFactura: l.referencia_factura || '',
              conseIngresos: consIng, conseCostos: '', comprobante,
            }))
          }
        }

        // Filas Inversionista — Costos (Bug 2: iva_internet tiene etiqueta propia en ETIQUETAS_LISTA)
        for (const m of (inv.mandatos_costos || [])) {
          const consCos = m.consecutivo != null ? String(m.consecutivo) : consCos0
          for (const l of (m.lineas || [])) {
            if (OMITIR_LINEAS.has(l.tipo_linea)) continue
            rows.push(_f(`${liq.liquidacion_id}_${inv.inversionista_id}_cos_${l.id}`, {
              proyecto: proyNombre, inversionista: inv.inversionista_nombre, doc: 'Costos',
              contacto1: m.numero_mandato || '',
              contacto2: m.beneficiario_nombre || '',
              concepto: ETIQUETAS_LISTA[l.tipo_linea] || l.concepto,
              total: l.valor_cop, negativo: true,
              refFactura: l.referencia_factura || '',
              conseIngresos: '', conseCostos: consCos, comprobante,
            }))
          }
        }
      }
    }
  }
  return rows
})

function _f(key, d) {
  return {
    key,
    separador: false,
    proyecto: d.proyecto ?? '',
    inversionista: d.inversionista ?? '',
    doc: d.doc ?? '',
    contacto1: d.contacto1 ?? '',
    contacto2: d.contacto2 ?? '',
    concepto: d.concepto ?? '',
    total: d.total ?? null,
    isPercent: d.isPercent ?? false,
    pctLabel: d.pctLabel ?? '',
    negativo: d.negativo ?? false,
    refFactura: d.refFactura ?? '',
    soporteUrl: d.soporteUrl ?? null,
    conseIngresos: d.conseIngresos ?? '',
    conseCostos: d.conseCostos ?? '',
    comprobante: d.comprobante ?? '',
  }
}

// ─── Toggle helpers ───────────────────────────────────────────────────────────
function toggle(set, key) {
  if (set.value.has(key)) set.value.delete(key)
  else set.value.add(key)
  set.value = new Set(set.value)
}
function toggleProy(id) { toggle(expandidosProy, id) }
function toggleLiq(id) { toggle(expandidosLiq, id) }
function toggleInversionista(id) { toggle(expandidosInv, id) }
function toggleInvProy(key) { toggle(expandidosInvProy, key) }

// ─── Params / carga ───────────────────────────────────────────────────────────
function buildParams() {
  const p = {}
  if (filtros.value.desde) p.periodo_desde = toISOMonth(filtros.value.desde)
  if (filtros.value.hasta) p.periodo_hasta = toISOMonth(filtros.value.hasta)
  if (filtros.value.estado) p.estado = filtros.value.estado
  return p
}

function toISOMonth(d) {
  if (!d) return null
  const dt = new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-01`
}

async function loadVistas() {
  loadingVista.value = true
  const params = buildParams()
  const [rProy, rInv] = await Promise.allSettled([
    api.get('/liquidaciones/vistas/por-proyecto', { params }),
    api.get('/liquidaciones/vistas/por-inversionista', { params }),
  ])
  vistaProyectos.value = rProy.status === 'fulfilled' ? rProy.value.data : []
  vistaInversionistas.value = rInv.status === 'fulfilled' ? rInv.value.data : []
  if (rProy.status === 'rejected') console.error('Vista por proyecto:', rProy.reason)
  if (rInv.status === 'rejected') console.error('Vista por inversionista:', rInv.reason)
  loadingVista.value = false
}

async function loadProyectosOpciones() {
  try {
    const { data } = await api.get('/proyectos', { params: { size: 200 } })
    proyectosOpciones.value = data.items || []
  } catch {
    proyectosOpciones.value = []
  }
}

function recargar() { loadVistas() }

function limpiarFiltros() {
  filtros.value = { desde: null, hasta: null, estado: null }
  loadVistas()
}

// ─── Nueva liquidación ────────────────────────────────────────────────────────
async function crearLiquidacion() {
  if (!nueva.value.proyecto_id || !nueva.value.periodo) return
  creando.value = true
  try {
    const { data } = await api.post('/liquidaciones', {
      proyecto_id: nueva.value.proyecto_id,
      periodo: toISOMonth(nueva.value.periodo),
      tipo_venta: nueva.value.tipo_venta,
    })
    dialogNueva.value = false
    toast.add({ severity: 'success', summary: 'Creada', life: 2000 })
    router.push(`/liquidaciones/${data.id}`)
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear', life: 3000 })
  } finally {
    creando.value = false
  }
}

// ─── Formato ──────────────────────────────────────────────────────────────────
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

function estadoSeverity(e) {
  return {
    iniciada: 'secondary', costos_registrados: 'info', xm_procesado: 'info',
    mandatos_emitidos: 'warn', en_contabilidad: 'warn', en_revisoria: 'warn',
    facturado: 'success', entregado: 'contrast',
  }[e] || 'secondary'
}

function estadoProySeverity(e) {
  return {
    en_operacion: 'success', en_desarrollo: 'info',
    suspendido: 'warn', cancelado: 'secondary',
  }[e] || 'secondary'
}

watch(tabActivo, () => { loadVistas() })

onMounted(() => {
  loadVistas()
  loadProyectosOpciones()
})
</script>
