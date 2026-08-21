<template>
  <div class="space-y-5">
    <!-- Barra de acciones (el título ya lo pone el wrapper ReporteEnergiaView) -->
    <div class="flex items-center justify-between flex-wrap gap-3">
      <Calendar v-model="fecha" dateFormat="yy-mm-dd" class="w-40" :maxDate="maxFecha" showIcon />
      <div class="flex items-center gap-2">
        <Button icon="pi pi-play" label="Ejecutar clasificación" severity="secondary" outlined
                :loading="ejecutando" :disabled="ejecutando"
                @click="ejecutarClasificacion" />
        <Button v-if="ejecutando" icon="pi pi-stop-circle" label="Detener" severity="danger" outlined
                :loading="deteniendo" @click="detenerClasificacion" />
        <Button icon="pi pi-file-excel" label="Generar Excel" severity="secondary" outlined
                :loading="generandoExcel" @click="generarExcel" />
        <Button icon="pi pi-send" label="Enviar reporte"
                :disabled="!resumen || !resumen.puede_enviar" :loading="enviando"
                v-tooltip.bottom="!resumen?.puede_enviar ? 'Quedan fronteras con horas sin fuente por revisar' : null"
                style="background: #915BD8; border-color: #915BD8;" @click="enviarReporte" />
      </div>
    </div>

    <!-- Stat cards -->
    <div class="flex flex-wrap gap-4">
      <div v-for="stat in stats" :key="stat.label"
           class="bg-white rounded-xl shadow-sm p-4 h-20 flex-1 min-w-[9rem] flex flex-col justify-center cursor-pointer"
           style="border: 1px solid #e8e0f0;" @click="filtroSemaforo = stat.filtro">
        <p class="text-xs uppercase tracking-wide font-semibold" style="color: #6b5a8a;">{{ stat.label }}</p>
        <p class="text-2xl font-bold mt-1" :style="{ color: stat.color }">{{ stat.value }}</p>
      </div>
    </div>

    <!-- Estado en Quoia: ¿XM ya resolvió los reportes ENVIADOS ese día?
         Distinto de "Enviar reporte" (que solo dice si el POST llegó bien
         a Quoia) -- esto vuelve a consultar Quoia para saber si XM lo
         aprobó ("Exitoso") o lo rechazó ("Error"), o sigue sin resolver
         ("En espera"). Solo aparece si hay algo enviado ese día; el
         polling se detiene solo en cuanto nadie queda en_espera. -->
    <div v-if="estadoQuoia" class="bg-white rounded-xl p-4" style="border: 2px solid #915BD8;">
      <div class="flex items-start justify-between gap-3 mb-3">
        <div>
          <p class="text-sm font-bold" style="color: #2C2039;">Estado en Quoia</p>
          <p class="text-xs mt-0.5" style="color: #9b89b5;">
            {{ estadoQuoia.total }} fronteras enviadas
            <span v-if="estadoQuoiaPolling"> · revisando cada 2 min</span>
          </p>
        </div>
        <span v-if="estadoQuoiaPolling" class="flex items-center gap-1.5 text-xs font-semibold" style="color: #915BD8;">
          <span class="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style="background: #915BD8;" />
          En vivo
        </span>
      </div>
      <div class="grid grid-cols-4 gap-2.5 mb-1">
        <div class="rounded-lg text-center py-2.5" style="background: #eef0f4;">
          <p class="text-xl font-extrabold" style="color: #52596b;">{{ estadoQuoia.en_espera }}</p>
          <p class="text-[11px] font-semibold mt-0.5" style="color: #52596b;">En espera</p>
        </div>
        <div class="rounded-lg text-center py-2.5" style="background: #e8f5d9;">
          <p class="text-xl font-extrabold" style="color: #4d7c0f;">{{ estadoQuoia.exitoso }}</p>
          <p class="text-[11px] font-semibold mt-0.5" style="color: #4d7c0f;">Exitoso</p>
        </div>
        <div class="rounded-lg text-center py-2.5" style="background: #fdf3d0;">
          <p class="text-xl font-extrabold" style="color: #92700c;">{{ estadoQuoia.exitoso_con_alerta }}</p>
          <p class="text-[11px] font-semibold mt-0.5" style="color: #92700c;">Con alerta</p>
        </div>
        <div class="rounded-lg text-center py-2.5" style="background: #fde3e3;">
          <p class="text-xl font-extrabold" style="color: #c02626;">{{ estadoQuoia.error }}</p>
          <p class="text-[11px] font-semibold mt-0.5" style="color: #c02626;">Error</p>
        </div>
      </div>
      <div v-if="estadoQuoia.fallidas.length" class="mt-3 pt-3" style="border-top: 1px solid #e8e0f0;">
        <p class="text-xs font-bold mb-2" style="color: #c02626;">⚠ {{ estadoQuoia.fallidas.length }} con error</p>
        <div v-for="f in estadoQuoia.fallidas" :key="f.frontera_id + f.tipo"
             class="rounded-lg px-2.5 py-1.5 mb-1.5 text-xs" style="background: #f7f6fa;">
          <span class="font-semibold" style="color: #2C2039;">{{ f.nombre_proyecto }} — {{ f.tipo === 'generacion' ? 'Generación' : 'Consumo' }}</span>
        </div>
      </div>
      <p v-else-if="!estadoQuoiaPolling && estadoQuoia.en_espera === 0" class="text-xs font-semibold mt-3 pt-3" style="color: #4d7c0f; border-top: 1px solid #e8e0f0;">
        ✓ Todas las fronteras ya tienen respuesta de XM — nada pendiente
      </p>
    </div>

    <TabView v-model:activeIndex="activeTab">
      <TabPanel header="Revisión de hoy">
        <div v-if="loadingLista" class="flex items-center justify-center py-12">
          <i class="pi pi-spin pi-spinner text-3xl" style="color: #915BD8;" />
        </div>
        <div v-else-if="!filas.length" class="text-center py-12" style="color: #9b89b5;">
          <p class="mb-3">Todavía no se ha corrido la clasificación para este día.</p>
          <Button icon="pi pi-play" label="Ejecutar clasificación" :loading="ejecutando" @click="ejecutarClasificacion" />
        </div>
        <div v-else class="workspace">
          <ReporteEnergiaLista
            :filas="filasFiltradas"
            :seleccionada="seleccion?.frontera_id"
            @seleccionar="(f) => seleccionar(f, 'hoy')"
          />
          <div class="detail-pane">
            <p v-if="!seleccion" class="text-sm text-center py-16" style="color: #9b89b5;">
              Elige una frontera de la lista para ver su detalle.
            </p>
            <ReporteEnergiaDetalleTab
              v-else
              :key="`${seleccion.frontera_id}-${fechaISO}`"
              :frontera-id="seleccion.frontera_id"
              :fecha="fechaISO"
              @actualizado="cargarLista(true); cargarResumen()"
            />
          </div>
        </div>
      </TabPanel>

      <TabPanel header="Historial">
        <div class="flex flex-wrap items-center gap-3 mb-4">
          <span class="text-sm" style="color: #6b5a8a;">Ver el reporte de otro día:</span>
          <Calendar v-model="fechaHistorial" dateFormat="yy-mm-dd" class="w-40" :maxDate="maxFecha" showIcon />
          <Button label="Ver" size="small" @click="cargarHistorial" />
        </div>
        <div v-if="loadingHistorial" class="flex items-center justify-center py-12">
          <i class="pi pi-spin pi-spinner text-3xl" style="color: #915BD8;" />
        </div>
        <div v-else-if="filasHistorial.length" class="workspace">
          <ReporteEnergiaLista
            :filas="filasHistorial"
            :seleccionada="seleccionHistorial?.frontera_id"
            @seleccionar="(f) => seleccionar(f, 'historial')"
          />
          <div class="detail-pane">
            <p v-if="!seleccionHistorial" class="text-sm text-center py-16" style="color: #9b89b5;">
              Elige una frontera de la lista para ver su detalle.
            </p>
            <ReporteEnergiaDetalleTab
              v-else
              :key="`${seleccionHistorial.frontera_id}-${fechaHistorialISO}`"
              :frontera-id="seleccionHistorial.frontera_id"
              :fecha="fechaHistorialISO"
              @actualizado="cargarHistorial()"
            />
          </div>
        </div>
        <p v-else class="text-sm text-center py-8" style="color: #9b89b5;">
          Elige una fecha y pulsa "Ver" para revisar ese día.
        </p>
      </TabPanel>

      <TabPanel header="Resumen">
        <div class="flex flex-wrap items-end gap-3 mb-4">
          <div>
            <label class="block text-xs font-semibold mb-1" style="color:#6b5a8a;">Desde</label>
            <Calendar v-model="resumenDesde" dateFormat="yy-mm-dd" class="w-40" :maxDate="resumenHasta" showIcon />
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1" style="color:#6b5a8a;">Hasta</label>
            <Calendar v-model="resumenHasta" dateFormat="yy-mm-dd" class="w-40" :minDate="resumenDesde" :maxDate="maxFecha" showIcon />
          </div>
          <Button label="Buscar" :loading="loadingResumenHistorico" @click="cargarResumenHistorico" />
        </div>

        <div v-if="loadingResumenHistorico" class="flex items-center justify-center py-12">
          <i class="pi pi-spin pi-spinner text-3xl" style="color: #915BD8;" />
        </div>

        <template v-else-if="resumenHistorico">
          <!-- Fuente usada — Generación -->
          <section class="mb-6">
            <p class="text-sm font-bold" style="color:#2C2039;">Fuente usada — Generación</p>
            <p class="text-xs mb-3" style="color:#9b89b5;">
              {{ totalDias(kpiGen) }} días-frontera reportados en el rango · clic en una barra para ver el detalle por frontera
            </p>
            <div v-if="kpiGen.length" class="bg-white rounded-xl border p-3" style="border-color:#e8e0f0; height:220px;">
              <Bar :data="chartGen" :options="chartOptionsGen" :plugins="[dataLabelPlugin]" />
            </div>
            <p v-else class="text-xs text-center py-8" style="color:#9b89b5;">Sin datos en este rango.</p>

            <div v-if="grupoSeleccionadoGen" class="mt-4">
              <div class="flex items-center justify-between mb-2">
                <p class="text-sm font-bold flex items-center gap-1.5" style="color:#2C2039;">
                  <span class="inline-block w-2 h-2 rounded-full" :style="{ background: grupoColor(grupoSeleccionadoGen).texto }" />
                  Detalle — {{ grupoSeleccionadoGen }}
                </p>
                <span class="text-xs cursor-pointer" style="color:#9b89b5;" @click="grupoSeleccionadoGen = null">Cerrar ✕</span>
              </div>
              <DataTable :value="detalleFiltrado('gen')" class="text-sm resumen-tabla" stripedRows rowHover
                         paginator :rows="10" @row-click="e => irAFronteraHistorial(e.data.frontera_id)">
                <Column field="nombre_proyecto" header="Proyecto / frontera" sortable />
                <Column field="dias_totales" header="Días totales" sortable style="width:110px" />
                <Column field="dias_grupo" :header="`Días en ${grupoSeleccionadoGen.toLowerCase()}`" sortable style="width:150px" />
                <Column header="% del tiempo" style="width:160px" sortable :sortField="'dias_grupo'">
                  <template #body="{ data }">
                    <div class="flex items-center gap-2">
                      <div class="flex-1 h-1.5 rounded-full overflow-hidden" style="background:#f0ebf6;">
                        <div class="h-full rounded-full" :style="{ width: pctDe(data.dias_grupo, data.dias_totales) + '%', background: severidadColor(pctDe(data.dias_grupo, data.dias_totales)) }" />
                      </div>
                      <span class="text-xs font-bold w-10 text-right">{{ pctDe(data.dias_grupo, data.dias_totales) }}%</span>
                    </div>
                  </template>
                </Column>
                <Column header="Fuente(s) usadas">
                  <template #body="{ data }">
                    <span v-for="d in data.desglose" :key="d.etiqueta" class="inline-block text-[11px] font-semibold rounded-full px-2 py-0.5 mr-1 mb-1"
                          style="background:#f0ebf6; color:#6b5a8a;">{{ d.etiqueta }} × {{ d.dias }}</span>
                  </template>
                </Column>
              </DataTable>
            </div>
          </section>

          <!-- Fuente usada — Consumo -->
          <section class="mb-6">
            <p class="text-sm font-bold" style="color:#2C2039;">Fuente usada — Consumo</p>
            <p class="text-xs mb-3" style="color:#9b89b5;">
              {{ totalDias(kpiCon) }} días-frontera reportados en el rango · Consumo no usa inversores · clic en una barra para ver el detalle
            </p>
            <div v-if="kpiCon.length" class="bg-white rounded-xl border p-3" style="border-color:#e8e0f0; height:220px;">
              <Bar :data="chartCon" :options="chartOptionsCon" :plugins="[dataLabelPlugin]" />
            </div>
            <p v-else class="text-xs text-center py-8" style="color:#9b89b5;">Sin datos en este rango.</p>

            <div v-if="grupoSeleccionadoCon" class="mt-4">
              <div class="flex items-center justify-between mb-2">
                <p class="text-sm font-bold flex items-center gap-1.5" style="color:#2C2039;">
                  <span class="inline-block w-2 h-2 rounded-full" :style="{ background: grupoColor(grupoSeleccionadoCon).texto }" />
                  Detalle — {{ grupoSeleccionadoCon }}
                </p>
                <span class="text-xs cursor-pointer" style="color:#9b89b5;" @click="grupoSeleccionadoCon = null">Cerrar ✕</span>
              </div>
              <DataTable :value="detalleFiltrado('con')" class="text-sm resumen-tabla" stripedRows rowHover
                         paginator :rows="10" @row-click="e => irAFronteraHistorial(e.data.frontera_id)">
                <Column field="nombre_proyecto" header="Proyecto / frontera" sortable />
                <Column field="dias_totales" header="Días totales" sortable style="width:110px" />
                <Column field="dias_grupo" :header="`Días en ${grupoSeleccionadoCon.toLowerCase()}`" sortable style="width:150px" />
                <Column header="% del tiempo" style="width:160px" sortable :sortField="'dias_grupo'">
                  <template #body="{ data }">
                    <div class="flex items-center gap-2">
                      <div class="flex-1 h-1.5 rounded-full overflow-hidden" style="background:#f0ebf6;">
                        <div class="h-full rounded-full" :style="{ width: pctDe(data.dias_grupo, data.dias_totales) + '%', background: severidadColor(pctDe(data.dias_grupo, data.dias_totales)) }" />
                      </div>
                      <span class="text-xs font-bold w-10 text-right">{{ pctDe(data.dias_grupo, data.dias_totales) }}%</span>
                    </div>
                  </template>
                </Column>
                <Column header="Fuente(s) usadas">
                  <template #body="{ data }">
                    <span v-for="d in data.desglose" :key="d.etiqueta" class="inline-block text-[11px] font-semibold rounded-full px-2 py-0.5 mr-1 mb-1"
                          style="background:#f0ebf6; color:#6b5a8a;">{{ d.etiqueta }} × {{ d.dias }}</span>
                  </template>
                </Column>
              </DataTable>
            </div>
          </section>

          <!-- Datos incompletos -->
          <div class="bg-white rounded-xl shadow-sm border p-4 mb-5" style="border-color:#e8e0f0;">
            <p class="text-sm font-bold mb-1" style="color:#2C2039;">Datos incompletos de medidores e inversores</p>
            <p class="text-xs mb-3" style="color:#9b89b5;">Solo Generación — cuántas veces cada fuente llegó incompleta en el rango.</p>
            <div class="flex items-center gap-3 flex-wrap rounded-lg px-3 py-2.5 mb-3" style="background:#faf9fc;">
              <template v-for="(c, idx) in resumenHistorico.incompletos_callouts" :key="idx">
                <span><b class="text-base font-extrabold" style="color:#6E3FB8;">{{ c.valor }}</b>
                  <span class="text-xs ml-1.5" style="color:#6b5a8a;">{{ c.etiqueta }}</span></span>
                <span v-if="idx < resumenHistorico.incompletos_callouts.length - 1" class="w-px h-4" style="background:#e8e0f0;" />
              </template>
            </div>
            <DataTable :value="resumenHistorico.incompletos" class="text-sm resumen-tabla" stripedRows rowHover
                       paginator :rows="10" @row-click="e => irAFronteraHistorial(e.data.frontera_id)">
              <Column field="nombre_proyecto" header="Proyecto" sortable />
              <Column header="Medidor principal" sortable :sortField="'veces_medidor_principal_incompleto'" style="width:170px">
                <template #body="{ data }">
                  <span class="inline-flex text-xs font-bold rounded-full px-2.5 py-1"
                        :style="chipEstilo(pctDe(data.veces_medidor_principal_incompleto, data.dias_con_fila), 'problema')">
                    {{ data.veces_medidor_principal_incompleto }} de {{ data.dias_con_fila }} · {{ pctDe(data.veces_medidor_principal_incompleto, data.dias_con_fila) }}%
                  </span>
                </template>
              </Column>
              <Column header="Medidor respaldo" sortable :sortField="'veces_medidor_respaldo_incompleto'" style="width:170px">
                <template #body="{ data }">
                  <span class="inline-flex text-xs font-bold rounded-full px-2.5 py-1"
                        :style="chipEstilo(pctDe(data.veces_medidor_respaldo_incompleto, data.dias_con_fila), 'problema')">
                    {{ data.veces_medidor_respaldo_incompleto }} de {{ data.dias_con_fila }} · {{ pctDe(data.veces_medidor_respaldo_incompleto, data.dias_con_fila) }}%
                  </span>
                </template>
              </Column>
              <Column header="Inversores" sortable :sortField="'veces_solenium_incompleto'" style="width:170px">
                <template #body="{ data }">
                  <span class="inline-flex text-xs font-bold rounded-full px-2.5 py-1"
                        :style="chipEstilo(pctDe(data.veces_solenium_incompleto, data.dias_con_fila), 'problema')">
                    {{ data.veces_solenium_incompleto }} de {{ data.dias_con_fila }} · {{ pctDe(data.veces_solenium_incompleto, data.dias_con_fila) }}%
                  </span>
                </template>
              </Column>
              <Column field="dias_con_fila" header="Días con reporte" sortable style="width:130px" />
            </DataTable>
            <p v-if="!resumenHistorico.incompletos.length" class="text-xs text-center py-6" style="color:#9b89b5;">Sin datos incompletos en este rango.</p>
          </div>

          <!-- Intervención manual -->
          <div class="bg-white rounded-xl shadow-sm border p-4 mb-5" style="border-color:#e8e0f0;">
            <p class="text-sm font-bold mb-1" style="color:#2C2039;">Intervención manual recurrente</p>
            <p class="text-xs mb-3" style="color:#9b89b5;">Fronteras que caen en "Revisar manualmente" o requieren edición manual una y otra vez.</p>
            <div class="flex items-center gap-3 flex-wrap rounded-lg px-3 py-2.5 mb-3" style="background:#faf9fc;">
              <template v-for="(c, idx) in resumenHistorico.intervencion_manual_callouts" :key="idx">
                <span><b class="text-base font-extrabold" style="color:#6E3FB8;">{{ c.valor }}</b>
                  <span class="text-xs ml-1.5" style="color:#6b5a8a;">{{ c.etiqueta }}</span></span>
                <span v-if="idx < resumenHistorico.intervencion_manual_callouts.length - 1" class="w-px h-4" style="background:#e8e0f0;" />
              </template>
            </div>
            <DataTable :value="resumenHistorico.intervencion_manual" class="text-sm resumen-tabla" stripedRows rowHover
                       paginator :rows="10" @row-click="e => irAFronteraHistorial(e.data.frontera_id)">
              <Column field="nombre_proyecto" header="Proyecto" sortable />
              <Column header="Tipo" field="tipo" sortable style="width:110px">
                <template #body="{ data }">{{ data.tipo === 'generacion' ? 'Generación' : 'Consumo' }}</template>
              </Column>
              <Column header="Revisar manualmente" sortable :sortField="'veces_revisar_manualmente'" style="width:180px">
                <template #body="{ data }">
                  <span class="inline-flex text-xs font-bold rounded-full px-2.5 py-1"
                        :style="chipEstilo(pctDe(data.veces_revisar_manualmente, data.dias_con_fila), 'problema')">
                    {{ data.veces_revisar_manualmente }} de {{ data.dias_con_fila }} · {{ pctDe(data.veces_revisar_manualmente, data.dias_con_fila) }}%
                  </span>
                </template>
              </Column>
              <Column header="Editado manualmente" sortable :sortField="'veces_editado_manualmente'" style="width:180px">
                <template #body="{ data }">
                  <span class="inline-flex text-xs font-bold rounded-full px-2.5 py-1"
                        :style="chipEstilo(pctDe(data.veces_editado_manualmente, data.dias_con_fila), 'neutral')">
                    {{ data.veces_editado_manualmente }} de {{ data.dias_con_fila }} · {{ pctDe(data.veces_editado_manualmente, data.dias_con_fila) }}%
                  </span>
                </template>
              </Column>
              <Column field="dias_con_fila" header="Días con reporte" sortable style="width:130px" />
            </DataTable>
            <p v-if="!resumenHistorico.intervencion_manual.length" class="text-xs text-center py-6" style="color:#9b89b5;">Sin intervención manual en este rango.</p>
          </div>

          <!-- Recuperación activa -->
          <div class="bg-white rounded-xl shadow-sm border p-4" style="border-color:#e8e0f0;">
            <p class="text-sm font-bold mb-1" style="color:#2C2039;">Recuperación activa de medidores</p>
            <p class="text-xs mb-3" style="color:#9b89b5;">Intentos y éxitos al forzar la lectura de un medidor — por frontera y medidor.</p>
            <div class="flex items-center gap-3 flex-wrap rounded-lg px-3 py-2.5 mb-3" style="background:#faf9fc;">
              <template v-for="(c, idx) in resumenHistorico.recuperacion_activa_callouts" :key="idx">
                <span><b class="text-base font-extrabold" style="color:#6E3FB8;">{{ c.valor }}</b>
                  <span class="text-xs ml-1.5" style="color:#6b5a8a;">{{ c.etiqueta }}</span></span>
                <span v-if="idx < resumenHistorico.recuperacion_activa_callouts.length - 1" class="w-px h-4" style="background:#e8e0f0;" />
              </template>
            </div>
            <DataTable :value="resumenHistorico.recuperacion_activa" class="text-sm resumen-tabla" stripedRows rowHover
                       paginator :rows="10" @row-click="e => irAFronteraHistorial(e.data.frontera_id)">
              <Column field="nombre_proyecto" header="Proyecto" sortable />
              <Column header="Éxito principal" style="width:130px">
                <template #body="{ data }">
                  <span v-if="!data.intentos_principal" class="text-xs" style="color:#9b89b5;">— sin intentos</span>
                  <span v-else class="text-xs font-bold" :style="{ color: severidadColorExito(pctDe(data.exitos_principal, data.intentos_principal)) }">
                    {{ data.exitos_principal }}/{{ data.intentos_principal }}
                  </span>
                </template>
              </Column>
              <Column header="Éxito respaldo" style="width:130px">
                <template #body="{ data }">
                  <span v-if="!data.intentos_respaldo" class="text-xs" style="color:#9b89b5;">— sin intentos</span>
                  <span v-else class="text-xs font-bold" :style="{ color: severidadColorExito(pctDe(data.exitos_respaldo, data.intentos_respaldo)) }">
                    {{ data.exitos_respaldo }}/{{ data.intentos_respaldo }}
                  </span>
                </template>
              </Column>
            </DataTable>
            <p v-if="!resumenHistorico.recuperacion_activa.length" class="text-xs text-center py-6" style="color:#9b89b5;">Sin intentos de recuperación en este rango.</p>
          </div>
        </template>

        <p v-else class="text-sm text-center py-8" style="color: #9b89b5;">
          Elige un rango de fechas y pulsa "Buscar".
        </p>
      </TabPanel>
    </TabView>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import api from '@/api/client'
