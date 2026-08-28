<template>
  <div v-if="resumen" class="space-y-4">
    <!-- Cabecera -->
    <div class="flex items-start gap-3">
      <Button icon="pi pi-arrow-left" text rounded @click="$router.push('/registros')" />
      <div class="flex-1 min-w-0">
        <h1 class="text-lg font-semibold truncate" style="color:#2C2039;">
          {{ resumen.nombre_comercial }}
        </h1>
        <div class="text-xs" style="color:#9b89b5;">
          {{ resumen.codigo_cnd || 'sin código CND' }}
          · {{ resumen.parametros_diligenciados }} de {{ resumen.parametros_totales }} datos diligenciados
        </div>
      </div>
    </div>

    <!-- Selector de proceso -->
    <div class="flex flex-wrap gap-2">
      <button v-for="p in resumen.procesos" :key="p.proceso" class="rg-proceso"
        :class="{ 'rg-proceso--on': p.proceso === procesoActivo }"
        @click="cambiarProceso(p.proceso)">
        <span class="rg-proceso-cod">{{ p.proceso }}</span>
        <span class="rg-proceso-txt">{{ p.etiqueta }}</span>
        <span class="rg-proceso-avance">{{ p.items_cargados }}/{{ p.total_items }}</span>
      </button>
    </div>

    <div class="grid gap-4" style="grid-template-columns:minmax(0,340px) minmax(0,1fr);"
      :class="{ 'rg-una-columna': !itemActivo }">
      <!-- Línea de tiempo -->
      <div class="bg-white rounded-xl shadow-sm overflow-hidden" style="border:1px solid #e8e0f0;">
        <div class="rg-timeline">
          <button v-for="it in itemsProceso" :key="it.codigo" class="rg-item"
            :class="{ 'rg-item--on': it.codigo === codigoActivo }"
            @click="seleccionar(it.codigo)">
            <span class="rg-nodo" :style="`background:${colorNodo(it)};border-color:${colorNodo(it)};`">
              <i v-if="it.estado === 'CARGADO'" class="pi pi-check" />
              <i v-else-if="it.estado === 'NO_APLICA'" class="pi pi-minus" />
            </span>
            <span class="rg-item-cuerpo">
              <span class="rg-item-cod">{{ it.codigo }}</span>
              <span class="rg-item-tit">{{ it.titulo }}</span>
              <span class="rg-item-meta">
                <span v-if="it.archivos">{{ it.archivos }} archivo(s)</span>
                <span v-else style="color:#c0b3d4;">sin archivo</span>
                <span v-if="it.parametros_esperados">
                  · {{ it.parametros_diligenciados }}/{{ it.parametros_esperados }} datos
                </span>
                <Tag v-if="it.estado_base === 'PENDIENTE'" value="por validar"
                  severity="warn" class="rg-tag-mini" />
              </span>
            </span>
          </button>
        </div>
      </div>

      <!-- Panel del ítem -->
      <div v-if="itemActivo" class="bg-white rounded-xl shadow-sm" style="border:1px solid #e8e0f0;">
        <div class="rg-panel-head">
          <div class="flex-1 min-w-0">
            <div class="text-xs font-mono font-semibold" style="color:#915BD8;">
              {{ procesoActivo }} · ítem {{ itemActivo.codigo }}
            </div>
            <h2 class="text-base font-semibold" style="color:#2C2039;">{{ itemActivo.titulo }}</h2>
            <p v-if="itemActivo.descripcion" class="text-xs mt-1" style="color:#6b5a8a;">
              {{ itemActivo.descripcion }}
            </p>
          </div>
          <Select v-model="estadoItem" :options="ESTADOS" optionLabel="label" optionValue="value"
            class="text-xs" style="width:150px" @change="guardarEstado" />
        </div>

        <div v-if="itemActivo.nota_catalogo" class="rg-aviso">
          <i class="pi pi-exclamation-triangle" /> {{ itemActivo.nota_catalogo }}
        </div>

        <!-- Archivos -->
        <section class="rg-seccion">
          <div class="rg-seccion-tit"><i class="pi pi-paperclip" /> Documento</div>

          <div v-if="formulario?.documento?.archivos?.length" class="space-y-1 mb-3">
            <div v-for="a in formulario.documento.archivos" :key="a.id" class="rg-archivo">
              <i class="pi pi-file" style="color:#915BD8;" />
              <a :href="a.url" target="_blank" rel="noopener" class="flex-1 truncate rg-archivo-link">
                {{ a.nombre_archivo || a.url }}
              </a>
              <span class="text-xs" style="color:#9b89b5;">{{ a.origen === 'DRIVE' ? 'Drive' : 'enlace' }}</span>
              <Button icon="pi pi-trash" text rounded size="small" severity="danger"
                @click="quitarArchivo(a)" />
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <input ref="inputArchivo" type="file" class="rg-oculto" @change="subirArchivo" />
            <Button label="Subir archivo" icon="pi pi-upload" size="small" outlined
              :loading="subiendo" @click="$refs.inputArchivo.click()" />
            <span class="text-xs" style="color:#c0b3d4;">o</span>
            <InputText v-model="enlaceNuevo" placeholder="Pegar enlace (Drive, SharePoint…)"
              class="text-xs flex-1" style="min-width:220px" @keyup.enter="montarEnlace" />
            <Button label="Montar" size="small" :disabled="!enlaceNuevo.trim()" @click="montarEnlace" />
          </div>

          <div class="grid gap-3 mt-3" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr));">
            <label class="rg-campo">
              <span class="rg-label">Radicado</span>
              <InputText v-model="docForm.radicado" class="text-xs" />
            </label>
            <label class="rg-campo">
              <span class="rg-label">Fecha de emisión</span>
              <input v-model="docForm.fecha_emision" type="date" class="rg-input-fecha" />
            </label>
            <label class="rg-campo">
              <span class="rg-label">Emisor</span>
              <InputText v-model="docForm.emisor" class="text-xs" />
            </label>
          </div>
          <div class="mt-2">
            <Button label="Guardar datos del documento" size="small" text
              :loading="guardandoDoc" @click="guardarDocumento" />
          </div>
        </section>

        <!-- Parámetros -->
        <section v-if="grupos.length" class="rg-seccion">
          <div class="rg-seccion-tit">
            <i class="pi pi-list" /> Datos de este documento
            <span class="rg-contador">
              {{ formulario.campos_diligenciados }}/{{ formulario.total_campos }}
            </span>
          </div>

          <p class="text-xs mb-3" style="color:#6b5a8a;">
            Los datos marcados con
            <i class="pi pi-link" style="color:#915BD8;font-size:10px" />
            también aparecen en otros documentos del expediente. Se diligencian una sola vez.
          </p>

          <div v-for="g in grupos" :key="g.clave" class="rg-grupo">
            <div class="rg-grupo-tit">{{ g.etiqueta }}</div>
            <div v-for="sub in g.instancias" :key="sub.etiqueta" class="mb-2">
              <div v-if="sub.etiqueta" class="rg-instancia">{{ sub.etiqueta }}</div>
              <div class="rg-grid">
                <label v-for="c in sub.campos" :key="claveCampo(c)" class="rg-campo">
                  <span class="rg-label">
                    {{ c.titulo }}
                    <span v-if="c.unidad" class="rg-unidad">{{ c.unidad }}</span>
                    <span v-if="c.requerido" style="color:#e05252;">*</span>
                    <i v-if="c.tambien_en.length" class="pi pi-link rg-icono-link"
                      :title="`También en: ${resumirOtros(c.tambien_en)}`" />
                  </span>

                  <Textarea v-if="c.tipo === 'TABLA'" v-model="valores[claveCampo(c)]" rows="3"
                    class="text-xs" :placeholder="`Una fila por línea: ${(c.columnas || []).join(' | ')}`"
                    @input="marcar(c)" />
                  <input v-else-if="c.tipo === 'FECHA'" v-model="valores[claveCampo(c)]" type="date"
                    class="rg-input-fecha" @change="marcar(c)" />
                  <InputText v-else v-model="valores[claveCampo(c)]" class="text-xs"
                    :type="c.tipo === 'NUMERO' ? 'text' : 'text'" @input="marcar(c)" />

                  <small v-if="c.diligenciado_en_otro_documento" class="rg-hint">
                    viene de otro documento del expediente
                  </small>
                </label>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 mt-3">
            <Button label="Guardar datos" icon="pi pi-check" size="small"
              :disabled="!sucios.size" :loading="guardandoParams" @click="guardarParametros"
              style="background:#915BD8;border-color:#915BD8;" />
            <span v-if="sucios.size" class="text-xs" style="color:#9b89b5;">
              {{ sucios.size }} cambio(s) sin guardar
            </span>
          </div>
        </section>

        <section v-else class="rg-seccion">
          <p class="text-xs" style="color:#9b89b5;">
            Este ítem todavía no tiene datos asociados en el catálogo: solo se monta el documento.
          </p>
        </section>
      </div>
    </div>
  </div>

  <div v-else class="py-16 text-center">
    <i class="pi pi-spin pi-spinner" style="font-size:22px;color:#915BD8;" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import api from '@/api/client'

