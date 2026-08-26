/**
 * Tipos del slice de proyectos.
 *
 * Verificados contra `ProximosEnergizarView.vue` y el composable que los
 * consume: son los campos que el código lee de verdad.
 */
import type { Id } from '~/types/api'

/** Un proyecto del pipeline, ya rehidratado (fechas como `Date`). */
export interface ProyectoProximoEnergizar {
  id: Id
  commercialName: string
  /** `null` mientras no haya fecha estimada. */
  energizationDate: Date | null
  contracts: unknown[]
  monthlyMwh: number
  [campo: string]: unknown
}

/** La respuesta cruda del backend, antes de rehidratar. */
export interface RespuestaProximosEnergizar {
  projects?: unknown[]
  /** De dónde salieron los datos. Hoy siempre `operaciones_db`. */
  source?: string | null
  /**
   * Último sync que tocó el pipeline en la BD — el del job de 6 h o el que
   * alguien disparó a mano. No depende de esta sesión.
   */
  ultimaSincronizacion?: string | null
}
