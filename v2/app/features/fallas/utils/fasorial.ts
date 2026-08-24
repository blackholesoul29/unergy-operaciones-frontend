/* =========================================================================
   FASORIAL.TS — Diagrama fasorial con ángulos REALES para medidores trifásicos
   -------------------------------------------------------------------------
   Calcula el ángulo de cada corriente a partir de los datos del medidor
   (vp, cp, app, irpp, erpp) en lugar de asumir PF = 1, y dibuja el diagrama
   en SVG con diagnóstico automático de errores de cableado de CTs.

   Uso:
     renderFasorial(document.getElementById('miDiv'), datosMedidor, {
       titulo: 'MGS JOROPO PRINCIPAL',
       marca: 'Unergy'
     });

   Sin dependencias.
   ========================================================================= */

type NumLike = number | string | null | undefined

export interface FasorialMedidorDatos {
  vp1?: NumLike
  vp2?: NumLike
  vp3?: NumLike
  cp1?: NumLike
  cp2?: NumLike
  cp3?: NumLike
  app1?: NumLike
  app2?: NumLike
  app3?: NumLike
  irpp1?: NumLike
  irpp2?: NumLike
  irpp3?: NumLike
  erpp1?: NumLike
  erpp2?: NumLike
  erpp3?: NumLike
  timestamp?: number | null
  meter?: string | number | null
}

export interface FasorialOpciones {
  titulo?: string
  marca?: string
  angulosVoltaje?: Record<number, number>
  umbralAlerta?: number
  sMinima?: number
}

export interface FaseCalculada {
  fase: 1 | 2 | 3
  v: number
  i: number
  p: number
  s: number
  pfReal: number
  desfase: number
  vAng: number
  iAng: number
  valido: boolean
  qCoherente: boolean
  alerta: boolean
}

export interface Diagnostico {
  nivel: 'info' | 'ok' | 'alerta'
  texto: string
}

export interface RenderFasorialResultado {
  fases: FaseCalculada[]
  diagnostico: Diagnostico
}

/* ---------- 1. CÁLCULO DE FASORES ---------- */

// Ángulos de referencia de los voltajes (convención del diagrama original)
const VANG: Record<number, number> = { 1: 90, 2: 330, 3: 210 }

// Umbral de desfase (grados) para marcar alerta de cableado
const UMBRAL_ALERTA = 15

// Potencia aparente mínima por fase (kVA) para que el ángulo sea confiable
// (de noche o con generación mínima el ángulo no significa nada)
const S_MINIMA_KVA = 2

export function calcularFasores(
  d: FasorialMedidorDatos,
  opciones: FasorialOpciones = {},
): FaseCalculada[] {
  const vang = opciones.angulosVoltaje || VANG
  const umbral = opciones.umbralAlerta != null ? opciones.umbralAlerta : UMBRAL_ALERTA
  const sMin = opciones.sMinima != null ? opciones.sMinima : S_MINIMA_KVA

  const fases: FaseCalculada[] = []
  for (let f = 1; f <= 3; f++) {
    const v = num(d[`vp${f}` as keyof FasorialMedidorDatos])
    const i = num(d[`cp${f}` as keyof FasorialMedidorDatos])
    const p = Math.abs(num(d[`app${f}` as keyof FasorialMedidorDatos])) // kW (negativa al exportar)
    const s = (v * i) / 1000 // kVA
    const valido = s >= sMin

    let pf = 1
    let theta = 0
    let qCoherente = true
    if (valido && s > 0) {
      pf = Math.min(p / s, 1)
      theta = (Math.acos(pf) * 180) / Math.PI // magnitud del desfase
      const qImp = num(d[`irpp${f}` as keyof FasorialMedidorDatos]) // importa reactivo -> atrasa
      const qExp = num(d[`erpp${f}` as keyof FasorialMedidorDatos]) // exporta reactivo -> adelanta
      if (qImp > qExp) theta = -theta
      // Verificación cruzada: Q calculado vs Q reportado
      const qCalc = Math.sqrt(Math.max(s * s - p * p, 0))
      const qRep = Math.max(qImp, qExp)
      qCoherente = qRep === 0 || Math.abs(qCalc - qRep) / Math.max(qCalc, qRep, 1) < 0.25
    }

    fases.push({
      fase: f as 1 | 2 | 3,
      v,
      i,
      p,
      s: round(s, 2),
      pfReal: round(pf, 3),
      desfase: round(theta, 1),
      vAng: vang[f]!,
      iAng: norm360(vang[f]! + theta),
      valido,
      qCoherente: valido ? qCoherente !== false : true,
      alerta: valido && Math.abs(theta) > umbral,
    })
  }
  return fases
}

