<template>
  <div v-if="loading" class="flex items-center justify-center py-12">
    <i class="pi pi-spin pi-spinner text-3xl" style="color: #915BD8;" />
  </div>
  <div v-else-if="detalle" class="space-y-5">
    <div class="flex items-center justify-between flex-wrap gap-2">
      <div>
        <p class="text-sm font-bold" style="color: #2C2039;">{{ detalle.nombre_proyecto }}</p>
        <div class="text-xs font-mono" style="color: #9b89b5;">
          {{ detalle.fecha }}
          <span v-if="detalle.estado_reporte"> · Estado reporte {{ detalle.estado_reporte }}</span>
        </div>
      </div>
      <Tag v-if="detalle.revisar_manualmente" value="Revisar manualmente" severity="danger" />
      <Tag v-else value="OK" severity="success" />
    </div>

    <!-- Frontera de terceros: el CGM lo maneja otra empresa (ej. Cedillanos);
         se reporta con el Excel que ellos envían, no con este árbol de
         Casos -- ver FRONTERAS_TERCEROS en clasificador.py. -->
    <div v-if="String(detalle.caso) === '0'" class="rounded-xl p-4"
         style="border: 1px solid #e8e0f0; background: #f9f7ff;">
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p class="text-sm font-semibold" style="color: #2C2039;">
            <i :class="detalle.medidor_usado === 'excel_terceros' ? 'pi pi-check-circle' : 'pi pi-file-excel'"
               class="text-xs mr-1.5" :style="detalle.medidor_usado === 'excel_terceros' ? 'color: #059669;' : ''" />
            {{ detalle.medidor_usado === 'excel_terceros' ? 'Cargado desde Excel de terceros' : 'Esperando Excel de terceros' }}
          </p>
          <p v-if="detalle.medidor_usado === 'excel_terceros'" class="text-xs mt-1" style="color: #6b5a8a;">
            Ya hay un Excel cargado para este día -- {{ fmtKwh(detalle.energia_final_kwh) }}. Puedes
            reemplazarlo subiendo otro, o quitarlo con "Eliminar carga".
          </p>
          <p v-else class="text-xs mt-1" style="color: #6b5a8a;">
            El CGM de esta frontera lo maneja otra empresa; sube su Excel (Primary/Backup ×
            ENERGIA EXPORTADA ACTIVA) para reportar este día.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <input ref="fileInputExcelTerceros" type="file" accept=".xlsx,.xls" class="hidden"
                 @change="onArchivoExcelTercerosSeleccionado" />
          <Button label="Cargar Excel" size="small" icon="pi pi-upload"
                  :loading="subiendoExcelTerceros" @click="fileInputExcelTerceros?.click()" />
          <Button v-if="detalle.medidor_usado === 'excel_terceros'" label="Eliminar carga" size="small"
                  icon="pi pi-trash" severity="danger" outlined
                  :loading="eliminandoExcelTerceros" @click="eliminarExcelTerceros" />
        </div>
      </div>
    </div>

    <!-- Detalle de la clasificación -->
    <div class="rounded-xl p-4" style="border: 1px solid #e8e0f0;">
      <p class="text-xs font-semibold uppercase mb-3" style="color: #6b5a8a;">Detalle de la clasificación</p>
      <div class="flex items-start gap-3 mb-3">
        <div class="flex-none rounded-lg px-2.5 py-1.5 flex items-center justify-center font-bold text-sm whitespace-nowrap"
             :style="{ background: casoColor.bg, color: casoColor.fg, minWidth: '2.25rem' }">
          {{ detalle.caso }}
        </div>
        <div class="min-w-0">
          <p class="text-sm font-bold" style="color: #2C2039;">{{ casoInfo.nombre }}</p>
          <p class="text-xs" style="color: #6b5a8a;">{{ casoInfo.descripcion }}</p>
        </div>
      </div>
      <p v-if="detalle.error_clasificacion" class="text-xs rounded-lg px-2.5 py-1.5 mb-3 font-mono"
         style="background: rgba(214,68,85,0.08); color: #D64455;">
        {{ detalle.error_clasificacion }}
      </p>
      <dl class="grid grid-cols-2 gap-y-2 text-sm">
        <dt style="color: #9b89b5;">Fuente usada</dt><dd class="font-mono">{{ etiquetaFuente(detalle.medidor_usado, detalle) }}</dd>
        <dt style="color: #9b89b5;">Energía Total</dt><dd class="font-mono">{{ fmtKwh(detalle.energia_final_kwh) }}</dd>
        <template v-if="detalle.tipo === 'generacion'">
          <dt style="color: #9b89b5;">Factor de pérdida (FP)</dt>
          <dd class="font-mono">{{ detalle.fp != null ? detalle.fp.toFixed(4) : '—' }}</dd>
        </template>
        <template v-if="(detalle.horas_rellenadas_reconectador || []).length">
          <dt style="color: #9b89b5;">Horas rellenadas (reconectador)</dt>
          <dd class="font-mono">{{ formatearRangosHoras(detalle.horas_rellenadas_reconectador) }}</dd>
        </template>
        <template v-if="(detalle.horas_rellenadas_solenium || []).length">
          <dt style="color: #9b89b5;">Horas rellenadas (Solenium × FP)</dt>
          <dd class="font-mono">{{ formatearRangosHoras(detalle.horas_rellenadas_solenium) }}</dd>
        </template>
        <template v-if="(detalle.horas_rellenadas_historico || []).length">
          <dt style="color: #9b89b5;">Horas rellenadas (histórico)</dt>
          <dd class="font-mono">{{ formatearRangosHoras(detalle.horas_rellenadas_historico) }}</dd>
        </template>
        <template v-if="!(detalle.horas_rellenadas_reconectador || []).length && !(detalle.horas_rellenadas_solenium || []).length && !(detalle.horas_rellenadas_historico || []).length">
          <dt style="color: #9b89b5;">Horas rellenadas</dt>
          <dd class="font-mono">—</dd>
        </template>
      </dl>
    </div>

    <!-- Curva -->
    <div class="rounded-xl p-4" style="border: 1px solid #e8e0f0;">
      <p class="text-xs font-semibold uppercase mb-3" style="color: #6b5a8a;">Curva reportada (24 h)</p>
      <CurvaChart
        :final="detalle.curva_final"
        :medidor="detalle.curva_medidor_principal || detalle.curva_medidor_respaldo"
        :solenium="detalle.curva_solenium"
        :horasReconectador="detalle.horas_rellenadas_reconectador"
        :horasSolenium="detalle.horas_rellenadas_solenium"
        :horasHistorico="detalle.horas_rellenadas_historico"
        :capacidadMw="detalle.capacidad_efectiva_mw"
      />
    </div>

    <!-- Detalle de las fuentes -->
    <div class="rounded-xl p-4" style="border: 1px solid #e8e0f0;">
      <p class="text-xs font-semibold uppercase mb-3" style="color: #6b5a8a;">Detalle de las fuentes</p>
      <div v-if="detalle.medidor_actualizado_en_quoia" class="flex items-start gap-2.5 rounded-lg px-3 py-2.5 mb-3"
           style="background: rgba(37,124,214,0.08); border: 1px solid #257CD6;">
        <span class="flex-none rounded-full w-[18px] h-[18px] flex items-center justify-center text-[11px] font-bold text-white"
              style="background: #257CD6; margin-top: 1px;">i</span>
        <p class="text-xs" style="color: #1B5DA3; line-height: 1.5;">
          El medidor muestra un valor distinto en Quoia
          (<strong style="color: #2C2039;">{{ fmtKwh(detalle.energia_actual_kwh) }}</strong> ahora
          vs. <strong style="color: #2C2039;">{{ fmtKwh(detalle.energia_final_kwh) }}</strong> al momento de clasificar).
        </p>
      </div>
      <div class="space-y-0">
        <div v-for="f in fuentes" :key="f.clave"
             class="flex items-center gap-3 py-2.5 border-t first:border-t-0" style="border-color: #f0ecf6;">
          <div class="flex-none rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold"
               :style="fuenteIconStyle(f.estado)">
            {{ f.estado === 'ok' ? '✓' : (f.estado === 'na' ? '–' : (f.estado === 'error' ? '!' : '✕')) }}
          </div>
          <span class="text-sm font-semibold flex-none" style="color: #2C2039; width: 160px;">{{ f.nombre }}</span>
          <span class="text-xs flex-1 min-w-0" style="color: #6b5a8a;">{{ f.detalle }}</span>
          <span class="text-xs font-mono flex-none text-right" style="color: #2C2039; min-width: 90px;">
            {{ f.valor != null ? fmtKwh(f.valor) : (f.estado === 'na' ? 'n/a' : '—') }}
          </span>
          <span v-if="f.usado" class="text-[10px] font-bold text-white rounded-full px-2 py-0.5 flex-none" style="background: #915BD8;">USADO</span>
        </div>
      </div>
    </div>

    <!-- Edición manual -->
    <div class="rounded-xl p-4" style="border: 1px solid #e8e0f0;">
      <p class="text-xs font-semibold uppercase mb-3" style="color: #6b5a8a;">Corrección manual (kWh)</p>
      <div class="flex flex-wrap gap-4">
        <table class="tabla-horas">
          <thead><tr><th>Hora</th><th>kWh</th></tr></thead>
          <tbody>
            <tr v-for="h in 12" :key="h - 1" :class="esHoraRellenada(h - 1) ? 'fila-rellenada' : ''">
              <td>{{ h - 1 }}h</td>
              <td>
                <InputText v-model="curvaEditable[h - 1]" inputmode="decimal"
                           class="w-full text-xs text-right celda-input"
                           @paste="onPasteHora($event, h - 1)" />
              </td>
            </tr>
          </tbody>
        </table>
        <table class="tabla-horas">
          <thead><tr><th>Hora</th><th>kWh</th></tr></thead>
          <tbody>
            <tr v-for="h in 12" :key="h + 11" :class="esHoraRellenada(h + 11) ? 'fila-rellenada' : ''">
              <td>{{ h + 11 }}h</td>
              <td>
                <InputText v-model="curvaEditable[h + 11]" inputmode="decimal"
                           class="w-full text-xs text-right celda-input"
                           @paste="onPasteHora($event, h + 11)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="flex justify-end mt-2">
        <button type="button" class="text-xs font-semibold flex-none" style="color: #D64455;" @click="limpiarCurva">
          <i class="pi pi-eraser text-[10px] mr-1" />Limpiar
        </button>
      </div>
      <div class="flex items-center gap-1.5 text-xs mt-2" style="color: #9b89b5;">
        <span class="inline-block rounded-sm" style="width: 12px; height: 12px; background: rgba(240, 192, 64, 0.35); border: 1px solid #F0C040;"></span>
        Hora rellenada (reconectador/Solenium/histórico)
      </div>
      <p class="text-xs mt-1" style="color: #9b89b5;">
        Tip: Puedes pegar una columna completa desde cualquier celda.
      </p>
      <div class="flex items-center justify-between mt-2">
        <div v-if="!esCasoConfiado" class="relative">
          <Button label="Reportar con otra fuente" icon="pi pi-angle-down" iconPos="right" size="small"
            style="background: #F0C040; border-color: #F0C040; color: #4a3200;"
            @click="mostrarMenuReportar = !mostrarMenuReportar" />
          <div v-if="mostrarMenuReportar" class="fixed inset-0 z-10" @click="mostrarMenuReportar = false"></div>
          <div v-if="mostrarMenuReportar" class="absolute bottom-full left-0 mb-2 w-72 rounded-xl overflow-hidden z-20"
               style="background: white; border: 1px solid #e8e0f0; box-shadow: 0 10px 30px rgba(44,32,57,0.16);">
            <div v-for="op in opcionesReportarCon" :key="op.key"
                 class="flex items-center justify-between gap-3 px-3 py-2.5"
                 :class="op.disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:bg-[#f9f7ff]'"
                 style="border-bottom: 1px solid #e8e0f0;"
                 @click="!op.disabled && elegirFuenteReportar(op)">
              <div class="min-w-0">
                <div class="text-xs font-semibold" style="color: #2C2039;">{{ op.nombre }}</div>
                <div v-if="op.nota" class="text-[10.5px]" style="color: #9b89b5;">{{ op.nota }}</div>
              </div>
              <div class="text-xs font-mono flex-none" style="color: #2C2039;">
                {{ op.valor != null ? fmtKwh(op.valor) : 'Sin dato' }}
              </div>
            </div>
          </div>
        </div>
        <span v-else></span>
        <Button label="Guardar corrección" size="small" :loading="guardando" @click="guardarCurva" />
      </div>
    </div>

    <!-- Exclusion temporal: para cuando no se quiere reportar NADA mientras
         se resuelve algo externo (ej. un CT en falla ya reportado a XM) --
         no depende de Fallas (requiere monitoreo/representación, que no
         todas las fronteras tienen). -->
    <div class="rounded-xl p-4" style="border: 1px solid #e8e0f0;">
      <template v-if="exclusionActiva && !editandoExclusion">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-sm font-semibold" style="color: #A8590B;">
              <i class="pi pi-ban text-xs mr-1.5" />Excluida temporalmente
            </p>
            <p class="text-xs mt-1" style="color: #6b5a8a;">
              {{ exclusionActiva.motivo }}
              <span v-if="exclusionActiva.fecha_fin_estimada"> -- hasta {{ exclusionActiva.fecha_fin_estimada }}</span>
            </p>
            <p class="text-xs mt-1" style="color: #9b89b5;">
              Registrada por {{ exclusionActiva.creado_por || 'desconocido' }} el {{ fmtFechaHora(exclusionActiva.created_at) }}
            </p>
          </div>
          <button type="button" class="text-xs font-semibold flex-none" style="color: #6E3FB8;" @click="iniciarEdicionExclusion">
            <i class="pi pi-pencil text-[10px] mr-1" />Editar
          </button>
        </div>
        <Button label="Marcar resuelta" severity="secondary" outlined size="small" class="mt-3"
          :loading="resolviendoExclusion" @click="resolverExclusionActual" />
      </template>
      <template v-else-if="exclusionActiva && editandoExclusion">
        <p class="text-sm font-semibold mb-2" style="color: #2C2039;">Editar exclusión</p>
        <div class="flex flex-col gap-2 max-w-lg">
          <div class="flex gap-2 items-start">
            <Textarea v-model="nuevaExclusionMotivo" rows="1" placeholder="Motivo" class="text-xs flex-1" />
            <Calendar v-model="nuevaExclusionFechaFin" dateFormat="yy-mm-dd" placeholder="Hasta" class="w-48 text-xs" showIcon showClear />
          </div>
          <div class="flex gap-2">
            <Button label="Guardar" size="small" :disabled="!nuevaExclusionMotivo.trim()" :loading="editandoExclusionGuardando" @click="guardarEdicionExclusion" />
            <Button label="Cancelar" severity="secondary" outlined size="small" @click="editandoExclusion = false" />
          </div>
        </div>
      </template>
      <template v-else>
        <p class="text-sm font-semibold" style="color: #2C2039;">Excluir temporalmente</p>
        <p class="text-xs mb-3" style="color: #9b89b5;">
          No reporta ningún número automático mientras se resuelve el inconveniente/falla.
        </p>
        <div class="flex flex-col gap-2 max-w-lg">
          <div class="flex gap-2 items-start">
            <Textarea v-model="nuevaExclusionMotivo" rows="1" placeholder="Motivo" class="text-xs flex-1" />
            <Calendar v-model="nuevaExclusionFechaFin" dateFormat="yy-mm-dd" placeholder="Hasta" class="w-48 text-xs" showIcon />
          </div>
          <Button label="Excluir temporalmente" severity="danger" outlined size="small"
            :disabled="!nuevaExclusionMotivo.trim()" :loading="creandoExclusion" @click="crearExclusionActual" />
        </div>
      </template>
    </div>

    <!-- Historial de actividad (audit_log): ediciones, validaciones, envíos a Quoia -->
    <div class="rounded-xl p-4" style="border: 1px solid #e8e0f0;">
      <p class="text-xs font-semibold uppercase mb-3" style="color: #6b5a8a;">Historial de actividad</p>
      <p v-if="!ediciones.length" class="text-xs" style="color: #9b89b5;">
        Sin actividad registrada para este día.
      </p>
      <div v-else class="space-y-3">
        <div v-for="(ed, i) in ediciones" :key="i" class="pt-3 first:pt-0" :class="i > 0 ? 'border-t' : ''" style="border-color: #e8e0f0;">
          <div class="flex items-baseline gap-2 flex-wrap">
            <span class="text-sm font-bold" style="color: #2C2039;">{{ ed.usuario_nombre || 'Usuario desconocido' }}</span>
            <span class="text-sm" style="color: #6b5a8a;">{{ tituloEdicion(ed.cambios) }}</span>
            <span class="text-xs font-mono ml-auto" style="color: #9b89b5;">{{ fmtFechaHora(ed.created_at) }}</span>
          </div>
          <div class="mt-2 space-y-1.5">
            <div v-for="(c, j) in resumenCambios(ed.cambios)" :key="j"
                 class="flex items-center gap-2 text-xs rounded-lg px-2.5 py-1.5" style="background: #f9f7ff;">
              <span class="font-semibold w-32 flex-none" style="color: #6b5a8a;">{{ c.campo }}</span>
              <template v-if="c.resumen">
                <span style="color: #6b5a8a;">{{ c.resumen }}</span>
              </template>
              <template v-else>
                <span class="font-mono" style="color: #D64455; text-decoration: line-through; opacity: .75;">{{ c.antes }}</span>
                <span style="color: #9b89b5;">→</span>
                <span class="font-mono font-semibold" style="color: #10B981;">{{ c.despues }}</span>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Validar: accion final, independiente de la correccion manual --
         confirma que el numero automatico esta bien tal cual, sin tocar
         ningun valor. Separada de "Guardar correccion" para no parecer
         dos formas de guardar lo mismo. -->
    <div class="rounded-xl p-4 flex items-center justify-between gap-3" style="border: 1px solid #e8e0f0;">
      <div>
        <p class="text-sm font-semibold" style="color: #2C2039;">Confirmar revisión</p>
        <p class="text-xs" style="color: #9b89b5;">
          Marca este día como revisado y listo para reportar.
        </p>
        <p v-if="hayCambiosSinGuardar" class="text-xs mt-1" style="color: #D64455;">
          Hay cambios sin guardar en la curva -- guarda la corrección primero, o se validaría el número anterior.
        </p>
      </div>
      <Button label="Validar Frontera" severity="success" :loading="validando" :disabled="hayCambiosSinGuardar" @click="validar" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import api from '@/api/client'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Calendar from 'primevue/calendar'
