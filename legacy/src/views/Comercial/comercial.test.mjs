/**
 * Pruebas de las derivaciones del CRM comercial.
 * Ejecutar:  node src/views/Comercial/comercial.test.mjs
 *
 * No hay runner (vitest/jest) en el repo: se evalúa el código fuente del módulo
 * quitando los `export`, igual que parseCOP.test.mjs.
 */
import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const here = dirname(fileURLToPath(import.meta.url))
let src = fs.readFileSync(join(here, 'comercial.js'), 'utf8')
src = src.replace(/export const /g, 'const ').replace(/export function /g, 'function ')
const M = new Function(
  src +
    `
return { COLUMNAS, TIPOS_OFERTA, ETAPAS_ABIERTAS, kpis, resumenColumna, agruparPorColumna,
         filtrar, ordenar, mwhMes, sinRespuesta, alarmante, mesDelCodigo, diasDesde,
         aFechaStr, puedeFirmarPPA, validarFirma, tarifasMensualesQueGenera,
         aniosDelPeriodo, segmentoTipo, labelEtapa,
         etiquetaPrecio, placeholderPrecio, ayudaPrecio };`,
)()

let ok = true
const eq = (got, exp, msg) => {
  const pass = JSON.stringify(got) === JSON.stringify(exp)
  console.log(
    (pass ? '✅' : '❌') +
      ` ${msg} → ${JSON.stringify(got)}${pass ? '' : ` (esperado ${JSON.stringify(exp)})`}`,
  )
  if (!pass) ok = false
}

// ── Fixture: el caso real de Tecni-plast (Margaritas 1 firmada, 2 muda) ──────
const oferta = (extra) => ({
  id: 1,
  estado: 'oferta',
  tipo: 'compra_energia',
  cliente_id: 7,
  cliente_razon_social: 'TECNI-PLAST S.A.S.',
  planta_nombre: 'Margaritas 1',
  codigo_seguimiento: 'OP.COM No.0103-6-2026',
  resultado: 'pendiente',
  seguimientos: 0,
  fecha_oferta: null,
  fecha_ultima_respuesta: null,
  alerta: false,
  dias_sin_respuesta: 0,
  updated_at: '2026-08-01T10:00:00-05:00',
  ficha: { energia_promedio_kwh_mes: 170000, fuentes: {} },
  ...extra,
})

const OFERTAS = [
  oferta({ id: 1, estado: 'firmado', planta_nombre: 'Margaritas 1' }),
  oferta({
    id: 2,
    estado: 'oferta',
    planta_nombre: 'Margaritas 2',
    fecha_oferta: '2026-06-01',
    seguimientos: 6,
    alerta: true,
    dias_sin_respuesta: 42,
  }),
  oferta({
    id: 3,
    estado: 'declinado',
    planta_nombre: 'Los Apóstoles',
    tipo: 'servicios_operacionales',
    resultado: 'declinado',
    ficha: { energia_promedio_kwh_mes: null, fuentes: {} },
  }),
  oferta({
    id: 4,
    estado: 'operando',
    planta_nombre: 'San Pelayo',
    ficha: { energia_promedio_kwh_mes: 430000, fuentes: {} },
  }),
]

// ── KPIs de la banda ─────────────────────────────────────────────────────────
const k = M.kpis(OFERTAS)
eq(k.activas, 3, 'activas excluye declinado/terminado')
eq(k.total, 4, 'total incluye todo')
eq(Math.round(k.energiaMwhMes), 770, 'energía en juego = suma de las abiertas (170+170+430)')
eq(k.alertas, 1, 'una sola oferta con alerta')
eq(k.sinRespuesta, 1, 'enviada y nunca contestada: solo Margaritas 2')

// La declinada NO debe sumar energía aunque tuviera ficha.
eq(M.kpis([oferta({ estado: 'declinado' })]).energiaMwhMes, 0, 'declinada no suma energía')
eq(M.kpis([]).activas, 0, 'lista vacía no revienta')
eq(M.kpis(null).total, 0, 'null no revienta')

// ── Columnas del tablero ─────────────────────────────────────────────────────
eq(M.COLUMNAS.length, 6, 'seis columnas, no siete')
const grupos = M.agruparPorColumna(OFERTAS)
eq(
  grupos.firmado.map((o) => o.id),
  [1],
  'firmado',
)
eq(
  grupos.oferta.map((o) => o.id),
  [2],
  'oferta',
)
eq(
  grupos.operando.map((o) => o.id),
  [4],
  'operando',
)
eq(
  grupos.cerradas.map((o) => o.id),
  [3],
  'declinado cae en Cerradas',
)
eq(
  M.COLUMNAS.find((c) => c.value === 'cerradas').alSoltar,
  'declinado',
  'soltar en Cerradas = declinado (terminado lo pone el job diario)',
)

// Una etapa que el backend agregue mañana no se puede perder en silencio.
eq(
  M.agruparPorColumna([oferta({ id: 9, estado: 'etapa_nueva' })]).oportunidad.map((o) => o.id),
  [9],
  'etapa desconocida queda visible en la primera columna',
)

