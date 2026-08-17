/**
 * Reglas de la pestaña "Revisión del mes" de /mem/cumplimiento.
 *
 * Viven aparte del SFC porque son la parte del feature que se puede razonar y
 * probar sola: decidir si una planta está DUPLICADA no es contar en cuántos
 * contratos aparece.
 */

/**
 * Mayor valor que alcanza la SUMA de participaciones de una planta en un mismo
 * instante del mes.
 *
 * Estar en dos contratos no es estar duplicada: una planta al 50% en uno y 50%
 * en otro tiene su 100% REPARTIDO. Duplicado es lo que excede el 100% a la vez,
 * y ese excedente es el que se cubre comprando en bolsa.
 *
 * Tampoco lo es sucederse en el tiempo: 100% del 1 al 15 en un contrato y 100%
 * del 16 al 31 en otro nunca coinciden, así que el máximo sigue siendo 100%.
 *
 * Barrido por los extremos de los tramos: en intervalos cerrados el máximo
 * siempre se alcanza en el inicio o el fin de alguno de ellos.
 *
 * @param {Array<{desde: string|null, hasta: string|null, pct: number|null}>} tramos
 *        Fechas ISO (yyyy-mm-dd) inclusivas; `pct` como fracción 0-1. Un borde
 *        nulo es una ventana abierta por ese lado.
 * @returns {number} fracción (1 = 100%)
 */
export function maxConcurrente(tramos) {
  const puntos = [...new Set(tramos.flatMap(t => [t.desde, t.hasta]).filter(Boolean))].sort()
  // Sin ninguna fecha no hay eje sobre el que barrer: todos los tramos se
  // consideran simultáneos (ventanas abiertas).
  if (!puntos.length) return tramos.reduce((s, t) => s + (t.pct || 0), 0)
  let max = 0
  for (const punto of puntos) {
    const suma = tramos.reduce((s, t) =>
      s + ((!t.desde || t.desde <= punto) && (!t.hasta || t.hasta >= punto) ? (t.pct || 0) : 0), 0)
    if (suma > max) max = suma
  }
  return max
}

/** Fracción 0-1 → porcentaje con 2 decimales. Redondear ANTES de comparar
 *  evita que 0.3333×3 se reporte como duplicado por error de coma flotante. */
export function aPorcentaje(fraccion) {
  return Math.round((fraccion || 0) * 10000) / 100
}

/**
 * Reparto PLG/PLC.
 *
 * Hay plantas repartidas entre dos contratos de modalidad de pago distinta —una
 * PLG y otra PLC— que entre los dos cubren su 100% (MGS 0040 Cacica, MGS 0041
 * Piloneras). Cada contrato la registra al 100% porque así se firmó, pero la
 * planta es una sola: leerlo literal da 200% y la reporta duplicada.
 *
 * Aquí el par se lee como lo que es: se prorratea el 100% de la planta entre las
 * apariciones marcadas, en proporción a su % registrado. Dos contratos al 100%
 * quedan en 50% y 50%. Las apariciones SIN marcar no se tocan: si además de la
 * pareja hay un tercer contrato, ese sí suma encima y la planta sí sale
 * duplicada.
 *
 * Solo reparte cuando hay al menos DOS modalidades distintas: dos contratos
 * marcados los dos PLG no son un par, son dos compromisos reales.
 *
 * Es una lectura, no un cambio de dato: el % almacenado no se toca y la
 * atribución de energía en Cumplimiento sigue igual. Cada aparición repartida
 * conserva su valor original en `pctOriginal`.
 */
export function repartirPlgPlc(apariciones) {
  const marcadas = apariciones.filter(a => a.modalidad_pago)
  if (new Set(marcadas.map(a => a.modalidad_pago)).size < 2) return apariciones
  const total = marcadas.reduce((s, a) => s + (a.pct || 0), 0)
  if (!total) return apariciones
  return apariciones.map(a => a.modalidad_pago
    ? { ...a, pct: (a.pct || 0) / total, pctOriginal: a.pct, repartido: true }
    : a)
}

/**
 * Por qué una planta cuenta como duplicada este mes, o null si no lo es.
 *
 * Se separan los casos "no verificable" en vez de callarlos: una planta en
 * varios contratos sin % registrado, o con % fuera de la escala 0-1 (dato que
 * dejó el formulario viejo), también hay que revisarla — pero no se puede
 * afirmar que esté duplicada.
 */
export function motivoDuplicada({ nContratos, apariciones, marcada }) {
  // La escala y la ausencia de % se juzgan sobre lo REGISTRADO: prorratear
  // primero escondería un dato corrupto detrás de una fracción sana.
  const escalaRota = apariciones.some(a => a.pct > 1)
  const sinPct = apariciones.every(a => !a.pct)
  const maxPct = maxConcurrente(repartirPlgPlc(apariciones))

  if (escalaRota && nContratos > 1) {
    return { motivo: `En ${nContratos} contratos con % fuera de escala (0-1) — no verificable`, maxPct, escalaRota, sinPct }
  }
  if (aPorcentaje(maxPct) > 100) {
    return {
      motivo: `${aPorcentaje(maxPct)}% a la vez en ${nContratos} contrato(s) · ${aPorcentaje(maxPct - 1)}% se cubre en bolsa`,
      maxPct, escalaRota, sinPct,
    }
  }
  if (marcada) {
    return { motivo: 'Marcada en su contrato', maxPct, escalaRota, sinPct }
  }
  if (nContratos > 1 && sinPct) {
    return { motivo: `En ${nContratos} contratos sin % registrado — no verificable`, maxPct, escalaRota, sinPct }
  }
  return null
}

/** ¿Repartida entre varios contratos sin pasar del 100%? No es un duplicado. */
export function esRepartida({ nContratos, apariciones, marcada }) {
  if (nContratos <= 1 || marcada) return false
  if (apariciones.some(a => a.pct > 1) || apariciones.every(a => !a.pct)) return false
  return aPorcentaje(maxConcurrente(repartirPlgPlc(apariciones))) <= 100
}
