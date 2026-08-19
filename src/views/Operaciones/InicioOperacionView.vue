<template>
  <div class="io-page">
    <!-- ══ LISTA DE PROYECTOS ══════════════════════════════════════════════ -->
    <div v-if="!seleccion" class="io-list-wrap">
      <div class="io-list-head">
        <div class="flex items-center gap-2">
          <i class="pi pi-flag" style="color:#915BD8;font-size:16px" />
          <h2 class="io-title">Inicio de Operación</h2>
          <span class="io-badge">{{ proyectos.length }}</span>
        </div>
        <button class="io-icon-btn" :disabled="loadingLista" @click="cargarLista" title="Actualizar">
          <i :class="loadingLista ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'" />
        </button>
      </div>

      <div class="io-search">
        <i class="pi pi-search" />
        <input v-model="busqueda" placeholder="Buscar proyecto…" />
      </div>

      <div v-if="loadingLista" class="io-state"><i class="pi pi-spin pi-spinner" /> Cargando proyectos…</div>
      <div v-else-if="!proyectosFiltrados.length" class="io-state">
        <i class="pi pi-inbox" style="font-size:32px;color:#cbd5e1" />
        <span>{{ proyectos.length ? 'Sin resultados' : 'No hay minigranjas en operación con servicio de operación' }}</span>
      </div>

      <div v-else class="io-grid">
        <button v-for="p in proyectosFiltrados" :key="p.id" class="io-card" @click="abrir(p.id)">
          <div class="io-card-top">
            <span class="io-card-name">{{ p.nombre_comercial }}</span>
            <span v-if="p.tiene_ficha" class="io-card-tag" :style="progresoStyle(p.progreso_pct)">{{ p.progreso_pct }}%</span>
            <span v-else class="io-card-tag io-card-tag--new">Sin iniciar</span>
          </div>
          <div class="io-card-meta">
            <span v-if="p.municipio || p.departamento"><i class="pi pi-map-marker" /> {{ [p.municipio, p.departamento].filter(Boolean).join(', ') }}</span>
            <span v-if="p.potencia_instalada_kwp"><i class="pi pi-bolt" /> {{ fmtCapacidad(p.potencia_instalada_kwp) }}</span>
          </div>
          <div class="io-card-bar"><div class="io-card-bar-fill" :style="{ width: (p.tiene_ficha ? p.progreso_pct : 0) + '%' }" /></div>
        </button>
      </div>
    </div>

    <!-- ══ FICHA DE DETALLE (misma pantalla, no modal) ═════════════════════ -->
    <div v-else class="io-detail">
      <div v-if="loadingFicha" class="io-state"><i class="pi pi-spin pi-spinner" /> Cargando ficha…</div>

      <template v-else>
        <!-- Encabezado -->
        <div class="io-detail-head">
          <button class="io-back" @click="cerrar"><i class="pi pi-arrow-left" /> Proyectos</button>
          <div class="io-detail-actions">
            <span v-if="dirty" class="io-dirty">Cambios sin guardar</span>
            <button class="io-save" :disabled="guardando || !dirty" @click="guardar">
              <i :class="guardando ? 'pi pi-spin pi-spinner' : 'pi pi-check'" /> {{ guardando ? 'Guardando…' : 'Guardar' }}
            </button>
          </div>
        </div>

        <div class="io-hero">
          <h1 class="io-hero-name">{{ proyecto.nombre_comercial }}</h1>
          <div class="io-hero-facts">
            <div class="io-fact">
              <span class="io-fact-label">Empresa contratista</span>
              <input v-model="ficha.empresa_contratista" class="io-fact-input" placeholder="—" @input="marcar" />
            </div>
            <div class="io-fact">
              <span class="io-fact-label">Ubicación</span>
              <span class="io-fact-val">{{ ubicacion || '—' }}</span>
            </div>
            <div class="io-fact">
              <span class="io-fact-label">Potencia AC instalada</span>
              <span class="io-fact-val">{{ proyecto.potencia_instalada_kwp ? fmtCapacidad(proyecto.potencia_instalada_kwp) : '—' }}</span>
            </div>
          </div>
        </div>

        <!-- Progreso global checklist -->
        <div class="io-progress-card">
          <div class="io-progress-top">
            <span>Progreso de comisionamiento</span>
            <b>{{ progreso }}%</b>
          </div>
          <div class="io-progress-bar"><div class="io-progress-fill" :style="{ width: progreso + '%' }" /></div>
          <span class="io-progress-sub">Se actualiza automáticamente a medida que apruebas cada ítem</span>
        </div>

        <!-- ─ Sección 1: Checklist general ─ -->
        <section class="io-acc">
          <button class="io-acc-head" @click="toggle('general')">
            <i :class="['pi', abierto.general ? 'pi-chevron-down' : 'pi-chevron-right']" />
            <i class="pi pi-list-check io-acc-ico" />
            <span>Checklist general</span>
          </button>
          <div v-show="abierto.general" class="io-acc-body">
            <!-- Paneles -->
            <div class="io-row io-row--stack">
              <div class="io-row-top">
                <div class="io-row-label">Paneles solares</div>
                <div class="io-seg">
                  <button v-for="opt in ESTADOS_AP" :key="opt.value"
                    :class="['io-seg-btn', ficha.checklist.paneles.estado === opt.value && `io-seg-btn--${opt.value}`]"
                    @click="toggleEstado(ficha.checklist.paneles, opt.value)">{{ opt.label }}</button>
                </div>
              </div>
              <div class="io-subrow">
                <label class="io-inline-field">
                  <span>Cantidad de paneles</span>
                  <input type="number" min="0" v-model.number="ficha.checklist.paneles.cantidad" @input="marcar" placeholder="0" />
                </label>
                <input v-if="ficha.checklist.paneles.estado === 'pendiente'" class="io-nota" v-model="ficha.checklist.paneles.nota"
                  placeholder="¿Qué falta?" @input="marcar" />
              </div>
            </div>

            <!-- Trackers -->
            <div class="io-row io-row--stack">
              <div class="io-row-top">
                <div class="io-row-label">Trackers <span class="io-row-hint">Instalados, funcionando y alineados</span></div>
                <div class="io-seg">
                  <button v-for="opt in ESTADOS_AP" :key="opt.value"
                    :class="['io-seg-btn', ficha.checklist.tracker.estado === opt.value && `io-seg-btn--${opt.value}`]"
                    @click="toggleEstado(ficha.checklist.tracker, opt.value)">{{ opt.label }}</button>
                </div>
              </div>
              <input v-if="ficha.checklist.tracker.estado === 'pendiente'" class="io-nota" v-model="ficha.checklist.tracker.nota"
                placeholder="¿Qué falta?" @input="marcar" />
            </div>

            <!-- 8 ítems legado, sin cambios -->
            <div v-for="item in CHECKLIST_LEGADO" :key="item.key" class="io-row">
              <div class="io-row-label">
                {{ item.label }} <span v-if="item.ref" class="io-ref">{{ item.ref }}</span>
              </div>
              <div class="io-seg">
                <button v-for="opt in ESTADOS_LEGADO" :key="opt.value"
                  :class="['io-seg-btn', ficha.checklist[item.key] === opt.value && `io-seg-btn--${opt.value}`]"
                  @click="setLegado(item.key, opt.value)">{{ opt.label }}</button>
              </div>
            </div>
          </div>
        </section>

        <!-- ─ Sección 2: Inversores ─ -->
        <section class="io-acc">
          <button class="io-acc-head" @click="toggle('inversores')">
            <i :class="['pi', abierto.inversores ? 'pi-chevron-down' : 'pi-chevron-right']" />
            <i class="pi pi-bolt io-acc-ico" />
            <span>Inversores</span>
            <span class="io-acc-count">{{ inversores.length }} · {{ fmtCapacidad(capacidadTotal) }}</span>
          </button>
          <div v-show="abierto.inversores" class="io-acc-body">
            <div v-if="!inversores.length" class="io-empty-mini">Solenium no reporta inversores para este proyecto.</div>
            <div v-for="inv in inversores" :key="inv.id" class="io-inv-card">
              <div class="io-inv-head">
                <span class="io-inv-name">
                  {{ inv.nombre || `Inversor ${inv.id}` }}
                  <span v-if="inv.state" class="io-row-hint">{{ inv.state }}{{ inv.power_kw != null ? ` · ${inv.power_kw} kW` : '' }}</span>
                </span>
                <span class="io-inv-cap" v-if="inv.potencia_nominal_kw">{{ fmtCapacidad(inv.potencia_nominal_kw) }}</span>
              </div>

              <div class="io-row io-row--stack">
                <div class="io-row-top">
                  <div class="io-row-label">Revisión de strings</div>
                  <div class="io-seg">
                    <button v-for="opt in ESTADOS_AP" :key="opt.value"
                      :class="['io-seg-btn', inversorItem(inv.id).strings_estado === opt.value && `io-seg-btn--${opt.value}`]"
                      @click="toggleEstadoConEvidencia(inversorItem(inv.id), opt.value, { estadoField: 'strings_estado', evidenciaField: 'strings_evidencia' })">{{ opt.label }}</button>
                  </div>
                </div>
                <label class="io-inline-field">
                  <span>Cantidad de strings</span>
                  <input type="number" min="0" v-model.number="inversorItem(inv.id).cantidad_strings" @input="marcar" placeholder="0" />
                </label>
                <input v-if="inversorItem(inv.id).strings_estado === 'pendiente'" class="io-nota"
                  v-model="inversorItem(inv.id).strings_nota" placeholder="¿Qué falta?" @input="marcar" />
                <EvidenciaUploader :proyecto-id="seleccion" :seccion="`inversor:${inv.id}:strings`"
                  v-model="inversorItem(inv.id).strings_evidencia" @update:modelValue="marcar" @error="mostrarError" />
              </div>

              <div class="io-row">
                <div class="io-row-label">¿Inversor limitado?</div>
                <div class="io-seg">
                  <button :class="['io-seg-btn', inversorItem(inv.id).limitado === false && 'io-seg-btn--aprobado']"
                    @click="setLimitado(inv.id, false)">No</button>
                  <button :class="['io-seg-btn', inversorItem(inv.id).limitado === true && 'io-seg-btn--pend']"
                    @click="setLimitado(inv.id, true)">Sí</button>
                </div>
              </div>
              <input v-if="inversorItem(inv.id).limitado" class="io-nota" v-model="inversorItem(inv.id).motivo_limitacion"
                placeholder="¿Por qué está limitado?" @input="marcar" />
            </div>
          </div>
        </section>

        <!-- ─ Sección 3: Sistema de monitoreo (Fusion Solar, Frontera, Estación meteo, Reconectador) ─ -->
        <section class="io-acc">
          <button class="io-acc-head" @click="toggle('monitoreo')">
            <i :class="['pi', abierto.monitoreo ? 'pi-chevron-down' : 'pi-chevron-right']" />
            <i class="pi pi-desktop io-acc-ico" />
            <span>Sistema de monitoreo</span>
          </button>
          <div v-show="abierto.monitoreo" class="io-acc-body">
            <!-- Fusion Solar (se deriva de Starlink + Datos coherentes + inversores) -->
            <div class="io-inv-card">
              <div class="io-inv-head">
                <span class="io-inv-name">Fusion Solar <span class="io-row-hint">Aprueba cuando Starlink y Datos coherentes están aprobados, ningún inversor está limitado, y hay evidencia</span></span>
                <span class="io-calc-chip" :class="`io-calc-chip--${fusionSolarEstado}`">{{ fusionSolarEstado === 'aprobado' ? 'Aprobado' : 'Pendiente' }}</span>
              </div>

              <div class="io-row io-row--stack">
                <div class="io-row-top">
                  <div class="io-row-label">Starlink</div>
                  <div class="io-seg">
                    <button v-for="opt in ESTADOS_AP" :key="opt.value"
                      :class="['io-seg-btn', ficha.checklist.monitoreo.starlink.estado === opt.value && `io-seg-btn--${opt.value}`]"
                      @click="toggleEstadoConEvidencia(ficha.checklist.monitoreo.starlink, opt.value)">{{ opt.label }}</button>
                  </div>
                </div>
                <input v-if="ficha.checklist.monitoreo.starlink.estado === 'pendiente'" class="io-nota"
                  v-model="ficha.checklist.monitoreo.starlink.nota" placeholder="¿Qué falta?" @input="marcar" />
                <EvidenciaUploader :proyecto-id="seleccion" seccion="monitoreo:starlink"
                  v-model="ficha.checklist.monitoreo.starlink.evidencia" @update:modelValue="marcar" @error="mostrarError" />
              </div>

              <div class="io-row io-row--stack">
                <div class="io-row-top">
                  <div class="io-row-label">Datos coherentes</div>
                  <div class="io-seg">
                    <button v-for="opt in ESTADOS_AP" :key="opt.value"
                      :class="['io-seg-btn', ficha.checklist.monitoreo.fusion_solar.datos_coherentes.estado === opt.value && `io-seg-btn--${opt.value}`]"
                      @click="toggleEstado(ficha.checklist.monitoreo.fusion_solar.datos_coherentes, opt.value)">{{ opt.label }}</button>
                  </div>
                </div>
                <input v-if="ficha.checklist.monitoreo.fusion_solar.datos_coherentes.estado === 'pendiente'" class="io-nota"
                  v-model="ficha.checklist.monitoreo.fusion_solar.datos_coherentes.nota" placeholder="¿Qué falta?" @input="marcar" />
              </div>

              <div class="io-row io-row--stack">
                <div class="io-row-label">Evidencia de Fusion Solar</div>
                <input class="io-nota" v-model="ficha.checklist.monitoreo.fusion_solar.nota" placeholder="Observación (opcional)" @input="marcar" />
                <EvidenciaUploader :proyecto-id="seleccion" seccion="monitoreo:fusion_solar"
                  v-model="ficha.checklist.monitoreo.fusion_solar.evidencia" @update:modelValue="marcar" @error="mostrarError" />
              </div>
            </div>

            <!-- Frontera -->
            <div class="io-inv-card">
              <div class="io-inv-head">
                <span class="io-inv-name">Frontera</span>
                <span class="io-calc-chip" :class="`io-calc-chip--${fronteraEstado}`">{{ fronteraEstado === 'aprobado' ? 'Aprobado' : 'Pendiente' }}</span>
              </div>
              <div v-for="med in FRONTERA_MEDIDORES" :key="med.key" class="io-row io-row--stack">
                <div class="io-row-top">
                  <div class="io-row-label">{{ med.label }}</div>
                  <div class="io-seg">
                    <button v-for="opt in ESTADOS_AP" :key="opt.value"
                      :class="['io-seg-btn', ficha.checklist.frontera[med.key].estado === opt.value && `io-seg-btn--${opt.value}`]"
                      @click="toggleEstadoConEvidencia(ficha.checklist.frontera[med.key], opt.value)">{{ opt.label }}</button>
                  </div>
                </div>
                <input v-if="ficha.checklist.frontera[med.key].estado === 'pendiente'" class="io-nota"
                  v-model="ficha.checklist.frontera[med.key].nota" placeholder="¿Qué falta?" @input="marcar" />
                <EvidenciaUploader :proyecto-id="seleccion" :seccion="`frontera:${med.key}`"
                  v-model="ficha.checklist.frontera[med.key].evidencia" @update:modelValue="marcar" @error="mostrarError" />
                <div v-if="fronteraLive[med.key]" class="io-live">
                  <span class="io-live-title"><i class="pi pi-bolt" /> En vivo (Gaia)</span>
                  <div class="io-live-grid">
                    <span>V: {{ fronteraLive[med.key].voltaje_v.map(fmtNum).join(' / ') }} V</span>
                    <span>I: {{ fronteraLive[med.key].corriente_a.map(fmtNum).join(' / ') }} A</span>
                    <span>P: {{ fmtNum(fronteraLive[med.key].potencia_activa_kw) }} kW</span>
                    <span>Energía hoy: {{ fmtNum(fronteraLive[med.key].energia_exportada_hoy_kwh) }} kWh</span>
                  </div>
                  <span class="io-live-time">Actualizado: {{ fmtFechaHora(fronteraLive[med.key].ultima_actualizacion) }}</span>
                </div>
                <div v-else class="io-live io-live--muted">Gaia no reporta datos en vivo para este medidor.</div>
              </div>
            </div>

            <!-- Estación meteorológica -->
            <div class="io-inv-card">
              <div class="io-inv-head">
                <span class="io-inv-name">Estación meteorológica</span>
                <span class="io-calc-chip" :class="`io-calc-chip--${estacionMeteoEstado}`">{{ estacionMeteoEstado === 'aprobado' ? 'Aprobado' : 'Pendiente' }}</span>
              </div>
              <div v-for="item in METEO_PRINCIPALES" :key="item.key" class="io-row io-row--stack">
                <div class="io-row-top">
                  <div class="io-row-label">{{ item.label }}</div>
                  <div class="io-seg">
                    <button v-for="opt in ESTADOS_AP" :key="opt.value"
                      :class="['io-seg-btn', ficha.checklist.estacion_meteo[item.key].estado === opt.value && `io-seg-btn--${opt.value}`]"
                      @click="item.evidencia ? toggleEstadoConEvidencia(ficha.checklist.estacion_meteo[item.key], opt.value) : toggleEstado(ficha.checklist.estacion_meteo[item.key], opt.value)">{{ opt.label }}</button>
                  </div>
                </div>
                <input v-if="ficha.checklist.estacion_meteo[item.key].estado === 'pendiente'" class="io-nota"
                  v-model="ficha.checklist.estacion_meteo[item.key].nota" placeholder="¿Qué falta?" @input="marcar" />
                <EvidenciaUploader v-if="item.evidencia" :proyecto-id="seleccion" :seccion="`estacion_meteo:${item.key}`"
                  v-model="ficha.checklist.estacion_meteo[item.key].evidencia" @update:modelValue="marcar" @error="mostrarError" />
              </div>

              <div class="io-meteo-vars">
                <span class="io-row-hint io-meteo-vars-title">Variables reportadas</span>
                <div v-for="item in METEO_VARIABLES" :key="item.key" class="io-row">
                  <div class="io-row-label">{{ item.label }}</div>
                  <div class="io-seg">
                    <button v-for="opt in ESTADOS_AP" :key="opt.value"
                      :class="['io-seg-btn', ficha.checklist.estacion_meteo[item.key].estado === opt.value && `io-seg-btn--${opt.value}`]"
                      @click="toggleEstado(ficha.checklist.estacion_meteo[item.key], opt.value)">{{ opt.label }}</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Reconectador -->
            <div class="io-inv-card">
              <div class="io-inv-head">
                <span class="io-inv-name">Reconectador</span>
                <span class="io-calc-chip" :class="`io-calc-chip--${reconectadorEstado}`">{{ reconectadorEstado === 'aprobado' ? 'Aprobado' : 'Pendiente' }}</span>
              </div>
              <div class="io-row">
                <div class="io-row-label">
                  ¿Tiene reconectador?
                  <span v-if="reconectadorLive" class="io-row-hint">Solenium detectó un reconectador conectado</span>
                  <span v-else class="io-row-hint">Solenium no reporta reconectador para este proyecto</span>
                </div>
                <div class="io-seg">
                  <button :class="['io-seg-btn', ficha.checklist.reconectador.tiene === false && 'io-seg-btn--pend']"
                    @click="setTieneReconectador(false)">No</button>
                  <button :class="['io-seg-btn', ficha.checklist.reconectador.tiene === true && 'io-seg-btn--aprobado']"
                    @click="setTieneReconectador(true)">Sí</button>
                </div>
              </div>

              <template v-if="ficha.checklist.reconectador.tiene">
                <div v-if="reconectadorLive" class="io-live">
                  <span class="io-live-title"><i class="pi pi-bolt" /> En vivo (Solenium)</span>
                  <div class="io-live-grid">
                    <span>V: {{ fmtNum(reconectadorLive.voltaje_a) }} / {{ fmtNum(reconectadorLive.voltaje_b) }} / {{ fmtNum(reconectadorLive.voltaje_c) }} V</span>
                    <span>I: {{ fmtNum(reconectadorLive.corriente_a) }} / {{ fmtNum(reconectadorLive.corriente_b) }} / {{ fmtNum(reconectadorLive.corriente_c) }} A</span>
                    <span>Frecuencia: {{ fmtNum(reconectadorLive.frecuencia_hz) }} Hz</span>
                    <span>FP: {{ fmtNum(reconectadorLive.factor_potencia, 2) }}</span>
                    <span>Potencia: {{ fmtNum(reconectadorLive.potencia_kw) }} kW</span>
                    <span>Estado: {{ reconectadorLive.activo ? 'Activo' : 'Inactivo' }}</span>
                  </div>
                  <span class="io-live-time">Actualizado: {{ fmtFechaHora(reconectadorLive.ultima_actualizacion) }}</span>
                </div>
                <div class="io-row io-row--stack">
                  <div class="io-row-top">
                    <div class="io-row-label">En la plataforma y funciona <span class="io-row-hint">Voltaje, corriente, frecuencia y potencia</span></div>
                    <div class="io-seg">
                      <button v-for="opt in ESTADOS_AP" :key="opt.value"
                        :class="['io-seg-btn', ficha.checklist.reconectador.en_plataforma.estado === opt.value && `io-seg-btn--${opt.value}`]"
                        @click="toggleEstado(ficha.checklist.reconectador.en_plataforma, opt.value)">{{ opt.label }}</button>
                    </div>
                  </div>
                  <input v-if="ficha.checklist.reconectador.en_plataforma.estado === 'pendiente'" class="io-nota"
                    v-model="ficha.checklist.reconectador.en_plataforma.nota" placeholder="¿Qué falta?" @input="marcar" />
                </div>

                <div class="io-row io-row--stack">
                  <div class="io-row-top">
                    <div class="io-row-label">Calidad de los datos</div>
                    <div class="io-seg">
                      <button v-for="opt in ESTADOS_AP" :key="opt.value"
                        :class="['io-seg-btn', ficha.checklist.reconectador.calidad_datos.estado === opt.value && `io-seg-btn--${opt.value}`]"
                        @click="toggleEstado(ficha.checklist.reconectador.calidad_datos, opt.value)">{{ opt.label }}</button>
                    </div>
                  </div>
                  <input v-if="ficha.checklist.reconectador.calidad_datos.estado === 'pendiente'" class="io-nota"
                    v-model="ficha.checklist.reconectador.calidad_datos.nota" placeholder="¿Qué falta?" @input="marcar" />
                </div>

                <div class="io-row io-row--stack">
                  <div class="io-row-label">Evidencia del reconectador</div>
                  <EvidenciaUploader :proyecto-id="seleccion" seccion="reconectador:evidencia"
                    v-model="ficha.checklist.reconectador.evidencia" @update:modelValue="marcar" @error="mostrarError" />
                </div>
              </template>
            </div>
          </div>
        </section>

        <!-- ─ Sección 7: Fechas ─ -->
        <section class="io-acc">
          <button class="io-acc-head" @click="toggle('fechas')">
            <i :class="['pi', abierto.fechas ? 'pi-chevron-down' : 'pi-chevron-right']" />
            <i class="pi pi-calendar io-acc-ico" />
            <span>Fechas</span>
          </button>
          <div v-show="abierto.fechas" class="io-acc-body">
            <div class="io-dates">
              <label class="io-date">
                <span>Fecha de energización <span class="io-row-hint">Primer día con energía real del proyecto</span></span>
                <input type="date" v-model="ficha.fecha_energizacion" @change="marcar" />
              </label>
              <label class="io-date">
                <span>Fecha de inicio de operación</span>
                <input type="date" v-model="ficha.fecha_inicio_operacion" @change="marcar" />
              </label>
            </div>
            <div v-if="diasDesdeEnergizacion != null" class="io-dias">
              <i class="pi pi-clock" /> Han pasado <b>{{ diasDesdeEnergizacion }}</b> días desde la energización
            </div>
          </div>
        </section>

        <!-- ─ Sección 8: Pruebas de desempeño ─ -->
        <section class="io-acc">
          <button class="io-acc-head" @click="toggle('pruebas')">
            <i :class="['pi', abierto.pruebas ? 'pi-chevron-down' : 'pi-chevron-right']" />
            <i class="pi pi-bolt io-acc-ico" />
            <span>Pruebas de desempeño</span>
          </button>
          <div v-show="abierto.pruebas" class="io-acc-body">
            <div v-for="prueba in PRUEBAS" :key="prueba.key" class="io-prueba">
              <div class="io-prueba-top">
                <span class="io-prueba-label">{{ prueba.label }}</span>
                <div class="io-seg">
                  <button v-for="opt in ESTADOS_PRUEBA" :key="opt.value"
                    :class="['io-seg-btn', pruebaEstado(prueba.key) === opt.value && `io-seg-btn--${opt.color}`]"
                    @click="setPrueba(prueba.key, opt.value)">{{ opt.label }}</button>
                </div>
              </div>
              <input class="io-obs" :value="pruebaObs(prueba.key)" placeholder="Observación…"
                @input="setPruebaObs(prueba.key, $event.target.value)" />
            </div>
          </div>
        </section>

        <!-- ─ Sección 9: Documentación ─ -->
        <section class="io-acc">
          <button class="io-acc-head" @click="toggle('documentos')">
            <i :class="['pi', abierto.documentos ? 'pi-chevron-down' : 'pi-chevron-right']" />
            <i class="pi pi-folder-open io-acc-ico" />
            <span>Documentación</span>
            <span class="io-acc-count">{{ docsEntregados }}/{{ DOCUMENTOS.length }}</span>
          </button>
          <div v-show="abierto.documentos" class="io-acc-body">
            <div v-for="doc in DOCUMENTOS" :key="doc.key" class="io-doc">
              <div class="io-doc-top">
                <span class="io-doc-label">{{ doc.label }}</span>
                <div class="io-seg">
                  <button v-for="opt in ESTADOS_DOC" :key="opt.value"
                    :class="['io-seg-btn', docEstado(doc.key) === opt.value && `io-seg-btn--${opt.color}`]"
                    @click="setDoc(doc.key, opt.value)">{{ opt.label }}</button>
                </div>
              </div>
              <div class="io-doc-link">
                <i class="pi pi-link" />
                <input :value="docLink(doc.key)" placeholder="Pegar link del documento…"
                  @input="setDocLink(doc.key, $event.target.value)" />
                <a v-if="docLink(doc.key)" :href="docLink(doc.key)" target="_blank" rel="noopener" class="io-doc-open" title="Abrir">
                  <i class="pi pi-external-link" />
                </a>
              </div>
            </div>
          </div>
        </section>

        <!-- ─ Sección 10: Pendientes ─ -->
        <section class="io-acc">
          <button class="io-acc-head" @click="toggle('pendientes')">
            <i :class="['pi', abierto.pendientes ? 'pi-chevron-down' : 'pi-chevron-right']" />
            <i class="pi pi-exclamation-circle io-acc-ico" />
            <span>Pendientes</span>
            <span class="io-acc-count">{{ ficha.pendientes.length }}</span>
          </button>
          <div v-show="abierto.pendientes" class="io-acc-body">
            <div v-if="pendientesAutomaticos.length" class="io-auto-pend">
              <span class="io-row-hint io-meteo-vars-title">Detectado automáticamente en el checklist</span>
              <div v-for="(p, i) in pendientesAutomaticos" :key="i" class="io-auto-pend-item">
                <i class="pi pi-exclamation-triangle" />
                <span><b>{{ p.label }}</b><template v-if="p.nota"> — {{ p.nota }}</template></span>
              </div>
            </div>
            <div class="io-table-wrap">
              <table class="io-table">
                <thead>
                  <tr>
                    <th style="min-width:180px">Descripción</th>
                    <th style="min-width:130px">Responsable</th>
                    <th style="min-width:140px">Fecha compromiso</th>
                    <th style="min-width:70px">Clas.</th>
                    <th style="min-width:120px">Estado</th>
                    <th style="min-width:160px">Observaciones</th>
                    <th style="width:40px"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(p, i) in ficha.pendientes" :key="i">
                    <td><input v-model="p.descripcion" @input="marcar" placeholder="Descripción" /></td>
                    <td><input v-model="p.responsable" @input="marcar" placeholder="Responsable" /></td>
                    <td><input type="date" v-model="p.fecha_compromiso" @change="marcar" /></td>
                    <td>
                      <select v-model="p.clasificacion" @change="marcar">
                        <option value="">—</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                      </select>
                    </td>
                    <td>
                      <select v-model="p.estado" @change="marcar">
                        <option value="abierto">Abierto</option>
                        <option value="en_proceso">En proceso</option>
                        <option value="cerrado">Cerrado</option>
                      </select>
                    </td>
                    <td><input v-model="p.observaciones" @input="marcar" placeholder="Observaciones" /></td>
                    <td><button class="io-del" @click="eliminarPendiente(i)" title="Eliminar"><i class="pi pi-trash" /></button></td>
                  </tr>
                  <tr v-if="!ficha.pendientes.length">
                    <td colspan="7" class="io-table-empty">Sin pendientes. Agrega una fila.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button class="io-add-row" @click="agregarPendiente"><i class="pi pi-plus" /> Agregar pendiente</button>
          </div>
        </section>

        <div style="height:14px" />
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '@/api/client'
import EvidenciaUploader from '@/components/EvidenciaUploader.vue'

