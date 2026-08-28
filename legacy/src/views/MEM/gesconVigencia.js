/**
 * Lógica compartida por los formularios asistidos de GESCON (modificación y
 * terminación): a partir de las filas que ya trae la tabla, resolver qué
 * contratos existen y qué plantas están inscritas en un SIC a una fecha dada.
 *
 * Espeja las reglas del backend (`_versiones_vigentes_sic` en
 * app/api/v1/asic.py). El gotcha que justifica este módulo: `es_version_vigente`
 * significa "última versión de su SIC", NO "en curso" — una fila con fecha_fin
 * pasada sigue siendo la última versión. Sin descartar por fecha, una planta
 * que ya salió del contrato reaparece como inscrita.
 */

const TIPOS_CONTRATO = ['registro', 'modificacion']

/** ¿Es la versión vigente de su SIC? (registro o modificación, no terminación) */
export function esVersionDeContrato(r) {
  return TIPOS_CONTRATO.includes(r.tipo_solicitud) && r.es_version_vigente
}

/** Contratos elegibles para modificar o terminar: los que tienen versión vigente. */
export function opcionesSicVigentes(rows) {
  const porSic = new Map()
  for (const r of rows) {
    if (!r.codigo_sic_contrato || !esVersionDeContrato(r)) continue
    const acc = porSic.get(r.codigo_sic_contrato) || {
      sic: r.codigo_sic_contrato,
      contrato_interno: r.contrato_interno,
      nombre_interno: r.nombre_interno,
      _plantas: [],
    }
    if (r.planta_nombre && !acc._plantas.includes(r.planta_nombre)) acc._plantas.push(r.planta_nombre)
    porSic.set(r.codigo_sic_contrato, acc)
  }
  return [...porSic.values()]
    .map(o => ({
      ...o,
      plantas: o._plantas.join(' · ') || 'sin planta',
      _label: `${o.sic} — ${o.contrato_interno || ''} ${o.nombre_interno || ''} ${o._plantas.join(' ')}`.trim(),
    }))
    .sort((a, b) => a.sic.localeCompare(b.sic, undefined, { numeric: true }))
}

/**
 * Plantas inscritas en un SIC. Si se pasa `fechaIso`, deja solo las que siguen
 * en vigor ese día; si a esa fecha ya no quedaba ninguna (p. ej. se está
 * extendiendo un contrato vencido), cae a las últimas versiones — mismo
 * fallback que el backend.
 */
export function plantasInscritas(rows, codigoSic, fechaIso) {
  if (!codigoSic) return []
  const vigentes = rows.filter(r => r.codigo_sic_contrato === codigoSic && esVersionDeContrato(r))
  if (!fechaIso) return vigentes
  const enVigor = vigentes.filter(r => {
    const fin = r.fecha_fin_efectiva || r.fecha_fin
    return !fin || fin >= fechaIso
  })
  return enVigor.length ? enVigor : vigentes
}

/** Fila de la que se hereda la identidad del contrato (contrato interno, etc.). */
export function filaIdentidad(inscritas) {
  return inscritas.find(r => (r.contrato_interno || '').trim()) || inscritas[0] || {}
}

// ── Formato ───────────────────────────────────────────────────────────────
export function toIso(v) {
  if (!v) return null
  if (typeof v === 'string') return v.slice(0, 10)
  if (v instanceof Date) {
    const mes = String(v.getMonth() + 1).padStart(2, '0')
    const dia = String(v.getDate()).padStart(2, '0')
    return `${v.getFullYear()}-${mes}-${dia}`
  }
  return null
}

export function parseIso(v) { return v ? new Date(v + 'T12:00:00') : null }

export function fmtFecha(d) {
  if (!d) return 'sin fecha'
  const [y, m, day] = String(d).slice(0, 10).split('-')
  return `${day}/${m}/${y}`
}

/** porcentaje_despacho se almacena como fracción 0-1; se muestra ×100. */
export function pctTexto(v) {
  if (v == null || v === '') return '—'
  const n = Number(v) * 100
  return Number.isNaN(n) ? '—' : `${Number.isInteger(n) ? n : Number(n.toFixed(2))}%`
}

export function modalidadTexto(r) {
  return r.uso_del_recurso ? 'Uso del recurso' : r.es_duplicado ? 'Compra en bolsa' : 'Normal'
}
