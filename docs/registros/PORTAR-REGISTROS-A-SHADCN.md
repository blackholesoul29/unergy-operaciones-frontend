# Qué se puede reutilizar al portar Registros a shadcn-vue

**Estado:** la rama `feat/registros-proyecto-documentos` del frontend es **respaldo, no
avance**. Vive en `legacy/src/views/Registros/` y **no se mergea a nada**. Esta nota
existe para que el día que se porte a v2 (Nuxt + shadcn-vue) no haya que releer 637 líneas
para decidir qué sirve.

**No se ha portado nada.** Esto es solo el inventario.

---

## El reparto en números

| | Líneas | Veredicto |
|---|---:|---|
| `RegistroExpedienteView.vue` — template | 191 | Reescribir; la **estructura** se conserva |
| `RegistroExpedienteView.vue` — script | 231 | **Casi todo reutilizable** |
| `RegistroExpedienteView.vue` — `<style scoped>` | 97 | **Descartable entero** (32 clases `rg-*`) |
| `RegistrosListView.vue` — template | 54 | Reescribir |
| `RegistrosListView.vue` — script | 59 | Reutilizable salvo el render function |
| **Total** | **632** | ≈ **250 líneas de lógica** se salvan; el resto es presentación |

Dicho corto: **el valor está en el `<script>`, no en el `<template>`.** Los 191+54 de
template y los 97 de estilo son PrimeVue y paleta a mano; la lógica de agrupación, el
guardado parcial y el contrato con los 11 endpoints son independientes de la librería de
UI y se copian casi verbatim.

---

## Lo que hay que conservar sí o sí

### 1. `claveCampo(c)` — la clave estable de un campo

```js
function claveCampo(c) {
  return `${c.clave}|${c.equipo_tipo}|${c.equipo_posicion}`
}
```

Es el espejo en el cliente de la restricción `UNIQUE(proyecto, clave, equipo_tipo,
equipo_posicion)` de la base. Sin ella, el medidor principal y el de respaldo colapsan en
el mismo campo del formulario. **Portar literal.**

### 2. El `computed grupos` — agrupación en dos niveles

Agrupa los campos por **grupo** y, dentro de cada grupo, por **instancia de equipo**. Es lo
único que hace legible un documento de 90 campos: en vez de una lista plana, salen bloques
"Medidor principal" / "Medidor de respaldo" / "TC fase R"… **Portar literal**, es una
transformación de datos pura sin nada de Vue ni de PrimeVue.

### 3. El guardado parcial (`sucios` + payload de solo lo tocado)

```js
// Solo se mandan los campos tocados: enviar todo pisaría valores que otro
// documento acaba de actualizar.
```

**Esto es correctitud, no una optimización.** Un mismo parámetro aparece hasta en 10
documentos; si el formulario manda todos sus campos al guardar, pisa lo que otro documento
acaba de escribir. Cualquier reescritura que use un `v-model` sobre el objeto entero y
haga PUT de todo **introduce un bug de pérdida de datos**. Conservar el `Set` de sucios y
el armado del payload en `guardarParametros()`.

El truco `sucios.value = new Set(sucios.value)` sigue siendo necesario en Vue 3: reasignar
fuerza la reactividad del `Set`.

### 4. El contrato con la API (8 llamadas)

Sirven igual, no cambian:

```
GET    /registros-proyecto                                   índice
GET    /registros-proyecto/{id}                              resumen + timeline
GET    /registros-proyecto/{id}/{proceso}/{item}             formulario del ítem
PATCH  /registros-proyecto/{id}/{proceso}/{item}             estado, radicado, fecha, emisor
PUT    /registros-proyecto/{id}/parametros                   guardar valores
POST   /registros-proyecto/{id}/{proceso}/{item}/archivos    montar por enlace
POST   /registros-proyecto/{id}/{proceso}/{item}/archivos/subir   subir a Drive
DELETE /registros-proyecto/archivos/{id}                     quitar archivo
```

Detalles del payload que hay que respetar: `''` → `null` antes de mandar (tanto en el
documento como en los parámetros), y `documento_origen_id` en cada valor —es lo que hace
rastreable de qué documento salió el dato—.

### 5. La máquina de estados de la vista

