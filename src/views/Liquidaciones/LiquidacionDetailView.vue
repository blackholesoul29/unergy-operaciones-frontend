<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center gap-3 flex-wrap">
      <Button icon="pi pi-arrow-left" text @click="$router.back()" />
      <div>
        <h2 class="text-lg font-semibold text-gray-800">
          {{ liq?.proyecto_nombre }} — {{ formatPeriodo(liq?.periodo) }}
        </h2>
        <Tag v-if="liq" :value="liq.estado" :severity="estadoSeverity(liq.estado)" class="text-xs" />
      </div>
      <div class="ml-auto flex gap-2 flex-wrap">
        <Button label="Editar resumen" icon="pi pi-calculator" outlined size="small" @click="abrirEditResumen" />
        <Button label="Estado" icon="pi pi-pencil" outlined size="small" @click="dialogEstado = true" />
      </div>
    </div>

    <ProgressSpinner v-if="loading" class="block mx-auto" />

    <template v-if="!loading && liq">
      <!-- Tarjetas resumen financiero -->
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

      <!-- ══ SECCIÓN INGRESOS ══ -->
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <div
          class="bg-green-800 text-white px-4 py-2.5 flex items-center gap-3 cursor-pointer select-none"
          @click="toggleSeccion('ingresos')"
        >
          <i :class="seccionesAbiertas.has('ingresos') ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" class="text-xs" />
          <span class="font-semibold">Ingresos</span>
          <span class="text-green-300 text-xs ml-auto">
            {{ mandatosIngresos.length }} mandato(s) · {{ inversionistasConDetalle.length }} inversionista(s)
          </span>
        </div>
        <div v-if="seccionesAbiertas.has('ingresos')" class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead>
              <tr class="bg-gray-100 text-gray-600">
                <th class="px-3 py-1.5 text-left w-40">Inversionista</th>
                <th class="px-3 py-1.5 text-right w-24">Participación</th>
                <th class="px-3 py-1.5 text-left w-24">Doc.</th>
                <th class="px-3 py-1.5 text-left">Concepto</th>
                <th class="px-3 py-1.5 text-right w-36">Valor COP</th>
                <th class="px-3 py-1.5 text-left w-32">Ref. Factura</th>
                <th class="px-3 py-1.5 text-left w-24">Consec.</th>
              </tr>
            </thead>
            <tbody>
              <!-- Fila total proyecto -->
              <tr class="bg-indigo-50 font-semibold border-b-2 border-indigo-200">
                <td class="px-3 py-1.5 text-indigo-800" colspan="2">Total Proyecto</td>
                <td class="px-3 py-1.5" />
                <td class="px-3 py-1.5 text-indigo-600">Porcentaje de Participación</td>
                <td class="px-3 py-1.5 text-right text-indigo-800">100.0000%</td>
                <td colspan="2" />
              </tr>
              <!-- Por inversionista -->
              <template v-for="inv in inversionistasConDetalle" :key="inv.id">
                <tr class="bg-gray-800 text-white border-t border-gray-600">
                  <td class="px-3 py-1.5 font-semibold truncate max-w-[160px]" :title="inv.nombre">{{ inv.nombre }}</td>
                  <td class="px-3 py-1.5 text-right text-gray-300 font-semibold">{{ pct(inv.porcentaje) }}</td>
                  <td class="px-3 py-1.5" />
                  <td class="px-3 py-1.5 text-gray-300">Porcentaje de Participación</td>
                  <td class="px-3 py-1.5 text-right font-semibold">{{ pct(inv.porcentaje) }}</td>
                  <td colspan="2" />
                </tr>
                <template v-for="m in inv.mandatosIngresos" :key="m.id">
                  <tr
                    v-for="l in m.lineas" :key="l.id"
                    class="bg-green-50 border-b border-gray-100 hover:bg-green-100"
                  >
                    <td class="px-3 py-1.5" />
                    <td class="px-3 py-1.5" />
                    <td class="px-3 py-1.5 text-green-700 font-medium">Mandato</td>
                    <td class="px-3 py-1.5">{{ ETIQUETAS[l.tipo_linea] || l.concepto }}</td>
                    <td class="px-3 py-1.5 text-right font-mono">{{ fmt(l.valor_cop) }}</td>
                    <td class="px-3 py-1.5 text-gray-500">{{ l.referencia_factura }}</td>
                    <td class="px-3 py-1.5 text-gray-400">{{ m.consecutivo ?? liq.consecutivo_inicial_ingresos }}</td>
                  </tr>
                </template>
                <tr v-if="!inv.mandatosIngresos.length" class="border-b border-gray-100">
                  <td colspan="7" class="px-3 py-2 text-center text-gray-400 italic text-xs">Sin mandato de ingresos registrado</td>
                </tr>
              </template>
              <tr v-if="!inversionistasConDetalle.length">
                <td colspan="7" class="px-4 py-4 text-center text-gray-400">Sin inversionistas registrados en el proyecto</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ══ SECCIÓN COSTOS ══ -->
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <div
          class="bg-red-800 text-white px-4 py-2.5 flex items-center gap-3 cursor-pointer select-none"
          @click="toggleSeccion('costos')"
        >
          <i :class="seccionesAbiertas.has('costos') ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" class="text-xs" />
          <span class="font-semibold">Costos</span>
          <Button
            icon="pi pi-plus" label="Agregar" text size="small"
            class="ml-auto !text-white hover:!bg-red-700"
            @click.stop="abrirDialogCosto()"
          />
        </div>
        <div v-if="seccionesAbiertas.has('costos')">
          <!-- Costos de proyecto (LiquidacionCosto) -->
          <div v-if="liq.costos?.length" class="overflow-x-auto border-b border-gray-200">
            <table class="w-full text-xs">
              <thead>
                <tr class="bg-gray-100 text-gray-600">
                  <th class="px-3 py-1.5 text-left w-36">Tipo</th>
                  <th class="px-3 py-1.5 text-left">Descripción</th>
                  <th class="px-3 py-1.5 text-left w-32">Proveedor</th>
                  <th class="px-3 py-1.5 text-left w-28">Soporte</th>
                  <th class="px-3 py-1.5 text-right w-36">Valor COP</th>
                  <th class="px-3 py-1.5 w-20" />
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="c in liq.costos" :key="c.id"
                  class="bg-pink-50 border-b border-gray-100 hover:bg-pink-100"
                >
                  <td class="px-3 py-1.5 text-pink-700 font-medium">{{ c.tipo_costo }}</td>
                  <td class="px-3 py-1.5">{{ c.descripcion }}</td>
                  <td class="px-3 py-1.5 text-gray-500">{{ c.proveedor }}</td>
                  <td class="px-3 py-1.5">
                    <a v-if="c.soporte_url" :href="c.soporte_url" target="_blank"
                      class="text-blue-600 hover:underline flex items-center gap-1">
                      <i class="pi pi-external-link text-xs" />{{ c.nro_soporte || 'Ver' }}
                    </a>
                    <span v-else class="text-gray-400">{{ c.nro_soporte }}</span>
                  </td>
                  <td class="px-3 py-1.5 text-right font-mono text-red-600">{{ fmt(c.valor_cop) }}</td>
                  <td class="px-3 py-1.5">
                    <div class="flex gap-1 justify-end">
                      <Button icon="pi pi-pencil" text size="small" severity="info" @click="abrirDialogCosto(c)" />
                      <Button icon="pi pi-trash" text size="small" severity="danger" @click="eliminarCosto(c.id)" />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="px-4 py-2 text-xs text-gray-400 italic border-b border-gray-100 bg-pink-50">
            Sin costos de proyecto registrados — usa "Agregar" para añadir uno.
          </div>

          <!-- Costos por inversionista (mandatos tipo costos) -->
          <div v-if="inversionistasConCostos.length" class="overflow-x-auto">
            <table class="w-full text-xs">
              <tbody>
                <template v-for="inv in inversionistasConCostos" :key="`cos_${inv.id}`">
                  <tr class="bg-gray-800 text-white border-t border-gray-600">
                    <td class="px-3 py-1.5 font-semibold w-40 truncate" :title="inv.nombre">{{ inv.nombre }}</td>
                    <td class="px-3 py-1.5 text-right text-gray-300 w-24">{{ pct(inv.porcentaje) }}</td>
                    <td class="px-3 py-1.5 text-pink-300 w-24">Costos</td>
                    <td class="px-3 py-1.5" colspan="4" />
                  </tr>
                  <template v-for="m in inv.mandatosCostos" :key="m.id">
                    <tr
                      v-for="l in m.lineas" :key="l.id"
                      class="bg-pink-50 border-b border-gray-100 hover:bg-pink-100"
                    >
                      <td class="px-3 py-1.5" />
                      <td class="px-3 py-1.5" />
                      <td class="px-3 py-1.5 text-pink-700 font-medium">Costos</td>
                      <td class="px-3 py-1.5">{{ ETIQUETAS[l.tipo_linea] || l.concepto }}</td>
                      <td class="px-3 py-1.5 text-right font-mono text-red-600">{{ fmt(l.valor_cop) }}</td>
                      <td class="px-3 py-1.5 text-gray-500">{{ l.referencia_factura }}</td>
                      <td class="px-3 py-1.5 text-gray-400">{{ m.consecutivo }}</td>
                    </tr>
                  </template>
                </template>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ══ SECCIÓN SERVICIOS ══ -->
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <div
          class="bg-yellow-700 text-white px-4 py-2.5 flex items-center gap-3 cursor-pointer select-none"
          @click="toggleSeccion('servicios')"
        >
          <i :class="seccionesAbiertas.has('servicios') ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" class="text-xs" />
          <span class="font-semibold">Servicios</span>
          <Button
            icon="pi pi-plus" label="Agregar" text size="small"
            class="ml-auto !text-white hover:!bg-yellow-600"
            @click.stop="abrirDialogFactura()"
          />
        </div>
        <div v-if="seccionesAbiertas.has('servicios')">
          <div v-if="liq.facturas?.length" class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead>
                <tr class="bg-gray-100 text-gray-600">
                  <th class="px-3 py-1.5 text-left w-36">Servicio</th>
                  <th class="px-3 py-1.5 text-left w-28">N° Factura</th>
                  <th class="px-3 py-1.5 text-left w-24">Soporte</th>
                  <th class="px-3 py-1.5 text-left w-24">Emisión</th>
                  <th class="px-3 py-1.5 text-left w-24">Estado</th>
                  <th class="px-3 py-1.5 text-right w-36">Valor COP</th>
                  <th class="px-3 py-1.5 w-20" />
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="f in liq.facturas" :key="f.id"
                  class="bg-yellow-50 border-b border-gray-100 hover:bg-yellow-100"
                >
                  <td class="px-3 py-1.5 text-yellow-700 font-medium">{{ f.tipo_servicio }}</td>
                  <td class="px-3 py-1.5">{{ f.numero_factura }}</td>
                  <td class="px-3 py-1.5">
                    <a v-if="f.soporte_url" :href="f.soporte_url" target="_blank"
                      class="text-blue-600 hover:underline flex items-center gap-1">
                      <i class="pi pi-external-link text-xs" />{{ f.nro_soporte || 'Ver' }}
                    </a>
                    <span v-else class="text-gray-400">{{ f.nro_soporte }}</span>
                  </td>
                  <td class="px-3 py-1.5 text-gray-500">{{ f.fecha_emision }}</td>
                  <td class="px-3 py-1.5">
                    <Tag :value="f.estado" :severity="facturaEstadoSeverity(f.estado)" />
                  </td>
                  <td class="px-3 py-1.5 text-right font-mono">{{ fmt(f.valor_cop) }}</td>
                  <td class="px-3 py-1.5">
                    <div class="flex gap-1 justify-end">
                      <Button icon="pi pi-pencil" text size="small" severity="info" @click="abrirDialogFactura(f)" />
                      <Button icon="pi pi-trash" text size="small" severity="danger" @click="eliminarFactura(f.id)" />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="px-4 py-4 text-center text-xs text-gray-400 bg-yellow-50">
            Sin facturas de servicio registradas — usa "Agregar" para añadir una.
          </div>
        </div>
      </div>
    </template>

    <!-- ─── Dialog: Editar estado ─── -->
    <Dialog v-model:visible="dialogEstado" header="Actualizar estado" modal class="w-72">
      <div class="space-y-3 py-2">
        <Select v-model="nuevoEstado" :options="estadosOpciones" class="w-full" />
        <div class="flex justify-end gap-2">
          <Button label="Cancelar" severity="secondary" size="small" @click="dialogEstado = false" />
          <Button label="Guardar" size="small" :loading="guardando" @click="guardarEstado" />
        </div>
      </div>
    </Dialog>

    <!-- ─── Dialog: Editar resumen financiero ─── -->
    <Dialog v-model:visible="dialogResumen" header="Editar resumen financiero" modal class="w-full max-w-md">
      <div class="space-y-3 py-2">
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-600">Ingresos energía (COP)</label>
          <InputNumber v-model="resumenForm.ingresos_energia_cop" :maxFractionDigits="2" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-600">Costos comercialización XM (COP)</label>
          <InputNumber v-model="resumenForm.costos_comercializacion_xm_cop" :maxFractionDigits="2" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-600">Costos operativos (COP)</label>
          <InputNumber v-model="resumenForm.costos_operativos_cop" :maxFractionDigits="2" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-600">Ingreso neto (COP)</label>
          <InputNumber v-model="resumenForm.ingreso_neto_cop" :maxFractionDigits="2" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-600">Tasa de cambio (USD/COP)</label>
          <InputNumber v-model="resumenForm.tasa_cambio" :maxFractionDigits="4" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-600">Consecutivo inicial ingresos</label>
          <InputNumber v-model="resumenForm.consecutivo_inicial_ingresos" :useGrouping="false" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-600">Consecutivo inicial costos</label>
          <InputNumber v-model="resumenForm.consecutivo_inicial_costos" :useGrouping="false" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-600">Referencia comprobante contable</label>
          <InputText v-model="resumenForm.comprobante_contable_ref" class="w-full" />
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <Button label="Cancelar" severity="secondary" size="small" @click="dialogResumen = false" />
          <Button label="Guardar" size="small" :loading="guardando" @click="guardarResumen" />
        </div>
      </div>
    </Dialog>

    <!-- ─── Dialog: Agregar/Editar Costo ─── -->
    <Dialog v-model:visible="dialogCosto" :header="costoEditId ? 'Editar costo' : 'Agregar costo'" modal class="w-full max-w-md">
      <div class="space-y-3 py-2">
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-600">Tipo de costo</label>
          <Select v-model="costoForm.tipo_costo" :options="tiposCosto" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-600">Descripción</label>
          <InputText v-model="costoForm.descripcion" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-600">Proveedor</label>
          <InputText v-model="costoForm.proveedor" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-600">N° Soporte</label>
          <InputText v-model="costoForm.nro_soporte" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-600">URL Soporte</label>
          <InputText v-model="costoForm.soporte_url" class="w-full" placeholder="https://..." />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-600">Valor (COP)</label>
          <InputNumber v-model="costoForm.valor_cop" :maxFractionDigits="2" class="w-full" />
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <Button label="Cancelar" severity="secondary" size="small" @click="dialogCosto = false" />
          <Button :label="costoEditId ? 'Actualizar' : 'Agregar'" size="small" :loading="guardando" @click="guardarCosto" />
        </div>
      </div>
    </Dialog>

    <!-- ─── Dialog: Agregar/Editar Factura ─── -->
    <Dialog v-model:visible="dialogFactura" :header="facturaEditId ? 'Editar factura' : 'Agregar factura de servicio'" modal class="w-full max-w-md">
      <div class="space-y-3 py-2">
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-600">Tipo de servicio</label>
          <Select v-model="facturaForm.tipo_servicio" :options="tiposServicio" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-600">N° Factura</label>
          <InputText v-model="facturaForm.numero_factura" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-600">N° Soporte</label>
          <InputText v-model="facturaForm.nro_soporte" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-600">URL Soporte</label>
          <InputText v-model="facturaForm.soporte_url" class="w-full" placeholder="https://..." />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-600">Fecha de emisión</label>
          <DatePicker v-model="facturaForm.fecha_emision" dateFormat="yy-mm-dd" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-600">Estado</label>
          <Select v-model="facturaForm.estado" :options="['emitida','pagada','vencida']" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-600">Valor (COP)</label>
          <InputNumber v-model="facturaForm.valor_cop" :maxFractionDigits="2" class="w-full" />
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <Button label="Cancelar" severity="secondary" size="small" @click="dialogFactura = false" />
          <Button :label="facturaEditId ? 'Actualizar' : 'Agregar'" size="small" :loading="guardando" @click="guardarFactura" />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import DatePicker from 'primevue/datepicker'