import Textarea from 'primevue/textarea'
import CurvaChart from './ReporteEnergiaCurvaChart.vue'

const props = defineProps({
  fronteraId: { type: Number, required: true },
  fecha: { type: String, required: true },
})
const emit = defineEmits(['actualizado'])

const toast = useToast()
const loading = ref(true)
const detalle = ref(null)
const curvaEditable = ref(Array(24).fill(null))
const guardando = ref(false)
const mostrarMenuReportar = ref(false)
// Cuál opción de 'Reportar con otra fuente' llenó el editor por última vez
// -- se manda al guardar para que 'Fuente usada' diga esa fuente específica
// en vez de un genérico "Editado manualmente". Null si la persona edita
// celdas a mano sin pasar por ese desplegable.
const fuenteManualElegida = ref(null)
// { curva, energia_total_kwh, dias_usados } | null si no hay histórico
// confiable todavía -- se precarga para que el desplegable "Reportar con
// otra fuente" muestre el valor real de Curva típica en vez de "Sin dato"
// fijo (era un placeholder, no reflejaba si de verdad había histórico).
const curvaTipicaPreview = ref(null)
const validando = ref(false)
const ediciones = ref([])
const subiendoExcelTerceros = ref(false)
const eliminandoExcelTerceros = ref(false)
const fileInputExcelTerceros = ref(null)

