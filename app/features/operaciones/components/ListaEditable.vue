<template>
  <div class="le-wrap">
    <span v-if="label" class="le-label">{{ label }}</span>
    <div v-for="(item, i) in modelValue" :key="i" class="le-row">
      <input :value="item" @input="setItem(i, $event.target.value)" :placeholder="placeholder" />
      <button class="le-del" @click="quitar(i)" title="Quitar"><XIcon class="size-[1em]" /></button>
    </div>
    <button class="le-add" @click="agregar"><PlusIcon class="size-[1em]" /> Agregar</button>
  </div>
</template>

<script setup>
import { PlusIcon, XIcon } from '@lucide/vue'
const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

function setItem(i, val) {
  const nueva = [...props.modelValue]
  nueva[i] = val
  emit('update:modelValue', nueva)
}
function agregar() { emit('update:modelValue', [...props.modelValue, '']) }
function quitar(i) { emit('update:modelValue', props.modelValue.filter((_, idx) => idx !== i)) }
</script>

<style scoped>
.le-wrap { display: flex; flex-direction: column; gap: 6px; }
.le-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .4px; color: #9b8db5; }
.le-row { display: flex; align-items: center; gap: 6px; }
.le-row input { flex: 1; padding: 8px 11px; border: 1.5px solid #e8e0f0; border-radius: 8px; font-size: 13px; color: var(--color-unergy-deep); outline: none; }
.le-row input:focus { border-color: var(--color-unergy-purple); }
.le-del { border: none; background: #fef2f2; color: #b91c1c; border-radius: 7px; width: 28px; height: 28px; flex-shrink: 0; cursor: pointer; }
.le-add { align-self: flex-start; display: flex; align-items: center; gap: 6px; border: 1.5px dashed #cbb8e8; background: #faf8fd; color: var(--color-unergy-purple-dark); font-size: 12.5px; font-weight: 700; padding: 7px 12px; border-radius: 9px; cursor: pointer; }
</style>
