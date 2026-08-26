// Mock del contrato de /garantias/modelo para desarrollo local.
// No usar en produccion. Arranca con: node scripts/mock-modelo-predictivo.mjs
import { createServer } from 'node:http'

const PORT = Number(process.env.MOCK_PORT || 18900)

const PLAN_SEMANAL = {
  generado_en: '2026-08-26T10:00:00-05:00',
  frescura: { fecha_dato_generacion: '2026-08-23', dias_atraso: 2, umbral_dias: 1 },
  totales: { central: 82000000, suma_p90: 164000000, p90_total: 121000000, brecha: 43000000 },
  semanales: [
    {
      id: '2026-08-28|2026-08-01', vencimiento: '2026-08-28',
      periodo_ini: '2026-08-01', periodo_fin: '2026-08-07',
      etiqueta_periodo: 'AJUSTE TX2', estado: 'firme',
      central: null, p90: 13000000, real: 13000000,
      fecha_calculo_xm: '2026-08-21', procedencia_ventana: 'observada',
    },
    {
      id: '2026-09-04|2026-08-08', vencimiento: '2026-09-04',
      periodo_ini: '2026-08-08', periodo_fin: '2026-08-31',
      etiqueta_periodo: 'AJUSTE PROY', estado: 'estimado',
      central: 41000000, p90: 78000000, real: null,
      fecha_calculo_xm: '2026-08-28', procedencia_ventana: 'observada',
    },
    {
      id: '2026-09-11|2026-09-01', vencimiento: '2026-09-11',
      periodo_ini: '2026-09-01', periodo_fin: '2026-09-30',
      etiqueta_periodo: 'AJUSTE M+1', estado: 'estimado',
      central: 28000000, p90: 64000000, real: null,
      fecha_calculo_xm: '2026-09-04', procedencia_ventana: 'candidatas',
    },
    {
      id: '2026-09-18|2026-09-05', vencimiento: '2026-09-18',
      periodo_ini: '2026-09-05', periodo_fin: '2026-09-30',
      etiqueta_periodo: 'AJUSTE PROY', estado: 'preliminar',
      central: 0, p90: 22000000, real: null,
      fecha_calculo_xm: '2026-09-11', procedencia_ventana: 'derivada',
    },
  ],
  mensuales: [
    {
      id: '2026-09', mes: '2026-09', estado: 'firme',
      central: null, p90: 88000000,
      ventana_cierra: '2026-07-29', objetivo: '2026-08-02',
      publica_xm: '2026-08-06', dias_ventaja: 4, procedencia_ventana: 'observada',
    },
    {
      id: '2026-10', mes: '2026-10', estado: 'estimado',
      central: 95000000, p90: 141000000,
      ventana_cierra: '2026-08-29', objetivo: '2026-09-02',
      publica_xm: '2026-09-04', dias_ventaja: 2, procedencia_ventana: 'candidatas',
    },
  ],
  backtest: {
    cobertura_semanal: 0.91, cobertura_mensual: 0.88,
    ancho_mediano: 41000000, ancho_baseline: 96000000, n_vencimientos: 22,
  },
}

const DETALLE = {
  id: '2026-09-04|2026-08-08',
  cadena: [
    { concepto: 'Exposición en bolsa', origen: 'modelada', central: -52000000, p90: -18000000 },
    { concepto: 'Otros 19 componentes', origen: 'persistencia', central: 75000000, p90: 75000000 },
    { concepto: 'Suma → piso en cero', origen: null, central: 23000000, p90: 57000000 },
    { concepto: '− Garantías TIE', origen: null, central: -2000000, p90: -2000000 },
    { concepto: '− Estimado provisionado', origen: null, central: -8000000, p90: -8000000 },
    { concepto: 'Total a pagar a XM', origen: null, central: 13000000, p90: 47000000 },
  ],
  descomposicion_ancho: [
    { fuente: 'ventana_candidata', pct: 0.71 },
    { fuente: 'liquidacion', pct: 0.18 },
    { fuente: 'dias_sin_liquidar', pct: 0.11 },
  ],
  insumos: [
    { tipo: 'BalCttos', version: 'tx2', rango: '2026-08-01 → 2026-08-07', dias: 7 },
    { tipo: 'trsd', version: 'tx2', rango: '2026-08-01 → 2026-08-07', dias: 7 },
    { tipo: 'arrpas', version: 'txf', rango: '2026-08-01 → 2026-08-07', dias: 7 },
  ],
}

const json = (res, body) => {
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization,Content-Type',
  })
  res.end(JSON.stringify(body))
}

createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Authorization,Content-Type',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
    })
    return res.end()
  }
  if (url.pathname === '/api/v1/garantias/modelo/plan') return json(res, PLAN_SEMANAL)
  if (url.pathname.startsWith('/api/v1/garantias/modelo/detalle/')) return json(res, DETALLE)
  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ detail: `sin mock para ${url.pathname}` }))
}).listen(PORT, () => console.log(`mock modelo-predictivo en http://localhost:${PORT}`))
