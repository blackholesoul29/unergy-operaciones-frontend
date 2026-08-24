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
 * MIGRACIÓN — desaparece en la fase 3, ola 1: el login pasa a
 * `POST /api/auth/login` de Nitro, que deja los tokens en cookies httpOnly.
 * Ver `~/features/auth/services/auth.ts`, que ya es ese servicio.
 */
import axios from 'axios'
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

export class LegacyAuthService extends LegacyBaseService {
  constructor() {
    super(axios.create({ baseURL: BASE_URL }))
  }

  private solicitarToken(ruta: string, email: string, password: string): Promise<RespuestaToken> {
    return this.post<RespuestaToken>(ruta, new URLSearchParams({ username: email, password }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  }

  login(email: string, password: string): Promise<RespuestaToken> {
    return this.solicitarToken(RUTAS.token, email, password)
  }

  /** Login de la app móvil: mismo usuario, token que dura 30 días. */
  loginMovil(email: string, password: string): Promise<RespuestaToken> {
    return this.solicitarToken(RUTAS.tokenMovil, email, password)
  }
}