/* ---------- 2. DIAGNÓSTICO AUTOMÁTICO ---------- */

function diagnosticar(fases: FaseCalculada[]): Diagnostico {
  const conAlerta = fases.filter((x) => x.alerta)
  const sinDatos = fases.filter((x) => !x.valido)

  if (sinDatos.length === 3) {
    return {
      nivel: 'info',
      texto: 'Generación insuficiente para evaluar ángulos (medidor en vacío o de noche).',
    }
  }
  if (conAlerta.length === 0) {
    return {
      nivel: 'ok',
      texto: 'Conexión correcta: las tres corrientes alineadas con sus voltajes (PF ≈ 1).',
    }
  }

  // Firmas típicas de error de cableado según |desfase|
  const hints = conAlerta.map((x) => {
    const a = Math.abs(x.desfase)
    let firma: string
    if (a > 165) firma = 'polaridad de CT invertida'
    else if (a > 100 && a < 140) firma = 'CT de otra fase (intercambio)'
    else if (a > 45 && a < 75) firma = 'CT de otra fase + polaridad invertida'
    else firma = 'desfase anómalo'
    return `L${x.fase}: ${x.desfase}° (${firma}, PF real ${x.pfReal})`
  })

  return {
    nivel: 'alerta',
    texto:
      `POSIBLE ERROR DE CABLEADO DE CTs — ${hints.join(' · ')}` +
      '. La potencia registrada en esas fases está subestimada. Verificar bornera contra el diagrama de conexión del medidor.',
  }
}

/* ---------- 3. RENDER SVG ---------- */

interface ColorFase {
  v: string
  i: string
  nombre: string
}

const COLORES: Record<number, ColorFase> = {
  1: { v: '#ef5350', i: '#f8a19e', nombre: 'R' },
  2: { v: '#2fbf71', i: '#95e0b8', nombre: 'S' },
  3: { v: '#4d8fe0', i: '#a3c6f0', nombre: 'T' },
}

