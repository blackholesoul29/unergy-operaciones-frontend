<template>
  <div class="om-page">
    <!-- ══ LISTA DE PROYECTOS ══════════════════════════════════════════════ -->
    <div v-if="!seleccion" class="om-list-wrap">
      <div class="om-list-head">
        <div class="flex items-center gap-2">
          <i class="pi pi-file-pdf" style="color: #915bd8; font-size: 16px" />
          <h2 class="om-title">Informe de Puesta en Marcha</h2>
          <span class="om-badge">{{ proyectos.length }}</span>
        </div>
        <button
          class="om-icon-btn"
          :disabled="loadingLista"
          @click="cargarLista"
          title="Actualizar"
        >
          <i :class="loadingLista ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'" />
        </button>
      </div>

      <div class="om-search">
        <i class="pi pi-search" />
        <input v-model="busqueda" placeholder="Buscar proyecto…" />
      </div>

      <div v-if="loadingLista" class="om-state">
        <i class="pi pi-spin pi-spinner" /> Cargando proyectos…
      </div>
      <div v-else-if="!proyectosFiltrados.length" class="om-state">
        <i class="pi pi-inbox" style="font-size: 32px; color: #cbd5e1" />
        <span>{{
          proyectos.length
            ? 'Sin resultados'
            : 'No hay minigranjas en operación con servicio de operación'
        }}</span>
      </div>

      <div v-else class="om-grid">
        <button v-for="p in proyectosFiltrados" :key="p.id" class="om-card" @click="abrir(p.id)">
          <div class="om-card-top">
            <span class="om-card-name">{{ p.nombre_comercial }}</span>
            <span class="om-chip" :class="`om-chip--${p.tiene_ficha ? p.estado_global : 'new'}`">
              {{
                !p.tiene_ficha
                  ? 'Sin iniciar'
                  : p.estado_global === 'atencion'
                    ? 'Atención'
                    : 'Operativo'
              }}
            </span>
          </div>
          <div class="om-card-meta">
            <span v-if="p.municipio || p.departamento"
              ><i class="pi pi-map-marker" />
              {{ [p.municipio, p.departamento].filter(Boolean).join(', ') }}</span
            >
            <span v-if="p.potencia_instalada_kwp"
              ><i class="pi pi-bolt" /> {{ fmtCapacidad(p.potencia_instalada_kwp) }}</span
            >
          </div>
        </button>
      </div>
    </div>

    <!-- ══ FICHA DE DETALLE ═══════════════════════════════════════════════ -->
    <div v-else class="om-detail">
      <div v-if="loadingFicha" class="om-state">
        <i class="pi pi-spin pi-spinner" /> Cargando informe…
      </div>

      <template v-else>
        <div class="om-detail-head">
          <button class="om-back" @click="cerrar"><i class="pi pi-arrow-left" /> Proyectos</button>
          <div class="om-detail-actions">
            <span v-if="dirty" class="om-dirty">Cambios sin guardar</span>
            <button
              class="om-pdf"
              :disabled="exportandoPdf"
              @click="descargarPdf"
              title="Descargar PDF"
            >
              <i :class="exportandoPdf ? 'pi pi-spin pi-spinner' : 'pi pi-file-pdf'" />
              {{ exportandoPdf ? 'Generando…' : 'Descargar PDF' }}
            </button>
            <button
              class="om-generar"
              :disabled="generandoInforme"
              @click="generarInforme"
              title="Generar informe editable y enviarlo a revisión"
            >
              <i :class="generandoInforme ? 'pi pi-spin pi-spinner' : 'pi pi-file-edit'" />
              {{ generandoInforme ? 'Generando…' : 'Generar informe' }}
            </button>
            <button class="om-save" :disabled="guardando || !dirty" @click="guardar">
              <i :class="guardando ? 'pi pi-spin pi-spinner' : 'pi pi-check'" />
              {{ guardando ? 'Guardando…' : 'Guardar' }}
            </button>
          </div>
        </div>

        <!-- Encabezado -->
        <div class="om-hero">
          <div class="om-hero-title">
            <h1>{{ detalle.proyecto.nombre_comercial }}</h1>
            <span class="om-hero-sub">Informe de Puesta en Marcha · Sistema de monitoreo</span>
          </div>
          <div class="om-hero-facts">
            <div class="om-fact">
              <span class="om-fact-label">Ubicación</span
              ><span class="om-fact-val">{{ ubicacion || '—' }}</span>
            </div>
            <div class="om-fact">
              <span class="om-fact-label">Potencia AC instalada</span
              ><span class="om-fact-val">{{
                fmtCapacidad(detalle.proyecto.potencia_instalada_kwp)
              }}</span>
            </div>
            <div class="om-fact">
              <span class="om-fact-label">Puesta en marcha</span
              ><span class="om-fact-val">{{
                fmtFecha(detalle.fecha_inicio_operacion) || '—'
              }}</span>
            </div>
            <div class="om-fact">
              <span class="om-fact-label">Versión</span>
              <input
                v-model="ficha.version"
                class="om-fact-input"
                placeholder="01 — Inicial"
                @input="marcar"
              />
            </div>
            <div class="om-fact">
              <span class="om-fact-label">Elaborado por</span>
              <input v-model="ficha.elaborado_por" class="om-fact-input" @input="marcar" />
            </div>
          </div>
        </div>

        <!-- KPIs -->
        <div class="om-kpis">
          <div class="om-kpi">
            <i class="pi pi-check-circle om-kpi-ico" />
            <div>
              <span class="om-kpi-val">{{ detalle.kpis.pruebas_ejecutadas }}</span
              ><span class="om-kpi-label">Pruebas ejecutadas</span>
            </div>
          </div>
          <div class="om-kpi om-kpi--ok">
            <i class="pi pi-verified om-kpi-ico" />
            <div>
              <span class="om-kpi-val">{{ detalle.kpis.pruebas_conformes }}</span
              ><span class="om-kpi-label">Conformes</span>
            </div>
          </div>
          <div class="om-kpi" :class="detalle.kpis.pruebas_no_conformes > 0 && 'om-kpi--warn'">
            <i class="pi pi-exclamation-triangle om-kpi-ico" />
            <div>
              <span class="om-kpi-val">{{ detalle.kpis.pruebas_no_conformes }}</span
              ><span class="om-kpi-label">No conformidades</span>
            </div>
          </div>
          <div class="om-kpi" :class="detalle.kpis.eventos_total > 0 && 'om-kpi--warn'">
            <i class="pi pi-bolt om-kpi-ico" />
            <div>
              <span class="om-kpi-val">{{ detalle.kpis.eventos_total }}</span
              ><span class="om-kpi-label">Eventos registrados</span>
            </div>
          </div>
        </div>

        <!-- Semáforo -->
        <div class="om-semaforo" :class="`om-semaforo--${detalle.kpis.estado_global}`">
          <div class="om-semaforo-top">
            <i
              :class="
                detalle.kpis.estado_global === 'atencion'
                  ? 'pi pi-exclamation-triangle'
                  : 'pi pi-check-circle'
              "
            />
            <span
              >{{ detalle.kpis.estado_global === 'atencion' ? 'ATENCIÓN' : 'OPERATIVO' }} — Con
              seguimiento activo</span
            >
          </div>
          <div class="om-semaforo-grid">
            <span
              >✅ Pruebas: {{ detalle.kpis.pruebas_conformes }}/{{
                detalle.kpis.pruebas_ejecutadas
              }}
              conformes</span
            >
            <span>⚠️ No conformidades: {{ detalle.kpis.pruebas_no_conformes }}</span>
            <span
              >⚡ Eventos: {{ detalle.kpis.eventos_total }} ({{
                detalle.kpis.eventos_cerrados
              }}
              cerrado(s), {{ detalle.kpis.eventos_en_gestion }} en gestión)</span
            >
            <span
              >Resp: {{ ficha.datos_generales.responsable_nombre || 'Operaciones Unergy' }}</span
            >
          </div>
        </div>

        <!-- ─ Objetivo y alcance ─ -->
        <section class="om-acc">
          <button class="om-acc-head" @click="toggle('objetivo')">
            <i :class="['pi', abierto.objetivo ? 'pi-chevron-down' : 'pi-chevron-right']" />
            <i class="pi pi-flag om-acc-ico" /><span>Objetivo y Alcance</span>
          </button>
          <div v-show="abierto.objetivo" class="om-acc-body">
            <label class="om-field">
              <span>Objetivo</span>
              <textarea
                v-model="ficha.objetivo_alcance.objetivo"
                rows="3"
                @input="marcar"
                placeholder="Documentar y certificar las actividades de..."
              />
            </label>
            <ListaEditable
              v-model="ficha.objetivo_alcance.alcance_items"
              label="Incluido en el alcance"
              placeholder="Ítem del alcance…"
              @update:modelValue="marcar"
            />
          </div>
        </section>

        <!-- ─ Datos generales ─ -->
        <section class="om-acc">
          <button class="om-acc-head" @click="toggle('generales')">
            <i :class="['pi', abierto.generales ? 'pi-chevron-down' : 'pi-chevron-right']" />
            <i class="pi pi-info-circle om-acc-ico" /><span>Datos Generales</span>
          </button>
          <div v-show="abierto.generales" class="om-acc-body">
            <div class="om-readonly-grid">
              <div>
                <span class="om-ro-label">Fecha de energización</span
                ><span class="om-ro-val">{{ fmtFecha(detalle.fecha_energizacion) || '—' }}</span>
              </div>
              <div>
                <span class="om-ro-label">Empresa contratista</span
                ><span class="om-ro-val">{{ detalle.empresa_contratista || '—' }}</span>
              </div>
              <div>
                <span class="om-ro-label">Cantidad de inversores</span
                ><span class="om-ro-val">{{ detalle.inversores.length }}</span>
              </div>
            </div>
            <span class="om-ro-hint"
              ><i class="pi pi-flag" /> Estos datos vienen de Inicio de Operación — corrígelos allí
              si hace falta.</span
            >

            <div class="om-fields-grid">
              <label class="om-field"
                ><span>Seguidores solares — marca</span
                ><input v-model="ficha.datos_generales.seguidores_marca" @input="marcar"
              /></label>
              <label class="om-field"
                ><span>Medida comercial — marca</span
                ><input v-model="ficha.datos_generales.medida_comercial_marca" @input="marcar"
              /></label>
              <label class="om-field"
                ><span>Medida comercial — modelo</span
                ><input v-model="ficha.datos_generales.medida_comercial_modelo" @input="marcar"
              /></label>
              <label class="om-field"
                ><span>Responsable del monitoreo</span
                ><input v-model="ficha.datos_generales.responsable_nombre" @input="marcar"
              /></label>
              <label class="om-field"
                ><span>Correo del responsable</span
                ><input v-model="ficha.datos_generales.responsable_email" @input="marcar"
              /></label>
            </div>
            <ListaEditable
              v-model="ficha.datos_generales.plataformas_monitoreo"
              label="Plataformas de monitoreo"
              placeholder="Ej. Fusion Solar"
              @update:modelValue="marcar"
            />
          </div>
        </section>

        <!-- ─ Inversores (solo lectura, Solenium) ─ -->
        <section class="om-acc">
          <button class="om-acc-head" @click="toggle('inversores')">
            <i :class="['pi', abierto.inversores ? 'pi-chevron-down' : 'pi-chevron-right']" />
            <i class="pi pi-bolt om-acc-ico" /><span>Configuración de Inversores</span>
            <span class="om-acc-count"
              >{{ detalle.inversores.length }} · {{ fmtCapacidad(capacidadTotal) }}</span
            >
          </button>
          <div v-show="abierto.inversores" class="om-acc-body">
            <span class="om-ro-hint"
              ><i class="pi pi-flag" /> Datos en vivo de Solenium — revisión de strings en Inicio de
              Operación.</span
            >
            <table class="om-table">
              <thead>
                <tr>
                  <th>Inversor</th>
                  <th>Potencia</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="inv in detalle.inversores" :key="inv.id">
                  <td>{{ inv.nombre }}</td>
                  <td>{{ fmtCapacidad(inv.potencia_nominal_kw) }}</td>
                  <td>{{ inv.state || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- ─ Sistemas (solo lectura, Inicio de Operación) ─ -->
        <section class="om-acc">
          <button class="om-acc-head" @click="toggle('sistemas')">
            <i :class="['pi', abierto.sistemas ? 'pi-chevron-down' : 'pi-chevron-right']" />
            <i class="pi pi-desktop om-acc-ico" /><span>Estado de Sistemas</span>
          </button>
          <div v-show="abierto.sistemas" class="om-acc-body">
            <span class="om-ro-hint"
              ><i class="pi pi-flag" /> Vienen de Inicio de Operación — edítalos allí si hace
              falta.</span
            >
            <div class="om-sistemas-grid">
              <div
                class="om-sistema-chip"
                :class="`om-sistema-chip--${detalle.fusion_solar_estado}`"
              >
                Fusion Solar<b>{{
                  detalle.fusion_solar_estado === 'aprobado' ? 'Aprobado' : 'Pendiente'
                }}</b>
              </div>
              <div class="om-sistema-chip" :class="`om-sistema-chip--${detalle.frontera_estado}`">
                Frontera<b>{{
                  detalle.frontera_estado === 'aprobado' ? 'Aprobado' : 'Pendiente'
                }}</b>
              </div>
              <div
                class="om-sistema-chip"
                :class="`om-sistema-chip--${detalle.estacion_meteo_estado}`"
              >
                Estación meteo<b>{{
                  detalle.estacion_meteo_estado === 'aprobado' ? 'Aprobado' : 'Pendiente'
                }}</b>
              </div>
              <div
                class="om-sistema-chip"
                :class="`om-sistema-chip--${detalle.reconectador_estado}`"
              >
                Reconectador<b>{{
                  detalle.reconectador_estado === 'aprobado' ? 'Aprobado' : 'Pendiente'
                }}</b>
              </div>
            </div>
          </div>
        </section>

        <!-- ─ Arquitectura de comunicación ─ -->
        <section class="om-acc">
          <button class="om-acc-head" @click="toggle('arquitectura')">
            <i :class="['pi', abierto.arquitectura ? 'pi-chevron-down' : 'pi-chevron-right']" />
            <i class="pi pi-sitemap om-acc-ico" /><span>Arquitectura de Comunicación</span>
          </button>
          <div v-show="abierto.arquitectura" class="om-acc-body">
            <div class="om-fields-grid">
              <label class="om-field"
                ><span>Enlace principal</span
                ><input
                  v-model="ficha.arquitectura_comunicacion.enlace_principal"
                  @input="marcar"
                  placeholder="Ej. Starlink (satelital)"
              /></label>
              <label class="om-field"
                ><span>Enlaces celulares</span
                ><input v-model="ficha.arquitectura_comunicacion.enlaces_celulares" @input="marcar"
              /></label>
              <label class="om-field"
                ><span>Concentrador de datos</span
                ><input
                  v-model="ficha.arquitectura_comunicacion.concentrador_datos"
                  @input="marcar"
              /></label>
              <label class="om-field"
                ><span>Destino de los datos</span
                ><input v-model="ficha.arquitectura_comunicacion.destino_datos" @input="marcar"
              /></label>
              <label class="om-field"
                ><span>Sincronización horaria</span
                ><input
                  v-model="ficha.arquitectura_comunicacion.sincronizacion_horaria"
                  @input="marcar"
              /></label>
            </div>
            <label class="om-field" style="margin-top: 10px">
              <span>Diagrama de arquitectura (Anexo)</span>
              <EvidenciaUploader
                :proyecto-id="seleccion"
                base-path="informe-om"
                seccion="arquitectura"
                v-model="ficha.evidencia_arquitectura"
                @update:modelValue="marcar"
                @error="mostrarError"
              />
            </label>
          </div>
        </section>

        <!-- ─ Equipos integrados ─ -->
        <section class="om-acc">
          <button class="om-acc-head" @click="toggle('equipos')">
            <i :class="['pi', abierto.equipos ? 'pi-chevron-down' : 'pi-chevron-right']" />
            <i class="pi pi-box om-acc-ico" /><span>Equipos Integrados</span>
            <span class="om-acc-count">{{ ficha.equipos.length }}</span>
          </button>
          <div v-show="abierto.equipos" class="om-acc-body">
            <div class="om-table-wrap">
              <table class="om-table">
                <thead>
                  <tr>
                    <th>Descripción</th>
                    <th>Marca</th>
                    <th style="width: 70px">Cant.</th>
                    <th>Ubicación</th>
                    <th>N.º serie</th>
                    <th style="width: 36px"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(e, i) in ficha.equipos" :key="i">
                    <td>
                      <input
                        v-model="e.descripcion"
                        @input="marcar"
                        placeholder="Ej. Inversor 300 kW"
                      />
                    </td>
                    <td><input v-model="e.marca" @input="marcar" /></td>
                    <td>
                      <input type="number" min="0" v-model.number="e.cantidad" @input="marcar" />
                    </td>
                    <td>
                      <input v-model="e.ubicacion" @input="marcar" placeholder="Ej. Campo solar" />
                    </td>
                    <td><input v-model="e.numero_serie" @input="marcar" /></td>
                    <td>
                      <button class="om-del" @click="quitarFila(ficha.equipos, i)">
                        <i class="pi pi-trash" />
                      </button>
                    </td>
                  </tr>
                  <tr v-if="!ficha.equipos.length">
                    <td colspan="6" class="om-table-empty">Sin equipos. Agrega uno.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button
              class="om-add-row"
              @click="
                agregarFila(ficha.equipos, {
                  descripcion: '',
                  marca: '',
                  cantidad: 1,
                  ubicacion: '',
                  numero_serie: '',
                })
              "
            >
              <i class="pi pi-plus" /> Agregar equipo
            </button>
          </div>
        </section>

        <!-- ─ Variables monitoreadas ─ -->
        <section class="om-acc">
          <button class="om-acc-head" @click="toggle('variables')">
            <i :class="['pi', abierto.variables ? 'pi-chevron-down' : 'pi-chevron-right']" />
            <i class="pi pi-chart-line om-acc-ico" /><span>Variables Monitoreadas</span>
            <span class="om-acc-count">{{ ficha.variables_monitoreadas.length }}</span>
          </button>
          <div v-show="abierto.variables" class="om-acc-body">
            <div class="om-table-wrap">
              <table class="om-table">
                <thead>
                  <tr>
                    <th>Variable</th>
                    <th>Unidad</th>
                    <th>Fuente</th>
                    <th>Registro</th>
                    <th>Plataforma</th>
                    <th style="width: 36px"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(v, i) in ficha.variables_monitoreadas" :key="i">
                    <td>
                      <input v-model="v.variable" @input="marcar" placeholder="Ej. Irradiancia" />
                    </td>
                    <td><input v-model="v.unidad" @input="marcar" placeholder="W/m²" /></td>
                    <td><input v-model="v.fuente" @input="marcar" /></td>
                    <td><input v-model="v.registro" @input="marcar" placeholder="5 min" /></td>
                    <td><input v-model="v.plataforma" @input="marcar" /></td>
                    <td>
                      <button class="om-del" @click="quitarFila(ficha.variables_monitoreadas, i)">
                        <i class="pi pi-trash" />
                      </button>
                    </td>
                  </tr>
                  <tr v-if="!ficha.variables_monitoreadas.length">
                    <td colspan="6" class="om-table-empty">Sin variables. Agrega una.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button
              class="om-add-row"
              @click="
                agregarFila(ficha.variables_monitoreadas, {
                  variable: '',
                  unidad: '',
                  fuente: '',
                  registro: '',
                  plataforma: '',
                })
              "
            >
              <i class="pi pi-plus" /> Agregar variable
            </button>
          </div>
        </section>

        <!-- ─ Configuración del monitoreo ─ -->
        <section class="om-acc">
          <button class="om-acc-head" @click="toggle('config')">
            <i :class="['pi', abierto.config ? 'pi-chevron-down' : 'pi-chevron-right']" />
            <i class="pi pi-bell om-acc-ico" /><span>Configuración del Monitoreo</span>
          </button>
          <div v-show="abierto.config" class="om-acc-body">
            <span class="om-sub-label">Usuarios y destinatarios de notificación</span>
            <div class="om-table-wrap">
              <table class="om-table">
                <thead>
                  <tr>
                    <th>Rol</th>
                    <th>Nombre</th>
                    <th>Canal</th>
                    <th>Alcance</th>
                    <th style="width: 36px"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(n, i) in ficha.configuracion_monitoreo.notificaciones" :key="i">
                    <td>
                      <input
                        v-model="n.rol"
                        @input="marcar"
                        placeholder="Ej. Líder de operaciones"
                      />
                    </td>
                    <td><input v-model="n.nombre" @input="marcar" /></td>
                    <td>
                      <input v-model="n.canal" @input="marcar" placeholder="Correo / WhatsApp" />
                    </td>
                    <td><input v-model="n.alcance" @input="marcar" /></td>
                    <td>
                      <button
                        class="om-del"
                        @click="quitarFila(ficha.configuracion_monitoreo.notificaciones, i)"
                      >
                        <i class="pi pi-trash" />
                      </button>
                    </td>
                  </tr>
                  <tr v-if="!ficha.configuracion_monitoreo.notificaciones.length">
                    <td colspan="5" class="om-table-empty">Sin destinatarios.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button
              class="om-add-row"
              @click="
                agregarFila(ficha.configuracion_monitoreo.notificaciones, {
                  rol: '',
                  nombre: '',
                  canal: '',
                  alcance: '',
                })
              "
            >
              <i class="pi pi-plus" /> Agregar destinatario
            </button>

            <span class="om-sub-label" style="margin-top: 16px">Umbrales de alarma</span>
            <div class="om-table-wrap">
              <table class="om-table">
                <thead>
                  <tr>
                    <th>Evento</th>
                    <th>Condición</th>
                    <th>Notificación</th>
                    <th>Destinatarios</th>
                    <th style="width: 36px"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(u, i) in ficha.configuracion_monitoreo.umbrales_alarma" :key="i">
                    <td>
                      <input
                        v-model="u.evento"
                        @input="marcar"
                        placeholder="Ej. Inversor fuera de línea"
                      />
                    </td>
                    <td><input v-model="u.condicion" @input="marcar" /></td>
                    <td>
                      <input v-model="u.notificacion" @input="marcar" placeholder="Inmediata" />
                    </td>
                    <td><input v-model="u.destinatarios" @input="marcar" /></td>
                    <td>
                      <button
                        class="om-del"
                        @click="quitarFila(ficha.configuracion_monitoreo.umbrales_alarma, i)"
                      >
                        <i class="pi pi-trash" />
                      </button>
                    </td>
                  </tr>
                  <tr v-if="!ficha.configuracion_monitoreo.umbrales_alarma.length">
                    <td colspan="5" class="om-table-empty">Sin umbrales.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button
              class="om-add-row"
              @click="
                agregarFila(ficha.configuracion_monitoreo.umbrales_alarma, {
                  evento: '',
                  condicion: '',
                  notificacion: '',
                  destinatarios: '',
                })
              "
            >
              <i class="pi pi-plus" /> Agregar umbral
            </button>

            <ListaEditable
              v-model="ficha.configuracion_monitoreo.politicas_datos"
              label="Políticas de datos"
              placeholder="Ej. Retención de históricos…"
              style="margin-top: 16px"
              @update:modelValue="marcar"
            />
          </div>
        </section>

        <!-- ─ Protocolo de pruebas ─ -->
        <section class="om-acc">
          <button class="om-acc-head" @click="toggle('pruebas')">
            <i :class="['pi', abierto.pruebas ? 'pi-chevron-down' : 'pi-chevron-right']" />
            <i class="pi pi-list-check om-acc-ico" /><span>Protocolo de Pruebas y Resultados</span>
            <span class="om-acc-count"
              >{{ detalle.kpis.pruebas_conformes }}/{{ detalle.kpis.pruebas_ejecutadas }}</span
            >
          </button>
          <div v-show="abierto.pruebas" class="om-acc-body">
            <div class="om-table-wrap">
              <table class="om-table">
                <thead>
                  <tr>
                    <th style="width: 60px">Código</th>
                    <th>Prueba</th>
                    <th>Criterio de aceptación</th>
                    <th style="width: 130px">Resultado</th>
                    <th>Observación</th>
                    <th style="width: 36px"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(p, i) in ficha.protocolo_pruebas" :key="i">
                    <td><input v-model="p.codigo" @input="marcar" placeholder="P-01" /></td>
                    <td><input v-model="p.prueba" @input="marcar" /></td>
                    <td><input v-model="p.criterio_aceptacion" @input="marcar" /></td>
                    <td>
                      <select v-model="p.resultado" @change="marcar">
                        <option value="">—</option>
                        <option value="conforme">Conforme</option>
                        <option value="no_conforme">No conforme</option>
                        <option value="na">N/A</option>
                      </select>
                    </td>
                    <td><input v-model="p.observacion" @input="marcar" /></td>
                    <td>
                      <button class="om-del" @click="quitarFila(ficha.protocolo_pruebas, i)">
                        <i class="pi pi-trash" />
                      </button>
                    </td>
                  </tr>
                  <tr v-if="!ficha.protocolo_pruebas.length">
                    <td colspan="6" class="om-table-empty">Sin pruebas. Agrega una.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button
              class="om-add-row"
              @click="
                agregarFila(ficha.protocolo_pruebas, {
                  codigo: `P-${String(ficha.protocolo_pruebas.length + 1).padStart(2, '0')}`,
                  prueba: '',
                  criterio_aceptacion: '',
                  resultado: '',
                  observacion: '',
                })
              "
            >
              <i class="pi pi-plus" /> Agregar prueba
            </button>
          </div>
        </section>

        <!-- ─ Eventos operativos ─ -->
        <section class="om-acc">
          <button class="om-acc-head" @click="toggle('eventos')">
            <i :class="['pi', abierto.eventos ? 'pi-chevron-down' : 'pi-chevron-right']" />
            <i class="pi pi-exclamation-circle om-acc-ico" /><span
              >Eventos Operativos y Acciones Correctivas</span
            >
            <span class="om-acc-count">{{ ficha.eventos_operativos.length }}</span>
          </button>
          <div v-show="abierto.eventos" class="om-acc-body">
            <div class="om-table-wrap">
              <table class="om-table">
                <thead>
                  <tr>
                    <th style="width: 60px">Código</th>
                    <th>Descripción</th>
                    <th>Causa raíz</th>
                    <th>Acción correctiva</th>
                    <th style="width: 120px">Estado</th>
                    <th style="width: 36px"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(e, i) in ficha.eventos_operativos" :key="i">
                    <td><input v-model="e.codigo" @input="marcar" placeholder="I-01" /></td>
                    <td><input v-model="e.descripcion" @input="marcar" /></td>
                    <td><input v-model="e.causa_raiz" @input="marcar" /></td>
                    <td><input v-model="e.accion_correctiva" @input="marcar" /></td>
                    <td>
                      <select v-model="e.estado" @change="marcar">
                        <option value="">—</option>
                        <option value="abierta">Abierta</option>
                        <option value="en_gestion">En gestión</option>
                        <option value="cerrada">Cerrada</option>
                      </select>
                    </td>
                    <td>
                      <button class="om-del" @click="quitarFila(ficha.eventos_operativos, i)">
                        <i class="pi pi-trash" />
                      </button>
                    </td>
                  </tr>
                  <tr v-if="!ficha.eventos_operativos.length">
                    <td colspan="6" class="om-table-empty">Sin eventos operativos registrados.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button
              class="om-add-row"
              @click="
                agregarFila(ficha.eventos_operativos, {
                  codigo: `I-${String(ficha.eventos_operativos.length + 1).padStart(2, '0')}`,
                  descripcion: '',
                  causa_raiz: '',
                  accion_correctiva: '',
                  estado: 'abierta',
                })
              "
            >
              <i class="pi pi-plus" /> Agregar evento
            </button>
          </div>
        </section>

        <!-- ─ Pendientes (solo lectura, Inicio de Operación) ─ -->
        <section class="om-acc">
          <button class="om-acc-head" @click="toggle('pendientes')">
            <i :class="['pi', abierto.pendientes ? 'pi-chevron-down' : 'pi-chevron-right']" />
            <i class="pi pi-list om-acc-ico" /><span>Pendientes</span>
            <span class="om-acc-count">{{ detalle.pendientes.length }}</span>
          </button>
          <div v-show="abierto.pendientes" class="om-acc-body">
            <span class="om-ro-hint"
              ><i class="pi pi-flag" /> Vienen de Inicio de Operación — edítalos allí.</span
            >
            <div v-if="!detalle.pendientes.length" class="om-empty-mini">Sin pendientes.</div>
            <div v-for="(p, i) in detalle.pendientes" :key="i" class="om-pendiente-ro">
              <b>{{ p.descripcion || '—' }}</b>
              <span>{{ p.responsable || '—' }} · {{ p.estado || 'abierto' }}</span>
            </div>
          </div>
        </section>

        <!-- ─ Observaciones ─ -->
        <section class="om-acc">
          <button class="om-acc-head" @click="toggle('observaciones')">
            <i :class="['pi', abierto.observaciones ? 'pi-chevron-down' : 'pi-chevron-right']" />
            <i class="pi pi-eye om-acc-ico" /><span>Observaciones y Estado del Sistema</span>
          </button>
          <div v-show="abierto.observaciones" class="om-acc-body">
            <label class="om-field">
              <span>Observaciones generales</span>
              <textarea v-model="ficha.observaciones.generales" rows="4" @input="marcar" />
            </label>
            <label class="om-field" style="margin-top: 10px">
              <span>Factor pendiente (opcional)</span>
              <textarea v-model="ficha.observaciones.factor_pendiente" rows="2" @input="marcar" />
            </label>
          </div>
        </section>

        <!-- ─ Recomendaciones ─ -->
        <section class="om-acc">
          <button class="om-acc-head" @click="toggle('recomendaciones')">
            <i :class="['pi', abierto.recomendaciones ? 'pi-chevron-down' : 'pi-chevron-right']" />
            <i class="pi pi-thumbs-up om-acc-ico" /><span
              >Recomendaciones de Operación y Mantenimiento</span
            >
          </button>
          <div v-show="abierto.recomendaciones" class="om-acc-body">
            <ListaEditable
              v-model="ficha.recomendaciones"
              label=""
              placeholder="Ej. Verificación diaria del estado de comunicación…"
              @update:modelValue="marcar"
            />
          </div>
        </section>

        <!-- ─ Conclusión ─ -->
        <section class="om-acc">
          <button class="om-acc-head" @click="toggle('conclusion')">
            <i :class="['pi', abierto.conclusion ? 'pi-chevron-down' : 'pi-chevron-right']" />
            <i class="pi pi-file-check om-acc-ico" /><span>Conclusión</span>
          </button>
          <div v-show="abierto.conclusion" class="om-acc-body">
            <textarea
              v-model="ficha.conclusion"
              rows="4"
              class="om-textarea-full"
              @input="marcar"
            />
          </div>
        </section>

        <!-- ─ Firmas ─ -->
        <section class="om-acc">
          <button class="om-acc-head" @click="toggle('firmas')">
            <i :class="['pi', abierto.firmas ? 'pi-chevron-down' : 'pi-chevron-right']" />
            <i class="pi pi-pencil om-acc-ico" /><span>Aceptación y Firmas</span>
          </button>
          <div v-show="abierto.firmas" class="om-acc-body">
            <div class="om-table-wrap">
              <table class="om-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Cargo</th>
                    <th style="width: 150px">Fecha</th>
                    <th style="width: 36px"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(f, i) in ficha.firmas" :key="i">
                    <td><input v-model="f.nombre" @input="marcar" /></td>
                    <td><input v-model="f.cargo" @input="marcar" /></td>
                    <td><input type="date" v-model="f.fecha" @change="marcar" /></td>
                    <td>
                      <button class="om-del" @click="quitarFila(ficha.firmas, i)">
                        <i class="pi pi-trash" />
                      </button>
                    </td>
                  </tr>
                  <tr v-if="!ficha.firmas.length">
                    <td colspan="4" class="om-table-empty">Sin firmantes.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button
              class="om-add-row"
              @click="agregarFila(ficha.firmas, { nombre: '', cargo: '', fecha: null })"
            >
              <i class="pi pi-plus" /> Agregar firmante
            </button>
          </div>
        </section>

        <!-- ─ Anexos: evidencia ─ -->
        <section class="om-acc">
          <button class="om-acc-head" @click="toggle('anexos')">
            <i :class="['pi', abierto.anexos ? 'pi-chevron-down' : 'pi-chevron-right']" />
            <i class="pi pi-images om-acc-ico" /><span>Anexos — Evidencia</span>
            <span class="om-acc-count">{{ detalle.evidencia_relacionada.length }}</span>
          </button>
          <div v-show="abierto.anexos" class="om-acc-body">
            <span class="om-ro-hint"
              ><i class="pi pi-flag" /> Es la misma evidencia ya subida en cada sección (Inversores,
              Frontera, Monitoreo, Estación Meteo, Reconectador) y en Arquitectura de Comunicación
              arriba — se muestra junta aquí para el informe.</span
            >
            <div v-if="!detalle.evidencia_relacionada.length" class="om-empty-mini">
              Sin evidencia subida todavía.
            </div>
            <div v-for="(ev, i) in detalle.evidencia_relacionada" :key="i" class="om-anexo-row">
              <span class="om-anexo-seccion">{{ ev.seccion }}</span>
              <a :href="ev.url" target="_blank" rel="noopener" class="om-anexo-link"
                ><i class="pi pi-paperclip" /> {{ ev.nombre }}</a
              >
            </div>
          </div>
        </section>

        <div style="height: 14px" />
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/client'
import EvidenciaUploader from '@/components/EvidenciaUploader.vue'
import ListaEditable from '@/components/ListaEditable.vue'

const router = useRouter()

const proyectos = ref([])
const loadingLista = ref(false)
const busqueda = ref('')

const seleccion = ref(null)
const detalle = reactive({
  proyecto: {},
  kpis: {
    pruebas_ejecutadas: 0,
    pruebas_conformes: 0,
    pruebas_no_conformes: 0,
    eventos_total: 0,
    eventos_cerrados: 0,
    eventos_en_gestion: 0,
    estado_global: 'operativo',
  },
  inversores: [],
  pendientes: [],
  evidencia_relacionada: [],
  fecha_energizacion: null,
  fecha_inicio_operacion: null,
  empresa_contratista: null,
  fusion_solar_estado: null,
  frontera_estado: null,
  estacion_meteo_estado: null,
  reconectador_estado: null,
})
const ficha = reactive(fichaVacia())
const loadingFicha = ref(false)
const guardando = ref(false)
const exportandoPdf = ref(false)
const generandoInforme = ref(false)
const dirty = ref(false)
const abierto = reactive({
  objetivo: true,
  generales: true,
  inversores: false,
  sistemas: false,
  arquitectura: false,
  equipos: false,
  variables: false,
  config: false,
  pruebas: true,
  eventos: true,
  pendientes: false,
  observaciones: true,
  recomendaciones: false,
  conclusion: false,
  firmas: false,
  anexos: true,
})

function fichaVacia() {
  return {
    version: '',
    elaborado_por: 'Operaciones Unergy',
    actividad: '',
    objetivo_alcance: { objetivo: '', alcance_items: [] },
    datos_generales: {
      seguidores_marca: '',
      medida_comercial_marca: '',
      medida_comercial_modelo: '',
      plataformas_monitoreo: [],
      responsable_nombre: '',
      responsable_email: '',
    },
    arquitectura_comunicacion: {
      enlace_principal: '',
      enlaces_celulares: '',
      concentrador_datos: '',
      destino_datos: '',
      sincronizacion_horaria: '',
    },
    equipos: [],
    variables_monitoreadas: [],
    configuracion_monitoreo: { notificaciones: [], umbrales_alarma: [], politicas_datos: [] },
    protocolo_pruebas: [],
    eventos_operativos: [],
    observaciones: { generales: '', factor_pendiente: '' },
    recomendaciones: [],
    conclusion: '',
    firmas: [],
    evidencia_arquitectura: [],
  }
}

const proyectosFiltrados = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  if (!q) return proyectos.value
  return proyectos.value.filter((p) => (p.nombre_comercial || '').toLowerCase().includes(q))
})

