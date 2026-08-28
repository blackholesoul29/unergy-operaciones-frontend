<!--
  Tablero kanban de OFERTAS (la oferta es la unidad del negocio, no el cliente).

  Dos decisiones que cambian el comportamiento viejo:
  1. Soltar en "Firmado" abre el diálogo de firmar en vez de mover la tarjeta
     suelta. Mover a firmado sin crear el contrato dejaba `ppa_contrato_id` en
     NULL: un contrato fantasma que Cumplimiento y Liquidaciones nunca ven.
  2. No hay tope de tarjetas. Antes la columna cortaba en 20 con un "+N más —
     ver en tabla" que te expulsaba de la vista; ahora la columna scrollea.
-->
<template>
  <div class="flex items-start gap-3 overflow-x-auto pb-2">
    <div
      v-for="col in COLUMNAS"
      :key="col.value"
      class="tablero-col flex flex-shrink-0 flex-col rounded-lg"
      :class="colapsada(col) ? 'w-14' : 'w-[85vw] sm:w-[16.5rem]'"
      style="background: #faf8fc; border: 1px solid #e8e0f0"
      @dragover.prevent="arrastreSobre = col.value"
      @dragleave="arrastreSobre === col.value && (arrastreSobre = null)"
      @drop="soltar(col)"
    >
      <!-- Columna colapsada: solo el conteo, en vertical -->
      <button
        v-if="colapsada(col)"
        class="flex h-40 w-full flex-col items-center justify-center gap-2"
        @click="cerradasAbierta = true"
      >
        <span class="text-xs font-semibold" style="color: #7a6e8a; writing-mode: vertical-rl">
          {{ col.label }}
        </span>
        <span class="text-xs font-semibold" style="color: #9b89b5">{{ resumen(col).n }}</span>
      </button>

      <template v-else>
        <div
          class="flex items-center justify-between gap-1 border-b px-3 py-2"
          style="border-color: #e8e0f0"
          :class="arrastreSobre === col.value ? 'bg-purple-50' : ''"
        >
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <span
                class="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                :style="{ background: colorEtapa(col.estados[0]) }"
              />
              <span
                class="truncate text-[11px] font-semibold tracking-wide uppercase"
                style="color: #2c2039"
                >{{ col.label }}</span
              >
              <span class="text-[11px]" style="color: #9b89b5">{{ resumen(col).n }}</span>
            </div>
            <div class="mt-0.5 flex items-center gap-2 text-[11px]" style="color: #9b89b5">
              <span v-if="resumen(col).energiaMwhMes">{{
                fmtMwh(resumen(col).energiaMwhMes)
              }}</span>
              <span v-if="resumen(col).alertas" style="color: #d64455"
                >⚠ {{ resumen(col).alertas }}</span
              >
            </div>
          </div>
          <Button
            v-if="col.value === 'cerradas'"
            icon="pi pi-times"
            text
            rounded
            size="small"
            v-tooltip.left="'Colapsar'"
            @click="cerradasAbierta = false"
          />
        </div>

        <div class="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
          <article
            v-for="of in porColumna[col.value]"
            :key="of.id"
            draggable="true"
            class="cursor-pointer rounded-md border bg-white p-2.5 transition-shadow hover:shadow-md"
            :class="of.id === ofertaAbiertaId ? 'ring-2 ring-unergy-purple' : ''"
            :style="{
              borderColor: of.alerta ? 'rgba(214,68,85,0.35)' : '#e8e0f0',
              opacity: arrastrando === of.id ? 0.45 : 1,
            }"
            @dragstart="arrastrando = of.id"
            @dragend="arrastrando = null"
            @click="$emit('abrir', of)"
          >
            <div class="flex items-start justify-between gap-1.5">
              <span class="truncate font-mono text-[10px]" style="color: #9b89b5">
                {{ of.codigo_seguimiento || of.numero_oferta || '—' }}
              </span>
              <Tag
                v-if="of.alerta"
                severity="danger"
                :value="`${of.dias_sin_respuesta}d`"
                class="flex-shrink-0 scale-90"
                v-tooltip.left="`${of.dias_sin_respuesta} días sin movimiento en esta etapa`"
              />
            </div>

            <h3 class="mt-1 text-sm leading-snug font-medium" style="color: #2c2039">
              {{ of.planta_nombre || of.ficha?.proyecto_nombre || 'Sin planta' }}
            </h3>
            <p class="truncate text-xs" style="color: #7a6e8a">{{ of.cliente_razon_social }}</p>

            <div class="mt-2 flex flex-wrap items-center gap-1.5">
              <span
                class="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                :class="claseSegmento(of.tipo)"
                v-tooltip.top="labelTipo(of.tipo)"
              >
                {{ segmentoTipo(of.tipo) }}
              </span>
              <span
                v-if="mwhMes(of)"
                class="rounded px-1.5 py-0.5 text-[10px]"
                style="background: #f4eefb; color: #6e3fb8"
                >{{ fmtMwh(mwhMes(of)) }}</span
              >
              <span
                v-if="of.ppa_contrato_id"
                class="rounded px-1.5 py-0.5 text-[10px]"
                style="background: #e6f7f5; color: #0f766e"
                v-tooltip.top="'Tiene contrato PPA'"
                >PPA</span
              >
              <span
                v-if="of.plantas?.length > 1"
                class="rounded px-1.5 py-0.5 text-[10px]"
                style="background: #f3f4f6; color: #4b5563"
                v-tooltip.top="of.plantas.map((p) => p.nombre_comercial).join(' · ')"
              >
                {{ of.plantas.length }} plantas
              </span>
            </div>

            <div
              v-if="sinRespuesta(of) || of.seguimientos"
              class="mt-1.5 flex items-center gap-2 text-[10px]"
            >
              <span
                v-if="of.seguimientos"
                :class="alarmante(of) ? 'font-semibold' : ''"
                :style="{ color: alarmante(of) ? '#D64455' : '#9b89b5' }"
                v-tooltip.top="'Toques enviados al cliente'"
              >
                <i class="pi pi-send" style="font-size: 9px" /> {{ of.seguimientos }}
              </span>
              <span v-if="sinRespuesta(of)" style="color: #d64455">sin respuesta</span>
            </div>
          </article>

          <p
            v-if="!porColumna[col.value].length"
            class="py-6 text-center text-xs"
            style="color: #c4b8d4"
          >
            {{ arrastreSobre === col.value ? 'Soltar acá' : 'Vacío' }}
          </p>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import {
  COLUMNAS,
  colorEtapa,
  labelTipo,
  segmentoTipo,
  mwhMes,
  fmtMwh,
  sinRespuesta,
  alarmante,
  resumenColumna,
} from './comercial.js'

