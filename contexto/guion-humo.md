# Guion de humo

> Generado en la Fase 0. Es la **verificación real** de esta migración: la cobertura
> automatizada de la aplicación es prácticamente cero (135 pruebas, todas sobre lógica pura),
> así que nada de lo que se ve en pantalla lo prueba una máquina. Este guion se ejecuta a mano.

## Cuándo se ejecuta

| Momento                          | Qué se corre                                                         |
| -------------------------------- | -------------------------------------------------------------------- |
| Fin de la **Fase 1**             | El guion completo, comparando contra el legacy corriendo en paralelo |
| Fin de la **Fase 2**             | El guion completo (no debe haber cambiado nada)                      |
| Fin de cada **ola de la Fase 3** | Solo los recorridos de los slices que tocó la ola                    |
| Antes del **cutover** (Fase 4)   | El guion completo, en el entorno de producción                       |

## Cómo se ejecuta

1. Levantar el legacy en un puerto (`cd legacy && npm run dev` → `:5173`) y `v2` en otro
   (`cd v2 && bun run dev` → `:3000`).
2. Recorrer cada caso en ambos, lado a lado.
3. Marcar ✅ / ❌. Un ❌ se anota con lo que se esperaba y lo que pasó — **no se sigue
   adelante dejándolo pendiente**.
4. Los casos marcados **💰** tocan dinero o documentos que salen de la empresa. Un fallo ahí
   bloquea la ola; el resto se puede negociar.

> **Datos:** usar el entorno de pruebas si existe. Si se corre contra producción, los casos de
> escritura (marcados **[W]**) se hacen sobre registros de prueba y se revierten, **excepto** los
> de envío de correo, que no se ejecutan nunca contra producción.

---

## Bloque A — Sesión y shell _(slice: `auth`, `notificaciones`)_

| #   | Recorrido                                                                            | Resultado esperado                                           | ✅  |
| --- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------ | :-: |
| A1  | Entrar a `/dashboard` sin sesión                                                     | Redirige a `/login`                                          |  ☐  |
| A2  | Login con credenciales válidas                                                       | Entra al dashboard; el sidebar muestra el nombre y el correo |  ☐  |
| A3  | Login con credenciales inválidas                                                     | Mensaje de error; no entra                                   |  ☐  |
| A4  | Recargar la página con sesión abierta                                                | Sigue dentro, en la misma ruta                               |  ☐  |
| A5  | Abrir una segunda pestaña                                                            | Comparte la sesión sin volver a pedir login                  |  ☐  |
| A6  | Entrar a una ruta cuyo rol no se tiene (p. ej. `/liquidaciones` con rol `monitoreo`) | No la abre; redirige o 403                                   |  ☐  |
| A7  | Abrir la campana de notificaciones                                                   | Lista las últimas; el contador coincide con las no leídas    |  ☐  |
| A8  | Marcar una notificación como leída **[W]**                                           | El contador baja en uno y persiste al recargar               |  ☐  |
| A9  | Colapsar el sidebar y recargar                                                       | Sigue colapsado                                              |  ☐  |
| A10 | Cerrar sesión                                                                        | Vuelve a `/login`; volver atrás en el navegador no reentra   |  ☐  |

## Bloque B — Portafolio y dominio base _(slices: `proyectos`, `clientes`, `contratos`)_