// ── Catálogos fijos (deben coincidir con el cálculo de progreso del backend) ──
const CHECKLIST_LEGADO = [
  { key: 'cctv', label: 'CCTV', ref: 'QA-FT-22' },
  { key: 'cable_solar', label: 'Cable solar' },
  { key: 'cableado_mt_bt', label: 'Cableado MT y BT' },
  { key: 'transformadores', label: 'Transformadores' },
  { key: 'tableros', label: 'Tableros eléctricos' },
  { key: 'shelter_skid', label: 'Shelter o Skid' },
  { key: 'obras_civiles', label: 'Obras civiles' },
  { key: 'doc_om', label: 'Documentación O&M', ref: 'QA-FT-27' },
]
const ESTADOS_LEGADO = [
  { value: 'aprobado', label: 'Aprobado' },
  { value: 'rechazado', label: 'Rechazado' },
  { value: 'na', label: 'N/A' },
]
const ESTADOS_AP = [
  { value: 'aprobado', label: 'Aprobado' },
  { value: 'pendiente', label: 'Pendiente' },
]
const FRONTERA_MEDIDORES = [
  { key: 'principal', label: 'Medidor principal' },
  { key: 'respaldo', label: 'Medidor de respaldo' },
]
const METEO_PRINCIPALES = [
  { key: 'instalacion', label: 'Estación instalada' },
  { key: 'en_plataforma', label: 'En la plataforma de monitoreo' },
  { key: 'reporta_datos', label: 'Reporta datos', evidencia: true },
]
const METEO_VARIABLES = [
  { key: 'poa', label: 'POA (irradiancia en plano del arreglo)' },
  { key: 'temperatura_ambiente', label: 'Temperatura ambiente' },
  { key: 'velocidad_viento', label: 'Velocidad del viento' },
  { key: 'direccion_viento', label: 'Dirección del viento' },
]
const PRUEBAS = [
  { key: 'pr', label: 'Rendimiento (PR)' },
]
const ESTADOS_PRUEBA = [
  { value: 'pendiente', label: 'Pendiente', color: 'pend' },
  { value: 'ejecutada', label: 'Ejecutada', color: 'aprobado' },
  { value: 'no_aplica', label: 'No aplica', color: 'na' },
]
const DOCUMENTOS = [
  { key: 'permiso_conexion', label: 'Permiso de conexión a red' },
  { key: 'acta_energizacion', label: 'Acta de energización firmada' },
  { key: 'acta_inicio', label: 'Acta de inicio de operación' },
  { key: 'protocolos_electricas', label: 'Protocolos de pruebas eléctricas' },
  { key: 'termografia', label: 'Informe de termografía' },
  { key: 'curva_iv', label: 'Informe de curva IV' },
  { key: 'datalogger', label: 'Datalogger / SCADA activo' },
  { key: 'polizas', label: 'Pólizas de seguro activas' },
  { key: 'garantias', label: 'Garantías de equipos registradas' },
]
const ESTADOS_DOC = [
  { value: 'entregado', label: 'Entregado', color: 'aprobado' },
  { value: 'pendiente', label: 'Pendiente', color: 'pend' },
  { value: 'no_aplica', label: 'No aplica', color: 'na' },
]

