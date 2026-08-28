/**
 * Descargas del FTP de XM, a través del agente local.
 *
 * El FTP de XM solo acepta conexiones desde IPs conocidas y Railway no puede
 * llegar ahí, así que estas llamadas **no van al backend**: van al agente que la
 * usuaria corre en su propio computador (ver
 * `unergy-operaciones-backend/local_agent/README.md`).
 *
 * De ahí que use una instancia de axios propia: sin la baseURL de la plataforma
 * y sin el interceptor de autenticación. El agente no pide token — solo acepta
 * conexiones desde localhost.
 */
import type { EstadoDescargaXm, TrabajoDescargaXm } from '~/features/finanzas/types'
import axios from 'axios'
import { LegacyBaseService } from '~/core/legacy-service'

const AGENTE_LOCAL_URL = 'http://127.0.0.1:8420'
const TIMEOUT_MS = 10_000

const RUTAS = {
  descargas: '/descargas',
  descarga: (jobId: string) => `/descargas/${jobId}`,
} as const

export class XmAgenteLocalService extends LegacyBaseService {
  constructor() {
    super(axios.create({ baseURL: AGENTE_LOCAL_URL, timeout: TIMEOUT_MS }))
  }

  iniciarDescarga(payload: Record<string, unknown>): Promise<TrabajoDescargaXm> {
    return this.post<TrabajoDescargaXm>(RUTAS.descargas, payload)
  }

  consultarEstado(jobId: string): Promise<EstadoDescargaXm> {
    return this.get<EstadoDescargaXm>(RUTAS.descarga(jobId))
  }

  /**
   * Distingue «el agente no está corriendo» de «el agente respondió con un
   * error». Sin respuesta significa que nadie escucha en el puerto, que es el
   * caso que la vista tiene que explicar al usuario.
   */
  static noDisponible(error: unknown): boolean {
    return !(axios.isAxiosError(error) && error.response)
  }
}
