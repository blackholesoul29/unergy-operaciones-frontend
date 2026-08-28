# Inventario congelado de endpoints

> Generado desde `legacy/src/**` en la Fase 0. **No se edita a mano.**
> Es el índice de los services que hay que escribir en la Fase 3: cada bloque de este
> documento es, aproximadamente, un archivo en `app/features/<slice>/services/`.

| Endpoints distintos | Slices | Compartidos por más de un slice |
| ------------------- | ------ | ------------------------------- |
| 341                 | 23     | 48                              |

## Cómo se usa

- **Fase 3, paso 2 de la receta** — por cada slice se escribe un service que absorbe todas las
  llamadas de su bloque. Las rutas van como constantes tipadas, nunca como literales sueltos.
- Un endpoint marcado **⇄ compartido** lo consume más de un slice: decidir de quién es el
  service y que los demás lo importen, en vez de duplicar la llamada.
- La columna _Consumidores_ dice qué archivos hay que tocar para vaciar ese endpoint de las
  vistas.

> ⚠️ La detección es estática (`api.<método>(...)`). Las llamadas construidas dinámicamente
> quedan agrupadas bajo rutas con `{id}`; al escribir cada service hay que revisar el archivo
> consumidor, no fiarse solo de esta tabla.

## `admin` — 9 endpoints

| Método   | Ruta                        | Consumidores                                                                                                            |     |
| -------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------- | --- |
| `POST`   | `/api-keys`                 | `views/Admin/ApiKeysDialog.vue`                                                                                         |     |
| `DELETE` | `/api-keys/{id}`            | `views/Admin/ApiKeysDialog.vue`                                                                                         |     |
| `PATCH`  | `/api-keys/{id}/toggle`     | `views/Admin/ApiKeysDialog.vue`                                                                                         |     |
| `GET`    | `/api-keys/user/{id}`       | `views/Admin/ApiKeysDialog.vue`                                                                                         |     |
| `GET`    | `/cumplimiento/diagnostico` | `views/Admin/DiagnosticoEnlacesView.vue`                                                                                |     |
| `POST`   | `/cumplimiento/fix-enlaces` | `views/Admin/DiagnosticoEnlacesView.vue`                                                                                |     |
| `GET`    | `/usuarios`                 | `mobile/MobileCoordinadorFallasView.vue`<br>`mobile/MobileFallasView.vue`<br>`mobile/MobileResumenView.vue`<br>_+4 más_ | ⇄   |
| `POST`   | `/usuarios`                 | `views/Admin/AdminUsuariosView.vue`                                                                                     |     |
| `PATCH`  | `/usuarios/{id}`            | `views/Admin/AdminUsuariosView.vue`                                                                                     |     |

## `alertas` — 2 endpoints

| Método | Ruta                     | Consumidores                                                                   |     |
| ------ | ------------------------ | ------------------------------------------------------------------------------ | --- |
| `GET`  | `/alertas/contratos-ppa` | `views/Alertas/AlertasContratosPPAView.vue`<br>`views/Alertas/AlertasView.vue` |     |
| `GET`  | `/dashboard/kpis`        | `views/Alertas/AlertasView.vue`<br>`views/DashboardView.vue`                   | ⇄   |

## `auth` — 2 endpoints

| Método | Ruta                    | Consumidores                   |     |
| ------ | ----------------------- | ------------------------------ | --- |
| `POST` | `/auth/forgot-password` | `views/ForgotPasswordView.vue` |     |
| `POST` | `/auth/reset-password`  | `views/ResetPasswordView.vue`  |     |

## `clientes` — 16 endpoints

| Método   | Ruta                                     | Consumidores                                                                                                                 |     |
| -------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --- |
| `POST`   | `/clientes`                              | `components/NuevoClienteDialog.vue`<br>`views/Clientes/ClientesListView.vue`<br>`views/Servicios/ServiciosUnificadoView.vue` | ⇄   |
| `DELETE` | `/clientes/{id}`                         | `views/Clientes/ClienteDetailView.vue`<br>`views/Servicios/ServiciosUnificadoView.vue`                                       | ⇄   |
| `GET`    | `/clientes/{id}`                         | `views/Clientes/ClienteDetailView.vue`<br>`views/Comercial/OportunidadDetailView.vue`                                        | ⇄   |
| `PATCH`  | `/clientes/{id}`                         | `views/Clientes/ClienteDetailView.vue`<br>`views/Comercial/OportunidadDetailView.vue`                                        | ⇄   |
| `GET`    | `/clientes/{id}/contratos-ppa`           | `views/Clientes/ClienteDetailView.vue`<br>`views/Comercial/OportunidadDetailView.vue`                                        | ⇄   |
| `POST`   | `/clientes/{id}/documentos`              | `components/NuevoClienteDialog.vue`<br>`views/Clientes/ClienteDetailView.vue`<br>`views/Comercial/OportunidadDetailView.vue` | ⇄   |
| `DELETE` | `/clientes/{id}/documentos/{id}`         | `views/Clientes/ClienteDetailView.vue`                                                                                       |     |
| `PATCH`  | `/clientes/{id}/documentos/{id}`         | `views/Clientes/ClienteDetailView.vue`                                                                                       |     |
| `POST`   | `/clientes/{id}/documentos/{id}/archivo` | `views/Clientes/ClienteDetailView.vue`                                                                                       |     |
| `GET`    | `/clientes/{id}/fronteras`               | `views/Clientes/ClienteDetailView.vue`                                                                                       |     |
| `GET`    | `/clientes/{id}/panel`                   | `views/Clientes/ClienteResumen.vue`                                                                                          |     |
| `GET`    | `/clientes/{id}/proyectos`               | `views/Clientes/ClienteDetailView.vue`                                                                                       |     |
| `POST`   | `/clientes/{id}/servicios`               | `views/Clientes/ClienteDetailView.vue`                                                                                       |     |
| `GET`    | `/clientes/{id}/servicios-contratos`     | `views/Clientes/ClienteDetailView.vue`                                                                                       |     |
| `DELETE` | `/clientes/{id}/servicios/{id}`          | `views/Clientes/ClienteDetailView.vue`                                                                                       |     |
| `GET`    | `/clientes/vista-comercial`              | `views/Clientes/ClientesListView.vue`<br>`views/Servicios/ServiciosUnificadoView.vue`                                        | ⇄   |

## `comercial` — 20 endpoints

| Método   | Ruta                                      | Consumidores                                                                                                                                    |     |
| -------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| `GET`    | `/clientes/{id}`                          | `views/Clientes/ClienteDetailView.vue`<br>`views/Comercial/OportunidadDetailView.vue`                                                           | ⇄   |
| `PATCH`  | `/clientes/{id}`                          | `views/Clientes/ClienteDetailView.vue`<br>`views/Comercial/OportunidadDetailView.vue`                                                           | ⇄   |
| `GET`    | `/clientes/{id}/contratos-ppa`            | `views/Clientes/ClienteDetailView.vue`<br>`views/Comercial/OportunidadDetailView.vue`                                                           | ⇄   |
| `POST`   | `/clientes/{id}/documentos`               | `components/NuevoClienteDialog.vue`<br>`views/Clientes/ClienteDetailView.vue`<br>`views/Comercial/OportunidadDetailView.vue`                    | ⇄   |
| `GET`    | `/comercial/config`                       | `views/Comercial/useOfertas.js`                                                                                                                 |     |
| `GET`    | `/comercial/ofertas`                      | `views/Comercial/useOfertas.js`                                                                                                                 |     |
| `DELETE` | `/comercial/ofertas/{id}`                 | `views/Comercial/useOfertas.js`                                                                                                                 |     |
| `PATCH`  | `/comercial/ofertas/{id}`                 | `views/Comercial/useOfertas.js`                                                                                                                 |     |
| `POST`   | `/comercial/ofertas/{id}/estado`          | `views/Comercial/OfertasPanel.vue`<br>`views/Comercial/useOfertas.js`                                                                           |     |
| `POST`   | `/comercial/ofertas/{id}/firmar`          | `views/Comercial/useOfertas.js`                                                                                                                 |     |
| `POST`   | `/comercial/ofertas/{id}/seguimiento`     | `views/Comercial/OfertasPanel.vue`<br>`views/Comercial/useOfertas.js`                                                                           |     |
| `GET`    | `/comercial/oportunidades/{id}`           | `views/Comercial/OportunidadDetailView.vue`                                                                                                     |     |
| `PATCH`  | `/comercial/oportunidades/{id}`           | `views/Comercial/OportunidadDetailView.vue`                                                                                                     |     |
| `POST`   | `/comercial/oportunidades/{id}/gestiones` | `views/Comercial/BitacoraPanel.vue`<br>`views/Comercial/useOfertas.js`                                                                          |     |
| `POST`   | `/comercial/oportunidades/{id}/ofertas`   | `views/Comercial/OfertasPanel.vue`                                                                                                              |     |
| `POST`   | `/comercial/oportunidades/{id}/proyectos` | `views/Comercial/ProyectoDesdeCRMDialog.vue`                                                                                                    |     |
| `POST`   | `/comercial/registrar`                    | `views/Comercial/useOfertas.js`                                                                                                                 |     |
| `GET`    | `/contratos-servicio`                     | `views/Comercial/OportunidadDetailView.vue`<br>`views/Contratos/ContratosListView.vue`<br>`views/Finanzas/CostosView.vue`<br>_+6 más_           | ⇄   |
| `GET`    | `/operadores-red`                         | `views/Comercial/OfertaDrawer.vue`<br>`views/MEM/FronterasView.vue`<br>`views/MEM/OperadoresRedView.vue`<br>_+2 más_                            | ⇄   |
| `PUT`    | `/proyectos/{id}/info-tecnica`            | `views/Comercial/ProyectoDesdeCRMDialog.vue`<br>`views/Proyectos/ProyectoDetailView.vue`<br>`views/Proyectos/ProyectosListView.vue`<br>_+1 más_ | ⇄   |

## `compartido` — 28 endpoints