async function cargarLista() {
  loadingLista.value = true
  try {
    const { data } = await api.get('/informe-om/proyectos')
    proyectos.value = data
  } catch {
    proyectos.value = []
  } finally {
    loadingLista.value = false
  }
}

async function abrir(id) {
  seleccion.value = id
  loadingFicha.value = true
  dirty.value = false
  try {
    const { data } = await api.get(`/informe-om/${id}`)
    Object.assign(detalle, data)
    const base = fichaVacia()
    Object.assign(ficha, base, data.ficha, {
      objetivo_alcance: { ...base.objetivo_alcance, ...data.ficha.objetivo_alcance },
      datos_generales: { ...base.datos_generales, ...data.ficha.datos_generales },
      arquitectura_comunicacion: {
        ...base.arquitectura_comunicacion,
        ...data.ficha.arquitectura_comunicacion,
      },
      configuracion_monitoreo: {
        notificaciones: data.ficha.configuracion_monitoreo?.notificaciones || [],
        umbrales_alarma: data.ficha.configuracion_monitoreo?.umbrales_alarma || [],
        politicas_datos: data.ficha.configuracion_monitoreo?.politicas_datos || [],
      },
      observaciones: { ...base.observaciones, ...data.ficha.observaciones },
    })
  } catch {
    window.__primeToast?.({
      severity: 'error',
      summary: 'No se pudo cargar el informe',
      life: 3000,
    })
    seleccion.value = null
  } finally {
    loadingFicha.value = false
  }
}

