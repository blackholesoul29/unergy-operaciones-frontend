import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxt/eslint', 'shadcn-nuxt', '@vueuse/nuxt', '@pinia/nuxt', '@nuxtjs/color-mode'],

  /**
   * MIGRACIÓN — Fase 1. La aplicación que se está trasladando es una SPA de Vite
   * y se mantiene así durante las fases 1 y 2: hay ~70 archivos que tocan
   * `window`, `document` o `localStorage` en el cuerpo del módulo, y encenderlos
   * bajo SSR convertiría un traslado en 70 fallos simultáneos.
   *
   * Nuxt sigue aportando lo que se buscaba — routing por archivos, auto-imports,
   * Nitro y el ecosistema — aunque el render sea de cliente. En la fase 3 se
   * evalúa SSR página por página. Ver `contexto/03-roadmap.md`.
   */
  ssr: false,

  /**
   * MIGRACIÓN — Fase 1, temporal.
   * `app/legacy/views/Servicios/OperacionView.vue` define 8 componentes con
   * `template:` como string en vez de un `<template>` de SFC. El build por
   * defecto de Vue es runtime-only y no puede compilarlos: renderizarían vacío,
   * sin error, solo un warning en consola. El legacy resolvía esto con un alias
   * a `vue/dist/vue.esm-bundler.js` en `vite.config.js`.
   *
   * Se retira cuando ese archivo se refactorice a SFC (fase 3, ola 2).
   */
  vue: { runtimeCompiler: true },

  css: [
    '~/assets/css/tailwind.css',
    // MIGRACIÓN — Fase 1: estilos del legacy. Salen en la fase 3.
    'primeicons/primeicons.css',
    '~/legacy/assets/main.css',
  ],

  // Nuxt prefixes a component's name with its folder path by default
  // (components/layout/AppSidebar.vue -> <LayoutAppSidebar>). The pyramid is
  // already legible from the folder, so the prefix is turned off and components
  // are used under their own name. `ui/` is handled by shadcn-nuxt.
  //
  // Feature components (`app/features/<slice>/components/`) are deliberately not
  // auto-imported: they belong to one slice, and importing them by path is what
  // keeps that visible at the call site.
  // Gandalf va primero: si un día un `G*` de kit y uno de base comparten nombre,
  // gana el más compuesto, que es el que quieres usar.
  components: [
    { path: '~/components/gandalf/kit', pathPrefix: false },
    { path: '~/components/gandalf/base', pathPrefix: false },
    { path: '~/components/blocks', pathPrefix: false },
    { path: '~/components/layout', pathPrefix: false },
  ],

  // Class-free dark mode toggling: the class goes on <html> with no suffix, so
  // Tailwind's `dark:` variant works and there is no flash before hydration.
  colorMode: {
    classSuffix: '',
  },

  /**
   * The environment-driven half of the configuration. The other half — branding,
   * the login path — is in `app/config/app.ts`, because it changes once per
   * project rather than once per deploy.
   *
   * Every key here is overridable by an env var: `NUXT_PUBLIC_API_BASE_URL`,
   * `NUXT_AUTH_COOKIE_SECURE`, and so on. See `.env.example`.
   */
  runtimeConfig: {
    // Server-only: the auth API may live on its own host, and the browser never
    // calls it — everything goes through `server/api/auth/*`. Empty falls back
    // to the data API.
    authApiBaseUrl: '',
    authCookieDomain: '',
    authCookieSecure: true,
    authCookieSameSite: 'lax',
    authCookieMaxAge: 60 * 60 * 24 * 7,

    public: {
      apiBaseUrl: '',
      authEnabled: true,
      authPasswordEnabled: true,
      authGoogleEnabled: false,
      googleClientId: '',
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },

  shadcn: {
    prefix: '',
    componentDir: '@/components/ui',
  },
})
