/**
 * La sesión de la plataforma, tal como la maneja el legacy: JWT en
 * `localStorage`, rol decodificado en el cliente.
 *
 * MIGRACIÓN — este store es la mitad que se sustituye en la fase 3, ola 1, por
 * `useAuth()` (`~/composables/useAuth.ts`) + las cookies httpOnly que ya monta el
 * template. Hasta entonces es la fuente de verdad de la sesión y de los permisos
 * de ruta, y los dos sistemas conviven sin tocarse: el guard del template está
 * apagado (`NUXT_PUBLIC_AUTH_ENABLED=false`).
 */
import type { UsuarioLegacy } from '~/types/user'
import { defineStore } from 'pinia'
import { LegacyAuthService } from '~/features/auth/services/legacy-auth'
import {
  clearTokens,
  decodeJwtPayload,
  getAccessToken,
  getStoredUser,
  isTokenExpired,
  setAccessToken,
  setStoredUser,
} from '~/utils/security'

/** Reconstruye el usuario desde los claims del JWT. */
function usuarioDesdeToken(jwt: string): UsuarioLegacy | null {
  const payload = decodeJwtPayload(jwt)
  if (!payload?.sub || !payload?.rol) return null

  return {
    id: payload.sub,
    rol: payload.rol,
    nombre: payload.nombre || '',
    email: payload.email || '',
  }
}

export const useAuthStore = defineStore('auth', () => {
  const guardado = getAccessToken()
  const tokenValido = !!guardado && !isTokenExpired(guardado)
  const token = ref<string | null>(tokenValido ? guardado : null)

  // ── Recuperar usuario ──────────────────────────────────────────────────────
  // Fuente de verdad: el usuario en caché, si existe y trae rol.
  // Respaldo: decodificar el JWT. Cubre el caso de que la caché se borrara
  // mientras el token sigue vivo.
  let usuarioInicial = getStoredUser()

  if (token.value && !usuarioInicial?.rol) {
    const reconstruido = usuarioDesdeToken(token.value)
    if (reconstruido) {
      usuarioInicial = reconstruido
      setStoredUser(reconstruido)
    }
  }

  const user = ref<UsuarioLegacy | null>(usuarioInicial)

  // Si el token venció, no queda nada que conservar.
  if (!token.value) {
    if (guardado) clearTokens()
    user.value = null
  }

  // ── Derivados ──────────────────────────────────────────────────────────────
  const isAuthenticated = computed(() => !!token.value && !isTokenExpired(token.value))
  const role = computed<string | null>(() => user.value?.rol ?? null)

  /**
   * Si el rol está en la lista, o es `admin`.
   *
   * Ojo: `admin` pasa siempre, por diseño del legacy. El template no tiene ese
   * atajo — en la fase 3 a `admin` se le conceden todos los permisos de forma
   * explícita, que es lo mismo pero sin un caso especial que se pueda olvidar.
   */
  function can(...roles: string[]): boolean {
    if (!role.value) return false
    return roles.includes(role.value) || role.value === 'admin'
  }

  // ── Login ──────────────────────────────────────────────────────────────────
  function aplicarToken(accessToken: string): void {
    token.value = accessToken
    setAccessToken(accessToken)

    const usuario = usuarioDesdeToken(accessToken)
    user.value = usuario
    setStoredUser(usuario)
  }

  async function login(email: string, password: string): Promise<void> {
    const { access_token } = await new LegacyAuthService().login(email, password)
    aplicarToken(access_token)
  }

  /** Login de la app móvil: token de larga duración (30 días). */
  async function loginMobile(email: string, password: string): Promise<void> {
    const { access_token } = await new LegacyAuthService().loginMovil(email, password)
    aplicarToken(access_token)
  }

  function logout(): void {
    token.value = null
    user.value = null
    clearTokens()
  }

  /** Solo en desarrollo: simula una sesión sin backend para previsualizar vistas. */
  function previewLogin(rol: string): void {
    if (!import.meta.dev) return

    const base64url = (valor: string) =>
      btoa(valor).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

    const cabecera = base64url('{"alg":"HS256","typ":"JWT"}')
    const payload = base64url(
      `{"sub":"99","rol":"${rol}","nombre":"Preview ${rol}","email":"preview@unergy.io","exp":9999999999}`,
    )
    const tokenFalso = `${cabecera}.${payload}.preview`

    token.value = tokenFalso
    user.value = { id: '99', rol, nombre: `Preview ${rol}`, email: 'preview@unergy.io' }
    setAccessToken(tokenFalso)
    setStoredUser(user.value)
  }

  return { token, user, isAuthenticated, role, can, login, loginMobile, logout, previewLogin }
})