async function cargarEdiciones() {
  try {
    const { data } = await api.get(`/reporte-energia/fronteras/${props.fronteraId}/ediciones`, { params: { fecha: props.fecha } })
    ediciones.value = data
  } catch (e) {
    ediciones.value = []
  }
}

// Exclusion temporal (no depende de Fallas -- ver ReporteEnergiaExclusion en
// el backend). El historial trae todas (activas y resueltas); "activa" es
// la que aplica al día que se está viendo.
const exclusiones = ref([])
const nuevaExclusionMotivo = ref('')
const nuevaExclusionFechaFin = ref(null)
const creandoExclusion = ref(false)
const resolviendoExclusion = ref(false)
const editandoExclusion = ref(false)
const editandoExclusionGuardando = ref(false)

async function cargarExclusiones() {
  try {
    const { data } = await api.get(`/reporte-energia/fronteras/${props.fronteraId}/exclusiones`)
    exclusiones.value = data
  } catch (e) {
    exclusiones.value = []
  }
}

const exclusionActiva = computed(() => {
  const fecha = props.fecha
  return exclusiones.value.find((e) =>
    !e.resuelta_en && e.fecha_inicio <= fecha && (!e.fecha_fin_estimada || e.fecha_fin_estimada >= fecha)
  ) || null
})

