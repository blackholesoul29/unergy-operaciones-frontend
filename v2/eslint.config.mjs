// @ts-check
import prettier from 'eslint-config-prettier'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(prettier, {
  ignores: [
    'template/**',
    'example/**',
    'app/components/ui/**',
    'app/components/gandalf/**',
    // MIGRACIÓN — Fase 1: cuarentena del legacy. Se sabe que no cumple las
    // reglas del template; se vacía en la fase 2 y esta línea se retira.
    'app/legacy/**',
  ],
})