| Método   | Ruta                                        | Consumidores                                                                                                                        |     |
| -------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --- |
| `POST`   | `/{id}/{id}/archivos/{id}`                  | `components/EvidenciaUploader.vue`                                                                                                  |     |
| `DELETE` | `/{id}/{id}/archivos/{id}/{id}`             | `components/EvidenciaUploader.vue`                                                                                                  |     |
| `DELETE` | `/arriendos/documentos/{id}`                | `composables/useArriendosDocs.js`                                                                                                   |     |
| `GET`    | `/arriendos/documentos/{id}`                | `composables/useArriendosDocs.js`                                                                                                   |     |
| `GET`    | `/arriendos/documentos/file/{id}`           | `composables/useArriendosDocs.js`                                                                                                   |     |
| `POST`   | `/arriendos/documentos/upload`              | `composables/useArriendosDocs.js`                                                                                                   |     |
| `POST`   | `/arriendos/documentos/upload-cuenta-cobro` | `composables/useArriendosDocs.js`                                                                                                   |     |
| `POST`   | `/clientes`                                 | `components/NuevoClienteDialog.vue`<br>`views/Clientes/ClientesListView.vue`<br>`views/Servicios/ServiciosUnificadoView.vue`        | ⇄   |
| `GET`    | `/clientes/{id}/contactos`                  | `components/ContactosPanel.vue`                                                                                                     |     |
| `POST`   | `/clientes/{id}/contactos`                  | `components/ContactosPanel.vue`                                                                                                     |     |
| `DELETE` | `/clientes/{id}/contactos/{id}`             | `components/ContactosPanel.vue`                                                                                                     |     |
| `PATCH`  | `/clientes/{id}/contactos/{id}`             | `components/ContactosPanel.vue`                                                                                                     |     |
| `POST`   | `/clientes/{id}/documentos`                 | `components/NuevoClienteDialog.vue`<br>`views/Clientes/ClienteDetailView.vue`<br>`views/Comercial/OportunidadDetailView.vue`        | ⇄   |
| `POST`   | `/clientes/{id}/test-correo`                | `components/ContactosPanel.vue`                                                                                                     |     |
| `GET`    | `/generacion-solar/monitoring`              | `components/FasorialButton.vue`<br>`mobile/MobileSolarView.vue`<br>`views/GeneracionSolarView.vue`<br>_+1 más_                      | ⇄   |
| `GET`    | `/generacion-solar/monitoring/{id}`         | `components/FasorialButton.vue`<br>`mobile/MobileSolarView.vue`<br>`views/GeneracionSolarView.vue`<br>_+1 más_                      | ⇄   |
| `GET`    | `/notificaciones`                           | `components/AppSidebar.vue`<br>`components/AppTopbar.vue`<br>`mobile/components/NotificationsSheet.vue`                             | ⇄   |
| `PATCH`  | `/notificaciones/{id}/leer`                 | `components/AppSidebar.vue`<br>`components/AppTopbar.vue`<br>`mobile/components/NotificationsSheet.vue`                             | ⇄   |
| `GET`    | `/notificaciones/count`                     | `components/AppSidebar.vue`<br>`components/AppTopbar.vue`<br>`mobile/MobileCoordinadorFallasView.vue`<br>_+3 más_                   | ⇄   |
| `POST`   | `/notificaciones/leer-todas`                | `components/AppSidebar.vue`<br>`components/AppTopbar.vue`                                                                           | ⇄   |
| `GET`    | `/proximos-energizar`                       | `composables/useEnergizationProjects.js`                                                                                            |     |
| `POST`   | `/proximos-energizar/sync`                  | `composables/useEnergizationProjects.js`                                                                                            |     |
| `GET`    | `/proyectos`                                | `components/FasorialButton.vue`<br>`mobile/MobileCoordinadorFallasView.vue`<br>`mobile/MobileFallasView.vue`<br>_+21 más_           | ⇄   |
| `DELETE` | `/proyectos/{id}`                           | `composables/useEnergizationProjects.js`<br>`views/Proyectos/ProyectosListView.vue`<br>`views/Servicios/ServiciosUnificadoView.vue` | ⇄   |
| `GET`    | `/proyectos/{id}/area-contactos`            | `components/ProyectoAreaContactosPanel.vue`                                                                                         |     |
| `DELETE` | `/proyectos/{id}/area-contactos/{id}`       | `components/ProyectoAreaContactosPanel.vue`                                                                                         |     |
| `PUT`    | `/proyectos/{id}/area-contactos/{id}`       | `components/ProyectoAreaContactosPanel.vue`                                                                                         |     |
| `POST`   | `/proyectos/{id}/vincular-sunfactory/{id}`  | `components/ProyectosProximosEnergizar.vue`                                                                                         |     |

## `contratos` — 39 endpoints

| Método   | Ruta                                               | Consumidores                                                                                                                                    |     |
| -------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| `DELETE` | `/arriendos/arrendadores/{id}`                     | `views/Contratos/ContratoServicioWizard.vue`<br>`views/Servicios/OperacionView.vue`                                                             |     |
| `PUT`    | `/arriendos/arrendadores/{id}`                     | `views/Contratos/ContratoServicioWizard.vue`<br>`views/Servicios/OperacionView.vue`                                                             |     |
| `GET`    | `/arriendos/contratos/{id}/arrendadores`           | `views/Contratos/ContratoServicioWizard.vue`<br>`views/Servicios/OperacionView.vue`                                                             |     |
| `POST`   | `/arriendos/contratos/{id}/arrendadores`           | `views/Contratos/ContratoServicioWizard.vue`<br>`views/Servicios/OperacionView.vue`                                                             |     |
| `GET`    | `/arriendos/indexacion/{id}`                       | `views/Servicios/OperacionView.vue`                                                                                                             |     |
| `GET`    | `/asic`                                            | `views/Contratos/ContratoDetailView.vue`<br>`views/MEM/GesconView.vue`<br>`views/Servicios/PPAView.vue`                                         | ⇄   |
| `DELETE` | `/asic/{id}`                                       | `views/MEM/GesconView.vue`<br>`views/Servicios/PPAView.vue`                                                                                     | ⇄   |
| `GET`    | `/clientes`                                        | `views/Contratos/ContratoServicioWizard.vue`<br>`views/Contratos/PPAContratoWizard.vue`<br>`views/Proyectos/ProyectoDetailView.vue`<br>_+1 más_ | ⇄   |
| `POST`   | `/clientes`                                        | `components/NuevoClienteDialog.vue`<br>`views/Clientes/ClientesListView.vue`<br>`views/Servicios/ServiciosUnificadoView.vue`                    | ⇄   |
| `DELETE` | `/clientes/{id}`                                   | `views/Clientes/ClienteDetailView.vue`<br>`views/Servicios/ServiciosUnificadoView.vue`                                                          | ⇄   |
| `GET`    | `/clientes/vista-comercial`                        | `views/Clientes/ClientesListView.vue`<br>`views/Servicios/ServiciosUnificadoView.vue`                                                           | ⇄   |
| `GET`    | `/contratos-servicio`                              | `views/Comercial/OportunidadDetailView.vue`<br>`views/Contratos/ContratosListView.vue`<br>`views/Finanzas/CostosView.vue`<br>_+6 más_           | ⇄   |
| `POST`   | `/contratos-servicio`                              | `views/Contratos/ContratoServicioWizard.vue`<br>`views/Servicios/OperacionView.vue`<br>`views/Servicios/RepresentacionView.vue`                 |     |
| `DELETE` | `/contratos-servicio/{id}`                         | `views/Servicios/RepresentacionView.vue`<br>`views/Servicios/ServiciosUnificadoView.vue`                                                        |     |
| `GET`    | `/contratos-servicio/{id}`                         | `views/Finanzas/CostosView.vue`<br>`views/Servicios/FacturasMantenimiento.vue`                                                                  | ⇄   |
| `PATCH`  | `/contratos-servicio/{id}`                         | `views/Servicios/OperacionView.vue`<br>`views/Servicios/RepresentacionView.vue`<br>`views/Servicios/ServiciosUnificadoView.vue`                 |     |
| `PATCH`  | `/contratos-servicio/{id}/facturas-inversionistas` | `views/Servicios/FacturasMantenimiento.vue`                                                                                                     |     |
| `PATCH`  | `/contratos-servicio/{id}/facturas-solenium`       | `views/Servicios/FacturasMantenimiento.vue`                                                                                                     |     |
| `GET`    | `/contratos-servicio/{id}/pagos`                   | `views/Servicios/OperacionView.vue`                                                                                                             |     |
| `POST`   | `/contratos-servicio/{id}/pagos`                   | `views/Servicios/OperacionView.vue`                                                                                                             |     |
| `DELETE` | `/contratos-servicio/{id}/pagos/{id}`              | `views/Servicios/OperacionView.vue`                                                                                                             |     |
| `GET`    | `/contratos-servicio/duplicados-representacion`    | `views/Servicios/RepresentacionView.vue`<br>`views/Servicios/ServiciosUnificadoView.vue`                                                        |     |
| `POST`   | `/contratos-servicio/fusionar-representacion`      | `views/Servicios/RepresentacionView.vue`<br>`views/Servicios/ServiciosUnificadoView.vue`                                                        |     |
| `GET`    | `/cumplimiento/ppa/{id}/plantas-inscritas-por-mes` | `views/Contratos/ContratoDetailView.vue`                                                                                                        |     |
| `GET`    | `/om/indexacion/{id}`                              | `views/Servicios/OperacionView.vue`                                                                                                             |     |
| `GET`    | `/ppa`                                             | `views/Contratos/ContratosListView.vue`<br>`views/MEM/GesconView.vue`<br>`views/Servicios/PPAView.vue`<br>_+1 más_                              | ⇄   |
| `POST`   | `/ppa`                                             | `views/Contratos/PPAContratoWizard.vue`<br>`views/Servicios/PPAView.vue`                                                                        |     |
| `DELETE` | `/ppa/{id}`                                        | `views/Contratos/ContratosListView.vue`<br>`views/Servicios/PPAView.vue`<br>`views/Servicios/ServiciosUnificadoView.vue`                        |     |
| `GET`    | `/ppa/{id}`                                        | `views/Contratos/ContratoDetailView.vue`                                                                                                        |     |
| `PATCH`  | `/ppa/{id}`                                        | `views/Contratos/ContratoDetailView.vue`<br>`views/Contratos/PPAContratoWizard.vue`<br>`views/Servicios/PPAView.vue`                            |     |
| `PUT`    | `/ppa/{id}/compromisos`                            | `views/Contratos/ContratoDetailView.vue`<br>`views/Contratos/PPAContratoWizard.vue`                                                             |     |
| `POST`   | `/ppa/{id}/proyectos`                              | `views/Contratos/ContratoDetailView.vue`                                                                                                        |     |
| `PUT`    | `/ppa/{id}/tarifas`                                | `views/Contratos/ContratoDetailView.vue`<br>`views/Contratos/PPAContratoWizard.vue`                                                             |     |
| `GET`    | `/ppa/responsables`                                | `views/Contratos/PPAContratoWizard.vue`                                                                                                         |     |
| `GET`    | `/proyectos`                                       | `components/FasorialButton.vue`<br>`mobile/MobileCoordinadorFallasView.vue`<br>`mobile/MobileFallasView.vue`<br>_+21 más_                       | ⇄   |
| `POST`   | `/proyectos`                                       | `views/Proyectos/ProyectosListView.vue`<br>`views/Servicios/ServiciosUnificadoView.vue`                                                         | ⇄   |
| `DELETE` | `/proyectos/{id}`                                  | `composables/useEnergizationProjects.js`<br>`views/Proyectos/ProyectosListView.vue`<br>`views/Servicios/ServiciosUnificadoView.vue`             | ⇄   |
| `GET`    | `/proyectos/{id}`                                  | `views/Fallas/FallaForm.vue`<br>`views/Proyectos/ProyectoDetailView.vue`<br>`views/Servicios/OperacionView.vue`<br>_+2 más_                     | ⇄   |
| `PUT`    | `/proyectos/{id}/info-tecnica`                     | `views/Comercial/ProyectoDesdeCRMDialog.vue`<br>`views/Proyectos/ProyectoDetailView.vue`<br>`views/Proyectos/ProyectosListView.vue`<br>_+1 más_ | ⇄   |