async function crearExclusionActual() {
  creandoExclusion.value = true
  try {
    await api.post(`/reporte-energia/fronteras/${props.fronteraId}/exclusiones`, {
      frontera_id: props.fronteraId,
      motivo: nuevaExclusionMotivo.value.trim(),
      fecha_inicio: props.fecha,
      fecha_fin_estimada: nuevaExclusionFechaFin.value ? nuevaExclusionFechaFin.value.toISOString().slice(0, 10) : null,
    })
    nuevaExclusionMotivo.value = ''
    nuevaExclusionFechaFin.value = null
    toast.add({ severity: 'success', summary: 'Frontera excluida', life: 2500 })
    await cargarExclusiones()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear la exclusión.', life: 4000 })
  } finally {
    creandoExclusion.value = false
  }
}

async function resolverExclusionActual() {
  if (!exclusionActiva.value) return
  resolviendoExclusion.value = true
  try {
    await api.post(`/reporte-energia/exclusiones/${exclusionActiva.value.id}/resolver`)
    toast.add({ severity: 'success', summary: 'Exclusión resuelta', life: 2500 })
    await cargarExclusiones()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo resolver la exclusión.', life: 4000 })
  } finally {
    resolviendoExclusion.value = false
  }
}

function iniciarEdicionExclusion() {
  if (!exclusionActiva.value) return
  nuevaExclusionMotivo.value = exclusionActiva.value.motivo
  nuevaExclusionFechaFin.value = exclusionActiva.value.fecha_fin_estimada
    ? new Date(exclusionActiva.value.fecha_fin_estimada + 'T00:00:00')
    : null
  editandoExclusion.value = true
}

async function guardarEdicionExclusion() {
  if (!exclusionActiva.value) return
  editandoExclusionGuardando.value = true
  try {
    await api.patch(`/reporte-energia/exclusiones/${exclusionActiva.value.id}`, {
      motivo: nuevaExclusionMotivo.value.trim(),
      fecha_fin_estimada: nuevaExclusionFechaFin.value ? nuevaExclusionFechaFin.value.toISOString().slice(0, 10) : null,
    })
    toast.add({ severity: 'success', summary: 'Exclusión actualizada', life: 2500 })
    editandoExclusion.value = false
    nuevaExclusionMotivo.value = ''
    nuevaExclusionFechaFin.value = null
    await cargarExclusiones()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar la exclusión.', life: 4000 })
  } finally {
    editandoExclusionGuardando.value = false
  }
}

function fmtFechaHora(iso) {
  return new Date(iso).toLocaleString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

// Encabezado del evento: cada tipo de accion (corregir, validar, enviar a
// Quoia) pasa por un endpoint distinto y cae en su propia fila de audit_log
// -- nunca se mezclan en un mismo 'cambios', asi que un solo chequeo basta.
function tituloEdicion(cambios) {
  if (!cambios) return 'hizo un cambio'
  if ('enviado_quoia_ok' in cambios) return 'envió el reporte a Quoia'
  if ('curva_final' in cambios || 'energia_final_kwh' in cambios) return 'corrigió la curva'
  if ('validado_en' in cambios) return 'validó la frontera'
  return 'hizo un cambio'
}

// Campos que ya se resumen aparte (arriba) y por eso no deben repetirse en
// el fallback generico de mas abajo.
const CAMPOS_YA_RESUMIDOS = new Set([
  'energia_final_kwh', 'curva_final',
  'enviado_quoia_ok', 'enviado_quoia_en', 'enviado_quoia_error',
  'validado_en', 'validado_por_id', 'revisar_manualmente',
])

// 'curva_final' nunca se muestra como 24 numeros crudos -- se resume a
// cuantas horas cambiaron. El resto de campos (ej. energia_final_kwh) se
// muestra como antes -> despues.
function resumenCambios(cambios) {
  if (!cambios) return []
  const partes = []
  if (cambios.energia_final_kwh) {
    partes.push({
      campo: 'Energía Total',
      antes: fmtKwh(cambios.energia_final_kwh.antes),
      despues: fmtKwh(cambios.energia_final_kwh.despues),
    })
  }
  if (cambios.curva_final) {
    const antes = cambios.curva_final.antes || []
    const despues = cambios.curva_final.despues || []
    const horas = []
    for (let h = 0; h < 24; h++) {
      const a = antes[h] ?? null, d = despues[h] ?? null
      if (Number(a) !== Number(d)) horas.push(h)
    }
    partes.push({
      campo: 'Curva horaria',
      resumen: horas.length
        ? `${horas.length} de 24 horas modificadas (${horas.map(h => h + 'h').join(', ')})`
        : 'Sin cambios en las horas',
    })
  }
  if (cambios.enviado_quoia_ok) {
    const ok = cambios.enviado_quoia_ok.despues
    partes.push({
      campo: 'Envío a Quoia',
      resumen: ok ? 'Enviado correctamente' : `Error — ${cambios.enviado_quoia_error?.despues || 'sin detalle'}`,
    })
  }
  if (cambios.validado_en) {
    partes.push({ campo: 'Validación', resumen: 'Confirmado sin cambios' })
  }
  for (const [campo, valores] of Object.entries(cambios)) {
    if (CAMPOS_YA_RESUMIDOS.has(campo)) continue
    partes.push({ campo, antes: String(valores.antes ?? '—'), despues: String(valores.despues ?? '—') })
  }
  return partes
}

async function cargar() {
  loading.value = true
  try {
    const { data } = await api.get(`/reporte-energia/fronteras/${props.fronteraId}`, { params: { fecha: props.fecha } })
    detalle.value = data
    curvaEditable.value = [...(data.curva_final || Array(24).fill(null))]
    fuenteManualElegida.value = null
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el detalle.', life: 4000 })
  } finally {
    loading.value = false
  }
}
async function cargarCurvaTipicaPreview() {
  curvaTipicaPreview.value = null
  try {
    const { data } = await api.get(`/reporte-energia/fronteras/${props.fronteraId}/curva-tipica`, {
      params: { fecha: props.fecha },
    })
    curvaTipicaPreview.value = data
  } catch (e) {
    curvaTipicaPreview.value = null
  }
}
onMounted(() => { cargar(); cargarEdiciones(); cargarExclusiones(); cargarCurvaTipicaPreview() })
watch(() => [props.fronteraId, props.fecha], () => {
  cargar(); cargarEdiciones(); cargarExclusiones(); cargarCurvaTipicaPreview()
})

// Frontera de terceros (caso=0, ver FRONTERAS_TERCEROS en clasificador.py) --
// el Excel puede traer varios días; recargamos el detalle del día actual
// para reflejar si quedó incluido en la carga.
async function onArchivoExcelTercerosSeleccionado(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  subiendoExcelTerceros.value = true
  try {
    const fd = new FormData()
    fd.append('archivo', file)
    const { data } = await api.post(`/reporte-energia/fronteras/${props.fronteraId}/cargar-excel-terceros`, fd)
    toast.add({
      severity: 'success', summary: 'Excel cargado',
      detail: `Se cargaron ${data.fechas_cargadas.length} día(s): ${data.fechas_cargadas.join(', ')}`,
      life: 4000,
    })
    await Promise.all([cargar(), cargarEdiciones()])
    emit('actualizado')
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e?.response?.data?.detail || 'No se pudo cargar el Excel.', life: 5000 })
  } finally {
    subiendoExcelTerceros.value = false
  }
}