import Button from 'primevue/button'
import Calendar from 'primevue/calendar'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend,
} from 'chart.js'
import ReporteEnergiaLista from './ReporteEnergiaLista.vue'
import ReporteEnergiaDetalleTab from './ReporteEnergiaDetalleTab.vue'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const toast = useToast()
const route = useRoute()
const router = useRouter()

// Bogotá (America/Bogota) es UTC-5 fijo, sin horario de verano -- pero
// calcularlo restando 5h al epoch y leyendo el resultado con getters LOCALES
// (getFullYear/getMonth/getDate) solo da la fecha correcta si el navegador
// ya está en UTC. En un navegador configurado en hora de Bogotá (lo normal
// para el equipo), esos getters locales vuelven a restar la offset -- la
// resta se aplicaba dos veces, y entre medianoche y las 5 a.m. eso rodaba
// "hoy" al día anterior (bug real: 2026-08-04, bloqueaba elegir el 3 de
// agosto). Usar Intl con timeZone explícito da el día calendario correcto
// sin importar en qué zona esté el navegador.
function hoyColombia() {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' })
  const [y, m, d] = fmt.format(new Date()).split('-').map(Number)
  return new Date(y, m - 1, d)
}
function ayerColombia() {
  // El reporte siempre es del día ANTERIOR (igual que el pipeline original
  // Reporte-Energia: 'ayer = date.today() - timedelta(days=1)', sin importar
  // qué fecha traiga Quoia) -- ni el día por defecto ni el máximo
  // seleccionable deberían ser "hoy".
  const h = hoyColombia()
  return new Date(h.getFullYear(), h.getMonth(), h.getDate() - 1)
}
// La clasificación solo se dispara desde "Revisión de hoy", que ya limita
// a "ayer" -- así que una fila con fecha = hoy nunca existe. Historial
// comparte el mismo límite, no porque dispare algo, sino porque no hay
// ningún día actual con datos que mostrar.
const maxFecha = ayerColombia()

