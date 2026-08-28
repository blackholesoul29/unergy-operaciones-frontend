<template>
  <div class="space-y-4">
    <div class="flex gap-0 border-b" style="border-color: rgba(44,32,57,0.10);">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="activeTab = tab.key"
        class="px-4 py-2 text-sm font-medium transition-colors relative"
        :style="activeTab === tab.key
          ? 'color:#915BD8; border-bottom:2px solid #915BD8; margin-bottom:-1px'
          : 'color:#6b5a8a'"
      >
        {{ tab.label }}
      </button>
    </div>

    <AjustesXMView v-if="activeTab === 'ajustes'" />
    <ProyeccionesView v-else-if="activeTab === 'proyecciones'" />
    <ModeloPredictivoView v-else-if="activeTab === 'modelo'" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AjustesXMView from './AjustesXM/AjustesXMView.vue'
import ProyeccionesView from './Proyecciones/ProyeccionesView.vue'
import ModeloPredictivoView from './ModeloPredictivo/ModeloPredictivoView.vue'

const tabs = [
  { key: 'ajustes', label: 'Ajustes XM' },
  { key: 'proyecciones', label: 'Proyecciones' },
  { key: 'modelo', label: 'Modelo Predictivo' },
]
const activeTab = ref('ajustes')
</script>