`procesoActivo` → `codigoActivo` → `formulario`, con `cambiarProceso()` reseteando ítem y
formulario. Más la sincronización con `?proceso=` (el `watch` y el `onMounted`), que es lo
que permite enlazar directo a `SIC` o `CND`. **Portar la lógica**, cambiando solo el
enrutado a `pages/registros/[proyectoId].vue`.

### 6. La afordancia del enlace entre documentos

El ícono junto a cada campo que aparece en varios documentos, con el tooltip
`También en: SIC 01, CND 9.3` (`resumirOtros`). **Es la única parte de la UI que le explica
al usuario por qué solo escribe el dato una vez** — o sea, la razón de ser del módulo.
El ícono cambia; el comportamiento no debería perderse.

### 7. Cosas menores pero con criterio detrás

- `ESTADOS` = `PENDIENTE | CARGADO | NO_APLICA` — coincide con el backend.
- `colorNodo()`: el **mapeo** estado→color se conserva; los hex, no.
- El aviso de `nota_catalogo`: muestra en pantalla la nota de los ítems `PENDIENTE`
  (los SIC 16–23, 27 y CND 9.5/9.6/9.8). Es lo que evita que alguien los llene a ciegas.

---

## Lo que se tira

| Qué | Reemplazo en v2 |
|---|---|
| 10 imports `primevue/*` (Button, InputText, Textarea, Select, Tag, DataTable, Column, IconField, InputIcon, useToast) | Componentes shadcn-vue equivalentes |
| Clases de ícono `pi pi-*` (check, minus, link, upload, trash, file, paperclip, eye, search, arrow-left, spinner…) | `lucide-vue-next` |
| Las 97 líneas de `<style scoped>` y sus 32 clases `rg-*` | Utilidades Tailwind + primitivas shadcn |
| **17 colores hex a mano** (`#915BD8`, `#2C2039`, `#9b89b5`, `#ECE7F2`…) | Tokens del tema (variables CSS de shadcn) |
| `BarraAvance`, render function con `h()` | `<Progress>` de shadcn |
| `<DataTable>` con `paginator`/`sortable`/`@row-click` | DataTable de shadcn sobre TanStack Table: hay que declarar las columnas |
| `toast.add({ severity, summary, detail, life })` | `useToast()` de shadcn / sonner — **otra API, hay que reescribir las 12 llamadas** |
| `confirm()` nativo en `quitarArchivo` | `<AlertDialog>`. Además el `confirm()` bloquea el hilo: cambiarlo es mejora, no solo estilo |

---

## Lo que no es ni reutilizable ni descartable: hay que rehacerlo

- **Enrutado.** `useRoute().params.proyectoId` sigue existiendo, pero las rutas se declaran
  por archivo: `pages/registros/index.vue` y `pages/registros/[proyectoId].vue`. Desaparece
  el bloque que se agregó a `legacy/src/router/index.js`.
- **Cliente HTTP.** `@/api/client` (axios) → `$fetch` / `useFetch`. Decidir qué se carga en
  servidor: el índice es candidato a SSR; el formulario del ítem es interacción, va en
  cliente.
- **Tipos.** El código legacy es JS sin tipos. En v2 (TS) hay que escribir las interfaces de
  las respuestas: resumen, ítem del timeline, campo del formulario. **El backend ya tiene
  los schemas Pydantic** en `app/schemas/registros_proyecto.py` — de ahí se derivan sin
  inventar nada.
- **El layout de dos columnas** (timeline 340px + panel) con su colapso a una sola cuando no
  hay ítem abierto (`rg-una-columna`). El comportamiento responsive se conserva; la
  implementación pasa a clases de Tailwind.

---

## Orden sugerido cuando se porte

1. Tipos TS derivados de los schemas Pydantic del backend.
2. Composable con las 8 llamadas + `claveCampo` + `grupos` + la lógica de sucios. **Aquí va
   todo lo reutilizable, sin una sola referencia a componentes.**
3. La vista índice (la más simple: tabla + búsqueda + barra de avance).
4. La vista de expediente encima del composable.

Partiendo así, el paso 2 es casi copiar y pegar, y los pasos 3–4 son UI nueva sin lógica
enredada.

---

**Referencia:** el código está en esta misma rama, commit `d7e2d17`, bajo
`legacy/src/views/Registros/`. El backend que lo alimenta vive en la rama homónima de
`klima-open-source/unergy-operaciones-backend` (migración `126`). La procedencia del
respaldo está en [PROCEDENCIA.md](PROCEDENCIA.md).
