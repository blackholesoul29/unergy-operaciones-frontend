/**
 * Tipos del slice de finanzas — por ahora, los del agente local de XM.
 */

/** Una descarga encolada en el agente local. */
export interface TrabajoDescargaXm {
  job_id: string
  [campo: string]: unknown
}

export interface EstadoDescargaXm {
  estado?: string
  mensaje?: string
  [campo: string]: unknown
}

// ── Documentos de arriendos ──────────────────────────────────────────────────

/** Un documento de arriendo (cuenta de cobro o factura) ya subido. */
export interface DocumentoArriendo {
  id: number
  /** Id real de `Proyecto`. Es la clave con la que se agrupa. */
  proyecto_id: number
  /**
   * Id heredado. El backend lo sigue devolviendo por compatibilidad, pero ya no
   * se usa para agrupar.
   */
  arr_proyecto_id?: number | null
  [campo: string]: unknown
}

/** Documentos del período agrupados por proyecto. */
export type DocumentosPorProyecto = Record<number, DocumentoArriendo[]>

/** Un predio dentro de una cuenta de cobro: el backend genera una copia por cada uno. */
export interface PredioCuentaCobro {
  arr_proyecto_id: number | null
  codigo_predio: string
  valor_individual: number | null
  nombre_resultante: string
}

export interface SubidaCuentaCobro {
  file: File
  fileSecundario?: File | null
  periodo: string
  pagoId: number
  codigoContrato: string
  tipoDocumento: string
  numeroCuentaCobro?: string | null
  nombreArrendatario?: string | null
  predios: PredioCuentaCobro[]
}
