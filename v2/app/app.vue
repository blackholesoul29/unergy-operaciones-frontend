<script setup lang="ts">
import type { ToastMessageOptions } from 'primevue/toast'
import PrimeConfirmDialog from 'primevue/confirmdialog'
import PrimeToast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import { APP_BRANDING } from '~/config/app'

// MIGRACIÓN — Fase 1: el interceptor de axios del legacy (`~/core/client.js`)
// avisa de los 403 a través de `window.__primeToast`, porque no puede usar el
// composable de PrimeVue fuera de un componente. Se publica aquí, igual que hacía
// `legacy/src/App.vue`. Sale con el interceptor, en la fase 3.
const primeToast = useToast()
onMounted(() => {
  window.__primeToast = (opts: ToastMessageOptions) => primeToast.add(opts)
})

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

    <Toaster />

    <!-- MIGRACIÓN — Fase 1: montados a nivel global igual que en `legacy/src/App.vue`.
         Salen en la fase 3, cuando `useToast`/`useConfirm` pasen a vue-sonner y
         AlertDialog. -->
    <PrimeToast position="top-right" />
    <PrimeConfirmDialog />
  </div>
</template>
