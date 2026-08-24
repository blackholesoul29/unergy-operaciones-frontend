<script setup>
/**
 * MIGRACIÓN — Fase 1. La raíz redirige al dashboard, igual que en el legacy.
 *
 * Aquí vivía la página de demostración del template (KPIs de ejemplo + el patrón
 * `AsyncView`). Las piezas que enseñaba —`AsyncView`, `EmptyState`, `useQuery`—
 * siguen todas en su sitio; lo que se fue son sus 80 líneas de datos falsos. El
 * dashboard real es `~/views/DashboardView.vue`.
 */
definePageMeta({ redirect: '/dashboard' })
</script>

<template>
  <div />
</template>
