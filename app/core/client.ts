/**
 * Cliente HTTP de la plataforma de operaciones.
 *
 * MIGRACIÓN — este archivo exporta dos clientes a propósito, mismo contrato de
 * sesión, dos transportes:
 *
 *   - **el `export default`, sobre axios**: el que trae el legacy y se
 *     conserva tal cual porque sus interceptores son parte del contrato que
 *     asumen los ~112 componentes que todavía lo importan directo
 *     (`import api from '~/core/client'`). Muere solo, componente a
 *     componente, a medida que cada uno se mueve a un service — es
 *     exactamente el trabajo que ya está en curso. Cuando no quede ningún
 *     consumidor, este export y el import de `axios` se borran.
 *   - **`airClient`, sobre `air`**: el transporte de `LegacyBaseService`
 *     (`~/core/legacy-service.ts`), y por tanto de todo service nuevo. `air`
 *     no tiene interceptores — la forma de replicar el mismo contrato es
 *     envolver `fetch` (ver "Refreshing on a 401" en el README de `air`) y
 *     dejar que siga lanzando `AirError` como con cualquier no-2xx, igual que
 *     axios rechazaba la promesa.
 *
 * El contrato de sesión es el mismo en los dos:
 *
 *   - adjunta el Bearer desde `~/core/security` en cada petición;
 *   - un 401 limpia la sesión y devuelve al login que corresponde (la app móvil
 *     tiene el suyo);
 *   - un 403 avisa con un toast sin cerrar la sesión.
 *
 * Convive a propósito con `~/core/api.ts` (el `BaseService` que usa `AuthService`,
 * también sobre `air`): aquel no lleva este contrato de sesión porque su token
 * lo resuelve quien lo instancia, no `~/core/security`. En la fase 3, cuando la
 * sesión pase a cookies httpOnly, los dos se funden en uno.
 */
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import axios from 'axios'
import air, { type AirClient } from '@korastd/air'
import { clearTokens, getAccessToken, isPreviewToken } from '~/core/security'
import { toast } from 'vue-sonner'

/** Rutas del propio frontend a las que se devuelve una sesión caducada. */
const LOGIN_PATH = '/login'
const LOGIN_PATH_MOVIL = '/m/login'

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
  // Cuando el backend migre el refresh token a una cookie httpOnly, habilitar
  // `withCredentials: true` aquí y configurar CORS con
  // Access-Control-Allow-Credentials en el servidor. Ver SECURITY.md.
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`

  // El navegador tiene que poner el boundary del multipart, así que el
  // Content-Type por defecto estorba.
  if (config.data instanceof FormData) config.headers.delete('Content-Type')

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined

    if (status === 401) {
      // El token de preview (solo DEV) no debe disparar logout.
      if (isPreviewToken(getAccessToken())) return Promise.reject(error)

      clearTokens()
      const enMovil =
        window.location.pathname.startsWith('/m/') || window.location.pathname === '/m'
      window.location.href = enMovil ? LOGIN_PATH_MOVIL : LOGIN_PATH
    }

    if (status === 403 && axios.isAxiosError(error)) {
      const detalle = error.response?.data as { detail?: string } | undefined
      toast.error('Acceso denegado', {
        description: detalle?.detail || 'No tienes permisos para esta acción',
        duration: 4000,
      })
    }

    return Promise.reject(error)
  },
)

export default api

// ── El equivalente sobre air, para los services ──────────────────────────────

/**
 * Envuelve `fetch` para replicar el interceptor de arriba: un 401 limpia la
 * sesión y redirige (salvo token de preview), un 403 avisa con un toast. En
 * los dos casos se devuelve la respuesta tal cual — `air` la sigue leyendo, y
 * al no ser 2xx la convierte en `AirError` igual que hacía el `Promise.reject`
 * de axios.
 */
async function conSesion(url: string, init: RequestInit): Promise<Response> {
  const respuesta = await fetch(url, init)

  if (respuesta.status === 401) {
    if (isPreviewToken(getAccessToken())) return respuesta

    clearTokens()
    const enMovil = window.location.pathname.startsWith('/m/') || window.location.pathname === '/m'
    window.location.href = enMovil ? LOGIN_PATH_MOVIL : LOGIN_PATH
    return respuesta
  }

  if (respuesta.status === 403) {
    // `.clone()`: el cuerpo original lo sigue leyendo `air` para construir el
    // `AirError`; consumirlo aquí sin clonar lo dejaría vacío para ese lector.
    const detalle = (await respuesta
      .clone()
      .json()
      .catch(() => undefined)) as { detail?: string } | undefined

    toast.error('Acceso denegado', {
      description: detalle?.detail || 'No tienes permisos para esta acción',
      duration: 4000,
    })
  }

  return respuesta
}

export const airClient: AirClient = air.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: () => {
    const token = getAccessToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  },
  fetch: conSesion,
})
