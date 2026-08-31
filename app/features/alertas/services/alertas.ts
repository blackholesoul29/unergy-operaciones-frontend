/**
 * El centro de alertas: los KPIs operativos que resumen la portada y las
 * inconsistencias de contratos PPA en GESCON.
 *
 * Sobre `LegacyBaseService` porque lo consume el cliente axios compartido
 * (`~/core/client.ts`), como el resto de la app hoy — pasa a `BaseService`
 * cuando ese resto migre.
 */
import type { KpisOperativos } from '~/types/dashboard'
import type { AlertasContratosPpa } from '~/features/alertas/types'
import { LegacyBaseService } from '~/core/legacy-service'

const RUTAS = {
  kpis: '/dashboard/kpis',
  contratosPpa: '/alertas/contratos-ppa',
} as const

export class AlertasService extends LegacyBaseService {
  obtenerKpis(): Promise<KpisOperativos> {
    return this.get<KpisOperativos>(RUTAS.kpis)
  }

  /** Proyectos sin contrato activo en GESCON (huérfanos) o con más de uno (duplicados). */
  obtenerContratosPpa(): Promise<AlertasContratosPpa> {
    return this.get<AlertasContratosPpa>(RUTAS.contratosPpa)
  }
}
