<template>
  <div class="space-y-4">
    <div>
      <h2 class="text-xl font-bold text-gray-800">{{ title }}</h2>
      <p class="text-xs text-gray-400 mt-0.5">Módulo MEM</p>
    </div>
    <div class="flex flex-col items-center py-24 gap-3 text-gray-300">
      <i :class="[icon, 'text-5xl']" style="color: #915BD8; opacity: 0.4;" />
      <p class="text-sm font-medium text-gray-500">{{ title }}</p>
      <p class="text-xs text-gray-400">Módulo en desarrollo</p>
    </div>
  </div>
</template>

<script setup>
defineProps({ title: String, icon: String })
</script>
