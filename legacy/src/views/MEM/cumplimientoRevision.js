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
  const puntos = [...new Set(tramos.flatMap((t) => [t.desde, t.hasta]).filter(Boolean))].sort()
  // Sin ninguna fecha no hay eje sobre el que barrer: todos los tramos se
  // consideran simultáneos (ventanas abiertas).
  if (!puntos.length) return tramos.reduce((s, t) => s + (t.pct || 0), 0)
  let max = 0
  for (const punto of puntos) {
    const suma = tramos.reduce(
      (s, t) =>
        s + ((!t.desde || t.desde <= punto) && (!t.hasta || t.hasta >= punto) ? t.pct || 0 : 0),
      0,
    )
    if (suma > max) max = suma
  }
  return max
}

/** Fracción 0-1 → porcentaje con 2 decimales. Redondear ANTES de comparar
 *  evita que 0.3333×3 se reporte como duplicado por error de coma flotante. */
export function aPorcentaje(fraccion) {
  return Math.round((fraccion || 0) * 10000) / 100
}

/** Identidad de un contrato para contarlo: el código SIC. El NOMBRE no sirve —
 *  un mismo contrato comercial puede estar registrado bajo varios SIC (Nitro
 *  con Cacica: 88747 y 88750), y contarlos por nombre da "1 contrato" con el
 *  200% encima, que es absurdo. */
export function claveContrato(a) {
  return a.codigo_sic || a.contrato || '—'
}

/** ¿Se cruzan dos ventanas en el tiempo? Bordes nulos = abiertos. */
function seSolapan(a, b) {
  return (
    (!a.desde || !b.hasta || a.desde <= b.hasta) && (!b.desde || !a.hasta || b.desde <= a.hasta)
  )
}

/**
 * Un mismo contrato comercial registrado en VARIAS PATAS cuenta una sola vez.
 *
 * MGS 0040 Cacica y MGS 0041 Piloneras están cada una en el contrato Nitro
 * registrado bajo dos códigos SIC —una pata PLG y otra PLC—, y cada pata la
 * inscribe al 100% porque así se firmó. Pero la planta es una sola: leerlo
 * literal da 200% y la reporta duplicada cuando no lo está.
 *
 * Se detecta por estructura, sin depender de que alguien marque nada: mismo
 * contrato, apariciones con SIC distinto (o con modalidad de pago distinta) y
 * ventanas que se cruzan. El 100% de la planta se prorratea entre las patas en
 * proporción a su % registrado: dos al 100% quedan en 50% y 50%.
 *
 * Lo que NO reparte, a propósito:
 * - Contratos comerciales distintos. Ahí sí suman, y si pasan de 100% la planta
 *   está duplicada de verdad.
 * - Patas que no se cruzan en el tiempo: eso es una sucesión (relevada y
 *   reingresada), no un reparto, y prorratearla subestimaría su participación.
 *
 * Es una lectura, no un cambio de dato: el % almacenado no se toca y la
 * atribución de energía en Cumplimiento sigue igual. Cada aparición repartida
 * conserva su valor original en `pctOriginal`.
 */
export function repartirPares(apariciones) {
  const grupos = new Map()
  for (const a of apariciones) {
    const clave = a.contrato || claveContrato(a)
    if (!grupos.has(clave)) grupos.set(clave, [])
    grupos.get(clave).push(a)
  }

  const salida = []
  for (const patas of grupos.values()) {
    const variasPatas =
      new Set(patas.map(claveContrato)).size > 1 ||
      new Set(patas.map((p) => p.modalidad_pago).filter(Boolean)).size > 1
    const cruzadas = patas.some((p, i) => patas.some((q, j) => i !== j && seSolapan(p, q)))
    const total = patas.reduce((s, p) => s + (p.pct || 0), 0)
    if (patas.length < 2 || !variasPatas || !cruzadas || !total) {
      salida.push(...patas)
      continue
    }
    salida.push(
      ...patas.map((p) => ({
        ...p,
        pct: (p.pct || 0) / total,
        pctOriginal: p.pct,
        repartido: true,
      })),
    )
  }
  return salida
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
  // `marcada` es SOLO 'compra en bolsa' (es_duplicado). "Uso del recurso" es
  // otra figura —el cliente está en bolsa y se le paga su generación a precio
  // bolsa, sin garantías— y tiene su propia sección: no es una duplicación.
  // La escala y la ausencia de % se juzgan sobre lo REGISTRADO: prorratear
  // primero escondería un dato corrupto detrás de una fracción sana.
  const escalaRota = apariciones.some((a) => a.pct > 1)
  const sinPct = apariciones.every((a) => !a.pct)
  const maxPct = maxConcurrente(repartirPares(apariciones))

  if (escalaRota && nContratos > 1) {
    return {
      motivo: `En ${nContratos} contratos con % fuera de escala (0-1) — no verificable`,
      maxPct,
      escalaRota,
      sinPct,
    }
  }
  if (aPorcentaje(maxPct) > 100) {
    return {
      motivo: `${aPorcentaje(maxPct)}% a la vez en ${nContratos} contrato(s) · ${aPorcentaje(maxPct - 1)}% se cubre en bolsa`,
      maxPct,
      escalaRota,
      sinPct,
    }
  }
  if (marcada) {
    return { motivo: 'Marcada como compra en bolsa', maxPct, escalaRota, sinPct }
  }
  if (nContratos > 1 && sinPct) {
    return {
      motivo: `En ${nContratos} contratos sin % registrado — no verificable`,
      maxPct,
      escalaRota,
      sinPct,
    }
  }
  return null
}

/** ¿Repartida entre varios contratos sin pasar del 100%? No es un duplicado. */
export function esRepartida({ nContratos, apariciones, marcada }) {
  if (nContratos <= 1 || marcada) return false
  if (apariciones.some((a) => a.pct > 1) || apariciones.every((a) => !a.pct)) return false
  return aPorcentaje(maxConcurrente(repartirPares(apariciones))) <= 100
}
