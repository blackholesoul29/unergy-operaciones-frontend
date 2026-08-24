<script setup>
/**
 * MIGRACIÓN — Fase 1. Las páginas que el legacy renderizaba a pantalla completa,
 * sin el chrome de la plataforma: login, recuperación de contraseña y toda la app
 * móvil (`/m/*`). En `App.vue` esto era la primera rama del `v-if`; en Nuxt es un
 * layout, que es donde corresponde.
 */
</script>

<template>
  <div class="h-screen">
    <slot />
  </div>
</template>
