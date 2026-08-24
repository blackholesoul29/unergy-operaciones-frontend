# Roadmap de migración — `legacy/` → `v2/`

> Documento 3 de 3. Plan de ejecución. Presupone
> [`01-contexto.md`](./01-contexto.md) (qué es cada cosa) y
> [`02-specs.md`](./02-specs.md) (qué no se puede perder).

---

## Estrategia en una página

El error clásico de una migración de este tamaño es intentar trasladar y rediseñar a la vez:
cuando algo se rompe, ya no se puede distinguir un bug nuevo de una diferencia intencional. Por
eso las tres fases son **secuenciales y de naturaleza distinta**:

| Fase | Qué cambia | Qué **no** cambia | Riesgo |
| --- | --- | --- | --- |
| **1 · Traslado** | Dónde vive el código y quién lo arranca | El código en sí | Alto pero acotado: falla o funciona, de forma visible |
| **2 · Reorganización** | La estructura de carpetas y los imports | El comportamiento, línea por línea | Bajo: mecánico y verificable por build |
| **3 · Migración** | El código: tipos, patrones, UI, permisos | El producto que ve el usuario | Alto y difuso: es donde se pierden funciones en silencio |

Tres invariantes que no se negocian:

1. **La app corre al final de cada fase y de cada paso dentro de ella.** Nunca hay un estado
   «se arregla al final».
2. **Se migra por rebanadas verticales** (un módulo completo de punta a punta), nunca por capas
   horizontales («ahora todos los servicios de toda la app»).
3. **Cada paso es reversible**: una rama, un commit por rebanada, y el legacy intacto hasta el
   cierre.

```
Fase 0        Fase 1              Fase 2                 Fase 3                    Fase 4
Preparar  →   Trasladar tal cual → Reorganizar         → Migrar por olas        →  Cerrar
              (app/legacy/)        (features/, utils/…)  (TS, services, UI…)       (borrar legacy)
              app corriendo        app idéntica          app equivalente           un solo repo
```

---

## Fase 0 · Preparación

**Objetivo:** tomar las decisiones que condicionan todo lo demás y montar la red de seguridad.
No se toca código de producto.

### 0.1 Cerrar las decisiones abiertas

Están enumeradas en `02-specs.md §20`. Las tres que bloquean el arranque:

| Decisión | Recomendación | Por qué |
| --- | --- | --- |
| **Modo de render** | `ssr: false` (SPA) en fases 1–2; evaluar SSR por página en fase 3 | Hoy la app es una SPA. Activar SSR de entrada convierte 70 archivos que tocan `window`/`document`/`localStorage` en 70 fallos simultáneos de una fase que debía ser un traslado. Nuxt sigue aportando file-based routing, auto-imports, Nitro y el ecosistema aunque el render sea de cliente. |
| **Auth** | Migrar a cookies `httpOnly` en la **fase 3, ola 1** — no en la 1 | Exige coordinación con backend. Hasta entonces, el store legacy funciona sin cambios. |
| **App móvil** | Entra en el alcance, pero **al final** (ola 7) | Es un producto aparte con su propio layout y ciclo; migrarla pronto no desbloquea nada. |

Las demás (rol `admin`, restricción por email, Chart.js vs. Unovis, placeholders,
`OperacionView.vue`) pueden decidirse durante la fase 2 sin bloquear.

### 0.2 Red de seguridad

- [ ] **Rama de trabajo** `migration` (ya existe) y una regla: `master` sigue sirviendo el
      legacy en producción hasta el cutover de la fase 4.
- [ ] **Portar las 6 pruebas existentes a Vitest** (`conciliacionMandatos`,
      `financialCalculations`, `parseCOP`, `validacionContratos`, `zipSecurityValidator`,
      `comercial`) — es lo primero que da red y cuesta horas, no días.
- [ ] **Inventario de rutas congelado**: un archivo generado desde `router/index.js` con las
      ~100 rutas, sus roles y su componente. Es la lista de verificación de las fases 1 y 2.
- [ ] **Inventario de endpoints congelado**: los ~280 endpoints agrupados por slice. Es el
      índice de los services que hay que escribir en la fase 3.
- [ ] **Guion de humo manual**: 15–20 recorridos críticos (login, listar proyectos, abrir una
      liquidación, exportar la matriz anual, registrar una falla…) que se ejecutan al final de
      cada ola. La cobertura automatizada de esta app es ~0; el humo manual es la verificación
      real y hay que asumirlo como tal.

