# Spec visual — Módulo "Retos Q"

Complemento de `CONTRATO_RETOS_Q.md`. El contrato manda sobre datos, nombres de campo y
rutas; **este documento manda sobre pixeles, estados y microcopy**. Donde este spec dice
un hex, un px o un texto, se implementa literal.

Convenciones del repo que aplican sin discusión (de `FRONTED.md`):
fondo de página `#FDFAF7` global, contenedor raíz `<div class="space-y-4">`,
`<PageHeader>` global (no se importa), PrimeVue 4 importado componente a componente
en cada SFC, Lato global.

---

## 0. Resumen de decisiones (léelo antes de implementar)

| # | Decisión | Por qué |
|---|---|---|
| 1 | La matriz semanal es una **`<table>` HTML** con `position: sticky`, **no** `DataTable` | Necesita columna izquierda pegada **y** las 3 columnas finales pegadas a la derecha, foco itinerante entre celdas (row-major) y estado por *columna* (futura/actual/parcial) — tres cosas que el modelo fila-a-fila del `DataTable` estorba; además el repo ya tiene el precedente `.cv-matriz` en `CumplimientoV2View.vue`. |
| 2 | Las celdas de la matriz usan `<input type="text" inputmode="decimal">` plano, **no** `InputNumber` | 14 semanas × N métricas = 100+ instancias; `InputNumber` secuestra ↑↓ y Enter, que es justo lo que necesitamos para navegar. `InputNumber` sí se usa en drawer y diálogos, donde hay 5–8 campos. |
| 3 | **Anillo** para el roll-up del trimestre, **bullet bar** para la métrica | Dos niveles de lectura distintos con dos formas distintas: el anillo se escanea de un vistazo en la grilla de 4 tarjetas; el bullet compara contra meta y ritmo en el detalle. |
| 4 | Matriz = **autosave**; drawer = **guardado explícito** | La matriz es corrección puntual (una celda, sales); el drawer es el ritual semanal (llenas 5 campos, confirmas y cierras con un toast que da cierre). |
| 5 | Semana futura = **atenuada pero editable al hacer clic** | Bloquearla rompe el caso real de "ya sé el dato de la próxima semana". Se atenúa fuerte y hay toggle "Ocultar semanas futuras". |
| 6 | El color nunca comunica solo | Todo estado lleva chip con etiqueta de texto. Requisito de accesibilidad y de la convención de `be-chip` en Cumplimiento. |

---

## 1. Sistema de diseño local

### 1.1 Tokens de color

**Marca (del contrato, intocables)**

| token | hex | uso |
|---|---|---|
| `purple` | `#915BD8` | acento principal, foco, semana actual, barras de progreso neutras |
| `deep` | `#2C2039` | texto principal, marcas de referencia |
| `avena` | `#FDFAF7` | fondo de página (global) |
| `yellow` | `#F6FF72` | **una sola** CTA por vista: "Registrar semana N" |

**Grises malva (secundarios de marca)**

| token | hex | uso permitido |
|---|---|---|
| `txt-2` | `#6b5a8a` | texto secundario **portador de información** (unidad, responsable, rangos) |
| `txt-3` | `#9b8fb0` | etiquetas decorativas, subtítulos, headers de tabla. **Nunca** para un dato que solo exista ahí |
| `txt-4` | `#c7bdd8` | placeholders, semanas futuras, chevrons |
| `vacio` | `#d9d0e6` | el punto `·` de celda sin dato |
| `borde` | `#e8e0f0` | borde de cards (contrato) |
| `borde-2` | `#ECE7F2` | borde interno de tablas y separadores |
| `track` | `#F1ECF7` | fondo de barras de progreso |
| `hover` | `rgba(145,91,216,0.06)` | hover de fila/celda |
| `zebra` | `#FBFAFC` | fondo de columnas futuras y filas alternas |

### 1.2 Semáforo (obligatorio, del contrato §7)

| `estado` | color gráfico (barras, anillos, puntos) | texto de chip | fondo de chip | etiqueta |
|---|---|---|---|---|
| `sin_datos` | `#9b8fb0` | `#6b5a8a` | `rgba(155,143,176,0.14)` | `Sin datos` |
| `en_riesgo` | `#D64455` | `#B0364A` | `rgba(214,68,85,0.12)` | `En riesgo` |
| `atencion` | `#CA8A04` | `#A16207` | `rgba(202,138,4,0.14)` | `Atención` |
| `cumple` | `#10B981` | `#047857` | `rgba(16,185,129,0.13)` | `Cumple` |
| `excede` | `#14B8A6` | `#0F766E` | `rgba(20,184,166,0.14)` | `Excede` |

> **Nota de accesibilidad, no de licencia creativa:** el hex del contrato se usa tal cual en
> todo elemento gráfico (relleno de barra, arco del anillo, punto del sparkline). Para texto
> ≤12px sobre el fondo tintado se usa la variante oscura de **la misma tinta**, porque
> `#D64455`/`#CA8A04`/`#10B981` sobre blanco quedan entre 3.0:1 y 3.9:1 y no pasan AA.
> Esto ya se hace en el repo (`.be-chip-ok { color: #0f766e }`).

Ambos van en un helper compartido, siguiendo el patrón de `clientesUi.js`:

```
src/views/Retos/retosUi.js
  export const ESTADOS = { sin_datos: {...}, en_riesgo: {...}, ... }
  export function estadoColor(e)   // hex gráfico
  export function estadoBadge(e)   // { color, background } para :style del chip
  export function estadoLabel(e)
  export function fmtValor(v, decimales, unidad)
  export function fmtPct(v)
  export function parseValor(txt)  // "1.240,5" -> 1240.5
```

### 1.3 Tipografía y densidad

| rol | px | peso | color | notas |
|---|---|---|---|---|
| Título de vista (`PageHeader`) | 18 | 800 | `#2C2039` | ya lo pone el componente |
| Subtítulo de vista | 12 | 400 | `#9b8fb0` | ya lo pone el componente |
| Título de card / sección | 13 | 700 | `#2C2039` | |
| Título de tarjeta Q | 15 | 800 | `#2C2039` | |
| Cifra grande (consolidado KPI) | 20 | 800 | `#2C2039` | `font-variant-numeric: tabular-nums` |
| Cifra secundaria (`/ meta`) | 12 | 600 | `#6b5a8a` | |
| Cuerpo / celda | 12.5 | 400 | `#2C2039` | tabular-nums y `text-align: right` en números |
| Header de tabla | 10 | 700 | `#9b8fb0` | `uppercase`, `letter-spacing: .05em` |
| Sub-label / metadatos | 10 | 600 | `#6b5a8a` | |
| Chip | 10 | 700 | según semáforo | `padding: 1px 7px`, `border-radius: 999px` |

Alturas fijas: fila de matriz **38px**, header de semana **34px**, banda de mes **18px**,
botón de barra de herramientas **30px**, input de drawer **32px**.

### 1.4 Superficies

```css
.rq-card   { background:#fff; border:1px solid #e8e0f0; border-radius:12px;
             box-shadow:0 1px 2px rgba(44,32,57,.04); }
.rq-card-q { border-radius:14px; padding:14px; }            /* tarjeta de trimestre */
.rq-panel  { background:#fff; border:1px solid #e8e0f0; border-radius:12px; overflow:hidden; }
```

Hover de tarjeta clicable: `border-color:#B08AE2; box-shadow:0 6px 18px rgba(44,32,57,.09);
transform:translateY(-1px); transition: all .14s ease;`

### 1.5 Formato numérico

- Locale `es-CO`. Miles `.`, decimal `,`.
- Decimales = `metrica.decimales` (0..4) siempre, también en el input al perder foco.
- Unidad: número + espacio + unidad (`640,5 MWh`); **excepción** `%` va pegado (`53,4%`).
- Porcentajes de avance/cumplimiento: 1 decimal, redondeo normal. En espacios apretados
  (anillo, columna `%` de la matriz) se muestra entero.
- Vacío: `·` color `#d9d0e6` dentro de la matriz; `—` color `#c7bdd8` en cualquier otro lado.
- Nunca abreviar (`1,2k`): son cifras que la gente compara contra metas.

### 1.6 Archivos a crear

```
src/views/Retos/
├── RetosListView.vue          # Vista A
├── RetoDetailView.vue         # Vista B (orquesta y hace las llamadas)
├── retosUi.js                 # semáforo, formateo, parseo
├── RetoQCard.vue              # tarjeta de trimestre
├── MetricaKpiCard.vue         # tile de KPI
├── MatrizSemanal.vue          # tabla sticky + teclado + autosave
├── SemanaDrawer.vue           # ritual semanal
├── MetricaDialog.vue          # crear / editar métrica
├── CopiarMetricasDialog.vue
├── EditarTrimestreDialog.vue
└── viz/
    ├── AnilloAvance.vue       # SVG 52×52
    ├── BulletMeta.vue         # SVG/divs, 8px de alto
    └── Sparkline.vue          # SVG 58×18
```

---

## 2. Vista A — `/general/retos`