## `fallas` — 27 endpoints

| Método   | Ruta                                        | Consumidores                                                                                                                                        |     |
| -------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| `GET`    | `/fallas`                                   | `mobile/MobileCoordinadorFallasView.vue`<br>`mobile/MobileFallasView.vue`<br>`mobile/MobileSolarView.vue`<br>_+8 más_                               | ⇄   |
| `POST`   | `/fallas`                                   | `mobile/components/FallaCreateSheet.vue`<br>`views/Fallas/FallasListView.vue`<br>`views/Fallas/MonitoreoView.vue`<br>_+2 más_                       | ⇄   |
| `DELETE` | `/fallas/{id}`                              | `views/Fallas/FallaDetailView.vue`<br>`views/Fallas/MonitoreoView.vue`<br>`views/Operaciones/GestionFallasView.vue`                                 | ⇄   |
| `GET`    | `/fallas/{id}`                              | `mobile/components/FallaDetailSheet.vue`<br>`mobile/components/TecnicoFallaDetailSheet.vue`<br>`views/Fallas/FallaDetailView.vue`<br>_+3 más_       | ⇄   |
| `PATCH`  | `/fallas/{id}`                              | `mobile/components/FallaDetailSheet.vue`<br>`mobile/components/TecnicoFallaDetailSheet.vue`<br>`views/Fallas/FallaDetailView.vue`<br>_+3 más_       | ⇄   |
| `GET`    | `/fallas/{id}/archivos`                     | `mobile/components/TecnicoFallaDetailSheet.vue`<br>`views/Fallas/FallaArchivos.vue`                                                                 | ⇄   |
| `POST`   | `/fallas/{id}/archivos`                     | `mobile/components/TecnicoFallaDetailSheet.vue`<br>`views/Fallas/FallaArchivos.vue`<br>`views/Fallas/MonitoreoView.vue`<br>_+1 más_                 | ⇄   |
| `DELETE` | `/fallas/{id}/archivos/{id}`                | `mobile/components/TecnicoFallaDetailSheet.vue`<br>`views/Fallas/FallaArchivos.vue`                                                                 | ⇄   |
| `POST`   | `/fallas/{id}/attachments`                  | `views/Fallas/FallaDetailView.vue`                                                                                                                  |     |
| `POST`   | `/fallas/{id}/fotos`                        | `views/Fallas/FallaDetalle.vue`                                                                                                                     |     |
| `DELETE` | `/fallas/{id}/fotos/{id}`                   | `views/Fallas/FallaDetalle.vue`                                                                                                                     |     |
| `POST`   | `/fallas/{id}/notificar`                    | `views/Fallas/MonitoreoView.vue`                                                                                                                    |     |
| `POST`   | `/fallas/{id}/seguimientos`                 | `mobile/components/FallaCreateSheet.vue`<br>`mobile/components/FallaDetailSheet.vue`<br>`mobile/components/TecnicoFallaDetailSheet.vue`<br>_+6 más_ | ⇄   |
| `GET`    | `/fallas/catalogos`                         | `mobile/MobileCoordinadorFallasView.vue`<br>`mobile/MobileFallasView.vue`<br>`mobile/MobileResumenView.vue`<br>_+8 más_                             | ⇄   |
| `GET`    | `/fallas/estructura`                        | `mobile/components/FallaCreateSheet.vue`<br>`utils/fallasEstructuraCache.js`                                                                        | ⇄   |
| `GET`    | `/generacion-solar/generacion-hoy`          | `views/Fallas/MonitoreoView.vue`<br>`views/GeneracionSolarView.vue`<br>`views/Solar/SolarLiveView.vue`                                              | ⇄   |
| `GET`    | `/generacion-solar/proyecto/{id}/historial` | `views/Fallas/MonitoreoView.vue`                                                                                                                    |     |
| `GET`    | `/mapa`                                     | `views/Fallas/FallasMapView.vue`                                                                                                                    |     |
| `GET`    | `/mapa/operadores`                          | `views/Fallas/FallasMapView.vue`                                                                                                                    |     |
| `GET`    | `/monitoreo/resumen-generacion`             | `views/Fallas/MonitoreoView.vue`                                                                                                                    |     |
| `GET`    | `/proyectos`                                | `components/FasorialButton.vue`<br>`mobile/MobileCoordinadorFallasView.vue`<br>`mobile/MobileFallasView.vue`<br>_+21 más_                           | ⇄   |
| `GET`    | `/proyectos/{id}`                           | `views/Fallas/FallaForm.vue`<br>`views/Proyectos/ProyectoDetailView.vue`<br>`views/Servicios/OperacionView.vue`<br>_+2 más_                         | ⇄   |
| `GET`    | `/proyectos/{id}/inversores`                | `mobile/components/FallaCreateSheet.vue`<br>`views/Fallas/FallaForm.vue`                                                                            | ⇄   |
| `POST`   | `/proyectos/{id}/inversores`                | `mobile/components/FallaCreateSheet.vue`<br>`views/Fallas/FallaForm.vue`                                                                            | ⇄   |
| `DELETE` | `/proyectos/{id}/inversores/{id}`           | `views/Fallas/FallaForm.vue`                                                                                                                        |     |
| `PATCH`  | `/proyectos/{id}/inversores/{id}`           | `views/Fallas/FallaForm.vue`                                                                                                                        |     |
| `GET`    | `/usuarios`                                 | `mobile/MobileCoordinadorFallasView.vue`<br>`mobile/MobileFallasView.vue`<br>`mobile/MobileResumenView.vue`<br>_+4 más_                             | ⇄   |

## `finanzas` — 45 endpoints

| Método  | Ruta                                          | Consumidores                                                                                                                                 |     |
| ------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| `GET`   | `/arriendos/calculo/{id}`                     | `views/Finanzas/ArriendosInfo.vue`<br>`views/Finanzas/ArriendosOperaciones.vue`<br>`views/Finanzas/ArriendosProveedor.vue`<br>_+1 más_       |     |
| `GET`   | `/arriendos/ipc`                              | `views/Finanzas/ArriendosOperaciones.vue`                                                                                                    |     |
| `PUT`   | `/arriendos/ipc/{id}`                         | `views/Finanzas/ArriendosOperaciones.vue`                                                                                                    |     |
| `POST`  | `/arriendos/seleccion/{id}`                   | `views/Finanzas/ArriendosOperaciones.vue`                                                                                                    |     |
| `PATCH` | `/arriendos/seleccion/{id}/{id}/facturado`    | `views/Finanzas/ArriendosOperaciones.vue`<br>`views/Finanzas/ArriendosProveedor.vue`                                                         |     |
| `GET`   | `/contratos-servicio`                         | `views/Comercial/OportunidadDetailView.vue`<br>`views/Contratos/ContratosListView.vue`<br>`views/Finanzas/CostosView.vue`<br>_+6 más_        | ⇄   |
| `GET`   | `/contratos-servicio/{id}`                    | `views/Finanzas/CostosView.vue`<br>`views/Servicios/FacturasMantenimiento.vue`                                                               | ⇄   |
| `PATCH` | `/contratos-servicio/{id}/{id}`               | `views/Finanzas/CostosView.vue`                                                                                                              |     |
| `POST`  | `/descargas`                                  | `api/xm.js`                                                                                                                                  |     |
| `GET`   | `/descargas/{id}`                             | `api/xm.js`                                                                                                                                  |     |
| `GET`   | `/estados-resultados/archivos`                | `views/Finanzas/EstadosResultadosView.vue`                                                                                                   |     |
| `GET`   | `/estados-resultados/archivos-zip`            | `views/Finanzas/EstadosResultadosView.vue`                                                                                                   |     |
| `GET`   | `/estados-resultados/archivos/{id}/descargar` | `views/Finanzas/EstadosResultadosView.vue`                                                                                                   |     |
| `GET`   | `/finanzas/mandatos`                          | `views/Finanzas/MandatosFinanzas.vue`                                                                                                        |     |
| `GET`   | `/finanzas/mandatos/resumen`                  | `views/Finanzas/MandatosFinanzas.vue`                                                                                                        |     |
| `GET`   | `/liquidaciones-api/ac-power`                 | `views/Finanzas/VerificacionCostosView.vue`                                                                                                  |     |
| `GET`   | `/liquidaciones-api/proyectos`                | `views/Finanzas/ConsumoView.vue`<br>`views/Finanzas/ContratosEnergiaView.vue`<br>`views/Finanzas/CostosComercializacionView.vue`<br>_+2 más_ |     |
| `PATCH` | `/liquidaciones-api/proyectos/{id}`           | `views/Finanzas/IdsProyectosView.vue`<br>`views/Finanzas/VerificacionCostosView.vue`<br>`views/Proyectos/ProyectoDetailView.vue`             | ⇄   |
| `GET`   | `/mandato-inversionistas`                     | `views/Finanzas/MandatosOperaciones.vue`                                                                                                     |     |
| `GET`   | `/mandatos`                                   | `views/Finanzas/MandatosOperaciones.vue`                                                                                                     |     |
| `PATCH` | `/mandatos/{id}`                              | `views/Finanzas/MandatosOperaciones.vue`                                                                                                     |     |
| `GET`   | `/mandatos/{id}/pdf`                          | `views/Finanzas/MandatosOperaciones.vue`                                                                                                     |     |
| `GET`   | `/mandatos/periodos`                          | `views/Finanzas/MandatosOperaciones.vue`                                                                                                     |     |
| `GET`   | `/mandatos/resumen`                           | `views/Finanzas/MandatosOperaciones.vue`                                                                                                     |     |
| `POST`  | `/mandatos/upload-firmado`                    | `views/Finanzas/MandatosOperaciones.vue`                                                                                                     |     |
| `POST`  | `/mandatos/upload-zip`                        | `views/Finanzas/MandatosOperaciones.vue`                                                                                                     |     |
| `GET`   | `/om/calculo/{id}`                            | `views/Finanzas/OMAOperaciones.vue`<br>`views/Finanzas/OMAProveedor.vue`<br>`views/Finanzas/costosExcelExport.js`                            |     |
| `GET`   | `/om/documento/{id}/{id}`                     | `views/Finanzas/OMAOperaciones.vue`                                                                                                          |     |
| `GET`   | `/om/factura/{id}`                            | `views/Finanzas/OMAOperaciones.vue`<br>`views/Finanzas/OMAProveedor.vue`                                                                     |     |
| `PUT`   | `/om/factura/{id}/enlace`                     | `views/Finanzas/OMAProveedor.vue`                                                                                                            |     |
| `GET`   | `/om/factura/{id}/file`                       | `views/Finanzas/OMAOperaciones.vue`<br>`views/Finanzas/OMAProveedor.vue`                                                                     |     |
| `PATCH` | `/om/factura/{id}/sin-match/{id}/asignar`     | `views/Finanzas/OMAProveedor.vue`                                                                                                            |     |
| `POST`  | `/om/factura/{id}/upload`                     | `views/Finanzas/OMAProveedor.vue`                                                                                                            |     |
| `GET`   | `/om/ipc`                                     | `views/Finanzas/OMAOperaciones.vue`                                                                                                          |     |
| `PUT`   | `/om/ipc/{id}`                                | `views/Finanzas/OMAOperaciones.vue`                                                                                                          |     |
| `GET`   | `/om/proyectos`                               | `views/Finanzas/OMAProveedor.vue`                                                                                                            |     |
| `POST`  | `/om/seleccion/{id}`                          | `views/Finanzas/OMAOperaciones.vue`                                                                                                          |     |
| `PATCH` | `/om/seleccion/{id}/{id}/facturado`           | `views/Finanzas/OMAOperaciones.vue`<br>`views/Finanzas/OMAProveedor.vue`                                                                     |     |
| `GET`   | `/proyectos`                                  | `components/FasorialButton.vue`<br>`mobile/MobileCoordinadorFallasView.vue`<br>`mobile/MobileFallasView.vue`<br>_+21 más_                    | ⇄   |
| `POST`  | `/starlink/excel`                             | `views/Finanzas/StarlinkPDF.vue`                                                                                                             |     |
| `GET`   | `/starlink/factura/{id}`                      | `views/Finanzas/CostosView.vue`<br>`views/Finanzas/StarlinkPDF.vue`<br>`views/Finanzas/costosExcelExport.js`                                 |     |
| `PUT`   | `/starlink/factura/{id}`                      | `views/Finanzas/StarlinkPDF.vue`                                                                                                             |     |
| `PUT`   | `/starlink/mapeo`                             | `views/Finanzas/StarlinkPDF.vue`                                                                                                             |     |
| `GET`   | `/starlink/periodos`                          | `views/Finanzas/StarlinkPDF.vue`                                                                                                             |     |
| `POST`  | `/starlink/procesar-pdf`                      | `views/Finanzas/StarlinkPDF.vue`                                                                                                             |     |

