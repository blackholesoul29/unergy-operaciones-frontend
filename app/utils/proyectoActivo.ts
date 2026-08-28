export interface ProyectoConVigencia {
  fecha_fin_representacion?: string | null
}

/**
 * Devuelve true si el proyecto sigue activo (bajo representación) en el mes/año indicados.
 * Un proyecto sin fecha_fin_representacion se considera siempre activo.
 *
 * @param mes - 1-indexed
 */
export function proyectoActivoEnMes(
  proyecto: ProyectoConVigencia | null | undefined,
  anio: number,
  mes: number,
): boolean {
  if (!proyecto?.fecha_fin_representacion) return true
  const fin = new Date(proyecto.fecha_fin_representacion)
  return new Date(anio, mes - 1) <= fin
}
