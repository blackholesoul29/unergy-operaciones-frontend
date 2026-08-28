/**
 * Cliente HTTP de la plataforma de operaciones, sobre axios.
 *
 * MIGRACIÓN — es el cliente que trae el legacy y se conserva tal cual porque su
 * comportamiento no es solo "hacer peticiones": los interceptores son parte del
 * contrato que asumen las ~130 vistas que lo usan.
 *
 *   - adjunta el Bearer desde `~/core/security` en cada petición;
 *   - un 401 limpia la sesión y devuelve al login que corresponde (la app móvil
 *     tiene el suyo);
 *   - un 403 avisa con un toast sin cerrar la sesión.
 *
 * Convive a propósito con `~/core/api.ts`, que es el cliente de ofetch del
 * template: aquel es el destino, este es el presente. En la fase 3, cuando la
 * sesión pase a cookies httpOnly, los dos se funden en uno y este archivo se
 * borra — junto con `~/core/legacy-service.ts`.
 */
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import axios from 'axios'
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