function parseFechaISO(s) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// Restaurar tab/fecha/frontera desde la URL (?tab=&fecha=&frontera_id=) --
// sin esto, entrar al detalle de una Falla desde "Fallas activas del
// proyecto" y volver con el botón "atrás" remontaba esta vista desde cero
// (fecha=ayer, sin frontera elegida), obligando a rebuscarla a mano.
const tabInicial = route.query.tab === 'historial' ? 1 : 0
const activeTab = ref(tabInicial)
const fecha = ref(tabInicial === 0 && route.query.fecha ? parseFechaISO(route.query.fecha) : ayerColombia())
const fechaHistorial = ref(tabInicial === 1 && route.query.fecha ? parseFechaISO(route.query.fecha) : ayerColombia())

const fechaISO = computed(() => fecha.value.toISOString().slice(0, 10))
const fechaHistorialISO = computed(() => fechaHistorial.value.toISOString().slice(0, 10))

const resumen = ref(null)
const filas = ref([])
const loadingLista = ref(true)
const filtroSemaforo = ref(null)

const filasHistorial = ref([])
const loadingHistorial = ref(false)

const generandoExcel = ref(false)
const enviando = ref(false)
const ejecutando = ref(false)
const deteniendo = ref(false)

const estadoQuoia = ref(null)
const estadoQuoiaPolling = ref(false)
let estadoQuoiaTimer = null

