<template>
  <div v-if="loading" class="flex items-center justify-center py-12">
    <i class="pi pi-spin pi-spinner text-3xl" style="color: #915BD8;" />
  </div>
  <div v-else-if="detalle" class="space-y-5">
    <div class="flex items-center justify-between flex-wrap gap-2">
      <div class="text-xs font-mono" style="color: #9b89b5;">
        {{ detalle.fecha }}
        <span v-if="detalle.estado_reporte"> · Estado reporte {{ detalle.estado_reporte }}</span>
      </div>
      <Tag v-if="detalle.revisar_manualmente" value="Revisar manualmente" severity="danger" />
      <Tag v-else value="OK" severity="success" />
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
      />
    </div>

    <!-- Metadata -->
    <div class="rounded-xl p-4" style="border: 1px solid #e8e0f0;">
      <p class="text-xs font-semibold uppercase mb-3" style="color: #6b5a8a;">Detalle de la clasificación</p>
      <dl class="grid grid-cols-2 gap-y-2 text-sm">
        <dt style="color: #9b89b5;">Caso</dt><dd class="font-mono">{{ detalle.caso }}</dd>
        <dt style="color: #9b89b5;">Medidor usado</dt><dd class="font-mono">{{ etiquetaFuente(detalle.medidor_usado) }}</dd>
        <dt style="color: #9b89b5;">Energía Total</dt><dd class="font-mono">{{ fmtKwh(detalle.energia_final_kwh) }}</dd>
        <template v-if="detalle.tipo === 'generacion'">
          <dt style="color: #9b89b5;">Factor de pérdida (FP)</dt>
          <dd class="font-mono">{{ detalle.fp != null ? detalle.fp.toFixed(4) : '—' }}</dd>
          <dt style="color: #9b89b5;">API Solenium</dt>
          <dd>{{ detalle.nota_solenium || 'Registrado' }}</dd>
        </template>
        <dt style="color: #9b89b5;">Horas rellenadas (histórico)</dt>
        <dd class="font-mono">{{ (detalle.horas_rellenadas_historico || []).join(', ') || '—' }}</dd>
      </dl>
    </div>

    <!-- Edición manual -->
    <div class="rounded-xl p-4" style="border: 1px solid #e8e0f0;">
      <div class="flex items-center justify-between mb-3">
        <p class="text-xs font-semibold uppercase" style="color: #6b5a8a;">Corrección manual (kWh)</p>
        <Button label="Validar y confiar" size="small" severity="success"
                :loading="validando" @click="validar" />
      </div>
      <div class="edit-grid">
        <div v-for="h in 24" :key="h">
          <label class="text-[10px] font-mono block" style="color: #9b89b5;">{{ h - 1 }}h</label>
          <InputNumber v-model="curvaEditable[h - 1]" :minFractionDigits="2" :maxFractionDigits="2"
                       inputClass="w-full text-xs text-right"
                       :class="esHoraRellenada(h - 1) ? 'campo-rellenado' : ''"
                       @paste="onPasteHora($event, h - 1)" />
        </div>
      </div>
      <p class="text-xs mt-3" style="color: #9b89b5;">
        Las horas resaltadas se completaron con reconectador, Solenium o histórico -- corrígelas solo si tienes
        un valor real más confiable. La corrección queda registrada con tu nombre.
      </p>
      <p class="text-xs mt-1" style="color: #9b89b5;">
        Tip: puedes pegar una columna o fila de 24 valores directamente en cualquier celda, se distribuye sola en
        las horas siguientes.
      </p>
      <div class="flex justify-end mt-2">
        <Button label="Guardar corrección" size="small" :loading="guardando" @click="guardarCurva" />
      </div>
    </div>

    <!-- Historial de ediciones (audit_log) -->
    <div class="rounded-xl p-4" style="border: 1px solid #e8e0f0;">
      <p class="text-xs font-semibold uppercase mb-3" style="color: #6b5a8a;">Historial de ediciones</p>
      <p v-if="!ediciones.length" class="text-xs" style="color: #9b89b5;">
        Sin ediciones manuales registradas para este día.
      </p>
      <div v-else class="space-y-3">
        <div v-for="(ed, i) in ediciones" :key="i" class="pt-3 first:pt-0" :class="i > 0 ? 'border-t' : ''" style="border-color: #e8e0f0;">
          <div class="flex items-baseline gap-2 flex-wrap">
            <span class="text-sm font-bold" style="color: #2C2039;">{{ ed.usuario_nombre || 'Usuario desconocido' }}</span>
            <span class="text-sm" style="color: #6b5a8a;">corrigió la curva</span>
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
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import api from '@/api/client'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
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
const validando = ref(false)
const ediciones = ref([])

async function cargarEdiciones() {
  try {
    const { data } = await api.get(`/reporte-energia/fronteras/${props.fronteraId}/ediciones`, { params: { fecha: props.fecha } })
    ediciones.value = data
  } catch (e) {
    ediciones.value = []
  }
}

function fmtFechaHora(iso) {
  return new Date(iso).toLocaleString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

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
  for (const [campo, valores] of Object.entries(cambios)) {
    if (campo === 'energia_final_kwh' || campo === 'curva_final') continue
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
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el detalle.', life: 4000 })
  } finally {
    loading.value = false
  }
}
onMounted(() => { cargar(); cargarEdiciones() })
watch(() => [props.fronteraId, props.fecha], () => { cargar(); cargarEdiciones() })

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

function esHoraRellenada(h) {
  const d = detalle.value
  if (!d) return false
  return (d.horas_rellenadas_reconectador || []).includes(h)
    || (d.horas_rellenadas_solenium || []).includes(h)
    || (d.horas_rellenadas_historico || []).includes(h)
}

async function guardarCurva() {
  guardando.value = true
  try {
    const { data } = await api.patch(
      `/reporte-energia/fronteras/${props.fronteraId}`,
      { curva_final: curvaEditable.value },
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

const ETIQUETAS_FUENTE = {
  cgm: 'CGM', principal: 'Medidor principal', respaldo: 'Medidor respaldo',
  inversores: 'Inversores × FP', crudos: 'Datos crudos', crudos_parcial: 'Datos crudos (parcial)',
  reconectador: 'Reconectador', solenium_power: 'Solenium (power)', ninguno: 'Apagado',
  revisar: 'Sin fuente', externo: 'Reporta otra empresa', historico: 'Histórico propio',
  historico_vecino: 'Histórico (vecino de predio)',
}
function etiquetaFuente(v) {
  return ETIQUETAS_FUENTE[v] || v || '—'
}
function fmtKwh(v) {
  if (v === null || v === undefined) return '—'
  return Number(v).toLocaleString('es-CO', { maximumFractionDigits: 1 }) + ' kWh'
}
</script>

<style scoped>
/* auto-fill con un mínimo de 76px en vez de un número fijo de columnas --
   así la celda nunca queda más angosta de lo que necesita un número de
   miles con decimales (ej. "1.234,56"), sea cual sea el ancho disponible. */
.edit-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(76px, 1fr));
  gap: 8px;
}
:deep(.campo-rellenado input) {
  border-color: #F0C040 !important;
  background: rgba(240, 192, 64, 0.08);
}
</style>