const res = M.resumenColumna(grupos.oferta)
eq(res.n, 1, 'conteo de la columna')
eq(Math.round(res.energiaMwhMes), 170, 'MWh/mes de la columna')

// ── Filtros ──────────────────────────────────────────────────────────────────
eq(M.filtrar(OFERTAS, { texto: 'margaritas' }).length, 2, 'texto busca en la planta')
eq(M.filtrar(OFERTAS, { texto: 'TECNI' }).length, 4, 'texto busca en el cliente (case-insensitive)')
eq(M.filtrar(OFERTAS, { texto: '0103' }).length, 4, 'texto busca en el código')
eq(
  M.filtrar(OFERTAS, { tipos: ['servicios_operacionales'] }).map((o) => o.id),
  [3],
  'filtro por tipo',
)
eq(
  M.filtrar(OFERTAS, { etapas: ['oferta', 'firmado'] }).map((o) => o.id),
  [1, 2],
  'filtro por etapa',
)
eq(
  M.filtrar(OFERTAS, { soloAlerta: true }).map((o) => o.id),
  [2],
  'solo con alerta',
)
eq(
  M.filtrar(OFERTAS, { soloSinRespuesta: true }).map((o) => o.id),
  [2],
  'solo sin respuesta',
)
eq(M.filtrar(OFERTAS, { clientes: [99] }).length, 0, 'filtro por cliente que no está')
eq(M.filtrar(OFERTAS, {}).length, 4, 'sin filtros no filtra')

// ── Orden ────────────────────────────────────────────────────────────────────
eq(M.ordenar(OFERTAS, 'rezagadas')[0].id, 2, 'rezagadas: lo más viejo primero')
eq(M.ordenar(OFERTAS, 'energia')[0].id, 4, 'energía: San Pelayo primero')
eq(M.ordenar(OFERTAS, 'criterio_que_no_existe').length, 4, 'criterio inválido no pierde filas')
eq(OFERTAS[0].id, 1, 'ordenar no muta la lista original')

// ── Señales de la tarjeta ────────────────────────────────────────────────────
eq(
  M.sinRespuesta({ fecha_oferta: '2026-06-01', fecha_ultima_respuesta: null }),
  true,
  'enviada sin respuesta',
)
eq(
  M.sinRespuesta({ fecha_oferta: '2026-06-01', fecha_ultima_respuesta: '2026-06-10' }),
  false,
  'ya respondió',
)
eq(M.sinRespuesta({ fecha_oferta: null }), false, 'sin enviar no es "sin respuesta"')
eq(M.alarmante({ seguimientos: 4, fecha_ultima_respuesta: null }), true, '4 toques sin respuesta')
eq(M.alarmante({ seguimientos: 3, fecha_ultima_respuesta: null }), false, '3 toques todavía no')
eq(
  M.alarmante({ seguimientos: 9, fecha_ultima_respuesta: '2026-07-01' }),
  false,
  'respondió: no alarma',
)

// ── El mes que vive dentro del código ────────────────────────────────────────
eq(M.mesDelCodigo({ codigo_seguimiento: 'OP.COM No.0103-6-2026' }), 'jun 2026', 'mes del código')
eq(
  M.mesDelCodigo({ codigo_seguimiento: 'OP.REP No.0087-12-2025' }),
  'dic 2025',
  'mes de dos dígitos',
)
eq(M.mesDelCodigo({ codigo_seguimiento: 'sin formato' }), null, 'código sin formato → null')
eq(M.mesDelCodigo({}), null, 'sin código → null')
eq(
  M.mesDelCodigo({ codigo_seguimiento: 'OP.COM No.0103-13-2026' }),
  null,
  'mes 13 no existe → null',
)

// ── Fechas ───────────────────────────────────────────────────────────────────
const HOY = new Date('2026-08-19T12:00:00').getTime()
eq(M.diasDesde('2026-08-09', HOY), 10, 'días desde una fecha')
eq(M.diasDesde('2026-08-19', HOY), 0, 'hoy = 0 días')
eq(M.diasDesde('2026-09-01', HOY), 0, 'fecha futura no da negativo')
eq(M.diasDesde(null), null, 'sin fecha → null')
eq(M.aFechaStr('2026-08-19T10:00:00-05:00'), '2026-08-19', 'ISO con hora → YYYY-MM-DD')
eq(M.aFechaStr(new Date(2026, 7, 19)), '2026-08-19', 'Date → YYYY-MM-DD sin corrimiento de zona')
eq(M.aFechaStr(null), null, 'null → null')

// ── Firmar ───────────────────────────────────────────────────────────────────
eq(M.puedeFirmarPPA({ tipo: 'compra_energia' }), true, 'compra de energía firma PPA')
eq(M.puedeFirmarPPA({ tipo: 'comunidad_energetica' }), true, 'comunidad energética también')
eq(
  M.puedeFirmarPPA({ tipo: 'servicios_operacionales' }),
  false,
  'servicios NO firma PPA (el backend da 422)',
)
eq(M.puedeFirmarPPA({ tipo: 'compra_energia', ppa_contrato_id: 5 }), false, 'ya tiene contrato')