// ── Estado ────────────────────────────────────────────────────────────────
const proyectos = ref([])
const loadingLista = ref(false)
const busqueda = ref('')

const seleccion = ref(null)        // proyecto_id seleccionado
const proyecto = reactive({})      // datos del encabezado
const inversores = ref([])         // inversores del proyecto (solo lectura: capacidad)
const fronteraLive = ref({ principal: null, respaldo: null })  // telemetría en vivo (Gaia)
const reconectadorLive = ref(null)                             // telemetría en vivo (Solenium)
const ficha = reactive({
  empresa_contratista: '',
  fecha_energizacion: null,
  fecha_inicio_operacion: null,
  checklist: {},
  pruebas: {},
  documentos: {},
  pendientes: [],
})
const loadingFicha = ref(false)
const guardando = ref(false)
const dirty = ref(false)
const abierto = reactive({
  general: true, inversores: true, monitoreo: false,
  fechas: false, pruebas: false, documentos: false, pendientes: false,
})

// ── Lista ───────────────────────────────────────────────────────────────────
const proyectosFiltrados = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  if (!q) return proyectos.value
  return proyectos.value.filter((p) => (p.nombre_comercial || '').toLowerCase().includes(q))
})

async function cargarLista() {
  loadingLista.value = true
  try {
    const { data } = await api.get('/inicio-operacion/proyectos')
    proyectos.value = data
  } catch {
    proyectos.value = []
  } finally {
    loadingLista.value = false
  }
}