### 0.3 Definición de terminado (aplica a todo el roadmap)

```sh
bun run lint       # sin errores
bun run typecheck  # cero errores
bun run test       # verde
bun run build      # compila
```

Más: el guion de humo del alcance tocado, ejecutado de verdad.

**Entregable de la fase 0:** decisiones firmadas, pruebas en Vitest, dos inventarios y el guion
de humo.

---

## Fase 1 · Traslado literal

**Objetivo:** que todo el código de `legacy/src/` viva dentro de `v2/` **sin una sola
modificación de lógica**, y que la aplicación arranque y sirva las ~100 rutas.

**Regla de la fase:** si un archivo de `legacy/src/` cambia de contenido, hay que poder
explicar por qué en una línea. El objetivo es cero diffs de producto.

### 1.1 El truco que hace viable el «tal cual»

Todo el legacy importa con el alias `@/…`. Si el código aterriza en `app/legacy/` y se declara
`@` → `~/legacy`, **ningún import hay que tocar**. Es una sola línea de configuración en lugar
de miles de ediciones.

```ts
// nuxt.config.ts
alias: { '@': fileURLToPath(new URL('./app/legacy', import.meta.url)) }
```

`app/legacy/` es una **carpeta de cuarentena**: se sabe que no cumple las reglas del template,
está excluida de lint y format igual que `ui/` y `gandalf/`, y su único destino es vaciarse.

### 1.2 Pasos

1. **Copiar el árbol.**
   - `legacy/src/**` → `v2/app/legacy/**` (sin cambios).
   - `legacy/public/**` → `v2/public/**` (revisar colisiones de `favicon`, `logo.svg`).
   - `legacy/docs/**` → `v2/docs/**` (son especificaciones vivas del dominio, valen).
2. **Dependencias.** Añadir a `v2/package.json` lo que el legacy usa y v2 no tiene: `primevue`,
   `@primevue/themes`, `primeicons`, `axios`, `chart.js`, `vue-chartjs`, `maplibre-gl`, `xlsx`,
   `xlsx-js-style`, `exceljs`, `jspdf`, `jspdf-autotable`, `pdfjs-dist`, `jszip`,
   `vuedraggable`. Todas quedan marcadas como **temporales**: PrimeVue, PrimeIcons, axios,
   Chart.js y vuedraggable salen en la fase 3.
   - Verificar `pinia` (v2 tiene 4, el legacy usa 2) y `vue-router` (v2 tiene 5, el legacy 4).
     El legacy usa la API de *setup stores* y `useRoute`/`useRouter`, compatibles en ambas.
     Nuxt aporta el router; `createRouter` deja de usarse.
3. **Routing: una página delgada por ruta.** Nuxt es *file-based*; el `router/index.js` no se
   puede usar tal cual. Se **genera con un script** un archivo por ruta:

   ```vue
   <!-- app/pages/clientes/index.vue -->
   <script setup>
   import View from '~/legacy/views/Clientes/ClientesListView.vue'
   definePageMeta({ layout: 'legacy', roles: [] })
   </script>
   <template><View /></template>
   ```

   ~100 archivos de 5 líneas, generados desde el inventario de la fase 0. Cada uno desaparece
   solo cuando su página real se escribe en la fase 3. Las redirecciones del router se
   convierten en `routeRules` de Nuxt.
4. **Guard.** `router.beforeEach` → `app/middleware/legacy-auth.global.ts`, con la misma lógica
   (público, móvil, roles, `requireEmail`) leyendo el mismo store. Copia fiel, no rediseño.
5. **Layouts.** `App.vue` → `app/layouts/legacy.vue` (sidebar + `<slot/>` + `Toast` +
   `ConfirmDialog`) y `app/layouts/legacy-mobile.vue` (pantalla completa).
6. **Bootstrap.** `main.js` → `app/plugins/legacy-primevue.client.ts`: `PrimeVue` con
   `UnergPreset`, `ToastService`, `ConfirmationService`, directiva `tooltip` y los dos
   componentes globales (`InfoField`, `PageHeader`).
   - El manejo de `vite:preloadError` y el fallback de `router.onError` ya no aplican igual:
     Nuxt trae `app:chunkError`. Se sustituye por el mecanismo equivalente de Nuxt.
