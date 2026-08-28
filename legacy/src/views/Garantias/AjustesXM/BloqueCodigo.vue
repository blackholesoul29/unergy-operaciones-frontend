<template>
  <div class="overflow-hidden rounded-xl bg-white shadow-sm" style="border: 1px solid #e8e0f0">
    <div class="flex items-center gap-2 px-4 py-2" :style="headerStyle">
      <span class="text-xs font-bold tracking-widest uppercase">{{ titulo }}</span>
    </div>
    <table class="w-full text-sm">
      <tbody>
        <tr
          v-for="(row, idx) in rows"
          :key="idx"
          class="border-t"
          :style="row.label === 'TIE' ? 'background:#f3f0f7' : 'background:white'"
        >
          <td class="px-4 py-1.5 text-xs" style="color: #6b5a8a; width: 60%">
            <span v-if="row.label === 'TIE'" class="font-semibold" style="color: #915bd8">TIE</span>
            <span v-else>{{ row.label }}</span>
          </td>
          <td
            class="px-4 py-1.5 text-right text-xs font-medium tabular-nums"
            style="color: #2c2039"
          >
            {{ fmtCOP(row.valor) }}
          </td>
        </tr>
      </tbody>
    </table>
    <div
      v-if="total != null"
      class="flex items-center justify-between border-t px-4 py-2"
      style="background: #f9f7fd"
    >
      <span class="text-xs font-semibold tracking-wide uppercase" style="color: #6b5a8a"
        >Total</span
      >
      <span class="text-sm font-bold" style="color: #915bd8">{{ fmtCOP(total) }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { fmtCOP } from './utils/formatters.js'

const props = defineProps({
  titulo: { type: String, required: true },
  rows: { type: Array, default: () => [] },
  total: { type: Number, default: null },
})

const headerStyle = computed(() => {
  const map = {
    UNGC: 'background:#f3f0f7; color:#915BD8',
    UNGG: 'background:#dbeafe; color:#1d4ed8',
  }
  return map[props.titulo] || 'background:#f3f4f6; color:#374151'
})
</script>
