# Modelo Predictivo de Garantías — Plan 1: Frontend

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir la tab *Modelo Predictivo* en Garantías — una vista de planeación que responde cuánto se necesita para las próximas semanas y para el mes — funcionando end-to-end contra un mock local, sin depender del backend.

**Architecture:** Vue 3 `<script setup>` + PrimeVue 4 + Tailwind, siguiendo el patrón de `Garantias/Proyecciones`. Un composable orquesta el estado de la vista; un service en `src/api/` es el único que habla HTTP; los componentes son de presentación. Un mock HTTP sin dependencias sirve el contrato de la API para poder desarrollar y verificar sin backend.

**Tech Stack:** Vue 3.4, PrimeVue 4.0, Tailwind 3.4, axios, Vite 5. JavaScript (este repo no usa TypeScript).

---

## Contexto: este es el plan 1 de 3

El spec (`unergy-operaciones-backend/docs/superpowers/specs/2026-08-25-modelo-predictivo-garantias-design.md`) cubre tres subsistemas independientes. Se implementan en planes separados:

| Plan | Alcance | Estado |
|---|---|---|
| **1 — Frontend** (este) | Vista de planeación contra mock | listo para ejecutar |
| 2 — Ingesta y persistencia | 5 tablas, parsers, `validar_esquema()`, cron FTP | pendiente |
| 3 — Motor de cálculo | Réplica día 7, estimador día 14, backtesting | pendiente |

El frontend va primero **a propósito**: permite seguir corrigiendo el diseño mirándolo, que es como aparecieron las últimas tres correcciones del spec. No depende de `arrpas` en `.tx2` ni de los Excel de garantía históricos, que son los pendientes de datos.

## Nota sobre TDD y verificación

**Este repo no tiene runner de tests en el frontend.** `package.json` solo declara `dev`, `build` y `preview`; no hay vitest, jest ni ningún `.spec.js`. No se introduce uno en este plan: la convención establecida es `npm run build` más verificación visual, y el work guide exige el build antes de cada push.

En su lugar, cada tarea se verifica con dos pasos concretos y ejecutables:

1. `npm run build` — debe pasar. Un build roto congela producción en Vercel sin avisar.
2. Verificación en el navegador contra el mock, usando `read_page` / `get_page_text` / `javascript_tool`.

**Trampa conocida del entorno:** si el panel del navegador no está visible, la página no compone frames y las transiciones CSS de PrimeVue nunca terminan — los screenshots fallan y `.p-datatable-mask` se queda encima de la tabla comiéndose los clicks. Verificar con `javascript_tool` y `read_page`, no con clicks por coordenadas.

La lógica pura (derivación de estados, formateo) va a `utils/` en funciones sin estado, de modo que sean testeables el día que el repo adopte un runner.

## Antes de empezar

```bash
git -C unergy-operaciones-frontend-master fetch origin && git -C unergy-operaciones-frontend-master rev-list --left-right --count master...origin/master
```

Si el segundo número no es `0`, hacer `git pull --ff-only origin master` antes de tocar nada. Este repo se atrasa rápido.

---

## Contrato de la API

Lo define este plan y lo debe honrar el plan 3. Prefijo: `/garantias/modelo` (el `baseURL` de `client.js` ya aporta `/api/v1`).

### `GET /garantias/modelo/plan`

Query: `agente` (`UNGG`|`UNGC`), `esquema` (`semanal`|`mensual`), `cuantil` (float, default `0.9`), `horizonte` (int, semanas, default `4`).

```json
{
  "generado_en": "2026-08-26T10:00:00-05:00",
  "frescura": {
    "fecha_dato_generacion": "2026-08-23",
    "dias_atraso": 2,
    "umbral_dias": 1
  },
  "totales": {
    "central": 82000000,
    "suma_p90": 164000000,
    "p90_total": 121000000,
    "brecha": 43000000
  },
  "semanales": [
    {
      "id": "2026-08-28|2026-08-01",
      "vencimiento": "2026-08-28",
      "periodo_ini": "2026-08-01",
      "periodo_fin": "2026-08-07",
      "etiqueta_periodo": "AJUSTE TX2",
      "estado": "firme",
      "central": null,
      "p90": 13000000,
      "real": 13000000,
      "fecha_calculo_xm": "2026-08-21",
      "procedencia_ventana": "observada"
    }
  ],
  "mensuales": [
    {
      "id": "2026-09",
      "mes": "2026-09",
      "estado": "firme",
      "central": null,
      "p90": 88000000,
      "ventana_cierra": "2026-07-29",
      "objetivo": "2026-08-02",
      "publica_xm": "2026-08-06",
      "dias_ventaja": 4,
      "procedencia_ventana": "observada"
    }
  ],
  "backtest": {
    "cobertura_semanal": 0.91,
    "cobertura_mensual": 0.88,
    "ancho_mediano": 41000000,
    "ancho_baseline": 96000000,
    "n_vencimientos": 22
  }
}
```

**Nota de contrato para el plan 3:** el frontend envía `horizonte` en todas las
llamadas, también cuando `esquema=mensual`, donde no aplica. El backend debe
**ignorarlo** en ese caso en vez de fallar o de dejarlo influir en cachés o logs.

### `GET /garantias/modelo/detalle/{id}`

```json
{
  "id": "2026-09-04|2026-08-08",
  "cadena": [
    { "concepto": "Exposición en bolsa", "origen": "modelada",    "central": -52000000, "p90": -18000000 },
    { "concepto": "Otros 19 componentes", "origen": "persistencia", "central": 75000000, "p90": 75000000 },
    { "concepto": "Suma → piso en cero",  "origen": null,          "central": 23000000, "p90": 57000000 },
    { "concepto": "− Garantías TIE",      "origen": null,          "central": -2000000, "p90": -2000000 },
    { "concepto": "− Estimado provisionado", "origen": null,       "central": -8000000, "p90": -8000000 },
    { "concepto": "Total a pagar a XM",   "origen": null,          "central": 13000000, "p90": 47000000 }
  ],
  "descomposicion_ancho": [
    { "fuente": "ventana_candidata", "pct": 0.71 },
    { "fuente": "liquidacion",       "pct": 0.18 },
    { "fuente": "dias_sin_liquidar", "pct": 0.11 }
  ],
  "insumos": [
    { "tipo": "BalCttos", "version": "tx2", "rango": "2026-08-01 → 2026-08-07", "dias": 7 },
    { "tipo": "trsd",     "version": "tx2", "rango": "2026-08-01 → 2026-08-07", "dias": 7 },
    { "tipo": "arrpas",   "version": "txf", "rango": "2026-08-01 → 2026-08-07", "dias": 7 }
  ]
}
```