// ── Normalización del checklist: rellena estructuras por defecto para que el
// template pueda usar v-model directo sin verificar null en cada campo ──────
function estadoVacio() { return { estado: null, nota: '' } }
function estadoConEvidencia() { return { estado: null, nota: '', evidencia: [] } }

function normalizarChecklist(raw, listaInversores) {
  const c = raw && typeof raw === 'object' ? raw : {}
  const out = { ...c }

  for (const item of CHECKLIST_LEGADO) {
    if (!(item.key in out)) out[item.key] = null
  }

  out.paneles = { cantidad: null, estado: null, nota: '', ...(c.paneles || {}) }
  out.tracker = { ...estadoVacio(), ...(c.tracker || {}) }

  const inversoresRaw = c.inversores || {}
  const items = { ...(inversoresRaw.items || {}) }
  for (const inv of listaInversores) {
    const key = String(inv.id)
    items[key] = {
      strings_estado: null, strings_nota: '', strings_evidencia: [], cantidad_strings: null,
      limitado: false, motivo_limitacion: '',
      ...(items[key] || {}),
    }
  }
  out.inversores = { items }

  const monitoreo = c.monitoreo || {}
  const fusionSolarRaw = monitoreo.fusion_solar || {}
  out.monitoreo = {
    starlink: { ...estadoConEvidencia(), ...(monitoreo.starlink || {}) },
    fusion_solar: {
      nota: '', evidencia: [], ...fusionSolarRaw,
      datos_coherentes: { ...estadoVacio(), ...(fusionSolarRaw.datos_coherentes || {}) },
    },
  }

  const frontera = c.frontera || {}
  out.frontera = {
    principal: { ...estadoConEvidencia(), ...(frontera.principal || {}) },
    respaldo: { ...estadoConEvidencia(), ...(frontera.respaldo || {}) },
  }

  const meteo = c.estacion_meteo || {}
  out.estacion_meteo = {}
  for (const item of [...METEO_PRINCIPALES, ...METEO_VARIABLES]) {
    out.estacion_meteo[item.key] = {
      ...(item.evidencia ? estadoConEvidencia() : estadoVacio()),
      ...(meteo[item.key] || {}),
    }
  }

  const reconectador = c.reconectador || {}
  out.reconectador = {
    tiene: reconectador.tiene ?? false,
    en_plataforma: { ...estadoVacio(), ...(reconectador.en_plataforma || {}) },
    calidad_datos: { ...estadoVacio(), ...(reconectador.calidad_datos || {}) },
    evidencia: reconectador.evidencia || [],
  }

  return out
}