function cerrar() {
  if (dirty.value && !confirm('Tienes cambios sin guardar. ¿Salir de todos modos?')) return
  seleccion.value = null
}

async function guardar() {
  guardando.value = true
  try {
    const { data } = await api.put(`/informe-om/${seleccion.value}`, ficha)
    Object.assign(detalle, data)
    dirty.value = false
    window.__primeToast?.({ severity: 'success', summary: 'Informe guardado', life: 2000 })
    cargarLista()
  } catch (e) {
    window.__primeToast?.({
      severity: 'error',
      summary: 'No se pudo guardar',
      detail: e.response?.data?.detail,
      life: 3500,
    })
  } finally {
    guardando.value = false
  }
}

async function descargarPdf() {
  exportandoPdf.value = true
  try {
    const { jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')
    const { slugify } = await import('../MEM/cumplimientoAnualExport.js')

    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const marginX = 40
    let y = 90

    doc.setFillColor(44, 32, 57)
    doc.rect(0, 0, pageW, 64, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text('UNERGY', marginX, 30)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text('Informe de Puesta en Marcha · Sistema de monitoreo', marginX, 47)

    function checkSpace(needed) {
      if (y + needed > pageH - 50) {
        doc.addPage()
        y = 40
      }
    }
    function sectionTitle(text) {
      checkSpace(30)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(110, 63, 184)
      doc.text(text, marginX, y)
      y += 16
    }
    function paragraph(text) {
      if (!text) return
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9.5)
      doc.setTextColor(44, 32, 57)
      const lines = doc.splitTextToSize(text, pageW - marginX * 2)
      checkSpace(lines.length * 12 + 6)
      doc.text(lines, marginX, y)
      y += lines.length * 12 + 10
    }
    function bullets(items) {
      const list = (items || []).filter(Boolean)
      if (!list.length) return
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9.5)
      doc.setTextColor(44, 32, 57)
      for (const item of list) {
        const lines = doc.splitTextToSize('• ' + item, pageW - marginX * 2 - 10)
        checkSpace(lines.length * 12 + 2)
        doc.text(lines, marginX + 6, y)
        y += lines.length * 12 + 2
      }
      y += 8
    }
    function tabla(head, body) {
      if (!body.length) {
        paragraph('Sin registros.')
        return
      }
      checkSpace(40)
      autoTable(doc, {
        startY: y,
        margin: { left: marginX, right: marginX },
        head: [head],
        body,
        headStyles: { fillColor: [145, 91, 216], textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
        styles: { fontSize: 8.5, cellPadding: 4 },
        theme: 'grid',
      })
      y = doc.lastAutoTable.finalY + 16
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(15)
    doc.setTextColor(44, 32, 57)
    doc.text(detalle.proyecto.nombre_comercial || '', marginX, y)
    y += 18
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(122, 110, 138)
    doc.text(
      [ubicacion.value, fmtCapacidad(detalle.proyecto.potencia_instalada_kwp)]
        .filter(Boolean)
        .join(' · '),
      marginX,
      y,
    )
    y += 14
    doc.text(
      `Versión: ${ficha.version || '—'}  ·  Elaborado por: ${ficha.elaborado_por || '—'}  ·  Puesta en marcha: ${fmtFecha(detalle.fecha_inicio_operacion) || '—'}`,
      marginX,
      y,
    )
    y += 22

    const k = detalle.kpis
    const semColor = k.estado_global === 'atencion' ? [253, 246, 178] : [220, 252, 231]
    const semText = k.estado_global === 'atencion' ? [146, 64, 14] : [21, 128, 61]
    checkSpace(44)
    doc.setFillColor(...semColor)
    doc.roundedRect(marginX, y, pageW - marginX * 2, 34, 4, 4, 'F')
    doc.setTextColor(...semText)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10.5)
    doc.text(
      `${k.estado_global === 'atencion' ? 'ATENCIÓN' : 'OPERATIVO'} — Pruebas ${k.pruebas_conformes}/${k.pruebas_ejecutadas} conformes · No conformidades ${k.pruebas_no_conformes} · Eventos ${k.eventos_total} (${k.eventos_cerrados} cerrado(s))`,
      marginX + 10,
      y + 21,
    )
    y += 50

    sectionTitle('1. Objetivo y Alcance')
    paragraph(ficha.objetivo_alcance.objetivo)
    bullets(ficha.objetivo_alcance.alcance_items)

    sectionTitle('2. Datos Generales')
    paragraph(
      `Fecha de energización: ${fmtFecha(detalle.fecha_energizacion) || '—'}   ·   Empresa contratista: ${detalle.empresa_contratista || '—'}`,
    )
    paragraph(
      `Seguidores solares: ${ficha.datos_generales.seguidores_marca || '—'}   ·   Medida comercial: ${[ficha.datos_generales.medida_comercial_marca, ficha.datos_generales.medida_comercial_modelo].filter(Boolean).join(' ') || '—'}`,
    )
    paragraph(
      `Plataformas de monitoreo: ${(ficha.datos_generales.plataformas_monitoreo || []).filter(Boolean).join(', ') || '—'}`,
    )
    paragraph(
      `Responsable: ${ficha.datos_generales.responsable_nombre || '—'} (${ficha.datos_generales.responsable_email || '—'})`,
    )

    sectionTitle('3. Configuración de Inversores')
    tabla(
      ['Inversor', 'Potencia', 'Estado'],
      detalle.inversores.map((i) => [
        i.nombre,
        fmtCapacidad(i.potencia_nominal_kw),
        i.state || '—',
      ]),
    )

    sectionTitle('4. Estado de Sistemas')
    const estLbl = (v) => (v === 'aprobado' ? 'Aprobado' : 'Pendiente')
    paragraph(
      `Fusion Solar: ${estLbl(detalle.fusion_solar_estado)}   ·   Frontera: ${estLbl(detalle.frontera_estado)}   ·   Estación meteo: ${estLbl(detalle.estacion_meteo_estado)}   ·   Reconectador: ${estLbl(detalle.reconectador_estado)}`,
    )

    sectionTitle('5. Arquitectura de Comunicación')
    const ac = ficha.arquitectura_comunicacion
    paragraph(
      `Enlace principal: ${ac.enlace_principal || '—'}   ·   Enlaces celulares: ${ac.enlaces_celulares || '—'}`,
    )
    paragraph(
      `Concentrador de datos: ${ac.concentrador_datos || '—'}   ·   Destino de los datos: ${ac.destino_datos || '—'}`,
    )
    paragraph(`Sincronización horaria: ${ac.sincronizacion_horaria || '—'}`)

    sectionTitle('6. Equipos Integrados')
    tabla(
      ['Descripción', 'Marca', 'Cant.', 'Ubicación', 'N.º serie'],
      ficha.equipos.map((e) => [e.descripcion, e.marca, e.cantidad, e.ubicacion, e.numero_serie]),
    )

    sectionTitle('7. Variables Monitoreadas')
    tabla(
      ['Variable', 'Unidad', 'Fuente', 'Registro', 'Plataforma'],
      ficha.variables_monitoreadas.map((v) => [
        v.variable,
        v.unidad,
        v.fuente,
        v.registro,
        v.plataforma,
      ]),
    )

    sectionTitle('8. Configuración del Monitoreo')
    paragraph('Usuarios y destinatarios de notificación:')
    tabla(
      ['Rol', 'Nombre', 'Canal', 'Alcance'],
      ficha.configuracion_monitoreo.notificaciones.map((n) => [
        n.rol,
        n.nombre,
        n.canal,
        n.alcance,
      ]),
    )
    paragraph('Umbrales de alarma:')
    tabla(
      ['Evento', 'Condición', 'Notificación', 'Destinatarios'],
      ficha.configuracion_monitoreo.umbrales_alarma.map((u) => [
        u.evento,
        u.condicion,
        u.notificacion,
        u.destinatarios,
      ]),
    )
    bullets(ficha.configuracion_monitoreo.politicas_datos)

    sectionTitle('9. Protocolo de Pruebas y Resultados')
    tabla(
      ['Código', 'Prueba', 'Criterio', 'Resultado', 'Observación'],
      ficha.protocolo_pruebas.map((p) => [
        p.codigo,
        p.prueba,
        p.criterio_aceptacion,
        p.resultado === 'conforme'
          ? 'Conforme'
          : p.resultado === 'no_conforme'
            ? 'No conforme'
            : p.resultado || '—',
        p.observacion,
      ]),
    )

    sectionTitle('10. Eventos Operativos y Acciones Correctivas')
    tabla(
      ['Código', 'Descripción', 'Causa raíz', 'Acción correctiva', 'Estado'],
      ficha.eventos_operativos.map((e) => [
        e.codigo,
        e.descripcion,
        e.causa_raiz,
        e.accion_correctiva,
        e.estado,
      ]),
    )

    sectionTitle('11. Pendientes')
    tabla(
      ['Descripción', 'Responsable', 'Estado'],
      detalle.pendientes.map((p) => [p.descripcion, p.responsable, p.estado || 'abierto']),
    )

    sectionTitle('12. Observaciones y Estado del Sistema')
    paragraph(ficha.observaciones.generales)
    if (ficha.observaciones.factor_pendiente)
      paragraph('Factor pendiente: ' + ficha.observaciones.factor_pendiente)

    sectionTitle('13. Recomendaciones de Operación y Mantenimiento')
    bullets(ficha.recomendaciones)

    sectionTitle('14. Conclusión')
    paragraph(ficha.conclusion)

    sectionTitle('15. Aceptación y Firmas')
    tabla(
      ['Nombre', 'Cargo', 'Fecha'],
      ficha.firmas.map((f) => [f.nombre, f.cargo, fmtFecha(f.fecha) || '—']),
    )

    sectionTitle('16. Anexos — Evidencia')
    if (!detalle.evidencia_relacionada.length) {
      paragraph('Sin evidencia subida todavía.')
    } else {
      for (const ev of detalle.evidencia_relacionada) {
        checkSpace(14)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8.5)
        doc.setTextColor(107, 90, 138)
        doc.text(`${ev.seccion}:`, marginX, y)
        const labelW = doc.getTextWidth(`${ev.seccion}: `)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(110, 63, 184)
        doc.textWithLink(ev.nombre, marginX + labelW, y, { url: ev.url })
        y += 13
      }
      y += 8
    }

    const pageCount = doc.internal.getNumberOfPages()
    const fechaGen = new Date().toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p)
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text(`Generado el ${fechaGen} · Unergy`, marginX, pageH - 20)
      doc.text(`Página ${p} de ${pageCount}`, pageW - marginX - 60, pageH - 20)
    }

    const slug = slugify(detalle.proyecto.nombre_comercial || 'informe').toLowerCase()
    doc.save(`informe_puesta_en_marcha_${slug}.pdf`)
  } catch (e) {
    console.error('Error exportando informe a PDF', e)
    window.__primeToast?.({ severity: 'error', summary: 'No se pudo generar el PDF', life: 3500 })
  } finally {
    exportandoPdf.value = false
  }
}