**`arrpas` en `txf` es intencional en el mock**: refleja el riesgo 13 del spec, y la UI debe marcar esa fila como contaminada.

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---|---|
| `scripts/mock-modelo-predictivo.mjs` | **Crear.** Mock HTTP sin dependencias que sirve el contrato. Solo desarrollo. |
| `src/api/garantiasModelo.js` | **Crear.** Único punto que habla HTTP con `/garantias/modelo`. |
| `src/views/Garantias/ModeloPredictivo/utils/modeloPredictivo.js` | **Crear.** Constantes de estado y procedencia + helpers puros de presentación. |
| `src/views/Garantias/ModeloPredictivo/composables/useModeloPredictivo.js` | **Crear.** Estado de la vista: filtros, carga, error. Delega en el service. |
| `src/views/Garantias/ModeloPredictivo/FrescuraBanner.vue` | **Crear.** Alerta de antigüedad del dato de generación. |
| `src/views/Garantias/ModeloPredictivo/TotalesHeader.vue` | **Crear.** Las dos cifras y la brecha. |
| `src/views/Garantias/ModeloPredictivo/SemanalesTabla.vue` | **Crear.** Filas por (vencimiento, período). |
| `src/views/Garantias/ModeloPredictivo/MensualCard.vue` | **Crear.** Una tarjeta por mes, con sus cuatro fechas. |
| `src/views/Garantias/ModeloPredictivo/DetalleDialog.vue` | **Crear.** Cadena de cálculo, descomposición del ancho, insumos. |
| `src/views/Garantias/ModeloPredictivo/ModeloPredictivoView.vue` | **Crear.** Contenedor: filtros, toggle semanal/mensual, orquestación. |
| `src/views/Garantias/GarantiasView.vue` | **Modificar.** Registrar la tercera tab. |

Los componentes viven planos dentro de `ModeloPredictivo/`, igual que `AjustesXM/` tiene `DropZone.vue` y `HojaMadreView.vue` al mismo nivel.

---

## Task 1: Mock de la API

**Files:**
- Create: `scripts/mock-modelo-predictivo.mjs`

- [ ] **Step 1: Crear el mock**

```javascript
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
```

- [ ] **Step 2: Arrancarlo y verificar que responde**

Run:
```bash
node scripts/mock-modelo-predictivo.mjs &
curl -s http://localhost:18900/api/v1/garantias/modelo/plan | head -c 200
```
Expected: JSON que empieza con `{"generado_en":"2026-08-26T10:00:00-05:00"`

- [ ] **Step 3: Apuntar el proxy de Vite al mock**

`client.js` usa `baseURL: '/api/v1'` y `vite.config.js` proxea `/api` hacia `env.VITE_API_URL`, sin reescribir el path. Por eso el mock sirve rutas con el prefijo `/api/v1` completo.

Run:
```bash
echo 'VITE_API_URL=http://localhost:18900' > .env.local
```

**`.env.local` se borra al terminar el plan (Task 11).** Mientras exista, el frontend no le pega a producción.

- [ ] **Step 4: Commit**

```bash
git add scripts/mock-modelo-predictivo.mjs
git commit -m "chore(garantias): mock local del contrato de modelo predictivo"
```

`.env.local` no se commitea: ya está en `.gitignore` por el patrón `.env*.local`. Verificar con `git status --short` que no aparece.

---

## Task 2: Constantes y helpers puros

**Files:**
- Create: `src/views/Garantias/ModeloPredictivo/utils/modeloPredictivo.js`

- [ ] **Step 1: Crear el módulo**

Sin magic strings: los conjuntos cerrados van como objetos congelados, y la presentación de cada valor sale de un mapa, no de condicionales dispersos.