// ── Resumen histórico (patrones por rango de fechas, no un solo día) ──────
const resumenHasta = ref(ayerColombia())
const resumenDesde = ref((() => {
  const h = ayerColombia()
  return new Date(h.getFullYear(), h.getMonth(), h.getDate() - 29)
})())
const resumenHistorico = ref(null)
const loadingResumenHistorico = ref(false)

const resumenDesdeISO = computed(() => resumenDesde.value.toISOString().slice(0, 10))
const resumenHastaISO = computed(() => resumenHasta.value.toISOString().slice(0, 10))

async function cargarResumenHistorico() {
  loadingResumenHistorico.value = true
  grupoSeleccionadoGen.value = null
  grupoSeleccionadoCon.value = null
  try {
    const { data } = await api.get('/reporte-energia/resumen-historico', {
      params: { desde: resumenDesdeISO.value, hasta: resumenHastaISO.value },
    })
    resumenHistorico.value = data
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.detail || 'No se pudo cargar el resumen histórico.', life: 4000 })
    resumenHistorico.value = null
  } finally {
    loadingResumenHistorico.value = false
  }
}

// Colores suaves por grupo (decidido con el usuario 2026-08-21) -- mismos
// 3 tonos (verde/ámbar/rosa) se reusan como semáforo de severidad en las
// tablas de abajo, así que "Medidor"/"bajo % de problema" y "Estimación"/
// "% medio" comparten intención visual aunque sean secciones distintas.
const GRUPO_COLOR = {
  'Medidor': '#4f9d78', 'Inversor': '#6b8fd6', 'Estimación': '#c9a13f',
  'Sin fuente': '#c97086', 'Otro': '#52596b',
}
function grupoColor(etiqueta) {
  return { texto: GRUPO_COLOR[etiqueta] || '#52596b' }
}

