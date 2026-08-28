/**
 * MIGRACIÓN — Fase 1. El arranque que hacía `legacy/src/main.js`, traducido a un
 * plugin de Nuxt: el tema de PrimeVue y la directiva `tooltip`.
 *
 * `InfoField` y `PageHeader` ya no se registran aquí: viven en
 * `components/blocks/`, que Nuxt auto-importa. El registro global era lo que
 * hacía `main.js` porque en una SPA de Vite no había auto-import.
 *
 * `ToastService` ya no está: los avisos pasaron a vue-sonner en la fase 3, ola 0.
 * `ConfirmationService` tampoco: las confirmaciones pasaron a `useConfirm()` +
 * `AlertDialog` de shadcn, misma ola.
 *
 * Todo lo de aquí es temporal. PrimeVue sale en la fase 3, a medida que cada
 * slice pasa a Gandalf/shadcn; cuando no quede ningún import de `primevue`, este
 * archivo se borra entero.
 *
 * Lo que NO se trasladó, porque Nuxt ya lo resuelve:
 *   - `createPinia()` — lo instala `@pinia/nuxt`.
 *   - `router` — lo genera Nuxt desde `app/pages/`.
 *   - el manejo de `vite:preloadError` y el fallback de `router.onError`, que
 *     recargaban la pestaña tras un deploy de Vercel. Nuxt trae `app:chunkError`
 *     para lo mismo; se cablea aparte, no aquí.
 */
import { definePreset } from '@primevue/themes'
import Aura from '@primevue/themes/aura'
import PrimeVue from 'primevue/config'
import Tooltip from 'primevue/tooltip'

/** Mapea el `primary` de PrimeVue al morado de marca. Copiado de `main.js`. */
const UnergPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{violet.50}',
      100: '{violet.100}',
      200: '{violet.200}',
      300: '{violet.300}',
      400: '{violet.400}',
      500: '#915BD8',
      600: '#7c4ec0',
      700: '#6a3faa',
      800: '#593393',
      900: '#4a2878',
      950: '#31175a',
    },
  },
})

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(PrimeVue, {
    theme: {
      preset: UnergPreset,
      options: { darkModeSelector: '.dark', cssLayer: false },
    },
  })
  nuxtApp.vueApp.directive('tooltip', Tooltip)
})