// ── Generar informe (documento editable, mismo flujo que Informes Mensuales) ─
const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  )
function unergyLogoSVG() {
  return '<svg width="38" height="31" viewBox="0 0 44 36" fill="none"><circle cx="22" cy="4" r="3" fill="white"/><path d="M8 10 L8 24 Q8 34 22 34 Q36 34 36 24 L36 10" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/></svg>'
}
function rmeta(lbl, val) {
  return `<div class="rpt-meta-item"><div class="rpt-meta-lbl">${esc(lbl)}</div><div class="rpt-meta-val">${esc(val ?? '—')}</div></div>`
}
function rkpi(ico, lbl, val, col) {
  return `<div class="rpt-kpi"><div class="rpt-kpi-ico">${ico}</div><div class="rpt-kpi-lbl">${esc(lbl)}</div><div class="rpt-kpi-val"${col ? ` style="color:${col}"` : ''}>${esc(val)}</div></div>`
}
function rTabla(head, rows, vacio) {
  if (!rows.length) return `<div class="rpt-chart-empty">${esc(vacio)}</div>`
  return (
    '<table class="rpt-table"><thead><tr>' +
    head.map((h) => `<th>${esc(h)}</th>`).join('') +
    '</tr></thead><tbody>' +
    rows
      .map((r) => '<tr>' + r.map((c) => `<td>${esc(c ?? '—')}</td>`).join('') + '</tr>')
      .join('') +
    '</tbody></table>'
  )
}
function rSeccion(n, titulo, contenido) {
  return `<div class="rpt-section"><div class="rpt-section-title">▌ ${n}. ${esc(titulo)}</div>${contenido}</div>`
}
function rParrafo(texto) {
  return texto
    ? `<p style="font-size:12px;color:#333;line-height:1.5;margin:4px 0">${esc(texto)}</p>`
    : ''
}
function rLista(items) {
  const list = (items || []).filter(Boolean)
  if (!list.length) return ''
  return (
    '<ul style="margin:4px 0;padding-left:18px;font-size:12px;color:#333;line-height:1.6">' +
    list.map((i) => `<li>${esc(i)}</li>`).join('') +
    '</ul>'
  )
}

