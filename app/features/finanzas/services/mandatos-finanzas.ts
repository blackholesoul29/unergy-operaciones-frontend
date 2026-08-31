/** Mandatos de recaudo desde la vista de Finanzas: listado y resumen por período/tipo. */
import type {
  RespuestaListaMandatosFinanzas,
  ResumenMandatosFinanzas,
} from '~/features/finanzas/types'
import { LegacyBaseService } from '~/core/legacy-service'

const BASE = '/finanzas/mandatos'

const RUTAS = {
  mandatos: BASE,
  resumen: `${BASE}/resumen`,
} as const

export class MandatosFinanzasService extends LegacyBaseService {
  listar(filtros: { periodo: string; tipo: string }): Promise<RespuestaListaMandatosFinanzas> {
    return this.get<RespuestaListaMandatosFinanzas>(RUTAS.mandatos, { query: { ...filtros } })
  }

  obtenerResumen(periodo: string): Promise<ResumenMandatosFinanzas> {
    return this.get<ResumenMandatosFinanzas>(RUTAS.resumen, { query: { periodo } })
  }
}
