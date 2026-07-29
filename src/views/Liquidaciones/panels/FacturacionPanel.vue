<template>
  <div class="fac p-4 sm:p-5 space-y-4">
    <!-- Sub-pestañas -->
    <div class="flex items-center justify-between flex-wrap gap-2">
      <div class="fac-subtabs">
        <button v-for="s in SUBS" :key="s.key" class="fac-subtab"
          :class="{ on: sub === s.key }" @click="sub = s.key">
          <i :class="s.icon" /><span>{{ s.label }}</span>
        </button>
      </div>
      <span class="text-[11px]" style="color:#9b8fb0">
        Energía del despacho × tarifa PPA indexada por IPP · {{ formatPeriodo(periodo) }}
      </span>
    </div>

    <ProgressSpinner v-if="loading" class="block mx-auto my-10" />

    <template v-else>
      <!-- Aviso IPP faltante -->
      <div v-if="!ippActual && sub !== 'ipp'" class="rounded-lg px-3 py-2.5 text-xs flex items-center gap-2"
        style="background:#fff7e6; border:1px solid #f5d99a; color:#8a5a12">
        <i class="pi pi-exclamation-triangle" />
        Falta el <b>IPP</b> de {{ formatPeriodo(periodo) }}. La facturación no se puede calcular sin él.
        <button class="fac-link ml-1" @click="sub = 'ipp'">Cargarlo →</button>
      </div>

      <!-- ═══ 1. FACTURACIÓN ═══ -->
      <template v-if="sub === 'facturacion'">
        <!-- Los totales ya salen en el pie de la tabla; solo se deja el aviso de los
             contratos sin PPA, que es lo que hay que accionar. -->
        <div v-if="res.sin_ppa" class="rounded-lg px-3 py-2 text-xs flex items-center gap-2"
             style="background:#fdecea; border:1px solid #f5c2bd; color:#a13527">
          <i class="pi pi-exclamation-triangle" />
          <b>{{ res.sin_ppa }}</b> contrato{{ res.sin_ppa === 1 ? '' : 's' }} sin PPA marco: no se factura
          por esta vía hasta asociarle su PPA. Ver el detalle abajo.
        </div>

        <div class="fac-card">
          <div class="tblwrap">
            <table class="dt">
              <thead><tr>
                <th class="l">Proyecto / Contrato</th><th class="l">Comerc.</th>
                <th>Energía (kWh)</th><th>Tarifa</th><th>Facturación</th>
              </tr></thead>
              <tbody>
                <tr v-for="l in facturables" :key="l.contrato">
                  <td class="l"><span class="proj">{{ l.proyecto || l.contrato }}</span>
                    <span class="sub2">{{ l.contrato }}</span></td>
                  <td class="l"><span class="tag">{{ l.comprador || '—' }}</span></td>
                  <td>{{ fmtNum(l.kwh) }}</td>
                  <td>{{ fmtNum(l.tarifa_indexada) }}</td>
                  <td class="fw">{{ fmtCOP(l.facturacion) }}</td>
                </tr>
              </tbody>
              <tfoot><tr>
                <td class="l" colspan="2">Total ({{ facturables.length }} contratos)</td>
                <td>{{ fmtNum(res.kwh_total) }}</td><td></td>
                <td class="fw">{{ fmtCOP(res.facturacion_total || 0) }}</td>
              </tr></tfoot>
            </table>
          </div>
        </div>

        <!-- No facturables: sin PPA marco, o con PPA pero sin tarifa/IPP. Antes solo
             se listaban los "sin PPA" y los otros casos no aparecían en ninguna parte. -->
        <div v-if="noFacturables.length" class="fac-card">
          <p class="fac-note"><i class="pi pi-info-circle" /> No facturables por esta vía ({{ noFacturables.length }}):</p>
          <div class="tblwrap">
            <table class="dt">
              <thead><tr><th class="l">Planta / Contrato</th><th class="l">Comerc.</th><th class="l">Motivo</th><th>Energía (kWh)</th></tr></thead>
              <tbody>
                <tr v-for="l in noFacturables" :key="l.contrato">
                  <!-- Mismo formato que la tabla de arriba: la planta manda y el código
                       queda debajo. Antes solo se veía el código y no se sabía qué planta era. -->
                  <td class="l"><span class="proj">{{ l.proyecto || 'Planta sin identificar' }}</span>
                    <span class="sub2">{{ l.contrato }}</span></td>
                  <td class="l"><span class="tag warn">{{ l.comprador || '—' }}</span></td>
                  <td class="l muted">{{ MOTIVOS[l.estado] || l.estado }}</td>
                  <td>{{ fmtNum(l.kwh) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>

      <!-- ═══ 1b. FACTURAS (por comercializador, divisibles) ═══ -->
      <template v-else-if="sub === 'facturas'">
        <div class="flex items-start justify-between gap-3 flex-wrap">
          <p class="text-[11px] flex-1" style="color:#9b8fb0; min-width:260px">
            Una fila por factura (contrato marco / PPA). Puedes <b>dividir</b> una en sub-facturas:
            despliega, marca proyectos y ponles un nombre (con un <b>%</b> si solo va una parte del
            contrato). La tarifa no cambia (sale del PPA). Se guarda y aplica cada mes.
          </p>
          <div class="flex items-center gap-2 shrink-0">
            <span class="text-[11px]" style="color:#6b5a8a">
              {{ res.emitidas || 0 }}/{{ res.facturas || porFactura.length }} facturadas
            </span>
            <button v-if="ordenTocado" class="fac-btn" :disabled="guardandoOrden" @click="guardarOrden">
              <i :class="guardandoOrden ? 'pi pi-spin pi-spinner' : 'pi pi-save'" class="text-xs" /> Guardar orden
            </button>
            <button class="fac-link" @click="restablecerOrden">Orden por valor</button>
          </div>
        </div>
        <div v-for="(f, i) in porFactura" :key="f.factura" class="fac-card"
             :class="{ 'fac-emitida': f.emitida, 'fac-drag': dragIdx === i,
                       'fac-drop-antes': dropIdx === i && dragIdx > i,
                       'fac-drop-despues': dropIdx === i && dragIdx < i }"
             @dragover.prevent="arrastrarSobre(i)" @drop.prevent="soltar(i)">
          <div class="fac-fac-head" @click="toggleFac(f.factura)">
            <!-- Reordenar: arrastrar por el asa para saltos largos, flechas para
                 mover de a uno. DnD nativo, sin dependencias nuevas. -->
            <span class="fac-ord" @click.stop>
              <span class="fac-grip" draggable="true" v-tooltip.top="'Arrastra para reordenar'"
                    @dragstart="iniciarArrastre(i, $event)" @dragend="finArrastre">
                <i class="pi pi-bars" />
              </span>
              <span class="fac-ord-arrows">
                <button class="fac-ord-b" :disabled="i === 0" v-tooltip.top="'Subir'"
                        @click="moverFactura(i, -1)"><i class="pi pi-chevron-up" /></button>
                <button class="fac-ord-b" :disabled="i === porFactura.length - 1" v-tooltip.bottom="'Bajar'"
                        @click="moverFactura(i, 1)"><i class="pi pi-chevron-down" /></button>
              </span>
            </span>
            <input type="checkbox" :checked="f.emitida" @click.stop
                   v-tooltip.top="f.emitida ? tooltipEmitida(f) : 'Marcar como facturada'"
                   @change="toggleEmitida(f)" />
            <i :class="abiertas.has(f.factura) ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" class="text-xs" style="color:#9b8fb0" />
            <span class="proj">{{ f.factura }}</span>
            <span v-if="f.personalizada" class="tag" style="background:#e6f6ef;color:#1f9d6b">dividida</span>
            <span v-else class="tag">{{ f.ppa || '—' }}</span>
            <span v-if="f.emitida" class="tag" style="background:#e6f6ef;color:#1f9d6b">facturada</span>
            <button class="fac-msg" @click.stop="copiarMensaje(f)"
                    v-tooltip.top="'Copiar el mensaje de la factura'">
              <i :class="copiada === f.factura ? 'pi pi-check' : 'pi pi-copy'" class="text-xs" />
              {{ copiada === f.factura ? 'Copiado' : 'Mensaje' }}
            </button>
            <span class="ml-auto fac-fac-nums">
              <span class="muted">{{ f.contratos }} contr</span>
              <span class="muted">· {{ fmtMWh(f.kwh) }}</span>
              <span class="muted">· tarifa {{ f.tarifa_mixta ? 'varía' : fmtNum(f.tarifa_indexada) }}</span>
              <b>{{ fmtCOP(f.facturacion) }}</b>
            </span>
          </div>
          <div v-if="abiertas.has(f.factura)" class="fac-fac-body">
            <div class="tblwrap">
              <table class="dt">
                <thead><tr><th class="l" style="width:34px"></th><th class="l">Proyecto</th><th class="l">Contrato</th><th>Tarifa</th><th>Energía (kWh)</th><th>Facturación</th><th style="width:60px"></th></tr></thead>
                <tbody>
                  <tr v-for="p in f.proyectos" :key="p.contrato">
                    <td class="l"><input type="checkbox"
                      :checked="selDe(f.factura).has(p.contrato)" @change="toggleProy(f.factura, p.contrato)" /></td>
                    <td class="l">{{ p.proyecto || '—' }}
                      <span v-if="p.asignada" class="sub2">↳ movido aquí</span>
                      <span v-if="p.porcentaje != null" class="sub2">↳ {{ fmtPct(p.porcentaje) }} de este contrato</span>
                    </td>
                    <td class="l muted">{{ p.contrato }}</td>
                    <td>{{ fmtNum(p.tarifa_indexada) }}</td>
                    <td>{{ fmtNum(p.kwh) }}</td>
                    <td class="fw">{{ fmtCOP(p.facturacion) }}</td>
                    <td class="l"><button v-if="p.asignada" class="fac-link" @click="quitarAsignacion(p.contrato)">quitar</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="fac-div-row">
              <input v-model="nuevoNombre[f.factura]" class="fac-in" style="width:220px" placeholder="Nombre de la nueva factura (ej. Terpel 2 PA)" />
              <!-- % opcional: si va solo una parte del contrato, el resto queda en el
                   PPA original. Es el caso de Uruaco → 22.8066% a la nueva factura. -->
              <input v-model="nuevoPct[f.factura]" class="fac-in" style="width:110px"
                     placeholder="% (opcional)" inputmode="decimal" />
              <button class="fac-btn" :disabled="guardandoDiv" @click="moverSeleccionados(f.factura)">
                <i :class="guardandoDiv ? 'pi pi-spin pi-spinner' : 'pi pi-arrow-right'" class="text-xs" /> Mover seleccionados
              </button>
              <span class="text-[10px]" style="color:#9b8fb0">
                Sin % se mueve el contrato completo. Con % (ej. <b>22.8066</b>) se mueve esa
                parte y el resto queda en «{{ f.ppa || f.factura }}».
              </span>
            </div>
          </div>
        </div>
      </template>

      <!-- ═══ 2. POR CÓDIGO SIC ═══ -->
      <template v-else-if="sub === 'sic'">
        <div class="fac-card">
          <div class="tblwrap">
            <table class="dt">
              <thead><tr><th class="l">Código SIC (comercializador)</th><th>Contratos</th><th>Energía (kWh)</th><th>Facturación</th></tr></thead>
              <tbody>
                <tr v-for="g in porSic" :key="g.comprador">
                  <td class="l"><span class="tag">{{ g.comprador }}</span></td>
                  <td>{{ g.contratos }}</td><td>{{ fmtNum(g.kwh) }}</td><td class="fw">{{ fmtCOP(g.facturacion) }}</td>
                </tr>
              </tbody>
              <tfoot><tr>
                <td class="l">Total</td>
                <td>{{ porSic.reduce((s,g)=>s+g.contratos,0) }}</td>
                <td>{{ fmtNum(res.kwh_total) }}</td>
                <td class="fw">{{ fmtCOP(res.facturacion_total || 0) }}</td>
              </tr></tfoot>
            </table>
          </div>
        </div>
      </template>

      <!-- ═══ 3. DESPACHOS ═══ -->
      <template v-else-if="sub === 'despachos'">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <span class="text-xs" style="color:#6b5a8a">
            <template v-if="despacho.contratos && despacho.contratos.length">
              {{ despacho.contratos.length }} contratos · {{ fmtMWh(despacho.kwh_total) }}
              <span v-if="despacho.archivo" class="sub2">· {{ despacho.archivo }}</span>
            </template>
            <template v-else>Sin despacho cargado para este mes.</template>
          </span>
          <button class="fac-upload" :disabled="subiendo" @click="pickDespacho">
            <i :class="subiendo ? 'pi pi-spin pi-spinner' : 'pi pi-upload'" class="text-xs" />
            {{ subiendo ? 'Subiendo…' : 'Subir despacho XM' }}
          </button>
        </div>
        <div v-if="despacho.contratos && despacho.contratos.length" class="fac-card">
          <div class="tblwrap">
            <table class="dt">
              <thead><tr><th class="l">Contrato</th><th class="l">Vendedor</th><th class="l">Comprador</th><th>Energía (kWh)</th></tr></thead>
              <tbody>
                <tr v-for="d in despacho.contratos" :key="d.contrato">
                  <td class="l">{{ d.contrato }}</td><td class="l muted">{{ d.vendedor || '—' }}</td>
                  <td class="l"><span class="tag">{{ d.comprador || '—' }}</span></td>
                  <td>{{ fmtNum(d.kwh) }}</td>
                </tr>
              </tbody>
              <tfoot><tr><td class="l" colspan="3">Total</td><td>{{ fmtNum(despacho.kwh_total) }}</td></tr></tfoot>
            </table>
          </div>
        </div>
      </template>

      <!-- ═══ 4. IPP ═══ -->
      <template v-else-if="sub === 'ipp'">
        <div class="fac-card p-4">
          <p class="text-sm font-bold mb-1" style="color:#2C2039">IPP del mes — {{ formatPeriodo(periodo) }}</p>
          <p class="text-[11px] mb-3" style="color:#9b8fb0">Índice de Precios al Productor (DANE). Numerador de la indexación de las tarifas de energía.</p>
          <div class="flex items-end gap-2">
            <div>
              <label class="fac-lbl">Valor IPP</label>
              <input v-model.number="ippInput" type="number" step="0.01" class="fac-in" placeholder="187.43" />
            </div>
            <button class="fac-btn" :disabled="guardandoIpp || !ippInput" @click="guardarIpp">
              <i :class="guardandoIpp ? 'pi pi-spin pi-spinner' : 'pi pi-save'" class="text-xs" /> Guardar
            </button>
            <span v-if="ippActual" class="text-[11px] ml-1" style="color:#2C7a3f">Actual: {{ ippActual }}</span>
          </div>
        </div>
        <div class="fac-card">
          <p class="fac-note">Histórico</p>
          <div class="tblwrap">
            <table class="dt">
              <thead><tr><th class="l">Período</th><th>IPP</th></tr></thead>
              <tbody>
                <tr v-for="r in ippHist" :key="r.año + '-' + r.mes" :class="{ cur: r.año === añoMes.a && r.mes === añoMes.m }">
                  <td class="l">{{ r.año }}-{{ String(r.mes).padStart(2,'0') }}</td>
                  <td>{{ r.valor }}</td>
                </tr>
                <tr v-if="!ippHist.length"><td class="l muted" colspan="2">Sin IPP cargado aún.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'
import api from '@/api/client'
import { fmtCOP, formatPeriodo } from '@/utils/liquidaciones'

const props = defineProps({ periodo: { type: String, required: true } })
const toast = useToast()

const SUBS = [
  { key: 'facturas', label: 'Facturas', icon: 'pi pi-file' },
  { key: 'facturacion', label: 'Detalle', icon: 'pi pi-dollar' },
  { key: 'sic', label: 'Por código SIC', icon: 'pi pi-sitemap' },
  { key: 'despachos', label: 'Despachos', icon: 'pi pi-database' },
  { key: 'ipp', label: 'IPP', icon: 'pi pi-percentage' },
]
const sub = ref('facturas')
const loading = ref(false)
const res = ref({})
const lineas = ref([])
const porSic = ref([])
const porFactura = ref([])
const abiertas = reactive(new Set())      // facturas expandidas
const sel = reactive({})                   // factura key → Set(proyecto_id) seleccionados
const nuevoNombre = reactive({})           // factura key → nombre de la nueva sub-factura
const nuevoPct = reactive({})              // factura key → % del contrato que se mueve
const guardandoDiv = ref(false)
const guardandoOrden = ref(false)
const ordenTocado = ref(false)             // hay reordenamiento sin guardar
const copiada = ref(null)                  // factura cuyo mensaje se acaba de copiar
const despacho = ref({ contratos: [], kwh_total: 0 })
const ippHist = ref([])
const ippInput = ref(null)
const subiendo = ref(false)
const guardandoIpp = ref(false)

const per = computed(() => (props.periodo || '').slice(0, 7))
const añoMes = computed(() => { const [a, m] = per.value.split('-').map(Number); return { a, m } })
const ippActual = computed(() => {
  const r = ippHist.value.find(x => x.año === añoMes.value.a && x.mes === añoMes.value.m)
  return r ? r.valor : null
})
const facturables = computed(() => lineas.value.filter(l => l.estado === 'ok'))
// Todo lo que no se puede facturar, con el motivo: si solo se listaran los "sin PPA",
// un contrato sin tarifa o sin IPP base no aparecería en ninguna parte de la vista.
const MOTIVOS = {
  sin_ppa: 'Sin PPA marco (vende vía UNGC)',
  sin_tarifa: 'Sin tarifa del PPA para el mes',
  sin_ipp_base: 'El PPA no tiene IPP base',
  sin_ipp_mes: 'Falta el IPP del mes',
}
const noFacturables = computed(() => lineas.value.filter(l => l.estado !== 'ok'))

const fmtNum = (v) => v == null ? '—' : Number(v).toLocaleString('es-CO', { maximumFractionDigits: 2 })
const fmtMWh = (kwh) => kwh == null ? '—' : (kwh / 1000).toLocaleString('es-CO', { maximumFractionDigits: 1 }) + ' MWh'
// Los % de división llevan 4 decimales (22,8066); no se redondean a 2 o el reparto
// deja de cuadrar con el Excel.
const fmtPct = (v) => v == null ? '—' : Number(v).toLocaleString('es-CO', { maximumFractionDigits: 4 }) + '%'

async function load () {
  if (!per.value) return
  loading.value = true
  try {
    const [fac, desp, ipp] = await Promise.all([
      api.get('/facturacion', { params: { periodo: per.value } }).then(r => r.data).catch(() => ({})),
      api.get('/facturacion/despacho', { params: { periodo: per.value } }).then(r => r.data).catch(() => ({ contratos: [] })),
      api.get('/ppa/ipp/mensual').then(r => r.data).catch(() => []),
    ])
    res.value = fac.resumen || {}
    lineas.value = fac.lineas || []
    porSic.value = fac.por_codigo_sic || []
    porFactura.value = fac.por_factura || []
    despacho.value = desp || { contratos: [] }
    ippHist.value = (ipp || []).slice().sort((a, b) => (b.año - a.año) || (b.mes - a.mes))
    ippInput.value = ippActual.value
  } finally {
    loading.value = false
  }
}

function pickDespacho () {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.xlsx'
  input.onchange = () => { const f = input.files && input.files[0]; if (f) subirDespacho(f) }
  input.click()
}
async function subirDespacho (file) {
  subiendo.value = true
  try {
    const fd = new FormData()
    fd.append('archivo', file)
    const { data } = await api.post(`/facturacion/despacho?periodo=${per.value}`, fd,
      { headers: { 'Content-Type': 'multipart/form-data' } })
    toast.add({ severity: 'success', summary: 'Despacho cargado', detail: `${data.contratos} contratos · ${(data.kwh_total / 1000).toFixed(0)} MWh`, life: 4000 })
    await load()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo cargar', detail: e?.response?.data?.detail || e.message, life: 6000 })
  } finally { subiendo.value = false }
}

// ── División de facturas ────────────────────────────────────────────────────
function toggleFac (k) { abiertas.has(k) ? abiertas.delete(k) : abiertas.add(k) }
function selDe (k) { if (!sel[k]) sel[k] = reactive(new Set()); return sel[k] }
function toggleProy (k, contrato) { const s = selDe(k); s.has(contrato) ? s.delete(contrato) : s.add(contrato) }
async function moverSeleccionados (k) {
  const s = selDe(k); const nombre = (nuevoNombre[k] || '').trim()
  if (!s.size) { toast.add({ severity: 'warn', summary: 'Selecciona contratos', life: 3000 }); return }
  if (!nombre) { toast.add({ severity: 'warn', summary: 'Escribe el nombre de la factura', life: 3000 }); return }
  // El % admite coma o punto (se escribe "22,8066" en teclado es-CO).
  const crudo = (nuevoPct[k] || '').toString().trim().replace(',', '.')
  let pct = null
  if (crudo) {
    pct = Number(crudo)
    if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
      toast.add({ severity: 'warn', summary: 'Porcentaje inválido', detail: 'Debe ser un número entre 0 y 100.', life: 4000 })
      return
    }
  }
  guardandoDiv.value = true
  try {
    const rows = [...s].filter(Boolean).map(c => ({ codigo_sic_contrato: c, nombre, porcentaje: pct }))
    await api.put('/facturacion/agrupaciones', rows)
    const comoPct = pct != null ? ` (${fmtPct(pct)})` : ''
    toast.add({ severity: 'success', summary: 'Factura dividida', detail: `${rows.length} contratos → "${nombre}"${comoPct}`, life: 3500 })
    s.clear(); nuevoNombre[k] = ''; nuevoPct[k] = ''
    await load()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo dividir', detail: e?.response?.data?.detail || e.message, life: 6000 })
  } finally { guardandoDiv.value = false }
}