const props = defineProps({
  porColumna: { type: Object, required: true },
  ofertaAbiertaId: { type: [Number, String], default: null },
})
const emit = defineEmits(['abrir', 'mover', 'firmar', 'declinar'])

const arrastrando = ref(null)
const arrastreSobre = ref(null)
// Cerradas arranca colapsada: casi siempre está vacía y ocupaba una columna
// entera del ancho útil.
const cerradasAbierta = ref(false)

function colapsada(col) {
  return col.value === 'cerradas' && !cerradasAbierta.value
}

function resumen(col) {
  return resumenColumna(props.porColumna[col.value])
}

function claseSegmento(tipo) {
  return (
    {
      servicios_operacionales: 'bg-blue-50 text-blue-700',
      compra_energia: 'bg-amber-50 text-amber-700',
      comunidad_energetica: 'bg-emerald-50 text-emerald-700',
    }[tipo] ?? 'bg-gray-100 text-gray-600'
  )
}

function soltar(col) {
  const id = arrastrando.value
  arrastrando.value = null
  arrastreSobre.value = null
  if (!id) return
  const oferta = Object.values(props.porColumna)
    .flat()
    .find((o) => o.id === id)
  if (!oferta) return

  // Cerradas agrupa terminado + declinado, pero soltar ahí significa DECLINADO:
  // `terminado` lo pone el job diario cuando pasa la fecha_fin del PPA.
  const destino = col.alSoltar || col.value
  if (oferta.estado === destino) return

  // Firmar crea el contrato: no es un simple cambio de etapa.
  if (destino === 'firmado') return emit('firmar', oferta)
  if (destino === 'declinado') return emit('declinar', oferta)
  emit('mover', oferta, destino)
}
</script>

<style scoped>
/* La altura de la columna se mide contra el chrome que tiene encima, y ese
   chrome no mide lo mismo en las dos puntas: en escritorio son el header, la
   banda de indicadores y UNA fila de filtros; en pantalla chica todo eso va
   apilado. Con el valor de escritorio fijo (20rem), en celular la columna
   quedaba como una ventanita con scroll dentro de una página que también
   scrollea — dos barras compitiendo por el mismo gesto.
   `dvh` en vez de `vh` para que la barra de direcciones del navegador móvil,
   que aparece y desaparece, no deje la columna cortada. */
.tablero-col {
  max-height: calc(100vh - 14rem);
  max-height: calc(100dvh - 14rem);
}
@media (min-width: 1024px) {
  .tablero-col {
    max-height: calc(100vh - 20rem);
  }
}
</style>
