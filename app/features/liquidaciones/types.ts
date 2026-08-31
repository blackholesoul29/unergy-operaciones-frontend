/**
 * Tipos del slice de liquidaciones — la mitad que habla con la API de
 * Liquidaciones de Unergy a través del proxy del backend (`/liquidaciones-api`).
 *
 * Sobre las filas: los envoltorios de respuesta (`results`, `readiness`,
 * `avisos`, `total`…) están verificados contra las vistas que los consumen. La
 * forma de cada fila **no**: el backend es quien manda y no hay contrato
 * publicado. Van como `unknown[]` a propósito, en vez de un `any` que mentiría —
 * tiparlas es el paso 1 de la receta de la fase 3 para este slice, cuando cada
 * vista se migre y se pueda comprobar campo por campo.
 */

/** Versión del ciclo: `txf` es la liquidación inicial; `tx3`…`tx8`, reliquidaciones de XM. */
export const VERSIONES = ['txf', 'tx3', 'tx4', 'tx5', 'tx6', 'tx7', 'tx8'] as const
export type VersionCiclo = (typeof VERSIONES)[number]
export const VERSION_INICIAL: VersionCiclo = 'txf'

/** Estado normalizado de una tarea asíncrona. Lo unifica el backend. */
export enum EstadoTarea {
  EN_CURSO = 'en_curso',
  EXITO = 'exito',
  FALLO = 'fallo',
}

/** Límites que impone la API al subir facturas. */
export const MAX_FACTURAS_POR_LOTE = 20
export const MAX_MB_POR_FACTURA = 10

/** Lo que devuelve el sondeo de una tarea mientras corre y al terminar. */
export interface TareaEstado {
  estado: EstadoTarea
  /** Presente solo cuando `estado` es `EXITO`. Trae, por ejemplo, la `drive_url`. */
  resultado?: ResultadoTarea
  /** El motivo, cuando `estado` es `FALLO`. */
  mensaje?: string
}

/** El `resultado` crudo de una tarea. Cada acción del ciclo llena campos distintos. */
export interface ResultadoTarea {
  drive_url?: string
  file_name?: string
  message?: string
  [campo: string]: unknown
}

export interface OpcionesEsperaTarea {
  timeoutMs?: number
  intervaloMs?: number
  onEstado?: (estado: TareaEstado) => void
}

/** Se lanzó la tarea pero terminó mal. `message` es el motivo del backend. */
export class TareaFallida extends Error {
  constructor(message?: string) {
    super(message)
    this.name = 'TareaFallida'
  }
}

/** No hubo `task_id`, o el sondeo agotó su tiempo de espera. */
export class TareaSinRespuesta extends Error {
  constructor(message?: string) {
    super(message)
    this.name = 'TareaSinRespuesta'
  }
}

// ── Respuestas de los listados ───────────────────────────────────────────────

export interface RespuestaFacturasXm {
  results: unknown[]
  /** Bloque de alistamiento: qué falta para poder repartir el período. */
  readiness?: unknown
}

export interface RespuestaSubidaFacturas {
  task_id: string
  invoice_ids: number[]
  files_queued: number
}

export interface RespuestaDespachos {
  results: unknown[]
  /** Avisos del backend sobre el período (proyectos sin datos, cruces raros…). */
  avisos?: unknown[]
}

export interface RespuestaCostos {
  results: unknown[]
  total?: number
}

export interface FiltrosDespachos {
  month: number
  year: number
  version?: VersionCiclo
}

export interface RespuestaConsumo {
  results: unknown[]
}

export interface FiltrosConsumo {
  month: number
  year: number
  version?: VersionCiclo
  project?: string
  fecha?: string
}

/** Catálogos fijos: empresas, precios de energía y tipos de costo. */
export interface Catalogos {
  tipos_costo?: unknown[]
  [catalogo: string]: unknown
}

// ── Contratos de energía ─────────────────────────────────────────────────────

export const TIPOS_CONTRATO = [
  { value: 'ppa_pay_as_generated', label: 'PLG · pago por generado' },
  { value: 'ppa_pay_as_contracted', label: 'PLC · pago por contratado' },
  { value: 'no_contract', label: 'Sin contrato' },
] as const

export const TIPOS_TARIFA = [
  { value: 'ppa', label: 'PPA' },
  { value: 'market', label: 'Bolsa' },
  { value: 'market_plus_benefits', label: 'Bolsa + beneficios' },
] as const

export type TipoContrato = (typeof TIPOS_CONTRATO)[number]['value']
export type TipoTarifa = (typeof TIPOS_TARIFA)[number]['value']

// ── Acciones del ciclo ───────────────────────────────────────────────────────

/**
 * Las acciones asíncronas del ciclo, tal como las nombra la API.
 *
 * Orden obligatorio: liquidar → repartir → estado de resultados → cruce.
 * IPP, FTP y facturas son independientes entre sí.
 */
export enum AccionCiclo {
  DESCARGAR_XM = 'ftp',
  LIQUIDAR = 'liquidar',
  REPARTIR = 'repartir',
  ESTADO_RESULTADOS = 'estado-resultados',
  CRUCE_FACTURAS = 'cruce-facturas',
}

export interface PeriodoCiclo {
  month: number
  year: number
  version?: VersionCiclo
  [parametro: string]: unknown
}

export interface DiagnosticoProyecto {
  project: string
  month: number
  year: number
  version?: VersionCiclo
}

/**
 * `GET/PATCH /liquidaciones-api/proyectos/:id`: los códigos SIC de un proyecto,
 * verificado contra `ProyectoDetailView.vue` (pestaña ID liquidaciones).
 */
export interface ConfigLiquidacionProyecto {
  sic_gen?: string | null
  sic_con?: string | null
  [clave: string]: unknown
}

export interface PayloadConfigLiquidacionProyecto {
  sic_gen: string | null
  sic_con: string | null
}