eq(
  M.validarFirma({
    fecha_inicio: '2026-02-12',
    fecha_fin: '2032-12-31',
    modo_precio: 'unica',
    tarifa_base: 300,
  }),
  [],
  'tarifa única válida',
)
eq(
  M.validarFirma({
    fecha_inicio: '2026-02-12',
    fecha_fin: '2025-01-01',
    modo_precio: 'unica',
    tarifa_base: 300,
  }),
  ['La fecha de fin es anterior a la de inicio.'],
  'fin antes del inicio',
)
eq(
  M.validarFirma({ fecha_inicio: '2026-01-01', fecha_fin: '2026-12-31', modo_precio: 'unica' }),
  ['Falta la tarifa ($/kWh).'],
  'sin precio no se firma',
)
eq(
  M.validarFirma({
    fecha_inicio: '2026-01-01',
    fecha_fin: '2027-12-31',
    modo_precio: 'tabla',
    precios_anuales: [
      { anio: 2026, precio: 320 },
      { anio: 2026, precio: 305 },
    ],
  }),
  ['La tabla de precios tiene años repetidos.'],
  'años repetidos',
)
eq(
  M.validarFirma({
    fecha_inicio: '2026-01-01',
    fecha_fin: '2026-12-31',
    modo_precio: 'unica',
    tarifa_base: 300,
    periodo_indexacion_base: '2025-13',
  }),
  ['El mes base de indexación debe ser YYYY-MM (por ejemplo 2025-10).'],
  'mes base inválido',
)

// Mismo recorte al periodo que _tarifas_mensuales del backend: arranca el
// 12-feb-2026 y termina el 30-jun-2027 → 11 meses + 6 meses.
eq(
  M.tarifasMensualesQueGenera({
    fecha_inicio: '2026-02-12',
    fecha_fin: '2027-06-30',
    modo_precio: 'tabla',
    precios_anuales: [
      { anio: 2026, precio: 320 },
      { anio: 2027, precio: 305 },
    ],
  }),
  17,
  'la tabla anual se expande a 17 filas mensuales',
)
eq(
  M.tarifasMensualesQueGenera({
    fecha_inicio: '2026-02-12',
    fecha_fin: '2027-06-30',
    modo_precio: 'tabla',
    precios_anuales: [
      { anio: 2025, precio: 320 },
      { anio: 2026, precio: 320 },
    ],
  }),
  11,
  'un año fuera del periodo no genera filas',
)
eq(
  M.tarifasMensualesQueGenera({ modo_precio: 'unica', tarifa_base: 300 }),
  0,
  'tarifa única no genera tabla',
)

eq(M.aniosDelPeriodo('2026-02-12', '2028-01-01'), [2026, 2027, 2028], 'años que cubre el periodo')
eq(M.aniosDelPeriodo('2026-02-12', '2025-01-01'), [], 'periodo invertido → vacío')

// ── Vocabulario alineado con el backend ──────────────────────────────────────
eq(
  M.TIPOS_OFERTA.map((t) => t.value),
  ['servicios_operacionales', 'compra_energia', 'comunidad_energetica'],
  'los tipos son los del enum del backend',
)
eq(M.segmentoTipo('compra_energia'), 'COM', 'segmento del código de seguimiento')
eq(M.segmentoTipo('servicios_operacionales'), 'REP', 'servicios = REP')
eq(M.labelEtapa('oportunidad'), 'Oportunidad', 'etiqueta de etapa')
eq(M.labelEtapa('prospeccion'), 'prospeccion', 'etapa vieja: se muestra cruda, no se inventa')

// ── El precio cambia de significado con el tipo de oferta ────────────────────
// El formulario pedía «Precio — p. ej. REP: 6 · CGM: 6» para los tres tipos.
// REP y CGM son comisiones en %: en una compra de energía no aplican, ahí lo
// que se pacta es la tarifa en $/kWh.
eq(
  M.etiquetaPrecio('compra_energia'),
  'Tarifa de energía ($/kWh)',
  'compra de energía pide tarifa, no comisión',
)
eq(
  M.etiquetaPrecio('comunidad_energetica'),
  'Tarifa de energía ($/kWh)',
  'comunidad energética también desemboca en un PPA',
)
eq(
  M.etiquetaPrecio('servicios_operacionales'),
  'Comisión del servicio (%)',
  'los servicios sí cobran comisión',
)
eq(
  M.placeholderPrecio('compra_energia'),
  'p. ej. 320',
  'el ejemplo de REP/CGM no se le muestra a una compra de energía',
)
eq(
  M.placeholderPrecio('servicios_operacionales'),
  'p. ej. REP: 6 · CGM: 6',
  'los servicios conservan el formato que ya se usa',
)
eq(M.ayudaPrecio(null), null, 'sin tipo elegido no se afirma nada sobre el precio')

console.log(ok ? '\n✅ todo bien' : '\n❌ hay fallas')
process.exit(ok ? 0 : 1)
