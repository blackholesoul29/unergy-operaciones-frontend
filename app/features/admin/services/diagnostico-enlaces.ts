/** Diagnóstico del mapeo Contrato → GESCON → Planta → sub_project, contra la API de Unergy. */
import type { DiagnosticoEnlaces, ResultadoFixEnlaces } from '~/features/admin/types'
import { LegacyBaseService } from '~/core/legacy-service'

const RUTAS = {
  diagnostico: '/cumplimiento/diagnostico',
  fixEnlaces: '/cumplimiento/fix-enlaces',
} as const

export class DiagnosticoEnlacesService extends LegacyBaseService {
  obtener(): Promise<DiagnosticoEnlaces> {
    return this.get<DiagnosticoEnlaces>(RUTAS.diagnostico)
  }

  fixEnlaces(): Promise<ResultadoFixEnlaces> {
    return this.post<ResultadoFixEnlaces>(RUTAS.fixEnlaces)
  }
}
