<script setup>
/**
 * MIGRACIÓN — Fase 1. Página puente: la ruta la sirve Nuxt, la vista sigue
 * siendo la del legacy sin tocar. Generada desde `app/router/index.js`.
 *
 * Desaparece cuando su página real se escriba en la fase 3.
 */
import View from '~/views/Finanzas/CostosComercializacionView.vue'

definePageMeta({ layout: 'legacy', roles: ['admin', 'liquidaciones'] })
</script>

<template>
  <View />
</template>
