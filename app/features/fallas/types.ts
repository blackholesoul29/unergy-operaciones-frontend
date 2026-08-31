/**
 * Forma verificada contra `FallasListView.vue`, `MonitoreoView.vue`,
 * `FallaDetailView.vue`, `FallaDetalle.vue`, `FallaForm.vue`, `FallaArchivos.vue`,
 * `CalendarioFallas.vue` y `FallasMapView.vue`.
 */

/** Un ítem de catálogo (`tipos`, `estados`, `prioridades`, `categorias`…): `{id, nombre}` y poco más. */
export interface CatalogoItemFalla {
  id: number
  nombre?: string
  codigo?: string
  color?: string
  [clave: string]: unknown
}

/** `GET /fallas/catalogos`. */
export interface CatalogosFalla {
  tipos: CatalogoItemFalla[]
  estados: CatalogoItemFalla[]
  prioridades: CatalogoItemFalla[]
  categorias?: unknown[]
  [clave: string]: unknown
}

export interface FotoFalla {
  id: number
  url?: string
  [clave: string]: unknown
}

export interface SeguimientoFalla {
  id: number
  nota?: string
  estado_id?: number | null
  creado_por?: string
  created_at?: string
  [clave: string]: unknown
}

export interface ArchivoFalla {
  id: number
  nombre?: string
  url?: string
  [clave: string]: unknown
}

/**
 * `GET /fallas/:id` (y su forma resumida en `GET /fallas`). El catch-all cubre
 * el resto: es una entidad grande y las vistas leen subconjuntos distintos.
 */
export interface Falla {
  id: number
  codigo_interno?: string
  proyecto?: { id: number; nombre_comercial?: string; [clave: string]: unknown }
  proyecto_id?: number
  tipo?: CatalogoItemFalla
  tipo_id?: number | null
  tipo_libre?: string | null
  estado?: CatalogoItemFalla
  estado_id?: number | null
  prioridad?: CatalogoItemFalla
  prioridad_id?: number | null
  descripcion?: string
  fecha_identificacion?: string
  hora_identificacion?: string
  fecha_ocurrencia?: string | null
  fecha_resolucion?: string | null
  fecha_programada?: string | null
  tipo_solucion?: string | null
  causa_raiz?: string | null
  acciones_correctivas?: string | null
  equipo_afectado?: string | null
  energia_perdida_kwh?: number | null
  sla_limite_horas?: number | null
  sla_limite_dias?: number | null
  sla_cumplido?: boolean | null
  dias_abierta?: number | null
  tiempo_afectacion_horas?: number | null
  asignado_a?: string | null
  registrado_por?: string | null
  resolucion?: string | null
  tipo_resolucion?: string | null
  fotos?: FotoFalla[]
  fotos_urls?: string[]
  seguimientos?: SeguimientoFalla[]
  categoria_codigo?: string | null
  subtipo_codigo?: string | null
  subtipo_detalle?: string | null
  frontera_afecta_medicion?: boolean
  frontera_perdida_comunicacion?: boolean
  notificacion?: boolean
  [clave: string]: unknown
}

/**
 * El cuerpo de `POST`/`PATCH /fallas`: casi todo opcional porque el formulario
 * solo manda lo diligenciado, y `proyecto_id` (edición) o `proyecto_ids` (alta,
 * una falla por proyecto) según el modo.
 */
export type PayloadFalla = Partial<
  Omit<Falla, 'id' | 'proyecto' | 'tipo' | 'estado' | 'prioridad' | 'fotos' | 'seguimientos'>
> & {
  proyecto_id?: number
  proyecto_ids?: number[]
  inversores?: {
    proyecto_inversor_id: number
    nombre?: string | null
    potencia_kw?: number | null
    tipos: string[]
  }[]
}

/**
 * El cuerpo de `POST /fallas/:id/seguimientos`: dos vistas mandan el cambio de
 * estado con nombres distintos (`estado_nuevo` vs `estado_nuevo_id`) — no se
 * unifica acá, cada una manda lo que su propio backend-consumer espera.
 */
export interface PayloadSeguimiento {
  nota?: string
  estado_nuevo?: number | string | null
  estado_nuevo_id?: number | null
}

/** `GET /fallas`: paginado. */
export interface RespuestaListaFallas {
  items: Falla[]
  total?: number
}

export interface FiltrosListaFallas {
  page?: number
  size?: number
  proyecto_id?: number
  estado_id?: number
  prioridad_id?: number
  con_fecha_programada?: boolean
  q?: string
}

/** `POST /fallas/:id/notificar`. */
export interface ResultadoNotificacionFalla {
  ok: boolean
  enviados: string[]
  errores: string[]
  sin_correos: boolean
}

// ── Monitoreo (dashboard de fallas + generación) ──────────────────────────────

/** `GET /monitoreo/resumen-generacion`. */
export interface ResumenGeneracionMonitoreo {
  dates: { fecha: string; kwh_real: number }[]
  [clave: string]: unknown
}

// ── Mapa de operadores y fallas ───────────────────────────────────────────────

export interface OperadorMapa {
  [clave: string]: unknown
}

export interface DatosMapa {
  [clave: string]: unknown
}
