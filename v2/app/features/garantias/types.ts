/**
 * Tipos del slice de garantías.
 *
 * Las formas de abajo están verificadas contra `ProyeccionesView.vue`: son los
 * campos que la vista lee de verdad. El backend puede devolver más; lo que se
 * afirma aquí es lo que se usa.
 */

/** Una ventana mensual de la proyección de garantías. */
export interface VentanaProyeccion {
  /** Identificador de la ventana, `${anio}-${mes}`. Es la key de la lista. */
  clave: string
  anio: number
  mes: number
  neto_mwh: number
  valor_energia: number
  valor_plantas_nuevas: number
  costo_regulatorio: number
  regulatorio_periodo: string | null
  garantia_total: number
  /** Lo ya pagado del período. Editable en línea. */
  pagado: number | null
  /** `pagado − garantia_total`. La vista lo recalcula al guardar para no parpadear. */
  saldo: number
}

export interface Proyecciones {
  fecha_corte: string
  precio_bolsa_cop_kwh: number | null
  ventanas: VentanaProyeccion[]
}

/** Una foto guardada de la proyección, para comparar contra lo que pasó. */
export interface SnapshotGarantias {
  id: number
  clave: string
  anio: number
  mes: number
  fecha_corte: string
  neto_mwh: number
  precio_bolsa: number
  garantia_total: number
}

export interface HistorialGarantias {
  snapshots: SnapshotGarantias[]
}

/**
 * Los dos parámetros simulables de la proyección: cuántas plantas nuevas entran
 * y cuánto genera cada una.
 */
export interface ParametrosProyeccion {
  plantasNuevas?: number
  kwhPlantaNueva?: number
}

export interface PagoGarantia {
  anio: number
  mes: number
  valor: number
}
