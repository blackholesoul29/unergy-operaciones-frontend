/**
 * La frontera comercial: el punto de medida registrado ante XM.
 *
 * Es la unidad de medición del mercado — sin frontera, la energía de una planta
 * no se puede transar ni liquidar. Vive en este slice y no en `~/types/` porque
 * fuera de aquí solo se la nombra por su `id`.
 *
 * **Verificado contra `FronterasView.vue`.**
 */
import type { FechaISO, Id } from '~/types/api'

/**
 * Cada frontera lleva medidor **principal** y **respaldo**: si el principal deja
 * de reportar, XM lee el otro. Los dos tienen la misma forma, de ahí el sufijo.
 */
export interface CanalMedidor {
  nro_serie: string | null
  ip_modem: string | null
  puerto_modem: number | null
  password_medidor: string | null
  canal_comunicacion: string | null
  tipo_extraccion: string | null
}

export interface Frontera {
  id: Id
  /** El código con el que XM la conoce. Es su identidad ante el mercado. */
  codigo_frontera: string
  nombre_frontera: string | null
  estado: string | null

  proyecto_id: Id | null
  /** Desnormalizado por el backend para poder listar sin una segunda consulta. */
  proyecto_nombre: string | null

  operador_red_id: Id | null
  operador_red: string | null
  /** Quién representa la frontera ante el mercado. */
  operador_comercial: string | null

  municipio: string | null
  capacidad_efectiva_mw: number | null
  fecha_registro_asic: FechaISO | null

  /** Si está inyectando ahora mismo. Lo calcula el backend contra el monitoreo. */
  generando_actual: boolean | null

  // ── Medidor principal ─────────────────────────────────────────────────────
  nro_serie_med_ppal: string | null
  ip_modem_ppal: string | null
  puerto_modem_ppal: number | null
  password_medidor_ppal: string | null
  canal_comunicacion_ppal: string | null
  tipo_extraccion_ppal: string | null

  // ── Medidor de respaldo ───────────────────────────────────────────────────
  nro_serie_med_resp: string | null
  ip_modem_resp: string | null
  puerto_modem_resp: number | null
  password_medidor_resp: string | null
  canal_comunicacion_resp: string | null
  tipo_extraccion_resp: string | null
}