| #   | Recorrido                                               | Resultado esperado                                                      | ✅  |
| --- | ------------------------------------------------------- | ----------------------------------------------------------------------- | :-: |
| B1  | Abrir **Proyectos** (`/servicios-unificado`)            | Carga el portafolio; el subtítulo cuadra con el número de filas         |  ☐  |
| B2  | Cambiar la agrupación a _Clientes_ y luego a _PPA_      | Reagrupa sin recargar; los totales cuadran                              |  ☐  |
| B3  | Aplicar un filtro, recargar la página                   | El filtro se recuerda                                                   |  ☐  |
| B4  | Abrir el detalle de un proyecto                         | Las cuatro pestañas cargan: General, Técnico, Inversionistas, Servicios |  ☐  |
| B5  | Editar información técnica y guardar **[W]**            | Aviso de éxito; el valor persiste al recargar                           |  ☐  |
| B6  | Abrir el detalle de un cliente                          | Info, servicios, documentos y contactos cargan                          |  ☐  |
| B7  | Subir un documento a un cliente **[W]**                 | Sube, aparece en la lista y se puede descargar                          |  ☐  |
| B8  | Abrir el detalle de un contrato PPA                     | Datos, Cantidades, Tarifas y Contratos ASIC cargan                      |  ☐  |
| B9  | Pegar tarifas desde Excel en la pestaña Tarifas **[W]** | Parsea las filas y las guarda; los valores cuadran con lo pegado        |  ☐  |
| B10 | Abrir el wizard de contrato de servicio                 | Avanza los pasos; el mapa carga y permite ubicar la planta              |  ☐  |

## Bloque C — Operaciones _(slices: `fallas`, `operaciones`, `solar`, `alertas`)_

| #   | Recorrido                                                        | Resultado esperado                                                                  | ✅  |
| --- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------- | :-: |
| C1  | Abrir **Gestión de Fallas** (`/fallas`)                          | Los cuatro buckets cargan con sus conteos                                           |  ☐  |
| C2  | Cambiar a la pestaña Calendario                                  | Pinta las fallas en el mes correcto                                                 |  ☐  |
| C3  | Registrar una falla nueva **[W]**                                | La clasificación jerárquica despliega solo las opciones del sistema elegido; guarda |  ☐  |
| C4  | Elegir un subtipo que exige detalle (p. ej. `mantenimiento_red`) | Pide el detalle y no deja guardar sin él                                            |  ☐  |
| C5  | Abrir una falla vieja (con `tipo_id` plano)                      | Se muestra igual que antes, sin romperse                                            |  ☐  |
| C6  | Añadir un seguimiento a una falla **[W]**                        | Aparece en la bitácora con su fecha                                                 |  ☐  |
| C7  | Subir una foto a una falla **[W]**                               | Sube y se previsualiza                                                              |  ☐  |
| C8  | Abrir el mapa de fallas                                          | Carga las teselas y los marcadores                                                  |  ☐  |
| C9  | Abrir **Generación Solar** (`/solar-live`)                       | El mosaico carga; las gráficas pintan datos del día                                 |  ☐  |
| C10 | Reordenar las plantas arrastrando y recargar                     | Conserva el orden                                                                   |  ☐  |
| C11 | Abrir **Informes Mensuales**                                     | Los tres paneles cargan: Generar, Revisión y envío, Gestión de portafolios          |  ☐  |
| C12 | Abrir la vista previa de un informe                              | El `iframe` renderiza el informe                                                    |  ☐  |
| C13 | Abrir el **Centro de Alertas**                                   | Las seis tarjetas cargan con sus conteos                                            |  ☐  |

## Bloque D — Comercialización y mercado _(slices: `mem`, `fronteras`, `registros-cnd`, `garantias`)_

| #   | Recorrido                                           | Resultado esperado                                                                                                     | ✅  |
| --- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | :-: |
| D1  | Abrir **Cumplimiento PPA**                          | Las siete pestañas cargan                                                                                              |  ☐  |
| D2  | Pestaña _Matriz anual_                              | La matriz Contrato → Proyectos × 12 meses pinta; los semáforos coinciden con la regla del mínimo                       |  ☐  |
| D3  | 💰 Exportar la matriz anual a Excel                 | El archivo abre con **fórmulas vivas**, outline colapsable y estilo de marca. **Comparar contra el export del legacy** |  ☐  |
| D4  | Abrir **GESCON / ASIC**                             | La tabla pagina y filtra                                                                                               |  ☐  |
| D5  | 💰 Exportar GESCON a Excel                          | Mismo contenido y estilo que el legacy                                                                                 |  ☐  |
| D6  | Crear una modificación de contrato ASIC **[W]**     | Guarda y aparece en el listado                                                                                         |  ☐  |
| D7  | Abrir **Precio de Bolsa**                           | La gráfica SVG pinta; los datos de EVO cargan                                                                          |  ☐  |
| D8  | Verificar que el token de EVO no viaja al cliente   | Buscar `X-EVO-Token` en el bundle y en las peticiones del navegador: **no debe aparecer**                              |  ☐  |
| D9  | Abrir **Fronteras**                                 | Lista y filtra; la bandeja de pendientes de Quoia carga                                                                |  ☐  |
| D10 | Abrir **Reporte de Energía**, entrar a una frontera | La curva típica pinta; las exclusiones cargan                                                                          |  ☐  |
| D11 | Abrir **Registros CND/ASIC**, entrar a un proyecto  | La máquina de estados muestra el estado actual y las transiciones posibles                                             |  ☐  |
| D12 | Abrir **Garantías → Ajustes XM**                    | Las cinco pestañas cargan (Semanales, Mensuales, TXF, TXR, Histórico)                                                  |  ☐  |
| D13 | 💰 Cargar un archivo de ajustes XM **[W]**          | El parser lo lee y el detalle cuadra con el del legacy sobre el mismo archivo                                          |  ☐  |

