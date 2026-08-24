<script setup>
/**
 * MIGRACIÓN — Fase 1. Página puente: la ruta la sirve Nuxt, la vista sigue
 * siendo la del legacy sin tocar. Generada desde `app/router/index.js`.
 *
 * Desaparece cuando su página real se escriba en la fase 3.
 */
import View from '~/features/mobile/components/MobileTecnicoFallasView.vue'

definePageMeta({ layout: 'legacy-blank', mobile: true, roles: ['tecnico'] })
</script>

<template>
  <View />
</template>
