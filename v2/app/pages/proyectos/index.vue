<script setup>
/**
 * MIGRACIÓN — Fase 1. Página puente: la ruta la sirve Nuxt, la vista sigue siendo
 * la del legacy sin tocar. Se genera una de estas por cada una de las 67 rutas con
 * vista del inventario (`contexto/inventario-rutas.md`).
 *
 * Cada archivo desaparece cuando su página real se escribe en la fase 3.
 */
import ProyectosListView from '~/views/Proyectos/ProyectosListView.vue'

definePageMeta({ layout: 'legacy' })
</script>

<template>
  <ProyectosListView />
</template>