// ── Detalle ───────────────────────────────────────────────────────────────
async function abrir(id) {
  seleccion.value = id
  loadingFicha.value = true
  dirty.value = false
  try {
    const { data } = await api.get(`/inicio-operacion/${id}`)
    Object.assign(proyecto, data.proyecto)
    inversores.value = data.inversores || []
    fronteraLive.value = data.frontera_live || { principal: null, respaldo: null }
    reconectadorLive.value = data.reconectador_live || null
    Object.assign(ficha, {
      empresa_contratista: data.ficha.empresa_contratista || '',
      fecha_energizacion: data.ficha.fecha_energizacion || null,
      fecha_inicio_operacion: data.ficha.fecha_inicio_operacion || null,
      checklist: normalizarChecklist(data.ficha.checklist, inversores.value),
      pruebas: data.ficha.pruebas || {},
      documentos: data.ficha.documentos || {},
      pendientes: Array.isArray(data.ficha.pendientes) ? data.ficha.pendientes : [],
    })
  } catch {
    window.__primeToast?.({ severity: 'error', summary: 'No se pudo cargar la ficha', life: 3000 })
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
    const payload = {
      empresa_contratista: ficha.empresa_contratista || null,
      fecha_energizacion: ficha.fecha_energizacion || null,
      fecha_inicio_operacion: ficha.fecha_inicio_operacion || null,
      checklist: ficha.checklist,
      pruebas: ficha.pruebas,
      documentos: ficha.documentos,
      pendientes: ficha.pendientes,
    }
    const { data } = await api.put(`/inicio-operacion/${seleccion.value}`, payload)
    fronteraLive.value = data.frontera_live || { principal: null, respaldo: null }
    reconectadorLive.value = data.reconectador_live || null
    dirty.value = false
    window.__primeToast?.({ severity: 'success', summary: 'Ficha guardada', life: 2000 })
    cargarLista()
  } catch (e) {
    window.__primeToast?.({ severity: 'error', summary: 'No se pudo guardar', detail: e.response?.data?.detail, life: 3500 })
  } finally {
    guardando.value = false
  }
}

