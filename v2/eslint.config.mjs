// @ts-check
import prettier from 'eslint-config-prettier'
import withNuxt from './.nuxt/eslint.config.mjs'

/**
 * MIGRACIÓN — Fase 1/2. El código del legacy vive ya en su sitio dentro de `app/`,
 * pero todavía no cumple las reglas del template: son ~95.000 líneas y 4.100
 * avisos, de los cuales 3.820 son formato puro. Pasarles `--fix` en la fase 1
 * produciría un diff cosmético enorme sobre 177 componentes y enterraría
 * cualquier cambio real — que es exactamente lo que la fase 1 no puede permitirse.
 *
 * Así que se quedan fuera del lint hasta que la fase 3 los toque de verdad.
 *
 * El patrón está elegido para que la lista **se vacíe sola**: el legacy es
 * JavaScript y el template es TypeScript, así que `app/utils/*.js` y
 * `app/composables/*.js` separan los dos limpiamente. En cuanto un archivo pasa a
 * `.ts` (paso 4 de la receta de la fase 3) deja de estar ignorado y el linter
 * empieza a exigirle. La lista encogiendo *es* la métrica de avance.
 */
const LEGACY_PENDIENTE_DE_MIGRAR = [
  // Carpetas que son legacy al 100%
  'app/legacy/**', // solo main.js y App.vue, ya sustituidos por el plugin y los layouts
  'app/views/**',
  'app/mobile/**',
  'app/api/**',
  'app/router/**',
  'app/data/**',
  'app/constants/**',
  'app/stores/**',
  'app/assets/*.js', // datasets estáticos

  // Carpetas compartidas con el template: aquí el legacy es el JavaScript
  'app/components/*.vue', // los del template están en subcarpetas
  'app/components/reports/**',
  'app/composables/*.js',
  'app/utils/*.js',
]

export default withNuxt(prettier, {
  ignores: [
    'template/**',
    'example/**',
    // Código vendido: shadcn-vue regenera el primero, Gandalf sincroniza el segundo
    'app/components/ui/**',
    'app/components/gandalf/**',
    ...LEGACY_PENDIENTE_DE_MIGRAR,
  ],
})