7. **Estilos.** Este es el punto delicado del traslado, porque **Tailwind 3 → 4 no es
   transparente**:
   - Reexpresar el `theme.extend` de `tailwind.config.js` (paleta `unergy`, `font-display`,
     `font-body`) como `@theme` en un `app/assets/css/legacy-theme.css`, para que
     `bg-unergy-purple`, `text-unergy-deep`, `font-body`… sigan resolviendo.
   - Barrido de utilidades renombradas o eliminadas en Tailwind 4 sobre los 177 SFC.
   - `assets/main.css` y `primeicons/primeicons.css` se registran en `nuxt.config.css`.
   - Los ~2.528 hex inline **no se tocan en esta fase**: son fase 3.
8. **Compilador de runtime.** `vue: { runtimeCompiler: true }` en `nuxt.config.ts` para que
   `OperacionView.vue` siga funcionando. Queda anotado como deuda a retirar.
9. **Proxies.** El proxy de `vite.config.js` se traslada a Nitro:
   - `/api` y `/monitoreo` → backend, por `nitro.devProxy` en dev y `routeRules` en producción.
   - `/api/v1/evo` → ruta Nitro propia (`server/routes/api/v1/evo/[...].ts`) que inyecta
     `X-EVO-Token` server-side. **El token no debe llegar nunca al bundle del cliente**; hoy
     esa garantía la daba el proxy de Vite y hay que reproducirla, no perderla.
   - `vercel.json` queda obsoleto: Nitro sirve la app.
10. **Herramientas.** Añadir `app/legacy/**` a `.prettierignore` y a los `ignores` de ESLint —
    de lo contrario 95.000 líneas de errores de lint bloquean la fase. Confirmar que
    `typecheck` no entra a los `.js` de cuarentena (`allowJs` sin `checkJs`).
11. **Pruebas.** Portar las 6 `.test.mjs` a Vitest (si no se hizo en la fase 0) y colocarlas
    junto a su archivo.

### 1.3 Riesgos de la fase

| Riesgo | Mitigación |
| --- | --- |
| Tailwind 4 rompe estilos de forma difusa (no falla, se ve mal) | Revisión visual ruta por ruta contra el legacy corriendo en paralelo en otro puerto |
| PrimeVue 4 bajo Nuxt: CSS layers, `cssLayer: false`, orden de estilos | Probar temprano con una vista rica (`ProyectosListView`) antes de mover todo |
| `import.meta.env.VITE_*` disperso por el código | Nuxt usa Vite: sigue funcionando. Se documenta como deuda de fase 3 (pasa a `runtimeConfig`) |
| Componentes con `template:` string | `runtimeCompiler: true` |
| Colisiones de nombres al auto-importar | La cuarentena `app/legacy/` no se auto-importa; todo entra por ruta explícita |

### 1.4 Criterios de aceptación

- [ ] `bun run dev` arranca sin errores ni advertencias nuevas.
- [ ] Las ~100 rutas del inventario cargan y renderizan lo mismo que el legacy (revisión visual
      lado a lado).
- [ ] Login, guard por rol y redirecciones se comportan igual.
- [ ] Las rutas `/m/*` funcionan con su layout propio.
- [ ] `bun run build` produce un artefacto desplegable, y hay un despliegue de vista previa.
- [ ] `lint`, `typecheck` y `test` en verde (con la cuarentena excluida).
- [ ] Guion de humo completo ejecutado.

**Entregable:** una sola aplicación Nuxt que hace todo lo que hacía el legacy.

---

## Fase 2 · Reorganización estructural

**Objetivo:** vaciar `app/legacy/` repartiendo su contenido en la estructura del template, con
todos los imports funcionando. **Sin cambiar comportamiento, sin reescribir lógica, sin migrar
todavía a TypeScript.**

**Regla de la fase:** los únicos cambios permitidos dentro de un archivo son sus rutas de
import. Nada más.

### 2.1 Mapa de destino