function marcar() { dirty.value = true }
function toggle(k) { abierto[k] = !abierto[k] }
function mostrarError(msg) { window.__primeToast?.({ severity: 'error', summary: msg, life: 3500 }) }

// ── Checklist general ──────────────────────────────────────────────────────
function setLegado(key, value) {
  ficha.checklist[key] = ficha.checklist[key] === value ? null : value
  marcar()
}
function toggleEstado(node, value, campo = 'estado') {
  node[campo] = node[campo] === value ? null : value
  marcar()
}

// Igual que toggleEstado, pero exige al menos un archivo de evidencia antes
// de dejar aprobar el ítem (regla: "cada parte aprobada necesita su soporte").
function toggleEstadoConEvidencia(node, value, opts = {}) {
  const estadoField = opts.estadoField || 'estado'
  const evidenciaField = opts.evidenciaField || 'evidencia'
  if (value === 'aprobado' && node[estadoField] !== 'aprobado' && !(node[evidenciaField] || []).length) {
    mostrarError('Sube evidencia antes de marcar este ítem como Aprobado')
    return
  }
  toggleEstado(node, value, estadoField)
}

// ── Inversores ──────────────────────────────────────────────────────────────
function inversorItem(id) {
  return ficha.checklist.inversores.items[String(id)]
}
function setLimitado(id, valor) {
  const item = inversorItem(id)
  item.limitado = valor
  if (!valor) item.motivo_limitacion = ''
  marcar()
}
const capacidadTotal = computed(() => inversores.value.reduce((s, i) => s + (Number(i.potencia_nominal_kw) || 0), 0))

// ── Reconectador ──────────────────────────────────────────────────────────
function setTieneReconectador(valor) {
  ficha.checklist.reconectador.tiene = valor
  marcar()
}

// ── Estados calculados (mismo criterio que el backend) ──────────────────────
const fusionSolarEstado = computed(() => {
  const monitoreo = ficha.checklist.monitoreo || {}
  const starlinkOk = monitoreo.starlink?.estado === 'aprobado'
  const datosCoherentesOk = monitoreo.fusion_solar?.datos_coherentes?.estado === 'aprobado'
  const items = Object.values(ficha.checklist.inversores?.items || {})
  const algunLimitado = items.some((it) => it.limitado)
  const tieneEvidencia = (monitoreo.fusion_solar?.evidencia || []).length > 0
  return starlinkOk && datosCoherentesOk && !algunLimitado && tieneEvidencia ? 'aprobado' : 'pendiente'
})
const fronteraEstado = computed(() => {
  const f = ficha.checklist.frontera || {}
  const medidorOk = (m) => m?.estado === 'aprobado' && (m?.evidencia || []).length > 0
  return medidorOk(f.principal) && medidorOk(f.respaldo) ? 'aprobado' : 'pendiente'
})
const METEO_KEYS = [...METEO_PRINCIPALES, ...METEO_VARIABLES].map((i) => i.key)
const estacionMeteoEstado = computed(() => {
  const meteo = ficha.checklist.estacion_meteo || {}
  const reporta = meteo.reporta_datos || {}
  if (reporta.estado === 'aprobado' && !(reporta.evidencia || []).length) return 'pendiente'
  return METEO_KEYS.every((key) => meteo[key]?.estado === 'aprobado') ? 'aprobado' : 'pendiente'
})
const reconectadorEstado = computed(() => {
  const r = ficha.checklist.reconectador || {}
  if (!r.tiene) return 'pendiente'
  const ok = r.en_plataforma?.estado === 'aprobado' && r.calidad_datos?.estado === 'aprobado'
  return ok && (r.evidencia || []).length > 0 ? 'aprobado' : 'pendiente'
})
const progreso = computed(() => {
  const c = ficha.checklist
  if (!c || !Object.keys(c).length) return 0
  let total = 0, ok = 0
  for (const item of CHECKLIST_LEGADO) { total++; if (c[item.key] === 'aprobado') ok++ }
  for (const key of ['paneles', 'tracker']) { total++; if (c[key]?.estado === 'aprobado') ok++ }
  total += inversores.value.length
  ok += Object.values(c.inversores?.items || {}).filter((it) => it.strings_estado === 'aprobado').length
  total++; if (c.monitoreo?.starlink?.estado === 'aprobado') ok++
  total++; if (c.monitoreo?.fusion_solar?.datos_coherentes?.estado === 'aprobado') ok++
  for (const key of ['principal', 'respaldo']) { total++; if (c.frontera?.[key]?.estado === 'aprobado') ok++ }
  for (const key of METEO_KEYS) { total++; if (c.estacion_meteo?.[key]?.estado === 'aprobado') ok++ }
  if (c.reconectador?.tiene) {
    for (const key of ['en_plataforma', 'calidad_datos']) { total++; if (c.reconectador?.[key]?.estado === 'aprobado') ok++ }
  }
  return total ? Math.round((ok / total) * 100) : 0
})

// ── Pendientes automáticos: cualquier ítem del checklist que haya quedado en
// "pendiente", para no duplicar a mano lo que ya se ve arriba ────────────────
const pendientesAutomaticos = computed(() => {
  const c = ficha.checklist
  if (!c || !Object.keys(c).length) return []
  const out = []
  const add = (label, node) => { if (node?.estado === 'pendiente') out.push({ label, nota: node.nota || '' }) }
  add('Paneles solares', c.paneles)
  add('Trackers', c.tracker)
  for (const inv of inversores.value) {
    const item = inversorItem(inv.id)
    if (item.strings_estado === 'pendiente') {
      out.push({ label: `${inv.nombre || `Inversor ${inv.id}`} — Revisión de strings`, nota: item.strings_nota || '' })
    }
  }
  add('Starlink', c.monitoreo?.starlink)
  add('Fusion Solar — Datos coherentes', c.monitoreo?.fusion_solar?.datos_coherentes)
  add('Frontera — Medidor principal', c.frontera?.principal)
  add('Frontera — Medidor de respaldo', c.frontera?.respaldo)
  add('Estación meteo — Estación instalada', c.estacion_meteo?.instalacion)
  add('Estación meteo — En la plataforma', c.estacion_meteo?.en_plataforma)
  add('Estación meteo — Reporta datos', c.estacion_meteo?.reporta_datos)
  add('Estación meteo — POA', c.estacion_meteo?.poa)
  add('Estación meteo — Temperatura ambiente', c.estacion_meteo?.temperatura_ambiente)
  add('Estación meteo — Velocidad del viento', c.estacion_meteo?.velocidad_viento)
  add('Estación meteo — Dirección del viento', c.estacion_meteo?.direccion_viento)
  if (c.reconectador?.tiene) {
    add('Reconectador — En la plataforma', c.reconectador?.en_plataforma)
    add('Reconectador — Calidad de los datos', c.reconectador?.calidad_datos)
  }
  return out
})

// ── Pruebas ───────────────────────────────────────────────────────────────
function pruebaEstado(key) { return ficha.pruebas[key]?.estado || null }
function pruebaObs(key) { return ficha.pruebas[key]?.observacion || '' }
function setPrueba(key, value) {
  const cur = ficha.pruebas[key] || {}
  ficha.pruebas[key] = { ...cur, estado: cur.estado === value ? null : value }
  marcar()
}
function setPruebaObs(key, val) {
  ficha.pruebas[key] = { ...(ficha.pruebas[key] || {}), observacion: val }
  marcar()
}

