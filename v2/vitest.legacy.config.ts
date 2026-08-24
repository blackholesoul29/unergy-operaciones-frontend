import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

/**
 * Configuración **temporal** de la Fase 0: corre las pruebas portadas que todavía
 * viven en `legacy/src/`, usando el Vitest ya instalado aquí.
 *
 * Existe porque la red de seguridad tiene que cubrir el código tal como está hoy
 * en producción, antes de moverlo. En la Fase 1, cuando `legacy/src/` aterrice en
 * `app/legacy/`, este archivo se borra y su `include` se absorbe en
 * `vitest.config.ts` como `app/**\/*.test.{ts,js}`.
 *
 * Uso: `bun run test:legacy`
 */
export default defineConfig({
  root: fileURLToPath(new URL('..', import.meta.url)),
  test: {
    environment: 'node',
    include: ['legacy/src/**/*.test.js'],
    expect: { requireAssertions: true },
  },
})
