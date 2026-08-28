/**
 * La API de EVO (precio de bolsa y clima), a través de este servidor.
 *
 * Existe por una sola razón: **el token no puede llegar al navegador**. Se
 * inyecta aquí, server-side, igual que hacía el proxy de Vite en el legacy. Si
 * esta ruta desapareciera y el cliente llamara a EVO directo, el token acabaría
 * en el bundle.
 *
 * Se recorta `/api/v1/evo` del camino porque EVO sirve sus rutas en la raíz:
 * `/api/v1/evo/clima/forecast` → `${evoApiUrl}/clima/forecast`.
 *
 * Nitro resuelve por especificidad, así que esta ruta gana a `/api/v1/[...path]`.
 */
const PREFIJO = '/api/v1/evo'

export default defineEventHandler((event) => {
  const { evoApiUrl, evoApiToken } = useRuntimeConfig(event)

  return reenviar(event, evoApiUrl, {
    prefijoAQuitar: PREFIJO,
    cabeceras: evoApiToken ? { 'X-EVO-Token': evoApiToken } : undefined,
  })
})