// ── Documentos ──────────────────────────────────────────────────────────────
function docEstado(key) { return ficha.documentos[key]?.estado || null }
function docLink(key) { return ficha.documentos[key]?.link || '' }
function setDoc(key, value) {
  const cur = ficha.documentos[key] || {}
  ficha.documentos[key] = { ...cur, estado: cur.estado === value ? null : value }
  marcar()
}
function setDocLink(key, val) {
  ficha.documentos[key] = { ...(ficha.documentos[key] || {}), link: val }
  marcar()
}
const docsEntregados = computed(() => DOCUMENTOS.filter((d) => ficha.documentos[d.key]?.estado === 'entregado').length)

// ── Pendientes ──────────────────────────────────────────────────────────────
function agregarPendiente() {
  ficha.pendientes.push({ descripcion: '', responsable: '', fecha_compromiso: null, clasificacion: '', estado: 'abierto', observaciones: '' })
  marcar()
}
function eliminarPendiente(i) { ficha.pendientes.splice(i, 1); marcar() }

// ── Derivados encabezado ──────────────────────────────────────────────────
const ubicacion = computed(() =>
  [proyecto.municipio, proyecto.departamento, proyecto.direccion_vereda].filter(Boolean).join(', '))

const diasDesdeEnergizacion = computed(() => {
  if (!ficha.fecha_energizacion) return null
  const d = new Date(ficha.fecha_energizacion + 'T00:00:00')
  if (isNaN(d.getTime())) return null
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000))
})