function pctDe(n, total) {
  return total ? Math.round((n / total) * 100) : 0
}
function totalDias(items) {
  return items.reduce((s, i) => s + i.total, 0)
}
function conPct(items) {
  const total = totalDias(items)
  return items.map(i => ({ ...i, pct: total ? Math.round((i.total / total) * 100) : 0 }))
}
const kpiGen = computed(() => conPct(resumenHistorico.value?.distribucion_fuente_generacion || []))
const kpiCon = computed(() => conPct(resumenHistorico.value?.distribucion_fuente_consumo || []))

// Barras separadas (no apiladas) -- comparar el tamaño de cada grupo es
// más preciso con una escala común en 0 que con segmentos de un stacked
// bar (decidido con el usuario 2026-08-21). El % exacto se dibuja encima
// de cada barra con un plugin liviano en vez de agregar chartjs-plugin-
// datalabels como dependencia nueva solo para esto.
const dataLabelPlugin = {
  id: 'pctLabel',
  afterDatasetsDraw(chart) {
    const { ctx } = chart
    chart.data.datasets.forEach((dataset, i) => {
      chart.getDatasetMeta(i).data.forEach((bar, index) => {
        ctx.save()
        ctx.fillStyle = '#2C2039'
        ctx.font = '700 12px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(`${dataset.data[index]}%`, bar.x, bar.y - 8)
        ctx.restore()
      })
    })
  },
}
function chartDeGrupos(items) {
  return {
    labels: items.map(i => i.etiqueta),
    datasets: [{ data: items.map(i => i.pct), backgroundColor: items.map(i => grupoColor(i.etiqueta).texto), borderRadius: 6, maxBarThickness: 70 }],
  }
}
function chartOptionsPara(tipo, items) {
  return {
    responsive: true, maintainAspectRatio: false, layout: { padding: { top: 20 } },
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => `${items[ctx.dataIndex].total} días` } },
    },
    scales: {
      x: { ticks: { font: { size: 11, weight: '600' }, color: '#6b5a8a' }, grid: { display: false } },
      y: { display: false, beginAtZero: true, max: 100 },
    },
    onClick: (evt, elements) => {
      if (!elements.length) return
      toggleGrupo(tipo, items[elements[0].index].etiqueta)
    },
    onHover: (evt, elements) => { evt.native.target.style.cursor = elements.length ? 'pointer' : 'default' },
  }
}
const chartGen = computed(() => chartDeGrupos(kpiGen.value))
const chartCon = computed(() => chartDeGrupos(kpiCon.value))
const chartOptionsGen = computed(() => chartOptionsPara('gen', kpiGen.value))
const chartOptionsCon = computed(() => chartOptionsPara('con', kpiCon.value))