### 2.1 Mockup

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ ┌──┐                                                                                        │
│ │⚑ │ Retos Q                                             [ 2026 ▾ ]  [ Ir al Q en curso ]   │
│ └──┘ Tablero trimestral del equipo · Q3 en curso, semana 7 de 14                            │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐ ┌─────────────────────────┐ ┌═════════════════════════┐ ┌─────────────────────────┐
│ Q1 · ene–mar   [Cerrado]│ │ Q2 · abr–jun   [Cerrado]│ ║ Q3 · jul–sep  [●En curso]║ │ Q4 · oct–dic  [Próximo] │
│                         │ │                         │ ║                         ║ │                         │
│ Retos Q1 2026     ╭───╮ │ │ Retos Q2 2026     ╭───╮ │ ║ Retos Q3 2026     ╭───╮ ║ │ Retos Q4 2026     ╭───╮ │
│ 1 ene – 31 mar    │ 94│ │ │ 1 abr – 30 jun    │ 68│ │ ║ 1 jul – 30 sep    │ 82│ ║ │ 1 oct – 31 dic    │ — │ │
│ 13 semanas·S13/13 ╰───╯ │ │ 13 semanas·S13/13 ╰───╯ │ ║ 14 semanas · S7/14╰───╯ ║ │ 14 semanas · S0/14╰───╯ │
│                   ritmo │ │                   ritmo │ ║                   ritmo ║ │                   ritmo │
│ [Atención]              │ │ [En riesgo]             │ ║ [Cumple]                ║ │ [Sin datos]             │
│ ─────────────────────── │ │ ─────────────────────── │ ║ ─────────────────────── ║ │                         │
│ MWh comercializados     │ │ MWh comercializados     │ ║ MWh comercializados     ║ │      ┌ ─ ─ ─ ─ ─ ┐      │
│  ▁▂▄▅▇▆▅▇  1.240,0 MWh  │ │  ▁▂▃▂▁▂▃▂    880,0 MWh  │ ║  ▁▃▅▂▄▆▅     640,5 MWh  ║ │        Sin métricas     │
│ Nuevos PPA firmados     │ │ Nuevos PPA firmados     │ ║ Nuevos PPA firmados     ║ │      Definir métricas   │
│  ▁▁▂▃▃▄▅▅          7    │ │  ▁▁▁▂▂▂▂▂          4    │ ║  ▁▁▂▂▃▃▃           3    ║ │      └ ─ ─ ─ ─ ─ ┘      │
│ Fallas resueltas        │ │ Fallas resueltas        │ ║ Fallas resueltas        ║ │                         │
│  ▃▅▄▆▅▇▆▅         38    │ │  ▃▄▅▄▃▄▅▄         31    │ ║  ▄▅▃▆▄▅▅          22    ║ │                         │
│ +2 métricas más         │ │ +2 métricas más         │ ║ +2 métricas más         ║ │                         │
│ ─────────────────────── │ │ ─────────────────────── │ ║ ─────────────────────── ║ │                         │
│ 5 métricas · 13 sem.    │ │ 5 métricas · 13 sem.    │ ║ 5 métricas · 6 sem.     ║ │ 0 métricas              │
└─────────────────────────┘ └─────────────────────────┘ └═════════════════════════┘ └─────────────────────────┘
```

### 2.2 Layout

- Raíz `<div class="space-y-4">`.
- `<PageHeader title="Retos Q" :subtitle="subtituloAnio">`
  - `#lead`: tile 40×40, `border-radius:12px`, `background:rgba(145,91,216,0.12)`,
    `color:#915BD8`, ícono `pi pi-flag-fill` a 17px, centrado con `display:grid;place-items:center`
    (idéntico a `.cv-icon-tile`).
  - `#actions`:
    - `Select` (PrimeVue) de año. `:options="anios_disponibles"`, `size="small"`, `class="w-[104px]"`.
      Al cambiar → `GET /retos?anio=`, se refresca la grilla, se escribe `?anio=` en la URL
      con `router.replace` para que el enlace sea compartible.
    - `Button` `label="Ir al Q en curso"` `icon="pi pi-arrow-right"` `iconPos="right"`
      `size="small"` `outlined` `severity="secondary"`.
      Solo visible si algún reto del año tiene `estado_periodo === 'en_curso'`.
- Grilla: `grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`.
  A 1280px las 4 tarjetas caben en fila (mínimo cómodo 268px cada una).

### 2.3 Anatomía de `RetoQCard.vue`

Contenedor: `.rq-card-q`, `cursor:pointer`, `padding:14px`, `display:flex; flex-direction:column; gap:10px`.

**a) Eyebrow (fila 1)** — `display:flex; align-items:center; justify-content:space-between`
- Izquierda: `Q3` en 11px/800/`#915BD8` + `·` + `jul–sep` en 11px/600/`#9b8fb0`
  (meses derivados de `fecha_inicio`/`fecha_fin`, abreviados sin punto).
- Derecha: chip de `estado_periodo`, 10px/700, `padding:1px 7px`, `border-radius:999px`:

| `estado_periodo` | texto | color | fondo | extra |
|---|---|---|---|---|
| `proximo` | `Próximo` | `#6b5a8a` | `rgba(44,32,57,0.06)` | — |
| `en_curso` | `En curso` | `#915BD8` | `rgba(145,91,216,0.12)` | punto 5px `#915BD8` a la izquierda con `animation: rq-pulse 2s ease-in-out infinite` (opacidad 1→.35→1) |
| `cerrado` | `Cerrado` | `#9b8fb0` | `rgba(44,32,57,0.05)` | — |

**b) Bloque identidad + anillo (fila 2)** — `display:flex; justify-content:space-between; align-items:flex-start; gap:10px`
- Columna izquierda (`min-width:0`):
  - `nombre` — 15px/800/`#2C2039`, `truncate`.
  - Rango — 11px/400/`#6b5a8a`: `1 jul – 30 sep`.
  - Semanas — 11px/400/`#9b8fb0`: `14 semanas · S7 de 14`.
    Si `semana_actual === null`: `14 semanas` a secas cuando es `proximo`; `14 semanas · cerrado` cuando es `cerrado`.
- Columna derecha: `<AnilloAvance :pct="avance_global_pct" :estado="estadoQ" />` (§2.4)
  + etiqueta `ritmo` debajo, 8px/700/`#9b8fb0`, `uppercase`, `letter-spacing:.06em`, centrada.

**c) Chip de estado agregado (fila 3)**
Chip del semáforo (§1.2) con la etiqueta del `estadoQ`. `estadoQ` se deriva en el front con
los mismos umbrales del contrato §4 aplicados a `avance_global_pct`
(`null → sin_datos`, `<70 → en_riesgo`, `<100 → atencion`, `<110 → cumple`, `≥110 → excede`).

**d) Separador** — `height:1px; background:#ECE7F2`.

**e) Lista de métricas (máx. 3)** — `display:flex; flex-direction:column; gap:6px`
Se muestran las 3 primeras por `orden` de las `activa === true`.
Cada ítem:
- Línea 1: nombre 11px/600/`#2C2039`, `truncate`.
- Línea 2: `display:flex; align-items:center; gap:8px`
  - `<Sparkline :serie="m.serie" :color="estadoColor(m.estado)" />` — 58×18 (§2.5)
  - `flex:1` separador
  - consolidado: 12px/700/`#2C2039`, tabular-nums, + unidad 10px/600/`#9b8fb0`.
    Si `consolidado == null` → `—`.
- Si hay más de 3: línea final `+2 métricas más`, 10px/600/`#915BD8`, sin subrayado
  (no es un enlace aparte, toda la tarjeta navega).

**f) Pie** — 10px/600/`#6b5a8a`:
`5 métricas · 6 semanas con datos`. Singulares correctos (`1 métrica`, `1 semana con datos`).

**Tarjeta sin métricas** (`total_metricas === 0`): en lugar de (d)+(e)+(f), un bloque
punteado `border:1px dashed #d9d0e6; border-radius:10px; padding:14px 10px; text-align:center`:
- 11px/600/`#9b8fb0`: `Sin métricas definidas`
- 11px/700/`#915BD8`: `Definir métricas` (todo el bloque navega igual).

**Estados de la tarjeta**
- Reposo: `border:1px solid #e8e0f0`.
- `en_curso`: `border:1.5px solid #915BD8; box-shadow:0 0 0 3px rgba(145,91,216,0.10)`.
  Se mantiene también en hover.
- Hover: ver §1.4. `cursor:pointer`.
- Foco de teclado (la tarjeta es `role="link"` con `tabindex="0"`):
  `outline:2px solid #915BD8; outline-offset:2px`.
- Clic o `Enter`/`Space` → `router.push('/general/retos/' + id)`.

### 2.4 `AnilloAvance.vue`

```
SVG 52×52 · cx=cy=26 · r=22 · stroke-width=6 · stroke-linecap="round"
circunferencia C = 138.23
transform="rotate(-90 26 26)" sobre los arcos
```

1. **Pista**: `<circle>` `stroke="#F1ECF7"`.
2. **Arco principal**: `stroke = estadoColor(estado)`,
   `stroke-dasharray = (min(pct,100)/100)*C + ' ' + C`.
   Transición `stroke-dasharray .4s cubic-bezier(.4,0,.2,1)`.
3. **Arco de exceso** (solo si `pct > 100`): segundo `<circle>` encima,
   `stroke="#14B8A6"`, `stroke-dasharray = (min(pct-100,100)/100)*C`, `opacity:.9`.
   Se dibuja desde el mismo origen; visualmente se lee como una segunda vuelta.
4. **Marca de referencia 100%**: no se dibuja — en un anillo, "lleno" *es* el 100%.
   (La marca de meta esperada vive en el bullet de la Vista B, donde sí hay eje.)
5. **Centro**: `<text>` con el pct entero, 13px/800, `fill:#2C2039`, `text-anchor:middle`,
   `dominant-baseline:central`. Si `pct == null` → `—` en `fill:#9b8fb0`.
   Sin el símbolo `%` dentro (lo dice la etiqueta `ritmo` de abajo y ahorra 8px de ancho).

Accesibilidad: `role="img"`, `:aria-label="'Ritmo del trimestre: 82 por ciento, cumple'"`.

### 2.5 `Sparkline.vue`

- SVG `58×18`, `preserveAspectRatio="none"` desactivado (usar viewBox `0 0 58 18`).
- Entrada: `serie` del contrato (`[{semana, valor}]`, con nulos).
- Escala Y: `[0, max(valores no nulos)]`; si todos son 0 o no hay ninguno → no se dibuja
  nada y se muestra una línea base 1px `#ECE7F2` a media altura.
- Trazo: `<polyline>` `fill="none"` `stroke=<color>` `stroke-width="1.5"`
  `stroke-linejoin="round"` `stroke-linecap="round"`. Los nulos **cortan** la línea
  (se emiten varios `<polyline>`, no se interpolan huecos).
