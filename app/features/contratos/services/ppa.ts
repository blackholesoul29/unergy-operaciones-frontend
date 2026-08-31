/** Contratos PPA: tarifas, compromisos de energía, proyectos vinculados y sus registros GESCON/ASIC. */
import type {
  CompromisoEnergiaPpa,
  ContratoPpa,
  PayloadPpa,
  PlantasInscritasPorMes,
  RegistroAsic,
  ResponsablePpa,
  TarifaPpa,
} from '~/features/contratos/types'
import { comoLista, type ListaODirecto } from '~/types/api'
import { LegacyBaseService } from '~/core/legacy-service'

const BASE = '/ppa'

const RUTAS = {
  contratos: BASE,
  contrato: (id: ContratoPpa['id']) => `${BASE}/${id}`,
  tarifas: (id: ContratoPpa['id']) => `${BASE}/${id}/tarifas`,
  compromisos: (id: ContratoPpa['id']) => `${BASE}/${id}/compromisos`,
  proyectosVinculados: (id: ContratoPpa['id']) => `${BASE}/${id}/proyectos`,
  responsables: `${BASE}/responsables`,
  asic: '/asic',
  asicItem: (id: RegistroAsic['id']) => `/asic/${id}`,
  plantasInscritasPorMes: (id: ContratoPpa['id']) =>
    `/cumplimiento/ppa/${id}/plantas-inscritas-por-mes`,
} as const

export class PpaService extends LegacyBaseService {
  listar(filtros: { proyecto_id?: number; q?: string } = {}): Promise<ContratoPpa[]> {
    return this.get<ContratoPpa[]>(RUTAS.contratos, { query: filtros })
  }

  obtener(id: ContratoPpa['id']): Promise<ContratoPpa> {
    return this.get<ContratoPpa>(RUTAS.contrato(id))
  }

  crear(payload: PayloadPpa): Promise<ContratoPpa> {
    return this.post<ContratoPpa>(RUTAS.contratos, payload)
  }

  actualizar(id: ContratoPpa['id'], payload: PayloadPpa): Promise<ContratoPpa> {
    return this.patch<ContratoPpa>(RUTAS.contrato(id), payload)
  }

  eliminar(id: ContratoPpa['id']): Promise<unknown> {
    return this.delete<unknown>(RUTAS.contrato(id))
  }

  guardarTarifas(id: ContratoPpa['id'], tarifas: TarifaPpa[]): Promise<TarifaPpa[]> {
    return this.put<TarifaPpa[]>(RUTAS.tarifas(id), tarifas)
  }

  guardarCompromisos(
    id: ContratoPpa['id'],
    compromisos: CompromisoEnergiaPpa[],
  ): Promise<CompromisoEnergiaPpa[]> {
    return this.put<CompromisoEnergiaPpa[]>(RUTAS.compromisos(id), compromisos)
  }

  vincularProyecto(id: ContratoPpa['id'], proyectoId: number): Promise<unknown> {
    return this.post<unknown>(RUTAS.proyectosVinculados(id), { proyecto_id: proyectoId })
  }

  listarResponsables(): Promise<ResponsablePpa[]> {
    return this.get<ResponsablePpa[]>(RUTAS.responsables)
  }

  listarPlantasInscritasPorMes(id: ContratoPpa['id']): Promise<PlantasInscritasPorMes[]> {
    return this.get<PlantasInscritasPorMes[]>(RUTAS.plantasInscritasPorMes(id))
  }

  // ── Registros GESCON/ASIC ────────────────────────────────────────────────────

  async listarAsic(
    filtros: {
      proyecto_id?: number
      size?: number
      contrato_interno?: string
      codigo_sic_contrato?: string
    } = {},
  ): Promise<RegistroAsic[]> {
    const data = await this.get<ListaODirecto<RegistroAsic>>(RUTAS.asic, { query: filtros })
    return comoLista(data)
  }

  eliminarAsic(id: RegistroAsic['id']): Promise<unknown> {
    return this.delete<unknown>(RUTAS.asicItem(id))
  }
}