// Semáforo de severidad -- para "% de días con un problema" más alto es
// peor (incompletos, revisar manualmente); para "% de éxito" más alto es
// mejor (recuperación activa) -- por eso son dos funciones separadas, no
// una invertida, para que el umbral de cada una sea explícito.
function severidadColor(pct) {
  return pct > 30 ? GRUPO_COLOR['Sin fuente'] : pct > 10 ? GRUPO_COLOR['Estimación'] : GRUPO_COLOR['Medidor']
}
function severidadColorExito(pct) {
  return pct < 34 ? GRUPO_COLOR['Sin fuente'] : pct < 70 ? GRUPO_COLOR['Estimación'] : GRUPO_COLOR['Medidor']
}
function chipEstilo(pct, modo) {
  const color = modo === 'neutral' ? GRUPO_COLOR['Medidor'] : severidadColor(pct)
  return { background: color + '22', color }
}

// Drill-down por frontera al hacer clic en una tarjeta KPI -- independiente
// para Generación/Consumo, ya que son secciones separadas en la misma vista.
const grupoSeleccionadoGen = ref(null)
const grupoSeleccionadoCon = ref(null)
function toggleGrupo(tipo, etiqueta) {
  const actual = tipo === 'gen' ? grupoSeleccionadoGen : grupoSeleccionadoCon
  actual.value = actual.value === etiqueta ? null : etiqueta
}
function detalleFiltrado(tipo) {
  const grupo = tipo === 'gen' ? grupoSeleccionadoGen.value : grupoSeleccionadoCon.value
  const detalle = tipo === 'gen'
    ? resumenHistorico.value?.detalle_fuente_generacion : resumenHistorico.value?.detalle_fuente_consumo
  if (!grupo || !detalle) return []
  return detalle.filter(d => d.grupo === grupo).sort((a, b) => b.dias_grupo - a.dias_grupo)
}

// Salta a "Historial" en la fecha 'hasta' del rango consultado y selecciona
// esa frontera -- si esa fecha puntual no tiene fila para ella (pudo no
// generar/reportar justo ese día), se avisa en vez de fallar en silencio.
async function irAFronteraHistorial(frontera_id) {
  activeTab.value = 1
  fechaHistorial.value = new Date(resumenHasta.value)
  await cargarHistorial()
  const f = filasHistorial.value.find(x => x.frontera_id === frontera_id)
  if (f) {
    seleccionHistorial.value = f
  } else {
    toast.add({
      severity: 'info', summary: 'Sin fila en esa fecha',
      detail: 'Esta frontera no tiene reporte en la fecha "hasta" del rango -- prueba con otra fecha en Historial.',
      life: 5000,
    })
  }
}

async function cargarResumen() {
  try {
    const { data } = await api.get('/reporte-energia/resumen', { params: { fecha: fechaISO.value } })
    resumen.value = data
  } catch (e) {
    resumen.value = null
  }
}

async function cargarLista(silent = false) {
  if (!silent) loadingLista.value = true
  try {
    const { data } = await api.get('/reporte-energia/fronteras', { params: { fecha: fechaISO.value } })
    filas.value = data
  } catch (e) {
    if (!silent) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el reporte de ese día.', life: 4000 })
      filas.value = []
    }
  } finally {
    if (!silent) loadingLista.value = false
  }
}

async function cargarHistorial() {
  loadingHistorial.value = true
  try {
    const f = fechaHistorialISO.value
    const { data } = await api.get('/reporte-energia/fronteras', { params: { fecha: f } })
    filasHistorial.value = data
  } catch (e) {
    filasHistorial.value = []
  } finally {
    loadingHistorial.value = false
  }
}