- Área bajo la curva: `<path>` cerrado con `fill=<color>` `opacity=.12`.
- Último punto con dato: `<circle r="2" :fill="color" />`.
- Sin ejes, sin tooltip (es un adorno de escaneo; el dato real está al lado).
- `aria-hidden="true"` — la cifra contigua ya lo dice todo.

### 2.6 Estados de la Vista A

| estado | tratamiento |
|---|---|
| **Cargando** | 4 `Skeleton` (PrimeVue) de `height="238px"` `borderRadius="14px"` en la misma grilla. El `PageHeader` se pinta ya, con el `Select` deshabilitado. Sin spinner: el layout es conocido. |
| **Recargando** (cambio de año) | Las tarjetas se quedan a `opacity:.5; pointer-events:none` y aparece una barra indeterminada de 2px `#915BD8` pegada bajo el `PageHeader`. Máx. 400ms de percepción; si tarda más de 3s no cambia nada (no hay spinner de rescate). |
| **Error** | `Message` (PrimeVue) `severity="error"` `:closable="false"` con el texto `No se pudieron cargar los retos del año.` y dentro un `Button` `label="Reintentar"` `size="small"` `text`. |
| **Vacío** | No existe: el `GET` autocrea los 4 trimestres. Si aun así llega `retos: []`, se muestra el mismo `Message` de error. |
| **Hover / foco** | §2.3. |

---

## 3. Vista B — `/general/retos/:id`, estado vacío

Es el primer clic del usuario. Objetivo: que en 5 segundos entienda qué es una métrica y
arranque, con la salida rápida de copiar de otro Q.

### 3.1 Mockup

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ ‹ Retos Q                                                                                   │
│ ┌──┐                                                                                        │
│ │Q3│ Retos Q3 2026                                        [ Copiar de otro Q ]  [ ⋯ ]       │
│ └──┘ 1 jul – 30 sep · 14 semanas · S7 en curso                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                             │
│                                        ┌────────┐                                           │
│                                        │   ⚑    │                                           │
│                                        └────────┘                                           │
│                       Este trimestre todavía no tiene métricas                              │
│                                                                                             │
│           Define qué vas a medir entre el 1 de julio y el 30 de septiembre.                 │
│        Cada métrica se llena una vez por semana y el tablero calcula el consolidado.        │
│                                                                                             │
│                  [ + Definir la primera métrica ]   [ Copiar de otro trimestre ]            │
│                                                                                             │
│  ─────────────────────────────────────────────────────────────────────────────────────────  │
│  Ejemplos:  MWh comercializados (suma)  ·  Nuevos PPA firmados (suma)  ·                    │
│             Disponibilidad de plantas % (promedio)  ·  Fallas abiertas (último)             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Especificación

Card `.rq-card`, `padding:48px 24px`, `text-align:center`, `max-width:640px`, `margin:0 auto`
(el card no ocupa todo el ancho: el vacío centrado se lee mejor que un card gigante).

Orden y tokens:
1. Tile 56×56, `border-radius:16px`, `background:rgba(145,91,216,0.10)`,
   ícono `pi pi-flag` 24px `#915BD8`. `margin-bottom:16px`.
2. Título: `Este trimestre todavía no tiene métricas` — 15px/800/`#2C2039`.
3. Párrafo: 12.5px/400/`#6b5a8a`, `line-height:1.55`, `max-width:440px; margin:8px auto 0`.
   Texto literal: `Define qué vas a medir entre el 1 de julio y el 30 de septiembre.
   Cada métrica se llena una vez por semana y el tablero calcula el consolidado.`
   (las fechas salen de `fecha_inicio`/`fecha_fin` en formato largo español).
4. Botonera, `margin-top:20px`, `display:flex; gap:8px; justify-content:center; flex-wrap:wrap`:
   - `Button` **primario**: `label="Definir la primera métrica"` `icon="pi pi-plus"` `size="small"`.
   - `Button` **secundario**: `label="Copiar de otro trimestre"` `icon="pi pi-copy"`
     `size="small"` `outlined` `severity="secondary"`.
     Deshabilitado con `v-tooltip.bottom="'No hay otros trimestres con métricas'"` si no existe
     ningún otro reto con `total_metricas > 0`.
5. Separador `height:1px; background:#ECE7F2; margin:24px 0 12px`.
6. Línea de ejemplos, 11px/400/`#9b8fb0`, con los nombres en `#6b5a8a`:
   `Ejemplos: MWh comercializados (suma) · Nuevos PPA firmados (suma) · Disponibilidad de plantas % (promedio) · Fallas abiertas (último)`
   No son clicables (no queremos crear métricas basura de un clic accidental).

**Estado "métricas pero ninguna con datos"**: NO usa esta pantalla. Se muestran los KPIs
en `sin_datos` y la matriz vacía, con un banner dentro del card de la matriz (§5.7).

---

## 4. Vista B — header y KPIs (con métricas)

### 4.1 Mockup completo

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ‹ Retos Q                                                                                               │
│ ┌──┐                                                                                                    │
│ │Q3│ Retos Q3 2026                        [+ Métrica]  [ ⚑ Registrar semana 7 ]  [ ⋯ ]                  │
│ └──┘ 1 jul – 30 sep · 14 semanas · S7 en curso · 5 métricas                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────┐ ┌───────────────────────────────────────┐ ┌────────────────────┐
│ MWh comercializados        [Cumple] ⋯ │ │ Nuevos PPA firmados     [En riesgo] ⋯ │ │ Disponibilidad  ...│
│ MWh · suma · Laura                    │ │ # · suma · Alejandro                  │ │ % · promedio       │
│                                       │ │                                       │ │                    │
│ 640,5  / 1.200 MWh      ▁▃▅▂▄▆▅       │ │ 3  / 12               ▁▁▂▂▃▃▃         │ │ 97,4  / 98,0       │
│ ┌───────────────────────────────────┐ │ │ ┌───────────────────────────────────┐ │ │ ┌────────────────┐ │
│ │██████████████████│░░░░░░░░░░░░░░░░│ │ │ │██████▌      │░░░░░░░░░░░░░░░░░░░░░│ │ │ │████████████│░░░│ │
│ └───────────────────────────────────┘ │ │ └───────────────────────────────────┘ │ │ └────────────────┘ │
│ 53,4% de la meta · ritmo 107%         │ │ 25,0% de la meta · ritmo 50%          │ │ 99,4% · ritmo 99%  │
│ Esperado a hoy 600,0 · 7 de 14 sem.   │ │ Esperado a hoy 6,0 · 7 de 14 sem.     │ │ Esperado 98,0      │
└───────────────────────────────────────┘ └───────────────────────────────────────┘ └────────────────────┘
```

### 4.2 Header

- Migas: encima del `PageHeader`, `<router-link to="/general/retos">` con
  `‹ Retos Q` — 11px/700/`#915BD8`, `display:inline-flex; gap:4px; align-items:center`,
  ícono `pi pi-chevron-left` 9px. Hover `text-decoration:underline`.
  Área de clic mínima 24px de alto (`padding:4px 2px`).
- `<PageHeader :title="reto.nombre" :subtitle="subtitulo">`
  - `#lead`: tile 40×40 idéntico al de la Vista A pero con **texto** en vez de ícono:
    `Q3` en 14px/800/`#915BD8`.
  - `subtitulo` = `1 jul – 30 sep · 14 semanas · S7 en curso · 5 métricas`.
    Variantes: `· aún no empieza` (proximo), `· cerrado` (cerrado).
  - `#actions`, en este orden (izquierda→derecha):
    1. `Button` `label="Métrica"` `icon="pi pi-plus"` `size="small"` `outlined`
       (`color:#915BD8; border-color:#915BD8`).
    2. **CTA amarillo solar** — el único de la vista. Botón nativo, no `Button`, para
       controlar el color de marca:
       ```html
       <button class="rq-cta">
         <i class="pi pi-flag-fill" /> Registrar semana 7
       </button>
       ```
       ```css
       .rq-cta{ display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 14px;
                border:0;border-radius:9px;background:#F6FF72;color:#2C2039;
                font-size:12.5px;font-weight:800;cursor:pointer;
                box-shadow:0 1px 0 rgba(44,32,57,.05);transition:filter .12s, box-shadow .12s; }
       .rq-cta:hover{ filter:brightness(.97); box-shadow:0 3px 12px rgba(246,255,114,.55); }
       .rq-cta:focus-visible{ outline:2px solid #2C2039; outline-offset:2px; }
       ```
       Label dinámico: `Registrar semana 7` si `semana_actual != null`;
       `Registrar semana 14` (la última) si el Q está `cerrado`;
       `Registrar semana 1` si está `proximo`.
    3. `Button` `icon="pi pi-ellipsis-h"` `text` `rounded` `size="small"` que abre un
       `Menu` (PrimeVue, `:popup="true"`) con:
       - `Editar trimestre` (`pi pi-pencil`) → `EditarTrimestreDialog`
       - `Copiar métricas de otro Q` (`pi pi-copy`) → `CopiarMetricasDialog`
       - separador
       - `Exportar a Excel` (`pi pi-file-excel`) → matriz plana, hoja única
         (`xlsx-js-style` ya está en el stack).

### 4.3 Grilla de KPIs

`grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4`.
Solo métricas `activa === true`, ordenadas por `orden`.

### 4.4 `MetricaKpiCard.vue`

`.rq-card`, `padding:12px 14px`, `display:flex; flex-direction:column; gap:8px`.
La tarjeta **no** navega; es informativa. Al hacer clic hace scroll a su fila en la matriz
y la resalta 1.2s (`background: rgba(145,91,216,.12)` que se desvanece). `cursor:pointer`.

1. **Fila título** — `flex; align-items:center; gap:6px`
   - Nombre: 12.5px/700/`#2C2039`, `truncate`, `flex:1`.
     Con `v-tooltip.top` de `descripcion` si existe.
   - Chip de estado (§1.2).
   - `Button` `icon="pi pi-ellipsis-h"` `text` `rounded` `size="small"`,
     `opacity:0` en reposo → `opacity:1` en hover/focus-within de la tarjeta.
     Menú: `Editar métrica`, `Desactivar métrica`, separador, `Eliminar métrica` (rojo).
