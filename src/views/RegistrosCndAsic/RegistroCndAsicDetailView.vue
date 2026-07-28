<template>
  <div class="space-y-4" v-if="reg">
    <!-- Cabecera -->
    <div class="flex items-center gap-3">
      <Button icon="pi pi-arrow-left" text rounded @click="$router.push('/registros-cnd-asic')" />
      <div class="flex-1">
        <h1 class="text-lg font-bold" style="color:#2C2039;">{{ reg.nombre_comercial }}</h1>
        <p class="text-xs mt-0.5" style="color:#9b89b5;">
          {{ [reg.codigo_cnd, reg.clasificacion_regulatoria, reg.tecnologia, reg.operador_red].filter(Boolean).join(' · ') || '—' }}
        </p>
      </div>
      <div class="text-right">
        <div class="text-2xl font-bold" style="color:#6E3FB8;">{{ reg.avance_pct }}%</div>
        <div class="text-xs" style="color:#9b89b5;">avance</div>
      </div>
    </div>

    <div class="rounded-full overflow-hidden" style="height:10px;background:#ECE7F2;">
      <div :style="`height:100%;width:${Math.min(100, reg.avance_pct)}%;background:#915BD8;`"></div>
    </div>

    <div v-if="reg.siguiente_paso && reg.avance_pct < 100" class="bg-white rounded-xl p-3 shadow-sm" style="border:1px solid #e8e0f0;">
      <span class="text-xs" style="color:#9b89b5;">Siguiente paso:</span>
      <span class="font-mono font-semibold ml-1" style="color:#915BD8;">{{ reg.siguiente_paso.codigo }}</span>
      <span class="text-sm" style="color:#2C2039;"> — {{ reg.siguiente_paso.descripcion }}</span>
      <span class="text-xs ml-2" style="color:#9b89b5;">({{ reg.siguiente_paso.etiqueta_etapa }} · resp: {{ reg.siguiente_paso.responsable || 'por definir' }})</span>
    </div>

    <div v-if="reg.bloqueos?.length" class="bg-white rounded-xl p-3 shadow-sm" style="border:1px solid #f0c0c0;">
      <div class="text-sm font-semibold mb-1" style="color:#b91c1c;">⛔ Bloqueos</div>
      <div v-for="b in reg.bloqueos" :key="b.etapa" class="text-xs" style="color:#2C2039;">
        <strong>{{ b.etiqueta }}</strong> — {{ b.motivo }}
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm overflow-hidden" style="border:1px solid #e8e0f0;">
      <TabView>
        <!-- GENERAL (datos del registro) -->
        <TabPanel header="General">
          <div class="grid md:grid-cols-3 gap-3 p-1">
            <label class="text-xs" style="color:#2C2039;">N° expediente
              <InputText v-model="general.numero_expediente" class="w-full" /></label>
            <label class="text-xs" style="color:#2C2039;">ID requerimiento OR
              <InputText v-model="general.id_requerimiento_or" class="w-full" /></label>
            <label class="text-xs" style="color:#2C2039;">N° solicitud appweb
              <InputText v-model="general.numero_solicitud_appweb" class="w-full" /></label>
            <label class="text-xs" style="color:#2C2039;">Fecha conexión estimada
              <input type="date" v-model="general.fecha_conexion_estimada" class="w-full border rounded px-2 py-1" style="border-color:#e8e0f0;" /></label>
            <label class="text-xs" style="color:#2C2039;">Vigencia CREG 174 / ámbito
              <input type="date" v-model="general.vigencia_aprobacion_conexion" class="w-full border rounded px-2 py-1" style="border-color:#e8e0f0;" /></label>
            <label class="text-xs" style="color:#2C2039;">Fecha visita protecciones
              <input type="date" v-model="general.fecha_visita_protecciones" class="w-full border rounded px-2 py-1" style="border-color:#e8e0f0;" /></label>
            <label class="text-xs" style="color:#2C2039;">Tipo visita protecciones
              <Select v-model="general.tipo_visita_protecciones" :options="cat.tipos_visita" showClear placeholder="—" class="w-full" /></label>
            <label class="text-xs col-span-2" style="color:#2C2039;">Punto de conexión (texto)
              <InputText v-model="general.punto_conexion_texto" class="w-full" /></label>
            <label class="text-xs col-span-3" style="color:#2C2039;">Notas
              <Textarea v-model="general.notas" rows="2" class="w-full" /></label>
            <div class="flex gap-4 col-span-3">
              <label class="flex items-center gap-2 text-sm" style="color:#2C2039;">
                <Checkbox v-model="general.exporta" :binary="true" /> Exporta energía</label>
              <label class="flex items-center gap-2 text-sm" style="color:#2C2039;">
                <Checkbox v-model="general.comercializador_es_or" :binary="true" /> Comercializador es el OR</label>
            </div>
          </div>
          <Button label="Guardar datos generales" icon="pi pi-save" size="small" class="mt-2" :loading="guardandoGeneral"
            @click="guardarGeneral" style="background:#915BD8; border-color:#915BD8;" />
        </TabPanel>

        <!-- ETAPAS -->
        <TabPanel header="Etapas">
          <div class="space-y-3 p-1">
            <div v-for="e in reg.por_etapa" :key="e.etapa"
              class="rounded-lg p-3" :style="`border:1px solid ${e.bloqueada ? '#f0c0c0' : '#ECE7F2'};`">
              <div class="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div class="text-sm font-semibold" style="color:#2C2039;">{{ e.etiqueta }}</div>
                  <div class="text-xs" style="color:#9b89b5;">
                    Estado: <span class="font-medium" style="color:#6E3FB8;">{{ estadoLabel(e.estado_actual) }}</span>
                    <span v-if="e.responsable_actual"> · resp: {{ e.responsable_actual }}</span>
                    <span v-if="e.causa_bloqueo"> · {{ e.causa_bloqueo }}</span>
                  </div>
                </div>
                <div class="text-xs font-semibold" style="color:#6E3FB8;">{{ e.ganado_pct }}/{{ e.total_pct }}% · {{ e.completos }}/{{ e.total_hitos }} hitos</div>
              </div>
              <div class="flex items-center gap-1 flex-wrap mt-2">
                <span class="text-xs" style="color:#9b89b5;">Avanzar a:</span>
                <button v-for="s in siguientesEstados(e)" :key="s"
                  class="px-2.5 py-1 rounded-full text-xs border transition"
                  :disabled="transicionando"
                  style="background:#fff;color:#6E3FB8;border-color:#d9c9f0;"
                  @click="hacerTransicion(e.etapa, s)">
                  {{ estadoLabel(s) }}
                </button>
                <span v-if="!siguientesEstados(e).length" class="text-xs" style="color:#9b89b5;">— etapa finalizada</span>
              </div>
            </div>
          </div>
        </TabPanel>

        <!-- HITOS -->
        <TabPanel header="Hitos">
          <DataTable :value="reg.hitos" class="text-sm" rowHover>
            <Column field="codigo" header="Hito" style="width:80px">
              <template #body="{ data }">
                <span class="font-mono font-semibold">{{ data.completado ? '✓ ' : '' }}{{ data.codigo }}</span>
              </template>
            </Column>
            <Column field="descripcion" header="Descripción" />
            <Column field="peso_pct" header="Peso" style="width:80px">
              <template #body="{ data }">{{ data.peso_pct }}%</template>
            </Column>
            <Column header="Estado" style="width:110px">
              <template #body="{ data }">
                <Tag :value="data.completado ? 'Completado' : 'Pendiente'" :severity="data.completado ? 'success' : 'secondary'" class="text-xs" />
              </template>
            </Column>
          </DataTable>
        </TabPanel>

        <!-- PARÁMETROS 9.3 -->
        <TabPanel header="Parámetros 9.3">
          <div class="grid md:grid-cols-2 gap-4 p-1">
            <div>
              <div class="text-sm font-semibold mb-2" style="color:#2C2039;">Parámetros técnicos</div>
              <div class="grid grid-cols-2 gap-2">
                <label v-for="f in campos93" :key="f.k" class="text-xs" style="color:#2C2039;">
                  {{ f.label }}
                  <input type="number" step="any" v-model.number="params[f.k]" class="w-full border rounded px-2 py-1 mt-0.5" style="border-color:#e8e0f0;" />
                </label>
              </div>
              <Button label="Guardar parámetros" icon="pi pi-save" size="small" class="mt-3" :loading="guardandoParams"
                @click="guardarParams" style="background:#915BD8; border-color:#915BD8;" />
            </div>
            <div>
              <div class="flex items-center justify-between mb-2">
                <div class="text-sm font-semibold" style="color:#2C2039;">Validación</div>
                <Tag v-if="validacion" :value="validacion.sin_parametros ? 'sin datos' : (validacion.valido ? 'sin errores' : 'con errores')"
                  :severity="validacion.sin_parametros ? 'secondary' : (validacion.valido ? 'success' : 'danger')" class="text-xs" />
              </div>
              <div v-if="validacion && validacion.resultados.length" class="space-y-1">
                <div v-for="(r, i) in validacion.resultados" :key="i" class="flex items-center justify-between text-xs rounded px-2 py-1" style="background:#faf8fd;">
                  <span style="color:#2C2039;">{{ r.regla }}</span>
                  <Tag :value="r.severidad" :severity="sevColor(r.severidad)" class="text-xs" :title="r.mensaje" />
                </div>
              </div>
              <p v-else class="text-xs" style="color:#9b89b5;">Guarda parámetros para ver la validación.</p>
            </div>
          </div>
        </TabPanel>

        <!-- EQUIPOS + DOCUMENTOS -->
        <TabPanel header="Frontera y documentos">
          <div class="space-y-5 p-1">
            <div>
              <div class="flex items-center justify-between mb-2">
                <div class="text-sm font-semibold" style="color:#2C2039;">Equipos de frontera</div>
                <Button label="Agregar equipo" icon="pi pi-plus" size="small" text @click="abrirEquipo" />
              </div>
              <DataTable :value="equipos" class="text-sm" rowHover>
                <template #empty><div class="py-4 text-center text-xs" style="color:#9b89b5;">Sin equipos.</div></template>
                <Column field="tipo" header="Tipo" />
                <Column field="marca" header="Marca" />
                <Column field="modelo" header="Modelo" />
                <Column field="serial" header="Serial" />
                <Column field="fecha_vencimiento_calibracion" header="Venc. calibración" />
                <Column header="" style="width:48px">
                  <template #body="{ data }">
                    <Button icon="pi pi-trash" text rounded size="small" severity="danger" @click="borrarEquipo(data)" />
                  </template>
                </Column>
              </DataTable>
            </div>
            <div>
              <div class="flex items-center justify-between mb-2">
                <div class="text-sm font-semibold" style="color:#2C2039;">Documentos</div>
                <Button label="Agregar documento" icon="pi pi-plus" size="small" text @click="abrirDoc" />
              </div>
              <DataTable :value="documentos" class="text-sm" rowHover>
                <template #empty><div class="py-4 text-center text-xs" style="color:#9b89b5;">Sin documentos.</div></template>
                <Column field="tipo" header="Tipo" />
                <Column field="radicado" header="Radicado" />
                <Column field="estado" header="Estado" />
                <Column field="firmado_por" header="Firmado por" />
                <Column header="" style="width:90px">
                  <template #body="{ data }">
                    <a v-if="data.url_drive" :href="data.url_drive" target="_blank" class="mr-1"><i class="pi pi-external-link" style="color:#915BD8;" /></a>
                    <Button icon="pi pi-trash" text rounded size="small" severity="danger" @click="borrarDoc(data)" />
                  </template>
                </Column>
              </DataTable>
            </div>
          </div>
        </TabPanel>

        <!-- ALERTAS -->
        <TabPanel header="Alertas">
          <div class="p-1">
            <div class="flex items-center justify-between mb-2">
              <div class="text-sm font-semibold" style="color:#2C2039;">Alertas</div>
              <Button label="Recomputar" icon="pi pi-refresh" size="small" :loading="recomputando" @click="recomputar" />
            </div>
            <div v-if="alertas.length" class="space-y-2">
              <div v-for="(a, i) in alertas" :key="i" class="rounded-lg p-2 text-sm" style="border-left:3px solid #f6b73c;background:#fffbf0;">
                <div class="text-xs font-semibold" style="color:#b45309;">{{ a.tipo }}</div>
                <div style="color:#2C2039;">{{ a.mensaje }}</div>
              </div>
            </div>
            <p v-else class="text-xs" style="color:#9b89b5;">Sin alertas. Usa «Recomputar» para recalcular con las fechas actuales.</p>
          </div>
        </TabPanel>

        <!-- CORREOS -->
        <TabPanel header="Correos">
          <div class="p-1 space-y-2">
            <div class="text-sm" style="color:#2C2039;">Genera un borrador de correo tipo (se rellena con los datos del proyecto):</div>
            <div class="flex gap-2 flex-wrap">
              <Button label="Firmas al OR (9.1/9.7)" size="small" outlined @click="generarCorreo('SOLICITUD_FIRMAS_OR')" />
              <Button label="Creación en MDC (XM)" size="small" outlined @click="generarCorreo('CREACION_MDC_XM')" />
              <Button label="Documentación (Solenium)" size="small" outlined @click="generarCorreo('DOC_FRONTERA_SOLENIUM')" />
            </div>
          </div>
        </TabPanel>
      </TabView>
    </div>

    <!-- Dialogo equipo -->
    <Dialog v-model:visible="equipoDialog" modal header="Nuevo equipo de frontera" :style="{ width: '30rem' }">
      <div class="grid grid-cols-2 gap-3">
        <label class="text-xs col-span-2" style="color:#2C2039;">Tipo *
          <Select v-model="equipoForm.tipo" :options="cat.tipos_equipo" placeholder="Tipo…" class="w-full" />
        </label>
        <label class="text-xs" style="color:#2C2039;">Marca<InputText v-model="equipoForm.marca" class="w-full" /></label>
        <label class="text-xs" style="color:#2C2039;">Modelo<InputText v-model="equipoForm.modelo" class="w-full" /></label>
        <label class="text-xs" style="color:#2C2039;">Serial<InputText v-model="equipoForm.serial" class="w-full" /></label>
        <label class="text-xs" style="color:#2C2039;">Venc. calibración<input type="date" v-model="equipoForm.fecha_vencimiento_calibracion" class="w-full border rounded px-2 py-1" style="border-color:#e8e0f0;" /></label>
        <label class="text-xs" style="color:#2C2039;">Solicitud Solenium<input type="date" v-model="equipoForm.fecha_solicitud_solenium" class="w-full border rounded px-2 py-1" style="border-color:#e8e0f0;" /></label>
        <label class="text-xs" style="color:#2C2039;">Envío al OR<input type="date" v-model="equipoForm.fecha_envio_or" class="w-full border rounded px-2 py-1" style="border-color:#e8e0f0;" /></label>
      </div>
      <template #footer>
        <Button label="Cancelar" text @click="equipoDialog = false" />
        <Button label="Agregar" :disabled="!equipoForm.tipo" @click="crearEquipo" style="background:#915BD8; border-color:#915BD8;" />
      </template>
    </Dialog>

    <!-- Dialogo documento -->
    <Dialog v-model:visible="docDialog" modal header="Nuevo documento" :style="{ width: '30rem' }">
      <div class="grid grid-cols-2 gap-3">
        <label class="text-xs col-span-2" style="color:#2C2039;">Tipo *
          <Select v-model="docForm.tipo" :options="cat.tipos_documento" filter placeholder="Tipo…" class="w-full" />
        </label>
        <label class="text-xs" style="color:#2C2039;">Radicado<InputText v-model="docForm.radicado" class="w-full" /></label>
        <label class="text-xs" style="color:#2C2039;">Firmado por<InputText v-model="docForm.firmado_por" class="w-full" /></label>
        <label class="text-xs" style="color:#2C2039;">Emisión<input type="date" v-model="docForm.fecha_emision" class="w-full border rounded px-2 py-1" style="border-color:#e8e0f0;" /></label>
        <label class="text-xs" style="color:#2C2039;">Vencimiento<input type="date" v-model="docForm.fecha_vencimiento" class="w-full border rounded px-2 py-1" style="border-color:#e8e0f0;" /></label>
        <label class="text-xs col-span-2" style="color:#2C2039;">Enlace Drive<InputText v-model="docForm.url_drive" class="w-full" /></label>
      </div>
      <template #footer>
        <Button label="Cancelar" text @click="docDialog = false" />
        <Button label="Agregar" :disabled="!docForm.tipo" @click="crearDoc" style="background:#915BD8; border-color:#915BD8;" />
      </template>
    </Dialog>

    <!-- Dialogo correo -->
    <Dialog v-model:visible="correoDialog" modal header="Borrador de correo" :style="{ width: '42rem' }">
      <div v-if="correo" class="space-y-2 text-sm">
        <div><span class="text-xs font-semibold" style="color:#9b89b5;">Para:</span> {{ (correo.para || []).join(', ') || '—' }}</div>
        <div><span class="text-xs font-semibold" style="color:#9b89b5;">CC:</span> {{ (correo.cc || []).join(', ') }}</div>
        <div><span class="text-xs font-semibold" style="color:#9b89b5;">Asunto:</span> {{ correo.asunto }}</div>
        <div v-if="correo.adjuntos?.length"><span class="text-xs font-semibold" style="color:#9b89b5;">Adjuntos:</span> {{ correo.adjuntos.join('; ') }}</div>
        <Textarea :modelValue="correo.cuerpo" rows="12" class="w-full text-sm" readonly />
      </div>
      <template #footer>
        <Button label="Copiar cuerpo" icon="pi pi-copy" text @click="copiarCorreo" />
        <Button label="Cerrar" @click="correoDialog = false" style="background:#915BD8; border-color:#915BD8;" />
      </template>
    </Dialog>
  </div>

  <div v-else class="flex items-center justify-center py-20">
    <i class="pi pi-spin pi-spinner text-2xl" style="color:#915BD8;" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import api from '@/api/client'