import api from '@/api/client'

const route = useRoute()
const toast = useToast()

const liq = ref(null)
const proyectoInversionistas = ref([])
const loading = ref(false)
const guardando = ref(false)

// Secciones desplegables (abiertas por defecto)
const seccionesAbiertas = ref(new Set(['ingresos', 'costos', 'servicios']))
function toggleSeccion(key) {
  if (seccionesAbiertas.value.has(key)) seccionesAbiertas.value.delete(key)
  else seccionesAbiertas.value.add(key)
  seccionesAbiertas.value = new Set(seccionesAbiertas.value)
}

// ─── Dialog estado ───────────────────────────────────────────────────────────
const dialogEstado = ref(false)
const nuevoEstado = ref('')
const estadosOpciones = [
  'iniciada', 'costos_registrados', 'xm_procesado', 'mandatos_emitidos',
  'en_contabilidad', 'en_revisoria', 'facturado', 'entregado',
]

// ─── Dialog resumen financiero ───────────────────────────────────────────────
const dialogResumen = ref(false)
const resumenForm = reactive({
  ingresos_energia_cop: null,
  costos_comercializacion_xm_cop: null,
  costos_operativos_cop: null,
  ingreso_neto_cop: null,
  tasa_cambio: null,
  consecutivo_inicial_ingresos: null,
  consecutivo_inicial_costos: null,
  comprobante_contable_ref: null,
})