| Origen (`app/legacy/`) | Destino | Nota |
| --- | --- | --- |
| `views/<Modulo>/*.vue` | `app/features/<slice>/components/` | Las páginas delgadas de la fase 1 apuntan aquí |
| `components/*.vue` (compartidos) | `app/components/blocks/` o el slice que corresponda | `PageHeader` ya existe en `blocks/`: se unifica |
| `components/reports/*` | El slice que los use, o se borran | Verificar consumidores antes |
| `composables/*.js` | `app/composables/` | `useSidebar` conserva su `ref` de módulo por ahora, anotado |
| `utils/*.js` | `app/utils/` | Funciones puras; las pruebas viajan con ellas |
| `constants/*.js` | `app/config/` | |
| `api/client.js` | `app/core/legacy-client.js` | Muere en la fase 3 |
| `api/{liquidacionesApi,garantiasProyecciones,xm}.js` | `app/features/<slice>/services/` | Ya son casi services: son la semilla del patrón |
| `stores/auth.js` | `app/features/auth/` | Se sustituye en la fase 3, ola 1 |
| `assets/main.css` | `app/assets/css/` | |
| `assets/*.js` (datasets) | `app/features/<slice>/` o se borran | Verificar si siguen en uso |
| `data/*.json` | `app/features/<slice>/` o `public/` | Verificar si es dato de producción |
| `mobile/**` | `app/features/mobile/` | Slice propio, se mantiene aislado |
| `router/index.js`, `main.js`, `App.vue` | — | Ya absorbidos en la fase 1: se borran |

### 2.2 Definición de los slices

Derivados de la navegación real, no de las carpetas de `views/`:

```
features/
├── auth/            ├── clientes/        ├── proyectos/       ├── contratos/
├── comercial/       ├── operaciones/     ├── fallas/          ├── solar/
├── alertas/         ├── fronteras/       ├── registros-cnd/   ├── mem/
├── garantias/       ├── liquidaciones/   ├── panel-contable/  ├── finanzas/
├── retos/           ├── operadores-red/  ├── notificaciones/  ├── admin/
└── mobile/
```

Criterio para separar: si dos módulos comparten tipos y endpoints, son el mismo slice; si solo
comparten pantalla, no.

### 2.3 Método

Una rebanada por commit, en este ciclo:

1. Mover los archivos del slice con `git mv` (preserva historia).
2. Reescribir sus imports `@/…` a `~/…` reales, con `sed` acotado al slice.
3. Reescribir los imports que **otros** archivos hacían hacia él.
4. `bun run build` + humo del slice.
5. Commit.

Cuando ya no queda ningún `@/`, se **elimina el alias** de `nuxt.config.ts`. Eso convierte
cualquier import olvidado en un error de build, no en un misterio.

Orden sugerido: primero lo que no depende de nada (`utils/`, `constants/`, `assets/`), luego
los slices de hoja, y al final los que todos usan (`components/`, `composables/`, `api/`).

### 2.4 Criterios de aceptación

- [ ] `app/legacy/` no existe.
- [ ] No queda ningún import `@/…`; el alias está eliminado.
- [ ] No hay barrels propios (`index.ts` que reexporten) fuera de `components/ui/`.
- [ ] La estructura de carpetas coincide con la de `AGENTS.md`.
- [ ] `git log --follow` sigue mostrando la historia de los archivos movidos.
- [ ] Comportamiento idéntico: guion de humo completo.
- [ ] `lint`/`typecheck`/`test`/`build` en verde.

**Entregable:** el código del legacy viviendo en la estructura del template, todavía en
JavaScript y todavía con PrimeVue, pero en su sitio.

---

## Fase 3 · Migración a los estándares del template

**Objetivo:** que el código cumpla `AGENTS.md`. Es la fase larga, y la única donde se
refactoriza.

**Regla de la fase:** se migra **por rebanadas verticales completas**. Un slice se declara
migrado cuando cumple la receta entera, no cuando «ya está en TypeScript».

### 3.1 La receta por slice

Para cada slice, en este orden:

1. **Tipos.** `features/<slice>/types.ts` con la forma real de las respuestas del backend. Lo
   compartido por más de un slice sube a `app/types/`. Nunca `any`; si la forma no se conoce,
   `unknown` y se angosta.
2. **Services.** Un service por agregado, `extends BaseService`, en
   `features/<slice>/services/`. Absorbe todas las llamadas `api.get/post/...` que hoy están
   dentro de los `.vue`. Rutas de API como constantes, jamás magic strings.
3. **Páginas.** La página delgada de la fase 1 se convierte en una página de verdad en
   `app/pages/`, con su `definePageMeta`, su `useQuery`/`useAsyncData` y su `AsyncView`.
4. **Componentes.** Los `.vue` del slice pasan a TypeScript, se les quita PrimeVue y se
   reescriben sobre Gandalf/shadcn. Los que superan las ~400 líneas se parten en
   subcomponentes; los de más de 1.000 se tratan como un mini-proyecto con su propio plan.