2. **Fila metadatos** — 10px/600/`#6b5a8a`:
   `MWh · suma · Laura`. Se omiten los tramos vacíos (sin unidad, sin responsable).
   Si `direccion === 'menor_mejor'`, se agrega un chip `menos es mejor`
   (10px/700, `color:#6b5a8a`, `background:rgba(44,32,57,.06)`, `padding:0 6px`) al final.
3. **Fila cifras** — `flex; align-items:baseline; gap:6px`
   - Consolidado: 20px/800/`#2C2039`, tabular-nums. `—` en `#c7bdd8` si es null.
   - `/ 1.200 MWh` : 12px/600/`#6b5a8a`. Se omite entero si `meta` es null.
   - `flex:1`
   - `<Sparkline :serie="serie" :color="estadoColor(estado)" />` 58×18.
4. **Bullet** — `<BulletMeta>` (§4.5).
5. **Pie, línea 1** — 11px/600: `53,4% de la meta` en `#2C2039` + `·` +
   `ritmo 107%` con `color = estadoColor(estado)`.
   Si `meta` es null: `Sin meta definida` en `#9b8fb0`.
6. **Pie, línea 2** — 10px/400/`#9b8fb0`:
   `Esperado a hoy 600,0 · 7 de 14 semanas con dato`.
   Si `tipo_agregacion !== 'suma'`: `Meta 98,0 · 7 de 14 semanas con dato`
   (no se dice "esperado a hoy" porque no se prorratea).

### 4.5 `BulletMeta.vue` — el chart de progreso obligatorio

Contenedor `position:relative; height:14px` (la barra son 8px, los 3px de arriba y abajo
son el espacio que necesita la marca de meta para sobresalir).

```
  ┌─ marca de meta esperada: 2px × 14px, #2C2039 @ .45, border-radius:1px
  │
──┼──────────────────────────────────────────────────
  ▼
┌────────────────────────┬─────────────────────────┐   ← pista 8px, #F1ECF7, radius 4px
│████████████████████████│                         │   ← relleno, color = estadoColor
└────────────────────────┴─────────────────────────┘
 0%                      53,4%                  100%
```

Geometría exacta:
- **Pista**: `height:8px; border-radius:4px; background:#F1ECF7; width:100%;
  position:absolute; top:3px; left:0; overflow:hidden`.
- **Relleno**: `position:absolute; top:3px; left:0; height:8px; border-radius:4px;
  width: clamp(0, avance_pct, 100)%; background: estadoColor(estado);
  transition: width .35s cubic-bezier(.4,0,.2,1), background-color .2s`.
- **Tapa de exceso** (solo si `avance_pct > 100`): `position:absolute; right:0; top:3px;
  width:6px; height:8px; border-radius:0 4px 4px 0; background:#14B8A6` +
  un bisel de 2px blanco a su izquierda (`box-shadow:-2px 0 0 #fff`) para que se lea
  como "se pasó del borde".
- **Marca de meta esperada**: `position:absolute; top:0; height:14px; width:2px;
  border-radius:1px; background:#2C2039; opacity:.45;
  left: clamp(0, meta_esperada / meta * 100, 100)%; transform: translateX(-1px)`.
  Se omite si `meta` o `meta_esperada` son null.
  `v-tooltip.top="'Meta esperada a hoy: 600,0 MWh'"`.
- **Zona previa a la marca** (opcional, ayuda mucho a leer "voy atrasado"):
  un rectángulo `background:rgba(44,32,57,.035)` desde 0 hasta la marca, bajo el relleno.
- Sin números dentro de la barra: van en el pie de la tarjeta.
- `role="img"` + `aria-label="Avance 53,4 por ciento de la meta, esperado a hoy 50 por ciento, estado cumple"`.

**Caso `meta == null`**: no se dibuja bullet. En su lugar, una línea 8px con
`background:repeating-linear-gradient(135deg,#F1ECF7 0 4px,#fff 4px 8px)` y el pie dice
`Sin meta definida`.

**Caso `menor_mejor`**: la barra sigue midiendo `consolidado/meta` (cuánto del presupuesto
llevas gastado). El color, que viene del backend con la dirección ya invertida, es el que
comunica si eso es bueno o malo. El chip `menos es mejor` del punto 2 evita la ambigüedad.

---

## 5. Vista B — la matriz semanal

### 5.1 Mockup

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Matriz semanal          Guardado 10:42        [ Ocultar semanas futuras ⌄ ]  [ ⤓ Excel ]                 │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                    │      JULIO       │        AGOSTO       │      SEPTIEMBRE     │                      │
│ MÉTRICA            │  S1   S2   S3  S4│ S5 ▐S6▌ S7   S8   S9│ S10  S11  S12  S13  │ CONSOL.  META    %   │
│                    │29jun 6–12 13–19..│..  3–9  10–16  ..   │ ..                  │                      │
├────────────────────┼──────────────────┼─────────────────────┼─────────────────────┼──────────────────────┤
│ MWh comercializados│ 90,0 88,5 102,0..│ 95 ▐98,0▌ ·     ░   │  ░    ░    ░    ░   │  640,5  1.200   53%  │
│ MWh · suma · Laura │                  │                     │                     │ ▓▓▓▓▓▓▓░░░░░░░       │
├────────────────────┼──────────────────┼─────────────────────┼─────────────────────┼──────────────────────┤
│ Nuevos PPA firmados│  1    0    1    0│  1 ▐ 0 ▌  ·     ░   │  ░    ░    ░    ░   │      3     12   25%  │
│ # · suma · Alejandro                  │                     │                     │ ▓▓▓░░░░░░░░░░░       │
├────────────────────┼──────────────────┼─────────────────────┼─────────────────────┼──────────────────────┤
│ Disponibilidad     │ 97,1 98,0 96,4 ..│ .. ▐97,9▌ ·     ░   │  ░    ░    ░    ░   │   97,4   98,0   99%  │
│ % · promedio       │                  │                     │                     │ ▓▓▓▓▓▓▓▓▓▓▓▓▓░       │
├────────────────────┼──────────────────┼─────────────────────┼─────────────────────┼──────────────────────┤
│ Llenado            │ 5/5  5/5  5/5 5/5│5/5 ▐3/5▌ 0/5   —    │  —    —    —    —   │                      │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────┘
   ↑ sticky izquierda                    ↑ semana actual        ↑ futuras (atenuadas)   ↑ sticky derecha
```

### 5.2 Contenedor y barra de herramientas

Card `.rq-panel`.

**Barra de herramientas** — `height:44px; padding:0 12px; display:flex; align-items:center;
gap:8px; border-bottom:1px solid #ECE7F2`:
- Izquierda: `Matriz semanal` 12.5px/700/`#2C2039`.
- Indicador de guardado (§5.6), `margin-left:10px`.
- `flex:1`.
- `ToggleSwitch` (PrimeVue) + label `Ocultar semanas futuras`, 11px/600/`#6b5a8a`.
  Por defecto **apagado**. Estado en `localStorage` con clave `retos:ocultarFuturas`.
- `Button` `icon="pi pi-file-excel"` `label="Excel"` `size="small"` `text`
  (`color:#6b5a8a`), oculta el label bajo 1024px.

**Zona de scroll**: `overflow: auto; max-height: calc(100vh - 340px); min-height: 200px;`
Scrollbar fina de marca (mismo tratamiento que `.sim-plant-zone`):
```css
.rq-matriz-wrap::-webkit-scrollbar{ height:8px; width:8px; }
.rq-matriz-wrap::-webkit-scrollbar-thumb{ background:rgba(145,91,216,.25); border-radius:4px; }
.rq-matriz-wrap::-webkit-scrollbar-track{ background:transparent; }
```

### 5.3 Estructura de la tabla

```html
<table class="rq-matriz">
  <caption class="sr-only">Valores semanales por métrica del trimestre Retos Q3 2026</caption>
  <thead>
    <tr class="rq-meses">   <!-- banda de mes, 18px -->
      <th class="rq-sticky-l" rowspan="2"></th>
      <th :colspan="n" scope="colgroup">JULIO</th> ...
      <th class="rq-sticky-r-3" rowspan="2">CONSOL.</th>
      <th class="rq-sticky-r-2" rowspan="2">META</th>
      <th class="rq-sticky-r-1" rowspan="2">%</th>
    </tr>
    <tr class="rq-semanas">  <!-- 34px -->
      <th v-for="s in semanas" scope="col">S6<br><small>3–9 feb</small></th>
    </tr>
  </thead>
  <tbody>…</tbody>
  <tfoot>…</tfoot>
</table>
```

Nota: la primera celda del `thead` es la esquina; lleva el texto `MÉTRICA` alineado abajo
a la izquierda (10px/700/`#9b8fb0` uppercase) y `rowspan="2"`.

**Anchos fijos** (`table-layout: fixed`, es lo que hace predecibles los offsets sticky):

| columna | ancho |
|---|---|
| métrica (sticky izq.) | `240px` (`180px` bajo 1280px) |
| cada semana | `66px` |
| `CONSOLIDADO` | `92px` |
| `META` | `78px` |
| `%` | `68px` |

Ancho total con 14 semanas: 240 + 924 + 238 = **1402px** → scroll horizontal en pantallas
de trabajo normales. Es correcto y esperado: es una matriz.