## `fronteras` — 33 endpoints

| Método   | Ruta                                                    | Consumidores                                                                                                              |     |
| -------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --- |
| `GET`    | `/fallas`                                               | `mobile/MobileCoordinadorFallasView.vue`<br>`mobile/MobileFallasView.vue`<br>`mobile/MobileSolarView.vue`<br>_+8 más_     | ⇄   |
| `GET`    | `/fronteras`                                            | `mobile/MobileReporteCGMView.vue`<br>`views/MEM/FronterasView.vue`<br>`views/MEM/HistorialEnviosCGM.vue`<br>_+2 más_      | ⇄   |
| `POST`   | `/fronteras`                                            | `views/MEM/FronterasView.vue`                                                                                             |     |
| `DELETE` | `/fronteras/{id}`                                       | `views/MEM/FronterasView.vue`                                                                                             |     |
| `PATCH`  | `/fronteras/{id}`                                       | `views/MEM/FronterasView.vue`                                                                                             |     |
| `GET`    | `/fronteras/quoia/pendientes`                           | `views/MEM/FronterasView.vue`                                                                                             |     |
| `POST`   | `/fronteras/quoia/pendientes/{id}/confirmar`            | `views/MEM/FronterasView.vue`                                                                                             |     |
| `POST`   | `/fronteras/quoia/pendientes/{id}/ignorar`              | `views/MEM/FronterasView.vue`                                                                                             |     |
| `GET`    | `/operadores-red`                                       | `views/Comercial/OfertaDrawer.vue`<br>`views/MEM/FronterasView.vue`<br>`views/MEM/OperadoresRedView.vue`<br>_+2 más_      | ⇄   |
| `GET`    | `/proyectos`                                            | `components/FasorialButton.vue`<br>`mobile/MobileCoordinadorFallasView.vue`<br>`mobile/MobileFallasView.vue`<br>_+21 más_ | ⇄   |
| `POST`   | `/reporte-energia/ejecutar`                             | `views/MEM/ReporteEnergiaAutomatizacionView.vue`                                                                          |     |
| `POST`   | `/reporte-energia/ejecutar/cancelar`                    | `views/MEM/ReporteEnergiaAutomatizacionView.vue`                                                                          |     |
| `GET`    | `/reporte-energia/ejecutar/estado`                      | `views/MEM/ReporteEnergiaAutomatizacionView.vue`                                                                          |     |
| `POST`   | `/reporte-energia/enviar`                               | `views/MEM/ReporteEnergiaAutomatizacionView.vue`                                                                          |     |
| `GET`    | `/reporte-energia/estado-quoia`                         | `views/MEM/ReporteEnergiaAutomatizacionView.vue`                                                                          |     |
| `POST`   | `/reporte-energia/estado-quoia`                         | `views/MEM/ReporteEnergiaAutomatizacionView.vue`                                                                          |     |
| `GET`    | `/reporte-energia/excel`                                | `views/MEM/ReporteEnergiaAutomatizacionView.vue`                                                                          |     |
| `PATCH`  | `/reporte-energia/exclusiones/{id}`                     | `views/MEM/ReporteEnergiaDetalleTab.vue`                                                                                  |     |
| `POST`   | `/reporte-energia/exclusiones/{id}/resolver`            | `views/MEM/ReporteEnergiaDetalleTab.vue`                                                                                  |     |
| `GET`    | `/reporte-energia/fronteras`                            | `views/MEM/ReporteEnergiaAutomatizacionView.vue`                                                                          |     |
| `GET`    | `/reporte-energia/fronteras/{id}`                       | `views/MEM/ReporteEnergiaDetalleTab.vue`                                                                                  |     |
| `PATCH`  | `/reporte-energia/fronteras/{id}`                       | `views/MEM/ReporteEnergiaDetalleTab.vue`                                                                                  |     |
| `DELETE` | `/reporte-energia/fronteras/{id}/cargar-excel-terceros` | `views/MEM/ReporteEnergiaDetalleTab.vue`                                                                                  |     |
| `POST`   | `/reporte-energia/fronteras/{id}/cargar-excel-terceros` | `views/MEM/ReporteEnergiaDetalleTab.vue`                                                                                  |     |
| `GET`    | `/reporte-energia/fronteras/{id}/curva-tipica`          | `views/MEM/ReporteEnergiaDetalleTab.vue`                                                                                  |     |
| `POST`   | `/reporte-energia/fronteras/{id}/deshacer-relleno`      | `views/MEM/ReporteEnergiaDetalleTab.vue`                                                                                  |     |
| `GET`    | `/reporte-energia/fronteras/{id}/exclusiones`           | `views/MEM/ReporteEnergiaDetalleTab.vue`                                                                                  |     |
| `POST`   | `/reporte-energia/fronteras/{id}/exclusiones`           | `views/MEM/ReporteEnergiaDetalleTab.vue`                                                                                  |     |
| `POST`   | `/reporte-energia/fronteras/{id}/recuperar-medidor`     | `views/MEM/ReporteEnergiaDetalleTab.vue`                                                                                  |     |
| `POST`   | `/reporte-energia/fronteras/{id}/rellenar-horario`      | `views/MEM/ReporteEnergiaDetalleTab.vue`                                                                                  |     |
| `POST`   | `/reporte-energia/fronteras/{id}/validar`               | `views/MEM/ReporteEnergiaDetalleTab.vue`                                                                                  |     |
| `GET`    | `/reporte-energia/resumen`                              | `views/MEM/ReporteEnergiaAutomatizacionView.vue`                                                                          |     |
| `GET`    | `/reporte-energia/resumen-historico`                    | `views/MEM/ReporteEnergiaAutomatizacionView.vue`                                                                          |     |

## `garantias` — 4 endpoints

| Método   | Ruta                      | Consumidores                                                     |     |
| -------- | ------------------------- | ---------------------------------------------------------------- | --- |
| `GET`    | `/garantias-ajustes`      | `views/Garantias/AjustesXM/composables/useGarantiasHistorial.js` |     |
| `POST`   | `/garantias-ajustes`      | `views/Garantias/AjustesXM/composables/useGarantiasHistorial.js` |     |
| `DELETE` | `/garantias-ajustes/{id}` | `views/Garantias/AjustesXM/composables/useGarantiasHistorial.js` |     |
| `PATCH`  | `/garantias-ajustes/{id}` | `views/Garantias/AjustesXM/composables/useGarantiasHistorial.js` |     |

## `general` — 2 endpoints

| Método | Ruta                        | Consumidores                                                 |     |
| ------ | --------------------------- | ------------------------------------------------------------ | --- |
| `GET`  | `/cumplimiento/ppa/resumen` | `views/DashboardView.vue`                                    |     |
| `GET`  | `/dashboard/kpis`           | `views/Alertas/AlertasView.vue`<br>`views/DashboardView.vue` | ⇄   |

## `liquidaciones` — 37 endpoints

