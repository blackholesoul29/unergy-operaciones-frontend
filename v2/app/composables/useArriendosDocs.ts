/**
 * Documentos de arriendos del período, agrupados por proyecto.
 *
 * MIGRACIÓN — el original era un módulo con un `ref` **a nivel de módulo**
 * (`docsPorProyecto`) y las llamadas a la API sueltas. Ese `ref` sí guardaba
 * datos del usuario, así que bajo SSR habría filtrado los documentos de un
 * período entre sesiones distintas: es el caso que `AGENTS.md` marca como
 * incidente de seguridad y no como molestia de estilo. Ahora el estado va en
 * `useState` y la API la resuelve `ArriendosDocsService`.
 *
 * Se retiraron `uploadDoc` y `deleteDoc`, que no tenían ningún consumidor. Los
 * endpoints siguen registrados en `contexto/inventario-endpoints.md`.
 */
import type {
  DocumentoArriendo,
  DocumentosPorProyecto,
  SubidaCuentaCobro,
} from '~/features/finanzas/types'
import { logger } from '~/core/logger'
import { ArriendosDocsService } from '~/features/finanzas/services/arriendos-docs'

const SCOPE = 'arriendos-docs'

export function useArriendosDocs() {
  const docsPorProyecto = useState<DocumentosPorProyecto>('arriendos:docs', () => ({}))
  const servicio = new ArriendosDocsService()

  function agrupar(documentos: DocumentoArriendo[]): DocumentosPorProyecto {
    const agrupado: DocumentosPorProyecto = {}
    for (const doc of documentos) {
      ;(agrupado[doc.proyecto_id] ??= []).push(doc)
    }
    return agrupado
  }

  /** Carga los documentos del período y los deja en el estado compartido. */
  async function loadDocs(periodo: string): Promise<void> {
    try {
      docsPorProyecto.value = agrupar(await servicio.listarPorPeriodo(periodo))
    } catch (err) {
      logger.error(SCOPE, err)
      docsPorProyecto.value = {}
    }
  }

  /**
   * Los documentos del período **sin** tocar el estado compartido. Sirve para
   * detectar duplicados antes de subir.
   */
  async function fetchDocsPeriodo(periodo: string): Promise<DocumentoArriendo[]> {
    try {
      const documentos = await servicio.listarPorPeriodo(periodo)
      return Array.isArray(documentos) ? documentos : []
    } catch (err) {
      logger.error(SCOPE, err)
      return []
    }
  }

  function uploadCuentaCobro(datos: SubidaCuentaCobro): Promise<unknown> {
    return servicio.subirCuentaCobro(datos)
  }

  /** Descarga el PDF con el nombre que le corresponde. */
  async function downloadDoc(docId: number, nombreArchivo: string): Promise<void> {
    const blob = await servicio.descargarArchivo(docId)
    const url = URL.createObjectURL(blob)
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = nombreArchivo
    enlace.click()
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }

  return { docsPorProyecto, loadDocs, fetchDocsPeriodo, uploadCuentaCobro, downloadDoc }
}