5. **Estado.** Lo local se queda en el componente; lo compartido va a un composable con
   `useState`. Se eliminan los `ref` a nivel de módulo.
6. **Errores.** Todo lo que se lanza o atrapa pasa por `normalizeError`; nada de
   `console.log`/`console.error`; `logger.error(scope, err)`.
7. **Permisos.** Se declaran los `Permission` del slice en `config/permissions.ts`, se añaden a
   `AUTH_ROUTE_PERMISSIONS` y a `config/navigation.ts`.
8. **Pruebas.** Vitest sobre la lógica pura del slice (cálculos, validaciones,
   transformaciones). No se persiguen los componentes.
9. **Limpieza.** Se borra lo que quedó sin consumidor. Borrar es borrar.

Y la comprobación final: `lint` + `typecheck` + `test` + humo del slice.

### 3.2 Ola 0 · Fundaciones

Sin esto, cada slice reinventa lo mismo. No cambia nada visible para el usuario.

- **Tokens de marca en Tailwind 4.** La paleta Unergy y los colores semánticos
  (éxito `#2e7d32`, déficit `#D64455`, exceso `#F0C040`, textos apagados, bordes) pasan a
  tokens en `@theme`. A partir de aquí, escribir un hex en un `style=` es un error de revisión.
- **Tabla de equivalencias PrimeVue → Gandalf/shadcn**, ordenada por frecuencia real:

  | PrimeVue | Usos | Destino |
  | --- | --- | --- |
  | `Button` | 88 | `ui/button` |
  | `useToast` | 75 | `vue-sonner` |
  | `InputText` | 58 | `ui/input` |
  | `Select` / `Dropdown` | 60 | `ui/select` |
  | `Dialog` | 48 | `ui/dialog` |
  | `Tag` | 40 | `GBadge` |
  | `InputNumber` | 37 | `ui/number-field` |
  | **`DataTable` + `Column`** | **68** | **no existe equivalente — ver abajo** |
  | `Textarea` | 29 | `ui/textarea` |
  | `DatePicker` / `Calendar` | 30 | `ui/calendar` + `ui/popover` |
  | `ProgressSpinner` | 25 | `ui/spinner` / `AsyncView` |
  | `IconField` + `InputIcon` | 50 | `ui/input-group` |
  | `MultiSelect` | 14 | `ui/combobox` |
  | `useConfirm` + `ConfirmDialog` | 17 | `ui/alert-dialog` |
  | `Checkbox`, `ToggleSwitch`, `SelectButton` | 29 | `ui/checkbox`, `ui/switch`, `ui/toggle-group` |
  | `TabView` + `TabPanel` | 10 | `GTabs` |
  | `Message` | 8 | `ui/alert` |
  | `AutoComplete` | 5 | `ui/combobox` |
  | `Menu`, `Popover`, `Drawer`, `Divider`, `Skeleton`, `Password` | 14 | `ui/dropdown-menu`, `ui/popover`, `ui/sheet`, `ui/separator`, `ui/skeleton`, `ui/input` |

- **⚠️ La tabla de datos es el mayor riesgo de la fase.** `DataTable`/`Column` aparecen 68
  veces con paginación perezosa, ordenamiento, filtros, columnas congeladas y plantillas por
  celda. `ui/table` de shadcn es solo marcado. Hay que **decidir y construir esto antes de la
  ola 2**: un `blocks/DataTable` propio compuesto sobre `ui/table` + `usePagination` +
  `useFilters`, con o sin TanStack Table como dependencia nueva. Si esta pieza no está
  resuelta, cada slice la improvisará distinta y la migración se degrada.
- **Mapa de iconos** PrimeIcons → `@lucide/vue` (`pi-bolt` → `ZapIcon`, `pi-wrench` →
  `WrenchIcon`, …), como tabla única.
- **Envoltorios de infraestructura**: notificación (sonner), confirmación (`AlertDialog`),
  formato de moneda/fecha/número en `app/utils/`, y las utilidades de exportación como módulos
  `client-only` con import dinámico.
- **Tipos base del dominio** en `app/types/`: `Proyecto`, `Cliente`, `Contrato`, `Falla`,
  `Liquidacion`, `Frontera`, `Inversionista`, y los `enum` de estados y roles.