export function renderFasorial(
  container: HTMLElement,
  datos: FasorialMedidorDatos,
  opciones: FasorialOpciones = {},
): RenderFasorialResultado {
  const fases = calcularFasores(datos, opciones)
  const diag = diagnosticar(fases)

  const W = 720
  const H = 780
  const cx = W / 2
  const cy = 360
  const rV = 250 // radio de los fasores de voltaje
  const maxV = Math.max(...fases.map((x) => x.v)) || 1
  const maxI = Math.max(...fases.map((x) => x.i)) || 1

  const s: string[] = []
  s.push(
    `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" ` +
      'style="width:100%;max-width:760px;display:block;background:#0b0f1a;border-radius:12px;' +
      'font-family:Segoe UI,Roboto,Arial,sans-serif">',
  )
  s.push(
    '<defs><marker id="fzArr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" ' +
      'markerHeight="6" orient="auto-start-reverse">' +
      '<path d="M1 1L9 5L1 9Z" fill="context-stroke"/></marker></defs>',
  )

  // Título
  s.push(
    txt(cx, 40, esc(opciones.titulo || `Medidor ${datos.meter || ''}`), {
      size: 24,
      weight: 700,
      fill: '#f5f7fa',
      anchor: 'middle',
    }),
  )
  s.push(
    txt(cx, 66, 'Diagrama fasorial — ángulos reales calculados de P, S y Q', {
      size: 13,
      fill: '#7d90ad',
      anchor: 'middle',
    }),
  )

  // Rejilla polar
  ;[0.33, 0.66, 1].forEach((k) => {
    s.push(
      `<circle cx="${cx}" cy="${cy}" r="${rV * k}" fill="none" stroke="#26314a" stroke-width="1" stroke-dasharray="3 5"/>`,
    )
  })
  for (let g = 0; g < 360; g += 30) {
    const pE = polar(cx, cy, rV, g)
    s.push(
      `<line x1="${cx}" y1="${cy}" x2="${pE.x}" y2="${pE.y}" stroke="#1b2338" stroke-width="1"/>`,
    )
    const pL = polar(cx, cy, rV + 18, g)
    s.push(txt(pL.x, pL.y + 4, `${g}°`, { size: 10, fill: '#4a5a75', anchor: 'middle' }))
  }

  // Fasores: primero voltajes (sólidos), luego corrientes (punteados)
  fases.forEach((fx) => {
    const c = COLORES[fx.fase]!
    const lv = rV * (fx.v / maxV)
    const pv = polar(cx, cy, lv, fx.vAng)
    s.push(
      `<line x1="${cx}" y1="${cy}" x2="${pv.x}" y2="${pv.y}" stroke="${c.v}" stroke-width="3.5" marker-end="url(#fzArr)"/>`,
    )
    const pl = polar(cx, cy, lv + 44, fx.vAng)
    s.push(caja(pl.x, pl.y, `V${fx.fase} (${c.nombre}) · ${fmt(fx.v)} V · ${fx.vAng}°`, c.v))
  })

  fases.forEach((fx) => {
    if (!fx.valido) return
    const c = COLORES[fx.fase]!
    const li = rV * 0.62 * (fx.i / maxI)
    const pi = polar(cx, cy, li, fx.iAng)
    s.push(
      `<line x1="${cx}" y1="${cy}" x2="${pi.x}" y2="${pi.y}" stroke="${c.i}" stroke-width="2.5" stroke-dasharray="7 5" marker-end="url(#fzArr)"` +
        (fx.alerta
          ? '><animate attributeName="opacity" values="1;.35;1" dur="1.4s" repeatCount="indefinite"/></line>'
          : '/>'),
    )
    const pli = polar(cx, cy, li + 40, fx.iAng)
    s.push(
      caja(
        pli.x,
        pli.y,
        `I${fx.fase} · ${fmt(fx.i)} A · ${Math.round(fx.iAng)}°${fx.alerta ? ' ⚠' : ''}`,
        fx.alerta ? '#f0a63a' : c.i,
      ),
    )
  })

  // Tabla resumen por fase
  const ty = 660
  s.push(txt(60, ty - 14, 'Fase', hdr()))
  s.push(txt(150, ty - 14, 'PF real', hdr()))
  s.push(txt(250, ty - 14, 'Desfase', hdr()))
  s.push(txt(360, ty - 14, 'P (kW)', hdr()))
  s.push(txt(460, ty - 14, 'S (kVA)', hdr()))
  s.push(txt(560, ty - 14, 'Estado', hdr()))
  fases.forEach((fx, idx) => {
    const y = ty + 22 * idx + 8
    const col = fx.alerta ? '#f0a63a' : '#c9d5e6'
    s.push(txt(60, y, `L${fx.fase}`, { size: 13, fill: COLORES[fx.fase]!.v, weight: 600 }))
    s.push(txt(150, y, fx.valido ? fx.pfReal.toFixed(3) : '—', { size: 13, fill: col }))
    s.push(txt(250, y, fx.valido ? `${fx.desfase}°` : '—', { size: 13, fill: col }))
    s.push(txt(360, y, fmt(fx.p), { size: 13, fill: col }))
    s.push(txt(460, y, fmt(fx.s), { size: 13, fill: col }))
    s.push(
      txt(560, y, fx.valido ? (fx.alerta ? 'REVISAR' : 'OK') : 'sin carga', {
        size: 13,
        fill: fx.alerta ? '#f0a63a' : '#3fce8a',
        weight: 600,
      }),
    )
  })

  // Banner de diagnóstico
  const bc = diag.nivel === 'alerta' ? '#3a2a12' : diag.nivel === 'ok' ? '#12301f' : '#1b2338'
  const bt = diag.nivel === 'alerta' ? '#f0a63a' : diag.nivel === 'ok' ? '#3fce8a' : '#7d90ad'
  s.push(
    `<rect x="40" y="${ty + 78}" width="${W - 80}" height="46" rx="8" fill="${bc}" stroke="${bt}" stroke-width="1"/>`,
  )
  s.push(wrapText(diag.texto, cx, ty + 96, W - 120, 12, bt))

  // Pie
  const fecha = datos.timestamp ? new Date(datos.timestamp * 1000).toLocaleString() : ''
  s.push(
    txt(
      cx,
      H - 14,
      `${datos.meter ? `Medidor ${esc(String(datos.meter))} · ` : ''}${esc(fecha)}${opciones.marca ? ` · ${esc(opciones.marca)}` : ''}`,
      { size: 11, fill: '#4a5a75', anchor: 'middle' },
    ),
  )

  s.push('</svg>')
  container.innerHTML = s.join('')
  return { fases, diagnostico: diag }
}

