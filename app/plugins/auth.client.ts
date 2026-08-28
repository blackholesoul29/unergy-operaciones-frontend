/**
 * Cierra la sesión sola cuando el JWT vence, en vez de esperar a que un 401 del
 * backend lo note en la próxima petición.
 *
 * Se agenda una vez al montar la app y se reprograma cada vez que el token
 * cambia (`login`, `logout`, `previewLogin`). `setTimeout` trunca el delay a 32
 * bits (~24.8 días): el token de la app móvil dura 30, así que un vencimiento
 * lejano se reprograma en tramos en vez de agendarse de una sola vez.
 */
import { clearTokens, decodeJwtPayload } from '~/core/security'

const MAX_TIMEOUT_MS = 2_147_483_647

export default defineNuxtPlugin(() => {
  const { state } = useAuth()
  let temporizador: ReturnType<typeof setTimeout> | undefined

  function cerrarPorExpiracion(): void {
    state.value = { user: null, accessToken: null }
    clearTokens()
  }

  function reprogramar(token: string | null): void {
    clearTimeout(temporizador)
    temporizador = undefined
    if (!token) return

    const payload = decodeJwtPayload(token)
    if (!payload?.exp) return

    const msRestantes = payload.exp * 1000 - Date.now()
    if (msRestantes <= 0) {
      cerrarPorExpiracion()
      return
    }

    temporizador =
      msRestantes > MAX_TIMEOUT_MS
        ? setTimeout(() => reprogramar(token), MAX_TIMEOUT_MS)
        : setTimeout(cerrarPorExpiracion, msRestantes)
  }

  watch(() => state.value.accessToken, reprogramar, { immediate: true })
})