const route = useRoute()
const toast = useToast()
const proyectoId = route.params.proyectoId

const ESTADOS = [
  { label: 'Pendiente', value: 'PENDIENTE' },
  { label: 'Cargado', value: 'CARGADO' },
  { label: 'No aplica', value: 'NO_APLICA' },
]

const resumen = ref(null)
const formulario = ref(null)
const procesoActivo = ref('SIC')
const codigoActivo = ref(null)

const valores = ref({})
const sucios = ref(new Set())
const docForm = ref({ radicado: '', fecha_emision: '', emisor: '' })
const estadoItem = ref('PENDIENTE')
const enlaceNuevo = ref('')

const subiendo = ref(false)
const guardandoDoc = ref(false)
const guardandoParams = ref(false)

const itemsProceso = computed(() =>
  resumen.value?.procesos.find(p => p.proceso === procesoActivo.value)?.items ?? [])

const itemActivo = computed(() =>
  itemsProceso.value.find(i => i.codigo === codigoActivo.value) ?? null)

/** Clave estable de un campo: incluye el equipo y la posición. */
function claveCampo(c) {
  return `${c.clave}|${c.equipo_tipo}|${c.equipo_posicion}`
}

/**
 * Agrupa los campos por grupo y, dentro de cada grupo, por instancia de equipo.
 * Así el medidor principal y el de respaldo salen como dos bloques del mismo
 * grupo en vez de mezclarse en una lista plana de 90 campos.
 */