const route = useRoute()
const toast = useToast()
const proyectoId = route.params.proyectoId

const reg = ref(null)
const regId = ref(null)
const cat = ref({ transiciones: {}, tipos_equipo: [], tipos_documento: [], tipos_visita: [] })
const general = ref({})
const params = ref({})
const validacion = ref(null)
const equipos = ref([])
const documentos = ref([])
const alertas = ref([])
const transicionando = ref(false)
const guardandoParams = ref(false)
const guardandoGeneral = ref(false)
const recomputando = ref(false)

const CAMPOS_GENERAL = [
  'numero_expediente', 'id_requerimiento_or', 'numero_solicitud_appweb',
  'fecha_conexion_estimada', 'vigencia_aprobacion_conexion', 'fecha_visita_protecciones',
  'tipo_visita_protecciones', 'exporta', 'comercializador_es_or', 'punto_conexion_texto', 'notas',
]

const campos93 = [
  { k: 'voltaje_max_kv', label: 'V máx (kV)' },
  { k: 'voltaje_nominal_kv', label: 'V nom (kV)' },
  { k: 'voltaje_min_kv', label: 'V mín (kV)' },
  { k: 'in_eq_ka', label: 'In eq (kA)' },
  { k: 'icc_subtrans_pico_kap', label: 'Icc pico (kAp)' },
  { k: 'icc_subtrans_3f_ka', label: 'Icc 3F (kA)' },
  { k: 'icc_subtrans_2f_ka', label: 'Icc 2F (kA)' },
  { k: 'icc_subtrans_1f_ka', label: 'Icc 1F (kA)' },
  { k: 'icc_estado_estable_ka', label: 'Icc EE (kA)' },
  { k: 'impedancia_equivalente_ohm', label: 'Z eq (Ω)' },
  { k: 'frecuencia_max_hz', label: 'Frec máx (Hz)' },
  { k: 'frecuencia_min_hz', label: 'Frec mín (Hz)' },
]

