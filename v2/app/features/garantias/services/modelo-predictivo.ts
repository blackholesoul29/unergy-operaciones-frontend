/**
 * El Modelo Predictivo de garantías: cuánto va a pedir XM en cada vencimiento,
 * estimado con antelación (percentil 90) antes de que XM lo publique.
 */
import type {
  DetalleVencimiento,
  ParametrosPlanModeloPredictivo,
  PlanModeloPredictivo,
} from '~/features/garantias/types'
import { LegacyBaseService } from '~/core/legacy-service'

const BASE = '/garantias/modelo'

const RUTAS = {
  plan: `${BASE}/plan`,
  detalle: (id: string) => `${BASE}/detalle/${encodeURIComponent(id)}`,
} as const

export class ModeloPredictivoService extends LegacyBaseService {
  getPlan(parametros: ParametrosPlanModeloPredictivo): Promise<PlanModeloPredictivo> {
    return this.get<PlanModeloPredictivo>(RUTAS.plan, { params: parametros })
  }

  getDetalle(id: string): Promise<DetalleVencimiento> {
    return this.get<DetalleVencimiento>(RUTAS.detalle(id))
  }
}