const grupos = computed(() => {
  const campos = formulario.value?.campos ?? []
  const porGrupo = new Map()
  for (const c of campos) {
    if (!porGrupo.has(c.grupo)) {
      porGrupo.set(c.grupo, { clave: c.grupo, etiqueta: c.grupo_etiqueta, mapa: new Map() })
    }
    const g = porGrupo.get(c.grupo)
    const etiqueta = c.equipo_etiqueta || ''
    if (!g.mapa.has(etiqueta)) g.mapa.set(etiqueta, [])
    g.mapa.get(etiqueta).push(c)
  }
  return [...porGrupo.values()].map(g => ({
    clave: g.clave,
    etiqueta: g.etiqueta,
    instancias: [...g.mapa.entries()].map(([etiqueta, campos]) => ({ etiqueta, campos })),
  }))
})

function colorNodo(it) {
  if (it.estado === 'CARGADO') return '#915BD8'
  if (it.estado === 'NO_APLICA') return '#c0b3d4'
  return '#ECE7F2'
}

function resumirOtros(otros) {
  return otros.map(o => `${o.proceso} ${o.item}`).join(', ')
}

function marcar(c) {
  sucios.value.add(claveCampo(c))
  sucios.value = new Set(sucios.value)   // forzar reactividad del Set
}

async function cargarResumen() {
  try {
    const { data } = await api.get(`/registros-proyecto/${proyectoId}`)
    resumen.value = data
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo cargar el expediente', detail: e.response?.data?.detail ?? '', life: 6000 })
  }
}

async function cargarFormulario() {
  if (!codigoActivo.value) return
  try {
    const { data } = await api.get(
      `/registros-proyecto/${proyectoId}/${procesoActivo.value}/${codigoActivo.value}`)
    formulario.value = data
    estadoItem.value = data.documento.estado
    docForm.value = {
      radicado: data.documento.radicado ?? '',
      fecha_emision: data.documento.fecha_emision ?? '',
      emisor: data.documento.emisor ?? '',
    }
    const nuevos = {}
    for (const c of data.campos) nuevos[claveCampo(c)] = c.valor ?? ''
    valores.value = nuevos
    sucios.value = new Set()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo abrir el ítem', detail: e.response?.data?.detail ?? '', life: 6000 })
  }
}