**CSS sticky** (el núcleo):
```css
.rq-matriz{ width:100%; border-collapse:separate; border-spacing:0; table-layout:fixed; }
.rq-matriz th, .rq-matriz td{ background:#fff; }

/* fila de meses */
.rq-meses th{ position:sticky; top:0; z-index:4; height:18px;
              font-size:9px; font-weight:800; letter-spacing:.08em; color:#9b8fb0;
              background:#faf8fd; border-bottom:1px solid #ECE7F2; }
/* fila de semanas */
.rq-semanas th{ position:sticky; top:18px; z-index:4; height:34px;
                background:#faf8fd; border-bottom:1px solid #ECE7F2; }

.rq-sticky-l{ position:sticky; left:0; z-index:3; box-shadow:1px 0 0 #ECE7F2; }
.rq-sticky-r-1{ position:sticky; right:0;    z-index:3; }
.rq-sticky-r-2{ position:sticky; right:68px; z-index:3; }
.rq-sticky-r-3{ position:sticky; right:146px;z-index:3; box-shadow:-1px 0 0 #ECE7F2; }
thead .rq-sticky-l, thead .rq-sticky-r-1,
thead .rq-sticky-r-2, thead .rq-sticky-r-3{ z-index:6; background:#faf8fd; }

/* separador vertical entre meses */
.rq-mes-inicio{ border-left:1px solid #ECE7F2; }
```
Las tres columnas de la derecha llevan `background:#FDFCFE` en `tbody` para que se lean
como zona de resultado, no como más celdas editables.

### 5.4 Celda de la columna métrica (sticky izquierda)

`padding:0 10px`, `height:38px`, `display:flex; flex-direction:column; justify-content:center`.
- Línea 1: nombre, 12.5px/600/`#2C2039`, `line-height:15px`, `truncate`, `title` con el nombre completo.
- Línea 2: `MWh · suma · Laura`, 10px/400/`#6b5a8a`, `line-height:12px`, `truncate`.
- En hover de la fila aparece a la derecha un `Button` `icon="pi pi-ellipsis-h"` `text`
  `rounded` de 24×24 (área de clic 28×28 con padding), mismo menú que el KPI card.

`scope="row"` en el `<th>` de esta columna.

### 5.5 Celda de valor — anatomía y estados

Estructura por celda:
```html
<td class="rq-cell" :class="[estadoColumna, {editando, guardando, ok, error, fuera}]">
  <div class="rq-cell-inner"
       tabindex="0" role="gridcell"
       :aria-label="ariaCelda"
       @keydown="onKey" @dblclick="editar" @click="editar">
    <span v-if="!editando">1.240,5</span>
    <input v-else type="text" inputmode="decimal" />
    <i v-if="nota" class="rq-nota" />        <!-- esquina superior derecha -->
    <span v-if="guardando" class="rq-progress" />  <!-- barra 2px inferior -->
  </div>
</td>
```

Base: `height:38px; padding:0 8px; text-align:right; font-size:12.5px;
font-variant-numeric:tabular-nums; color:#2C2039; position:relative;
border-bottom:1px solid #F4F0F9; cursor:cell;`

| estado | tratamiento visual |
|---|---|
| **Vacío** | contenido `·` centrado horizontalmente, `color:#d9d0e6`, 14px |
| **Con valor** | número formateado con `decimales` de la métrica |
| **Hover** | `background:rgba(145,91,216,.06)`; además la fila entera toma `rgba(44,32,57,.025)` y el header de esa columna `rgba(145,91,216,.10)` (cross-highlight vía `hoverRow`/`hoverCol` en estado local — imprescindible con 14 columnas) |
| **Foco (sin editar)** | `outline:2px solid #915BD8; outline-offset:-2px` (inset, para que las columnas sticky vecinas no lo recorten) |
| **En edición** | el `<input>` ocupa toda la celda: `width:100%;height:36px;border:0;background:#fff;text-align:right;font:inherit;outline:none;padding:0 8px`. La celda toma `box-shadow: inset 0 0 0 2px #915BD8; background:#fff; z-index:2`. El texto se selecciona entero al entrar (`select()`), así escribir reemplaza |
| **Guardando** | barra de 2px al fondo de la celda: `position:absolute;left:0;right:0;bottom:0;height:2px;background:#915BD8;` con `animation: rq-indeterminate 1s linear infinite` (traslada un gradiente). La celda queda `background:rgba(145,91,216,.05)`. **El valor no se bloquea**: puedes seguir tabulando |
| **Guardado ok** | 700ms: `background: rgba(16,185,129,.16)` que se desvanece con `transition: background-color .7s ease-out` a transparente. Sin ícono, sin toast (100 toasts al día es ruido) |
| **Error de guardado** | `box-shadow: inset 0 0 0 2px #D64455; background: rgba(214,68,85,.07)` permanente hasta reintentar; ícono `pi pi-exclamation-circle` 9px `#D64455` en la esquina inferior izquierda; `v-tooltip` con el `detail` del backend. El valor **no se revierte** (se conserva para reintentar). Un toast de error, uno solo, con `Reintentar` |
| **Fuera de rango** | Advertencia, **no** bloqueo. Se dispara si `valor < 0` con `direccion === 'mayor_mejor'`, o si `|valor| > 5 × (meta / total_semanas)` con `meta != null`. Texto en `#A16207` + triangulito `pi pi-exclamation-triangle` 8px `#CA8A04` pegado a la izquierda del número. Tooltip: `Valor inusual para esta métrica. Se guardó de todas formas.` |
| **Con nota** | triángulo de 5px en la esquina superior derecha: `border-width:0 5px 5px 0; border-color: transparent #915BD8 transparent transparent` (patrón "comentario de Excel"). Tooltip: la nota + `— Juan José, 14 ago` |
| **Semana actual** | toda la columna `background: rgba(145,91,216,.045)`; la celda del header lleva `border-top:2px solid #915BD8` y su `S6` en `#2C2039`/800 |
| **Semana futura** | `background:#FBFAFC; color:#c7bdd8`. Si tiene valor, el número se pinta a `opacity:.55`. Se puede enfocar y editar con un clic (no está `disabled`); al enfocarse recupera `background:#fff` y color normal. Tooltip en el header: `Semana futura` |
| **Semana parcial** | el header lleva `border-bottom:1px dashed #c7bdd8` y tooltip `Semana parcial: del 1 al 5 de julio` (calculado con `inicio_efectivo`/`fin_efectivo`). La celda no cambia |
| **Métrica inactiva** | la fila entera a `opacity:.5`; las celdas no se pueden editar; chip `Inactiva` junto al nombre |

Header de semana (34px), contenido apilado y centrado:
- `S6` — 11px/800. `#2C2039` si es actual o pasada, `#c7bdd8` si futura.
- `3–9 feb` — 9px/400/`#9b8fb0` (`#c7bdd8` si futura), `white-space:nowrap`.
- Todo el `<th>` es clicable → abre el drawer de esa semana. `cursor:pointer`,
  hover `background:rgba(145,91,216,.10)`, `aria-label="Abrir semana 6, 3 al 9 de febrero"`,
  `tabindex="0"` y `Enter` lo abre también.

### 5.6 Columnas finales

- **CONSOLIDADO**: `text-align:right; padding:0 10px`. Número 12.5px/700/`#2C2039`.
  Al recibir la `MetricaResumen` recalculada, pulso de 500ms: `color:#915BD8` → vuelve.
- **META**: 12px/400/`#6b5a8a`. `—` si es null.
- **%**: dos elementos apilados y centrados:
  - `cumplimiento_pct` entero + `%`, 11px/800, `color = estadoColor(estado)`.
  - Micro-barra 3px de alto, ancho 46px, `border-radius:2px`, pista `#F1ECF7`,
    relleno `min(avance_pct,100)%` con `estadoColor`, y la marca de meta esperada
    como un `1px` vertical `#2C2039 @ .45` en la posición proporcional.
  `v-tooltip.left` con: `Consolidado 640,5 · Esperado a hoy 600,0 · Ritmo 106,8%`.

### 5.7 Fila `tfoot` — "Llenado"

`background:#faf8fd; border-top:1px solid #ECE7F2; height:30px`.
- Celda sticky izquierda: `Llenado` 10px/700/`#9b8fb0` uppercase.
- Por semana: `3/5` en 10px/700. Color: `#10B981` si completo, `#CA8A04` si parcial,
  `#9b8fb0` si 0, `#c7bdd8` si la semana es futura (muestra `—`).
  Debajo, micro-barra de 2px de alto y 40px de ancho con la fracción.
  Clicable → abre el drawer de esa semana.
- Columnas finales: vacías.

### 5.8 Indicador de guardado (barra de herramientas)

Un solo componente, 11px/600, con `min-width:110px` para que no salte el layout:

| condición | contenido |
|---|---|
| en vuelo ≥1 PUT | `pi pi-spin pi-spinner` 10px + `Guardando…` en `#915BD8` |
| último guardado ok | `pi pi-check` 10px + `Guardado 10:42` en `#6b5a8a` |
| algún error pendiente | `pi pi-exclamation-circle` 10px + `1 cambio sin guardar` en `#B0364A`, clicable → hace scroll a la primera celda en error |
| nada aún | vacío (no ocupa espacio visual, sí el `min-width`) |

### 5.9 Banner "sin datos todavía"

Si hay métricas pero `semanas_con_datos === 0`, dentro del card de la matriz, encima de
la tabla: franja `background:rgba(145,91,216,.06); border-bottom:1px solid #ECE7F2;
padding:8px 12px; font-size:11.5px; color:#6b5a8a`:
`Todavía no hay valores registrados. Abre una semana para empezar el llenado.` +
`Button` `label="Registrar semana 7"` `size="small"` `text` a la derecha.

### 5.10 Estados de carga y error de la matriz

- **Cargando**: 6 filas de `Skeleton` `height="38px"` dentro del card, precedidas por el
  header real ya pintado (sabemos las semanas apenas responde el `GET`). Skeleton, no spinner.
- **Recargando tras cambiar fechas del Q**: la tabla queda a `opacity:.45;
  pointer-events:none` + barra indeterminada de 2px `#915BD8` bajo la barra de herramientas.
- **Error**: `Message severity="error"` dentro del card con `Reintentar`.

---

## 6. Drawer semanal

### 6.1 Mockup

