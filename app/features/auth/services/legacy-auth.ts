/**
 * El login contra el backend de operaciones.
 *
 * Usa una instancia de axios **propia, sin los interceptores** de
 * `~/core/client.ts`, y por un motivo concreto: unas credenciales equivocadas
 * responden 401, y el interceptor de la plataforma reacciona a un 401 borrando
 * la sesión y redirigiendo al login. En la pantalla de login eso es ruido; en la
 * app móvil es un salto de página en medio del intento. El login es la única
 * llamada de la app para la que un 401 es una respuesta normal.
 *
 * El backend espera `application/x-www-form-urlencoded` con `username` y
 * `password` (es el flujo de contraseña de OAuth2 tal como lo sirve FastAPI), no
 * JSON.
 *
 * Es el transporte real de la sesión (`~/composables/useAuth.ts`): el backend
 * no expone `/auth/me`, así que el login no puede pasar por
 * `POST /api/auth/login` de Nitro (`~/features/auth/services/auth.ts`), que
 * asume ese endpoint para resolver la sesión en cada request.
 */
import type { AxiosError } from 'axios'
import axios from 'axios'
import { AppError, codeFromHttpStatus } from '~/core/errors'
import { LegacyBaseService } from '~/core/legacy-service'

/** Vacío = mismo origen, que es lo normal: el proxy resuelve el resto. */
const BASE_URL = import.meta.env.VITE_API_URL || ''

const RUTAS = {
  /** Sesión de la plataforma web. */
  token: '/api/v1/auth/token',
  /** Sesión de la app móvil: token de larga duración (30 días). */
  tokenMovil: '/api/v1/auth/token/mobile',
} as const

export interface RespuestaToken {
  access_token: string
  token_type?: string
}

/** El detalle de error que devuelve FastAPI: `{ detail: "Credenciales inválidas" }`. */
interface DetalleError {
  detail?: string
}

/** Traduce el error de axios a `AppError`, para que `normalizeError` lo deje pasar tal cual. */
function comoAppError(err: unknown): AppError {
  if (!axios.isAxiosError(err))
    return new AppError('UNKNOWN', err instanceof Error ? err.message : String(err))

  const error = err as AxiosError<DetalleError>
  const status = error.response?.status ?? 0
  return new AppError(codeFromHttpStatus(status), error.response?.data?.detail, { cause: err })
}

export class LegacyAuthService extends LegacyBaseService {
  constructor() {
    super(axios.create({ baseURL: BASE_URL }))
  }

  private async solicitarToken(
    ruta: string,
    email: string,
    password: string,
  ): Promise<RespuestaToken> {
    try {
      return await this.post<RespuestaToken>(
        ruta,
        new URLSearchParams({ username: email, password }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      )
    } catch (err) {
      throw comoAppError(err)
    }
  }

  login(email: string, password: string): Promise<RespuestaToken> {
    return this.solicitarToken(RUTAS.token, email, password)
  }

  /** Login de la app móvil: mismo usuario, token que dura 30 días. */
  loginMovil(email: string, password: string): Promise<RespuestaToken> {
    return this.solicitarToken(RUTAS.tokenMovil, email, password)
  }
}