/* ---------- helpers ---------- */
function num(x: NumLike): number {
  const n = Number(x)
  return Number.isFinite(n) ? n : 0
}
function round(x: number, d: number): number {
  const k = Math.pow(10, d)
  return Math.round(x * k) / k
}
function norm360(a: number): number {
  return ((a % 360) + 360) % 360
}
function fmt(x: number): string {
  return Number(x).toLocaleString('es-CO', { maximumFractionDigits: 2 })
}
function esc(t: unknown): string {
  return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
function polar(cx: number, cy: number, r: number, deg: number): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) }
}

interface TxtOpciones {
  size?: number
  fill?: string
  weight?: number
  anchor?: string
}

function txt(x: number, y: number, t: string, o: TxtOpciones = {}): string {
  return (
    `<text x="${x}" y="${y}" font-size="${o.size || 12}" fill="${o.fill || '#c9d5e6'}"` +
    (o.weight ? ` font-weight="${o.weight}"` : '') +
    (o.anchor ? ` text-anchor="${o.anchor}"` : '') +
    `>${t}</text>`
  )
}
function hdr(): TxtOpciones {
  return { size: 11, fill: '#7d90ad', weight: 600 }
}
function caja(x: number, y: number, texto: string, color: string): string {
  const w = texto.length * 6.6 + 18
  const h = 22
  const bx = Math.max(8, Math.min(712 - w, x - w / 2))
  const by = Math.max(84, Math.min(600, y - h / 2))
  return (
    `<g><rect x="${bx}" y="${by}" width="${w}" height="${h}" rx="5" fill="#0b0f1a" stroke="${color}" stroke-width="1" opacity="0.95"/>` +
    txt(bx + w / 2, by + 15, esc(texto), { size: 11, fill: color, anchor: 'middle', weight: 600 }) +
    '</g>'
  )
}
function wrapText(
  texto: string,
  cx: number,
  y: number,
  maxW: number,
  size: number,
  fill: string,
): string {
  const porLinea = Math.floor(maxW / (size * 0.56))
  const palabras = texto.split(' ')
  const lineas: string[] = []
  let l = ''
  palabras.forEach((p) => {
    if (`${l} ${p}`.trim().length > porLinea) {
      lineas.push(l.trim())
      l = p
    } else {
      l += ` ${p}`
    }
  })
  if (l.trim()) lineas.push(l.trim())
  return lineas
    .slice(0, 2)
    .map((ln, i) => txt(cx, y + i * 16, esc(ln), { size, fill, anchor: 'middle', weight: 600 }))
    .join('')
}