// Sin confirmación a propósito -- volver a cargar el archivo correcto ya
// sobrescribe (mismo endpoint hace upsert), así que esto es solo para el
// caso más raro de querer dejar el día vacío otra vez.
async function eliminarExcelTerceros() {
  eliminandoExcelTerceros.value = true
  try {
    await api.delete(`/reporte-energia/fronteras/${props.fronteraId}/cargar-excel-terceros`, {
      params: { fecha: props.fecha },
    })
    toast.add({ severity: 'success', summary: 'Carga eliminada', life: 2500 })
    await Promise.all([cargar(), cargarEdiciones()])
    emit('actualizado')
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e?.response?.data?.detail || 'No se pudo eliminar la carga.', life: 5000 })
  } finally {
    eliminandoExcelTerceros.value = false
  }
}

// Pegado tipo Excel: si lo pegado trae varios valores (columna o fila
// copiada), se distribuyen empezando en la celda donde se pegó -- un solo
// valor suelto no activa nada, se comporta como un input normal.
function onPasteHora(event, indiceInicio) {
  const texto = event.clipboardData?.getData('text') || ''
  const valores = texto.split(/[\n\t,]+/).map(s => s.trim()).filter(Boolean).map(Number).filter(n => !isNaN(n))
  if (valores.length <= 1) return
  event.preventDefault()
  valores.forEach((v, i) => {
    const idx = indiceInicio + i
    if (idx < 24) curvaEditable.value[idx] = v
  })
}

function limpiarCurva() {
  curvaEditable.value = Array(24).fill(null)
}

function esHoraRellenada(h) {
  const d = detalle.value
  if (!d) return false
  return (d.horas_rellenadas_reconectador || []).includes(h)
    || (d.horas_rellenadas_solenium || []).includes(h)
    || (d.horas_rellenadas_historico || []).includes(h)
}

// 'Validar Frontera' confirma el numero YA GUARDADO tal cual, sin tocar
// nada (a proposito, ver comentario en el template) -- pero si la persona
// eligio una fuente en 'Reportar con otra fuente' (o edito una celda) y le
// da a Validar SIN pasar por 'Guardar corrección' primero, ese cambio nunca
// llega al backend y queda validado el valor anterior sin que se note.
// Comparar contra curva_final (lo persistido) detecta ese caso y bloquea
// Validar hasta que se guarde.
const hayCambiosSinGuardar = computed(() => {
  const persistida = detalle.value?.curva_final || Array(24).fill(null)
  for (let h = 0; h < 24; h++) {
    const a = curvaEditable.value[h] ?? null
    const b = persistida[h] ?? null
    if (Number(a || 0).toFixed(2) !== Number(b || 0).toFixed(2)) return true
  }
  return false
})

// Mismo criterio que separa 'confiado' de 'corregido_automatico' en el
// resumen del día (ver reporte_energia.py) -- Caso 1 (Generación) / 'CGM'
// (Consumo) sin Revisar Manualmente es la única combinación 100% automática
// sin ninguna corrección de por medio. Todo lo demás (revisar_manualmente=
// True, o un Caso distinto de 1/CGM aunque haya quedado automático) sí pasó
// por alguna decisión del clasificador que quien revisa podría querer
// cambiar -- por eso el botón de 'Reportar con otra fuente' aparece ahí
// también, no solo cuando queda marcado para revisar.
const esCasoConfiado = computed(() => {
  const d = detalle.value
  if (!d) return true
  return !d.revisar_manualmente && (String(d.caso) === '1' || d.caso === 'CGM')
})

// Alternativas manuales para cuando quien revisa decide que el resultado
// automático no fue el correcto -- usan las mismas curvas que ya se cargan
// para 'Detalle de las fuentes' (medidor principal/respaldo/Solenium + fp),
// no piden nada nuevo al backend. 'Curva típica' es la excepción: ya vivía
// como su propio endpoint/botón, así que solo se reusa aquí.
const opcionesReportarCon = computed(() => {
  const d = detalle.value
  if (!d) return []
  const conFp = (curva) => (curva || []).map(v => (v == null || d.fp == null) ? null : v * d.fp)
  const suma = (curva) => {
    const vals = (curva || []).filter(v => v != null)
    return vals.length ? vals.reduce((a, b) => a + b, 0) : null
  }
  const curvaInversoresFp = conFp(d.curva_solenium)
  const tipica = curvaTipicaPreview.value
  // Cuál medidor (principal/respaldo) es el que se usó realmente -- si
  // Quoia ya muestra otro valor para ESE medidor (medidor_actualizado_en_
  // quoia + curva_actual), esa opción usa directo el valor en vivo en vez
  // del persistido al clasificar, con nota -- no un item aparte: sigue
  // siendo el mismo medidor, solo con el dato más fresco.
  const mu = d.medidor_usado || ''
  const fuenteActualKey = mu.startsWith('respaldo') ? 'respaldo' : 'principal'
  const tieneActualizado = d.medidor_actualizado_en_quoia && d.curva_actual != null
  const opcionMedidor = (key, nombre, curvaPersistida) => {
    if (tieneActualizado && key === fuenteActualKey) {
      return {
        key, nombre: `${nombre} (actualizado)`, curva: d.curva_actual,
        nota: 'Quoia ya reporta otro valor -- ver aviso arriba', valor: d.energia_actual_kwh,
      }
    }
    return { key, nombre, curva: curvaPersistida, valor: suma(curvaPersistida), disabled: suma(curvaPersistida) == null }
  }
  return [
    {
      key: 'tipica', nombre: 'Curva típica (histórico)', curva: tipica?.curva,
      nota: tipica ? `mediana de ${tipica.dias_usados} días` : 'sin histórico suficiente',
      valor: tipica ? tipica.energia_total_kwh : null, disabled: !tipica,
    },
    opcionMedidor('principal', 'Medidor principal', d.curva_medidor_principal),
    opcionMedidor('respaldo', 'Medidor respaldo', d.curva_medidor_respaldo),
    { key: 'inversores', nombre: 'Inversores × FP', curva: curvaInversoresFp, valor: suma(curvaInversoresFp), disabled: suma(curvaInversoresFp) == null },
    { key: 'ceros', nombre: 'Matriz de ceros', curva: Array(24).fill(0), valor: 0 },
  ]
})

function elegirFuenteReportar(op) {
  mostrarMenuReportar.value = false
  curvaEditable.value = [...op.curva]
  fuenteManualElegida.value = op.key === 'tipica' ? 'historico' : op.key
  toast.add({
    severity: 'info', summary: `${op.nombre} aplicado`,
    detail: `${fmtKwh(op.valor)} -- revisa y guarda si está bien.`, life: 4000,
  })
}