| Método   | Ruta                                   | Consumidores                                                                                                                                                                            |     |
| -------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| `GET`    | `/contratos-servicio`                  | `views/Comercial/OportunidadDetailView.vue`<br>`views/Contratos/ContratosListView.vue`<br>`views/Finanzas/CostosView.vue`<br>_+6 más_                                                   | ⇄   |
| `GET`    | `/facturacion`                         | `views/Liquidaciones/panels/FacturacionPanel.vue`                                                                                                                                       |     |
| `PUT`    | `/facturacion/agrupaciones`            | `views/Liquidaciones/panels/FacturacionPanel.vue`                                                                                                                                       |     |
| `GET`    | `/facturacion/bolsa`                   | `views/Liquidaciones/panels/FacturacionPanel.vue`                                                                                                                                       |     |
| `PUT`    | `/facturacion/bolsa`                   | `views/Liquidaciones/panels/FacturacionPanel.vue`                                                                                                                                       |     |
| `GET`    | `/facturacion/cumplimiento`            | `views/Liquidaciones/panels/FacturacionPanel.vue`                                                                                                                                       |     |
| `GET`    | `/facturacion/despacho`                | `views/Liquidaciones/panels/FacturacionPanel.vue`                                                                                                                                       |     |
| `POST`   | `/facturacion/despacho`                | `views/Liquidaciones/panels/FacturacionPanel.vue`                                                                                                                                       |     |
| `GET`    | `/facturacion/despacho/dias`           | `views/Liquidaciones/panels/FacturacionPanel.vue`                                                                                                                                       |     |
| `PUT`    | `/facturacion/emitida`                 | `views/Liquidaciones/panels/FacturacionPanel.vue`                                                                                                                                       |     |
| `DELETE` | `/facturacion/orden`                   | `views/Liquidaciones/panels/FacturacionPanel.vue`                                                                                                                                       |     |
| `PUT`    | `/facturacion/orden`                   | `views/Liquidaciones/panels/FacturacionPanel.vue`                                                                                                                                       |     |
| `POST`   | `/liquidaciones`                       | `views/Liquidaciones/LiquidacionesListView.vue`                                                                                                                                         |     |
| `GET`    | `/liquidaciones-api/catalogos`         | `api/liquidacionesApi.js`                                                                                                                                                               |     |
| `POST`   | `/liquidaciones-api/ciclo/{id}`        | `api/liquidacionesApi.js`                                                                                                                                                               |     |
| `POST`   | `/liquidaciones-api/ciclo/diagnostico` | `api/liquidacionesApi.js`                                                                                                                                                               |     |
| `POST`   | `/liquidaciones-api/ciclo/ipp`         | `api/liquidacionesApi.js`                                                                                                                                                               |     |
| `GET`    | `/liquidaciones-api/contratos-energia` | `api/liquidacionesApi.js`                                                                                                                                                               |     |
| `POST`   | `/liquidaciones-api/contratos-energia` | `api/liquidacionesApi.js`                                                                                                                                                               |     |
| `GET`    | `/liquidaciones-api/costos`            | `api/liquidacionesApi.js`                                                                                                                                                               |     |
| `POST`   | `/liquidaciones-api/costos/excel`      | `api/liquidacionesApi.js`                                                                                                                                                               |     |
| `GET`    | `/liquidaciones-api/despachos`         | `api/liquidacionesApi.js`                                                                                                                                                               |     |
| `GET`    | `/liquidaciones-api/facturas-xm`       | `api/liquidacionesApi.js`                                                                                                                                                               |     |
| `POST`   | `/liquidaciones-api/facturas-xm`       | `api/liquidacionesApi.js`                                                                                                                                                               |     |
| `GET`    | `/liquidaciones-api/tareas/{id}`       | `api/liquidacionesApi.js`                                                                                                                                                               |     |
| `GET`    | `/liquidaciones/{id}`                  | `views/Liquidaciones/LiquidacionDetailView.vue`<br>`views/Liquidaciones/LiquidacionPdfView.vue`                                                                                         |     |
| `PATCH`  | `/liquidaciones/{id}`                  | `views/Liquidaciones/LiquidacionDetailView.vue`                                                                                                                                         |     |
| `GET`    | `/liquidaciones/{id}/informe`          | `views/Liquidaciones/LiquidacionPdfView.vue`                                                                                                                                            |     |
| `PUT`    | `/liquidaciones/{id}/informe`          | `views/Liquidaciones/LiquidacionPdfView.vue`                                                                                                                                            |     |
| `GET`    | `/liquidaciones/resumen-panel`         | `views/Liquidaciones/LiquidacionDetailView.vue`<br>`views/Liquidaciones/LiquidacionPdfView.vue`<br>`views/Liquidaciones/LiquidacionesListView.vue`<br>_+2 más_                          |     |
| `GET`    | `/liquidaciones/resumen-panel-rango`   | `views/Liquidaciones/LiquidacionPdfView.vue`<br>`views/Liquidaciones/LiquidacionesPorInversionistaView.vue`<br>`views/Liquidaciones/components/IngresoCostoComparativo.vue`<br>_+1 más_ |     |
| `GET`    | `/monitoreo/_legacy`                   | `views/Liquidaciones/LiquidacionPdfView.vue`<br>`views/Liquidaciones/components/GeneracionMensualChart.vue`<br>`views/Liquidaciones/components/IngresoCostoComparativo.vue`<br>_+3 más_ | ⇄   |
| `GET`    | `/panel-contable/diferencia`           | `views/Liquidaciones/panels/DiferenciaPanel.vue`<br>`views/PanelContable/PanelContableView.vue`                                                                                         | ⇄   |
| `GET`    | `/ppa/ipp/mensual`                     | `views/Liquidaciones/panels/FacturacionPanel.vue`                                                                                                                                       |     |
| `PUT`    | `/ppa/ipp/mensual`                     | `views/Liquidaciones/panels/FacturacionPanel.vue`                                                                                                                                       |     |
| `GET`    | `/proyectos`                           | `components/FasorialButton.vue`<br>`mobile/MobileCoordinadorFallasView.vue`<br>`mobile/MobileFallasView.vue`<br>_+21 más_                                                               | ⇄   |
| `GET`    | `/proyectos/{id}/inversionistas`       | `views/Liquidaciones/LiquidacionDetailView.vue`<br>`views/Liquidaciones/LiquidacionPdfView.vue`<br>`views/Proyectos/ProyectoDetailView.vue`                                             | ⇄   |

## `mem` — 17 endpoints

| Método   | Ruta                            | Consumidores                                                                                                              |     |
| -------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --- |
| `GET`    | `/asic`                         | `views/Contratos/ContratoDetailView.vue`<br>`views/MEM/GesconView.vue`<br>`views/Servicios/PPAView.vue`                   | ⇄   |
| `POST`   | `/asic`                         | `views/MEM/GesconView.vue`                                                                                                |     |
| `DELETE` | `/asic/{id}`                    | `views/MEM/GesconView.vue`<br>`views/Servicios/PPAView.vue`                                                               | ⇄   |
| `PATCH`  | `/asic/{id}`                    | `views/MEM/GesconView.vue`                                                                                                |     |
| `POST`   | `/asic/backfill-nombre-interno` | `views/MEM/GesconView.vue`                                                                                                |     |
| `POST`   | `/asic/backfill-terminaciones`  | `views/MEM/GesconView.vue`                                                                                                |     |
| `POST`   | `/asic/modificacion`            | `views/MEM/GesconModificacionForm.vue`                                                                                    |     |
| `POST`   | `/asic/terminacion`             | `views/MEM/GesconTerminacionForm.vue`                                                                                     |     |
| `GET`    | `/evo/clima/forecast`           | `views/MEM/PrecioBolsaView.vue`                                                                                           |     |
| `GET`    | `/evo/clima/history`            | `views/MEM/BalanceView.vue`                                                                                               |     |
| `GET`    | `/evo/clima/oni`                | `views/MEM/ClimaView.vue`<br>`views/MEM/PrecioBolsaView.vue`                                                              |     |
| `GET`    | `/evo/clima/precip`             | `views/MEM/ClimaView.vue`                                                                                                 |     |
| `GET`    | `/evo/clima/prices`             | `views/MEM/ClimaView.vue`<br>`views/MEM/PrecioBolsaView.vue`                                                              |     |
| `GET`    | `/evo/dailyspot/history`        | `views/MEM/BalanceView.vue`                                                                                               |     |
| `GET`    | `/evo/dailyspot/latest`         | `views/MEM/PrecioBolsaView.vue`                                                                                           |     |
| `GET`    | `/ppa`                          | `views/Contratos/ContratosListView.vue`<br>`views/MEM/GesconView.vue`<br>`views/Servicios/PPAView.vue`<br>_+1 más_        | ⇄   |
| `GET`    | `/proyectos`                    | `components/FasorialButton.vue`<br>`mobile/MobileCoordinadorFallasView.vue`<br>`mobile/MobileFallasView.vue`<br>_+21 más_ | ⇄   |

## `mobile` — 27 endpoints

