<script setup lang="ts">
import PrimeConfirmDialog from 'primevue/confirmdialog'
import { APP_BRANDING } from '~/config/app'
import { TriangleAlertIcon } from '@lucide/vue'

// Fallback title/description: a page with its own `useHead` overrides this.
useHead({
  title: APP_BRANDING.seo.title,
  link: [{ rel: 'icon', href: APP_BRANDING.favicon }],
  meta: [
    { name: 'description', content: APP_BRANDING.seo.description },
    { property: 'og:title', content: APP_BRANDING.seo.title },
    { property: 'og:description', content: APP_BRANDING.seo.description },
  ],
})
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />

    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:ring-2 focus:ring-ring"
    >
      Skip to main content
    </a>

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <!-- `position` y `rich-colors` reproducen el Toast de PrimeVue que había aquí:
         arriba a la derecha y con color por severidad. -->
    <Toaster position="top-right" rich-colors close-button />

    <!-- MIGRACIÓN — Fase 1: montado a nivel global igual que en `legacy/src/App.vue`.
         Sale en la fase 3, cuando `useConfirm` pase a AlertDialog. -->
    <PrimeConfirmDialog>
      <template #icon><TriangleAlertIcon class="size-8 shrink-0" /></template>
    </PrimeConfirmDialog>
  </div>
</template>