## Bloque E — Finanzas _(slices: `liquidaciones`, `panel-contable`, `finanzas`)_

| #   | Recorrido                                                                | Resultado esperado                                                                    | ✅  |
| --- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | :-: |
| E1  | Abrir **Liquidaciones**                                                  | Las cinco pestañas cargan; el deep-link `?tab=` funciona                              |  ☐  |
| E2  | Pestaña _Resumen_                                                        | Los KPIs y el comparativo vs. mes anterior cuadran con el legacy                      |  ☐  |
| E3  | Pestaña _Proyectos_, expandir Proyecto → Año → Mes                       | El árbol expande y los totales cuadran                                                |  ☐  |
| E4  | 💰 Abrir el detalle de una liquidación                                   | El estado de resultados en cascada cuadra **peso a peso** con el legacy               |  ☐  |
| E5  | 💰 Abrir la vista PDF de una liquidación e imprimir                      | El PDF sale idéntico al del legacy                                                    |  ☐  |
| E6  | Abrir **Panel Contable**                                                 | Las cinco pestañas cargan con el período seleccionado                                 |  ☐  |
| E7  | Pestaña _Selección_, marcar un proyecto para liquidar **[W]**            | Guarda y persiste al cambiar de pestaña                                               |  ☐  |
| E8  | 💰 Exportar el Panel Contable a Excel                                    | Sale en el formato del Excel maestro (hoja «Ajustes»), igual que el legacy            |  ☐  |
| E9  | 💰 Abrir el **Validador de Mandatos**, cargar un ZIP de mandatos **[W]** | Concilia; los estados OK/DIFERENCIA/FALTANTE cuadran con el legacy sobre el mismo ZIP |  ☐  |
| E10 | Cargar un ZIP con una entrada maliciosa (`../` o `.exe`)                 | Lo rechaza con el error correspondiente y no procesa nada                             |  ☐  |
| E11 | Abrir **Estados de Resultados**                                          | Lista los archivos de Drive; la descarga individual funciona                          |  ☐  |
| E12 | Abrir **Descarga de XM** sin el agente local corriendo                   | Avisa que el agente no está disponible, sin romperse                                  |  ☐  |
| E13 | Abrir **Costos** y exportar a Excel                                      | Los totales cuadran con el legacy                                                     |  ☐  |

## Bloque F — Comercial y Retos _(slices: `comercial`, `retos`)_

| #   | Recorrido                                             | Resultado esperado                                                    | ✅  |
| --- | ----------------------------------------------------- | --------------------------------------------------------------------- | :-: |
| F1  | Abrir **Pipeline** (`/comercial`)                     | El tablero pinta las seis columnas con sus ofertas                    |  ☐  |
| F2  | Cambiar a vista Tabla y volver al Tablero             | Ambas muestran las mismas ofertas                                     |  ☐  |
| F3  | Abrir una oferta y copiar la URL con `?oferta=<id>`   | Pegada en otra pestaña abre el drawer directamente                    |  ☐  |
| F4  | Arrastrar una oferta a _Cerradas_ **[W]**             | Queda como `declinado`, no como `terminado`                           |  ☐  |
| F5  | Firmar una oferta de compra de energía **[W]**        | Valida el periodo y la tarifa; genera las tarifas mensuales esperadas |  ☐  |
| F6  | Intentar firmar una oferta de servicios operacionales | La UI no lo ofrece (el backend daría 422)                             |  ☐  |
| F7  | Abrir **Retos Q**, entrar a un reto                   | Métricas, KPIs y visualizaciones cargan                               |  ☐  |
| F8  | Registrar un valor en la matriz semanal **[W]**       | Guarda y el avance se recalcula                                       |  ☐  |

