import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

/**
 * The suite runs the modules directly in Node, without a Nuxt build. That keeps
 * it fast and keeps what it proves honest: these are the pure decisions —
 * permissions, error normalization, the auth middleware — not the framework.
 *
 * `vitest.setup.ts` supplies the handful of globals Nuxt and Nitro would
 * auto-import, including a pinned runtime config, so a developer's `.env`
 * cannot decide what the suite asserts.
 */
export default defineConfig({
  resolve: {
    alias: {
      '~~': fileURLToPath(new URL('./', import.meta.url)),
      '@@': fileURLToPath(new URL('./', import.meta.url)),
      '~': fileURLToPath(new URL('./app', import.meta.url)),
      '@': fileURLToPath(new URL('./app', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    // MIGRACIÓN — Fase 1: el `.js` cubre las pruebas del legacy, que se portaron a
    // Vitest en la fase 0 y viajaron con su módulo. Sobra cuando la fase 3 las
    // pase a TypeScript.
    include: ['app/**/*.test.{ts,js}', 'server/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
    expect: { requireAssertions: true },
  },
})
