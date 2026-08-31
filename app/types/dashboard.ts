/**
 * `GET /dashboard/kpis` — lo consumen `alertas` y `dashboard`, de ahí que viva
 * aquí y no en ninguno de los dos slices.
 *
 * Forma verificada contra `AlertasView.vue` y `DashboardView.vue`: el backend
 * devuelve más campos de los que se leen hoy.
 */
export interface KpisOperativos {
  fallas_abiertas?: number
  fallas_por_prioridad?: {
    critica?: number
    [clave: string]: unknown
  }
  alarmas_mgs?: number
  [clave: string]: unknown
}