// Estado en Quoia (aprobación de XM sobre lo YA enviado) -- GET liviano
// para mostrar lo que ya se sabe (sin golpear Quoia) al entrar o cambiar
// de fecha; si hay algo todavía 'en_espera' de un envío anterior, retoma
// el polling solo. detenerPollingEstadoQuoia() no borra estadoQuoia -- el
// panel se queda visible con el último estado conocido, solo deja de
// refrescarse (pedido 2026-08-21).
async function cargarEstadoQuoiaActual() {
  try {
    const { data } = await api.get('/reporte-energia/estado-quoia', { params: { fecha: fechaISO.value } })
    estadoQuoia.value = data.total > 0 ? data : null
    if (estadoQuoia.value && estadoQuoia.value.en_espera > 0) iniciarPollingEstadoQuoia()
  } catch {
    estadoQuoia.value = null
  }
}

async function revisarEstadoQuoia() {
  try {
    const { data } = await api.post(
      '/reporte-energia/estado-quoia', null,
      { params: { fecha: fechaISO.value }, timeout: 180000 },
    )
    estadoQuoia.value = data
    if (data.en_espera === 0) detenerPollingEstadoQuoia()
  } catch {
    // silencioso -- se reintenta en el próximo tick del polling
  }
}

function iniciarPollingEstadoQuoia() {
  if (estadoQuoiaTimer) return
  estadoQuoiaPolling.value = true
  estadoQuoiaTimer = setInterval(revisarEstadoQuoia, 2 * 60 * 1000)
}
function detenerPollingEstadoQuoia() {
  estadoQuoiaPolling.value = false
  if (estadoQuoiaTimer) {
    clearInterval(estadoQuoiaTimer)
    estadoQuoiaTimer = null
  }
}
onUnmounted(() => detenerPollingEstadoQuoia())

watch(fecha, () => {
  seleccion.value = null; cargarResumen(); cargarLista()
  detenerPollingEstadoQuoia()
  cargarEstadoQuoiaActual()
})

// Busca en la lista ya cargada (de la fecha/tab correctos) la fila que
// coincide con ?frontera_id= de la URL, y la selecciona -- mismo objeto
// `fila` completo que ya usa seleccionar(). Es una function declaration
// (hoisted) y su CUERPO solo corre dentro de onMounted, después de que
// seleccion/seleccionHistorial (declaradas más abajo) ya existen -- así que
// referenciarlas acá adentro es seguro aunque la declaración esté después.
function restaurarSeleccionDesdeQuery() {
  const fid = route.query.frontera_id ? Number(route.query.frontera_id) : null
  if (!fid) return
  if (activeTab.value === 1) {
    const f = filasHistorial.value.find(x => x.frontera_id === fid)
    if (f) seleccionHistorial.value = f
  } else {
    const f = filas.value.find(x => x.frontera_id === fid)
    if (f) seleccion.value = f
  }
}

onMounted(async () => {
  await Promise.all([cargarResumen(), cargarLista(), cargarEstadoQuoiaActual()])
  if (activeTab.value === 1) await cargarHistorial()
  restaurarSeleccionDesdeQuery()
})

function semaforo(f) {
  if (f.revisar_manualmente) return 'critical'
  if (['1', 'CGM'].includes(String(f.caso))) return 'success'
  return 'warning'
}

const filasFiltradas = computed(() => {
  if (!filtroSemaforo.value) return filas.value
  return filas.value.filter(f => semaforo(f) === filtroSemaforo.value)
})

const stats = computed(() => {
  // Las tarjetas deben reflejar el día que se está viendo -- 'Revisión de
  // hoy' usa `filas` (fecha), 'Historial' usa `filasHistorial`
  // (fechaHistorial). Antes siempre mostraban `filas`, así que al cambiar
  // de día en Historial las tarjetas se quedaban con el conteo de 'hoy'.
  const all = activeTab.value === 1 ? filasHistorial.value : filas.value
  return [
    { label: 'Total', value: all.length, color: '#2C2039', filtro: null },
    { label: 'Revisar', value: all.filter(f => f.revisar_manualmente).length, color: '#D64455', filtro: 'critical' },
    { label: 'Corregido automático', value: all.filter(f => semaforo(f) === 'warning').length, color: '#F0C040', filtro: 'warning' },
    { label: 'Reporte válido', value: all.filter(f => semaforo(f) === 'success').length, color: '#10B981', filtro: 'success' },
  ]
})

// ── Selección (vista dividida: lista + detalle) ───────────────────────────
const seleccion = ref(null)
const seleccionHistorial = ref(null)

function seleccionar(fila, origen) {
  if (origen === 'historial') seleccionHistorial.value = fila
  else seleccion.value = fila
}

// Refleja tab/fecha/frontera elegidos en la URL (router.replace, no push --
// mismo patrón que los filtros de Fronteras/GESCON: no ensucia el historial
// con cada clic, solo deja la URL reconstruible si se navega afuera y se
// vuelve). IMPORTANTE: este watch() arma su arreglo de fuentes con
// `seleccion`/`seleccionHistorial` en el momento en que esta línea se
// ejecuta -- por eso va DESPUÉS de sus `const` (a diferencia de una función,
// un array-literal de argumentos no es diferido). Ponerlo antes de esas
// declaraciones tiró la vista entera con "Cannot access before
// initialization" (2026-08-18).
watch([activeTab, seleccion, seleccionHistorial, fecha, fechaHistorial], () => {
  const query = { tab: activeTab.value === 1 ? 'historial' : 'hoy' }
  if (activeTab.value === 1) {
    query.fecha = fechaHistorialISO.value
    if (seleccionHistorial.value) query.frontera_id = seleccionHistorial.value.frontera_id
  } else {
    query.fecha = fechaISO.value
    if (seleccion.value) query.frontera_id = seleccion.value.frontera_id
  }
  router.replace({ query })
})

