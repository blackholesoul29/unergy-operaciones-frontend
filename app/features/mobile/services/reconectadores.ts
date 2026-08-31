/** Reconectadores remotos (Solenium): estado por proyecto y envío de comandos ON/OFF. */
import type { EstadoReconectador, PayloadComandoReconectador } from '~/features/mobile/types'
import { LegacyBaseService } from '~/core/legacy-service'

const BASE = '/reconectadores'

const RUTAS = {
  estados: `${BASE}/estados`,
  comando: (proyectoId: number | string) => `${BASE}/${proyectoId}/comando`,
} as const

export class ReconectadoresService extends LegacyBaseService {
  obtenerEstados(): Promise<EstadoReconectador[]> {
    return this.get<EstadoReconectador[]>(RUTAS.estados)
  }

  enviarComando(
    proyectoId: number | string,
    payload: PayloadComandoReconectador,
  ): Promise<unknown> {
    return this.post<unknown>(RUTAS.comando(proyectoId), payload)
  }
}