| Método   | Ruta                                                | Consumidores                                                                                                                                        |     |
| -------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| `GET`    | `/fallas`                                           | `mobile/MobileCoordinadorFallasView.vue`<br>`mobile/MobileFallasView.vue`<br>`mobile/MobileSolarView.vue`<br>_+8 más_                               | ⇄   |
| `POST`   | `/fallas`                                           | `mobile/components/FallaCreateSheet.vue`<br>`views/Fallas/FallasListView.vue`<br>`views/Fallas/MonitoreoView.vue`<br>_+2 más_                       | ⇄   |
| `GET`    | `/fallas/{id}`                                      | `mobile/components/FallaDetailSheet.vue`<br>`mobile/components/TecnicoFallaDetailSheet.vue`<br>`views/Fallas/FallaDetailView.vue`<br>_+3 más_       | ⇄   |
| `PATCH`  | `/fallas/{id}`                                      | `mobile/components/FallaDetailSheet.vue`<br>`mobile/components/TecnicoFallaDetailSheet.vue`<br>`views/Fallas/FallaDetailView.vue`<br>_+3 más_       | ⇄   |
| `GET`    | `/fallas/{id}/archivos`                             | `mobile/components/TecnicoFallaDetailSheet.vue`<br>`views/Fallas/FallaArchivos.vue`                                                                 | ⇄   |
| `POST`   | `/fallas/{id}/archivos`                             | `mobile/components/TecnicoFallaDetailSheet.vue`<br>`views/Fallas/FallaArchivos.vue`<br>`views/Fallas/MonitoreoView.vue`<br>_+1 más_                 | ⇄   |
| `DELETE` | `/fallas/{id}/archivos/{id}`                        | `mobile/components/TecnicoFallaDetailSheet.vue`<br>`views/Fallas/FallaArchivos.vue`                                                                 | ⇄   |
| `POST`   | `/fallas/{id}/seguimientos`                         | `mobile/components/FallaCreateSheet.vue`<br>`mobile/components/FallaDetailSheet.vue`<br>`mobile/components/TecnicoFallaDetailSheet.vue`<br>_+6 más_ | ⇄   |
| `GET`    | `/fallas/actividad-hoy`                             | `mobile/MobileResumenView.vue`                                                                                                                      |     |
| `GET`    | `/fallas/catalogos`                                 | `mobile/MobileCoordinadorFallasView.vue`<br>`mobile/MobileFallasView.vue`<br>`mobile/MobileResumenView.vue`<br>_+8 más_                             | ⇄   |
| `GET`    | `/fallas/estructura`                                | `mobile/components/FallaCreateSheet.vue`<br>`utils/fallasEstructuraCache.js`                                                                        | ⇄   |
| `GET`    | `/fronteras`                                        | `mobile/MobileReporteCGMView.vue`<br>`views/MEM/FronterasView.vue`<br>`views/MEM/HistorialEnviosCGM.vue`<br>_+2 más_                                | ⇄   |
| `GET`    | `/generacion-solar/monitoring`                      | `components/FasorialButton.vue`<br>`mobile/MobileSolarView.vue`<br>`views/GeneracionSolarView.vue`<br>_+1 más_                                      | ⇄   |
| `GET`    | `/generacion-solar/monitoring/{id}`                 | `components/FasorialButton.vue`<br>`mobile/MobileSolarView.vue`<br>`views/GeneracionSolarView.vue`<br>_+1 más_                                      | ⇄   |
| `GET`    | `/generacion-solar/monitoring/{id}/inverters-power` | `mobile/components/InvertersSheet.vue`<br>`views/GeneracionSolarView.vue`                                                                           | ⇄   |
| `GET`    | `/generacion-solar/resumen-dia`                     | `mobile/MobileResumenView.vue`                                                                                                                      |     |
| `GET`    | `/notificaciones`                                   | `components/AppSidebar.vue`<br>`components/AppTopbar.vue`<br>`mobile/components/NotificationsSheet.vue`                                             | ⇄   |
| `PATCH`  | `/notificaciones/{id}/leer`                         | `components/AppSidebar.vue`<br>`components/AppTopbar.vue`<br>`mobile/components/NotificationsSheet.vue`                                             | ⇄   |
| `GET`    | `/notificaciones/count`                             | `components/AppSidebar.vue`<br>`components/AppTopbar.vue`<br>`mobile/MobileCoordinadorFallasView.vue`<br>_+3 más_                                   | ⇄   |
| `PATCH`  | `/notificaciones/leer-todas`                        | `mobile/components/NotificationsSheet.vue`                                                                                                          |     |
| `GET`    | `/proyectos`                                        | `components/FasorialButton.vue`<br>`mobile/MobileCoordinadorFallasView.vue`<br>`mobile/MobileFallasView.vue`<br>_+21 más_                           | ⇄   |
| `GET`    | `/proyectos/{id}/inversores`                        | `mobile/components/FallaCreateSheet.vue`<br>`views/Fallas/FallaForm.vue`                                                                            | ⇄   |
| `POST`   | `/proyectos/{id}/inversores`                        | `mobile/components/FallaCreateSheet.vue`<br>`views/Fallas/FallaForm.vue`                                                                            | ⇄   |
| `POST`   | `/reconectadores/{id}/comando`                      | `mobile/components/ReconnectSheet.vue`                                                                                                              |     |
| `GET`    | `/reconectadores/estados`                           | `mobile/MobileSolarView.vue`                                                                                                                        |     |
| `POST`   | `/reporte-cgm/enviar`                               | `mobile/MobileReporteCGMView.vue`<br>`views/MEM/ReporteCGMView.vue`                                                                                 | ⇄   |
| `GET`    | `/usuarios`                                         | `mobile/MobileCoordinadorFallasView.vue`<br>`mobile/MobileFallasView.vue`<br>`mobile/MobileResumenView.vue`<br>_+4 más_                             | ⇄   |

## `notificaciones` — 4 endpoints

| Método  | Ruta                         | Consumidores                                                                                                      |     |
| ------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------- | --- |
| `GET`   | `/notificaciones`            | `components/AppSidebar.vue`<br>`components/AppTopbar.vue`<br>`mobile/components/NotificationsSheet.vue`           | ⇄   |
| `PATCH` | `/notificaciones/{id}/leer`  | `components/AppSidebar.vue`<br>`components/AppTopbar.vue`<br>`mobile/components/NotificationsSheet.vue`           | ⇄   |
| `GET`   | `/notificaciones/count`      | `components/AppSidebar.vue`<br>`components/AppTopbar.vue`<br>`mobile/MobileCoordinadorFallasView.vue`<br>_+3 más_ | ⇄   |
| `POST`  | `/notificaciones/leer-todas` | `components/AppSidebar.vue`<br>`components/AppTopbar.vue`                                                         | ⇄   |

## `operaciones` — 31 endpoints

| Método   | Ruta                                       | Consumidores                                                                                                                                                                            |     |
| -------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| `GET`    | `/fallas`                                  | `mobile/MobileCoordinadorFallasView.vue`<br>`mobile/MobileFallasView.vue`<br>`mobile/MobileSolarView.vue`<br>_+8 más_                                                                   | ⇄   |
| `POST`   | `/fallas`                                  | `mobile/components/FallaCreateSheet.vue`<br>`views/Fallas/FallasListView.vue`<br>`views/Fallas/MonitoreoView.vue`<br>_+2 más_                                                           | ⇄   |
| `DELETE` | `/fallas/{id}`                             | `views/Fallas/FallaDetailView.vue`<br>`views/Fallas/MonitoreoView.vue`<br>`views/Operaciones/GestionFallasView.vue`                                                                     | ⇄   |
| `GET`    | `/fallas/{id}`                             | `mobile/components/FallaDetailSheet.vue`<br>`mobile/components/TecnicoFallaDetailSheet.vue`<br>`views/Fallas/FallaDetailView.vue`<br>_+3 más_                                           | ⇄   |
| `PATCH`  | `/fallas/{id}`                             | `mobile/components/FallaDetailSheet.vue`<br>`mobile/components/TecnicoFallaDetailSheet.vue`<br>`views/Fallas/FallaDetailView.vue`<br>_+3 más_                                           | ⇄   |
| `POST`   | `/fallas/{id}/seguimientos`                | `mobile/components/FallaCreateSheet.vue`<br>`mobile/components/FallaDetailSheet.vue`<br>`mobile/components/TecnicoFallaDetailSheet.vue`<br>_+6 más_                                     | ⇄   |
| `GET`    | `/fallas/catalogos`                        | `mobile/MobileCoordinadorFallasView.vue`<br>`mobile/MobileFallasView.vue`<br>`mobile/MobileResumenView.vue`<br>_+8 más_                                                                 | ⇄   |
| `GET`    | `/informe-om/{id}`                         | `views/Operaciones/InformeOMView.vue`                                                                                                                                                   |     |
| `PUT`    | `/informe-om/{id}`                         | `views/Operaciones/InformeOMView.vue`                                                                                                                                                   |     |
| `GET`    | `/informe-om/proyectos`                    | `views/Operaciones/InformeOMView.vue`                                                                                                                                                   |     |
| `GET`    | `/informes`                                | `views/Operaciones/EnvioMensualPanel.vue`<br>`views/Operaciones/InformesListView.vue`<br>`views/Operaciones/InformesMensualesPanel.vue`<br>_+1 más_                                     |     |
| `POST`   | `/informes`                                | `views/Operaciones/EnvioMensualPanel.vue`<br>`views/Operaciones/InformeDetailView.vue`<br>`views/Operaciones/InformeOMView.vue`<br>_+1 más_                                             |     |
| `DELETE` | `/informes/{id}`                           | `views/Operaciones/EnvioMensualPanel.vue`<br>`views/Operaciones/InformesListView.vue`                                                                                                   |     |
| `GET`    | `/informes/{id}`                           | `views/Operaciones/EnvioMensualPanel.vue`<br>`views/Operaciones/InformeDetailView.vue`                                                                                                  |     |
| `POST`   | `/informes/{id}/comentarios`               | `views/Operaciones/EnvioMensualPanel.vue`                                                                                                                                               |     |
| `DELETE` | `/informes/{id}/comentarios/{id}`          | `views/Operaciones/EnvioMensualPanel.vue`                                                                                                                                               |     |
| `PATCH`  | `/informes/{id}/comentarios/{id}/resolver` | `views/Operaciones/EnvioMensualPanel.vue`                                                                                                                                               |     |
| `GET`    | `/informes/{id}/compuesto`                 | `views/Operaciones/EnvioMensualPanel.vue`                                                                                                                                               |     |
| `POST`   | `/informes/{id}/enviar`                    | `views/Operaciones/EnvioMensualPanel.vue`<br>`views/Operaciones/InformeDetailView.vue`                                                                                                  |     |
| `PATCH`  | `/informes/{id}/estado`                    | `views/Operaciones/EnvioMensualPanel.vue`<br>`views/Operaciones/InformeDetailView.vue`                                                                                                  |     |
| `PATCH`  | `/informes/{id}/seccion`                   | `views/Operaciones/EnvioMensualPanel.vue`                                                                                                                                               |     |
| `GET`    | `/monitoreo/_legacy`                       | `views/Liquidaciones/LiquidacionPdfView.vue`<br>`views/Liquidaciones/components/GeneracionMensualChart.vue`<br>`views/Liquidaciones/components/IngresoCostoComparativo.vue`<br>_+3 más_ | ⇄   |
| `GET`    | `/polizas`                                 | `views/Operaciones/PolizasView.vue`                                                                                                                                                     |     |
| `PUT`    | `/polizas/{id}`                            | `views/Operaciones/PolizasView.vue`                                                                                                                                                     |     |
| `GET`    | `/portafolios`                             | `views/Operaciones/PortafoliosGestionPanel.vue`                                                                                                                                         |     |
| `POST`   | `/portafolios`                             | `views/Operaciones/PortafoliosGestionPanel.vue`                                                                                                                                         |     |
| `DELETE` | `/portafolios/{id}`                        | `views/Operaciones/PortafoliosGestionPanel.vue`                                                                                                                                         |     |
| `PATCH`  | `/portafolios/{id}`                        | `views/Operaciones/PortafoliosGestionPanel.vue`                                                                                                                                         |     |
| `PATCH`  | `/portafolios/asignar`                     | `views/Operaciones/PortafoliosGestionPanel.vue`                                                                                                                                         |     |
| `GET`    | `/proyectos`                               | `components/FasorialButton.vue`<br>`mobile/MobileCoordinadorFallasView.vue`<br>`mobile/MobileFallasView.vue`<br>_+21 más_                                                               | ⇄   |
| `GET`    | `/usuarios`                                | `mobile/MobileCoordinadorFallasView.vue`<br>`mobile/MobileFallasView.vue`<br>`mobile/MobileResumenView.vue`<br>_+4 más_                                                                 | ⇄   |

