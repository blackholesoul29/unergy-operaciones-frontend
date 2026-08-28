/**
 * Estado del pipeline de proyectos próximos a energizarse.
 *
 * MIGRACIÓN — el original llamaba a la API directamente. Ahora delega en
 * `ProximosEnergizarService`, que es lo único que habla con el backend, y los
 * `console.error` pasaron a `logger.error`.
 *
 * El estado es local a cada uso (una vista lo monta y lo desmonta), así que van
 * `ref` dentro de la función y no `useState`: no hay nada que compartir.
 */
import type { AppError } from '~/core/errors'
import type {
  ProyectoProximoEnergizar,
  RespuestaProximosEnergizar,
} from '~/features/proyectos/types'
import { normalizeError } from '~/core/errors'
import { logger } from '~/core/logger'
import { ProximosEnergizarService } from '~/features/proyectos/services/proximos-energizar'

const SCOPE = 'proximos-energizar'

/** Fechas como `Date` y valores por defecto, para que la vista no tenga que comprobar. */
function rehidratar(crudo: unknown): ProyectoProximoEnergizar {
  const p = crudo as Record<string, unknown>
  return {
    ...p,
    id: Number(p.id),
    commercialName: (p.commercialName as string) ?? '',
    energizationDate: p.energizationDate ? new Date(p.energizationDate as string) : null,
    contracts: Array.isArray(p.contracts) ? p.contracts : [],
    monthlyMwh: Number(p.monthlyMwh) || 0,
  }
}

export function useEnergizationProjects() {
  const projects = ref<ProyectoProximoEnergizar[]>([])
  const loading = ref(false)
  const error = ref<AppError | null>(null)
  /** Aviso del backend: configuración faltante o fuente caída. */
  const warning = ref<string | null>(null)
  const source = ref<string | null>(null)
  const syncing = ref(false)
  const lastSync = ref<Date | null>(null)

  const servicio = new ProximosEnergizarService()

  function aplicar(data: RespuestaProximosEnergizar): void {
    projects.value = (Array.isArray(data.projects) ? data.projects : []).map(rehidratar)
    source.value = data.source ?? null
    if (data.ultimaSincronizacion) lastSync.value = new Date(data.ultimaSincronizacion)
  }

  async function loadProjects(): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      aplicar(await servicio.listar())
      return true
    } catch (err) {
      logger.error(SCOPE, err)
      const normalizado = normalizeError(err)
      error.value = normalizado
      warning.value = normalizado.message
      return false
    } finally {
      loading.value = false
    }
  }

  async function removeProject(projectId: number): Promise<void> {
    try {
      await servicio.eliminarProyecto(projectId)
      projects.value = projects.value.filter((p) => p.id !== projectId)
    } catch (err) {
      logger.error(SCOPE, err)
    }
  }

  /** Vuelve a sincronizar con Sun Factory y recarga la lista. */
  async function syncNow(): Promise<unknown> {
    syncing.value = true
    try {
      const resultado = await servicio.sincronizar()
      await loadProjects()
      return resultado
    } catch (err) {
      logger.error(SCOPE, err)
      warning.value = normalizeError(err).message
      return null
    } finally {
      syncing.value = false
    }
  }

  return {
    projects,
    loading,
    error,
    warning,
    source,
    syncing,
    lastSync,
    loadProjects,
    removeProject,
    syncNow,
  }
}