```
                                          ┌──────────────────────────────────────────────┐
                                          │  ‹  Semana 6                       ›     ✕   │
                                          │     3–9 feb  · [En curso] [Parcial]          │
                                          ├──────────────────────────────────────────────┤
                                          │ 3 de 5 métricas con dato                     │
                                          │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░               │
                                          ├──────────────────────────────────────────────┤
                                          │ MWh comercializados            Laura         │
                                          │ ┌────────────────────────┐                   │
                                          │ │ 98,0               MWh │  S5: 95,0  ▲ +3,0 │
                                          │ └────────────────────────┘                   │
                                          │ ✎ Agregar nota                               │
                                          │ ──────────────────────────────────────────── │
                                          │ Nuevos PPA firmados            Alejandro   ● │
                                          │ ┌────────────────────────┐                   │
                                          │ │ 0                    # │  S5: 1     ▼ −1   │
                                          │ └────────────────────────┘                   │
                                          │ ┌────────────────────────────────────────┐   │
                                          │ │ Se cayó la firma de Terpel, se retoma  │   │
                                          │ │ la próxima semana.                     │   │
                                          │ └────────────────────────────────────────┘   │
                                          │ ──────────────────────────────────────────── │
                                          │ Disponibilidad de plantas                    │
                                          │ ┌────────────────────────┐                   │
                                          │ │                      % │  S5: 97,9         │
                                          │ └────────────────────────┘                   │
                                          │ ✎ Agregar nota                               │
                                          ├──────────────────────────────────────────────┤
                                          │ Última edición: Juan José · hoy 10:42         │
                                          │            [ Cancelar ]  [ Guardar semana ]  │
                                          └──────────────────────────────────────────────┘
```

### 6.2 Componente y dimensiones

`Drawer` de **PrimeVue 4** (`import Drawer from 'primevue/drawer'` — es lo que en v3 era
`Sidebar`):
```
position="right"  :modal="true"  :dismissableMask="true"  :blockScroll="true"
:style="{ width: '420px' }"  class="rq-drawer"
:pt="{ mask: { style: 'backdrop-filter: blur(1px); background: rgba(44,32,57,.28)' } }"
```
Bajo 640px: `width: 100%`.

### 6.3 Header (slot `#header`, se reemplaza el default)

`display:flex; align-items:center; gap:8px; width:100%`.
- `Button` `icon="pi pi-chevron-left"` `text rounded size="small"` — semana anterior.
  Deshabilitado en S1. `aria-label="Semana anterior"`.
- Bloque central (`flex:1; min-width:0`):
  - `Semana 6` — 16px/800/`#2C2039`.
  - Segunda línea, `display:flex; gap:6px; align-items:center`:
    - `3–9 feb` (el `rango_label` del backend, tal cual) — 12px/400/`#9b8fb0`.
    - Chip `En curso` si `es_actual` (`#915BD8` sobre `rgba(145,91,216,.12)`).
    - Chip `Futura` si `es_futura` (`#6b5a8a` sobre `rgba(44,32,57,.06)`).
    - Chip `Parcial` si `parcial`, con `v-tooltip.bottom="'Solo del 1 al 5 de julio cae dentro del trimestre'"`.
- `Button` `icon="pi pi-chevron-right"` `text rounded size="small"` — semana siguiente.
  Deshabilitado en la última.
- (La ✕ la pone el propio `Drawer`.)

### 6.4 Barra de progreso del llenado

Justo bajo el header, `padding:10px 16px; border-bottom:1px solid #ECE7F2`:
- 11px/600/`#6b5a8a`: `3 de 5 métricas con dato`.
- Barra: `height:5px; border-radius:3px; background:#F1ECF7`, relleno `#915BD8`
  (aquí **no** aplica el semáforo: mide llenado, no desempeño).
  Al llegar a 5/5, el relleno pasa a `#10B981` y el texto a `Semana completa`.

### 6.5 Cuerpo — una fila por métrica activa

`padding:12px 16px`, separadas por `border-bottom:1px solid #F4F0F9` (la última sin borde),
`padding-block:12px`.

Por métrica:
1. **Fila etiqueta** — `display:flex; align-items:center; gap:6px`
   - Nombre 12.5px/700/`#2C2039`, `flex:1`, `truncate`,
     `v-tooltip.top` con `descripcion` si existe.
   - Responsable 10px/600/`#9b8fb0`.
   - **Punto de cambio sin guardar**: círculo 6px `#915BD8`, visible solo si el campo
     está sucio. `aria-label="Cambio sin guardar"`.
2. **Fila input** — `display:flex; align-items:center; gap:10px`
   - `InputNumber` (PrimeVue): `class="w-[190px]"`, `size="small"`,
     `:minFractionDigits="decimales"` `:maxFractionDigits="decimales"`,
     `locale="es-CO"`, `:suffix="' ' + unidad"` (omitir `suffix` si no hay unidad;
     para `%` usar `suffix="%"` sin espacio), `showButtons=false`,
     `placeholder="Sin dato"`, `inputStyle="text-align:right"`.
     Altura 32px.
   - Referencia de la semana anterior, 11px/400/`#9b8fb0`: `S5: 95,0`
     (`—` si no había dato). Se omite en S1.
   - Delta contra la semana anterior, 11px/700, solo si ambos valores existen:
     `▲ +3,0` / `▼ −1` / `= 0`. Color según `direccion`: para `mayor_mejor`,
     subida `#047857` y bajada `#B0364A`; para `menor_mejor`, al revés; `= 0` en `#9b8fb0`.
     Flechas con `pi pi-arrow-up` / `pi pi-arrow-down` a 8px, no con caracteres.
3. **Nota**
   - Si no hay nota y no está abierta: enlace `✎ Agregar nota` — 11px/600/`#915BD8`,
     ícono `pi pi-pencil` 9px, área de clic 24px de alto.
   - Abierta o con contenido: `Textarea` (PrimeVue) `autoResize` `rows="2"`
     `class="w-full text-[11.5px]"` `placeholder="Qué pasó esta semana"`
     `:maxlength="500"`. Contador `123/500` en 9px/`#c7bdd8` abajo a la derecha,
     visible solo a partir de 400 caracteres.

**Métrica sin unidad ni responsable**: se colapsan esos elementos, no se dejan huecos.

**Si el reto no tiene métricas**: el drawer no se puede abrir; el CTA está deshabilitado
con tooltip `Define al menos una métrica para registrar semanas`.

### 6.6 Pie (slot `#footer`)

`border-top:1px solid #ECE7F2; padding:10px 16px; display:flex; align-items:center; gap:8px`
- Izquierda, 10px/400/`#9b8fb0`: `Última edición: Juan José · hoy 10:42`
  (del `updated_at`/`actualizado_por` más reciente entre los valores de la semana).
  Formato: `hoy HH:mm`, `ayer HH:mm`, `14 ago HH:mm`.
- `flex:1`.
- `Button` `label="Cancelar"` `severity="secondary"` `text` `size="small"`.
- `Button` `label="Guardar semana"` `icon="pi pi-check"` `size="small"`
  `:disabled="!hayCambios"` `:loading="guardando"`.

### 6.7 Guardado del drawer

- Al pulsar **Guardar semana**: un `PUT /retos/metricas/{id}/valores/{semana_inicio}` por
  cada métrica **modificada** (valor o nota), en paralelo con `Promise.allSettled`.
- Cada respuesta trae la `MetricaResumen` recalculada → se sustituye en el estado local
  (KPIs, matriz y anillo se actualizan sin recargar).
- Éxito total → se cierra el drawer + toast:
  `severity:'success', summary:'Semana 6 registrada', detail:'3 métricas actualizadas', life:2500`
  (singular: `1 métrica actualizada`).
- Éxito parcial → el drawer **no** se cierra; las filas que fallaron quedan con
  `box-shadow: inset 0 0 0 1px #D64455` en el input y un texto de 10px `#B0364A` debajo con
  el `detail`; toast `severity:'warn', summary:'Se guardaron 2 de 3 métricas', life:5000`.
- Fallo total → toast `severity:'error', summary:'No se pudo guardar la semana', detail:<detail>, life:5000`.
- **Cierre con cambios sin guardar** (✕, máscara o Escape): `useConfirm` con
  `header:'Cambios sin guardar'`,
  `message:'Tienes cambios en la semana 6 que no se han guardado.'`,
  `acceptLabel:'Descartar'`, `rejectLabel:'Seguir editando'`,
  `acceptClass:'p-button-danger p-button-sm'`.
- **Navegar a otra semana** con ‹ › con cambios sin guardar: se guarda automáticamente
  antes de moverse (sin diálogo) y se muestra el toast de éxito. Aquí sí conviene:
  la intención de moverse implica dar por buena la semana.

### 6.8 Teclado en el drawer

| tecla | acción |
|---|---|
| `Tab` / `Shift+Tab` | recorrido natural: input → enlace de nota → siguiente métrica |
| `Enter` en un `InputNumber` | salta al `InputNumber` de la métrica siguiente (no envía el formulario) |
| `Ctrl/Cmd + Enter` | Guardar semana |
| `Escape` | intento de cierre (dispara la confirmación si hay cambios) |
| `Alt + ←` / `Alt + →` | semana anterior / siguiente |

Al abrir, el foco va al **primer `InputNumber` vacío**; si todos tienen valor, al primero.
`Drawer` de PrimeVue ya hace el focus trap.

---

## 7. Diálogos

Los tres usan `Dialog` de PrimeVue: `modal`, `class="w-full max-w-md"`
(`max-w-lg` en el de métrica), `:draggable="false"`.

### 7.1 `MetricaDialog.vue` — crear / editar

Header: `Nueva métrica` o `Editar métrica`.
Campos en `space-y-3`, labels con `.field-label` (`block text-xs font-medium mb-1`,
`color:#6b5a8a`):

| campo | componente | detalles |
|---|---|---|
| Nombre | `InputText` `class="w-full"` | requerido, `placeholder="MWh comercializados"`, autofocus |
| Descripción | `Textarea` `rows="2"` `autoResize` | `placeholder="Opcional: cómo se mide y de dónde sale el dato"` |
| Unidad | `Select` `editable` | opciones `MWh`, `kWh`, `%`, `#`, `COP`, `h`; se puede escribir cualquier otra; `placeholder="Sin unidad"` |
| Meta del trimestre | `InputNumber` `class="w-full"` `:maxFractionDigits="4"` | `placeholder="Opcional"` |
| Agregación | `Select` `class="w-full"` | `Suma` / `Promedio` / `Último valor` / `Máximo` |
| Dirección | `SelectButton` `:allowEmpty="false"` | `Más es mejor` / `Menos es mejor` |
| Decimales | `InputNumber` `showButtons` `:min="0" :max="4"` `class="w-24"` | default 0 |
| Responsable | `InputText` `class="w-full"` | `placeholder="Nombre de quien reporta"` |