```javascript
// Constantes de dominio y helpers puros de presentacion del Modelo Predictivo.
// Sin estado y sin dependencias de Vue: reutilizables y testeables por separado.

export const ESTADO = Object.freeze({
  FIRME: 'firme',
  ESTIMADO: 'estimado',
  PRELIMINAR: 'preliminar',
})

export const PROCEDENCIA = Object.freeze({
  OBSERVADA: 'observada',
  DERIVADA: 'derivada',
  CANDIDATAS: 'candidatas',
})

export const ESQUEMA = Object.freeze({
  SEMANAL: 'semanal',
  MENSUAL: 'mensual',
})

export const AGENTE = Object.freeze({
  UNGG: 'UNGG',
  UNGC: 'UNGC',
})

const ESTADO_CHIP = {
  [ESTADO.FIRME]: { label: 'firme', bg: '#ECFDF5', color: '#059669',
    title: 'XM ya publicó el monto' },
  [ESTADO.ESTIMADO]: { label: 'estimado', bg: 'rgba(145,91,216,0.10)', color: '#915BD8',
    title: 'La ventana base ya cerró: solo falta que XM liquide días ya ocurridos' },
  [ESTADO.PRELIMINAR]: { label: 'preliminar', bg: '#F3F4F6', color: '#6b7280',
    title: 'La ventana base sigue abierta: incluye días futuros' },
}

const PROCEDENCIA_CHIP = {
  [PROCEDENCIA.OBSERVADA]: { label: 'observada', bg: '#ECFDF5', color: '#059669',
    title: 'Ventana tomada de la hoja PERIODO BASE o del nombre del CGM' },
  [PROCEDENCIA.DERIVADA]: { label: 'derivada', bg: 'rgba(145,91,216,0.10)', color: '#915BD8',
    title: 'Ventana derivada de la regla general (cierra en 14, cálculo en 7)' },
  [PROCEDENCIA.CANDIDATAS]: { label: 'candidatas', bg: '#FEF3C7', color: '#92400E',
    title: 'Ventana no derivable: se calculó sobre todas las candidatas y la dispersión ensancha el intervalo' },
}

const CHIP_DESCONOCIDO = { label: '—', bg: '#F3F4F6', color: '#6b7280', title: '' }

export function chipEstado(estado) {
  return ESTADO_CHIP[estado] || CHIP_DESCONOCIDO
}

export function chipProcedencia(procedencia) {
  return PROCEDENCIA_CHIP[procedencia] || CHIP_DESCONOCIDO
}

const FUENTE_ANCHO = {
  ventana_candidata: { label: 'Ventana candidata', color: '#F59E0B' },
  liquidacion: { label: 'Liquidación', color: '#915BD8' },
  dias_sin_liquidar: { label: 'Días sin liquidar', color: '#60A5FA' },
  precio_proyectado: { label: 'Precio proyectado', color: '#EC4899' },
}

export function fuenteAncho(clave) {
  return FUENTE_ANCHO[clave] || { label: clave, color: '#9CA3AF' }
}

/** true cuando el dato de generación está más viejo que el umbral y compromete el margen. */
export function generacionAtrasada(frescura) {
  if (!frescura) return false
  return Number(frescura.dias_atraso) > Number(frescura.umbral_dias)
}

/** Versión de liquidación distinta de tx2 = insumo contaminado (riesgo 13 del spec). */
export function insumoContaminado(insumo) {
  return !!insumo && insumo.version !== 'tx2'
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

/** '2026-09' -> 'Septiembre 2026'. Devuelve el crudo si no matchea. */
export function nombreMes(periodo) {
  const m = /^(\d{4})-(\d{2})$/.exec(String(periodo || ''))
  if (!m) return String(periodo ?? '—')
  const nombre = MESES[Number(m[2]) - 1]
  if (!nombre) return String(periodo)
  return `${nombre[0].toUpperCase()}${nombre.slice(1)} ${m[1]}`
}

/** '2026-08-28' -> '28 ago'. Sin Date: evita corrimientos por zona horaria. */
export function fechaCorta(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''))
  if (!m) return '—'
  const abrev = MESES[Number(m[2]) - 1]
  if (!abrev) return String(iso)
  return `${m[3]} ${abrev.slice(0, 3)}`
}

/** '2026-08-01' + '2026-08-07' -> '01–07 ago'; cruza mes -> '25 jul – 07 ago'. */
export function rangoCorto(ini, fin) {
  const a = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ini || ''))
  const b = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(fin || ''))
  if (!a || !b) return '—'
  if (a[1] === b[1] && a[2] === b[2]) {
    return `${a[3]}–${b[3]} ${MESES[Number(a[2]) - 1].slice(0, 3)}`
  }
  return `${fechaCorta(ini)} – ${fechaCorta(fin)}`
}
```

- [ ] **Step 2: Verificar los helpers en Node**

Run:
```bash
node -e "
import('./src/views/Garantias/ModeloPredictivo/utils/modeloPredictivo.js').then(m => {
  console.log(m.nombreMes('2026-09'));
  console.log(m.fechaCorta('2026-08-28'));
  console.log(m.rangoCorto('2026-08-01','2026-08-07'));
  console.log(m.rangoCorto('2026-07-25','2026-08-07'));
  console.log(m.generacionAtrasada({dias_atraso:2,umbral_dias:1}));
  console.log(m.generacionAtrasada({dias_atraso:0,umbral_dias:1}));
  console.log(m.insumoContaminado({version:'txf'}), m.insumoContaminado({version:'tx2'}));
  console.log(m.chipEstado('preliminar').label, m.chipEstado('inventado').label);
})"
```
Se corre desde la raíz del repo del frontend. `package.json` no declara
`"type": "module"`, pero Node detecta la sintaxis ESM en el `import()` dinámico —
verificado en Node 24, que es la versión del entorno.

Expected, en este orden:
```
Septiembre 2026
28 ago
01–07 ago
25 jul – 07 ago
true
false
true false
preliminar —
```

- [ ] **Step 3: Commit**

```bash
git add src/views/Garantias/ModeloPredictivo/utils/modeloPredictivo.js
git commit -m "feat(garantias): constantes y helpers puros del modelo predictivo"
```

---

## Task 3: Service de API

**Files:**
- Create: `src/api/garantiasModelo.js`

- [ ] **Step 1: Crear el service**

Sigue el patrón exacto de `src/api/garantiasProyecciones.js`: `BASE` como constante y funciones que devuelven `r.data`. Ningún componente hace HTTP.

```javascript
import api from '@/api/client'

const BASE = '/garantias/modelo'

export function getPlan({ agente, esquema, cuantil = 0.9, horizonte = 4 }) {
  return api
    .get(`${BASE}/plan`, { params: { agente, esquema, cuantil, horizonte } })
    .then((r) => r.data)
}

export function getDetalle(id) {
  return api.get(`${BASE}/detalle/${encodeURIComponent(id)}`).then((r) => r.data)
}
```

- [ ] **Step 2: Verificar que el build sigue pasando**

Run: `npm run build`
Expected: `✓ built in ...` sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/api/garantiasModelo.js
git commit -m "feat(garantias): service de API del modelo predictivo"
```

---

## Task 4: Composable de la vista

**Files:**
- Create: `src/views/Garantias/ModeloPredictivo/composables/useModeloPredictivo.js`

- [ ] **Step 1: Crear el composable**

El estado es local a la pantalla, así que va en un composable y no en un store de Pinia.

```javascript
import { ref, computed } from 'vue'
import { getPlan, getDetalle } from '@/api/garantiasModelo'
import { AGENTE, ESQUEMA } from '../utils/modeloPredictivo'

