/**
 * Todo lo que el frontend pide bajo `/api/v1` va al backend de operaciones.
 *
 * Es el grueso del tráfico: los 341 endpoints que consume `~/core/client.ts`,
 * cuyo `baseURL` es justamente `/api/v1`.
 *
 * No pisa a `/api/auth/*` (los endpoints propios del template, en `server/api/`)
 * porque aquellos cuelgan de `/api/auth` y esto de `/api/v1`.
 */
export default defineEventHandler((event) => {
  return reenviar(event, useRuntimeConfig(event).apiProxyTarget)
})