function estadoLabel(s) {
  if (!s) return '—'
  return s.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())
}
function sevColor(s) {
  return { OK: 'success', ERROR: 'danger', ADVERTENCIA: 'warn', PENDIENTE: 'secondary' }[s] || 'secondary'
}
function siguientesEstados(e) {
  return (cat.value.transiciones?.[e.etapa]?.[e.estado_actual]) || []
}

function setReg(data) {
  reg.value = data
  regId.value = data.id
  alertas.value = data.alertas_pendientes || []
  general.value = Object.fromEntries(CAMPOS_GENERAL.map(k => [k, data[k] ?? (typeof data[k] === 'boolean' ? false : '')]))
  general.value.exporta = !!data.exporta
  general.value.comercializador_es_or = !!data.comercializador_es_or
}

async function materializar() {
  // crea el registro si no existe y devuelve su resumen
  const { data } = await api.post(`/registros-cnd/por-proyecto/${proyectoId}`)
  setReg(data)
}
async function recargarReg() {
  const { data } = await api.get(`/registros-cnd/${regId.value}`)
  setReg(data)
}
async function cargarCatalogos() {
  const { data } = await api.get('/registros-cnd/catalogos')
  cat.value = data
}
async function cargarParams() {
  const { data } = await api.get(`/registros-cnd/${regId.value}/parametros-93`)
  params.value = data || {}
  await cargarValidacion()
}
async function cargarValidacion() {
  const { data } = await api.get(`/registros-cnd/${regId.value}/validacion-93`)
  validacion.value = data
}
async function cargarEquipos() {
  const { data } = await api.get(`/registros-cnd/${regId.value}/equipos`)
  equipos.value = data
}
async function cargarDocumentos() {
  const { data } = await api.get(`/registros-cnd/${regId.value}/documentos`)
  documentos.value = data
}