function construirHtmlInforme() {
  const k = detalle.kpis
  const estLbl = (v) => (v === 'aprobado' ? 'Aprobado' : 'Pendiente')
  const semColor = k.estado_global === 'atencion' ? '#F97316' : '#4ADE80'

  let html = '<div class="rpt-page">'
  html += '<div class="rpt-header">'
  html +=
    '<div style="display:flex;align-items:center;gap:13px">' +
    unergyLogoSVG() +
    '<div><div style="color:#fff;font-size:14px;font-weight:800;letter-spacing:.8px">INFORME DE PUESTA EN MARCHA · UNERGY ENERGÍA DIGITAL S.A.S ESP</div>' +
    '<div style="color:#6B5F80;font-size:10px;letter-spacing:.6px;margin-top:2px">Sistema de monitoreo y adquisición de datos</div></div></div>'
  html += `<div class="rpt-meta-grid">${rmeta('PROYECTO', detalle.proyecto.nombre_comercial)}${rmeta('UBICACIÓN', ubicacion.value)}${rmeta('POTENCIA AC INSTALADA', fmtCapacidad(detalle.proyecto.potencia_instalada_kwp))}</div>`
  html += '</div>'

  html +=
    '<div class="rpt-kpi-row">' +
    rkpi('✅', 'Pruebas ejecutadas', k.pruebas_ejecutadas, null) +
    rkpi('🏆', 'Conformes', k.pruebas_conformes, '#4ADE80') +
    rkpi(
      '⚠️',
      'No conformidades',
      k.pruebas_no_conformes,
      k.pruebas_no_conformes > 0 ? '#FF5757' : null,
    ) +
    rkpi('⚡', 'Eventos registrados', k.eventos_total, k.eventos_total > 0 ? '#F97316' : null) +
    '</div>'

  html +=
    `<div class="rpt-status-box" style="margin-top:10px"><div class="rpt-status-row" style="font-weight:800;color:${semColor}">${k.estado_global === 'atencion' ? '⚠️ ATENCIÓN' : '✅ OPERATIVO'} — Con seguimiento activo</div>` +
    `<div class="rpt-status-row">Pruebas: ${k.pruebas_conformes}/${k.pruebas_ejecutadas} conformes</div>` +
    `<div class="rpt-status-row">Eventos: ${k.eventos_total} (${k.eventos_cerrados} cerrado(s), ${k.eventos_en_gestion} en gestión)</div></div>`

  html += rSeccion(
    1,
    'Objetivo y Alcance',
    rParrafo(ficha.objetivo_alcance.objetivo) + rLista(ficha.objetivo_alcance.alcance_items),
  )

  html += rSeccion(
    2,
    'Datos Generales',
    rParrafo(
      `Fecha de energización: ${fmtFecha(detalle.fecha_energizacion) || '—'}   ·   Empresa contratista: ${detalle.empresa_contratista || '—'}`,
    ) +
      rParrafo(
        `Seguidores solares: ${ficha.datos_generales.seguidores_marca || '—'}   ·   Medida comercial: ${[ficha.datos_generales.medida_comercial_marca, ficha.datos_generales.medida_comercial_modelo].filter(Boolean).join(' ') || '—'}`,
      ) +
      rParrafo(
        `Plataformas de monitoreo: ${(ficha.datos_generales.plataformas_monitoreo || []).filter(Boolean).join(', ') || '—'}`,
      ) +
      rParrafo(
        `Responsable: ${ficha.datos_generales.responsable_nombre || '—'} (${ficha.datos_generales.responsable_email || '—'})`,
      ),
  )

  html += rSeccion(
    3,
    'Configuración de Inversores',
    rTabla(
      ['Inversor', 'Potencia', 'Estado'],
      detalle.inversores.map((i) => [i.nombre, fmtCapacidad(i.potencia_nominal_kw), i.state]),
      'Sin inversores.',
    ),
  )

  html += rSeccion(
    4,
    'Estado de Sistemas',
    rParrafo(
      `Fusion Solar: ${estLbl(detalle.fusion_solar_estado)}   ·   Frontera: ${estLbl(detalle.frontera_estado)}   ·   Estación meteo: ${estLbl(detalle.estacion_meteo_estado)}   ·   Reconectador: ${estLbl(detalle.reconectador_estado)}`,
    ),
  )

  const ac = ficha.arquitectura_comunicacion
  html += rSeccion(
    5,
    'Arquitectura de Comunicación',
    rParrafo(
      `Enlace principal: ${ac.enlace_principal || '—'}   ·   Enlaces celulares: ${ac.enlaces_celulares || '—'}`,
    ) +
      rParrafo(
        `Concentrador de datos: ${ac.concentrador_datos || '—'}   ·   Destino de los datos: ${ac.destino_datos || '—'}`,
      ) +
      rParrafo(`Sincronización horaria: ${ac.sincronizacion_horaria || '—'}`),
  )

  html += rSeccion(
    6,
    'Equipos Integrados',
    rTabla(
      ['Descripción', 'Marca', 'Cant.', 'Ubicación', 'N.º serie'],
      ficha.equipos.map((e) => [e.descripcion, e.marca, e.cantidad, e.ubicacion, e.numero_serie]),
      'Sin equipos registrados.',
    ),
  )

  html += rSeccion(
    7,
    'Variables Monitoreadas',
    rTabla(
      ['Variable', 'Unidad', 'Fuente', 'Registro', 'Plataforma'],
      ficha.variables_monitoreadas.map((v) => [
        v.variable,
        v.unidad,
        v.fuente,
        v.registro,
        v.plataforma,
      ]),
      'Sin variables registradas.',
    ),
  )

  html += rSeccion(
    8,
    'Configuración del Monitoreo',
    '<div style="font-size:11px;font-weight:700;color:#555;margin:6px 0 2px">Usuarios y destinatarios de notificación</div>' +
      rTabla(
        ['Rol', 'Nombre', 'Canal', 'Alcance'],
        ficha.configuracion_monitoreo.notificaciones.map((n) => [
          n.rol,
          n.nombre,
          n.canal,
          n.alcance,
        ]),
        'Sin destinatarios.',
      ) +
      '<div style="font-size:11px;font-weight:700;color:#555;margin:10px 0 2px">Umbrales de alarma</div>' +
      rTabla(
        ['Evento', 'Condición', 'Notificación', 'Destinatarios'],
        ficha.configuracion_monitoreo.umbrales_alarma.map((u) => [
          u.evento,
          u.condicion,
          u.notificacion,
          u.destinatarios,
        ]),
        'Sin umbrales.',
      ) +
      rLista(ficha.configuracion_monitoreo.politicas_datos),
  )

  html += rSeccion(
    9,
    'Protocolo de Pruebas y Resultados',
    rTabla(
      ['Código', 'Prueba', 'Criterio', 'Resultado', 'Observación'],
      ficha.protocolo_pruebas.map((p) => [
        p.codigo,
        p.prueba,
        p.criterio_aceptacion,
        p.resultado === 'conforme'
          ? 'Conforme'
          : p.resultado === 'no_conforme'
            ? 'No conforme'
            : p.resultado || '—',
        p.observacion,
      ]),
      'Sin pruebas registradas.',
    ),
  )

  html += rSeccion(
    10,
    'Eventos Operativos y Acciones Correctivas',
    rTabla(
      ['Código', 'Descripción', 'Causa raíz', 'Acción correctiva', 'Estado'],
      ficha.eventos_operativos.map((e) => [
        e.codigo,
        e.descripcion,
        e.causa_raiz,
        e.accion_correctiva,
        e.estado,
      ]),
      'Sin eventos operativos registrados.',
    ),
  )

  html += rSeccion(
    11,
    'Pendientes',
    rTabla(
      ['Descripción', 'Responsable', 'Estado'],
      detalle.pendientes.map((p) => [p.descripcion, p.responsable, p.estado || 'abierto']),
      'Sin pendientes.',
    ),
  )

  html += rSeccion(
    12,
    'Observaciones y Estado del Sistema',
    '<div class="rpt-obs-title">OBSERVACIONES GENERALES <span class="rpt-edit-hint">✏️ clic para editar</span></div>' +
      `<div class="rpt-obs-text rpt-obs-editable" contenteditable="true" data-obs="generales">${esc(ficha.observaciones.generales || '')}</div>` +
      (ficha.observaciones.factor_pendiente
        ? rParrafo('Factor pendiente: ' + ficha.observaciones.factor_pendiente)
        : ''),
  )

  html += rSeccion(
    13,
    'Recomendaciones de Operación y Mantenimiento',
    rLista(ficha.recomendaciones),
  )
  html += rSeccion(14, 'Conclusión', rParrafo(ficha.conclusion))
  html += rSeccion(
    15,
    'Aceptación y Firmas',
    rTabla(
      ['Nombre', 'Cargo', 'Fecha'],
      ficha.firmas.map((f) => [f.nombre, f.cargo, fmtFecha(f.fecha)]),
      'Sin firmantes.',
    ),
  )

  html += rSeccion(
    16,
    'Anexos — Evidencia',
    detalle.evidencia_relacionada.length
      ? '<ul style="margin:4px 0;padding-left:18px;font-size:12px;line-height:1.7">' +
          detalle.evidencia_relacionada
            .map(
              (ev) =>
                `<li><b>${esc(ev.seccion)}:</b> <a href="${ev.url}" target="_blank" rel="noopener">${esc(ev.nombre)}</a></li>`,
            )
            .join('') +
          '</ul>'
      : '<div class="rpt-chart-empty">Sin evidencia subida todavía.</div>',
  )

  html += '</div>'
  return html
}