## `operadores-red` — 10 endpoints

| Método   | Ruta                             | Consumidores                                                                                                         |     |
| -------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------- | --- |
| `GET`    | `/fronteras`                     | `mobile/MobileReporteCGMView.vue`<br>`views/MEM/FronterasView.vue`<br>`views/MEM/HistorialEnviosCGM.vue`<br>_+2 más_ | ⇄   |
| `GET`    | `/informes/envios`               | `views/MEM/HistorialEnviosCGM.vue`                                                                                   |     |
| `GET`    | `/operadores-red`                | `views/Comercial/OfertaDrawer.vue`<br>`views/MEM/FronterasView.vue`<br>`views/MEM/OperadoresRedView.vue`<br>_+2 más_ | ⇄   |
| `POST`   | `/operadores-red`                | `views/MEM/OperadoresRedView.vue`                                                                                    |     |
| `GET`    | `/operadores-red/{id}`           | `views/MEM/OperadorRedDetailView.vue`                                                                                |     |
| `PATCH`  | `/operadores-red/{id}`           | `views/MEM/OperadoresRedView.vue`                                                                                    |     |
| `POST`   | `/operadores-red/{id}/contactos` | `views/MEM/OperadorRedDetailView.vue`<br>`views/MEM/OperadoresRedView.vue`                                           |     |
| `DELETE` | `/operadores-red/contactos/{id}` | `views/MEM/OperadorRedDetailView.vue`                                                                                |     |
| `PATCH`  | `/operadores-red/contactos/{id}` | `views/MEM/OperadorRedDetailView.vue`                                                                                |     |
| `POST`   | `/reporte-cgm/enviar`            | `mobile/MobileReporteCGMView.vue`<br>`views/MEM/ReporteCGMView.vue`                                                  | ⇄   |

## `panel-contable` — 14 endpoints

| Método   | Ruta                                     | Consumidores                                                                                    |     |
| -------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------- | --- |
| `GET`    | `/panel-contable`                        | `views/PanelContable/PanelContableView.vue`                                                     |     |
| `PATCH`  | `/panel-contable/{id}`                   | `views/PanelContable/PanelContableView.vue`                                                     |     |
| `DELETE` | `/panel-contable/{id}/soporte`           | `views/PanelContable/PanelContableView.vue`                                                     |     |
| `POST`   | `/panel-contable/{id}/soporte`           | `views/PanelContable/PanelContableView.vue`                                                     |     |
| `POST`   | `/panel-contable/alias-fuente`           | `views/PanelContable/PanelContableView.vue`                                                     |     |
| `POST`   | `/panel-contable/cargar-er`              | `views/PanelContable/PanelContableView.vue`                                                     |     |
| `GET`    | `/panel-contable/clasificacion`          | `views/PanelContable/PanelContableView.vue`                                                     |     |
| `POST`   | `/panel-contable/clasificacion`          | `views/PanelContable/PanelContableView.vue`                                                     |     |
| `GET`    | `/panel-contable/consecutivos-usados`    | `views/PanelContable/PanelContableView.vue`                                                     |     |
| `GET`    | `/panel-contable/diferencia`             | `views/Liquidaciones/panels/DiferenciaPanel.vue`<br>`views/PanelContable/PanelContableView.vue` | ⇄   |
| `DELETE` | `/panel-contable/fuente-ingreso`         | `views/PanelContable/PanelContableView.vue`                                                     |     |
| `POST`   | `/panel-contable/fuente-ingreso`         | `views/PanelContable/PanelContableView.vue`                                                     |     |
| `POST`   | `/panel-contable/mapeo-celda`            | `views/PanelContable/PanelContableView.vue`                                                     |     |
| `POST`   | `/panel-contable/reasignar-consecutivos` | `views/PanelContable/PanelContableView.vue`                                                     |     |

## `proyectos` — 21 endpoints

| Método   | Ruta                                        | Consumidores                                                                                                                                    |     |
| -------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| `GET`    | `/clientes`                                 | `views/Contratos/ContratoServicioWizard.vue`<br>`views/Contratos/PPAContratoWizard.vue`<br>`views/Proyectos/ProyectoDetailView.vue`<br>_+1 más_ | ⇄   |
| `GET`    | `/contratos-servicio`                       | `views/Comercial/OportunidadDetailView.vue`<br>`views/Contratos/ContratosListView.vue`<br>`views/Finanzas/CostosView.vue`<br>_+6 más_           | ⇄   |
| `GET`    | `/fronteras`                                | `mobile/MobileReporteCGMView.vue`<br>`views/MEM/FronterasView.vue`<br>`views/MEM/HistorialEnviosCGM.vue`<br>_+2 más_                            | ⇄   |
| `GET`    | `/liquidaciones-api/proyectos/{id}`         | `views/Proyectos/ProyectoDetailView.vue`                                                                                                        |     |
| `PATCH`  | `/liquidaciones-api/proyectos/{id}`         | `views/Finanzas/IdsProyectosView.vue`<br>`views/Finanzas/VerificacionCostosView.vue`<br>`views/Proyectos/ProyectoDetailView.vue`                | ⇄   |
| `GET`    | `/operadores-red`                           | `views/Comercial/OfertaDrawer.vue`<br>`views/MEM/FronterasView.vue`<br>`views/MEM/OperadoresRedView.vue`<br>_+2 más_                            | ⇄   |
| `GET`    | `/proyectos`                                | `components/FasorialButton.vue`<br>`mobile/MobileCoordinadorFallasView.vue`<br>`mobile/MobileFallasView.vue`<br>_+21 más_                       | ⇄   |
| `POST`   | `/proyectos`                                | `views/Proyectos/ProyectosListView.vue`<br>`views/Servicios/ServiciosUnificadoView.vue`                                                         | ⇄   |
| `DELETE` | `/proyectos/{id}`                           | `composables/useEnergizationProjects.js`<br>`views/Proyectos/ProyectosListView.vue`<br>`views/Servicios/ServiciosUnificadoView.vue`             | ⇄   |
| `GET`    | `/proyectos/{id}`                           | `views/Fallas/FallaForm.vue`<br>`views/Proyectos/ProyectoDetailView.vue`<br>`views/Servicios/OperacionView.vue`<br>_+2 más_                     | ⇄   |
| `PATCH`  | `/proyectos/{id}`                           | `views/Proyectos/ProyectoDetailView.vue`                                                                                                        |     |
| `PUT`    | `/proyectos/{id}/info-tecnica`              | `views/Comercial/ProyectoDesdeCRMDialog.vue`<br>`views/Proyectos/ProyectoDetailView.vue`<br>`views/Proyectos/ProyectosListView.vue`<br>_+1 más_ | ⇄   |
| `GET`    | `/proyectos/{id}/inversionistas`            | `views/Liquidaciones/LiquidacionDetailView.vue`<br>`views/Liquidaciones/LiquidacionPdfView.vue`<br>`views/Proyectos/ProyectoDetailView.vue`     | ⇄   |
| `POST`   | `/proyectos/{id}/inversionistas`            | `views/Proyectos/ProyectoDetailView.vue`                                                                                                        |     |
| `DELETE` | `/proyectos/{id}/inversionistas/{id}`       | `views/Proyectos/ProyectoDetailView.vue`                                                                                                        |     |
| `PATCH`  | `/proyectos/{id}/inversionistas/{id}`       | `views/Proyectos/ProyectoDetailView.vue`                                                                                                        |     |
| `PATCH`  | `/proyectos/{id}/servicios`                 | `views/Proyectos/ProyectoDetailView.vue`                                                                                                        |     |
| `POST`   | `/proyectos/inversores/backfill-minigranja` | `views/Proyectos/ProyectosListView.vue`                                                                                                         |     |
| `GET`    | `/proyectos/pendientes`                     | `views/Proyectos/ProyectosListView.vue`                                                                                                         |     |
| `POST`   | `/proyectos/pendientes/{id}/confirmar`      | `views/Proyectos/ProyectosListView.vue`                                                                                                         |     |
| `POST`   | `/proyectos/pendientes/{id}/ignorar`        | `views/Proyectos/ProyectosListView.vue`                                                                                                         |     |

## `registros-cnd` — 17 endpoints

| Método   | Ruta                                     | Consumidores                                           |     |
| -------- | ---------------------------------------- | ------------------------------------------------------ | --- |
| `GET`    | `/registros-cnd`                         | `views/RegistrosCndAsic/RegistrosCndAsicListView.vue`  |     |
| `GET`    | `/registros-cnd/{id}`                    | `views/RegistrosCndAsic/RegistroCndAsicDetailView.vue` |     |
| `PATCH`  | `/registros-cnd/{id}`                    | `views/RegistrosCndAsic/RegistroCndAsicDetailView.vue` |     |
| `POST`   | `/registros-cnd/{id}/alertas/recomputar` | `views/RegistrosCndAsic/RegistroCndAsicDetailView.vue` |     |
| `POST`   | `/registros-cnd/{id}/correos/{id}`       | `views/RegistrosCndAsic/RegistroCndAsicDetailView.vue` |     |
| `GET`    | `/registros-cnd/{id}/documentos`         | `views/RegistrosCndAsic/RegistroCndAsicDetailView.vue` |     |
| `POST`   | `/registros-cnd/{id}/documentos`         | `views/RegistrosCndAsic/RegistroCndAsicDetailView.vue` |     |
| `DELETE` | `/registros-cnd/{id}/documentos/{id}`    | `views/RegistrosCndAsic/RegistroCndAsicDetailView.vue` |     |
| `GET`    | `/registros-cnd/{id}/equipos`            | `views/RegistrosCndAsic/RegistroCndAsicDetailView.vue` |     |
| `POST`   | `/registros-cnd/{id}/equipos`            | `views/RegistrosCndAsic/RegistroCndAsicDetailView.vue` |     |
| `DELETE` | `/registros-cnd/{id}/equipos/{id}`       | `views/RegistrosCndAsic/RegistroCndAsicDetailView.vue` |     |
| `GET`    | `/registros-cnd/{id}/parametros-93`      | `views/RegistrosCndAsic/RegistroCndAsicDetailView.vue` |     |
| `PUT`    | `/registros-cnd/{id}/parametros-93`      | `views/RegistrosCndAsic/RegistroCndAsicDetailView.vue` |     |
| `POST`   | `/registros-cnd/{id}/transicion`         | `views/RegistrosCndAsic/RegistroCndAsicDetailView.vue` |     |
| `GET`    | `/registros-cnd/{id}/validacion-93`      | `views/RegistrosCndAsic/RegistroCndAsicDetailView.vue` |     |
| `GET`    | `/registros-cnd/catalogos`               | `views/RegistrosCndAsic/RegistroCndAsicDetailView.vue` |     |
| `POST`   | `/registros-cnd/por-proyecto/{id}`       | `views/RegistrosCndAsic/RegistroCndAsicDetailView.vue` |     |