async function guardarCurva() {
  guardando.value = true
  try {
    // Las celdas son InputText (texto libre, no InputNumber) para que el
    // cursor no salte al editar un dígito del medio -- así que acá pueden
    // llegar strings ("45.6"), vacías (""), o numeros ya normales (paste,
    // carga inicial). Se normaliza a float | null justo antes de enviar.
    const curvaNormalizada = curvaEditable.value.map(v => {
      if (v === null || v === undefined || v === '') return null
      const n = Number(v)
      return Number.isNaN(n) ? null : n
    })
    const { data } = await api.patch(
      `/reporte-energia/fronteras/${props.fronteraId}`,
      { curva_final: curvaNormalizada, fuente: fuenteManualElegida.value },
      { params: { fecha: props.fecha } },
    )
    detalle.value = data
    toast.add({ severity: 'success', summary: 'Corrección guardada', life: 2500 })
    emit('actualizado')
    cargarEdiciones()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la corrección.', life: 4000 })
  } finally {
    guardando.value = false
  }
}

async function validar() {
  validando.value = true
  try {
    await api.post(`/reporte-energia/fronteras/${props.fronteraId}/validar`, null, {
      params: { fecha: props.fecha },
    })
    detalle.value.revisar_manualmente = false
    toast.add({ severity: 'success', summary: 'Validado', life: 2000 })
    emit('actualizado')
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo validar.', life: 4000 })
  } finally {
    validando.value = false
  }
}

// Nombre + descripcion de cada Caso, para no obligar a memorizar el arbol
// de decision del clasificador (ver app/services/reporte_energia/clasificador.py
// y clasificador_consumo.py en el backend).
const CASO_INFO_GENERACION = {
  // '0' no tiene una sola descripcion fija -- ver casoInfo0() abajo.
  '0': { nombre: 'Reporta a otra empresa', descripcion: 'Frontera de terceros, fuera de este árbol de decisión' },
  '1': { nombre: 'Reporte CGM válido', descripcion: 'El envío automático de Quoia al ASIC fue válido hoy y coincide con los inversores' },
  '2': { nombre: 'Medidor valida', descripcion: 'El reporte automático no fue válido, pero un medidor coincide con los inversores' },
  // '3' tampoco tiene una sola descripcion fija -- ver casoInfo3() abajo.
  '4': { nombre: 'Medidor de mayor valor', descripcion: 'Los medidores registran más energía que los inversores; se usa el de mayor valor' },
  // '5' no tiene una sola descripcion fija -- el arbol real (clasificador.py)
  // tiene 4 caminos distintos que todos terminan en el mismo numero de Caso
  // (CGM ya valido sin inversores completos para cruzar, inversores parciales
  // x FP, reconectador, o medidor sin inversores). Ver casoInfo5() abajo.
  '6': { nombre: 'Apagado', descripcion: 'Ninguna fuente -- CGM, medidor, inversores ni reconectador -- registra generación hoy' },
  '7': { nombre: 'Reconstruido con reconectador o crudos', descripcion: 'Sin reporte automático ni medidor; se reconstruye con reconectador, Solenium (power) o datos crudos completos' },
  '8': { nombre: 'Datos crudos parciales', descripcion: 'Datos crudos incompletos; se rellenan las horas faltantes con reconectador, Solenium o histórico' },
  '-1': { nombre: 'Error de clasificación', descripcion: 'El clasificador falló para esta frontera' },
  '-2': { nombre: 'Excluida temporalmente', descripcion: '' },
}
const CASO_INFO_CONSUMO = {
  'CGM': { nombre: 'Reporte válido', descripcion: 'El reporte automático fue válido y el canal CGM trae dato real' },
  // 'Medidor' tampoco tiene una sola descripcion fija -- ver casoInfoMedidorConsumo() abajo.
  'Histórico': { nombre: 'Histórico propio', descripcion: 'Ni CGM ni medidor creíbles; se usa la mediana y forma horaria del histórico' },
  'Sin dato': { nombre: 'Sin dato', descripcion: 'Ninguna fuente disponible para este día' },
  'Error': { nombre: 'Error de clasificación', descripcion: 'El clasificador falló para esta frontera' },
  'Excluida': { nombre: 'Excluida temporalmente', descripcion: '' },
}
// Caso 3 (Generación) junta 2 resultados muy distintos bajo el mismo numero:
// medidor_usado='revisar' significa que no habia Factor de Perdida
// disponible -- energia_final_kwh queda en None y la curva vacia, no se
// corrigio nada (ver clasificador.py lineas 122 y 185, dos rutas de codigo
// distintas que llegan a lo mismo). medidor_usado='inversores' es el caso
// normal, con curva real corregida por FP.
function casoInfo0(d) {
  if (d.medidor_usado === 'excel_terceros') {
    return { nombre: 'Cargado desde Excel de terceros', descripcion: 'El CGM de esta frontera lo maneja otra empresa; se reportó con el Excel que subieron para este día' }
  }
  return { nombre: 'Esperando Excel de terceros', descripcion: 'El CGM de esta frontera lo maneja otra empresa; falta subir su Excel para este día' }
}
// medidor_usado='revisar' junta 2 caminos reales del clasificador
// (clasificador.py:137-141 y :216-219) que no se distinguen entre sí --
// solenium_completo sí los diferencia: es False solo en el segundo (por eso
// e_inv se trató como incompleto y se cayó a esa rama, ver :349-353).
function casoInfo3(d) {
  // 'relleno_horario': _decidir_caso() no encontró ninguna fuente y devolvió
  // curva vacía, pero el relleno horario centralizado (después, con
  // reconectador/Solenium×FP/histórico) sí logró llenar horas -- ver
  // clasificador.py, comentario sobre Granja Solar Uruaco 2026-08-03.
  if (d.medidor_usado === 'relleno_horario') {
    return { nombre: 'Reconstruido con relleno horario', descripcion: 'Sin inversores completos, CGM ni medidor ese día -- se reconstruyó hora por hora con reconectador, Solenium × Factor de Pérdida o histórico (ver abajo qué horas)' }
  }
  if (d.medidor_usado === 'revisar') {
    if (d.solenium_completo === false) {
      return { nombre: 'Inversores parciales, sin más fuentes', descripcion: 'Los inversores solo reportaron parcial ese día y ni CGM ni el medidor tienen dato -- no se pudo construir ninguna curva automática' }
    }
    return { nombre: 'Sin Factor de Pérdida disponible', descripcion: 'Los medidores registran menos energía que los inversores, pero no hay suficiente histórico para calcular el Factor de Pérdida -- no se pudo generar ninguna curva automática' }
  }
  return { nombre: 'Inversores × Factor de Pérdida', descripcion: 'Los medidores registran menos energía que los inversores; se corrige con el histórico de pérdida' }
}

// 'Medidor' (Consumo) junta el mismo tipo de conflacion que Caso 3/5 de
// Generación. medidor_usado='revisar' es un valor heredado -- ya no lo
// produce el clasificador actual, pero sigue vivo en filas viejas de la BD
// clasificadas antes de este fix (energia_final_kwh en None, no se validó
// nada). 'principal_sin_historico'/'respaldo_sin_historico' es el camino
// vigente: sin mediana con qué comparar, se usa el dato disponible del
// medidor esté completo o no (antes se vaciaba la curva entera por un
// hueco parcial, ver GD Polaris 2 Consumo 2026-08-03).
function casoInfoMedidorConsumo(d) {
  if (d.medidor_usado === 'revisar') {
    return { nombre: 'Sin histórico para comparar', descripcion: 'CGM no válido; hay medidor con dato, pero no hay suficiente histórico para calcular su mediana -- no se pudo validar ni generar curva automática' }
  }
  if (d.medidor_usado === 'principal_sin_historico' || d.medidor_usado === 'respaldo_sin_historico') {
    return { nombre: 'Medidor sin histórico para validar', descripcion: 'CGM no válido; el medidor tiene dato pero no hay mediana histórica para confirmar que el nivel es correcto -- se reporta con lo disponible, revisar a mano' }
  }
  return { nombre: 'Medidor valida contra histórico', descripcion: 'CGM no válido; el medidor se comparó contra su propia mediana histórica' }
}

