# Panel Contable más intuitivo — diseño

Fecha: 2026-08-06
Vista: `src/views/PanelContable/PanelContableView.vue`

## Contexto y objetivo

El Panel Contable hoy mezcla, en las pestañas Preliquidación/Oficial, la **gestión**
(selección de qué liquidar, consecutivos) con el **detalle contable** de cada proyecto,
y muestra referencias a celdas del ER que ya casi no aplican ahora que los costos vienen
de los módulos. Objetivo: que el día a día sea leer el detalle contable limpio, sacar la
gestión de en medio, y poder exportar a Excel en el formato del Excel maestro (hoja
"Ajustes"), pensando en que a futuro el Excel desaparece y facturas+costos vivirán solo
aquí.

Fuera de alcance: agregar campos nuevos al modelo (Referencia Factura, Contrato por
línea de costo), conexión de ingresos/comercialización a datos crudos. Son pasos aparte.

## Cambios

### 1. Selección de liquidación → pestaña propia
- Nueva pestaña **"Selección"** en la barra de tabs (junto a Preliquidación / Oficial /
  Diferencia / Clasificación).
- Mueve a esa pestaña la card "Selección de liquidación" completa: lista de proyectos con
  checks (liquidar ingresos / liquidar costos / generar mandatos), botones masivos y
  consecutivos.
- Como los flags dependen del tipo, la pestaña Selección lleva un switch interno
  **preliquidación / oficial**.
- Las pestañas Preliquidación y Oficial abren **directo en el detalle contable** (sin la
  card de selección arriba).

### 2. Quitar la celda de origen del detalle
- Eliminar la línea `⚙ origen: Sheet1!Gxx` y su editor inline de cada fila, tanto en la
  vista por inversionista como en la vista 100%.
- El detalle de cada fila queda: **Concepto · Valor · Comprobante · Soporte**.
- La **corrección de mapeo de celda** (aún útil para ingresos/comercialización, que siguen
  del ER) se mueve a la pestaña Selección como acción por proyecto ("editar mapeo"), para
  no perder la capacidad pero sacarla del día a día.

### 3. Exportar a Excel (formato del Excel maestro)
- Botón **"Exportar Excel"** en las acciones de arriba (junto a "Cargar ER").
- Exporta la tabla plana del período + tipo actualmente visibles, una fila por
  `(Proyecto, Inversionista, Documento contable, Contrato, Concepto, Total,
  Referencia Factura, Consecutivo, Comprobante)`, igual que la hoja "Ajustes".
- **Documento contable** derivado del grupo: ingresos/comercialización → *Mandato*;
  costos → *Costos*; representación/CGM/administración → *Factura*.
- Se arma en el frontend (ya existe la dependencia `xlsx` y el patrón en
  `costosExcelExport.js`).
- **Columnas sin dato en el modelo actual** (`Referencia Factura`, `Contrato`): se dejan
  **vacías** por ahora (decisión de la usuaria), hasta que se agreguen esos campos.

### 4. Detalle plano + filtros (ampliación aprobada por la usuaria)
- **Filtros** de la lista de proyectos (barra arriba, en Preliquidación/Oficial/Selección):
  buscar por nombre, tipo de liquidación (normal/NEU/NITRO vía `/clasificacion`), estado
  (liquida/no/solo ingresos/solo costos/genera) y marcadores (con/sin costos, bolsa).
- **Detalle plano**: cada proyecto muestra por defecto el **100% en una sola tabla**
  agrupada por bloques contables (MANDATO = ingresos+comercialización, COSTOS, FACTURA),
  con la fuente marcada, "Valor a pagar" por bloque y RESULTADO al final. Reemplaza los
  acordeones anidados (Proyecto→Inversionista→Sección→tabla).
- **Desglose por inversionista**: expandible por proyecto (botón "Ver desglose"); ahí se
  editan valores y comprobante (la tabla plana 100% es de solo lectura).

## Datos disponibles hoy (para el export)
El serializer del panel ya entrega, por inversionista: `grupo`, `concepto`, `valor_cop`,
`comprobante_contable`, consecutivos, `fuente`. De ahí salen todas las columnas menos
`Referencia Factura` y `Contrato`, que van vacías.