### 3.3 Ola 1 · Auth, permisos y shell

- Apuntar `server/utils/auth-api.ts` al backend real: rutas, tipos `External*` y los mappers
  `toUser`/`toSession`. **Nunca tipar una respuesta externa directamente como un tipo interno.**
- Migrar a cookies `httpOnly`; retirar `stores/auth.js`, `utils/security.js` y el interceptor
  de axios. Esto cierra la deuda que el propio `SECURITY.md` del legacy lleva tiempo pidiendo.
- **Traducir roles a permisos.** Partiendo de los `meta.roles` de las ~100 rutas, definir los
  tags `recurso:acción`, la matriz `ROLE_PERMISSIONS` (con `admin` recibiendo todo de forma
  explícita, sin bypass) y `AUTH_ROUTE_PERMISSIONS`. Deny-by-default: una ruta sin declarar es
  un 403, no un acceso.
- `config/navigation.ts` con los 9 grupos y sus permisos.
- `AppSidebar`/`NavMain`/`NavUser` sobre el sidebar del template, y la campana como slice
  `notificaciones` (con su service y su composable, sin `setInterval` suelto).
- Retirar la app móvil del guard web: layout y guard propios en su slice.

### 3.4 Olas 2–7 · Los slices

Orden por dependencia y riesgo creciente. Cada ola termina con humo y despliegue de vista
previa.

| Ola | Slices | Por qué aquí | Tamaño |
| --- | --- | --- | --- |
| **2** | `clientes`, `proyectos`, `contratos`, `operadores-red`, `retos`, `admin` | CRUD clásico: es donde se afina la receta y se estrena la tabla de datos con riesgo bajo | Medio |
| **3** | `fallas`, `operaciones`, `solar`, `alertas` | Alto tráfico diario; introduce mapas, gráficas y tiempo real | Grande |
| **4** | `fronteras`, `registros-cnd`, `mem` (gescon, precio bolsa, clima, descubrimientos, balance), `garantias` | Dominio pesado, exportes con fórmulas, parsers | Grande |
| **5** | `liquidaciones`, `panel-contable`, `finanzas` | El núcleo financiero: máximo impacto si algo sale mal, se migra cuando la receta está probada | Muy grande |
| **6** | `comercial` | Aislado y ya con pruebas; puede adelantarse si conviene por prioridad de negocio | Medio |
| **7** | `mobile` | Producto aparte, layout propio, sin dependencias de los demás | Medio |

**Fuera de este orden, como sub-proyectos con plan propio** (son demasiado grandes para una
rebanada normal):

| Archivo | Líneas | Cuándo |
| --- | --- | --- |
| `MEM/CumplimientoV2View.vue` | 5.425 | Ola 4, con su propio desglose en 7 pestañas |
| `Fallas/MonitoreoView.vue` | 2.992 | Ola 3 |
| `GeneracionSolarView.vue` | 2.885 | Ola 3 |
| `Servicios/OperacionView.vue` | 2.422 | Ola 2 — y aquí se retira `runtimeCompiler` |
| `Operaciones/InformesMensualesPanel.vue` | 1.969 | Ola 3 |
| `Operaciones/GestionFallasView.vue` | 1.941 | Ola 3 |
| `Servicios/ServiciosUnificadoView.vue` | 1.757 | Ola 2 — es la pantalla de entrada real del producto |
| `PanelContable/PanelContableView.vue` | 1.644 | Ola 5 |

### 3.5 Ola 8 · Retirada

Lo que solo se puede hacer cuando ya no queda nadie usándolo:

- [ ] Desinstalar `primevue`, `@primevue/themes`, `primeicons`, `axios`, `vuedraggable`.
- [ ] Decidir y ejecutar Chart.js → `@unovis/vue` (12 archivos) o documentar la excepción.
- [ ] Retirar `vue.runtimeCompiler`.
- [ ] Retirar los layouts y el middleware `legacy-*`.
- [ ] Pasar `import.meta.env.VITE_*` a `runtimeConfig`.
- [ ] Reevaluar SSR: activarlo donde aporte (páginas de lectura), dejarlo apagado donde no.
- [ ] Endurecer la CSP: sin `style=` inline, `Content-Security-Policy` en modo bloqueo.
- [ ] Auto-hospedar las fuentes de Google y `pdf.js` para poder cerrar `script-src` y
      `font-src`.