async function generarInforme() {
  generandoInforme.value = true
  try {
    const html_content = construirHtmlInforme()
    const payload = {
      tipo: 'pm',
      sub_project: detalle.proyecto.sub_project || detalle.proyecto.nombre_comercial,
      periodo_desde: '2000-01-01',
      periodo_hasta: '2099-12-31',
      periodo_display: 'Puesta en marcha',
      proyecto_nombre: detalle.proyecto.nombre_comercial,
      html_content,
    }
    const { data } = await api.post('/informes/', payload)
    router.push(`/informes/${data.id}`)
  } catch (e) {
    window.__primeToast?.({
      severity: 'error',
      summary: 'No se pudo generar el informe',
      detail: e.response?.data?.detail,
      life: 3500,
    })
  } finally {
    generandoInforme.value = false
  }
}

function marcar() {
  dirty.value = true
}
function toggle(k) {
  abierto[k] = !abierto[k]
}
function mostrarError(msg) {
  window.__primeToast?.({ severity: 'error', summary: msg, life: 3500 })
}
function agregarFila(lista, plantilla) {
  lista.push({ ...plantilla })
  marcar()
}
function quitarFila(lista, i) {
  lista.splice(i, 1)
  marcar()
}

const capacidadTotal = computed(() =>
  detalle.inversores.reduce((s, i) => s + (Number(i.potencia_nominal_kw) || 0), 0),
)
const ubicacion = computed(() =>
  [detalle.proyecto.municipio, detalle.proyecto.departamento, detalle.proyecto.direccion_vereda]
    .filter(Boolean)
    .join(', '),
)

