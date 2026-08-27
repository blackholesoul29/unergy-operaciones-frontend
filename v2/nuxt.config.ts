import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxt/eslint', 'shadcn-nuxt', '@vueuse/nuxt', '@nuxtjs/color-mode'],

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
    // vue-sonner publica su CSS aparte y `components/ui/sonner/Sonner.vue` no lo
    // importa: sin esta línea los avisos salen sin estilo.
    'vue-sonner/style.css',
    // MIGRACIÓN — Fase 1: estilos del legacy. Salen en la fase 3.
    '~/assets/main.css',
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
    /**
     * MIGRACIÓN — Fase 1. A dónde reenvía Nitro lo que el navegador pide en el
     * mismo origen. Sustituye al `server.proxy` de `vite.config.js` del legacy y
     * a los `rewrites` de `vercel.json`.
     *
     * Son claves server-only a propósito: no aparecen bajo `public`, así que no
     * viajan al bundle del cliente.
     */
    apiProxyTarget: 'http://localhost:8000',
    /**
     * La API de EVO puede vivir en otro host, y su token **no puede tocar el
     * navegador**: lo inyecta la ruta de Nitro. En el legacy esa garantía la daba
     * el proxy de Vite; aquí la da `server/routes/api/v1/evo/[...path].ts`.
     */
    evoApiUrl: 'http://localhost:18800',
    evoApiToken: '',

    // Server-only: the auth API may live on its own host, and the browser never
    // calls it — everything goes through `server/api/auth/*`. Empty falls back
    // to the data API.
    authApiBaseUrl: '',
    authCookieDomain: '',
    authCookieSecure: true,
    authCookieSameSite: 'lax',
    authCookieMaxAge: 60 * 60 * 24 * 7,
    /**
     * Gates the cookie-session half of `server/middleware/auth.ts` — separate
     * from `public.authEnabled`, which gates the page guard and is on. This
     * stays `false` until the real backend exposes `/auth/me`: with no cookie
     * ever set (the session today is JWT/`localStorage`, see
     * `~/composables/useAuth.ts`), resolving one on every request would 401
     * every proxied `/api/v1/*` call and redirect every page on first load.
     */
    authSessionCookiesEnabled: false,

    public: {
      apiBaseUrl: '',
      /**
       * Fase 3, ola 1: el guard del template (`auth.global.ts`) gobierna la
       * sesión, con `AUTH_ROUTE_PERMISSIONS` declarando las páginas de la
       * plataforma. La sesión en sí sigue viajando por JWT/`localStorage`
       * (`~/composables/useAuth.ts`), no por las cookies httpOnly que trae
       * montadas el template: el backend real no expone `/auth/me`.
       *
       * Como valor por defecto y no solo en `.env`: un `.env` no viaja al build
       * de producción, así que el default es el que de verdad gobierna un
       * despliegue sin variables de entorno propias.
       */
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
