<template>
  <div
    v-if="totales"
    class="grid gap-4"
    style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))"
  >
    <div class="rounded-xl p-4" style="background: rgba(145, 91, 216, 0.06)">
      <p class="mb-1 text-xs" style="color: #6b5a8a">Suma de P90 semanales</p>
      <p class="text-2xl font-bold" style="color: #2c2039">{{ fmtCOP(totales.suma_p90) }}</p>
      <p class="mt-1 text-[11px]" style="color: #8a7aa5">Reservando semana a semana</p>
    </div>

    <div class="rounded-xl p-4" style="background: rgba(145, 91, 216, 0.06)">
      <p class="mb-1 text-xs" style="color: #6b5a8a">P90 del horizonte</p>
      <p class="text-2xl font-bold" style="color: #2c2039">{{ fmtCOP(totales.p90_total) }}</p>
      <p class="mt-1 text-[11px]" style="color: #8a7aa5">Con un pozo común</p>
    </div>

    <div class="rounded-xl p-4" style="background: rgba(5, 150, 105, 0.08)">
      <p class="mb-1 text-xs" style="color: #6b5a8a">Libera juntar el pozo</p>
      <p class="text-2xl font-bold" :style="`color:${totales.brecha > 0 ? '#059669' : '#6b5a8a'}`">
        {{ fmtCOP(totales.brecha) }}
      </p>
      <p class="mt-1 text-[11px]" style="color: #8a7aa5">
        {{
          totales.brecha > 0
            ? 'Diferencia entre las dos políticas'
            : 'Las semanas están muy correlacionadas: juntar el pozo no libera capital'
        }}
      </p>
    </div>

    <div class="rounded-xl p-4" style="background: #fafafa">
      <p class="mb-1 text-xs" style="color: #6b5a8a">Escenario central</p>
      <p class="text-2xl font-bold" style="color: #6b5a8a">{{ fmtCOP(totales.central) }}</p>
      <p class="mt-1 text-[11px]" style="color: #8a7aa5">Sin colchón</p>
    </div>
  </div>
</template>

<script setup>
import { fmtCOP } from '@/views/Garantias/AjustesXM/utils/formatters'

defineProps({
  totales: { type: Object, default: null },
})
</script>
