<template>
  <div v-if="frontera">
    <DetalleLayout :volver="{ to: '/mem/fronteras', label: 'Fronteras' }"
                   :titulo="frontera.nombre_frontera"
                   :codigo="frontera.codigo_frontera || ''"
                   :tabs="TABS" v-model="activeTab">
      <template #chips>
        <Tag :value="tipoLabel(frontera.tipo_frontera)" :severity="tipoSeverity(frontera.tipo_frontera)" class="text-[10px]" />
        <Tag :value="frontera.estado" :severity="estadoSeverity(frontera.estado)" class="text-[10px]" />
      </template>
      <template #default="{ tab }">

      <!-- ══ GENERAL ══ -->
      <div v-if="tab === 'general'">
        <div class="p-4 space-y-6 text-sm">
          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Identidad</p>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
              <InfoField label="Código frontera" :value="frontera.codigo_frontera" />
              <InfoField label="Código propio" :value="frontera.codigo_propio" />
              <InfoField label="Tipo" :value="tipoLabel(frontera.tipo_frontera)" />
              <InfoField label="Estado" :value="frontera.estado" />
              <div class="flex flex-col gap-0.5">
                <span class="text-xs font-medium" style="color: #9b89b5;">Proyecto</span>
                <RouterLink v-if="frontera.proyecto_id" :to="`/proyectos/${frontera.proyecto_id}`"
                            class="text-sm underline" style="color: #915BD8;">
                  {{ frontera.proyecto_nombre || `#${frontera.proyecto_id}` }}
                </RouterLink>
                <span v-else class="text-sm" style="color: #2C2039;">—</span>
              </div>
              <InfoField label="Operador de red" :value="frontera.operador_comercial" />
              <InfoField label="Fecha registro ASIC" :value="fmtFecha(frontera.fecha_registro_asic)" />
            </div>
          </div>

          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Ficha técnica medidor/módem
            </p>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoField label="Tipo extracción ppal" :value="frontera.tipo_extraccion_ppal" />
              <InfoField label="IP módem ppal" :value="frontera.ip_modem_ppal" />
              <InfoField label="Puerto módem ppal" :value="frontera.puerto_modem_ppal" />
              <InfoField label="Canal comunicación ppal" :value="frontera.canal_comunicacion_ppal" />
              <div class="flex flex-col gap-0.5">
                <span class="text-xs font-medium" style="color: #9b89b5;">Contraseña medidor ppal</span>
                <span class="text-sm font-mono" style="color: #2C2039;">
                  {{ mostrarPassPpal ? (frontera.password_medidor_ppal || '—') : (frontera.password_medidor_ppal ? '••••••••' : '—') }}
                  <button v-if="frontera.password_medidor_ppal" type="button" class="ml-1 text-xs underline"
                          style="color: #915BD8;" @click="mostrarPassPpal = !mostrarPassPpal">
                    {{ mostrarPassPpal ? 'ocultar' : 'ver' }}
                  </button>
                </span>
              </div>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <InfoField label="Tipo extracción resp" :value="frontera.tipo_extraccion_resp" />
              <InfoField label="IP módem resp" :value="frontera.ip_modem_resp" />
              <InfoField label="Puerto módem resp" :value="frontera.puerto_modem_resp" />
              <InfoField label="Canal comunicación resp" :value="frontera.canal_comunicacion_resp" />
              <div class="flex flex-col gap-0.5">
                <span class="text-xs font-medium" style="color: #9b89b5;">Contraseña medidor resp</span>
                <span class="text-sm font-mono" style="color: #2C2039;">
                  {{ mostrarPassResp ? (frontera.password_medidor_resp || '—') : (frontera.password_medidor_resp ? '••••••••' : '—') }}
                  <button v-if="frontera.password_medidor_resp" type="button" class="ml-1 text-xs underline"
                          style="color: #915BD8;" @click="mostrarPassResp = !mostrarPassResp">
                    {{ mostrarPassResp ? 'ocultar' : 'ver' }}
                  </button>
                </span>
              </div>
            </div>
          </div>

          <p class="text-xs" style="color: #9b89b5;">
            <i class="pi pi-info-circle mr-1" />
            Para editar estos campos, usa el lápiz en la lista de Fronteras.
          </p>
        </div>
      </div>

      <!-- ══ INFORMACIÓN QUOIA ══ -->
      <div v-if="tab === 'quoia'">
        <div class="p-4 space-y-6 text-sm">
          <p class="text-xs" style="color: #9b89b5;">
            <i class="pi pi-info-circle mr-1" />
            Estos datos los sincroniza Quoia automáticamente (backfill de medidor) -- no se editan a mano aquí.
          </p>
          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Medidor principal</p>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
              <InfoField label="Marca" :value="frontera.marca_med_ppal" />
              <InfoField label="Modelo" :value="frontera.modelo_med_ppal" />
              <InfoField label="Serial" :value="frontera.nro_serie_med_ppal" />
            </div>
          </div>
          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Medidor respaldo</p>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
              <InfoField label="Marca" :value="frontera.marca_med_resp" />
              <InfoField label="Modelo" :value="frontera.modelo_med_resp" />
              <InfoField label="Serial" :value="frontera.nro_serie_med_resp" />
            </div>
          </div>
          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Otros</p>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
              <InfoField label="ID border Quoia" :value="frontera.quoia_border_id" />
            </div>
          </div>
        </div>
      </div>

      <!-- ══ INFORMACIÓN REGULATORIA (GESCON) ══ -->
      <div v-if="tab === 'gescon'">
        <div class="p-4 space-y-6 text-sm">
          <p class="text-xs" style="color: #9b89b5;">
            <i class="pi pi-info-circle mr-1" />
            Cargado una única vez desde GESCON.xlsx -- ya no se sincroniza, esto es de solo lectura.
          </p>

          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Registro ASIC</p>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoField label="Registrada por" :value="frontera.registrada_por" />
              <InfoField label="Fecha primer registro" :value="fmtFecha(frontera.fecha_primer_registro_asic)" />
              <InfoField label="Nivel de tensión" :value="frontera.nivel_tension" />
              <InfoField label="Nivel de tensión (kV)" :value="frontera.nivel_tension_kv" />
              <InfoField label="Tipo punto de medición" :value="frontera.tipo_punto_medicion" />
              <InfoField label="Transferencia máxima (kWh)" :value="frontera.transferencia_maxima_kwh" />
              <InfoField label="Representante frontera" :value="frontera.representante_frontera" />
              <InfoField label="Representante anterior" :value="frontera.representante_anterior" />
              <InfoField label="Fecha inicio representación" :value="fmtFecha(frontera.fecha_inicio_representacion)" />
              <InfoField label="Nombre CGM" :value="frontera.nombre_cgm" />
              <InfoField label="Predio ID" :value="frontera.predio_id" />
              <InfoField label="Nombre predio" :value="frontera.nombre_predio" />
              <InfoField label="Representante DDV" :value="frontera.representante_ddv" />
              <InfoField label="NIT" :value="frontera.nit" />
              <InfoField label="NIT RF" :value="frontera.nit_rf" />
              <InfoField label="NIT CGM" :value="frontera.nit_cgm" />
              <InfoField label="NIU" :value="frontera.niu" />
            </div>
          </div>

          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Capacidad y transporte</p>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoField label="Capacidad transporte (MW)" :value="frontera.capacidad_transporte_mw" />
              <InfoField label="Capacidad transporte compartida (MW)" :value="frontera.capacidad_transporte_compartida_mw" />
              <InfoField label="Capacidad efectiva (MW)" :value="frontera.capacidad_efectiva_mw" />
              <InfoField label="Factor de pérdidas" :value="frontera.factor_perdidas" />
              <InfoField label="Punto de conexión" :value="frontera.punto_conexion" />
              <InfoField label="Subestación" :value="frontera.subestacion" />
              <InfoField label="Clase CT" :value="frontera.clase_ct" />
              <InfoField label="Clase PT" :value="frontera.clase_pt" />
            </div>
          </div>

          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Ubicación</p>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoField label="Municipio" :value="frontera.municipio" />
              <InfoField label="Departamento" :value="frontera.departamento" />
              <InfoField label="Centro poblado" :value="frontera.centro_poblado" />
              <InfoField label="Dirección" :value="frontera.direccion" />
              <InfoField label="Latitud" :value="frontera.latitud" />
              <InfoField label="Longitud" :value="frontera.longitud" />
              <InfoField label="Altitud (msnm)" :value="frontera.altitud_msnm" />
            </div>
          </div>

          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Agentes</p>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoField label="Agente exportador" :value="frontera.agente_exportador" />
              <InfoField label="Agente importador" :value="frontera.agente_importador" />
              <InfoField label="Nombre recurso generación" :value="frontera.nombre_recurso_generacion" />
              <InfoField label="Clasificación recurso" :value="frontera.clasificacion_recurso" />
            </div>
          </div>

          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Medidor — ficha regulatoria</p>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoField label="Clase medidor" :value="frontera.clase_medidor" />
              <InfoField label="N° elementos ppal" :value="frontera.num_elementos_med_ppal" />
              <InfoField label="Fecha cambio ppal" :value="fmtFecha(frontera.fecha_cambio_med_ppal)" />
              <InfoField label="Entidad calibradora ppal" :value="frontera.entidad_calibradora_med_ppal" />
              <InfoField label="Fecha calibración ppal" :value="fmtFecha(frontera.fecha_calibracion_med_ppal)" />
              <InfoField label="Fecha actualización ppal" :value="fmtFecha(frontera.fecha_actualizacion_ppal)" />
              <InfoField label="N° elementos resp" :value="frontera.num_elementos_med_resp" />
              <InfoField label="Fecha cambio resp" :value="fmtFecha(frontera.fecha_cambio_med_resp)" />
              <InfoField label="Entidad calibradora resp" :value="frontera.entidad_calibradora_med_resp" />
              <InfoField label="Fecha calibración resp" :value="fmtFecha(frontera.fecha_calibracion_med_resp)" />
              <InfoField label="Fecha actualización resp" :value="fmtFecha(frontera.fecha_actualizacion_resp)" />
            </div>
          </div>

          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Agrupación / embebido</p>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoField label="Es agrupadora" :value="frontera.es_agrupadora ? 'Sí' : 'No'" />
              <InfoField label="Factor PSF" :value="frontera.factor_psf" />
              <InfoField label="Es principal embebido" :value="frontera.es_principal_embebido ? 'Sí' : 'No'" />
              <InfoField label="Factor acordado" :value="frontera.factor_acordado" />
              <InfoField label="Factor de ajuste" :value="frontera.factor_ajuste" />
              <InfoField label="Factor pérdidas frontera principal" :value="frontera.factor_perdidas_frontera_principal" />
            </div>
          </div>

          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Clasificación industrial y SIC</p>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoField label="Código CIIU" :value="frontera.codigo_ciiu" />
              <InfoField label="Clasificación industrial general" :value="frontera.clasificacion_industrial_general" />
              <InfoField label="Clasificación industrial específica" :value="frontera.clasificacion_industrial_especifica" />
              <InfoField label="Tipo tecnología" :value="frontera.tipo_tecnologia" />
              <InfoField label="Código SIC DDV" :value="frontera.codigo_sic_ddv" />
              <InfoField label="SIC submercado exportador" :value="frontera.codigo_sic_submercado_exportador" />
              <InfoField label="SIC submercado consumo" :value="frontera.codigo_sic_submercado_consumo" />
              <InfoField label="SIC submercado usuario" :value="frontera.codigo_sic_submercado_usuario" />
              <InfoField label="SIC frontera generación" :value="frontera.codigo_sic_frontera_generacion" />
              <InfoField label="SIC frontera usuario" :value="frontera.codigo_sic_frontera_usuario" />
              <InfoField label="Potencia máxima declarada" :value="frontera.potencia_maxima_declarada" />
              <InfoField label="Consumo promedio mensual (MWh)" :value="frontera.consumo_promedio_mensual_mwh" />
              <InfoField label="Relación transformación CT" :value="frontera.relacion_transformacion_ct" />
              <InfoField label="Relación transformación PT" :value="frontera.relacion_transformacion_pt" />
            </div>
          </div>
        </div>
      </div>

      </template>
    </DetalleLayout>
  </div>

  <div v-else-if="loading" class="flex justify-center py-20">
    <ProgressSpinner />
  </div>

  <div v-else class="flex flex-col items-center py-20 gap-3 text-gray-500">
    <i class="pi pi-exclamation-circle text-3xl text-red-400"></i>
    <p class="text-sm">{{ errorMsg || 'No se pudo cargar la frontera.' }}</p>
    <Button label="Reintentar" icon="pi pi-refresh" outlined size="small" @click="$router.go(0)" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import api from '@/api/client'
