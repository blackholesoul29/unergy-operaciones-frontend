<!--
  Segunda vista: la misma información en tabla, para filtrar en volumen y
  exportar. Click en la fila abre el DRAWER de la oferta — antes navegaba a la
  ficha del cliente y perdías de vista la oferta que habías clickeado.
-->
<template>
  <div>
    <div class="flex items-center justify-between mb-2">
      <span class="text-xs" style="color:#9b89b5">{{ ofertas.length }} ofertas</span>
      <Button label="Excel" size="small" outlined :loading="exportando" @click="exportar">
        <template #icon><FileSpreadsheetIcon class="size-[1em]" /></template>
      </Button>
    </div>

    <DataTable :value="ofertas" paginator :rows="25" :rowsPerPageOptions="[25, 50, 100]"
               dataKey="id" class="text-sm" removableSort selectionMode="single"
               @row-click="$emit('abrir', $event.data)">
      <Column field="codigo_seguimiento" header="Código" sortable style="min-width:11rem">
        <template #body="{ data }">
          <span class="font-mono text-xs">{{ data.codigo_seguimiento || data.numero_oferta || '—' }}</span>
        </template>
      </Column>
      <Column field="estado" header="Etapa" sortable>
        <template #body="{ data }">
          <Tag :value="labelEtapa(data.estado)" :severity="severidadEtapa(data.estado)" />
        </template>
      </Column>
      <Column field="planta_nombre" header="Planta" sortable style="min-width:12rem">
        <template #body="{ data }">
          <div class="flex items-center gap-1.5">
            <span>{{ data.planta_nombre || data.ficha?.proyecto_nombre || '—' }}</span>
            <span v-if="data.plantas?.length > 1" class="text-[10px] rounded px-1 py-0.5"
                  style="background:#F3F4F6;color:#4B5563"
                  v-tooltip.top="data.plantas.map(p => p.nombre_comercial).join(' · ')">
              +{{ data.plantas.length - 1 }}
            </span>
          </div>
        </template>
      </Column>
      <Column field="cliente_razon_social" header="Cliente" sortable style="min-width:14rem" />
      <Column field="tipo" header="Tipo" sortable>
        <template #body="{ data }">{{ labelTipo(data.tipo) }}</template>
      </Column>
      <!-- Ordena por el campo crudo en kWh (notación de punto, que sí resuelve
           PrimeVue) y muestra los MWh: el orden es el mismo. -->
      <Column field="ficha.energia_promedio_kwh_mes" header="Energía" sortable>
        <template #body="{ data }">
          <span v-if="mwhMes(data)">{{ fmtMwh(mwhMes(data)) }}</span>
          <span v-else style="color:#c4b8d4">—</span>
        </template>
      </Column>
      <Column field="ficha.municipio" header="Municipio" sortable>
        <template #body="{ data }">{{ data.ficha?.municipio || '—' }}</template>
      </Column>
      <Column field="precio_detalle" header="Precio">
        <template #body="{ data }">{{ data.precio_detalle || '—' }}</template>
      </Column>
      <Column field="fecha_oferta" header="Enviada" sortable>
        <template #body="{ data }">
          <span v-if="data.fecha_oferta" :title="fmtFecha(data.fecha_oferta)">
            hace {{ diasDesde(data.fecha_oferta) }} d
          </span>
          <!-- Sin fecha registrada, el mes vive dentro del propio código. Se
               muestra como aproximado y no se guarda nada. -->
          <span v-else-if="mesDelCodigo(data)" style="color:#c4b8d4"
                v-tooltip.top="'Aproximado: sale del mes que trae el código, no de una fecha registrada'">
            ≈ {{ mesDelCodigo(data) }}
          </span>
          <span v-else style="color:#c4b8d4">—</span>
        </template>
      </Column>
      <Column field="seguimientos" header="Toques" sortable>
        <template #body="{ data }">
          <span :class="alarmante(data) ? 'font-semibold' : ''"
                :style="{ color: alarmante(data) ? '#D64455' : 'inherit' }">
            {{ data.seguimientos || 0 }}
          </span>
        </template>
      </Column>
      <Column field="fecha_ultima_respuesta" header="Última respuesta" sortable>
        <template #body="{ data }">
          <span v-if="data.fecha_ultima_respuesta">{{ fmtFecha(data.fecha_ultima_respuesta) }}</span>
          <span v-else-if="data.fecha_oferta" style="color:#D64455" class="text-xs">sin respuesta</span>
          <span v-else style="color:#c4b8d4">—</span>
        </template>
      </Column>
      <Column header="Contrato">
        <template #body="{ data }">
          <router-link v-if="data.ppa_contrato_id" :to="`/contratos/${data.ppa_contrato_id}`"
                       class="text-xs underline" style="color:var(--color-unergy-purple)" @click.stop>PPA</router-link>
          <span v-else style="color:#c4b8d4">—</span>
        </template>
      </Column>
      <Column header="" style="width:4rem">
        <template #body="{ data }">
          <Tag v-if="data.alerta" severity="danger" :value="`⚠ ${data.dias_sin_respuesta}d`" class="scale-90" />
        </template>
      </Column>
      <template #empty>
        <span style="color:#9b89b5">No hay ofertas con esos filtros.</span>
      </template>
    </DataTable>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import { toast } from 'vue-sonner'
