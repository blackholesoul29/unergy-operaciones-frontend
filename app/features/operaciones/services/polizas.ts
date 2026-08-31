/** Pólizas de responsabilidad civil de las plantas: una fila por proyecto. */
import type { Poliza, PayloadPoliza } from '~/features/operaciones/types'
import { LegacyBaseService } from '~/core/legacy-service'

const BASE = '/polizas'

export class PolizasService extends LegacyBaseService {
  listar(): Promise<Poliza[]> {
    return this.get<Poliza[]>(BASE)
  }

  guardar(proyectoId: Poliza['proyecto_id'], payload: PayloadPoliza): Promise<unknown> {
    return this.put<unknown>(`${BASE}/${proyectoId}`, payload)
  }
}