function fmtCapacidad(kwp) {
  const n = Number(kwp)
  if (!n) return '—'
  return n >= 1000 ? (n / 1000).toFixed(2) + ' MW' : n.toLocaleString('es-CO') + ' kW'
}
function fmtFecha(iso) {
  if (!iso) return null
  const d = new Date(iso + 'T00:00:00')
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

onMounted(cargarLista)
</script>

<style scoped>
.om-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  color: #2c2039;
}

/* ── Lista ── */
.om-list-wrap {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
}
.om-list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 2px 14px;
}
.om-title {
  font-size: 17px;
  font-weight: 800;
  margin: 0;
}
.om-badge {
  background: #f3edfb;
  color: #6e3fb8;
  font-size: 12px;
  font-weight: 800;
  padding: 1px 9px;
  border-radius: 9px;
}
.om-icon-btn {
  width: 34px;
  height: 34px;
  border: 1px solid #e5e7eb;
  border-radius: 9px;
  background: #fff;
  color: #6b5a8a;
}
.om-icon-btn:disabled {
  opacity: 0.5;
}
.om-search {
  display: flex;
  align-items: center;
  gap: 9px;
  background: #f5f3fa;
  border: 1px solid #eceaf2;
  border-radius: 12px;
  padding: 10px 14px;
  margin-bottom: 14px;
}
.om-search .pi {
  color: #9ca3af;
}
.om-search input {
  flex: 1;
  border: none;
  background: none;
  outline: none;
  font-size: 15px;
  color: #2c2039;
}
.om-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 50px 20px;
  color: #6b5a8a;
  font-size: 15px;
}
.om-state .pi-spinner {
  font-size: 24px;
  color: #915bd8;
}
.om-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
  overflow-y: auto;
  padding-bottom: 8px;
}
.om-card {
  text-align: left;
  background: #fff;
  border: 1px solid #eceaf2;
  border-radius: 14px;
  padding: 14px;
  cursor: pointer;
  transition:
    box-shadow 0.15s,
    transform 0.1s;
}
.om-card:hover {
  box-shadow: 0 6px 18px rgba(145, 91, 216, 0.15);
  transform: translateY(-1px);
}
.om-card-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.om-card-name {
  flex: 1;
  font-size: 14.5px;
  font-weight: 700;
  color: #2c2039;
  line-height: 1.25;
}
.om-card-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12.5px;
  color: #6b5a8a;
}
.om-card-meta .pi {
  font-size: 11px;
  color: #915bd8;
  margin-right: 4px;
}