import { exportarExcel } from '~/utils/exportarExcel'
import { FileSpreadsheetIcon } from '@lucide/vue'
import {
  labelEtapa, severidadEtapa, labelTipo, mwhMes, fmtMwh, fmtFecha,
  diasDesde, mesDelCodigo, alarmante,
} from './comercial.js'

const props = defineProps({ ofertas: { type: Array, default: () => [] } })
defineEmits(['abrir'])

const exportando = ref(false)

// `columnas` es [{ header, value: fila => valor }] — ver utils/exportarExcel.js.
const COLUMNAS_EXCEL = [
  { header: 'Código de seguimiento', value: (o) => o.codigo_seguimiento || o.numero_oferta || '' },
  { header: 'Etapa', value: (o) => labelEtapa(o.estado) },
  { header: 'Cliente', value: (o) => o.cliente_razon_social || '' },
  { header: 'NIT', value: (o) => o.cliente_nit || '' },
  { header: 'Planta', value: (o) => o.planta_nombre || o.ficha?.proyecto_nombre || '' },
  { header: 'Plantas del contrato', value: (o) => (o.plantas || []).map((p) => p.nombre_comercial).join(' · ') },
  { header: 'Tipo', value: (o) => labelTipo(o.tipo) },
  { header: 'Municipio', value: (o) => o.ficha?.municipio || '' },
  { header: 'Departamento', value: (o) => o.ficha?.departamento || '' },
  { header: 'Operador de red', value: (o) => o.ficha?.operador_red || '' },
  { header: 'Energía estimada (MWh/mes)', value: (o) => mwhMes(o) || '' },
  { header: 'Precio', value: (o) => o.precio_detalle || '' },
  { header: 'Enviada', value: (o) => o.fecha_oferta || '' },
  { header: 'Toques', value: (o) => o.seguimientos || 0 },
  { header: 'Última respuesta', value: (o) => o.fecha_ultima_respuesta || '' },
  { header: 'Días sin movimiento', value: (o) => o.dias_sin_respuesta ?? '' },
  { header: 'Contrato PPA', value: (o) => o.ppa_contrato_id || '' },
]

async function exportar() {
  exportando.value = true
  try {
    // Se exporta lo que estás viendo (ya filtrado y ordenado), no la tabla entera.
    const hoy = new Date().toISOString().slice(0, 10)
    await exportarExcel(props.ofertas, COLUMNAS_EXCEL, `comercial_ofertas_${hoy}`, 'Ofertas')
  } catch (err) {
    toast.error('No se pudo exportar', { description: err.message, duration: 5000 })
  } finally {
    exportando.value = false
  }
}
</script>