export function useModeloPredictivo() {
  const agente = ref(AGENTE.UNGG)
  const esquema = ref(ESQUEMA.SEMANAL)
  const cuantil = ref(0.9)
  const horizonte = ref(4)

  const data = ref(null)
  const cargando = ref(false)
  const error = ref('')

  const detalle = ref(null)
  const detalleCargando = ref(false)
  const detalleAbierto = ref(false)

  const semanales = computed(() => data.value?.semanales ?? [])
  const mensuales = computed(() => data.value?.mensuales ?? [])

  async function cargar() {
    cargando.value = true
    error.value = ''
    try {
      data.value = await getPlan({
        agente: agente.value,
        esquema: esquema.value,
        cuantil: cuantil.value,
        horizonte: horizonte.value,
      })
    } catch (e) {
      error.value = e?.response?.data?.detail || 'No se pudo cargar el plan de garantías'
      data.value = null
    } finally {
      cargando.value = false
    }
  }

  async function abrirDetalle(id) {
    detalleAbierto.value = true
    detalleCargando.value = true
    detalle.value = null
    try {
      detalle.value = await getDetalle(id)
    } catch (e) {
      error.value = e?.response?.data?.detail || 'No se pudo cargar el detalle'
      detalleAbierto.value = false
    } finally {
      detalleCargando.value = false
    }
  }

  function cerrarDetalle() {
    detalleAbierto.value = false
    detalle.value = null
  }

  return {
    agente, esquema, cuantil, horizonte,
    data, cargando, error,
    semanales, mensuales,
    detalle, detalleCargando, detalleAbierto,
    cargar, abrirDetalle, cerrarDetalle,
  }
}
```

- [ ] **Step 2: Verificar el build**

Run: `npm run build`
Expected: `✓ built in ...`

- [ ] **Step 3: Commit**

```bash
git add src/views/Garantias/ModeloPredictivo/composables/useModeloPredictivo.js
git commit -m "feat(garantias): composable de estado del modelo predictivo"
```

---

## Task 5: Banner de frescura

**Files:**
- Create: `src/views/Garantias/ModeloPredictivo/FrescuraBanner.vue`

Va arriba de todo porque es el único elemento que puede invalidar el resto de la pantalla: con el dato atrasado los números siguen saliendo, pero dejan de ser medición y pasan a ser proyección.

- [ ] **Step 1: Crear el componente**

```vue
<template>
  <div v-if="atrasada" class="flex items-center gap-3 rounded-lg px-3 py-2.5"
    style="background:#FEF2F2;border:1px solid rgba(214,68,85,0.2)">
    <i class="pi pi-exclamation-triangle" style="color:#D64455" />
    <span class="text-xs" style="color:#D64455">
      Generación al {{ fechaCorta(frescura.fecha_dato_generacion) }} —
      {{ frescura.dias_atraso }} {{ frescura.dias_atraso === 1 ? 'día' : 'días' }} de atraso.
      El margen de la anticipación mensual está comprometido.
    </span>
  </div>
  <div v-else-if="frescura" class="flex items-center gap-2 text-[11px]" style="color:#6b5a8a">
    <i class="pi pi-check-circle" style="color:#059669;font-size:0.8rem" />
    <span>Generación al día ({{ fechaCorta(frescura.fecha_dato_generacion) }})</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { fechaCorta, generacionAtrasada } from './utils/modeloPredictivo'

const props = defineProps({
  frescura: { type: Object, default: null },
})

const atrasada = computed(() => generacionAtrasada(props.frescura))
</script>
```

- [ ] **Step 2: Verificar el build**

Run: `npm run build`
Expected: `✓ built in ...`

- [ ] **Step 3: Commit**

```bash
git add src/views/Garantias/ModeloPredictivo/FrescuraBanner.vue
git commit -m "feat(garantias): banner de frescura del dato de generacion"
```

---

## Task 6: Encabezado de totales

**Files:**
- Create: `src/views/Garantias/ModeloPredictivo/TotalesHeader.vue`

Las dos cifras van juntas **y la brecha también**: es la única cifra que cuantifica lo que gana tesorería juntando el pozo en vez de reservar semana a semana.

- [ ] **Step 1: Crear el componente**

```vue
<template>
  <div v-if="totales" class="grid gap-4"
    style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">
    <div class="rounded-xl p-4" style="background:rgba(145,91,216,0.06)">
      <p class="text-xs mb-1" style="color:#6b5a8a">Suma de P90 semanales</p>
      <p class="text-2xl font-bold" style="color:#2C2039">{{ fmtCOP(totales.suma_p90) }}</p>
      <p class="text-[11px] mt-1" style="color:#8a7aa5">Reservando semana a semana</p>
    </div>

    <div class="rounded-xl p-4" style="background:rgba(145,91,216,0.06)">
      <p class="text-xs mb-1" style="color:#6b5a8a">P90 del horizonte</p>
      <p class="text-2xl font-bold" style="color:#2C2039">{{ fmtCOP(totales.p90_total) }}</p>
      <p class="text-[11px] mt-1" style="color:#8a7aa5">Con un pozo común</p>
    </div>

    <div class="rounded-xl p-4" style="background:rgba(5,150,105,0.08)">
      <p class="text-xs mb-1" style="color:#6b5a8a">Libera juntar el pozo</p>
      <p class="text-2xl font-bold" :style="`color:${totales.brecha > 0 ? '#059669' : '#6b5a8a'}`">
        {{ fmtCOP(totales.brecha) }}
      </p>
      <p class="text-[11px] mt-1" style="color:#8a7aa5">
        {{ totales.brecha > 0
          ? 'Diferencia entre las dos políticas'
          : 'Las semanas están muy correlacionadas: juntar el pozo no libera capital' }}
      </p>
    </div>

    <div class="rounded-xl p-4" style="background:#fafafa">
      <p class="text-xs mb-1" style="color:#6b5a8a">Escenario central</p>
      <p class="text-2xl font-bold" style="color:#6b5a8a">{{ fmtCOP(totales.central) }}</p>
      <p class="text-[11px] mt-1" style="color:#8a7aa5">Sin colchón</p>
    </div>
  </div>
