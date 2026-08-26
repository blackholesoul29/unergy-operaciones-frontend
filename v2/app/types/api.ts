/**
 * Las formas que atraviesan todos los slices al hablar con la API de
 * operaciones. No describen ninguna entidad: describen cómo viajan.
 */

/**
 * Los identificadores del backend son enteros. Va como alias y no como `number`
 * suelto para que un `Proyecto['id']` se distinga de una potencia o de un
 * porcentaje al leer una firma.
 */
export type Id = number

/** Fecha sin hora, `YYYY-MM-DD`. Es lo que devuelven los campos `fecha_*`. */
export type FechaISO = string

/** Marca de tiempo completa, `YYYY-MM-DDTHH:mm:ss±hh:mm`. */
export type FechaHoraISO = string

/**
 * La respuesta paginada del backend. Aparece en 65 sitios, casi siempre leída
 * como `data.items ?? []` porque algunos endpoints devuelven el array pelado
 * cuando no paginan — de ahí que `total` y `page` sean opcionales.
 */
export interface Paginado<T> {
  items: T[]
  total?: number
  page?: number
  size?: number
}

/**
 * Un endpoint que puede responder paginado **o** con el array directo. Es el
 * patrón real: las vistas hacen `Array.isArray(data) ? data : (data.items ?? [])`.
 * Tenerlo tipado obliga a hacer esa comprobación en vez de olvidarla.
 */
export type ListaODirecto<T> = T[] | Paginado<T>

/** Normaliza las dos formas a un array. */
export function comoLista<T>(respuesta: ListaODirecto<T> | null | undefined): T[] {
  if (Array.isArray(respuesta)) return respuesta
  return respuesta?.items ?? []
}

/** El cuerpo de error de FastAPI: `{ "detail": "…" }`. */
export interface ErrorApi {
  detail?: string
}

/**
 * Una opción de `<Select>`: etiqueta visible y valor que viaja.
 *
 * Los catálogos del dominio se declaran con esta forma cuando la etiqueta no se
 * puede derivar del valor (`'en_desarrollo'` → «En desarrollo» sí; `'AGPE'` →
 * «Autogenerador a pequeña escala» no).
 */
export interface Opcion<T = string> {
  value: T
  label: string
}
