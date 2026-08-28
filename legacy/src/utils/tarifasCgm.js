/**
 * Tarifas de un contrato de representación CGM y su indexación.
 *
 * Vive acá y no en cada vista porque lo usan dos pantallas que tienen que decir
 * lo mismo: el listado de /servicios-unificado?vista=servicios&srv=representacion
 * y la ficha en /proyectos/{id}/representacion. Si divergen, la tabla muestra
 * 6.63 y al entrar al contrato aparece otro número. Mismo motivo por el que
 * `estadoVigenciaPPA` no vive dentro de una vista.
 *
 * El JSONB `indexacion_cgm` / `indexacion_representacion` guarda una fila por
 * aniversario: `{año, ipc, valor, esBase}` — con la clave acentuada y `esBase`
 * en camelCase, que es como las escribió el seed. La fecha exacta del
 * aniversario NO se persiste: se deriva de `fecha_firma_contrato` manteniendo
 * mes y día, igual que hace `_anniversary_date` en el backend.
 */

// La clave llega como `año` desde el seed, pero se aceptan las variantes sin
// tilde por si algún registro se escribió de otra forma.
export function anioDeFila(fila) {
  return Number(fila?.año ?? fila?.anio ?? fila?.year) || null
}

/** Filas ordenadas por año. Devuelve [] ante null o cualquier cosa que no sea lista. */
export function ordenarIndexacion(filas) {
  if (!Array.isArray(filas)) return []
  return [...filas].sort((a, b) => (anioDeFila(a) || 0) - (anioDeFila(b) || 0))
}

/**
 * Fecha del aniversario de una fila, como texto comparable (YYYY-MM-DD).
 * Sin fecha de firma solo se puede saber el año.
 */
export function fechaAniversario(fila, fechaFirma) {
  const a = anioDeFila(fila)
  if (!a) return ''
  const firma = fechaFirma ? String(fechaFirma) : ''
  return firma.length >= 10 ? `${a}-${firma.slice(5, 10)}` : String(a)
}

const hoyISO = () => new Date().toISOString().slice(0, 10)

/**
 * Índice de la fila vigente: el aniversario más reciente que ya pasó. -1 si ninguno.
 *
 * Con fecha de firma se compara la fecha completa del aniversario; sin ella solo
 * se puede comparar el año. Son dos ramas EXCLUYENTES y no un `||`: tenerlas
 * unidas hacía que `"2026" <= "2026"` diera siempre verdadero y el año en curso
 * contara como alcanzado aunque su aniversario fuera posterior a hoy. Un
 * contrato firmado un 20 de diciembre mostraba en agosto la tarifa indexada de
 * diciembre, que todavía no se cobra.
 */
export function indiceVigente(filas, fechaFirma, hoy = hoyISO()) {
  const conFirma = !!fechaFirma && String(fechaFirma).length >= 10
  let idx = -1
  for (let i = 0; i < filas.length; i++) {
    const alcanzado = conFirma
      ? fechaAniversario(filas[i], fechaFirma) <= hoy
      : String(anioDeFila(filas[i])) <= hoy.slice(0, 4)
    if (alcanzado) idx = i
  }
  return idx
}

/**
 * Tarifa que aplica hoy. Cae a `tarifaBase` cuando no hay indexación cargada,
 * porque un contrato recién capturado tiene la tarifa del contrato y todavía
 * ninguna fila de aniversario.
 */
export function tarifaVigente(indexacion, fechaFirma, tarifaBase = null, hoy = hoyISO()) {
  const filas = ordenarIndexacion(indexacion)
  const i = indiceVigente(filas, fechaFirma, hoy)
  const valor = i >= 0 ? filas[i]?.valor : null
  const usada = valor != null ? valor : tarifaBase
  return {
    valor: usada != null ? Number(usada) : null,
    anio: i >= 0 ? anioDeFila(filas[i]) : null,
    // `esBase` distingue "esta es la tarifa inicial del contrato" de "esta ya
    // pasó por una o más indexaciones", que es lo que interesa saber al leer un
    // número suelto en una tabla.
    esBase: i >= 0 ? !!filas[i]?.esBase : true,
    // Cuando no había indexación y se usó la tarifa del contrato.
    desdeBase: valor == null && tarifaBase != null,
    aniversarios: filas.length,
  }
}

/** Estado de una fila frente a la vigente: ya pasó, es la actual, o está por venir. */
export function estadoFilaIndexacion(filas, i, fechaFirma, hoy = hoyISO()) {
  const v = indiceVigente(filas, fechaFirma, hoy)
  if (i < v) return 'pagado'
  if (i === v) return 'vigente'
  return 'pendiente'
}

/** Formato de una tarifa en $/kWh: sin decimales si es entera, 4 si no. */
export function fmtTarifa(v) {
  if (v == null || v === '') return '—'
  const n = Number(v)
  if (!Number.isFinite(n)) return '—'
  return n.toFixed(n % 1 === 0 ? 0 : 4)
}

/** La tarifa admin se guarda como fracción (0.038) y se lee como porcentaje. */
export function fmtTarifaAdmin(v) {
  if (v == null || v === '') return '—'
  const n = Number(v)
  return Number.isFinite(n) ? `${(n * 100).toFixed(2)} %` : '—'
}