function abrirEditResumen() {
  Object.assign(resumenForm, {
    ingresos_energia_cop: liq.value.ingresos_energia_cop,
    costos_comercializacion_xm_cop: liq.value.costos_comercializacion_xm_cop,
    costos_operativos_cop: liq.value.costos_operativos_cop,
    ingreso_neto_cop: liq.value.ingreso_neto_cop,
    tasa_cambio: liq.value.tasa_cambio,
    consecutivo_inicial_ingresos: liq.value.consecutivo_inicial_ingresos,
    consecutivo_inicial_costos: liq.value.consecutivo_inicial_costos,
    comprobante_contable_ref: liq.value.comprobante_contable_ref,
  })
  dialogResumen.value = true
}

// ─── Dialog costos ───────────────────────────────────────────────────────────
const dialogCosto = ref(false)
const costoEditId = ref(null)
const costoForm = reactive({
  tipo_costo: null, descripcion: '', proveedor: '',
  nro_soporte: '', soporte_url: '', valor_cop: null,
})
const tiposCosto = [
  'mantenimiento', 'arriendo', 'servicio_internet', 'poliza_cumplimiento',
  'servicios_publicos_consumo', 'cambio_equipos_medida', 'seguro', 'otro_costo',
]

function abrirDialogCosto(c = null) {
  costoEditId.value = c?.id ?? null
  Object.assign(costoForm, {
    tipo_costo: c?.tipo_costo ?? null,
    descripcion: c?.descripcion ?? '',
    proveedor: c?.proveedor ?? '',
    nro_soporte: c?.nro_soporte ?? '',
    soporte_url: c?.soporte_url ?? '',
    valor_cop: c?.valor_cop ?? null,
  })
  dialogCosto.value = true
}