### 3.6 Cómo se mide el avance

Métricas objetivas, verificables con un comando:

| Métrica | Inicio | Meta |
| --- | --- | --- |
| Archivos en `app/legacy/` | 237 | 0 (al terminar la fase 2) |
| Archivos que importan `primevue` | 120 | 0 |
| Archivos `.js`/`.vue` sin `lang="ts"` | 237 | 0 |
| Llamadas a la API fuera de un service | ~280 | 0 |
| Literales hex de la paleta | ~2.528 | 0 |
| Rutas declaradas en `AUTH_ROUTE_PERMISSIONS` | 1 | ~100 |
| Slices que cumplen la receta completa | 0 | 21 |

---

## Fase 4 · Cierre

- [ ] **Cutover:** desplegar `v2/` como producción; el legacy queda accesible una semana como
      plan de reversión.
- [ ] **Borrar `legacy/`** del repositorio y promover `v2/` a la raíz.
- [ ] **Documentación:** actualizar `AGENTS.md` con lo específico de Unergy, reescribir el
      `README.md`, retirar `FRONTED.md` y `FRONTEND_ARCHITECTURE.md` (desactualizados) y
      conservar `docs/superpowers/` como especificaciones vivas del dominio.
- [ ] **`SECURITY.md`:** reescribir con el esquema nuevo y cerrar los puntos que quedaron
      resueltos por la migración.
- [ ] **Retrospectiva:** qué se descartó y por qué, deuda que queda anotada.

---

## Riesgos transversales

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| **La tabla de datos** no tiene equivalente en shadcn | Bloquea 68 usos y contamina 3 olas | Resolverlo en la ola 0, antes de tocar ningún slice |
| **Pérdida silenciosa de funciones** en vistas de 2.000+ líneas | Alto: nadie lo nota hasta el cierre contable | Inventario de capacidades por vista antes de tocarla; humo por slice |
| **El equipo sigue trabajando en el legacy** durante la migración | Divergencia de ramas | Congelar funcionalidad nueva en `legacy/` durante las fases 1–2; después, toda función nueva se escribe en `v2/` |
| **Los exportes de Excel/PDF** son lógica de negocio disfrazada de formato (fórmulas vivas, outline, estilo de marca) | Alto: son entregables que salen de la empresa | Migrar tal cual, comparar el archivo generado byte a byte contra el del legacy |
| **Auth**: la migración a cookies depende del backend | Puede bloquear la ola 1 | Decidirlo en la fase 0; si el backend no está listo, la ola 1 se reordena |
| Tailwind 4 rompe estilos sin fallar | Difuso, se acumula | Revisión visual lado a lado en la fase 1, no al final |
| Fatiga: 21 slices es largo | Se afloja la receta y se degrada la calidad | Una ola por vez, con despliegue de vista previa y métricas visibles |

---

## Lo que este roadmap deliberadamente **no** hace

- **No rediseña el producto.** Ninguna fase cambia lo que ve el usuario, salvo por el cambio de
  sistema de diseño. Las mejoras de UX pendientes (dashboard, módulos placeholder, búsqueda
  global) son trabajo posterior, no parte de la migración.
- **No toca el backend.** Salvo la conversación sobre cookies de sesión, que es una petición,
  no un cambio unilateral.
- **No persigue cobertura de pruebas.** Se prueban las reglas de negocio puras, que es donde
  una prueba paga. Los componentes se verifican con el guion de humo.
- **No optimiza rendimiento** más allá de lo que Nuxt da gratis (división de código, imports
  dinámicos de las bibliotecas pesadas).

---

## Resumen ejecutable

| Fase | Entregable | Señal de que terminó |
| --- | --- | --- |
| **0 · Preparar** | Decisiones firmadas, pruebas en Vitest, inventarios, guion de humo | Las 3 decisiones bloqueantes están cerradas |
| **1 · Trasladar** | Una app Nuxt que hace todo lo del legacy | Las ~100 rutas cargan; hay despliegue de vista previa |
| **2 · Reorganizar** | El código en la estructura del template | `app/legacy/` no existe; el alias `@` está eliminado |
| **3 · Migrar** | Código que cumple `AGENTS.md` | 0 imports de PrimeVue, 0 archivos sin TypeScript, 0 llamadas fuera de un service |
| **4 · Cerrar** | Un solo repositorio, un solo producto | `legacy/` borrado, documentación reescrita |