</template>

<script setup>
import { fmtCOP } from '@/views/Garantias/AjustesXM/utils/formatters'

defineProps({
  totales: { type: Object, default: null },
})
</script>
```

- [ ] **Step 2: Verificar el build**

Run: `npm run build`
Expected: `✓ built in ...`

- [ ] **Step 3: Commit**

```bash
git add src/views/Garantias/ModeloPredictivo/TotalesHeader.vue
git commit -m "feat(garantias): encabezado con los dos totales y la brecha"
```

---

## Task 7: Tabla de semanales

**Files:**
- Create: `src/views/Garantias/ModeloPredictivo/SemanalesTabla.vue`

- [ ] **Step 1: Crear el componente**

```vue
<template>
  <div class="overflow-x-auto rounded-xl" style="border:1px solid #e8e0f0">
    <table class="w-full text-xs">
      <thead>
        <tr class="bg-gray-50 border-b">
          <th class="px-3 py-2 text-left font-semibold" style="color:#6b5a8a">Vence</th>
          <th class="px-3 py-2 text-left font-semibold" style="color:#6b5a8a">Período</th>
          <th class="px-3 py-2 text-left font-semibold" style="color:#6b5a8a">Bloque</th>
          <th class="px-3 py-2 text-left font-semibold" style="color:#6b5a8a">Estado</th>
          <th class="px-3 py-2 text-right font-semibold" style="color:#6b5a8a">Central</th>
          <th class="px-3 py-2 text-right font-semibold" style="color:#6b5a8a">P90</th>
          <th class="px-3 py-2 text-right font-semibold" style="color:#6b5a8a">Real</th>
          <th class="px-3 py-2 text-center font-semibold" style="color:#6b5a8a">Ventana</th>
          <th class="px-3 py-2" />
        </tr>
      </thead>
      <tbody>
        <tr v-for="fila in filas" :key="fila.id"
          class="border-b last:border-b-0 hover:bg-gray-50/60">
          <td class="px-3 py-2" style="color:#2C2039">{{ fechaCorta(fila.vencimiento) }}</td>
          <td class="px-3 py-2" style="color:#6b5a8a">
            {{ rangoCorto(fila.periodo_ini, fila.periodo_fin) }}
          </td>
          <td class="px-3 py-2" style="color:#6b5a8a">{{ fila.etiqueta_periodo }}</td>
          <td class="px-3 py-2">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold"
              :style="`background:${chipEstado(fila.estado).bg};color:${chipEstado(fila.estado).color}`"
              :title="chipEstado(fila.estado).title">
              {{ chipEstado(fila.estado).label }}
            </span>
          </td>
          <td class="px-3 py-2 text-right tabular-nums" style="color:#6b5a8a">
            {{ fila.central == null ? '—' : fmtCOP(fila.central) }}
          </td>
          <td class="px-3 py-2 text-right tabular-nums font-semibold" style="color:#2C2039">
            {{ fila.p90 == null ? '—' : fmtCOP(fila.p90) }}
          </td>
          <td class="px-3 py-2 text-right tabular-nums" style="color:#6b5a8a">
            {{ fila.real == null ? '—' : fmtCOP(fila.real) }}
          </td>
          <td class="px-3 py-2 text-center">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold"
              :style="`background:${chipProcedencia(fila.procedencia_ventana).bg};color:${chipProcedencia(fila.procedencia_ventana).color}`"
              :title="chipProcedencia(fila.procedencia_ventana).title">
              {{ chipProcedencia(fila.procedencia_ventana).label }}
            </span>
          </td>
          <td class="px-3 py-2 text-right">
            <Button icon="pi pi-search" text size="small" severity="secondary"
              :aria-label="`Ver detalle de ${fila.vencimiento}`"
              @click="emit('detalle', fila.id)" />
          </td>
        </tr>
        <tr v-if="!filas.length">
          <td colspan="9" class="px-3 py-6 text-center" style="color:#8a7aa5">
            No hay vencimientos semanales en el horizonte seleccionado.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import Button from 'primevue/button'
import { fmtCOP } from '@/views/Garantias/AjustesXM/utils/formatters'
import { chipEstado, chipProcedencia, fechaCorta, rangoCorto } from './utils/modeloPredictivo'

defineProps({
  filas: { type: Array, default: () => [] },
})
const emit = defineEmits(['detalle'])
</script>
```

- [ ] **Step 2: Verificar el build**

Run: `npm run build`
Expected: `✓ built in ...`

- [ ] **Step 3: Commit**

```bash
git add src/views/Garantias/ModeloPredictivo/SemanalesTabla.vue
git commit -m "feat(garantias): tabla de vencimientos semanales con estado y procedencia"
```

---

## Task 8: Tarjeta mensual

**Files:**
- Create: `src/views/Garantias/ModeloPredictivo/MensualCard.vue`

Tarjeta y no fila: el mensual necesita cuatro fechas y no entran en una fila legible.

- [ ] **Step 1: Crear el componente**

```vue
<template>
  <div class="rounded-xl p-4"
    :style="`border:1px solid ${destacada ? '#915BD8' : '#e8e0f0'}`">
    <div class="flex items-start justify-between gap-3 flex-wrap">
      <div class="flex items-center gap-2">
        <span class="text-sm font-semibold" style="color:#2C2039">{{ nombreMes(item.mes) }}</span>
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold"
          :style="`background:${chipEstado(item.estado).bg};color:${chipEstado(item.estado).color}`"
          :title="chipEstado(item.estado).title">
          {{ chipEstado(item.estado).label }}
        </span>
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold"
          :style="`background:${chipProcedencia(item.procedencia_ventana).bg};color:${chipProcedencia(item.procedencia_ventana).color}`"
          :title="chipProcedencia(item.procedencia_ventana).title">
          {{ chipProcedencia(item.procedencia_ventana).label }}
        </span>
      </div>
      <div class="text-right">
        <div class="text-xl font-bold" style="color:#915BD8">{{ fmtCOP(item.p90) }}</div>
        <div v-if="item.central != null" class="text-[11px]" style="color:#6b5a8a">
          central {{ fmtCOP(item.central) }}
        </div>
      </div>
    </div>

    <dl class="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-[11px]" style="color:#6b5a8a">
      <div class="flex justify-between">
        <dt>Ventana cierra</dt><dd style="color:#2C2039">{{ fechaCorta(item.ventana_cierra) }}</dd>
      </div>
      <div class="flex justify-between">
        <dt>Lo sabés</dt><dd style="color:#2C2039">{{ fechaCorta(item.objetivo) }}</dd>
      </div>
      <div class="flex justify-between">
        <dt>XM publica</dt><dd style="color:#2C2039">{{ fechaCorta(item.publica_xm) }}</dd>
      </div>
      <div class="flex justify-between">
        <dt>Ventaja</dt>
        <dd :style="item.dias_ventaja > 0 ? 'color:#059669;font-weight:600' : 'color:#D64455;font-weight:600'">
          {{ item.dias_ventaja }} {{ item.dias_ventaja === 1 ? 'día' : 'días' }}
        </dd>
      </div>
    </dl>

    <div class="mt-3 flex justify-end">
      <Button label="Ver detalle" icon="pi pi-search" text size="small" severity="secondary"
        @click="emit('detalle', item.id)" />
    </div>
  </div>