## `retos` — 8 endpoints

| Método   | Ruta                                     | Consumidores                                                        |     |
| -------- | ---------------------------------------- | ------------------------------------------------------------------- | --- |
| `GET`    | `/retos`                                 | `views/Retos/RetoDetailView.vue`<br>`views/Retos/RetosListView.vue` |     |
| `GET`    | `/retos/{id}`                            | `views/Retos/RetoDetailView.vue`                                    |     |
| `PATCH`  | `/retos/{id}`                            | `views/Retos/RetoDetailView.vue`                                    |     |
| `POST`   | `/retos/{id}/metricas`                   | `views/Retos/RetoDetailView.vue`                                    |     |
| `POST`   | `/retos/{id}/metricas/copiar-desde/{id}` | `views/Retos/RetoDetailView.vue`                                    |     |
| `DELETE` | `/retos/metricas/{id}`                   | `views/Retos/RetoDetailView.vue`                                    |     |
| `PATCH`  | `/retos/metricas/{id}`                   | `views/Retos/RetoDetailView.vue`                                    |     |
| `PUT`    | `/retos/metricas/{id}/valores/{id}`      | `views/Retos/RetoDetailView.vue`                                    |     |

## `solar` — 15 endpoints

| Método | Ruta                                                | Consumidores                                                                                                                                        |     |
| ------ | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| `POST` | `/fallas`                                           | `mobile/components/FallaCreateSheet.vue`<br>`views/Fallas/FallasListView.vue`<br>`views/Fallas/MonitoreoView.vue`<br>_+2 más_                       | ⇄   |
| `POST` | `/fallas/{id}/archivos`                             | `mobile/components/TecnicoFallaDetailSheet.vue`<br>`views/Fallas/FallaArchivos.vue`<br>`views/Fallas/MonitoreoView.vue`<br>_+1 más_                 | ⇄   |
| `POST` | `/fallas/{id}/seguimientos`                         | `mobile/components/FallaCreateSheet.vue`<br>`mobile/components/FallaDetailSheet.vue`<br>`mobile/components/TecnicoFallaDetailSheet.vue`<br>_+6 más_ | ⇄   |
| `GET`  | `/fallas/catalogos`                                 | `mobile/MobileCoordinadorFallasView.vue`<br>`mobile/MobileFallasView.vue`<br>`mobile/MobileResumenView.vue`<br>_+8 más_                             | ⇄   |
| `GET`  | `/generacion-solar/generacion-hoy`                  | `views/Fallas/MonitoreoView.vue`<br>`views/GeneracionSolarView.vue`<br>`views/Solar/SolarLiveView.vue`                                              | ⇄   |
| `GET`  | `/generacion-solar/monitoring`                      | `components/FasorialButton.vue`<br>`mobile/MobileSolarView.vue`<br>`views/GeneracionSolarView.vue`<br>_+1 más_                                      | ⇄   |
| `GET`  | `/generacion-solar/monitoring/{id}`                 | `components/FasorialButton.vue`<br>`mobile/MobileSolarView.vue`<br>`views/GeneracionSolarView.vue`<br>_+1 más_                                      | ⇄   |
| `GET`  | `/generacion-solar/monitoring/{id}/inverters-power` | `mobile/components/InvertersSheet.vue`<br>`views/GeneracionSolarView.vue`                                                                           | ⇄   |
| `GET`  | `/proyectos`                                        | `components/FasorialButton.vue`<br>`mobile/MobileCoordinadorFallasView.vue`<br>`mobile/MobileFallasView.vue`<br>_+21 más_                           | ⇄   |
| `GET`  | `/solar/comparacion`                                | `views/Solar/SolarView.vue`                                                                                                                         |     |
| `GET`  | `/solar/filtros`                                    | `views/Solar/SolarView.vue`                                                                                                                         |     |
| `GET`  | `/solar/generacion`                                 | `views/Solar/SolarView.vue`                                                                                                                         |     |
| `GET`  | `/solar/proyectos`                                  | `views/Solar/SolarView.vue`                                                                                                                         |     |
| `GET`  | `/solar/ranking`                                    | `views/Solar/SolarView.vue`                                                                                                                         |     |
| `POST` | `/solar/reload-cache`                               | `views/Solar/SolarView.vue`                                                                                                                         |     |

## Endpoints compartidos por más de un slice

Los 48 de abajo se llaman desde dos o más slices. Cada uno necesita una
decisión explícita de propiedad antes de escribir su service.

| Método   | Ruta                                                | Slices                                                                                                        |
| -------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/asic`                                             | contratos, mem                                                                                                |
| `DELETE` | `/asic/{id}`                                        | contratos, mem                                                                                                |
| `POST`   | `/clientes`                                         | clientes, compartido, contratos                                                                               |
| `GET`    | `/clientes`                                         | contratos, proyectos                                                                                          |
| `PATCH`  | `/clientes/{id}`                                    | clientes, comercial                                                                                           |
| `DELETE` | `/clientes/{id}`                                    | clientes, contratos                                                                                           |
| `GET`    | `/clientes/{id}`                                    | clientes, comercial                                                                                           |
| `GET`    | `/clientes/{id}/contratos-ppa`                      | clientes, comercial                                                                                           |
| `POST`   | `/clientes/{id}/documentos`                         | clientes, comercial, compartido                                                                               |
| `GET`    | `/clientes/vista-comercial`                         | clientes, contratos                                                                                           |
| `GET`    | `/contratos-servicio`                               | comercial, contratos, finanzas, liquidaciones, proyectos                                                      |
| `GET`    | `/contratos-servicio/{id}`                          | contratos, finanzas                                                                                           |
| `GET`    | `/dashboard/kpis`                                   | alertas, general                                                                                              |
| `GET`    | `/fallas`                                           | fallas, fronteras, mobile, operaciones                                                                        |
| `POST`   | `/fallas`                                           | fallas, mobile, operaciones, solar                                                                            |
| `GET`    | `/fallas/{id}`                                      | fallas, mobile, operaciones                                                                                   |
| `PATCH`  | `/fallas/{id}`                                      | fallas, mobile, operaciones                                                                                   |
| `DELETE` | `/fallas/{id}`                                      | fallas, operaciones                                                                                           |
| `GET`    | `/fallas/{id}/archivos`                             | fallas, mobile                                                                                                |
| `POST`   | `/fallas/{id}/archivos`                             | fallas, mobile, solar                                                                                         |
| `DELETE` | `/fallas/{id}/archivos/{id}`                        | fallas, mobile                                                                                                |
| `POST`   | `/fallas/{id}/seguimientos`                         | fallas, mobile, operaciones, solar                                                                            |
| `GET`    | `/fallas/catalogos`                                 | fallas, mobile, operaciones, solar                                                                            |
| `GET`    | `/fallas/estructura`                                | fallas, mobile                                                                                                |
| `GET`    | `/fronteras`                                        | fronteras, mobile, operadores-red, proyectos                                                                  |
| `GET`    | `/generacion-solar/generacion-hoy`                  | fallas, solar                                                                                                 |
| `GET`    | `/generacion-solar/monitoring`                      | compartido, mobile, solar                                                                                     |
| `GET`    | `/generacion-solar/monitoring/{id}`                 | compartido, mobile, solar                                                                                     |
| `GET`    | `/generacion-solar/monitoring/{id}/inverters-power` | mobile, solar                                                                                                 |
| `PATCH`  | `/liquidaciones-api/proyectos/{id}`                 | finanzas, proyectos                                                                                           |
| `GET`    | `/monitoreo/_legacy`                                | liquidaciones, operaciones                                                                                    |
| `GET`    | `/notificaciones`                                   | compartido, mobile, notificaciones                                                                            |
| `PATCH`  | `/notificaciones/{id}/leer`                         | compartido, mobile, notificaciones                                                                            |
| `GET`    | `/notificaciones/count`                             | compartido, mobile, notificaciones                                                                            |
| `POST`   | `/notificaciones/leer-todas`                        | compartido, notificaciones                                                                                    |
| `GET`    | `/operadores-red`                                   | comercial, fronteras, operadores-red, proyectos                                                               |
| `GET`    | `/panel-contable/diferencia`                        | liquidaciones, panel-contable                                                                                 |
| `GET`    | `/ppa`                                              | contratos, mem                                                                                                |
| `GET`    | `/proyectos`                                        | compartido, contratos, fallas, finanzas, fronteras, liquidaciones, mem, mobile, operaciones, proyectos, solar |
| `POST`   | `/proyectos`                                        | contratos, proyectos                                                                                          |
| `DELETE` | `/proyectos/{id}`                                   | compartido, contratos, proyectos                                                                              |
| `GET`    | `/proyectos/{id}`                                   | contratos, fallas, proyectos                                                                                  |
| `PUT`    | `/proyectos/{id}/info-tecnica`                      | comercial, contratos, proyectos                                                                               |
| `GET`    | `/proyectos/{id}/inversionistas`                    | liquidaciones, proyectos                                                                                      |
| `GET`    | `/proyectos/{id}/inversores`                        | fallas, mobile                                                                                                |
| `POST`   | `/proyectos/{id}/inversores`                        | fallas, mobile                                                                                                |
| `POST`   | `/reporte-cgm/enviar`                               | mobile, operadores-red                                                                                        |
| `GET`    | `/usuarios`                                         | admin, fallas, mobile, operaciones                                                                            |