// Caso 5 (Generación) junta 4 caminos reales del clasificador bajo un mismo
// numero -- distinguirlos por medidor_usado, que sí refleja cuál se tomó:
//  - 'cgm': el reporte CGM ya era válido; el único motivo de no quedar en
//    Caso 1 es que Solenium no tenía dato completo para cruzar ese día
//    (o de plano no hay inversores registrados -- nota_solenium lo dice).
//  - 'inversores': CGM no válido y medidor caído; se usa el total parcial
//    de inversores corregido con el Factor de Pérdida.
//  - 'reconectador': CGM no válido, medidor caído y sin FP; se reconstruye
//    con el reconectador.
//  - 'principal' / 'respaldo': el caso "clásico" -- sí hay medidor con
//    dato, de verdad no hay inversores contra qué validarlo.
function casoInfo5(d) {
  if (d.medidor_usado === 'cgm') {
    if (d.nota_solenium) {
      return { nombre: 'Sin inversores registrados', descripcion: 'El reporte CGM fue válido; el proyecto no tiene inversores registrados en Solenium' }
    }
    // Solenium incompleto no significa "no se pudo usar" -- si SÍ se
    // comparó contra las horas que reportó (error_final_pct presente), la
    // descripción vieja decía lo contrario de lo que en realidad pasó (ver
    // Minigranja 0018 La Paz Leyenda 2026-08-10: 1,53% de diferencia, sí se
    // cruzó y coincidió).
    if (d.error_final_pct != null) {
      return {
        nombre: 'CGM válido, Solenium incompleto',
        descripcion: `El reporte CGM ya era válido; se comparó contra los inversores en las horas que sí reportaron ese día (${Math.abs(d.error_final_pct).toFixed(1)}% de diferencia)`,
      }
    }
    return { nombre: 'CGM válido, Solenium incompleto', descripcion: 'El reporte CGM ya era válido; los inversores no reportaron nada ese día, no hubo con qué cruzar' }
  }
  if (d.medidor_usado === 'inversores') {
    return { nombre: 'Inversores parciales × Factor de Pérdida', descripcion: 'CGM no válido y el medidor está caído; se usa el total parcial de inversores corregido con el histórico de pérdida' }
  }
  if (d.medidor_usado === 'reconectador') {
    return { nombre: 'Reconstruido con reconectador', descripcion: 'CGM no válido, el medidor está caído y Solenium no tiene dato completo; se reconstruye con el reconectador' }
  }
  if (d.medidor_usado === 'principal_sin_cgm' || d.medidor_usado === 'respaldo_sin_cgm') {
    if (d.error_final_pct != null) {
      return {
        nombre: 'Medidor sin CGM, validado contra inversores',
        descripcion: `CGM no reportó nada ese día; se usa el medidor directo, comparado contra los inversores en las horas que sí reportaron (${Math.abs(d.error_final_pct).toFixed(1)}% de diferencia)`,
      }
    }
    return { nombre: 'Medidor sin CGM ni inversores', descripcion: 'CGM no reportó nada ese día y no hay inversores con qué comparar; se usa el medidor directo' }
  }
  return { nombre: 'Sin inversores registrados', descripcion: 'Hay medidor con dato, pero el proyecto no tiene inversores en Solenium contra qué validarlo' }
}
const casoInfo = computed(() => {
  const d = detalle.value
  if (!d) return { nombre: '', descripcion: '' }
  if (d.tipo === 'generacion' && String(d.caso) === '0') return casoInfo0(d)
  if (d.tipo === 'generacion' && String(d.caso) === '3') return casoInfo3(d)
  if (d.tipo === 'generacion' && String(d.caso) === '5') return casoInfo5(d)
  if (d.tipo === 'consumo' && String(d.caso) === 'Medidor') return casoInfoMedidorConsumo(d)
  const mapa = d.tipo === 'generacion' ? CASO_INFO_GENERACION : CASO_INFO_CONSUMO
  return mapa[String(d.caso)] || { nombre: `Caso ${d.caso}`, descripcion: '' }
})
const casoColor = computed(() => {
  const d = detalle.value
  if (!d) return { bg: '#f9f7ff', fg: '#9b89b5' }
  if (d.revisar_manualmente) return { bg: 'rgba(199,119,0,0.1)', fg: '#A8590B' }
  const casosOk = d.tipo === 'generacion' ? ['1', '2'] : ['CGM']
  if (casosOk.includes(String(d.caso))) return { bg: 'rgba(16,185,129,0.1)', fg: '#10B981' }
  return { bg: '#f9f7ff', fg: '#6b5a8a' }
})