**Línea de vista previa**, bajo los campos, en un bloque
`background:rgba(145,91,216,.06); border-radius:8px; padding:8px 10px; font-size:11px; color:#6b5a8a`:
`El consolidado será la suma de las 14 semanas. Meta 1.200 MWh, equivalente a 85,7 MWh por semana.`
Variantes por agregación:
- `promedio` → `El consolidado será el promedio de las semanas con dato. Meta 98,0 %.`
- `ultimo` → `El consolidado será el valor de la última semana con dato. Meta 12 #.`
- `maximo` → `El consolidado será el valor más alto de las semanas. Meta 12 #.`
Se omite la parte de la meta si no hay meta.

Botonera: `Cancelar` (secondary text) + `Crear métrica` / `Guardar cambios` (primary, `:loading`).
Validación: nombre vacío → borde `#D64455` en el input y texto 10px `#B0364A`:
`El nombre es obligatorio.` El botón queda deshabilitado.

Toasts: `Métrica creada` / `Métrica actualizada`, `life:2500`.

**Eliminar métrica** (desde los menús `⋯`): `useConfirm`,
`header:'Eliminar métrica'`,
`message:'Se eliminará “MWh comercializados” y sus 7 valores semanales. Esta acción no se puede deshacer.'`,
`acceptLabel:'Eliminar'`, `acceptClass:'p-button-danger p-button-sm'`, `rejectLabel:'Cancelar'`.
Toast `Métrica eliminada`.

### 7.2 `CopiarMetricasDialog.vue`

Header `Copiar métricas`.
- `Select` `class="w-full"` con los otros retos disponibles (se cargan con
  `GET /retos?anio=` del año actual y del anterior). Etiqueta de opción:
  `Retos Q2 2026 · 5 métricas`, con las de 0 métricas deshabilitadas.
  `placeholder="Elige el trimestre de origen"`.
- Bajo el select, si hay selección, la lista de nombres que se van a copiar en chips
  10px/600 `background:#f0ebfd; color:#915BD8; padding:1px 7px; border-radius:999px`,
  con los que ya existen en destino tachados y en `#c7bdd8` + leyenda
  `Ya existe en este trimestre`.
- Nota fija, 11px/`#6b5a8a`:
  `Se copian solo las métricas activas, sin los valores semanales. Las métricas con un nombre que ya existe aquí no se duplican.`
- Botones: `Cancelar` + `Copiar métricas` (`:disabled="!origenId"`, `:loading`).
- Toast: `severity:'success', summary:'Métricas copiadas', detail:'Se agregaron 4 métricas desde Retos Q2 2026'`.
  Si el backend no agrega ninguna: `severity:'info', summary:'No había métricas nuevas por copiar'`.

### 7.3 `EditarTrimestreDialog.vue`

Header `Editar trimestre`.
- `Nombre` — `InputText` `class="w-full"`.
- `Descripción` — `Textarea` `rows="2"` `autoResize`.
- Fila de fechas, `grid grid-cols-2 gap-3`:
  `Inicio` y `Fin` con `DatePicker` (PrimeVue 4) `dateFormat="dd/mm/yy"` `showIcon`
  `class="w-full"`.
- Vista previa, mismo bloque tintado del 7.1:
  `14 semanas. La S1 empieza el lunes 29 de junio y la S14 termina el domingo 4 de octubre.`
- **Aviso** si las fechas cambian y ya hay valores, `background:rgba(202,138,4,.10);
  border-radius:8px; padding:8px 10px; font-size:11px; color:#A16207`, con
  `pi pi-exclamation-triangle` 10px:
  `Los valores que queden fuera del nuevo rango dejan de mostrarse. No se borran: vuelven a aparecer si restauras las fechas.`
- Errores del backend (400) se muestran bajo el campo de fecha correspondiente en 10px/`#B0364A`,
  con el texto literal del `detail`.
- Botones: `Cancelar` + `Guardar` (`:loading`). Toast `Trimestre actualizado`.

---

## 8. Teclado en la matriz (el punto crítico de llenado rápido)

Modelo: **una sola celda en el orden de tabulación** (roving `tabindex`). El resto tiene
`tabindex="-1"`. Así `Tab` desde la barra de herramientas entra a la matriz en un solo
salto y `Tab` desde la matriz sale al siguiente control de la página. Dentro se navega
con flechas.

| tecla | fuera de edición | dentro de edición |
|---|---|---|
| `→` `←` | celda siguiente / anterior de la misma fila; en el borde salta de fila | mueve el cursor; **si el cursor ya está en el extremo del texto**, sale de edición, confirma y navega |
| `↑` `↓` | fila anterior / siguiente, misma semana | confirma y navega (no hay spinner que interceptar: por eso la celda es `<input type="text">`) |
| `Enter` | entra en edición | confirma y baja una fila (comportamiento de hoja de cálculo) |
| `Shift+Enter` | — | confirma y sube una fila |
| `Tab` | entra en edición y avanza | confirma y avanza a la derecha; en la última semana, salta a la primera de la fila siguiente |
| `Shift+Tab` | — | confirma y retrocede |
| `Escape` | quita el foco de la matriz | **descarta** el cambio, restaura el valor previo, sale de edición y deja el foco en la celda |
| `Supr` / `Backspace` | borra el valor (envía `valor: null`) y muestra el flash de guardado | comportamiento normal de texto |
| cualquier dígito, `,`, `.`, `-` | entra en edición reemplazando el contenido con esa tecla | — |
| `Inicio` / `Fin` | primera / última semana de la fila | mueve el cursor dentro del texto |
| `Ctrl/Cmd + Inicio` | primera celda de la matriz | — |
| `Ctrl/Cmd + Enter` | abre el drawer de la semana de la celda enfocada | ídem, confirmando antes |
| `Ctrl/Cmd + C` | copia el valor de la celda | nativo |
| `Ctrl/Cmd + V` | pega en la celda (un solo valor; no se soporta pegar rangos en v1) | nativo |

Reglas de commit:
- Se dispara `PUT` **solo si el valor parseado difiere** del que había. Nada de guardar al
  entrar y salir sin tocar.
- El parseo acepta `1.240,5`, `1240,5` y `1240.5`. Vacío → `null`.
- Si el texto no parsea, no se guarda: la celda queda en error con tooltip
  `No se reconoce el número. Usa coma para los decimales.` y el foco se queda dentro.
- El scroll sigue al foco: al navegar, `scrollIntoView({ block:'nearest', inline:'nearest' })`
  — con las columnas sticky hay que compensar 240px a la izquierda y 238px a la derecha,
  así que se implementa a mano con `scrollLeft` en vez de confiar en `nearest`.
- Semana futura: al enfocarla por teclado, la columna se "despierta" (color normal) igual
  que con clic. Si `Ocultar semanas futuras` está activo, esas columnas no existen en el DOM
  y la navegación las salta sola.

**Ayuda de teclado**: en la barra de herramientas, un `Button` `icon="pi pi-question-circle"`
`text rounded size="small"` con `v-tooltip.left` (HTML) que lista:
`Enter para editar y bajar · Tab para avanzar · Esc para descartar · Ctrl+Enter abre la semana`.

---

## 9. Accesibilidad

- **Contraste**: `#2C2039` sobre blanco ≈ 14:1; `#6b5a8a` ≈ 6.2:1 (AA en 12px);
  `#9b8fb0` ≈ 3.4:1 → **solo** para etiquetas decorativas, headers de tabla en 10px/700 y
  subtítulos que duplican información ya visible. Ningún dato existe únicamente en `#9b8fb0`
  ni en `#c7bdd8`.
- **El color nunca va solo**: cada estado del semáforo se acompaña del chip con etiqueta
  (`Cumple`, `En riesgo`…). En la matriz, la semana actual se marca además con el borde
  superior de 2px y el peso 800 del `S6`, no solo con el tinte.
- **Targets de clic**: mínimo 24×24 (WCAG 2.2 AA). Celdas 66×38 ✓. Botones de ícono
  renderizados a 24×24 con `padding` que lleva el área a 28×28 ✓. Enlace `Agregar nota`
  con `padding-block:5px` para llegar a 24px de alto ✓. Chevrons del drawer a 32×32 ✓.
- **Foco visible siempre**: `:focus-visible { outline:2px solid #915BD8; outline-offset:2px }`
  global del módulo; en celdas de la matriz `outline-offset:-2px` para no ser recortado por
  las columnas sticky. Nunca `outline:none` sin reemplazo.
- **Semántica de tabla**: `<caption class="sr-only">`, `scope="col"` en cada `<th>` de semana,
  `scope="colgroup"` en la banda de mes, `scope="row"` en la columna de métrica.
- **aria-label de celda** (lo que anuncia el lector de pantalla al enfocar):
  `MWh comercializados, semana 6, 3 al 9 de febrero, 98 coma 0 MWh` /
  `… sin dato` / `… semana futura`.
- **Región viva**: un `<div aria-live="polite" class="sr-only">` que anuncia
  `Guardado` / `No se pudo guardar` tras cada `PUT`, para que el flash verde no sea la única
  confirmación.
- **`AnilloAvance` y `BulletMeta`**: `role="img"` + `aria-label` con las cifras en texto.
  `Sparkline`: `aria-hidden="true"`.
- **Drawer**: `aria-label="Registro de la semana 6"`. Focus trap y devolución del foco al
  elemento que lo abrió (lo hace `Drawer`, verificar que no se rompa con la navegación ‹ ›).
- **Movimiento**: envolver las animaciones de pulso y de barra indeterminada en
  `@media (prefers-reduced-motion: reduce) { animation: none }`.