// ─── Dialog facturas ─────────────────────────────────────────────────────────
const dialogFactura = ref(false)
const facturaEditId = ref(null)
const facturaForm = reactive({
  tipo_servicio: null, numero_factura: '', nro_soporte: '',
  soporte_url: '', fecha_emision: null, estado: 'emitida', valor_cop: null,
})
const tiposServicio = [
  'representacion', 'cgm', 'administracion_operacion', 'otro',
]

function abrirDialogFactura(f = null) {
  facturaEditId.value = f?.id ?? null
  Object.assign(facturaForm, {
    tipo_servicio: f?.tipo_servicio ?? null,
    numero_factura: f?.numero_factura ?? '',
    nro_soporte: f?.nro_soporte ?? '',
    soporte_url: f?.soporte_url ?? '',
    fecha_emision: f?.fecha_emision ?? null,
    estado: f?.estado ?? 'emitida',
    valor_cop: f?.valor_cop ?? null,
  })
  dialogFactura.value = true
}

// ─── Etiquetas de líneas ─────────────────────────────────────────────────────
const ETIQUETAS = {
  ingreso_bruto: 'Ingreso Bruto',
  ajuste_xm: 'Ajuste Xm',
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

// ─── Computed ─────────────────────────────────────────────────────────────────
const mandatosIngresos = computed(() =>
  (liq.value?.mandatos || []).filter(m => m.tipo === 'ingresos')
)

// Combina inversionistas registrados del proyecto con sus mandatos en la liquidación
const inversionistasConDetalle = computed(() => {
  if (!proyectoInversionistas.value.length) return []
  const mandatos = liq.value?.mandatos || []
  return proyectoInversionistas.value.map(pi => ({
    id: pi.id,
    nombre: pi.cliente_nombre,
    porcentaje: pi.porcentaje_participacion,
    es_patrimonio_autonomo: pi.es_patrimonio_autonomo,
    mandatosIngresos: mandatos.filter(m => m.inversionista?.id === pi.id && m.tipo === 'ingresos'),
    mandatosCostos: mandatos.filter(m => m.inversionista?.id === pi.id && m.tipo === 'costos'),
  }))
})

const inversionistasConCostos = computed(() =>
  inversionistasConDetalle.value.filter(inv => inv.mandatosCostos.length > 0)
)

// ─── Helpers de formato ───────────────────────────────────────────────────────
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
function facturaEstadoSeverity(e) {
  return { emitida: 'info', pagada: 'success', vencida: 'danger' }[e] || 'secondary'
}

// ─── Carga inicial ────────────────────────────────────────────────────────────
async function load() {
  loading.value = true
  try {
    const { data } = await api.get(`/liquidaciones/${route.params.id}`)
    liq.value = data
    nuevoEstado.value = data.estado
    // Cargar inversionistas del proyecto para mostrarlos todos (con o sin mandatos)
    if (data.proyecto_id) {
      const invRes = await api.get(`/proyectos/${data.proyecto_id}/inversionistas`)
      const raw = invRes.data
      proyectoInversionistas.value = Array.isArray(raw) ? raw : (raw.items ?? [])
    }
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la liquidación', life: 3000 })
  } finally {
    loading.value = false
  }
}

// ─── Acciones ─────────────────────────────────────────────────────────────────
async function guardarEstado() {
  guardando.value = true
  try {
    await api.patch(`/liquidaciones/${route.params.id}`, { estado: nuevoEstado.value })
    liq.value.estado = nuevoEstado.value
    dialogEstado.value = false
    toast.add({ severity: 'success', summary: 'Estado actualizado', life: 2000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar', life: 3000 })
  } finally {
    guardando.value = false
  }
}

async function guardarResumen() {
  guardando.value = true
  try {
    const payload = {}
    for (const [k, v] of Object.entries(resumenForm)) {
      if (v !== null && v !== undefined && v !== '') payload[k] = v
    }
    await api.patch(`/liquidaciones/${route.params.id}`, payload)
    Object.assign(liq.value, payload)
    dialogResumen.value = false
    toast.add({ severity: 'success', summary: 'Resumen actualizado', life: 2000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar', life: 3000 })
  } finally {
    guardando.value = false
  }
}

async function guardarCosto() {
  if (!costoForm.tipo_costo || costoForm.valor_cop == null) {
    toast.add({ severity: 'warn', summary: 'Completa tipo y valor', life: 2000 })
    return
  }
  guardando.value = true
  try {
    const payload = { ...costoForm }
    if (costoEditId.value) {
      const { data } = await api.patch(`/liquidaciones/${route.params.id}/costos/${costoEditId.value}`, payload)
      const idx = liq.value.costos.findIndex(c => c.id === costoEditId.value)
      if (idx >= 0) liq.value.costos[idx] = data
    } else {
      const { data } = await api.post(`/liquidaciones/${route.params.id}/costos`, payload)
      liq.value.costos = [...(liq.value.costos || []), data]
    }
    dialogCosto.value = false
    toast.add({ severity: 'success', summary: costoEditId.value ? 'Costo actualizado' : 'Costo agregado', life: 2000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el costo', life: 3000 })
  } finally {
    guardando.value = false
  }
}

async function eliminarCosto(id) {
  try {
    await api.delete(`/liquidaciones/${route.params.id}/costos/${id}`)
    liq.value.costos = liq.value.costos.filter(c => c.id !== id)
    toast.add({ severity: 'success', summary: 'Costo eliminado', life: 2000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Error al eliminar', life: 3000 })
  }
}

async function guardarFactura() {
  if (!facturaForm.tipo_servicio || facturaForm.valor_cop == null) {
    toast.add({ severity: 'warn', summary: 'Completa tipo y valor', life: 2000 })
    return
  }
  guardando.value = true
  try {
    const payload = { ...facturaForm }
    if (payload.fecha_emision instanceof Date) {
      const d = payload.fecha_emision
      payload.fecha_emision = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }
    if (facturaEditId.value) {
      const { data } = await api.patch(`/liquidaciones/${route.params.id}/facturas/${facturaEditId.value}`, payload)
      const idx = liq.value.facturas.findIndex(f => f.id === facturaEditId.value)
      if (idx >= 0) liq.value.facturas[idx] = data
    } else {
      const { data } = await api.post(`/liquidaciones/${route.params.id}/facturas`, payload)
      liq.value.facturas = [...(liq.value.facturas || []), data]
    }
    dialogFactura.value = false
    toast.add({ severity: 'success', summary: facturaEditId.value ? 'Factura actualizada' : 'Factura agregada', life: 2000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la factura', life: 3000 })
  } finally {
    guardando.value = false
  }
}

async function eliminarFactura(id) {
  try {
    await api.delete(`/liquidaciones/${route.params.id}/facturas/${id}`)
    liq.value.facturas = liq.value.facturas.filter(f => f.id !== id)
    toast.add({ severity: 'success', summary: 'Factura eliminada', life: 2000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Error al eliminar', life: 3000 })
  }
}

onMounted(load)
</script>