function seleccionar(codigo) {
  codigoActivo.value = codigo
  cargarFormulario()
}

function cambiarProceso(proceso) {
  procesoActivo.value = proceso
  codigoActivo.value = null
  formulario.value = null
}

async function guardarEstado() {
  try {
    await api.patch(`/registros-proyecto/${proyectoId}/${procesoActivo.value}/${codigoActivo.value}`,
      { estado: estadoItem.value })
    await Promise.all([cargarResumen(), cargarFormulario()])
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo cambiar el estado', detail: e.response?.data?.detail ?? '', life: 6000 })
  }
}

async function guardarDocumento() {
  guardandoDoc.value = true
  try {
    const payload = { ...docForm.value }
    for (const k of Object.keys(payload)) if (payload[k] === '') payload[k] = null
    await api.patch(`/registros-proyecto/${proyectoId}/${procesoActivo.value}/${codigoActivo.value}`, payload)
    await cargarFormulario()
    toast.add({ severity: 'success', summary: 'Documento actualizado', life: 2500 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo guardar', detail: e.response?.data?.detail ?? '', life: 6000 })
  } finally {
    guardandoDoc.value = false
  }
}

async function guardarParametros() {
  guardandoParams.value = true
  try {
    // Solo se mandan los campos tocados: enviar todo pisaría valores que otro
    // documento acaba de actualizar.
    const porClave = new Map(formulario.value.campos.map(c => [claveCampo(c), c]))
    const payload = [...sucios.value].map(k => {
      const c = porClave.get(k)
      return {
        clave: c.clave,
        valor: valores.value[k] === '' ? null : valores.value[k],
        equipo_tipo: c.equipo_tipo || null,
        equipo_posicion: c.equipo_posicion || null,
        documento_origen_id: formulario.value.documento.id,
      }
    })
    await api.put(`/registros-proyecto/${proyectoId}/parametros`, { valores: payload })
    await Promise.all([cargarResumen(), cargarFormulario()])
    toast.add({ severity: 'success', summary: `${payload.length} dato(s) guardado(s)`, life: 2500 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo guardar', detail: e.response?.data?.detail ?? '', life: 6000 })
  } finally {
    guardandoParams.value = false
  }
}

async function subirArchivo(evento) {
  const archivo = evento.target.files?.[0]
  if (!archivo) return
  subiendo.value = true
  try {
    const form = new FormData()
    form.append('archivo', archivo)
    await api.post(
      `/registros-proyecto/${proyectoId}/${procesoActivo.value}/${codigoActivo.value}/archivos/subir`,
      form)
    await Promise.all([cargarResumen(), cargarFormulario()])
    toast.add({ severity: 'success', summary: 'Archivo montado', life: 2500 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo subir', detail: e.response?.data?.detail ?? '', life: 6000 })
  } finally {
    subiendo.value = false
    evento.target.value = ''
  }
}

async function montarEnlace() {
  const url = enlaceNuevo.value.trim()
  if (!url) return
  try {
    await api.post(
      `/registros-proyecto/${proyectoId}/${procesoActivo.value}/${codigoActivo.value}/archivos`,
      { url, origen: 'LINK' })
    enlaceNuevo.value = ''
    await Promise.all([cargarResumen(), cargarFormulario()])
    toast.add({ severity: 'success', summary: 'Enlace montado', life: 2500 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo montar', detail: e.response?.data?.detail ?? '', life: 6000 })
  }
}

async function quitarArchivo(archivo) {
  if (!confirm(`¿Quitar "${archivo.nombre_archivo || archivo.url}" del expediente?`)) return
  try {
    await api.delete(`/registros-proyecto/archivos/${archivo.id}`)
    await Promise.all([cargarResumen(), cargarFormulario()])
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo quitar', detail: e.response?.data?.detail ?? '', life: 6000 })
  }
}

watch(() => route.query.proceso, (p) => { if (p) procesoActivo.value = String(p).toUpperCase() })

onMounted(async () => {
  if (route.query.proceso) procesoActivo.value = String(route.query.proceso).toUpperCase()
  await cargarResumen()
})
</script>

<style scoped>
/* Selector de proceso */
.rg-proceso {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 14px; border-radius: 10px;
  border: 1px solid #e8e0f0; background: #fff; cursor: pointer;
  transition: all .15s ease;
}
.rg-proceso:hover { border-color: #d9c9f0; background: #faf8fd; }
.rg-proceso--on { border-color: #915BD8; background: #f3ecff; box-shadow: 0 0 0 2px #915BD833; }
.rg-proceso-cod { font-family: ui-monospace, monospace; font-weight: 800; font-size: 12px; color: #6E3FB8; }
.rg-proceso-txt { font-size: 12px; color: #2C2039; }
.rg-proceso-avance { font-size: 11px; font-weight: 700; color: #9b89b5; }

/* Línea de tiempo */
.rg-timeline { max-height: 70vh; overflow-y: auto; padding: 6px 0; }
.rg-item {
  position: relative; display: flex; gap: 10px; width: 100%;
  padding: 8px 12px 8px 14px; text-align: left; background: none;
  border: none; cursor: pointer; transition: background .12s ease;
}
.rg-item:hover { background: #faf8fd; }
.rg-item--on { background: #f3ecff; }
/* La línea que une los nodos: se dibuja desde el nodo hacia abajo, y el
   último ítem la corta para que no quede colgando. */
.rg-item::before {
  content: ''; position: absolute; left: 23px; top: 26px; bottom: -8px;
  width: 2px; background: #ECE7F2;
}
.rg-item:last-child::before { display: none; }
.rg-nodo {
  position: relative; z-index: 1; flex: 0 0 auto;
  width: 20px; height: 20px; margin-top: 2px; border-radius: 50%;
  border: 2px solid #ECE7F2; display: flex; align-items: center;
  justify-content: center; color: #fff; font-size: 9px;
}
.rg-item-cuerpo { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.rg-item-cod { font-family: ui-monospace, monospace; font-size: 10px; font-weight: 800; color: #915BD8; }
.rg-item-tit { font-size: 12px; color: #2C2039; line-height: 1.25; }
.rg-item-meta { font-size: 10px; color: #9b89b5; display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.rg-tag-mini { font-size: 9px !important; padding: 0 4px !important; }

/* Panel */
.rg-panel-head {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 14px 16px; border-bottom: 1px solid #f0eaf8;
}
.rg-aviso {
  display: flex; gap: 8px; align-items: flex-start;
  margin: 12px 16px 0; padding: 8px 10px; border-radius: 8px;
  background: #fffbf0; border-left: 3px solid #f6b73c;
  font-size: 11px; color: #7a5f1f;
}
.rg-seccion { padding: 14px 16px; border-bottom: 1px solid #f0eaf8; }
.rg-seccion:last-child { border-bottom: none; }
.rg-seccion-tit {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 800; text-transform: uppercase;
  letter-spacing: .6px; color: #6b5a8a; margin-bottom: 10px;
}
.rg-contador { margin-left: auto; font-weight: 700; color: #915BD8; letter-spacing: 0; }

.rg-archivo {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 8px; border-radius: 8px; background: #faf8fd;
  border: 1px solid #f0eaf8; font-size: 12px;
}
.rg-archivo-link { color: #6E3FB8; text-decoration: none; }
.rg-archivo-link:hover { text-decoration: underline; }
.rg-oculto { display: none; }

/* Campos */
.rg-grupo { margin-bottom: 14px; }
.rg-grupo-tit {
  font-size: 11px; font-weight: 700; color: #2C2039;
  padding-bottom: 4px; border-bottom: 1px solid #f0eaf8; margin-bottom: 8px;
}
.rg-instancia {
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .4px; color: #915BD8; margin: 6px 0 4px;
}
.rg-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 8px 12px; }
.rg-campo { display: flex; flex-direction: column; gap: 3px; }
.rg-label { font-size: 10px; color: #6b5a8a; display: flex; align-items: center; gap: 3px; }
.rg-unidad { color: #c0b3d4; }
.rg-icono-link { font-size: 9px; color: #915BD8; cursor: help; }
.rg-hint { font-size: 9px; color: #9b89b5; font-style: italic; }
.rg-input-fecha {
  border: 1px solid #d9d0e8; border-radius: 6px; padding: 6px 8px;
  font-size: 12px; color: #2C2039; background: #fff; width: 100%;
}

@media (max-width: 900px) {
  .grid[style] { grid-template-columns: 1fr !important; }
  .rg-timeline { max-height: 320px; }
}
</style>