</template>

<script setup>
import Button from 'primevue/button'
import { fmtCOP } from '@/views/Garantias/AjustesXM/utils/formatters'
import { chipEstado, chipProcedencia, fechaCorta, nombreMes, ESTADO } from './utils/modeloPredictivo'
import { computed } from 'vue'

const props = defineProps({
  item: { type: Object, required: true },
})
const emit = defineEmits(['detalle'])

const destacada = computed(() => props.item.estado === ESTADO.ESTIMADO)
</script>
```

- [ ] **Step 2: Verificar el build**

Run: `npm run build`
Expected: `✓ built in ...`

- [ ] **Step 3: Commit**

```bash
git add src/views/Garantias/ModeloPredictivo/MensualCard.vue
git commit -m "feat(garantias): tarjeta mensual con las cuatro fechas y la ventaja"
```

---

## Task 9: Vista contenedor y registro de la tab

> **Ejecutar la Task 10 ANTES que esta.** `ModeloPredictivoView.vue` importa
> `DetalleDialog.vue`, que crea la Task 10. En el orden numérico, el `npm run build` de
> esta tarea falla por el import faltante. Corregido al ejecutar: 10 primero, luego 9.

**Files:**
- Create: `src/views/Garantias/ModeloPredictivo/ModeloPredictivoView.vue`
- Modify: `src/views/Garantias/GarantiasView.vue`

- [ ] **Step 1: Crear la vista contenedor**

Toggle, no filtro: un filtro invita a quitarlo y mirar todo junto, y la cobertura agregada sobre semanal + mensual no significa nada.

```vue
<template>
  <div class="space-y-4">
    <FrescuraBanner :frescura="data?.frescura" />

    <div class="flex flex-wrap items-end gap-4 p-4 rounded-xl"
      style="background:rgba(145,91,216,0.06)">
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium" style="color:#6b5a8a">Agente</label>
        <SelectButton v-model="agente" :options="opcionesAgente" :allowEmpty="false"
          @update:modelValue="cargar" />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium" style="color:#6b5a8a">Esquema</label>
        <SelectButton v-model="esquema" :options="opcionesEsquema" optionLabel="label"
          optionValue="value" :allowEmpty="false" @update:modelValue="cargar" />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium" style="color:#6b5a8a">Percentil</label>
        <InputNumber v-model="cuantilPct" :min="50" :max="99" suffix=" %" style="width:7.5rem"
          @update:modelValue="cargar" />
      </div>
      <div v-if="esquema === ESQUEMA.SEMANAL" class="flex flex-col gap-1">
        <label class="text-xs font-medium" style="color:#6b5a8a">Semanas</label>
        <InputNumber v-model="horizonte" :min="1" :max="12" showButtons buttonLayout="horizontal"
          style="width:8.5rem" @update:modelValue="cargar" />
      </div>
      <Button label="Recalcular" icon="pi pi-refresh" :loading="cargando" outlined @click="cargar" />
    </div>

    <div v-if="error" class="rounded-lg p-3"
      style="background:#FEF2F2;border:1px solid rgba(214,68,85,0.2)">
      <p class="text-xs" style="color:#D64455">{{ error }}</p>
    </div>

    <div v-if="cargando" class="text-sm" style="color:#6b5a8a">Calculando…</div>

    <template v-else-if="data">
      <TotalesHeader :totales="data.totales" />

      <SemanalesTabla v-if="esquema === ESQUEMA.SEMANAL" :filas="semanales"
        @detalle="abrirDetalle" />

      <div v-else class="grid gap-4" style="grid-template-columns:repeat(auto-fit,minmax(320px,1fr))">
        <MensualCard v-for="m in mensuales" :key="m.id" :item="m" @detalle="abrirDetalle" />
        <p v-if="!mensuales.length" class="text-sm" style="color:#8a7aa5">
          No hay garantías mensuales en el horizonte.
        </p>
      </div>

      <p v-if="data.backtest" class="text-[11px] pt-3 border-t"
        style="color:#8a7aa5;border-color:rgba(44,32,57,0.10)">
        Cobertura histórica:
        <b>{{ pct(data.backtest.cobertura_semanal) }}</b> semanal ·
        <b>{{ pct(data.backtest.cobertura_mensual) }}</b> mensual —
        ancho mediano <b>{{ fmtCOP(data.backtest.ancho_mediano) }}</b>
        vs. baseline <b>{{ fmtCOP(data.backtest.ancho_baseline) }}</b>
        sobre {{ data.backtest.n_vencimientos }} vencimientos.
      </p>
    </template>

    <DetalleDialog :abierto="detalleAbierto" :detalle="detalle" :cargando="detalleCargando"
      @cerrar="cerrarDetalle" />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import SelectButton from 'primevue/selectbutton'