## Bloque G — Administración _(slice: `admin`)_

| #   | Recorrido                                       | Resultado esperado                                                           | ✅  |
| --- | ----------------------------------------------- | ---------------------------------------------------------------------------- | :-: |
| G1  | Abrir **Usuarios**                              | Lista los usuarios con su rol                                                |  ☐  |
| G2  | Crear un usuario **[W]**                        | Guarda y aparece en la lista                                                 |  ☐  |
| G3  | Generar una API key **[W]**                     | La key en claro se muestra **una sola vez**; al recargar aparece enmascarada |  ☐  |
| G4  | Revocar una API key **[W]**                     | Desaparece o queda inactiva                                                  |  ☐  |
| G5  | Abrir **Diagnóstico** con el usuario autorizado | El mapeo Contrato → GESCON → Planta carga                                    |  ☐  |
| G6  | Abrir **Diagnóstico** con otro usuario          | No lo deja entrar                                                            |  ☐  |

## Bloque H — App móvil PWA _(slice: `mobile`)_

> Se ejecuta en un teléfono real o con el emulador de dispositivo del navegador.

| #   | Recorrido                                  | Resultado esperado                                                    | ✅  |
| --- | ------------------------------------------ | --------------------------------------------------------------------- | :-: |
| H1  | Entrar a `/m` sin sesión                   | Va a `/m/login`, **no** a `/login`                                    |  ☐  |
| H2  | Login móvil                                | Entra; la sesión dura (token de 30 días)                              |  ☐  |
| H3  | Login con rol `coordinador`                | Aterriza en `/m/coordinador`, no en `/m/solar`                        |  ☐  |
| H4  | Login con rol `tecnico`                    | Aterriza en `/m/tecnico`                                              |  ☐  |
| H5  | Abrir `/m/solar`                           | La gráfica combinada inversores + medidor pinta, con la línea «ahora» |  ☐  |
| H6  | Abrir la hoja de reconexión                | Muestra el estado del reconectador                                    |  ☐  |
| H7  | Registrar una falla desde el móvil **[W]** | Guarda y aparece en la web                                            |  ☐  |
| H8  | Instalar la PWA                            | Se instala con su nombre e icono; abre en `/m/`                       |  ☐  |

## Bloque I — Transversales

| #   | Recorrido                                          | Resultado esperado                                                           | ✅  |
| --- | -------------------------------------------------- | ---------------------------------------------------------------------------- | :-: |
| I1  | Provocar un 403 (entrar a un endpoint sin permiso) | Aviso de acceso denegado con el detalle del backend; **no** cierra la sesión |  ☐  |
| I2  | Provocar un 401 (invalidar la sesión y navegar)    | Cierra sesión y va al login que corresponde (web o móvil)                    |  ☐  |
| I3  | Cortar la red y navegar                            | Muestra error, no una pantalla en blanco                                     |  ☐  |
| I4  | Entrar a una ruta que no existe                    | Va al dashboard                                                              |  ☐  |
| I5  | Revisar la consola durante todo el recorrido       | Sin errores nuevos respecto al legacy                                        |  ☐  |
| I6  | Revisar la pestaña Red durante todo el recorrido   | Sin peticiones 4xx/5xx inesperadas                                           |  ☐  |

---

## Registro de ejecución

| Fecha | Fase / ola | Bloques corridos | ✅  | ❌  | Notas |
| ----- | ---------- | ---------------- | --- | --- | ----- |
|       |            |                  |     |     |       |
