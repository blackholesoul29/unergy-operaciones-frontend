/**
 * Helpers compartidos del módulo Retos Q.
 *
 * El semáforo lo calcula el backend (campo `estado` del contrato); aquí solo se
 * traduce a color. Los hex gráficos son los de marca; para texto pequeño sobre
 * fondo tintado se usa la variante oscura de la misma tinta, porque los
 * originales no pasan AA a 10-12px (mismo criterio que `.be-chip-ok` en Balance).
 */

export const ESTADOS = {
  sin_datos: { grafico: '#9b8fb0', texto: '#6b5a8a', fondo: 'rgba(155,143,176,0.14)', label: 'Sin datos' },
  en_riesgo: { grafico: '#D64455', texto: '#B0364A', fondo: 'rgba(214,68,85,0.12)',  label: 'En riesgo' },
  atencion:  { grafico: '#CA8A04', texto: '#A16207', fondo: 'rgba(202,138,4,0.14)',  label: 'Atención'  },
  cumple:    { grafico: '#10B981', texto: '#047857', fondo: 'rgba(16,185,129,0.13)', label: 'Cumple'    },
  excede:    { grafico: '#14B8A6', texto: '#0F766E', fondo: 'rgba(20,184,166,0.14)', label: 'Excede'    },
}

const FALLBACK = ESTADOS.sin_datos

export function estadoColor(estado) {
  return (ESTADOS[estado] || FALLBACK).grafico
}

/** Estilo inline listo para un chip: `:style="estadoBadge(m.estado)"` */
export function estadoBadge(estado) {
  const e = ESTADOS[estado] || FALLBACK
  return { color: e.texto, background: e.fondo }
}

export function estadoLabel(estado) {
  return (ESTADOS[estado] || FALLBACK).label
}

/** Estados del periodo del trimestre (no del cumplimiento). */
export const PERIODOS = {
  proximo:  { label: 'Próximo',  color: '#6b5a8a', fondo: 'rgba(155,143,176,0.14)' },
  en_curso: { label: 'En curso', color: '#6D28D9', fondo: 'rgba(145,91,216,0.12)'  },
  cerrado:  { label: 'Cerrado',  color: '#6b5a8a', fondo: 'rgba(44,32,57,0.07)'    },
}

export function periodoBadge(periodo) {
  const p = PERIODOS[periodo] || PERIODOS.proximo
  return { color: p.color, background: p.fondo }
}

export function periodoLabel(periodo) {
  return (PERIODOS[periodo] || PERIODOS.proximo).label
}

// ── Formato numérico ────────────────────────────────────────────────────────
// Locale es-CO: miles con punto, decimal con coma.

/** Número crudo con los decimales de la métrica. Sin unidad. */
export function fmtNumero(valor, decimales = 0) {
  if (valor === null || valor === undefined || valor === '') return null
  const n = Number(valor)
  if (!Number.isFinite(n)) return null
  const d = Math.min(Math.max(Number(decimales) || 0, 0), 4)
  return n.toLocaleString('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d })
}

/**
 * Valor formateado con unidad. `%` va pegado, el resto separado por espacio.
 * Devuelve `vacio` (por defecto guion largo) cuando no hay dato.
 */
export function fmtValor(valor, decimales = 0, unidad = '', vacio = '—') {
  const base = fmtNumero(valor, decimales)
  if (base === null) return vacio
  const u = (unidad || '').trim()
  if (!u) return base
  return u === '%' ? `${base}%` : `${base} ${u}`
}

/** Porcentajes de avance/cumplimiento: 1 decimal. */
export function fmtPct(valor, decimales = 1) {
  const base = fmtNumero(valor, decimales)
  return base === null ? '—' : `${base}%`
}

/** Versión entera, para espacios apretados (anillo, columna % de la matriz). */
export function fmtPctEntero(valor) {
  if (valor === null || valor === undefined) return '—'
  const n = Number(valor)
  if (!Number.isFinite(n)) return '—'
  return `${Math.round(n)}%`
}

/**
 * Parsea lo que el usuario escribe en una celda.
 * Acepta "1.240,5" (es-CO), "1240.5" (crudo), espacios y signo.
 * Devuelve `null` si está vacío, `NaN` si es basura — el llamador distingue.
 */
export function parseValor(texto) {
  if (texto === null || texto === undefined) return null
  const limpio = String(texto).trim().replace(/\s/g, '')
  if (limpio === '') return null

  let normalizado = limpio
  const tieneComa = limpio.includes(',')
  const tienePunto = limpio.includes('.')

  if (tieneComa && tienePunto) {
    // Formato es-CO completo: el punto es separador de miles.
    normalizado = limpio.replace(/\./g, '').replace(',', '.')
  } else if (tieneComa) {
    normalizado = limpio.replace(',', '.')
  } else if (tienePunto) {
    // "1.240" es ambiguo. Se trata como miles solo si los grupos son de 3 dígitos.
    const partes = limpio.replace('-', '').split('.')
    const esMiles = partes.length > 1 && partes.slice(1).every(p => p.length === 3)
    if (esMiles) normalizado = limpio.replace(/\./g, '')
  }

  const n = Number(normalizado)
  return Number.isFinite(n) ? n : NaN
}

/** Fecha ISO (`2026-07-01`) a `1 jul 2026`, sin depender de la zona horaria. */
export function fmtFechaCorta(iso) {
  if (!iso) return '—'
  const [a, m, d] = String(iso).split('-').map(Number)
  if (!a || !m || !d) return '—'
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${d} ${MESES[m - 1]} ${a}`
}

/** Rango de fechas de un trimestre: `1 jul – 30 sep 2026`. */
export function fmtRango(inicioIso, finIso) {
  if (!inicioIso || !finIso) return '—'
  const [ai, mi, di] = String(inicioIso).split('-').map(Number)
  const [af, mf, df] = String(finIso).split('-').map(Number)
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const izq = `${di} ${MESES[mi - 1]}${ai !== af ? ` ${ai}` : ''}`
  return `${izq} – ${df} ${MESES[mf - 1]} ${af}`
}

export const TIPOS_AGREGACION = [
  { value: 'suma',     label: 'Suma',           ayuda: 'El consolidado es la suma de las semanas' },
  { value: 'promedio', label: 'Promedio',       ayuda: 'El consolidado es el promedio de las semanas con dato' },
  { value: 'ultimo',   label: 'Último valor',   ayuda: 'Vale la última semana registrada' },
  { value: 'maximo',   label: 'Máximo',         ayuda: 'Vale la semana más alta' },
]

export const DIRECCIONES = [
  { value: 'mayor_mejor', label: 'Más es mejor'  },
  { value: 'menor_mejor', label: 'Menos es mejor' },
]