import DetalleLayout from '@/components/DetalleLayout.vue'
import InfoField from '@/components/InfoField.vue'

const route = useRoute()
const frontera = ref(null)
const loading = ref(true)
const errorMsg = ref('')
const activeTab = ref('general')
const mostrarPassPpal = ref(false)
const mostrarPassResp = ref(false)

const TABS = [
  { key: 'general', label: 'General',                       icon: 'pi pi-info-circle' },
  { key: 'quoia',   label: 'Información Quoia',              icon: 'pi pi-link' },
  { key: 'gescon',  label: 'Información regulatoria (GESCON)', icon: 'pi pi-file' },
]

function tipoLabel(t) {
  const map = { generacion: 'Generación', consumo: 'Consumo', generacion_consumo: 'Gen+Consumo', consumo_auxiliar: 'Auxiliar', consumo_propio: 'Propio' }
  return map[t] || t
}
function tipoSeverity(t) {
  if (t === 'generacion') return 'success'
  if (t === 'consumo') return 'info'
  return 'warn'
}
function estadoSeverity(e) {
  const map = { activa: 'success', en_registro: 'warn', en_falla: 'danger', cancelada: 'secondary' }
  return map[e] || 'info'
}
function fmtFecha(v) {
  return v ? String(v).slice(0, 10) : '—'
}

async function cargar() {
  loading.value = true
  try {
    const { data } = await api.get(`/fronteras/${route.params.id}`)
    frontera.value = data
  } catch (e) {
    errorMsg.value = e.response?.data?.detail || 'No se pudo cargar la frontera.'
  } finally {
    loading.value = false
  }
}

onMounted(cargar)
</script>