.om-chip {
  font-size: 10.5px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 7px;
  flex-shrink: 0;
}
.om-chip--operativo {
  background: #dcfce7;
  color: #15803d;
}
.om-chip--atencion {
  background: #fef3c7;
  color: #92400e;
}
.om-chip--new {
  background: #e5e7eb;
  color: #4b5563;
}

/* ── Detalle ── */
.om-detail {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}
.om-detail-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  position: sticky;
  top: 0;
  background: #f8f7fb;
  padding: 4px 0 10px;
  z-index: 5;
}
.om-back {
  display: flex;
  align-items: center;
  gap: 7px;
  border: none;
  background: none;
  color: #6e3fb8;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}
.om-detail-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.om-dirty {
  font-size: 12px;
  color: #d97706;
  font-weight: 600;
}
.om-save {
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: #915bd8;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  padding: 9px 18px;
  border-radius: 10px;
  cursor: pointer;
}
.om-save:disabled {
  opacity: 0.45;
  cursor: default;
}
.om-pdf,
.om-generar {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1.5px solid #d9cdf0;
  background: #fff;
  color: #6e3fb8;
  font-size: 14px;
  font-weight: 700;
  padding: 9px 16px;
  border-radius: 10px;
  cursor: pointer;
}
.om-pdf:hover,
.om-generar:hover {
  background: #f3edfb;
}
.om-pdf:disabled,
.om-generar:disabled {
  opacity: 0.5;
  cursor: default;
}

.om-hero {
  background: #2c2039;
  color: #fff;
  border-radius: 16px;
  padding: 18px 20px;
  margin-bottom: 14px;
}
.om-hero-title h1 {
  font-size: 20px;
  font-weight: 800;
  margin: 0;
}
.om-hero-sub {
  font-size: 12px;
  color: #b9a8d8;
}
.om-hero-facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 14px;
  margin-top: 14px;
}
.om-fact {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.om-fact-label {
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #b9a8d8;
}
.om-fact-val {
  font-size: 14px;
  font-weight: 600;
}
.om-fact-input {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 8px;
  padding: 6px 9px;
  color: #fff;
  font-size: 13px;
  outline: none;
}
.om-fact-input:focus {
  border-color: #f6ff72;
}

/* ── KPIs ── */
.om-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}
.om-kpi {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border: 1px solid #eceaf2;
  border-radius: 12px;
  padding: 12px 14px;
}
.om-kpi-ico {
  font-size: 20px;
  color: #915bd8;
}
.om-kpi--ok .om-kpi-ico {
  color: #16a34a;
}
.om-kpi--warn .om-kpi-ico {
  color: #d97706;
}
.om-kpi-val {
  display: block;
  font-size: 19px;
  font-weight: 800;
  color: #2c2039;
}
.om-kpi-label {
  display: block;
  font-size: 11px;
  color: #9b8db5;
  font-weight: 600;
}

/* ── Semáforo ── */
.om-semaforo {
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 14px;
  border: 1.5px solid;
}
.om-semaforo--operativo {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #15803d;
}
.om-semaforo--atencion {
  background: #fffbeb;
  border-color: #fde68a;
  color: #92400e;
}
.om-semaforo-top {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
  font-size: 14px;
  margin-bottom: 8px;
}
.om-semaforo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 4px 14px;
  font-size: 12.5px;
}

/* ── Acordeón ── */
.om-acc {
  background: #fff;
  border: 1px solid #eceaf2;
  border-radius: 14px;
  margin-bottom: 12px;
  overflow: hidden;
}
.om-acc-head {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 14px 16px;
  border: none;
  background: #fff;
  font-size: 15px;
  font-weight: 700;
  color: #2c2039;
  cursor: pointer;
  text-align: left;
}
.om-acc-head > .pi:first-child {
  color: #9ca3af;
  font-size: 13px;
}
.om-acc-ico {
  color: #915bd8;
  font-size: 15px;
}
.om-acc-head span:first-of-type {
  flex: 1;
}
.om-acc-count {
  background: #f3edfb;
  color: #6e3fb8;
  font-size: 12px;
  font-weight: 800;
  padding: 1px 9px;
  border-radius: 8px;
}
.om-acc-body {
  padding: 4px 16px 16px;
  border-top: 1px solid #f3f0f7;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.om-empty-mini {
  padding: 10px 0;
  color: #9ca3af;
  font-size: 13px;
}

.om-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 600;
  color: #6b5a8a;
}
.om-field input,
.om-field textarea {
  padding: 9px 12px;
  border: 1.5px solid #e8e0f0;
  border-radius: 9px;
  font-size: 13.5px;
  color: #2c2039;
  outline: none;
  font-family: inherit;
}
.om-field input:focus,
.om-field textarea:focus {
  border-color: #915bd8;
}
.om-textarea-full {
  width: 100%;
  padding: 10px 12px;
  border: 1.5px solid #e8e0f0;
  border-radius: 9px;
  font-size: 13.5px;
  color: #2c2039;
  outline: none;
  font-family: inherit;
}
.om-fields-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}
.om-sub-label {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #9b8db5;
  display: block;
}

.om-readonly-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
  background: #f8f7fb;
  border-radius: 10px;
  padding: 10px 12px;
}
.om-ro-label {
  display: block;
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  color: #9b8db5;
}
.om-ro-val {
  display: block;
  font-size: 13.5px;
  font-weight: 600;
  color: #2c2039;
}
.om-ro-hint {
  font-size: 11.5px;
  color: #9b8db5;
  display: flex;
  align-items: center;
  gap: 5px;
}
.om-ro-hint .pi {
  color: #915bd8;
  font-size: 10px;
}

.om-sistemas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
}
.om-sistema-chip {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: #f8f7fb;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 12.5px;
  font-weight: 600;
  color: #6b5a8a;
}
.om-sistema-chip b {
  font-size: 13.5px;
}
.om-sistema-chip--aprobado b {
  color: #16a34a;
}
.om-sistema-chip--pendiente b {
  color: #d97706;
}

.om-pendiente-ro {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 0;
  border-bottom: 1px solid #f5f3f9;
  font-size: 13px;
}
.om-pendiente-ro:last-child {
  border-bottom: none;
}
.om-pendiente-ro span {
  font-size: 11.5px;
  color: #9b8db5;
}

.om-anexo-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 0;
  border-bottom: 1px solid #f5f3f9;
  font-size: 13px;
  flex-wrap: wrap;
}
.om-anexo-row:last-child {
  border-bottom: none;
}
.om-anexo-seccion {
  font-size: 11px;
  font-weight: 700;
  color: #6b5a8a;
  background: #f5f3fa;
  padding: 2px 9px;
  border-radius: 7px;
  flex-shrink: 0;
}
.om-anexo-link {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #6e3fb8;
  text-decoration: none;
  font-weight: 600;
}
.om-anexo-link:hover {
  text-decoration: underline;
}
.om-anexo-link .pi {
  font-size: 11px;
}

/* ── Tablas editables ── */
.om-table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.om-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.om-table th {
  text-align: left;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  color: #9b8db5;
  padding: 6px 6px;
  border-bottom: 1.5px solid #eceaf2;
}
.om-table td {
  padding: 5px 6px;
  border-bottom: 1px solid #f5f3f9;
  vertical-align: middle;
}
.om-table input,
.om-table select {
  width: 100%;
  border: 1px solid #e8e0f0;
  border-radius: 7px;
  padding: 7px 9px;
  font-size: 13px;
  color: #2c2039;
  outline: none;
  background: #fff;
}
.om-table input:focus,
.om-table select:focus {
  border-color: #915bd8;
}
.om-table-empty {
  text-align: center;
  color: #9ca3af;
  padding: 14px 0;
  font-size: 13px;
}
.om-del {
  border: none;
  background: #fef2f2;
  color: #b91c1c;
  border-radius: 7px;
  width: 30px;
  height: 30px;
  cursor: pointer;
}
.om-add-row {
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 7px;
  border: 1.5px dashed #cbb8e8;
  background: #faf8fd;
  color: #6e3fb8;
  font-size: 13.5px;
  font-weight: 700;
  padding: 9px 16px;
  border-radius: 10px;
  cursor: pointer;
}
</style>
