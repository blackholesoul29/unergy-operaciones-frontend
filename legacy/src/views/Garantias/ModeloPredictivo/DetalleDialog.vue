<template>
  <Dialog
    :visible="abierto"
    modal
    header="Detalle del vencimiento"
    :style="{ width: '46rem' }"
    @update:visible="
      (v) => {
        if (!v) emit('cerrar')
      }
    "
  >
    <div v-if="cargando" class="text-sm" style="color: #6b5a8a">Cargando…</div>

    <div v-else-if="detalle" class="space-y-5">
      <div>
        <p class="mb-2 text-xs font-semibold tracking-wide uppercase" style="color: #6b5a8a">
          Cadena de cálculo
        </p>
        <table class="w-full text-xs">
          <thead>
            <tr class="border-b">
              <th class="px-2 py-1.5 text-left font-semibold" style="color: #6b5a8a">Concepto</th>
              <th class="px-2 py-1.5 text-right font-semibold" style="color: #6b5a8a">Central</th>
              <th class="px-2 py-1.5 text-right font-semibold" style="color: #6b5a8a">P90</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(f, i) in detalle.cadena" :key="i" class="border-b last:border-b-0">
              <td class="px-2 py-1.5" style="color: #2c2039">
                {{ f.concepto }}
                <span
                  v-if="f.origen"
                  class="ml-1 rounded px-1.5 py-0.5 text-[10px]"
                  style="background: rgba(145, 91, 216, 0.1); color: #915bd8"
                  >{{ f.origen }}</span
                >
              </td>
              <td class="px-2 py-1.5 text-right tabular-nums" style="color: #6b5a8a">
                {{ fmtCOP(f.central) }}
              </td>
              <td class="px-2 py-1.5 text-right tabular-nums" style="color: #2c2039">
                {{ fmtCOP(f.p90) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <p class="mb-2 text-xs font-semibold tracking-wide uppercase" style="color: #6b5a8a">
          De dónde viene el ancho
        </p>
        <div class="mb-2 flex h-2.5 overflow-hidden rounded-full">
          <div
            v-for="d in detalle.descomposicion_ancho"
            :key="d.fuente"
            :style="`width:${(d.pct * 100).toFixed(1)}%;background:${fuenteAncho(d.fuente).color}`"
          />
        </div>
        <div class="flex flex-wrap gap-4 text-[11px]" style="color: #6b5a8a">
          <span
            v-for="d in detalle.descomposicion_ancho"
            :key="d.fuente"
            class="inline-flex items-center gap-1.5"
          >
            <i
              class="inline-block h-2 w-2 rounded-sm"
              :style="`background:${fuenteAncho(d.fuente).color}`"
            />
            {{ fuenteAncho(d.fuente).label }} {{ Math.round(d.pct * 100) }}%
          </span>
        </div>
      </div>

      <div>
        <p class="mb-2 text-xs font-semibold tracking-wide uppercase" style="color: #6b5a8a">
          Insumos usados
        </p>
        <table class="w-full text-xs">
          <tbody>
            <tr v-for="ins in detalle.insumos" :key="ins.tipo" class="border-b last:border-b-0">
              <td class="px-2 py-1.5" style="color: #2c2039">{{ ins.tipo }}</td>
              <td class="px-2 py-1.5">
                <span
                  class="rounded-full px-2 py-0.5 text-[10px] font-bold"
                  :style="
                    insumoContaminado(ins)
                      ? 'background:#FEF3C7;color:#92400E'
                      : 'background:#ECFDF5;color:#059669'
                  "
                  :title="
                    insumoContaminado(ins)
                      ? 'Versión distinta de tx2: el dato no existía en la fecha de cálculo'
                      : 'Versión tx2, sin leakage'
                  "
                >
                  {{ ins.version }}
                </span>
              </td>
              <td class="px-2 py-1.5" style="color: #6b5a8a">{{ ins.rango }}</td>
              <td class="px-2 py-1.5 text-right" style="color: #6b5a8a">{{ ins.dias }} días</td>
            </tr>
          </tbody>
        </table>
        <p v-if="hayContaminado" class="mt-2 text-[11px]" style="color: #92400e">
          Hay insumos en una versión distinta de tx2. Ese dato no existía en la fecha de cálculo,
          así que este número está contaminado y no debe leerse como definitivo.
        </p>
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import { computed } from 'vue'
import Dialog from 'primevue/dialog'
import { fmtCOP } from '@/views/Garantias/AjustesXM/utils/formatters'
import { fuenteAncho, insumoContaminado } from './utils/modeloPredictivo'

const props = defineProps({
  abierto: { type: Boolean, default: false },
  detalle: { type: Object, default: null },
  cargando: { type: Boolean, default: false },
})
const emit = defineEmits(['cerrar'])

const hayContaminado = computed(() => (props.detalle?.insumos ?? []).some(insumoContaminado))
</script>