async function guardarGeneral() {
  guardandoGeneral.value = true
  try {
    const payload = { ...general.value }
    for (const k of CAMPOS_GENERAL) if (payload[k] === '') payload[k] = null
    await api.patch(`/registros-cnd/${regId.value}`, payload)
    await recargarReg()
    toast.add({ severity: 'success', summary: 'Datos guardados', life: 2500 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo guardar', detail: e.response?.data?.detail ?? '', life: 6000 })
  } finally {
    guardandoGeneral.value = false
  }
}

async function hacerTransicion(etapa, aEstado) {
  transicionando.value = true
  try {
    const { data } = await api.post(`/registros-cnd/${regId.value}/transicion`, { etapa, a_estado: aEstado })
    setReg(data)
    toast.add({ severity: 'success', summary: 'Estado actualizado', life: 2500 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Transición no válida', detail: e.response?.data?.detail ?? '', life: 6000 })
  } finally {
    transicionando.value = false
  }
}

async function guardarParams() {
  guardandoParams.value = true
  try {
    const payload = {}
    for (const f of campos93) if (params.value[f.k] !== undefined && params.value[f.k] !== '') payload[f.k] = params.value[f.k]
    await api.put(`/registros-cnd/${regId.value}/parametros-93`, payload)
    await cargarValidacion()
    toast.add({ severity: 'success', summary: 'Parámetros guardados', life: 2500 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo guardar', detail: e.response?.data?.detail ?? '', life: 6000 })
  } finally {
    guardandoParams.value = false
  }
}

async function recomputar() {
  recomputando.value = true
  try {
    const { data } = await api.post(`/registros-cnd/${regId.value}/alertas/recomputar`)
    alertas.value = data.alertas || []
    toast.add({ severity: 'success', summary: `Alertas: ${data.alertas.length} (${data.creadas} nuevas)`, life: 3000 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error al recomputar', detail: e.response?.data?.detail ?? '', life: 5000 })
  } finally {
    recomputando.value = false
  }
}

// Equipos
const equipoDialog = ref(false)
const equipoForm = ref({})
function abrirEquipo() { equipoForm.value = {}; equipoDialog.value = true }
async function crearEquipo() {
  try {
    const payload = Object.fromEntries(Object.entries(equipoForm.value).filter(([, v]) => v !== '' && v != null))
    await api.post(`/registros-cnd/${regId.value}/equipos`, payload)
    equipoDialog.value = false
    await cargarEquipos()
    toast.add({ severity: 'success', summary: 'Equipo agregado', life: 2500 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo agregar', detail: e.response?.data?.detail ?? '', life: 5000 })
  }
}
async function borrarEquipo(row) {
  if (!confirm(`¿Eliminar el equipo ${row.tipo}?`)) return
  await api.delete(`/registros-cnd/${regId.value}/equipos/${row.id}`)
  await cargarEquipos()
}

// Documentos
const docDialog = ref(false)
const docForm = ref({ estado: 'BORRADOR' })
function abrirDoc() { docForm.value = { estado: 'BORRADOR' }; docDialog.value = true }
async function crearDoc() {
  try {
    const payload = Object.fromEntries(Object.entries(docForm.value).filter(([, v]) => v !== '' && v != null))
    await api.post(`/registros-cnd/${regId.value}/documentos`, payload)
    docDialog.value = false
    await cargarDocumentos()
    toast.add({ severity: 'success', summary: 'Documento agregado', life: 2500 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo agregar', detail: e.response?.data?.detail ?? '', life: 5000 })
  }
}
async function borrarDoc(row) {
  if (!confirm(`¿Eliminar el documento ${row.tipo}?`)) return
  await api.delete(`/registros-cnd/${regId.value}/documentos/${row.id}`)
  await cargarDocumentos()
}

// Correos
const correoDialog = ref(false)
const correo = ref(null)
async function generarCorreo(tipo) {
  try {
    const { data } = await api.post(`/registros-cnd/${regId.value}/correos/${tipo}`)
    correo.value = data
    correoDialog.value = true
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo generar', detail: e.response?.data?.detail ?? '', life: 5000 })
  }
}
function copiarCorreo() {
  if (correo.value?.cuerpo) navigator.clipboard?.writeText(correo.value.cuerpo)
  toast.add({ severity: 'success', summary: 'Cuerpo copiado', life: 2000 })
}

onMounted(async () => {
  try {
    await materializar()          // crea/obtiene el registro por proyecto_id
    await Promise.all([cargarCatalogos(), cargarParams(), cargarEquipos(), cargarDocumentos()])
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo abrir el proyecto', detail: e.response?.data?.detail ?? '', life: 6000 })
  }
})
</script>