// ── Helpers de formato ──────────────────────────────────────────────────────
function fmtCapacidad(kwp) {
  const n = Number(kwp)
  if (!n) return '—'
  return n >= 1000 ? (n / 1000).toFixed(2) + ' MW' : n.toLocaleString('es-CO') + ' kW'
}
function progresoStyle(pct) {
  const c = pct >= 100 ? '#16a34a' : pct >= 50 ? '#915BD8' : '#d97706'
  return { background: c + '1a', color: c }
}
function fmtNum(n, decimals = 1) {
  if (n === null || n === undefined || isNaN(n)) return '—'
  return Number(n).toFixed(decimals)
}
function fmtFechaHora(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleString('es-CO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

onMounted(cargarLista)
</script>

<style scoped>
.io-page { height: 100%; display: flex; flex-direction: column; font-family: system-ui, -apple-system, sans-serif; color: #2C2039; }

/* ── Lista ── */
.io-list-wrap { display: flex; flex-direction: column; min-height: 0; flex: 1; }
.io-list-head { display: flex; align-items: center; justify-content: space-between; padding: 4px 2px 14px; }
.io-title { font-size: 17px; font-weight: 800; margin: 0; }
.io-badge { background: #f3edfb; color: #6E3FB8; font-size: 12px; font-weight: 800; padding: 1px 9px; border-radius: 9px; }
.io-icon-btn { width: 34px; height: 34px; border: 1px solid #e5e7eb; border-radius: 9px; background: #fff; color: #6b5a8a; }
.io-icon-btn:disabled { opacity: .5; }

.io-search { display: flex; align-items: center; gap: 9px; background: #f5f3fa; border: 1px solid #eceaf2; border-radius: 12px; padding: 10px 14px; margin-bottom: 14px; }
.io-search .pi { color: #9ca3af; }
.io-search input { flex: 1; border: none; background: none; outline: none; font-size: 15px; color: #2C2039; }

.io-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 50px 20px; color: #6b5a8a; font-size: 15px; }
.io-state .pi-spinner { font-size: 24px; color: #915BD8; }

.io-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; overflow-y: auto; padding-bottom: 8px; }
.io-card { text-align: left; background: #fff; border: 1px solid #eceaf2; border-radius: 14px; padding: 14px; cursor: pointer; transition: box-shadow .15s, transform .1s; }
.io-card:hover { box-shadow: 0 6px 18px rgba(145,91,216,0.15); transform: translateY(-1px); }
.io-card-top { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.io-card-name { flex: 1; font-size: 14.5px; font-weight: 700; color: #2C2039; line-height: 1.25; }
.io-card-tag { font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 7px; flex-shrink: 0; }
.io-card-tag--new { background: #fef3c7; color: #92400e; }
.io-card-meta { display: flex; flex-direction: column; gap: 4px; font-size: 12.5px; color: #6b5a8a; margin-bottom: 10px; }
.io-card-meta .pi { font-size: 11px; color: #915BD8; margin-right: 4px; }
.io-card-bar { height: 5px; background: #f0eef5; border-radius: 3px; overflow: hidden; }
.io-card-bar-fill { height: 100%; background: #915BD8; border-radius: 3px; transition: width .3s; }

/* ── Detalle ── */
.io-detail { flex: 1; overflow-y: auto; min-height: 0; }
.io-detail-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; position: sticky; top: 0; background: #f8f7fb; padding: 4px 0 10px; z-index: 5; }
.io-back { display: flex; align-items: center; gap: 7px; border: none; background: none; color: #6E3FB8; font-size: 14px; font-weight: 700; cursor: pointer; }
.io-detail-actions { display: flex; align-items: center; gap: 12px; }
.io-dirty { font-size: 12px; color: #d97706; font-weight: 600; }
.io-save { display: flex; align-items: center; gap: 8px; border: none; background: #915BD8; color: #fff; font-size: 14px; font-weight: 700; padding: 9px 18px; border-radius: 10px; cursor: pointer; }
.io-save:disabled { opacity: .45; cursor: default; }

.io-hero { background: #2C2039; color: #fff; border-radius: 16px; padding: 18px 20px; margin-bottom: 14px; }
.io-hero-name { font-size: 20px; font-weight: 800; margin: 0 0 14px; }
.io-hero-facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; }
.io-fact { display: flex; flex-direction: column; gap: 4px; }
.io-fact-label { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: #b9a8d8; }
.io-fact-val { font-size: 14.5px; font-weight: 600; }
.io-fact-input { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.18); border-radius: 8px; padding: 7px 10px; color: #fff; font-size: 14px; outline: none; }
.io-fact-input::placeholder { color: rgba(255,255,255,0.4); }
.io-fact-input:focus { border-color: #F6FF72; }

.io-progress-card { background: #fff; border: 1px solid #eceaf2; border-radius: 14px; padding: 14px 16px; margin-bottom: 14px; }
.io-progress-top { display: flex; justify-content: space-between; font-size: 13.5px; font-weight: 600; color: #2C2039; margin-bottom: 8px; }
.io-progress-top b { color: #915BD8; font-size: 16px; }
.io-progress-bar { height: 8px; background: #f0eef5; border-radius: 5px; overflow: hidden; }
.io-progress-fill { height: 100%; background: linear-gradient(90deg, #915BD8, #6E3FB8); border-radius: 5px; transition: width .35s; }
.io-progress-sub { display: block; margin-top: 7px; font-size: 12px; color: #9b8db5; }

/* ── Acordeón ── */
.io-acc { background: #fff; border: 1px solid #eceaf2; border-radius: 14px; margin-bottom: 12px; overflow: hidden; }
.io-acc-head { display: flex; align-items: center; gap: 10px; width: 100%; padding: 14px 16px; border: none; background: #fff; font-size: 15px; font-weight: 700; color: #2C2039; cursor: pointer; text-align: left; }
.io-acc-head > .pi:first-child { color: #9ca3af; font-size: 13px; }
.io-acc-ico { color: #915BD8; font-size: 15px; }
.io-acc-head span:first-of-type { flex: 1; }
.io-acc-count { background: #f3edfb; color: #6E3FB8; font-size: 12px; font-weight: 800; padding: 1px 9px; border-radius: 8px; }
.io-acc-body { padding: 4px 16px 16px; border-top: 1px solid #f3f0f7; }
.io-empty-mini { padding: 14px 0; color: #9ca3af; font-size: 13px; }

/* ── Filas checklist ── */
.io-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 0; border-bottom: 1px solid #f5f3f9; flex-wrap: wrap; }
.io-row:last-child { border-bottom: none; }
.io-row--stack { flex-direction: column; align-items: stretch; gap: 8px; }
.io-row-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.io-row-label { font-size: 14px; color: #2C2039; font-weight: 500; }
.io-row-hint { display: block; font-size: 11.5px; font-weight: 400; color: #9b8db5; margin-top: 2px; }
.io-ref { font-size: 10.5px; font-weight: 700; color: #6E3FB8; background: #f3edfb; padding: 1px 6px; border-radius: 5px; margin-left: 4px; }

.io-subrow { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.io-inline-field { display: flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 600; color: #6b5a8a; }
.io-inline-field input { width: 90px; padding: 7px 10px; border: 1.5px solid #e8e0f0; border-radius: 8px; font-size: 13.5px; color: #2C2039; outline: none; }
.io-inline-field input:focus { border-color: #915BD8; }

.io-nota { width: 100%; padding: 9px 12px; border: 1.5px solid #fde68a; background: #fffbeb; border-radius: 9px; font-size: 13px; color: #92400e; outline: none; }
.io-nota:focus { border-color: #d97706; }
.io-nota::placeholder { color: #c99a4a; }

.io-seg { display: inline-flex; background: #f5f3fa; border-radius: 9px; padding: 3px; gap: 2px; flex-shrink: 0; }
.io-seg-btn { border: none; background: none; font-size: 12.5px; font-weight: 700; color: #6b5a8a; padding: 6px 12px; border-radius: 7px; cursor: pointer; white-space: nowrap; }
.io-seg-btn--aprobado, .io-seg-btn--entregado { background: #dcfce7; color: #15803d; }
.io-seg-btn--rechazado { background: #fee2e2; color: #b91c1c; }
.io-seg-btn--na, .io-seg-btn--no_aplica { background: #e5e7eb; color: #4b5563; }
.io-seg-btn--ejecutada { background: #dcfce7; color: #15803d; }
.io-seg-btn--pend, .io-seg-btn--pendiente { background: #fef3c7; color: #92400e; }

.io-calc-chip { font-size: 11.5px; font-weight: 800; padding: 3px 10px; border-radius: 8px; flex-shrink: 0; }
.io-calc-chip--aprobado { background: #dcfce7; color: #15803d; }
.io-calc-chip--pendiente { background: #fef3c7; color: #92400e; }

/* ── Inversores ── */
.io-inv-card { border: 1px solid #f0eef5; border-radius: 12px; padding: 12px 14px; margin-bottom: 10px; }
.io-inv-card:last-child { margin-bottom: 0; }
.io-inv-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.io-inv-name { font-size: 14.5px; font-weight: 700; color: #2C2039; }
.io-inv-cap { font-size: 12px; font-weight: 700; color: #915BD8; background: #f3edfb; padding: 2px 9px; border-radius: 7px; }

/* ── Telemetría en vivo (Gaia/Solenium) ── */
.io-live { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 9px; padding: 8px 12px; font-size: 12px; color: #166534; }
.io-live--muted { background: #f8f7fb; border-color: #eceaf2; color: #9ca3af; }
.io-live-title { display: flex; align-items: center; gap: 5px; font-weight: 700; font-size: 11.5px; text-transform: uppercase; letter-spacing: .3px; margin-bottom: 4px; }
.io-live-title .pi { font-size: 10px; }
.io-live-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 3px 10px; margin-bottom: 4px; }
.io-live-time { display: block; font-size: 10.5px; color: #4d7c62; }

/* ── Meteo ── */
.io-meteo-vars { margin-top: 6px; padding-top: 10px; border-top: 1px dashed #eceaf2; }
.io-meteo-vars-title { display: block; margin-bottom: 4px; text-transform: uppercase; letter-spacing: .4px; font-weight: 700; }

/* ── Pendientes automáticos ── */
.io-auto-pend { background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 12px 14px; margin-bottom: 14px; }
.io-auto-pend-item { display: flex; align-items: flex-start; gap: 8px; font-size: 13px; color: #92400e; padding: 4px 0; }
.io-auto-pend-item .pi { font-size: 12px; margin-top: 2px; flex-shrink: 0; }

/* ── Fechas ── */
.io-dates { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; padding-top: 10px; }
.io-date { display: flex; flex-direction: column; gap: 6px; font-size: 12.5px; font-weight: 600; color: #6b5a8a; }
.io-date input { padding: 11px 13px; border: 1.5px solid #e8e0f0; border-radius: 10px; font-size: 15px; color: #2C2039; outline: none; }
.io-date input:focus { border-color: #915BD8; }
.io-dias { margin-top: 14px; background: #f3edfb; color: #6E3FB8; font-size: 13.5px; padding: 10px 14px; border-radius: 10px; }
.io-dias b { font-size: 15px; }

/* ── Pruebas ── */
.io-prueba { padding: 12px 0; border-bottom: 1px solid #f5f3f9; }
.io-prueba:last-child { border-bottom: none; }
.io-prueba-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 8px; }
.io-prueba-label { font-size: 14px; font-weight: 500; }
.io-obs { width: 100%; padding: 9px 12px; border: 1.5px solid #e8e0f0; border-radius: 9px; font-size: 13.5px; color: #2C2039; outline: none; }
.io-obs:focus { border-color: #915BD8; }

/* ── Documentos ── */
.io-doc { padding: 12px 0; border-bottom: 1px solid #f5f3f9; }
.io-doc:last-child { border-bottom: none; }
.io-doc-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 8px; }
.io-doc-label { font-size: 14px; font-weight: 500; }
.io-doc-link { display: flex; align-items: center; gap: 8px; background: #f8f7fb; border: 1.5px solid #e8e0f0; border-radius: 9px; padding: 4px 10px; }
.io-doc-link .pi-link { color: #9ca3af; font-size: 13px; }
.io-doc-link input { flex: 1; border: none; background: none; outline: none; font-size: 13.5px; color: #2C2039; padding: 6px 0; }
.io-doc-open { color: #915BD8; padding: 4px; }

/* ── Tabla pendientes ── */
.io-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; padding-top: 8px; }
.io-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.io-table th { text-align: left; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .3px; color: #9b8db5; padding: 6px 6px; border-bottom: 1.5px solid #eceaf2; }
.io-table td { padding: 5px 6px; border-bottom: 1px solid #f5f3f9; vertical-align: middle; }
.io-table input, .io-table select { width: 100%; border: 1px solid #e8e0f0; border-radius: 7px; padding: 7px 9px; font-size: 13px; color: #2C2039; outline: none; background: #fff; }
.io-table input:focus, .io-table select:focus { border-color: #915BD8; }
.io-table-empty { text-align: center; color: #9ca3af; padding: 18px 0; font-size: 13px; }
.io-del { border: none; background: #fef2f2; color: #b91c1c; border-radius: 7px; width: 30px; height: 30px; cursor: pointer; }
.io-add-row { margin-top: 12px; display: flex; align-items: center; gap: 7px; border: 1.5px dashed #cbb8e8; background: #faf8fd; color: #6E3FB8; font-size: 13.5px; font-weight: 700; padding: 9px 16px; border-radius: 10px; cursor: pointer; }
</style>
