<template>
  <div class="flex flex-col gap-0.5">
    <span class="text-xs font-medium" style="color: #9b89b5;">{{ label }}</span>
    <span class="text-sm" style="color: var(--color-unergy-deep);">{{ value ?? '—' }}</span>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], default: null },
})
</script>