// ── Acciones globales ──────────────────────────────────────────────────
async function ejecutarClasificacion() {
  ejecutando.value = true
  try {
    await api.post('/reporte-energia/ejecutar', null, { params: { fecha: fechaISO.value } })
    toast.add({
      severity: 'info', summary: 'Clasificación iniciada',
      detail: 'Corre en segundo plano -- puede tardar varios minutos si hay medidores incompletos. La tabla se va a ir actualizando sola.',
      life: 6000,
    })
    sondearResultado()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.detail || 'No se pudo iniciar la clasificación.', life: 4000 })
    ejecutando.value = false
  }
}

// Cooperativo, no inmediato: el backend revisa esta señal entre frontera y
// frontera (ver orquestador._CANCELAR), nunca corta a media frontera. El
// sondeo ya en curso (sondearResultado) es el que detecta cuándo realmente
// paró y apaga el spinner.
async function detenerClasificacion() {
  deteniendo.value = true
  try {
    await api.post('/reporte-energia/ejecutar/cancelar', null, { params: { fecha: fechaISO.value } })
    toast.add({ severity: 'info', summary: 'Deteniendo…', detail: 'Se detiene después de terminar la frontera en curso, no de inmediato.', life: 5000 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo pedir la detención.', life: 4000 })
  } finally {
    deteniendo.value = false
  }
}

// La corrida real vive en un hilo del backend (ver orquestador.ejecutar_dia_background)
// y guarda avance parcial cada 5 fronteras -- con ~100+ fronteras puede tardar bastante
// más de lo que un límite fijo de intentos alcanzaría a cubrir. En vez de un tope de
// tiempo, se sigue sondeando MIENTRAS el conteo de filas siga creciendo; solo se
// rinde si pasan varios ciclos seguidos sin ver ninguna fila nueva (terminó o se colgó).
function sondearResultado() {
  const fechaSondeada = fechaISO.value
  let totalAntes = filas.value.length
  let ciclosSinCambio = 0
  const MAX_CICLOS_SIN_CAMBIO = 12 // ~2 minutos sin avance -- ahí sí se rinde

  const intervalo = setInterval(async () => {
    if (fechaISO.value !== fechaSondeada) {
      clearInterval(intervalo)
      ejecutando.value = false
      return
    }
    await cargarResumen()
    await cargarLista(true)
    if (filas.value.length > totalAntes) {
      totalAntes = filas.value.length
      ciclosSinCambio = 0
    } else {
      ciclosSinCambio += 1
    }
    if (ciclosSinCambio >= MAX_CICLOS_SIN_CAMBIO) {
      clearInterval(intervalo)
      ejecutando.value = false
      avisarSiHuboFallidas(fechaSondeada)
    }
  }, 10000)
}

// Una vez el sondeo se rinde (dejó de crecer el conteo de filas), se asume
// que la corrida terminó -- se consulta el resultado real guardado por
// ejecutar_dia_background (ver GET /ejecutar/estado) para avisar si alguna
// frontera falló, en vez del silencio actual donde eso solo queda en los
// logs de Railway.
async function avisarSiHuboFallidas(fechaSondeada) {
  try {
    const { data } = await api.get('/reporte-energia/ejecutar/estado', { params: { fecha: fechaSondeada } })
    if (data.error_general) {
      toast.add({ severity: 'error', summary: 'Clasificación interrumpida', detail: data.error_general, life: 8000 })
    } else if (data.cancelado) {
      toast.add({
        severity: 'warn', summary: 'Clasificación detenida',
        detail: data.fallidas.length
          ? `Se detuvo manualmente. Además, ${data.fallidas.length} fronteras fallaron antes de detenerse: ${data.fallidas.join(', ')}`
          : 'Se detuvo manualmente antes de terminar todas las fronteras.',
        life: 8000,
      })
    } else if (data.fallidas.length) {
      toast.add({
        severity: 'warn', summary: 'Clasificación terminada con errores',
        detail: `${data.fallidas.length} fronteras fallaron y quedaron marcadas para revisar: ${data.fallidas.join(', ')}`,
        life: 8000,
      })
    }
  } catch (e) {
    // silencioso -- esto es un aviso adicional, no debe interrumpir el flujo normal
  }
}

async function generarExcel() {
  generandoExcel.value = true
  try {
    const response = await api.get('/reporte-energia/excel', {
      params: { fecha: fechaISO.value }, responseType: 'blob',
    })
    const url = URL.createObjectURL(response.data)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte-energia-${fechaISO.value}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo generar el Excel.', life: 4000 })
  } finally {
    generandoExcel.value = false
  }
}

async function enviarReporte() {
  enviando.value = true
  try {
    const { data } = await api.post('/reporte-energia/enviar', null, { params: { fecha: fechaISO.value }, timeout: 300000 })
    if (data.bloqueado) {
      toast.add({ severity: 'warn', summary: 'Envío bloqueado', detail: data.motivo_bloqueo, life: 5000 })
    } else if (data.fallidos.length) {
      toast.add({
        severity: 'warn', summary: 'Reporte enviado con fallos',
        detail: `${data.enviados} fronteras enviadas, ${data.fallidos.length} fallidas — ${data.fallidos.join('; ')}`,
        life: 8000,
      })
    } else {
      toast.add({ severity: 'success', summary: 'Reporte enviado', detail: `${data.enviados} fronteras enviadas`, life: 3000 })
    }
    if (!data.bloqueado) {
      await revisarEstadoQuoia()
      if (estadoQuoia.value && estadoQuoia.value.en_espera > 0) iniciarPollingEstadoQuoia()
    }
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.detail || 'No se pudo enviar el reporte.', life: 4000 })
  } finally {
    enviando.value = false
  }
}


</script>

<style scoped>
.workspace {
  display: grid;
  grid-template-columns: minmax(280px, 360px) 1fr;
  gap: 1rem;
  align-items: start;
}
@media (max-width: 860px) {
  .workspace { grid-template-columns: 1fr; }
}
.detail-pane {
  background: white;
  border: 1px solid #e8e0f0;
  border-radius: 0.75rem;
  padding: 1.25rem;
  min-height: 20rem;
}
:deep(.resumen-tabla tbody tr) { cursor: pointer; }
</style>