// ── Orden manual, marca de facturada y mensaje ───────────────────────────────
// Arrastrar y soltar para saltos largos (con 17 facturas, mover la última arriba
// eran 16 clics de flecha). Las flechas quedan para mover de a una posición.
const dragIdx = ref(null)
const dropIdx = ref(null)

function iniciarArrastre (i, ev) {
  dragIdx.value = i
  if (ev.dataTransfer) {
    ev.dataTransfer.effectAllowed = 'move'
    // Firefox no inicia el arrastre si no hay datos en el dataTransfer.
    ev.dataTransfer.setData('text/plain', String(i))
  }
}
function arrastrarSobre (i) { if (dragIdx.value !== null) dropIdx.value = i }
function finArrastre () { dragIdx.value = null; dropIdx.value = null }

function soltar (i) {
  const from = dragIdx.value
  if (from === null || from === i) { finArrastre(); return }
  const arr = porFactura.value.slice()
  const [item] = arr.splice(from, 1)
  arr.splice(i, 0, item)          // toma el lugar de la factura sobre la que se suelta
  porFactura.value = arr
  ordenTocado.value = true
  finArrastre()
}

function moverFactura (i, dir) {
  const j = i + dir
  if (j < 0 || j >= porFactura.value.length) return
  const arr = porFactura.value.slice()
  ;[arr[i], arr[j]] = [arr[j], arr[i]]
  porFactura.value = arr
  ordenTocado.value = true
}

