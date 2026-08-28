<template>
  <div class="space-y-4 pt-3">
    <div
      class="flex items-center gap-3 rounded-xl border bg-white p-3 shadow-sm"
      style="border-color: #ece7f2"
    >
      <button
        type="button"
        @click="cambiarMes(-1)"
        class="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50"
      >
        <i class="pi pi-chevron-left text-xs text-gray-500" />
      </button>
      <span
        class="text-sm font-semibold"
        style="color: #2c2039; min-width: 100px; text-align: center"
      >
        {{ periodoLabel }}
      </span>
      <button
        type="button"
        @click="cambiarMes(1)"
        class="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50"
      >
        <i class="pi pi-chevron-right text-xs text-gray-500" />
      </button>
      <Tag :value="periodoActual" severity="secondary" class="font-mono text-xs" />
    </div>

    <div
      v-if="loading"
      class="flex justify-center rounded-xl border bg-white p-10 shadow-sm"
      style="border-color: #ece7f2"
    >
      <i class="pi pi-spin pi-spinner text-2xl text-gray-400" />
    </div>
    <div
      v-else-if="!filas.length"
      class="rounded-xl border bg-white p-10 text-center shadow-sm"
      style="border-color: #ece7f2"
    >
      <i class="pi pi-inbox mb-2 block text-2xl" style="color: #c4b5fd" />
      <p class="text-sm text-gray-500">No hay proyectos guardados para este período.</p>
      <p class="mt-1 text-xs text-gray-400">Operaciones aún no guardó la selección del mes.</p>
    </div>
    <div
      v-else
      class="overflow-hidden rounded-xl border bg-white shadow-sm"
      style="border-color: #ece7f2"
    >
      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-sm" style="min-width: 700px">
          <thead>
            <tr class="border-b border-gray-100 bg-gray-50">
              <th
                class="px-4 py-2.5 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase"
              >
                Proyecto
              </th>
              <th
                class="px-4 py-2.5 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase"
              >
                Periodo a facturar
              </th>
              <th
                class="px-4 py-2.5 text-right text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase"
              >
                Valor a Facturar
              </th>
              <th
                class="px-4 py-2.5 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase"
              >
                Indexación aplicada
              </th>
              <th
                class="px-4 py-2.5 text-center text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase"
              >
                Estado
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="fila in filas"
              :key="fila.contrato_id"
              class="border-t border-gray-100 transition-colors duration-100 hover:bg-gray-50/70"
            >
              <td class="px-4 py-2.5 font-medium" style="color: #2c2039">
                {{ fila.nombre_proyecto }}
              </td>
              <td class="px-4 py-2.5 text-xs text-gray-500">{{ fila.mes_año }}</td>
              <td class="px-4 py-2.5 text-right font-semibold tabular-nums" style="color: #7c3aed">
                {{ formatCOP(fila.valor_a_facturar) }}
              </td>
              <td
                class="px-4 py-2.5 text-xs text-gray-400"
                style="
                  max-width: 260px;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                "
                :title="fila.historial_indexaciones"
              >
                {{ fila.historial_indexaciones }}
              </td>
              <td class="px-4 py-2.5 text-center">
                <button
                  v-if="!fila.facturado"
                  type="button"
                  class="rounded-full border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-green-50"
                  style="border-color: #15803d; color: #15803d"
                  :disabled="toggling[fila.contrato_id]"
                  @click="toggleFacturado(fila)"
                >
                  Marcar facturado
                </button>
                <span
                  v-else
                  class="inline-flex cursor-pointer items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium hover:opacity-80"
                  style="background: #dcfce7; color: #166534"
                  @click="toggleFacturado(fila)"
                >
                  <i class="pi pi-check text-[10px]" />FACTURADO
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── Factura consolidada del mes ───────────────────────────────── -->
    <div class="overflow-hidden rounded-xl border bg-white shadow-sm" style="border-color: #ece7f2">
      <div
        class="flex items-center justify-between border-b px-4 py-2.5"
        style="border-color: #f3f0fa; background: #fdfcff"
      >
        <div class="flex items-center gap-2">
          <i class="pi pi-file-pdf text-xs" style="color: #915bd8" />
          <span class="text-sm font-semibold" style="color: #2c2039"
            >Factura consolidada del mes</span
          >
          <Tag :value="periodoLabel" severity="secondary" class="font-mono text-xs" />
        </div>
        <!-- indicador de estado -->
        <span
          v-if="factura.nombre_archivo"
          class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
          style="background: #dcfce7; color: #166534"
        >
          <i class="pi pi-check text-[10px]" />Subida
        </span>
        <span v-else class="text-xs text-gray-400">Pendiente</span>
      </div>

      <div class="space-y-3 px-4 py-3">
        <!-- Si ya existe factura: mostrar y opción de reemplazar -->
        <div
          v-if="factura.nombre_archivo"
          class="flex items-center gap-3 rounded-lg p-2.5"
          style="background: #f0fdf4; border: 1px solid #bbf7d0"
        >
          <i class="pi pi-file-pdf flex-shrink-0 text-sm" style="color: #16a34a" />
          <div class="min-w-0 flex-1">
            <p class="truncate text-xs font-semibold" style="color: #15803d">
              {{ factura.nombre_archivo }}
            </p>
            <p v-if="factura.subido_en" class="mt-0.5 text-[10px] text-gray-400">
              Subida: {{ fmtFecha(factura.subido_en) }}
            </p>
          </div>
          <!-- Descargar si es archivo local -->
          <button
            v-if="factura.tiene_archivo"
            type="button"
            @click="descargarFacturaConsolidada"
            class="flex flex-shrink-0 items-center gap-1 text-xs font-medium hover:underline"
            style="color: #15803d; background: none; border: none; padding: 0; cursor: pointer"
          >
            <i class="pi pi-download text-xs" />Descargar
          </button>
          <!-- Abrir link externo -->
          <a
            v-else-if="factura.enlace_pdf"
            :href="factura.enlace_pdf"
            target="_blank"
            rel="noopener"
            class="flex flex-shrink-0 items-center gap-1 text-xs font-medium hover:underline"
            style="color: #915bd8"
          >
            <i class="pi pi-external-link text-xs" />Ver
          </a>
        </div>

        <!-- Formulario de subida -->
        <div class="space-y-2">
          <p class="text-xs text-gray-500">
            {{ factura.nombre_archivo ? 'Reemplazar factura:' : 'Subir archivo PDF:' }}
          </p>

          <!-- Opción A: subir archivo -->
          <label
            class="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-xs transition-colors hover:border-purple-400"
            :class="archivoSeleccionado ? 'border-purple-400 bg-purple-50' : 'border-gray-300'"
          >
            <i
              class="pi pi-paperclip text-xs"
              :style="archivoSeleccionado ? 'color:#915BD8' : 'color:#9ca3af'"
            />
            <span :style="archivoSeleccionado ? 'color:#7c3aed' : 'color:#9ca3af'" class="truncate">
              {{ archivoSeleccionado ? archivoSeleccionado.name : 'Seleccionar PDF…' }}
            </span>
            <input type="file" accept=".pdf,.PDF" class="hidden" @change="onFacturaChange" />
          </label>

          <!-- Opción B: link externo -->
          <div class="flex items-center gap-1.5">
            <div class="h-px flex-1" style="background: #e5e7eb" />
            <span class="text-[10px] text-gray-400">o pega un link</span>
            <div class="h-px flex-1" style="background: #e5e7eb" />
          </div>
          <input
            type="url"
            v-model="linkExterno"
            placeholder="https://drive.google.com/…"
            class="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-purple-200 focus:outline-none"
          />

          <button
            type="button"
            :disabled="!puedeSubir || subiendoFactura"
            class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
            style="background: #915bd8; color: #fff; border: none"
            :style="
              !puedeSubir || subiendoFactura ? 'opacity:0.4;cursor:not-allowed' : 'cursor:pointer'
            "
            @click="subirFactura"
          >
            <i
              :class="subiendoFactura ? 'pi pi-spin pi-spinner' : 'pi pi-cloud-upload'"
              class="text-xs"
            />
            {{
              subiendoFactura
                ? 'Subiendo…'
                : factura.nombre_archivo
                  ? 'Reemplazar'
                  : 'Subir factura'
            }}
          </button>
        </div>
      </div>

      <!-- Resultado división PDF (transitorio — solo hasta cambiar de período o cerrar) -->
      <div
        v-if="splitResult"
        class="mx-4 mb-3 space-y-2 rounded-lg border px-3 py-2.5"
        :style="
          splitResult.error
            ? 'background:#fef2f2;border-color:#fca5a5'
            : 'background:#f0fdf4;border-color:#bbf7d0'
        "
      >
        <!-- Error de sistema -->
        <div v-if="splitResult.error" class="flex items-start gap-1.5">
          <i class="pi pi-times-circle mt-0.5 flex-shrink-0 text-xs" style="color: #dc2626" />
          <p class="text-xs text-red-700">Error al procesar el PDF: {{ splitResult.error }}</p>
        </div>

        <!-- Proyectos asociados correctamente -->
        <div v-else>
          <p class="mb-1 text-xs font-semibold" style="color: #166534">
            <i class="pi pi-check-circle mr-1" />
            {{ splitResult.procesados }}
            {{ splitResult.procesados === 1 ? 'proyecto asociado' : 'proyectos asociados' }}
            correctamente
          </p>
          <div v-if="splitResult.detalle?.length" class="space-y-0.5 pl-3">
            <div
              v-for="(item, i) in splitResult.detalle"
              :key="i"
              class="flex items-center gap-2 text-[10px] text-gray-600"
            >
              <i class="pi pi-file-pdf flex-shrink-0 text-[9px]" style="color: #16a34a" />
              <span class="truncate font-medium" style="max-width: 160px" :title="item.nombre">{{
                item.nombre
              }}</span>
              <span v-if="item.numero_factura" class="font-mono text-gray-400">{{
                item.numero_factura
              }}</span>
              <span
                v-if="item.total_pagar"
                class="ml-auto font-semibold tabular-nums"
                style="color: #7c3aed"
              >
                {{ formatCOP(item.total_pagar) }}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          class="mt-1 text-[10px] text-gray-400 hover:text-gray-600"
          @click="splitResult = null"
        >
          Cerrar
        </button>
      </div>

      <!-- Páginas sin match pendientes de asignar — persistente entre recargas -->
      <div
        v-if="sinMatchPendientes.length"
        class="mx-4 mb-3 space-y-2 rounded-lg border px-3 py-2.5"
        style="background: #fffbeb; border-color: #fcd34d40"
      >
        <p class="text-xs font-semibold" style="color: #92400e">
          <i class="pi pi-exclamation-triangle mr-1" />
          {{ sinMatchPendientes.length }}
          {{
            sinMatchPendientes.length === 1
              ? 'página pendiente de asignar'
              : 'páginas pendientes de asignar'
          }}
        </p>
        <div
          v-for="item in sinMatchPendientes"
          :key="item.id"
          class="space-y-1 rounded py-1.5 pl-3"
          style="background: #fef3c740"
        >
          <p class="text-[10px] font-semibold text-amber-800">
            Pág. {{ item.pagina }}
            <span v-if="item.numero_factura" class="font-mono font-normal text-gray-500">
              · {{ item.numero_factura }}</span
            >
            <span
              v-if="item.origen === 'backfill'"
              class="ml-1 rounded-full px-1 py-0.5 text-[9px] font-medium"
              style="background: #e5e7eb; color: #4b5563"
            >
              histórico
            </span>
          </p>
          <p v-if="item.nombre_extraido" class="text-[10px] text-gray-700">
            Nombre extraído: <span class="font-medium">"{{ item.nombre_extraido }}"</span>
          </p>
          <p class="text-[10px] text-gray-500">{{ item.razon }}</p>
          <div class="flex items-center gap-1.5 pt-0.5">
            <select
              v-model.number="asignacionSeleccionada[item.id]"
              class="max-w-[220px] flex-1 rounded border border-gray-200 px-1.5 py-1 text-[11px]"
            >
              <option :value="null" disabled>Asignar a proyecto…</option>
              <option v-for="p in proyectosOM" :key="p.contrato_id" :value="p.contrato_id">
                {{ p.nombre_proyecto }}
              </option>
            </select>
            <button
              type="button"
              :disabled="!asignacionSeleccionada[item.id] || asignando[item.id]"
              class="rounded px-2 py-1 text-[11px] font-semibold"
              style="background: #915bd8; color: #fff; border: none"
              :style="
                !asignacionSeleccionada[item.id] || asignando[item.id]
                  ? 'opacity:0.4'
                  : 'cursor:pointer'
              "
              @click="asignarSinMatch(item)"
            >
              {{ asignando[item.id] ? 'Asignando…' : 'Asignar' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch } from 'vue'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'
import api from '@/api/client'

const toast = useToast()

const hoy = new Date()
const periodoOffset = ref(0)

const periodoActual = computed(() => {
  const d = new Date(hoy.getFullYear(), hoy.getMonth() + periodoOffset.value, 1)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${yyyy}-${mm}`
})

const periodoLabel = computed(() => {
  const [yyyy, mm] = periodoActual.value.split('-')
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
  return `${MESES[parseInt(mm) - 1]} ${yyyy}`
})

function cambiarMes(delta) {
  periodoOffset.value += delta
}

const loading = ref(false)
const filas = ref([])
const toggling = reactive({})

// ── Factura consolidada ───────────────────────────────────────────────────────
const factura = ref({
  nombre_archivo: null,
  enlace_pdf: null,
  tiene_archivo: false,
  subido_en: null,
})
const archivoSeleccionado = ref(null)
const linkExterno = ref('')
const subiendoFactura = ref(false)
const splitResult = ref(null)

// ── Páginas sin match pendientes de asignación manual ────────────────────────
const sinMatchPendientes = ref([])
const proyectosOM = ref([])
const asignacionSeleccionada = reactive({}) // { [sin_match_id]: contrato_id }
const asignando = reactive({}) // { [sin_match_id]: boolean }

const puedeSubir = computed(
  () => !!(archivoSeleccionado.value || linkExterno.value.startsWith('http')),
)

function onFacturaChange(e) {
  archivoSeleccionado.value = e.target.files?.[0] ?? null
  if (archivoSeleccionado.value) linkExterno.value = ''
}

function fmtFecha(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

async function cargarFactura() {
  const periodoReq = periodoActual.value
  try {
    const { data } = await api.get(`/om/factura/${periodoReq}`)
    if (periodoReq !== periodoActual.value) return // respuesta obsoleta
    factura.value = data
    sinMatchPendientes.value = data.sin_match_pendientes ?? []
  } catch {
    /* silencioso — no hay factura aún */
  }
}

async function cargarProyectosOM() {
  try {
    const { data } = await api.get('/om/proyectos')
    proyectosOM.value = data
  } catch {
    /* el selector de asignación queda vacío si falla */
  }
}

async function asignarSinMatch(item) {
  const contratoId = asignacionSeleccionada[item.id]
  if (!contratoId) return
  asignando[item.id] = true
  try {
    await api.patch(`/om/factura/${periodoActual.value}/sin-match/${item.id}/asignar`, {
      contrato_id: contratoId,
    })
    sinMatchPendientes.value = sinMatchPendientes.value.filter((s) => s.id !== item.id)
    delete asignacionSeleccionada[item.id]
    toast.add({ severity: 'success', summary: 'Página asignada correctamente', life: 2500 })
    await cargarDatos()
  } catch {
    toast.add({ severity: 'error', summary: 'Error al asignar la página', life: 3000 })
  } finally {
    asignando[item.id] = false
  }
}

// Usa el cliente axios central (inyecta el Bearer token vía interceptor) en vez de un
// <a href> directo — VITE_API_URL no está definida en el build de producción, y aunque
// lo estuviera, el endpoint exige Authorization: Bearer, que un <a> no puede enviar.
async function descargarFacturaConsolidada() {
  try {
    const resp = await api.get(`/om/factura/${periodoActual.value}/file`, { responseType: 'blob' })
    const url = URL.createObjectURL(resp.data)
    const a = document.createElement('a')
    a.href = url
    a.download = factura.value.nombre_archivo || `factura-${periodoActual.value}.pdf`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 100)
  } catch (e) {
    if (e.response?.status === 404) {
      toast.add({
        severity: 'warn',
        summary: 'Archivo no disponible',
        detail:
          'La factura de este período ya no está en el servidor. Vuélvela a subir con "Reemplazar".',
        life: 6000,
      })
    } else {
      toast.add({ severity: 'error', summary: 'Error al descargar factura', life: 3000 })
    }
  }
}

async function subirFactura() {
  if (!puedeSubir.value) return
  subiendoFactura.value = true
  try {
    if (archivoSeleccionado.value) {
      const form = new FormData()
      form.append('file', archivoSeleccionado.value)
      const { data } = await api.post(`/om/factura/${periodoActual.value}/upload`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      splitResult.value = data.splitting_result ?? null
    } else {
      await api.put(`/om/factura/${periodoActual.value}/enlace`, {
        enlace_pdf: linkExterno.value,
        nombre_archivo: linkExterno.value,
      })
      splitResult.value = null
    }
    archivoSeleccionado.value = null
    linkExterno.value = ''
    await cargarFactura()
    toast.add({ severity: 'success', summary: 'Factura subida correctamente', life: 2500 })
  } catch {
    toast.add({ severity: 'error', summary: 'Error al subir la factura', life: 3000 })
  } finally {
    subiendoFactura.value = false
  }
}

function formatCOP(v) {
  if (v == null) return '—'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(v)
}

async function cargarDatos() {
  const periodoReq = periodoActual.value
  loading.value = true
  try {
    const res = await api.get(`/om/calculo/${periodoReq}`)
    if (periodoReq !== periodoActual.value) return // respuesta obsoleta: ya se cambió de mes
    filas.value = res.data.filas.filter((f) => f.incluido && f.habilitado)
  } catch {
    if (periodoReq !== periodoActual.value) return
    toast.add({ severity: 'error', summary: 'Error al cargar', life: 3000 })
  } finally {
    if (periodoReq === periodoActual.value) loading.value = false
  }
}

async function toggleFacturado(fila) {
  toggling[fila.contrato_id] = true
  try {
    await api.patch(`/om/seleccion/${periodoActual.value}/${fila.contrato_id}/facturado`)
    fila.facturado = !fila.facturado
  } catch {
    toast.add({ severity: 'error', summary: 'Error al actualizar estado', life: 3000 })
  } finally {
    toggling[fila.contrato_id] = false
  }
}

watch(periodoActual, () => {
  cargarDatos()
  cargarFactura()
  splitResult.value = null
})
onMounted(() => {
  cargarDatos()
  cargarFactura()
  cargarProyectosOM()
})
</script>