- **Zoom 200%**: la matriz conserva scroll horizontal, el resto de la vista reflota
  (las grillas de KPIs bajan a 1 columna).

---

## 10. Responsive

| ancho | Vista A | Vista B |
|---|---|---|
| ≥1536px | 4 tarjetas en fila | KPIs a 4 columnas; matriz completa sin scroll con ≤14 semanas |
| 1280–1535 | 4 tarjetas en fila | KPIs a 3 columnas; matriz con scroll horizontal |
| 1024–1279 | 2 columnas de tarjetas | KPIs a 2 columnas; columna de métrica baja a 180px |
| 768–1023 | 2 columnas | KPIs a 2 columnas; matriz con scroll; barra de herramientas sin el label `Excel` |
| <768px | 1 columna | **La matriz se reemplaza**: el card muestra un aviso 11.5px/`#6b5a8a` `La matriz semanal necesita una pantalla más ancha.` y, debajo, una lista compacta de semanas (una fila por semana: `S6 · 3–9 feb · 3/5` + chevron) donde cada fila abre el drawer a ancho completo. El CTA `Registrar semana 7` se fija abajo (`position:sticky; bottom:12px`) |

En `<640px` el `PageHeader` ya apila las acciones (`.ph-actions { width:100% }`), y el
CTA amarillo pasa a `flex:1` para ser el elemento dominante.

---

## 11. Microcopy — todos los textos, literales

**Vista A**
| lugar | texto |
|---|---|
| Título | `Retos Q` |
| Subtítulo | `Tablero trimestral del equipo · Q3 en curso, semana 7 de 14` |
| Subtítulo, sin Q en curso | `Tablero trimestral del equipo · 2026` |
| Botón | `Ir al Q en curso` |
| Pie de tarjeta | `5 métricas · 6 semanas con datos` |
| Tarjeta vacía | `Sin métricas definidas` / `Definir métricas` |
| Más métricas | `+2 métricas más` |
| Etiqueta del anillo | `ritmo` |
| Error de carga | `No se pudieron cargar los retos del año.` / botón `Reintentar` |

**Vista B — header**
| lugar | texto |
|---|---|
| Miga | `‹ Retos Q` |
| Subtítulo | `1 jul – 30 sep · 14 semanas · S7 en curso · 5 métricas` |
| Botones | `Métrica` · `Registrar semana 7` |
| Menú `⋯` | `Editar trimestre` · `Copiar métricas de otro Q` · `Exportar a Excel` |

**Vista B — vacío**
| lugar | texto |
|---|---|
| Título | `Este trimestre todavía no tiene métricas` |
| Párrafo | `Define qué vas a medir entre el 1 de julio y el 30 de septiembre. Cada métrica se llena una vez por semana y el tablero calcula el consolidado.` |
| CTA | `Definir la primera métrica` |
| CTA secundaria | `Copiar de otro trimestre` |
| Tooltip si no hay origen | `No hay otros trimestres con métricas` |
| Ejemplos | `Ejemplos: MWh comercializados (suma) · Nuevos PPA firmados (suma) · Disponibilidad de plantas % (promedio) · Fallas abiertas (último)` |

**Vista B — KPIs**
| lugar | texto |
|---|---|
| Pie 1 | `53,4% de la meta · ritmo 107%` |
| Pie 1 sin meta | `Sin meta definida` |
| Pie 2 (`suma`) | `Esperado a hoy 600,0 · 7 de 14 semanas con dato` |
| Pie 2 (resto) | `Meta 98,0 · 7 de 14 semanas con dato` |
| Chip dirección | `menos es mejor` |
| Chip métrica inactiva | `Inactiva` |

**Vista B — matriz**
| lugar | texto |
|---|---|
| Título | `Matriz semanal` |
| Toggle | `Ocultar semanas futuras` |
| Headers | `MÉTRICA` · `CONSOLIDADO` · `META` · `%` · `Llenado` |
| Guardado | `Guardando…` / `Guardado 10:42` / `1 cambio sin guardar` |
| Banner sin datos | `Todavía no hay valores registrados. Abre una semana para empezar el llenado.` |
| Tooltip semana futura | `Semana futura` |
| Tooltip semana parcial | `Semana parcial: del 1 al 5 de julio` |
| Tooltip valor inusual | `Valor inusual para esta métrica. Se guardó de todas formas.` |
| Error de parseo | `No se reconoce el número. Usa coma para los decimales.` |
| Tooltip columna % | `Consolidado 640,5 · Esperado a hoy 600,0 · Ritmo 106,8%` |
| Ayuda de teclado | `Enter para editar y bajar · Tab para avanzar · Esc para descartar · Ctrl+Enter abre la semana` |
| Tooltip de encabezado de semana | `Abrir semana 6` |

**Drawer**
| lugar | texto |
|---|---|
| Título | `Semana 6` / subtítulo `3–9 feb` |
| Chips | `En curso` · `Futura` · `Parcial` |
| Progreso | `3 de 5 métricas con dato` / `Semana completa` |
| Placeholder valor | `Sin dato` |
| Nota | `✎ Agregar nota` / placeholder `Qué pasó esta semana` |
| Pie | `Última edición: Juan José · hoy 10:42` |
| Botones | `Cancelar` · `Guardar semana` |
| CTA deshabilitada | `Define al menos una métrica para registrar semanas` |

**Toasts**
| evento | severity | summary | detail |
|---|---|---|---|
| Semana guardada | success | `Semana 6 registrada` | `3 métricas actualizadas` |
| Semana guardada parcial | warn | `Se guardaron 2 de 3 métricas` | `Revisa las que quedaron marcadas en rojo` |
| Fallo al guardar la semana | error | `No se pudo guardar la semana` | `<detail del backend>` |
| Fallo al guardar una celda | error | `No se pudo guardar el valor` | `<detail del backend>` |
| Métrica creada | success | `Métrica creada` | — |
| Métrica actualizada | success | `Métrica actualizada` | — |
| Métrica eliminada | success | `Métrica eliminada` | — |
| Métricas copiadas | success | `Métricas copiadas` | `Se agregaron 4 métricas desde Retos Q2 2026` |
| Copia sin novedades | info | `No había métricas nuevas por copiar` | — |
| Trimestre actualizado | success | `Trimestre actualizado` | — |

**Confirmaciones**
| caso | header | message | aceptar / rechazar |
|---|---|---|---|
| Cerrar drawer sucio | `Cambios sin guardar` | `Tienes cambios en la semana 6 que no se han guardado.` | `Descartar` / `Seguir editando` |
| Eliminar métrica | `Eliminar métrica` | `Se eliminará “MWh comercializados” y sus 7 valores semanales. Esta acción no se puede deshacer.` | `Eliminar` (danger) / `Cancelar` |

---

## 12. Inventario de componentes PrimeVue por lugar

| lugar | componente | import |
|---|---|---|
| Selector de año (Vista A) | `Select` | `primevue/select` |
| Botones generales | `Button` | `primevue/button` |
| Menús `⋯` | `Menu` (`:popup="true"`) | `primevue/menu` |
| Skeletons de carga | `Skeleton` | `primevue/skeleton` |
| Bloques de error | `Message` | `primevue/message` |
| Toggle de semanas futuras | `ToggleSwitch` | `primevue/toggleswitch` |
| Drawer semanal | `Drawer` (era `Sidebar` en v3) | `primevue/drawer` |
| Inputs numéricos del drawer y diálogos | `InputNumber` | `primevue/inputnumber` |
| Notas | `Textarea` | `primevue/textarea` |
| Diálogos | `Dialog` | `primevue/dialog` |
| Nombre / responsable | `InputText` | `primevue/inputtext` |
| Unidad, agregación, reto origen | `Select` (unidad con `editable`) | `primevue/select` |
| Dirección de la métrica | `SelectButton` | `primevue/selectbutton` |
| Fechas del trimestre | `DatePicker` (era `Calendar` en v3) | `primevue/datepicker` |
| Confirmaciones | `useConfirm` (el `ConfirmDialog` ya está en `App.vue`) | `primevue/useconfirm` |
| Toasts | `useToast` | `primevue/usetoast` |
| Tooltips | directiva `v-tooltip` (ya registrada globalmente) | — |

**No se usan**: `DataTable`/`Column` (ver decisión 1), `Card` (usamos `.rq-card` para
controlar padding y borde), `ProgressBar` (las barras son a medida por el semáforo),
`Chip` (los chips son `<span>` con estilo inline del semáforo, como en el resto del repo).

---

## 13. Checklist de implementación

- [ ] `retosUi.js` con `ESTADOS`, `estadoColor`, `estadoBadge`, `estadoLabel`, `fmtValor`, `fmtPct`, `parseValor`
- [ ] `AnilloAvance`, `BulletMeta`, `Sparkline` (SVG puro, sin Chart.js: son demasiado chicos)
- [ ] `RetoQCard` con los 3 `estado_periodo` y el caso `total_metricas === 0`
- [ ] `RetosListView` con `Select` de año, `?anio=` en la URL y skeletons
- [ ] `RetoDetailView` con los dos estados (vacío / con métricas) y las llamadas del contrato
- [ ] `MetricaKpiCard` + scroll-a-fila al hacer clic
- [ ] `MatrizSemanal`: sticky izquierda + 3 sticky derecha + banda de mes + `tfoot` de llenado
- [ ] Roving `tabindex` y toda la tabla de teclado de §8
- [ ] Autosave por celda con los 4 estados (guardando / ok / error / fuera de rango) y `aria-live`
- [ ] `SemanaDrawer` con navegación ‹ ›, guardado explícito, guarda-cambios y autoguardado al navegar
- [ ] `MetricaDialog`, `CopiarMetricasDialog`, `EditarTrimestreDialog`
- [ ] Ruta sin `meta.roles` + entrada de sidebar en el grupo **General** tras "Próximos a energizar"
- [ ] `prefers-reduced-motion` en las 3 animaciones (pulso, barra indeterminada, flash de guardado)
- [ ] Revisión con teclado únicamente: llenar una semana completa sin tocar el mouse
