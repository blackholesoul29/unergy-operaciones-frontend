/**
 * La notificación tal como la consume la campana (`~/composables/useNotificaciones`).
 *
 * No verificado contra un contrato del backend (no publica uno): inferido de
 * los dos call sites que ya la leían antes de esta migración
 * (`NotificationsBell.vue` y, con otro subset de campos, el sheet móvil). Los
 * campos que no se muestran hoy no se afirman.
 */
export interface Notificacion {
  id: number
  titulo?: string | null
  mensaje?: string | null
  /** Sin cerrar a una unión: un valor que no reconozcan los mapas de color/icono cae al genérico. */
  severidad?: string | null
  leida: boolean
  created_at: string
}