import { fmtCOP } from '@/views/Garantias/AjustesXM/utils/formatters'
import { useModeloPredictivo } from './composables/useModeloPredictivo'
import { AGENTE, ESQUEMA } from './utils/modeloPredictivo'
import FrescuraBanner from './FrescuraBanner.vue'
import TotalesHeader from './TotalesHeader.vue'
import SemanalesTabla from './SemanalesTabla.vue'
import MensualCard from './MensualCard.vue'
import DetalleDialog from './DetalleDialog.vue'

const {
  agente, esquema, cuantil, horizonte,
  data, cargando, error,
  semanales, mensuales,
  detalle, detalleCargando, detalleAbierto,
  cargar, abrirDetalle, cerrarDetalle,
} = useModeloPredictivo()

const opcionesAgente = [AGENTE.UNGG, AGENTE.UNGC]
const opcionesEsquema = [
  { label: 'Semanal', value: ESQUEMA.SEMANAL },
  { label: 'Mensual', value: ESQUEMA.MENSUAL },
]

const cuantilPct = computed({
  get: () => Math.round(cuantil.value * 100),
  set: (v) => { cuantil.value = Number(v) / 100 },
})

function pct(v) {
  return v == null ? '—' : `${Math.round(v * 100)}%`
}

onMounted(cargar)
</script>
```

- [ ] **Step 2: Registrar la tab**

En `src/views/Garantias/GarantiasView.vue`, agregar el import, la entrada en `tabs` y el render condicional.

Reemplazar la línea:
```
    <ProyeccionesView v-else-if="activeTab === 'proyecciones'" />
```
por:
```
    <ProyeccionesView v-else-if="activeTab === 'proyecciones'" />
    <ModeloPredictivoView v-else-if="activeTab === 'modelo'" />
