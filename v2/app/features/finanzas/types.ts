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