async function guardarOrden () {
  guardandoOrden.value = true
  try {
    await api.put('/facturacion/orden', { nombres: porFactura.value.map(f => f.factura) })
    ordenTocado.value = false
    toast.add({ severity: 'success', summary: 'Orden guardado', detail: 'Se aplica también a los próximos meses.', life: 3500 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo guardar el orden', detail: e?.response?.data?.detail || e.message, life: 5000 })
  } finally { guardandoOrden.value = false }
}

async function restablecerOrden () {
  try {
    await api.delete('/facturacion/orden')
    ordenTocado.value = false
    await load()
    toast.add({ severity: 'success', summary: 'Orden restablecido', detail: 'Vuelve a ordenarse por valor.', life: 3000 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo restablecer', detail: e?.response?.data?.detail || e.message, life: 5000 })
  }
}

function tooltipEmitida (f) {
  const quien = f.emitida_por ? ` por ${f.emitida_por}` : ''
  const cuando = f.emitida_at ? ` el ${new Date(f.emitida_at).toLocaleDateString('es-CO')}` : ''
  return `Facturada${quien}${cuando} · clic para desmarcar`
}

async function toggleEmitida (f) {
  const nuevo = !f.emitida
  f.emitida = nuevo                                  // optimista: el check responde ya
  try {
    await api.put('/facturacion/emitida', { nombre: f.factura, periodo: per.value, emitida: nuevo })
    res.value = { ...res.value, emitidas: (res.value.emitidas || 0) + (nuevo ? 1 : -1) }
  } catch (e) {
    f.emitida = !nuevo                               // revertir si el backend falló
    toast.add({ severity: 'error', summary: 'No se pudo marcar', detail: e?.response?.data?.detail || e.message, life: 5000 })
  }
}

async function copiarMensaje (f) {
  const texto = f.mensaje || ''
  if (!texto) { toast.add({ severity: 'warn', summary: 'Sin datos para el mensaje', life: 3000 }); return }
  try {
    await navigator.clipboard.writeText(texto)
  } catch {
    // Fallback para navegadores/contextos sin permiso de clipboard.
    const ta = document.createElement('textarea')
    ta.value = texto; ta.style.position = 'fixed'; ta.style.opacity = '0'
    document.body.appendChild(ta); ta.select()
    document.execCommand('copy'); document.body.removeChild(ta)
  }
  copiada.value = f.factura
  setTimeout(() => { if (copiada.value === f.factura) copiada.value = null }, 2500)
  if (f.tarifa_mixta) {
    toast.add({ severity: 'warn', summary: 'Copiado — revisa la tarifa', life: 5000,
      detail: 'Esta factura mezcla contratos con tarifas distintas; el mensaje usa una sola.' })
  }
}
async function quitarAsignacion (contrato) {
  try {
    await api.put('/facturacion/agrupaciones', [{ codigo_sic_contrato: contrato, nombre: '' }])
    await load()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo quitar', detail: e?.response?.data?.detail || e.message, life: 5000 })
  }
}

async function guardarIpp () {
  guardandoIpp.value = true
  try {
    await api.put('/ppa/ipp/mensual', [{ año: añoMes.value.a, mes: añoMes.value.m, valor: Number(ippInput.value) }])
    toast.add({ severity: 'success', summary: 'IPP guardado', detail: `${formatPeriodo(props.periodo)} = ${ippInput.value}`, life: 3500 })
    await load()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo guardar', detail: e?.response?.data?.detail || e.message, life: 6000 })
  } finally { guardandoIpp.value = false }
}

watch(() => props.periodo, load)
onMounted(load)
</script>

<style scoped>
.fac-subtabs { display:inline-flex; background:#F4F1FA; border:1px solid #E5E2EC; border-radius:10px; padding:3px; gap:2px; }
.fac-subtab { display:inline-flex; align-items:center; gap:6px; background:transparent; border:none; padding:6px 12px;
  font-size:12px; font-weight:700; color:#6B5A8A; border-radius:7px; cursor:pointer; white-space:nowrap; }
.fac-subtab.on { background:#915BD8; color:#FDFAF7; }
.fac-subtab:focus-visible { outline:2px solid #915BD8; outline-offset:2px; }


.fac-card { background:#fff; border:1px solid #e8e0f0; border-radius:14px; overflow:hidden; }
.fac-note { font-size:11.5px; color:#6b5a8a; padding:10px 12px 2px; display:flex; align-items:center; gap:6px; }
.tblwrap { overflow-x:auto; }
.dt { width:100%; border-collapse:collapse; font-size:12.5px; }
.dt thead th { text-align:right; padding:9px 12px; font-size:10px; text-transform:uppercase; letter-spacing:.04em;
  color:#9b8fb0; font-weight:700; border-bottom:1px solid #f0ebf6; background:#faf7ff; white-space:nowrap; }
.dt th.l { text-align:left; }
.dt tbody td { padding:8px 12px; border-bottom:1px solid #f7f3fc; text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; }
.dt td.l { text-align:left; white-space:normal; }
.dt tbody tr:hover { background:#faf7ff; }
.dt tbody tr.cur { background:#f3ecfb; }
.dt tfoot td { padding:9px 12px; border-top:2px solid #915BD8; background:rgba(145,91,216,.06);
  font-weight:800; color:#2C2039; text-align:right; font-variant-numeric:tabular-nums; }
.dt tfoot td.l { text-align:left; }
.proj { font-weight:600; color:#2C2039; }
.sub2 { display:block; font-size:10.5px; color:#9b8fb0; }
.muted { color:#9b8fb0; }
.fw { font-weight:700; color:#2C2039; }
.tag { display:inline-block; font-size:11px; padding:1px 7px; border-radius:6px; background:#f3ecfb; color:#6E3FB8; font-weight:600; }
.tag.warn { background:#fbe9e7; color:#c0392b; }

.fac-upload, .fac-btn { display:inline-flex; align-items:center; gap:6px; background:#915BD8; color:#fff; border:none;
  padding:7px 14px; border-radius:9px; font-size:12px; font-weight:700; cursor:pointer; }
.fac-upload:disabled, .fac-btn:disabled { opacity:.6; cursor:default; }
.fac-lbl { display:block; font-size:11px; color:#6b5a8a; font-weight:600; margin-bottom:3px; }
.fac-in { width:140px; padding:6px 10px; border:1px solid #ddd6e8; border-radius:8px; font-size:13px;
  font-variant-numeric:tabular-nums; }
.fac-link { background:none; border:none; color:#915BD8; font-weight:700; font-size:11px; cursor:pointer; text-decoration:underline; }
.fac-fac-head { display:flex; align-items:center; gap:8px; padding:10px 14px; cursor:pointer; user-select:none; }
.fac-fac-head:hover { background:#faf7ff; }
.fac-fac-nums { display:inline-flex; align-items:center; gap:8px; font-size:12px; color:#2C2039; font-variant-numeric:tabular-nums; }
.fac-fac-body { border-top:1px solid #f0ebf6; padding:4px 0 0; }
.fac-div-row { display:flex; align-items:center; gap:8px; padding:10px 14px; border-top:1px solid #f7f3fc; background:#faf7ff; flex-wrap:wrap; }

/* Reordenar: asa de arrastre + flechas apiladas, compactas para no crecer la fila. */
.fac-ord { display:inline-flex; align-items:center; gap:2px; }
.fac-ord-arrows { display:inline-flex; flex-direction:column; gap:1px; }
.fac-grip { display:flex; align-items:center; color:#c9bede; cursor:grab; padding:2px 1px; border-radius:3px; }
.fac-grip:hover { color:#915BD8; background:#f1eaf9; }
.fac-grip:active { cursor:grabbing; }
.fac-grip i { font-size:11px; }
.fac-ord-b { display:flex; align-items:center; justify-content:center; width:16px; height:11px;
  padding:0; border:none; background:none; color:#b9abcf; cursor:pointer; border-radius:3px; }
.fac-ord-b i { font-size:9px; }
.fac-ord-b:hover:not(:disabled) { color:#915BD8; background:#f1eaf9; }
.fac-ord-b:disabled { opacity:.3; cursor:default; }

.fac-msg { display:inline-flex; align-items:center; gap:4px; padding:3px 8px; border-radius:6px;
  border:1px solid #e5e2ec; background:#fff; color:#6E3FB8; font-size:11px; font-weight:700; cursor:pointer; }
.fac-msg:hover { background:#f4f1fa; }

/* Arrastre: la tarjeta que se mueve se atenúa y la de destino marca el borde por
   donde va a entrar, para no soltar a ciegas. */
.fac-drag { opacity:.45; }
.fac-drop-antes { box-shadow:inset 0 3px 0 0 #915BD8; }
.fac-drop-despues { box-shadow:inset 0 -3px 0 0 #915BD8; }

/* Facturada: se atenúa sin ocultarla, y una barra lateral la hace evidente al barrer la lista. */
.fac-emitida { border-left:3px solid #1f9d6b; }
.fac-emitida .proj { color:#6b5a8a; }
</style>