// Suma una curva de 24h solo si trae al menos un valor real -- distingue
// "0 kWh real" (curva con datos, todos en 0) de "sin lectura en absoluto"
// (curva null o completamente vacía).
function sumaCurva(arr) {
  if (!arr || !arr.some((v) => v !== null && v !== undefined)) return null
  return arr.reduce((s, v) => s + (Number(v) || 0), 0)
}
// Comprime horas en rangos legibles: [0,1,2,3,19,20] -> "0-3h, 19-20h".
function formatearRangosHoras(horas) {
  if (!horas.length) return ''
  const rangos = []
  let inicio = horas[0], fin = horas[0]
  for (let i = 1; i <= horas.length; i++) {
    if (i < horas.length && horas[i] === fin + 1) {
      fin = horas[i]
    } else {
      rangos.push(inicio === fin ? `${inicio}h` : `${inicio}-${fin}h`)
      if (i < horas.length) { inicio = horas[i]; fin = horas[i] }
    }
  }
  return rangos.join(', ')
}
function horasFaltantes(arr) {
  if (!arr) return []
  const faltan = []
  for (let h = 0; h < 24; h++) {
    if (arr[h] === null || arr[h] === undefined) faltan.push(h)
  }
  return faltan
}
// Mismo criterio que HORAS_SOLARES en utils.py (backend) -- de noche no hay
// generacion posible, asi que un hueco ahi no es información útil para el
// usuario. Sin este filtro, 'Dato incompleto' mostraba TODAS las horas sin
// dato (ej. 0h-7h) cuando lo que de verdad importaba eran solo 2 (6h-7h).
const HORAS_SOLARES_FRONT = new Set([6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17])
function horasFaltantesSolares(arr) {
  const faltan = horasFaltantes(arr)
  const enVentana = faltan.filter(h => HORAS_SOLARES_FRONT.has(h))
  // Si por algún motivo las horas sin dato caen TODAS fuera de la ventana
  // (ej. dejó de reportar justo a las 17h -- 'faltan' 18h-23h, ninguna
  // dentro de la ventana), mejor mostrar la lista completa que un texto
  // vacío después de 'faltan'.
  return enVentana.length ? enVentana : faltan
}
function fuenteIconStyle(estado) {
  if (estado === 'ok') return { background: 'rgba(16,185,129,0.1)', color: '#10B981' }
  if (estado === 'na') return { background: '#f9f7ff', color: '#9b89b5' }
  if (estado === 'error') return { background: 'rgba(240,192,64,0.15)', color: '#A8590B' }
  return { background: 'rgba(214,68,85,0.08)', color: '#D64455' }
}
// Agrupa el estado tecnico de Quoia en dos categorias que no requieren
// conocer el detalle interno: OK/WARNING son parte del flujo automatico
// normal (se confia en el dato); cualquier ERROR/ERRORn es una falla real
// del envio automatico ese dia.
function categoriaEstadoReporte(estado) {
  if (!estado) return null
  if (estado === 'OK' || estado === 'WARNING') return 'ok'
  return 'error'
}
const fuentes = computed(() => {
  const d = detalle.value
  if (!d) return []
  const lista = []

  // energia_cgm_kwh nunca es null (el backend lo deja en 0 por defecto,
  // haya o no reporte real) -- la señal real de "hubo respuesta de Quoia"
  // es estado_reporte, no la energía.
  const catCgm = categoriaEstadoReporte(d.estado_reporte)
  lista.push({
    clave: 'cgm', nombre: 'Reporte CGM (Quoia)',
    estado: catCgm === 'ok' ? 'ok' : (catCgm === 'error' ? 'error' : 'no'),
    detalle: catCgm === 'ok' ? 'Automático' : (catCgm === 'error' ? 'Error' : 'Sin dato para hoy'),
    valor: d.estado_reporte ? d.energia_cgm_kwh : null,
    usado: d.medidor_usado === 'cgm',
  })

  const medPpal = sumaCurva(d.curva_medidor_principal)
  lista.push({
    clave: 'principal', nombre: 'Medidor principal',
    estado: medPpal !== null ? 'ok' : 'no',
    detalle: medPpal !== null ? 'Lectura disponible' : 'Sin lectura',
    valor: medPpal,
    usado: d.medidor_usado === 'principal',
  })

  const medResp = sumaCurva(d.curva_medidor_respaldo)
  lista.push({
    clave: 'respaldo', nombre: 'Medidor respaldo',
    estado: medResp !== null ? 'ok' : 'no',
    detalle: medResp !== null ? 'Lectura disponible' : 'Sin lectura',
    valor: medResp,
    usado: d.medidor_usado === 'respaldo',
  })

  if (d.tipo === 'generacion') {
    // energia_solenium_kwh tampoco es nunca null (mismo patron que CGM --
    // el backend lo deja en 0 por defecto si Solenium no respondio nada). La
    // señal confiable de "¿hubo alguna lectura real?" es la curva de
    // referencia (curva_solenium): si esta vacia, no hubo respuesta real,
    // sin importar lo que diga el total.
    const sinRegistro = !!d.nota_solenium
    const sumaSolenium = sumaCurva(d.curva_solenium)
    lista.push({
      clave: 'inversores', nombre: 'Inversores (Solenium)',
      estado: sinRegistro ? 'na' : (sumaSolenium !== null ? 'ok' : 'no'),
      detalle: sinRegistro
        ? d.nota_solenium
        : (sumaSolenium !== null
            ? (d.solenium_completo
                ? 'Dato completo'
                : `Dato incompleto -- faltan ${formatearRangosHoras(horasFaltantesSolares(d.curva_solenium))}`)
            : 'Solenium respondió sin dato para esta fecha'),
      // Se muestra la suma de la curva EN VIVO (misma fuente que el icono y
      // que la grafica de arriba), no energia_solenium_kwh -- ese es el total
      // que quedo guardado al momento de la clasificacion, y puede no
      // coincidir con lo que Solenium responde ahora mismo (ej. si esa vez
      // fallo la consulta y quedo en 0, aunque la curva de referencia si
      // tenga datos reales hoy).
      valor: sinRegistro ? null : sumaSolenium,
      usado: d.medidor_usado === 'inversores',
    })
  }

  return lista
})

const ETIQUETAS_FUENTE = {
  cgm: 'CGM', principal: 'Medidor principal', respaldo: 'Medidor respaldo',
  inversores: 'Inversores × FP', crudos: 'Datos crudos', crudos_parcial: 'Datos crudos (parcial)',
  reconectador: 'Reconectador', solenium_power: 'Solenium (power)', ninguno: 'Apagado',
  revisar: 'Sin fuente', relleno_horario: 'Relleno horario',
  externo: 'Reporta otra empresa', historico: 'Histórico propio',
  historico_vecino: 'Histórico (vecino de predio)',
  principal_sin_historico: 'Medidor principal', respaldo_sin_historico: 'Medidor respaldo',
  principal_sin_cgm: 'Medidor principal', respaldo_sin_cgm: 'Medidor respaldo',
  excluida: 'Excluida', excel_terceros: 'Excel de terceros', editado_manualmente: 'Editado manualmente',
}
function etiquetaFuente(v, d) {
  if (v === 'relleno_horario' && d) {
    // El label generico no decia CUAL de las tres fuentes de relleno se usó
    // de verdad -- ver MGS 0022 La Cumbia 2026-08-05, donde solo entró el
    // reconectador pero el texto sugería que podían ser las tres.
    const partes = []
    if ((d.horas_rellenadas_reconectador || []).length) partes.push('reconectador')
    if ((d.horas_rellenadas_solenium || []).length) partes.push('Solenium × FP')
    if ((d.horas_rellenadas_historico || []).length) partes.push('histórico')
    if (partes.length) return `Relleno horario (${partes.join(' + ')})`
  }
  return ETIQUETAS_FUENTE[v] || v || '—'
}
function fmtKwh(v) {
  if (v === null || v === undefined) return '—'
  return Number(v).toLocaleString('es-CO', { maximumFractionDigits: 1 }) + ' kWh'
}
</script>

<style scoped>
/* Tabla vertical estilo Excel (Hora | kWh) -- dos columnas de 12 horas cada
   una, lado a lado, para no obligar a un scroll larguísimo de 24 filas. */
.tabla-horas {
  border-collapse: collapse;
}
.tabla-horas th, .tabla-horas td {
  border: 1px solid #e8e0f0;
  padding: 0;
}
.tabla-horas th {
  background: #f9f7ff;
  color: #6b5a8a;
  font-size: 11px;
  font-weight: 700;
  font-family: ui-monospace, 'SF Mono', Consolas, monospace;
  padding: 6px 10px;
  text-align: left;
  white-space: nowrap;
}
.tabla-horas td:first-child {
  font-family: ui-monospace, 'SF Mono', Consolas, monospace;
  font-size: 12px;
  font-weight: 700;
  color: #2C2039;
  padding: 0 10px;
  white-space: nowrap;
  background: #f9f7ff;
}
.tabla-horas tr.fila-rellenada td:last-child { background: rgba(240, 192, 64, 0.14); }
:deep(.celda-input) {
  width: 110px;
  height: 32px;
  border: none !important;
  background: transparent !important;
}
:deep(.celda-input:focus) {
  outline: 2px solid #915BD8;
  outline-offset: -2px;
}
</style>