```

Reemplazar:
```
import ProyeccionesView from './Proyecciones/ProyeccionesView.vue'
```
por:
```
import ProyeccionesView from './Proyecciones/ProyeccionesView.vue'
import ModeloPredictivoView from './ModeloPredictivo/ModeloPredictivoView.vue'
```

Reemplazar:
```
  { key: 'proyecciones', label: 'Proyecciones' },
]
```
por:
```
  { key: 'proyecciones', label: 'Proyecciones' },
  { key: 'modelo', label: 'Modelo Predictivo' },
]
```

- [ ] **Step 3: Verificar el build**

Run: `npm run build`
Expected: `✓ built in ...`

- [ ] **Step 4: Commit**

```bash
git add src/views/Garantias/ModeloPredictivo/ModeloPredictivoView.vue src/views/Garantias/GarantiasView.vue
git commit -m "feat(garantias): tab Modelo Predictivo con vista de planeacion"
```

---

## Task 10: Diálogo de detalle

**Files:**
- Create: `src/views/Garantias/ModeloPredictivo/DetalleDialog.vue`

Muestra la cadena completa hasta el total a pagar, la descomposición del ancho —lo más accionable de la pantalla— y qué insumos alimentaron el número, marcando los contaminados.

- [ ] **Step 1: Crear el componente**

```vue
<template>
  <Dialog :visible="abierto" modal header="Detalle del vencimiento" :style="{ width: '46rem' }"
    @update:visible="(v) => { if (!v) emit('cerrar') }">
    <div v-if="cargando" class="text-sm" style="color:#6b5a8a">Cargando…</div>

    <div v-else-if="detalle" class="space-y-5">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide mb-2" style="color:#6b5a8a">
          Cadena de cálculo
        </p>
        <table class="w-full text-xs">
          <thead>
            <tr class="border-b">
              <th class="px-2 py-1.5 text-left font-semibold" style="color:#6b5a8a">Concepto</th>
              <th class="px-2 py-1.5 text-right font-semibold" style="color:#6b5a8a">Central</th>
              <th class="px-2 py-1.5 text-right font-semibold" style="color:#6b5a8a">P90</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(f, i) in detalle.cadena" :key="i" class="border-b last:border-b-0">
              <td class="px-2 py-1.5" style="color:#2C2039">
                {{ f.concepto }}
                <span v-if="f.origen" class="ml-1 px-1.5 py-0.5 rounded text-[10px]"
                  style="background:rgba(145,91,216,0.10);color:#915BD8">{{ f.origen }}</span>
              </td>
              <td class="px-2 py-1.5 text-right tabular-nums" style="color:#6b5a8a">
                {{ fmtCOP(f.central) }}
              </td>
              <td class="px-2 py-1.5 text-right tabular-nums" style="color:#2C2039">
                {{ fmtCOP(f.p90) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <p class="text-xs font-semibold uppercase tracking-wide mb-2" style="color:#6b5a8a">
          De dónde viene el ancho
        </p>
        <div class="flex h-2.5 rounded-full overflow-hidden mb-2">
          <div v-for="d in detalle.descomposicion_ancho" :key="d.fuente"
            :style="`width:${(d.pct * 100).toFixed(1)}%;background:${fuenteAncho(d.fuente).color}`" />
        </div>
        <div class="flex flex-wrap gap-4 text-[11px]" style="color:#6b5a8a">
          <span v-for="d in detalle.descomposicion_ancho" :key="d.fuente"
            class="inline-flex items-center gap-1.5">
            <i class="inline-block w-2 h-2 rounded-sm"
              :style="`background:${fuenteAncho(d.fuente).color}`" />
            {{ fuenteAncho(d.fuente).label }} {{ Math.round(d.pct * 100) }}%
          </span>
        </div>
      </div>

      <div>
        <p class="text-xs font-semibold uppercase tracking-wide mb-2" style="color:#6b5a8a">
          Insumos usados
        </p>
        <table class="w-full text-xs">
          <tbody>
            <tr v-for="ins in detalle.insumos" :key="ins.tipo" class="border-b last:border-b-0">
              <td class="px-2 py-1.5" style="color:#2C2039">{{ ins.tipo }}</td>
              <td class="px-2 py-1.5">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  :style="insumoContaminado(ins)
                    ? 'background:#FEF3C7;color:#92400E'
                    : 'background:#ECFDF5;color:#059669'"
                  :title="insumoContaminado(ins)
                    ? 'Versión distinta de tx2: el dato no existía en la fecha de cálculo'
                    : 'Versión tx2, sin leakage'">
                  {{ ins.version }}
                </span>
              </td>
              <td class="px-2 py-1.5" style="color:#6b5a8a">{{ ins.rango }}</td>
              <td class="px-2 py-1.5 text-right" style="color:#6b5a8a">{{ ins.dias }} días</td>
            </tr>
          </tbody>
        </table>
        <p v-if="hayContaminado" class="text-[11px] mt-2" style="color:#92400E">
          Hay insumos en una versión distinta de tx2. Ese dato no existía en la fecha de cálculo,
          así que este número está contaminado y no debe leerse como definitivo.
        </p>
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import { computed } from 'vue'
import Dialog from 'primevue/dialog'
import { fmtCOP } from '@/views/Garantias/AjustesXM/utils/formatters'
import { fuenteAncho, insumoContaminado } from './utils/modeloPredictivo'

const props = defineProps({
  abierto: { type: Boolean, default: false },
  detalle: { type: Object, default: null },
  cargando: { type: Boolean, default: false },
})
const emit = defineEmits(['cerrar'])

const hayContaminado = computed(
  () => (props.detalle?.insumos ?? []).some(insumoContaminado),
)
</script>
```

- [ ] **Step 2: Verificar el build**

Run: `npm run build`
Expected: `✓ built in ...`

- [ ] **Step 3: Commit**

```bash
git add src/views/Garantias/ModeloPredictivo/DetalleDialog.vue
git commit -m "feat(garantias): detalle con cadena de calculo, ancho e insumos"
```

---

## Task 11: Verificación end-to-end y limpieza

**Files:** ninguno nuevo.

- [ ] **Step 1: Levantar mock y dev server**

Run:
```bash
node scripts/mock-modelo-predictivo.mjs &
```

Luego arrancar el preview con la configuración `frontend-dev` del `.claude/launch.json` de la raíz (puerto 5173).

- [ ] **Step 2: Entrar a la vista con auth de preview**

Navegar a: `http://localhost:5173/garantias?preview=coordinador`

El router tiene modo preview solo-DEV: `?preview=coordinador` firma un JWT falso local. La ruta `/garantias` exige rol `admin` o `liquidaciones` — si `coordinador` no entra, usar `?preview=admin`.

- [ ] **Step 3: Verificar la tab semanal**

Hacer click en la tab **Modelo Predictivo** de forma programática (no por coordenadas — ver la trampa del entorno arriba):

```javascript
[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Modelo Predictivo').click()
```

Luego `get_page_text` y comprobar que aparecen:
- El banner rojo con `2 días de atraso`
- Las cuatro tarjetas de totales, incluida `Libera juntar el pozo`
- Las cuatro filas semanales con los chips `firme`, `estimado`, `estimado`, `preliminar`
- La línea de cobertura al pie con `91%` y `88%`

- [ ] **Step 4: Verificar el toggle a mensual**

```javascript
[...document.querySelectorAll('.p-selectbutton button')].find(b => b.textContent.trim() === 'Mensual').click()
```

Comprobar con `get_page_text` que aparecen las dos tarjetas `Septiembre 2026` y `Octubre 2026`, con `4 días` y `2 días` de ventaja respectivamente, y que la tabla semanal ya no está.

- [ ] **Step 5: Verificar el detalle**

```javascript
document.querySelector('button[aria-label^="Ver detalle"]').click()
```

Comprobar que el diálogo muestra la cadena terminando en `Total a pagar a XM`, la barra de descomposición con `Ventana candidata 71%`, y la advertencia de contaminación por el `arrpas` en `txf`.

- [ ] **Step 6: Tomar screenshot para el registro**

Con el panel del navegador visible, `computer {action: "screenshot"}`.

- [ ] **Step 7: Limpiar el entorno local**

```bash
rm .env.local
```

**Obligatorio.** Mientras exista, el frontend apunta al mock; sin él vuelve a producción. Verificar que ya no está:

```bash
ls .env.local 2>/dev/null || echo "limpio"
```

Detener el mock: `kill %1` (o cerrar el proceso `node scripts/mock-modelo-predictivo.mjs`).

- [ ] **Step 8: Build final y push**

```bash
npm run build
```
Expected: `✓ built in ...`

El build local es obligatorio antes de pushear: un build roto crea un deployment fallido en Vercel y **deja producción congelada en la versión anterior**, sin rollback ni aviso.

```bash
git fetch origin && git rev-list --left-right --count master...origin/master
```

Si el segundo número no es `0`, `git pull --rebase origin master` antes de pushear.

```bash
git push origin master
```

---

## Estado esperado al terminar

- Tab **Modelo Predictivo** visible en Garantías, funcionando contra el mock.
- Sin `.env.local` en el árbol de trabajo.
- `npm run build` pasando.
- El contrato de `/garantias/modelo` documentado y congelado, listo para que lo implemente el plan 3.

## Lo que este plan no hace

- No toca el backend. Los endpoints no existen todavía: contra producción la tab mostrará el error de carga, que es el comportamiento correcto hasta que exista el plan 3.
- No agrega gráficos. Con un solo componente modelado no hay serie que graficar.
- No implementa la garantía TIE, que está fuera del alcance del spec.
- **No incluye el bloque de cobertura de datos por tipo y versión** ni el listado de
  archivos rechazados por `validar_esquema()`, que §10 del spec ubica en esta tab. Es
  UI, pero reporta el estado de la ingesta: se implementa en el plan 2, junto con la
  ingesta que describe. Lo que sí entra acá es la alerta de frescura (Task 5), porque
  depende del cron de generación que ya existe hoy.
- No agrega un runner de tests al frontend. Si el equipo decide adoptar vitest, `utils/modeloPredictivo.js` ya está escrito como funciones puras y es el primer candidato natural.
