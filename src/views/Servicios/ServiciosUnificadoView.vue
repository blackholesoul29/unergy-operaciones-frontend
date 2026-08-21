<!--
  Servicios — vista unificada.

  Clientes, Proyectos y Servicios miran casi siempre la misma realidad (un
  cliente, sus plantas y los contratos que las cubren) desde tres ángulos. En
  vez de tres pestañas separadas, acá el ángulo es un selector: la página, la
  búsqueda, la densidad y el Excel son los mismos; sólo cambian las columnas.

  Las tres vistas clásicas (/clientes, /proyectos, /servicios) siguen vivas y
  sin tocar. Esta es aditiva: mismos endpoints, misma semántica de datos.
-->
<template>
  <div class="space-y-3">
    <PageHeader title="Proyectos" :subtitle="subtitulo">
      <template #actions>
        <IconField v-if="vista" class="ph-buscar">
          <InputIcon class="pi pi-search" />
          <InputText v-model="q" :placeholder="placeholderBusqueda" size="small" class="w-full" />
        </IconField>
        <Button v-if="vista"
                :icon="compacta ? 'pi pi-arrows-v' : 'pi pi-align-justify'"
                severity="secondary" outlined size="small"
                v-tooltip.bottom="compacta ? 'Densidad cómoda' : 'Densidad compacta'"
                @click="compacta = !compacta" />
        <Button v-if="vista"
                label="Excel" icon="pi pi-file-excel" severity="secondary" outlined size="small"
                :disabled="!filasVisibles.length" @click="descargarExcel" />
        <Button v-if="vista === 'clientes'" label="Nuevo cliente" icon="pi pi-plus" size="small"
                @click="dialogCliente = true" />
        <Button v-else-if="vista === 'proyectos'" label="Nuevo proyecto" icon="pi pi-plus" size="small"
                @click="dialogProyecto = true" />
        <Button v-else-if="vista === 'servicios' && servicio === 'ppa'" label="Nuevo PPA" icon="pi pi-plus" size="small"
                class="bg-amber-500 border-amber-500 hover:bg-amber-600" @click="abrirWizardPPA(null)" />
        <Button v-else-if="vista === 'servicios' && servicio !== 'representacion'"
                :label="`Nuevo ${servicioInfo?.label}`"
                icon="pi pi-plus" size="small"
                :style="`background:${servicioInfo?.color}; border-color:${servicioInfo?.color}`"
                @click="showWizardServicio = true" />
      </template>
    </PageHeader>

    <!-- Selector de ángulo (nivel 1) + tipo de servicio (nivel 2) -->
    <div class="flex flex-wrap items-center gap-2">
      <button v-for="v in VISTAS" :key="v.key" type="button"
              class="svc-tab" :class="{ 'svc-tab--on': vista === v.key }"
              :style="vista === v.key ? `background:${v.bg}; border-color:${v.color}55; color:${v.color}` : ''"
              @click="seleccionarVista(v.key)">
        <i :class="v.icon" :style="vista === v.key ? `color:${v.color}` : ''" />
        <span>{{ v.label }}</span>
        <span v-if="conteoVista(v.key) !== null" class="svc-tab-count"
              :style="vista === v.key ? `background:${v.color}22; color:${v.color}` : ''">
          {{ conteoVista(v.key) }}
        </span>
      </button>

      <template v-if="vista === 'servicios'">
        <span class="mx-1 h-6 w-px" style="background:#E5E2EC" />
        <button v-for="s in SERVICIOS" :key="s.key" type="button"
                class="svc-tab svc-tab--sm" :class="{ 'svc-tab--on': servicio === s.key }"
                :style="servicio === s.key ? `background:${s.bg}; border-color:${s.color}55; color:${s.color}` : ''"
                @click="seleccionarServicio(s.key)">
          <i :class="s.icon" :style="servicio === s.key ? `color:${s.color}` : ''" />
          <span>{{ s.label }}</span>
        </button>
      </template>
    </div>

    <!-- Agrupar el portafolio: reorganiza las mismas plantas por la dimensión
         que interese, en vez de mandar al usuario a otra tabla. -->
    <div v-if="vista === 'proyectos'" class="flex flex-wrap items-center gap-2">
      <label class="text-xs font-semibold" style="color:#6b5a8a">Agrupar por</label>
      <Select v-model="agruparPor" :options="AGRUPACIONES" optionLabel="label" optionValue="value"
              size="small" class="w-52" />
      <span v-if="agruparPor" class="text-xs" style="color:#9b8fb0">
        {{ nGrupos }} grupo{{ nGrupos === 1 ? '' : 's' }} ·
        {{ proyectosAgrupados.length }} fila{{ proyectosAgrupados.length === 1 ? '' : 's' }}
      </span>
    </div>

    <!-- Sin fila de filtros en ningún ángulo (decisión de 2026-08-20): el
         buscador de la cabecera cubre el caso y la fila le robaba alto a la
         tabla, que es lo que interesa maximizar. Las columnas siguen siendo
         ordenables, así que acotar por estado/tipo se hace con un clic en el
         encabezado. -->

    <!-- ══════════════════ CLIENTES ══════════════════ -->
    <div v-if="vista === 'clientes'" class="tabla-caja">
      <DataTable :value="clientesFiltrados" :loading="loadingClientes" size="small"
                 class="tabla tabla--clickable" :class="{ 'tabla--compacta': compacta }"
                 scrollable :scrollHeight="scrollHeight" :rowClass="rowClassCliente"
                 paginator :rows="filasPorPagina" :rowsPerPageOptions="[50, 100, 200]"
                 sortField="razon_social_nombre" :sortOrder="1" rowHover
                 @row-click="e => ir(`/clientes/${e.data.id}`)"
                 emptyMessage="No hay clientes.">
        <Column field="razon_social_nombre" header="Razón social" sortable style="width:26%">
          <template #body="{ data }">
            <div class="flex items-center gap-1 min-w-0">
              <span class="celda-txt font-semibold" style="color:#2C2039">
                {{ formatearNombre(data.razon_social_nombre) }}
              </span>
              <span v-if="data.alerta_contrato && data.alerta_contrato !== 'vigente'"
                    class="mini-chip shrink-0"
                    :style="{ color: SEMAFORO[data.alerta_contrato].color, background: SEMAFORO[data.alerta_contrato].bg }">
                {{ SEMAFORO[data.alerta_contrato].label }}
              </span>
            </div>
          </template>
        </Column>
        <Column field="nit_cedula" header="NIT" sortable style="width:9%">
          <template #body="{ data }"><span class="mono">{{ fmt(data.nit_cedula) }}</span></template>
        </Column>
        <Column field="num_plantas" header="Plantas" sortable style="width:6%" bodyStyle="text-align:right">
          <template #body="{ data }">
            <span class="font-semibold tabular-nums" style="color:#2C2039">{{ data.num_plantas }}</span>
          </template>
        </Column>
        <Column header="Servicios" style="width:15%">
          <template #body="{ data }">
            <div class="chips-fila">
              <span v-for="sv in data.servicios" :key="sv" class="mini-chip"
                    style="background:#f0ebfd;color:#915BD8">{{ servicioLabel(sv) }}</span>
              <span v-if="!data.servicios?.length" class="vacio">—</span>
            </div>
          </template>
        </Column>
        <Column field="contacto_comercial_nombre" header="Contacto" sortable style="width:14%">
          <template #body="{ data }">
            <span class="celda-txt">{{ fmt(data.contacto_comercial_nombre) }}</span>
          </template>
        </Column>
        <Column field="contacto_comercial_correo" header="Correo" sortable style="width:15%">
          <template #body="{ data }">
            <span class="celda-txt sutil">{{ fmt(data.contacto_comercial_correo) }}</span>
          </template>
        </Column>
        <Column header="Falta" style="width:9%">
          <template #body="{ data }">
            <div class="falta-celda">
              <span class="falta-chip" :class="faltanCampos(data).length ? 'falta--mal' : 'falta--ok'"
                    v-tooltip.bottom="tipFalta(data, 'campos')">
                <i class="pi pi-list" />{{ faltanCampos(data).length }}
              </span>
              <span class="falta-chip" :class="faltanDocs(data).length ? 'falta--mal' : 'falta--ok'"
                    v-tooltip.bottom="tipFalta(data, 'docs')">
                <i class="pi pi-paperclip" />{{ faltanDocs(data).length }}
              </span>
            </div>
          </template>
        </Column>
        <Column style="width:6%">
          <template #body="{ data }">
            <div class="acciones">
              <Button icon="pi pi-pencil" text size="small" severity="secondary"
                      v-tooltip.bottom="'Editar'" @click.stop="ir(`/clientes/${data.id}`)" />
              <Button icon="pi pi-trash" text size="small" severity="danger"
                      v-tooltip.bottom="'Eliminar'" @click.stop="confirmarBorrarCliente(data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- ══════════════════ PROYECTOS ══════════════════ -->
    <div v-else-if="vista === 'proyectos'" class="tabla-caja">
      <DataTable :value="proyectosAgrupados" :loading="loadingProyectos" size="small"
                 class="tabla" :class="{ 'tabla--compacta': compacta }"
                 scrollable :scrollHeight="scrollHeight"
                 paginator :rows="filasPorPagina" :rowsPerPageOptions="[50, 100, 200]"
                 :sortField="agruparPor ? '__grupo' : 'nombre_comercial'" :sortOrder="1" rowHover
                 :rowGroupMode="agruparPor ? 'subheader' : null"
                 :groupRowsBy="agruparPor ? '__grupo' : null"
                 emptyMessage="No se encontraron proyectos.">
        <template v-if="agruparPor" #groupheader="{ data }">
          <span class="grupo-titulo">{{ data.__grupo }}</span>
          <span class="grupo-conteo">{{ conteoGrupo(data.__grupo) }}</span>
        </template>
        <Column field="nombre_comercial" header="Nombre comercial" sortable style="width:21%">
          <template #body="{ data }">
            <span class="block text-[9px] leading-none mono"
                  :style="{ color: data.codigo_tsf ? '#9ca3af' : '#d1d5db' }">
              {{ data.codigo_tsf || '—' }}
            </span>
            <button type="button" class="nombre-link" @click="ir(`/proyectos/${data.id}`)"
                    v-tooltip.bottom="'Ver detalle'">
              {{ formatearNombre(data.nombre_comercial) }}
            </button>
          </template>
        </Column>
        <Column field="estado" header="Estado" sortable style="width:10%">
          <template #body="{ data }">
            <span class="mini-chip inline-flex items-center gap-1"
                  :class="ESTADO_CLASS[data.estado] || 'estado-default'">
              <span v-if="data.estado === 'en_operacion'" class="pulse-dot" />
              {{ ESTADO_LABELS[data.estado] || data.estado || '—' }}
            </span>
          </template>
        </Column>
        <Column field="tipo_proyecto" header="Tipo" sortable style="width:9%">
          <template #body="{ data }">
            <span class="mini-chip" :class="TIPO_BADGE_CLASS[data.tipo_proyecto] || 'badge-otro'">
              {{ TIPO_LABELS[data.tipo_proyecto] || data.tipo_proyecto || '—' }}
            </span>
          </template>
        </Column>
        <Column field="municipio" header="Ubicación" sortable style="width:12%">
          <template #body="{ data }">
            <span v-if="data.municipio || data.departamento" class="celda-txt sutil"
                  v-tooltip.bottom="[data.municipio, data.departamento].filter(Boolean).join(', ')">
              {{ [data.municipio, data.departamento].filter(Boolean).join(', ') }}
            </span>
            <span v-else class="vacio">—</span>
          </template>
        </Column>
        <Column field="info_tecnica.capacidad_instalada_kwp" header="kWp" sortable
                style="width:7%" bodyStyle="text-align:right">
          <template #body="{ data }">
            <span class="mono" v-tooltip.bottom="`AC: ${num(data.info_tecnica?.potencia_ac_kw)} kW`">
              {{ num(data.info_tecnica?.capacidad_instalada_kwp) }}
            </span>
          </template>
        </Column>
        <Column header="Servicios" style="width:12%">
          <template #body="{ data }">
            <div class="chips-fila">
              <template v-for="srv in SERVICIOS_BADGES" :key="srv.key">
                <span v-if="data[srv.key]" class="mini-chip srv-badge"
                      v-tooltip.bottom="srv.tooltip">{{ srv.badge }}</span>
              </template>
              <span v-if="!SERVICIOS_BADGES.some(sb => data[sb.key])" class="vacio">—</span>
            </div>
          </template>
        </Column>
        <Column header="PPA" style="width:14%">
          <template #body="{ data }">
            <div v-if="ppaVigentes(data).length" class="chips-fila">
              <button v-for="c in ppaVigentes(data)" :key="c.id" type="button" class="ppa-chip"
                      v-tooltip.bottom="ppaTooltip(c)" @click="ir(`/proyectos/${data.id}/ppa`)">
                {{ ppaLabel(c) }}
              </button>
            </div>
            <span v-else class="vacio">—</span>
          </template>
        </Column>
        <Column header="Falta" style="width:9%">
          <template #body="{ data }">
            <div class="falta-celda">
              <span class="falta-chip" :class="faltanCampos(data).length ? 'falta--mal' : 'falta--ok'"
                    v-tooltip.bottom="tipFalta(data, 'campos')">
                <i class="pi pi-list" />{{ faltanCampos(data).length }}
              </span>
              <span class="falta-chip" :class="faltanDocs(data).length ? 'falta--mal' : 'falta--ok'"
                    v-tooltip.bottom="tipFalta(data, 'docs')">
                <i class="pi pi-paperclip" />{{ faltanDocs(data).length }}
              </span>
            </div>
          </template>
        </Column>
        <Column style="width:6%">
          <template #body="{ data }">
            <div class="acciones">
              <Button icon="pi pi-pencil" text size="small" severity="secondary"
                      v-tooltip.bottom="'Editar'" @click.stop="ir(`/proyectos/${data.id}?edit=true`)" />
              <Button icon="pi pi-trash" text size="small" severity="danger"
                      v-tooltip.bottom="'Eliminar'" @click.stop="confirmarBorrarProyecto(data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- ══════════════════ SERVICIOS · PPA ══════════════════ -->
    <div v-else-if="servicio === 'ppa'" class="tabla-caja">
      <DataTable :value="ppaFiltrados" :loading="loadingPpa" size="small"
                 class="tabla" :class="{ 'tabla--compacta': compacta }"
                 scrollable :scrollHeight="scrollHeight"
                 paginator :rows="filasPorPagina" :rowsPerPageOptions="[50, 100, 200]"
                 sortField="fecha_inicio" :sortOrder="1" rowHover
                 emptyMessage="No hay contratos PPA registrados.">
        <Column field="nombre_interno" header="Nombre interno" sortable style="width:20%">
          <template #body="{ data }">
            <button type="button" class="nombre-link" @click="ir(`/contratos/${data.id}`)"
                    v-tooltip.bottom="data.numero_codigo_contrato
                      ? `N° ${data.numero_codigo_contrato}` : 'Ver detalle'">
              {{ data.nombre_interno || data.numero_codigo_contrato || '—' }}
            </button>
          </template>
        </Column>
        <Column field="tipo_contrato" header="Tipo" sortable style="width:7%">
          <template #body="{ data }">
            <span class="mini-chip"
                  :style="data.tipo_contrato === 'compra'
                    ? 'background:#915BD8;color:#fff'
                    : 'background:#F6FF72;color:#2C2039'">
              {{ data.tipo_contrato === 'compra' ? 'Compra' : 'Venta' }}
            </span>
          </template>
        </Column>
        <Column field="comprador_nombre" header="Comprador" sortable style="width:16%">
          <template #body="{ data }">
            <span class="celda-txt">{{ data.comprador_nombre || '—' }}</span>
          </template>
        </Column>
        <Column field="vendedor_nombre" header="Vendedor" sortable style="width:16%">
          <template #body="{ data }">
            <span class="celda-txt">{{ data.vendedor_nombre || '—' }}</span>
          </template>
        </Column>
        <Column field="fecha_inicio" header="Inicio" sortable style="width:8%">
          <template #body="{ data }"><span class="mono">{{ fmtFecha(data.fecha_inicio) }}</span></template>
        </Column>
        <Column field="fecha_fin" header="Fin" sortable style="width:8%">
          <template #body="{ data }">
            <span class="mono"
                  :style="data.dias_restantes != null && data.dias_restantes <= 90
                    ? { color: data.dias_restantes <= 30 ? '#D64455' : '#CA8A04', fontWeight: 700 } : null"
                  v-tooltip.bottom="data.dias_restantes != null
                    ? `${data.dias_restantes} días restantes` : null">
              {{ fmtFecha(data.fecha_fin) }}
            </span>
          </template>
        </Column>
        <Column field="cobertura_actual_pct" header="Cobertura" sortable style="width:10%">
          <template #body="{ data }">
            <div v-if="data.cobertura_actual_pct != null" class="flex items-center gap-1">
              <div class="flex-1 h-1.5 rounded-full overflow-hidden" style="background:#f3f0f7">
                <div class="h-full rounded-full" :style="{
                  width: Math.min(data.cobertura_actual_pct, 100) + '%',
                  backgroundColor: data.cobertura_actual_pct >= 90 ? '#10B981'
                    : data.cobertura_actual_pct >= 70 ? '#F0C040' : '#D64455' }" />
              </div>
              <span class="mono">{{ data.cobertura_actual_pct }}%</span>
            </div>
            <span v-else class="vacio">—</span>
          </template>
        </Column>
        <Column header="Falta" style="width:9%">
          <template #body="{ data }">
            <div class="falta-celda">
              <span class="falta-chip" :class="faltanCampos(data).length ? 'falta--mal' : 'falta--ok'"
                    v-tooltip.bottom="tipFalta(data, 'campos')">
                <i class="pi pi-list" />{{ faltanCampos(data).length }}
              </span>
              <span class="falta-chip" :class="faltanDocs(data).length ? 'falta--mal' : 'falta--ok'"
                    v-tooltip.bottom="tipFalta(data, 'docs')">
                <i class="pi pi-paperclip" />{{ faltanDocs(data).length }}
              </span>
            </div>
          </template>
        </Column>
        <Column style="width:6%">
          <template #body="{ data }">
            <div class="acciones">
              <Button icon="pi pi-pencil" text size="small" severity="secondary"
                      v-tooltip.bottom="'Editar'" @click.stop="ir(`/contratos/${data.id}`)" />
              <Button icon="pi pi-trash" text size="small" severity="danger"
                      v-tooltip.bottom="'Eliminar'" @click.stop="confirmarBorrarPpa(data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- ══════════════════ SERVICIOS · REPRESENTACIÓN ══════════════════ -->
    <div v-else-if="servicio === 'representacion'" class="tabla-caja">
      <DataTable :value="representacionFiltradas" :loading="loadingRepresentacion" size="small"
                 class="tabla" :class="{ 'tabla--compacta': compacta }"
                 scrollable :scrollHeight="scrollHeight"
                 paginator :rows="filasPorPagina" :rowsPerPageOptions="[50, 100, 200]"
                 sortField="nombre_comercial" :sortOrder="1" rowHover
                 emptyMessage="No hay plantas con servicio de representación.">
        <Column field="nombre_comercial" header="Planta" sortable style="width:21%">
          <template #body="{ data }">
            <button type="button" class="nombre-link" @click="ir(`/proyectos/${data.id}`)"
                    v-tooltip.bottom="'Ver planta'">{{ formatearNombre(data.nombre_comercial) }}</button>
          </template>
        </Column>
        <Column field="potencia_instalada_kwp" header="kWp" sortable
                style="width:7%" bodyStyle="text-align:right">
          <template #body="{ data }"><span class="mono">{{ num(data.potencia_instalada_kwp) }}</span></template>
        </Column>
        <Column field="estado" header="Estado" sortable style="width:10%">
          <template #body="{ data }">
            <span class="mini-chip" :class="ESTADO_CLASS[data.estado] || 'estado-default'">
              {{ ESTADO_LABELS[data.estado] || data.estado || '—' }}
            </span>
          </template>
        </Column>
        <Column field="municipio" header="Ubicación" sortable style="width:13%">
          <template #body="{ data }">
            <span class="celda-txt sutil"
                  v-tooltip.bottom="[data.municipio, data.departamento].filter(Boolean).join(', ')">
              {{ [data.municipio, data.departamento].filter(Boolean).join(', ') || '—' }}
            </span>
          </template>
        </Column>
        <Column field="servicio_representacion.nombre_rf" header="Representante" sortable style="width:16%">
          <template #body="{ data }">
            <span class="celda-txt"
                  v-tooltip.bottom="data.servicio_representacion?.nombre_comercializador
                    ? `Comercializador: ${data.servicio_representacion.nombre_comercializador}` : null">
              {{ data.servicio_representacion?.nombre_rf || '—' }}
            </span>
          </template>
        </Column>
        <Column field="servicio_representacion.modalidad_venta" header="Modalidad" sortable style="width:10%">
          <template #body="{ data }">
            <span v-if="data.servicio_representacion?.modalidad_venta" class="mini-chip"
                  style="background:#E6F1FB;color:#0C447C">
              {{ MODALIDAD_LABELS[data.servicio_representacion.modalidad_venta] || data.servicio_representacion.modalidad_venta }}
            </span>
            <span v-else class="vacio">—</span>
          </template>
        </Column>
        <Column header="Cód. XM" style="width:8%">
          <template #body="{ data }">
            <span class="celda-txt mono">{{ data.servicio_representacion?.codigo_despacho_xm || '—' }}</span>
          </template>
        </Column>
        <Column header="Falta" style="width:9%">
          <template #body="{ data }">
            <div class="falta-celda">
              <span class="falta-chip" :class="faltanCampos(data).length ? 'falta--mal' : 'falta--ok'"
                    v-tooltip.bottom="tipFalta(data, 'campos')">
                <i class="pi pi-list" />{{ faltanCampos(data).length }}
              </span>
              <span class="falta-chip" :class="faltanDocs(data).length ? 'falta--mal' : 'falta--ok'"
                    v-tooltip.bottom="tipFalta(data, 'docs')">
                <i class="pi pi-paperclip" />{{ faltanDocs(data).length }}
              </span>
            </div>
          </template>
        </Column>
        <Column style="width:6%">
          <template #body="{ data }">
            <div class="acciones">
              <Button icon="pi pi-pencil" text size="small" severity="secondary"
                      v-tooltip.bottom="'Editar'" @click.stop="ir(`/proyectos/${data.id}?edit=true`)" />
              <Button icon="pi pi-trash" text size="small" severity="danger"
                      v-tooltip.bottom="'Eliminar'" @click.stop="confirmarBorrarProyecto(data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- ══════════════════ SERVICIOS · OPERACIÓN / REC ══════════════════ -->
    <div v-else class="tabla-caja">
      <DataTable :value="contratosServicioFiltrados" :loading="loadingServicio" size="small"
                 class="tabla" :class="{ 'tabla--compacta': compacta }"
                 scrollable :scrollHeight="scrollHeight"
                 paginator :rows="filasPorPagina" :rowsPerPageOptions="[50, 100, 200]"
                 sortField="fecha_inicio" :sortOrder="1" rowHover
                 :emptyMessage="`No hay contratos de ${servicioInfo?.label} registrados.`">
        <Column field="numero_contrato" header="N° contrato" sortable style="width:15%">
          <template #body="{ data }"><span class="celda-txt mono">{{ data.numero_contrato || '—' }}</span></template>
        </Column>
        <Column field="contratante_nombre" header="Contratante" sortable style="width:21%">
          <template #body="{ data }"><span class="celda-txt">{{ data.contratante_nombre || '—' }}</span></template>
        </Column>
        <Column field="prestador_nombre" header="Prestador" sortable style="width:21%">
          <template #body="{ data }"><span class="celda-txt">{{ data.prestador_nombre || '—' }}</span></template>
        </Column>
        <Column field="fecha_inicio" header="Inicio" sortable style="width:8%">
          <template #body="{ data }"><span class="mono">{{ fmtFecha(data.fecha_inicio) }}</span></template>
        </Column>
        <Column field="fecha_fin" header="Fin" sortable style="width:8%">
          <template #body="{ data }"><span class="mono">{{ fmtFecha(data.fecha_fin) }}</span></template>
        </Column>
        <Column field="estado" header="Estado" sortable style="width:12%">
          <template #body="{ data }">
            <span class="mini-chip" :class="ESTADO_CONTRATO_CLASS[data.estado] || 'chip-neutral'">
              {{ ESTADO_CONTRATO_LABELS[data.estado] || data.estado || '—' }}
            </span>
          </template>
        </Column>
        <Column header="Falta" style="width:9%">
          <template #body="{ data }">
            <div class="falta-celda">
              <span class="falta-chip" :class="faltanCampos(data).length ? 'falta--mal' : 'falta--ok'"
                    v-tooltip.bottom="tipFalta(data, 'campos')">
                <i class="pi pi-list" />{{ faltanCampos(data).length }}
              </span>
              <span class="falta-chip" :class="faltanDocs(data).length ? 'falta--mal' : 'falta--ok'"
                    v-tooltip.bottom="tipFalta(data, 'docs')">
                <i class="pi pi-paperclip" />{{ faltanDocs(data).length }}
              </span>
            </div>
          </template>
        </Column>
        <Column style="width:6%">
          <template #body="{ data }">
            <div class="acciones">
              <Button icon="pi pi-pencil" text size="small" severity="secondary"
                      v-tooltip.bottom="'Editar'" @click.stop="irAEditarContratoServicio(data)" />
              <Button icon="pi pi-trash" text size="small" severity="danger"
                      v-tooltip.bottom="'Eliminar'" @click.stop="confirmarBorrarContratoServicio(data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- ── Creación ─────────────────────────────────────────────────────────── -->
    <Dialog v-model:visible="dialogCliente" header="Nuevo cliente" modal class="w-full max-w-lg">
      <ClienteForm :initial="{}" @save="crearCliente" @cancel="dialogCliente = false" />
    </Dialog>

    <Dialog v-model:visible="dialogProyecto" header="Nuevo proyecto" modal class="w-full max-w-xl">
      <ProyectoForm @save="crearProyecto" @cancel="dialogProyecto = false" />
    </Dialog>

    <Dialog v-model:visible="duplicadoVisible" header="Proyecto parecido ya existe" modal class="w-full max-w-sm">
      <p class="text-sm text-gray-600">{{ duplicadoInfo?.mensaje }}</p>
      <p v-if="duplicadoInfo?.candidato_nombre" class="text-sm mt-2 font-medium" style="color:#2C2039">
        {{ duplicadoInfo.candidato_nombre }}
      </p>
      <template #footer>
        <Button label="Cancelar" severity="secondary" text @click="duplicadoVisible = false" />
        <Button label="Crear igual" :loading="forzando" @click="crearProyectoForzado" />
      </template>
    </Dialog>

    <PPAContratoWizard v-if="showWizardPPA" :visible="showWizardPPA" :initialData="ppaADuplicar"
                       @cerrar="cerrarWizardPPA" @creado="cargarPpa" @editado="cargarPpa" />

    <ContratoServicioWizard v-if="showWizardServicio" :visible="showWizardServicio" :tipo="servicio"
                            @cerrar="showWizardServicio = false"
                            @creado="cargarContratosServicio(servicio)" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, defineAsyncComponent } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import api from '@/api/client'
import { formatearNombre } from '@/utils/nombreFormato'
import { exportarExcel } from '@/utils/exportarExcel'
import { SEMAFORO, servicioLabel, fmt } from '@/views/Clientes/clientesUi'

// Los formularios y wizards pesan; sólo se descargan cuando alguien crea algo.
const ClienteForm = defineAsyncComponent(() => import('@/views/Clientes/ClienteForm.vue'))
const ProyectoForm = defineAsyncComponent(() => import('@/views/Proyectos/ProyectoForm.vue'))
const PPAContratoWizard = defineAsyncComponent(() => import('@/views/Contratos/PPAContratoWizard.vue'))
const ContratoServicioWizard = defineAsyncComponent(() => import('@/views/Contratos/ContratoServicioWizard.vue'))

const router = useRouter()
const route = useRoute()
const toast = useToast()
const confirm = useConfirm()

// ── Catálogos ────────────────────────────────────────────────────────────────
const VISTAS = [
  // Proyectos va primero y es el que abre: la planta es la base, y clientes y
  // contratos son formas de mirar ese mismo portafolio.
  { key: 'proyectos', label: 'Proyectos', icon: 'pi pi-bolt',      color: '#10b981', bg: '#f0fdf4' },
  { key: 'clientes',  label: 'Clientes',  icon: 'pi pi-building',  color: '#915BD8', bg: '#f5f0fd' },
  { key: 'servicios', label: 'Servicios', icon: 'pi pi-file-edit', color: '#0C447C', bg: '#eff6ff' },
]

const SERVICIOS = [
  { key: 'ppa',            label: 'PPA',            icon: 'pi pi-bolt',      color: '#f59e0b', bg: '#fffbeb' },
  { key: 'representacion', label: 'Representación', icon: 'pi pi-file-edit', color: '#3b82f6', bg: '#eff6ff' },
  { key: 'operacion',      label: 'Operación',      icon: 'pi pi-chart-bar', color: '#10b981', bg: '#f0fdf4' },
  { key: 'rec',            label: 'REC',            icon: 'pi pi-verified',  color: '#14b8a6', bg: '#f0fdfa' },
]

const SERVICIOS_BADGES = [
  { key: 'srv_operacion',      badge: 'OP',   tooltip: 'Operación' },
  { key: 'srv_representacion', badge: 'REP',  tooltip: 'Reporte de energía producida' },
  { key: 'srv_cgm',            badge: 'CGM',  tooltip: 'Control y gestión de medición' },
  { key: 'srv_ppa',            badge: 'PPA',  tooltip: 'PPA' },
  { key: 'srv_promotor',       badge: 'PROM', tooltip: 'Promotor' },
  { key: 'srv_rec',            badge: 'REC',  tooltip: 'REC' },
]

const TIPO_LABELS = {
  minigranja: 'Minigranja', autoconsumo: 'Autoconsumo', gd: 'GD',
  movilidad_electrica: 'Movilidad', otro: 'Otro',
}
const TIPO_BADGE_CLASS = {
  minigranja: 'badge-minigranja', autoconsumo: 'badge-autoconsumo', gd: 'badge-gd',
  movilidad_electrica: 'badge-movilidad', otro: 'badge-otro',
}
const ESTADO_LABELS = {
  en_operacion: 'En operación', en_desarrollo: 'En desarrollo', suspendido: 'Suspendido',
  cancelado: 'Cancelado', en_construccion: 'En construcción',
}
const ESTADO_CLASS = {
  en_operacion: 'estado-operacion', suspendido: 'estado-suspendido',
  en_construccion: 'estado-construccion', en_desarrollo: 'estado-default', cancelado: 'estado-default',
}
const MODALIDAD_LABELS = {
  bolsa_directa: 'Bolsa directa', bolsa_comercializador: 'Bolsa comercializador',
  ppa: 'PPA', interna: 'Interna',
}
const CUMPLIMIENTO_LABELS = { on_track: 'Al día', at_risk: 'En riesgo', deficit: 'Déficit' }
const CUMPLIMIENTO_CLASS = { on_track: 'chip-ok', at_risk: 'chip-warn', deficit: 'chip-danger' }
const ESTADO_CONTRATO_LABELS = {
  vigente: 'Vigente', vencido: 'Vencido', terminado: 'Terminado', en_renovacion: 'En renovación',
}
// Chips propios en vez de <Tag>: los estilos de PrimeVue se inyectan después de
// Tailwind y ganan el empate de especificidad, así que un Tag no se deja
// encoger a la tipografía compacta del resto de la tabla.
const ESTADO_CONTRATO_CLASS = {
  vigente: 'chip-ok', vencido: 'chip-danger', terminado: 'chip-neutral', en_renovacion: 'chip-warn',
}

// ── Estado de la vista (se sincroniza con la URL para poder compartirla) ─────
const VISTAS_VALIDAS = VISTAS.map(v => v.key)
const SERVICIOS_VALIDOS = SERVICIOS.map(s => s.key)

// La base son los proyectos: la vista abre directo en su tabla. Igual solo se
// pide lo del angulo activo, nunca los tres a la vez.
const vista = ref(VISTAS_VALIDAS.includes(route.query.vista) ? route.query.vista : 'proyectos')
const servicio = ref(SERVICIOS_VALIDOS.includes(route.query.srv) ? route.query.srv : 'ppa')
const q = ref(route.query.q || '')
const compacta = ref(localStorage.getItem('servicios_unificado_compacta') !== '0')

watch(compacta, v => localStorage.setItem('servicios_unificado_compacta', v ? '1' : '0'))

watch([vista, servicio, q, agruparPor], () => {
  const query = {}
  if (vista.value) query.vista = vista.value
  if (vista.value === 'proyectos' && agruparPor.value) query.grupo = agruparPor.value
  if (vista.value === 'servicios') query.srv = servicio.value
  if (q.value) query.q = q.value
  router.replace({ query })
})

const filasPorPagina = computed(() => (compacta.value ? 100 : 50))
// Los filtros de Proyectos ocupan una fila extra, así que la tabla dispone de
// algo menos de alto que en los demás ángulos.
// Ningún ángulo lleva fila de filtros, así que todos disponen del mismo alto.
const scrollHeight = 'calc(100vh - 250px)'



// ── Agrupar el portafolio ─────────────────────────────────────────────────────
// Cliente, PPA y Servicio son multivaluados: una planta puede tener dos
// inversionistas o estar en dos PPA. En esos casos la planta aparece en cada
// grupo al que pertenece, que es justo lo que se quiere ver -- por eso la lista
// agrupada puede tener MAS filas que plantas, y el contador de arriba lo dice.
const AGRUPACIONES = [
  { value: '',             label: 'Sin agrupar' },
  { value: 'cliente',      label: 'Cliente / inversionista' },
  { value: 'ppa',          label: 'Contrato PPA' },
  { value: 'servicio',     label: 'Servicio' },
  { value: 'tipo',         label: 'Tipo de proyecto' },
  { value: 'estado',       label: 'Estado' },
  { value: 'departamento', label: 'Departamento' },
]

const agruparPor = ref(AGRUPACIONES.some(a => a.value === route.query.grupo) ? route.query.grupo : '')

const SIN_DATO = 'Sin asignar'

// Devuelve los grupos a los que pertenece una planta (uno o varios).
function gruposDe(p) {
  switch (agruparPor.value) {
    case 'cliente': {
      const n = (p.inversionistas || []).map(i => i.cliente_nombre).filter(Boolean)
      return n.length ? [...new Set(n)] : [SIN_DATO]
    }
    case 'ppa': {
      const n = ppaVigentes(p).map(ppaLabel).filter(Boolean)
      return n.length ? [...new Set(n)] : ['Sin PPA']
    }
    case 'servicio': {
      const n = SERVICIOS_BADGES.filter(sb => p[sb.key]).map(sb => sb.tooltip)
      return n.length ? n : ['Sin servicios']
    }
    case 'tipo':
      return [TIPO_LABELS[p.tipo_proyecto] || p.tipo_proyecto || SIN_DATO]
    case 'estado':
      return [ESTADO_LABELS[p.estado] || p.estado || SIN_DATO]
    case 'departamento':
      return [p.departamento || SIN_DATO]
    default:
      return []
  }
}

const proyectosAgrupados = computed(() => {
  if (!agruparPor.value) return proyectosFiltrados.value
  const filas = []
  for (const p of proyectosFiltrados.value) {
    for (const g of gruposDe(p)) filas.push({ ...p, __grupo: g })
  }
  // PrimeVue pinta subencabezados solo si las filas del grupo vienen juntas.
  // "Sin asignar" / "Sin PPA" al final: son el pendiente, no el encabezado.
  return filas.sort((a, b) => {
    const av = a.__grupo.startsWith('Sin ') ? 1 : 0
    const bv = b.__grupo.startsWith('Sin ') ? 1 : 0
    if (av !== bv) return av - bv
    const g = a.__grupo.localeCompare(b.__grupo)
    return g !== 0 ? g : (a.nombre_comercial || '').localeCompare(b.nombre_comercial || '')
  })
})

const conteosPorGrupo = computed(() => {
  const m = new Map()
  for (const f of proyectosAgrupados.value) m.set(f.__grupo, (m.get(f.__grupo) || 0) + 1)
  return m
})

function conteoGrupo(g) { return conteosPorGrupo.value.get(g) || 0 }
const nGrupos = computed(() => conteosPorGrupo.value.size)

// ── Completitud del registro ───────────────────────────────────
// Se cuentan TODOS los campos del registro, no una lista curada. Lo unico que
// se saca son los que no son "campos por llenar":
//   - tecnicos (id, created_at, updated_at)
//   - derivados por el backend (num_plantas, dias_restantes, cobertura...)
//   - relaciones a otras entidades (proyectos, inversionistas, contactos...)
// Un booleano en false y un numero en 0 SI cuentan como llenos: son un dato.
// Los objetos anidados (info_tecnica, servicio_representacion) se aplanan un
// nivel, asi que sus campos tambien entran en la cuenta.
const TECNICOS = ['id', 'created_at', 'updated_at', 'deleted_at', '__grupo']

const DERIVADOS = {
  // proximo_vencimiento y alerta_contrato los calcula la proyeccion a partir
  // de los contratos: no son datos que alguien llene en la ficha.
  clientes: ['num_plantas', 'servicios', 'alerta_contrato', 'contactos_comerciales_extra',
             'proximo_vencimiento'],
  proyectos: ['ppa_contratos', 'inversionistas', 'servicios', 'info_tecnica'],
  ppa: ['proyectos', 'dias_restantes', 'estado_cumplimiento', 'cobertura_actual_pct',
        'fecha_fin_efectiva', 'comprador', 'vendedor'],
  representacion: ['ppa_contratos', 'inversionistas', 'servicios', 'info_tecnica',
                   'servicio_representacion'],
  contrato: ['contratante', 'prestador', 'facturas_solenium', 'facturas_inversionistas',
             'indexacion_anual', 'indexacion_mensual', 'nombre_proyecto_ref'],
}

// Objetos que se aplanan un nivel para que sus campos cuenten uno por uno.
const ANIDADOS = ['info_tecnica', 'servicio_representacion']

// Campos de enlace a documento por entidad. El backend no tiene una lista de
// documentos esperados por entidad, asi que hoy esto solo puede valer 0 o 1
// (2 en cliente). Para un checklist real ("faltan 3 de 7") hace falta backend.
const DOCS = {
  clientes: [['rut_url', 'RUT'], ['documentos_comerciales', 'Documentos comerciales']],
  proyectos: [['carpeta_drive_codigo', 'Carpeta Drive']],
  ppa: [['carpeta_link', 'Carpeta del contrato']],
  representacion: [['carpeta_drive_codigo', 'Carpeta Drive']],
  contrato: [['enlace_drive', 'Enlace Drive']],
}

// La misma clave que usa el Excel: cada angulo cuenta contra su propia entidad.
const claveRequeridos = computed(() => (
  vista.value === 'clientes' ? 'clientes'
  : vista.value === 'proyectos' ? 'proyectos'
  : servicio.value === 'ppa' ? 'ppa'
  : servicio.value === 'representacion' ? 'representacion'
  : 'contrato'
))

function estaVacio(v) {
  if (v == null || v === '') return true
  if (Array.isArray(v)) return v.length === 0
  return false
}

// "nombre_interno" -> "Nombre interno"
function etiquetar(clave) {
  const t = clave.replace(/_/g, ' ')
  return t.charAt(0).toUpperCase() + t.slice(1)
}

// Pares [clave, valor] del registro que cuentan como campo por llenar.
function camposDe(fila) {
  const fuera = new Set([...TECNICOS, ...(DERIVADOS[claveRequeridos.value] || []),
                         ...(DOCS[claveRequeridos.value] || []).map(([k]) => k)])
  const pares = []
  for (const [k, v] of Object.entries(fila || {})) {
    if (fuera.has(k)) continue
    if (ANIDADOS.includes(k)) continue          // se aplanan aparte, abajo
    if (v && typeof v === 'object' && !Array.isArray(v)) continue   // otro objeto: no es un campo
    pares.push([etiquetar(k), v])
  }
  for (const anidado of ANIDADOS) {
    const obj = fila?.[anidado]
    if (!obj || typeof obj !== 'object') continue
    for (const [k, v] of Object.entries(obj)) {
      if (TECNICOS.includes(k) || k.endsWith('_id')) continue
      if (v && typeof v === 'object') continue
      pares.push([etiquetar(k), v])
    }
  }
  return pares
}

function faltanCampos(fila) {
  return camposDe(fila).filter(([, v]) => estaVacio(v)).map(([et]) => et)
}

function totalCampos(fila) {
  return camposDe(fila).length
}

function faltanDocs(fila) {
  const lista = DOCS[claveRequeridos.value] || []
  return lista.filter(([k]) => estaVacio(fila?.[k])).map(([, et]) => et)
}

function tipFalta(fila, tipo) {
  const esCampos = tipo === 'campos'
  const nombre = esCampos ? 'campos' : 'documentos'
  const lista = esCampos ? faltanCampos(fila) : faltanDocs(fila)
  const total = esCampos ? totalCampos(fila) : (DOCS[claveRequeridos.value] || []).length
  if (!lista.length) return `Sin ${nombre} pendientes (${total}/${total})`
  // Con "todos los campos" la lista puede ser larga: se muestran los primeros.
  const muestra = lista.slice(0, 12).join(', ')
  const resto = lista.length > 12 ? ` y ${lista.length - 12} más` : ''
  return `Falta${lista.length === 1 ? '' : 'n'} ${lista.length} de ${total} ${nombre}: ${muestra}${resto}`
}

// ── Formateo ─────────────────────────────────────────────────────────────────
function fmtFecha(v) { return v ? String(v).slice(0, 10) : '—' }
function num(v) { return v == null || v === '' ? '—' : Number(v).toLocaleString('es-CO') }
function ir(path) { router.push(path) }

// ── Clientes ─────────────────────────────────────────────────────────────────
const clientes = ref([])
const loadingClientes = ref(false)
const clientesCargados = ref(false)

const clientesFiltrados = computed(() => {
  const t = q.value.trim().toLowerCase()
  if (!t) return clientes.value
  return clientes.value.filter(c =>
    (c.razon_social_nombre || '').toLowerCase().includes(t) ||
    (c.nit_cedula || '').toLowerCase().includes(t) ||
    (c.contacto_comercial_nombre || '').toLowerCase().includes(t) ||
    (c.contacto_comercial_correo || '').toLowerCase().includes(t))
})

function rowClassCliente(data) {
  if (data.alerta_contrato === 'vencido') return 'row-vencido'
  if (data.alerta_contrato === 'por_vencer') return 'row-por-vencer'
  return ''
}

async function cargarClientes() {
  loadingClientes.value = true
  try {
    // Dos fuentes, fusionadas por id:
    //  - /clientes/vista-comercial trae lo derivado (num_plantas, servicios,
    //    contacto comercial, alerta de contrato) pero NO las columnas crudas.
    //  - /clientes trae la ficha (direccion, ciudad, banco, rut_url...), que es
    //    lo que necesita el contador de campos faltantes.
    // Sin la segunda, el indicador solo podria mirar 8 campos y mentiria.
    const [vista, ficha] = await Promise.all([
      api.get('/clientes/vista-comercial'),
      // size tope 500 en el backend: pedir mas devuelve 422, no una lista corta.
      api.get('/clientes', { params: { page: 1, size: 500 } }),
    ])
    const porId = new Map((ficha.data.items ?? ficha.data ?? []).map(c => [c.id, c]))
    clientes.value = vista.data.map(c => ({ ...(porId.get(c.id) || {}), ...c }))
    clientesCargados.value = true
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error al cargar clientes', detail: e.message, life: 4000 })
  } finally {
    loadingClientes.value = false
  }
}

// ── Proyectos ────────────────────────────────────────────────────────────────
const proyectos = ref([])
const loadingProyectos = ref(false)
const proyectosCargados = ref(false)

function ppaLabel(c) { return c?.nombre_interno || c?.numero_codigo_contrato || `PPA ${c?.id}` }

function ppaTooltip(c) {
  const partes = []
  if (c?.nombre_interno && c?.numero_codigo_contrato) partes.push(c.numero_codigo_contrato)
  if (c?.comprador_nombre) partes.push(`Comprador: ${c.comprador_nombre}`)
  const desde = c?.fecha_inicio ? fmtFecha(c.fecha_inicio) : null
  const hasta = c?.fecha_fin ? fmtFecha(c.fecha_fin) : null
  if (desde || hasta) partes.push(`${desde || '—'} → ${hasta || '—'}`)
  return partes.length ? `${ppaLabel(c)} · ${partes.join(' · ')}` : ppaLabel(c)
}

// ppa_contratos es una relación viewonly: puede traer contratos ya borrados.
function ppaVigentes(p) {
  return (p.ppa_contratos || []).filter(c => !c.deleted_at && !c.eliminado)
}

const proyectosFiltrados = computed(() => {
  const t = q.value.trim().toLowerCase()
  if (!t) return proyectos.value
  return proyectos.value.filter(p =>
    (p.nombre_comercial || '').toLowerCase().includes(t) ||
    (p.codigo_tsf || '').toLowerCase().includes(t) ||
    (p.municipio || '').toLowerCase().includes(t) ||
    (p.departamento || '').toLowerCase().includes(t))
})

async function cargarProyectos() {
  loadingProyectos.value = true
  try {
    const { data } = await api.get('/proyectos', { params: { page: 1, size: 500 } })
    proyectos.value = data.items ?? data
    proyectosCargados.value = true
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error al cargar proyectos', detail: e.message, life: 4000 })
  } finally {
    loadingProyectos.value = false
  }
}

// ── Servicios · PPA ──────────────────────────────────────────────────────────
const ppa = ref([])
const loadingPpa = ref(false)
const ppaCargados = ref(false)

const ppaFiltrados = computed(() => {
  const t = q.value.trim().toLowerCase()
  if (!t) return ppa.value
  return ppa.value.filter(c =>
    (c.nombre_interno || '').toLowerCase().includes(t) ||
    (c.numero_codigo_contrato || '').toLowerCase().includes(t) ||
    (c.comprador_nombre || '').toLowerCase().includes(t) ||
    (c.vendedor_nombre || '').toLowerCase().includes(t) ||
    (c.proyectos || []).some(p => (p.nombre_comercial || '').toLowerCase().includes(t)))
})

async function cargarPpa() {
  loadingPpa.value = true
  try {
    const { data } = await api.get('/ppa')
    ppa.value = data
    ppaCargados.value = true
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error al cargar contratos PPA', detail: e.message, life: 4000 })
  } finally {
    loadingPpa.value = false
  }
}

// ── Servicios · Representación ───────────────────────────────────────────────
const representacion = ref([])
const loadingRepresentacion = ref(false)
const representacionCargada = ref(false)

const representacionFiltradas = computed(() => {
  const t = q.value.trim().toLowerCase()
  if (!t) return representacion.value
  return representacion.value.filter(p =>
    (p.nombre_comercial || '').toLowerCase().includes(t) ||
    (p.servicio_representacion?.nombre_rf || '').toLowerCase().includes(t) ||
    (p.servicio_representacion?.nombre_comercializador || '').toLowerCase().includes(t) ||
    (p.departamento || '').toLowerCase().includes(t) ||
    (p.municipio || '').toLowerCase().includes(t))
})

async function cargarRepresentacion() {
  loadingRepresentacion.value = true
  try {
    const { data } = await api.get('/proyectos', { params: { servicio: 'representacion', size: 500 } })
    representacion.value = data.items ?? data
    representacionCargada.value = true
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error al cargar plantas', detail: e.message, life: 4000 })
  } finally {
    loadingRepresentacion.value = false
  }
}

// ── Servicios · Operación / REC ──────────────────────────────────────────────
const contratosServicio = ref([])
const loadingServicio = ref(false)
const servicioCargado = ref(null)   // el tipo que hay en memoria

const contratosServicioFiltrados = computed(() => {
  const t = q.value.trim().toLowerCase()
  if (!t) return contratosServicio.value
  return contratosServicio.value.filter(c =>
    (c.numero_contrato || '').toLowerCase().includes(t) ||
    (c.contratante_nombre || '').toLowerCase().includes(t) ||
    (c.prestador_nombre || '').toLowerCase().includes(t))
})

async function cargarContratosServicio(tipo) {
  loadingServicio.value = true
  try {
    const { data } = await api.get('/contratos-servicio', { params: { tipo } })
    contratosServicio.value = data
    servicioCargado.value = tipo
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error al cargar contratos', detail: e.message, life: 4000 })
  } finally {
    loadingServicio.value = false
  }
}

// ── Orquestación: cargar sólo lo que se mira, cachear el resto ──────────────
const servicioInfo = computed(() => SERVICIOS.find(s => s.key === servicio.value))

function asegurarDatos() {
  if (vista.value === 'clientes') { if (!clientesCargados.value) cargarClientes(); return }
  if (vista.value === 'proyectos') { if (!proyectosCargados.value) cargarProyectos(); return }
  if (servicio.value === 'ppa') { if (!ppaCargados.value) cargarPpa(); return }
  if (servicio.value === 'representacion') { if (!representacionCargada.value) cargarRepresentacion(); return }
  if (servicioCargado.value !== servicio.value) cargarContratosServicio(servicio.value)
}

function seleccionarVista(key) {
  vista.value = key
  asegurarDatos()
}

function seleccionarServicio(key) {
  servicio.value = key
  asegurarDatos()
}

// Solo se pide lo de la vista elegida. Entrar sin ?vista= no dispara ninguna
// peticion: la pagina espera en el selector. Los contadores de cada pestana
// aparecen a medida que se visitan, no de entrada.
onMounted(asegurarDatos)

function conteoVista(key) {
  if (key === 'clientes')  return clientesCargados.value  ? clientesFiltrados.value.length  : null
  if (key === 'proyectos') return proyectosCargados.value ? proyectosFiltrados.value.length : null
  return ppaCargados.value ? ppaFiltrados.value.length : null
}

// ── Subtítulo / búsqueda / Excel según el ángulo activo ─────────────────────
const filasVisibles = computed(() => {
  if (vista.value === 'clientes')  return clientesFiltrados.value
  if (vista.value === 'proyectos') return proyectosFiltrados.value
  if (servicio.value === 'ppa')    return ppaFiltrados.value
  if (servicio.value === 'representacion') return representacionFiltradas.value
  return contratosServicioFiltrados.value
})

const totalCrudo = computed(() => {
  if (vista.value === 'clientes')  return clientes.value.length
  if (vista.value === 'proyectos') return proyectos.value.length
  if (servicio.value === 'ppa')    return ppa.value.length
  if (servicio.value === 'representacion') return representacion.value.length
  return contratosServicio.value.length
})

const subtitulo = computed(() => {
  const etiqueta = vista.value === 'clientes' ? 'clientes'
    : vista.value === 'proyectos' ? 'plantas'
    : servicio.value === 'representacion' ? 'plantas representadas'
    : `contratos de ${servicioInfo.value?.label}`
  return `${filasVisibles.value.length} de ${totalCrudo.value} ${etiqueta} · vista unificada`
})

const placeholderBusqueda = computed(() => {
  if (vista.value === 'clientes')  return 'Buscar cliente, NIT, contacto…'
  if (vista.value === 'proyectos') return 'Buscar planta, código TSF, ubicación…'
  if (servicio.value === 'ppa')    return 'Buscar contrato, comprador, planta…'
  if (servicio.value === 'representacion') return 'Buscar planta, representante…'
  return 'Buscar número, contratante, prestador…'
})

const COLUMNAS_EXCEL = {
  clientes: () => [
    { header: 'Razón social', value: c => formatearNombre(c.razon_social_nombre) },
    { header: 'NIT', value: c => c.nit_cedula || '' },
    { header: 'Plantas', value: c => c.num_plantas ?? 0 },
    { header: 'Servicios', value: c => (c.servicios || []).map(servicioLabel).join(', ') },
    { header: 'Contacto comercial', value: c => c.contacto_comercial_nombre || '' },
    { header: 'Teléfono', value: c => c.contacto_comercial_telefono || '' },
    { header: 'Correo comercial', value: c => c.contacto_comercial_correo || '' },
    { header: 'Estado contrato', value: c => c.alerta_contrato || 'vigente' },
  ],
  proyectos: () => [
    { header: 'Cód. TSF', value: p => p.codigo_tsf || '' },
    { header: 'Nombre comercial', value: p => formatearNombre(p.nombre_comercial) },
    { header: 'Estado', value: p => ESTADO_LABELS[p.estado] || p.estado || '' },
    { header: 'Tipo', value: p => TIPO_LABELS[p.tipo_proyecto] || p.tipo_proyecto || '' },
    { header: 'Municipio', value: p => p.municipio || '' },
    { header: 'Departamento', value: p => p.departamento || '' },
    { header: 'Inicio comercialización', value: p => p.fecha_inicio_comercializacion ? fmtFecha(p.fecha_inicio_comercializacion) : '' },
    { header: 'Capacidad instalada (kWp)', value: p => p.info_tecnica?.capacidad_instalada_kwp ?? '' },
    { header: 'Potencia AC (kW)', value: p => p.info_tecnica?.potencia_ac_kw ?? '' },
    { header: 'Servicios', value: p => SERVICIOS_BADGES.filter(s => p[s.key]).map(s => s.badge).join(', ') },
    { header: 'PPA', value: p => ppaVigentes(p).map(ppaLabel).join(', ') },
    { header: 'Inversionistas', value: p => (p.inversionistas || []).map(i => i.cliente_nombre).join(', ') },
  ],
  ppa: () => [
    { header: 'Nombre interno', value: c => c.nombre_interno || '' },
    { header: 'Tipo', value: c => c.tipo_contrato === 'compra' ? 'Compra' : 'Venta' },
    { header: 'N° contrato', value: c => c.numero_codigo_contrato || '' },
    { header: 'Comprador', value: c => c.comprador_nombre || '' },
    { header: 'Vendedor', value: c => c.vendedor_nombre || '' },
    { header: 'Inicio', value: c => fmtFecha(c.fecha_inicio) },
    { header: 'Fin', value: c => fmtFecha(c.fecha_fin) },
    { header: 'Días restantes', value: c => c.dias_restantes ?? '' },
    { header: 'Cumplimiento', value: c => CUMPLIMIENTO_LABELS[c.estado_cumplimiento] || c.estado_cumplimiento || '' },
    { header: 'Cobertura (%)', value: c => c.cobertura_actual_pct ?? '' },
  ],
  representacion: () => [
    { header: 'Planta', value: p => formatearNombre(p.nombre_comercial) },
    { header: 'Potencia instalada (kWp)', value: p => p.potencia_instalada_kwp ?? '' },
    { header: 'Estado', value: p => ESTADO_LABELS[p.estado] || p.estado || '' },
    { header: 'Municipio', value: p => p.municipio || '' },
    { header: 'Departamento', value: p => p.departamento || '' },
    { header: 'Representante', value: p => p.servicio_representacion?.nombre_rf || '' },
    { header: 'Comercializador', value: p => p.servicio_representacion?.nombre_comercializador || '' },
    { header: 'Modalidad venta', value: p => MODALIDAD_LABELS[p.servicio_representacion?.modalidad_venta] || p.servicio_representacion?.modalidad_venta || '' },
    { header: 'Cód. despacho XM', value: p => p.servicio_representacion?.codigo_despacho_xm || '' },
    { header: 'CGM', value: p => p.srv_cgm ? 'Sí' : 'No' },
  ],
  contrato: () => [
    { header: 'N° contrato', value: c => c.numero_contrato || '' },
    { header: 'Contratante', value: c => c.contratante_nombre || '' },
    { header: 'Prestador', value: c => c.prestador_nombre || '' },
    { header: 'Inicio', value: c => fmtFecha(c.fecha_inicio) },
    { header: 'Fin', value: c => fmtFecha(c.fecha_fin) },
    { header: 'Estado', value: c => ESTADO_CONTRATO_LABELS[c.estado] || c.estado || '' },
  ],
}

async function descargarExcel() {
  const clave = vista.value === 'clientes' ? 'clientes'
    : vista.value === 'proyectos' ? 'proyectos'
    : servicio.value === 'ppa' ? 'ppa'
    : servicio.value === 'representacion' ? 'representacion'
    : 'contrato'
  const hoja = vista.value === 'clientes' ? 'Clientes'
    : vista.value === 'proyectos' ? 'Proyectos'
    : (servicioInfo.value?.label || 'Servicios')
  const nombre = vista.value === 'servicios' && clave === 'contrato' ? servicio.value : clave
  const fecha = new Date().toISOString().slice(0, 10)
  await exportarExcel(filasVisibles.value, COLUMNAS_EXCEL[clave](), `${nombre}_${fecha}.xlsx`, hoja)
}

// ── Creación de cliente ──────────────────────────────────────────────────────
const dialogCliente = ref(false)

async function crearCliente(payload) {
  try {
    const { data } = await api.post('/clientes', payload)
    toast.add({ severity: 'success', summary: 'Cliente creado', life: 3000 })
    dialogCliente.value = false
    router.push(`/clientes/${data.id}`)
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.detail, life: 4000 })
  }
}

function confirmarBorrarCliente(row) {
  confirm.require({
    header: 'Eliminar cliente',
    message: `¿Eliminar "${formatearNombre(row.razon_social_nombre)}"? Esta acción no se puede deshacer.`,
    icon: 'pi pi-exclamation-triangle',
    acceptSeverity: 'danger',
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
    accept: async () => {
      try {
        await api.delete(`/clientes/${row.id}`)
        clientes.value = clientes.value.filter(c => c.id !== row.id)
        toast.add({ severity: 'success', summary: 'Cliente eliminado', life: 2500 })
      } catch (e) {
        toast.add({ severity: 'error', summary: 'No se pudo eliminar',
          detail: e.response?.data?.detail || 'Error al eliminar', life: 5000 })
      }
    },
  })
}

// Los contratos de servicio no tienen vista de detalle propia: se administran
// desde la pestaña Operación de su planta, que es donde viven tarifas y pagos.
function irAEditarContratoServicio(row) {
  if (!row.proyecto_id) {
    toast.add({ severity: 'warn', summary: 'Sin planta asociada',
      detail: 'Este contrato no tiene proyecto_id, así que no hay página donde editarlo.', life: 5000 })
    return
  }
  ir(`/proyectos/${row.proyecto_id}/operacion`)
}

function confirmarBorrarContratoServicio(row) {
  const nombre = row.numero_contrato || row.contratante_nombre || 'sin número'
  confirm.require({
    header: 'Eliminar contrato',
    message: `¿Eliminar el contrato "${nombre}"? Esta acción no se puede deshacer.`,
    icon: 'pi pi-exclamation-triangle',
    acceptSeverity: 'danger',
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
    accept: async () => {
      try {
        await api.delete(`/contratos-servicio/${row.id}`)
        contratosServicio.value = contratosServicio.value.filter(c => c.id !== row.id)
        toast.add({ severity: 'success', summary: 'Contrato eliminado', life: 2500 })
      } catch (e) {
        toast.add({ severity: 'error', summary: 'No se pudo eliminar',
          detail: e.response?.data?.detail || 'Error al eliminar', life: 5000 })
      }
    },
  })
}

// ── Creación de proyecto (con el aviso de nombre parecido) ───────────────────
const dialogProyecto = ref(false)
const duplicadoVisible = ref(false)
const duplicadoInfo = ref(null)
const pendingPayload = ref(null)
const pendingInfoTecnica = ref(null)
const forzando = ref(false)

async function guardarInfoTecnicaSiAplica(proyectoId, infoTecnica) {
  if (!infoTecnica) return
  const vacia = infoTecnica.potencia_ac_kw == null
    && infoTecnica.capacidad_instalada_kwp == null
    && infoTecnica.cantidad_total_paneles == null
  if (vacia) return
  try {
    await api.put(`/proyectos/${proyectoId}/info-tecnica`, infoTecnica)
  } catch (e) {
    toast.add({ severity: 'warn', summary: 'Proyecto creado, pero la ficha técnica no se pudo guardar',
      detail: e.response?.data?.detail, life: 5000 })
  }
}

async function crearProyecto(payload, infoTecnica) {
  try {
    const { data } = await api.post('/proyectos', payload)
    await guardarInfoTecnicaSiAplica(data.id, infoTecnica)
    toast.add({ severity: 'success', summary: 'Proyecto creado', life: 3000 })
    dialogProyecto.value = false
    cargarProyectos()
  } catch (e) {
    const detail = e.response?.data?.detail
    // 409 estructurado = "hay un nombre parecido"; se puede confirmar y crear
    // igual. Distinto de un choque real de columna única (detail es string).
    if (e.response?.status === 409 && detail?.duplicado_nombre) {
      duplicadoInfo.value = detail
      pendingPayload.value = payload
      pendingInfoTecnica.value = infoTecnica
      duplicadoVisible.value = true
      return
    }
    toast.add({ severity: 'error', summary: 'Error',
      detail: typeof detail === 'string' ? detail : 'Error al guardar', life: 4000 })
  }
}

async function crearProyectoForzado() {
  forzando.value = true
  try {
    const { data } = await api.post('/proyectos', pendingPayload.value, { params: { forzar: true } })
    await guardarInfoTecnicaSiAplica(data.id, pendingInfoTecnica.value)
    toast.add({ severity: 'success', summary: 'Proyecto creado', life: 3000 })
    duplicadoVisible.value = false
    dialogProyecto.value = false
    cargarProyectos()
  } catch (e) {
    const detail = e.response?.data?.detail
    toast.add({ severity: 'error', summary: 'Error',
      detail: typeof detail === 'string' ? detail : 'Error al guardar', life: 4000 })
  } finally {
    forzando.value = false
  }
}

function confirmarBorrarProyecto(row) {
  confirm.require({
    header: 'Eliminar proyecto',
    message: `¿Eliminar "${formatearNombre(row.nombre_comercial)}"? Esta acción no se puede deshacer.`,
    icon: 'pi pi-exclamation-triangle',
    acceptSeverity: 'danger',
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
    accept: async () => {
      try {
        await api.delete(`/proyectos/${row.id}`)
        // La misma planta puede estar en la lista de Proyectos y en la de
        // Representacion; hay que sacarla de las dos.
        proyectos.value = proyectos.value.filter(p => p.id !== row.id)
        representacion.value = representacion.value.filter(p => p.id !== row.id)
        toast.add({ severity: 'success', summary: 'Proyecto eliminado', life: 2500 })
      } catch (e) {
        toast.add({ severity: 'error', summary: 'No se pudo eliminar',
          detail: e.response?.data?.detail || 'Error al eliminar', life: 5000 })
      }
    },
  })
}

// ── Contratos: wizards y borrado ─────────────────────────────────────────────
const showWizardPPA = ref(false)
const showWizardServicio = ref(false)
const ppaADuplicar = ref(null)

function abrirWizardPPA(contrato) {
  ppaADuplicar.value = contrato
  showWizardPPA.value = true
}
function cerrarWizardPPA() {
  showWizardPPA.value = false
  ppaADuplicar.value = null
}

function confirmarBorrarPpa(contrato) {
  const nombre = contrato.nombre_interno || contrato.numero_codigo_contrato || 'sin nombre'
  confirm.require({
    header: 'Confirmar eliminación',
    message: `¿Seguro que deseas eliminar el contrato "${nombre}"? Esta acción no se puede deshacer.`,
    icon: 'pi pi-exclamation-triangle',
    acceptSeverity: 'danger',
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
    accept: async () => {
      try {
        await api.delete(`/ppa/${contrato.id}`)
        ppa.value = ppa.value.filter(c => c.id !== contrato.id)
        toast.add({ severity: 'success', summary: 'Contrato eliminado', life: 2500 })
      } catch (e) {
        toast.add({ severity: 'error', summary: 'No se puede eliminar',
          detail: e.response?.data?.detail || 'Error al eliminar el contrato.', life: 6000 })
      }
    },
  })
}
</script>

<style scoped>
/* ── Selector de ángulo ─────────────────────────────────────────────────────── */
.svc-tab {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px; border: 1px solid #E5E2EC; border-radius: 9px;
  background: #fff; font-size: 13px; font-weight: 700; color: #6b7280;
  cursor: pointer; transition: border-color .12s, color .12s, background .12s; user-select: none;
}
.svc-tab:hover { border-color: #cbb8e8; color: #2C2039; }
.svc-tab i { font-size: 13px; color: #9ca3af; }
.svc-tab--on { box-shadow: 0 1px 4px rgba(0,0,0,.06); }
.svc-tab--sm { padding: 4px 9px; font-size: 12px; font-weight: 600; }
.svc-tab--sm i { font-size: 11px; }
.svc-tab-count {
  background: #EEF0F2; color: #6b7280; border-radius: 999px;
  font-size: 10px; font-weight: 800; padding: 0 6px; min-width: 18px; text-align: center;
}

/* ── Buscador de la cabecera ─────────────────────────────────────
   Angosto a propósito: cada píxel que ocupa la cabecera se lo quita a la tabla,
   y lo que se teclea acá suele ser una palabra. En móvil pasa a ancho completo. */
.ph-buscar { width: 100%; }
@media (min-width: 640px) { .ph-buscar { width: 190px; } }

/* ── Caja de la tabla ──────────────────────────────────────────────────────── */
.tabla-caja {
  background: #fff; border: 1px solid #ECE7F2; border-radius: 12px; overflow: hidden;
  box-shadow: 0 1px 2px rgba(0,0,0,.04);
}

/* ── Densidad ──────────────────────────────────────────────────────────────────
   El objetivo es meter la mayor cantidad de filas y columnas en pantalla sin
   perder legibilidad: encabezado en versalitas chicas, celdas de una línea. El
   botón de la cabecera alterna a "cómoda" para quien prefiera aire.          */
.tabla :deep(.p-datatable-thead > tr > th) {
  padding: 5px 8px; font-size: 10px; font-weight: 700; letter-spacing: .04em;
  text-transform: uppercase; color: #8b7fa3; background: #FAF9FC; white-space: nowrap;
}
.tabla :deep(.p-datatable-tbody > tr > td) {
  padding: 4px 8px; font-size: 12px; line-height: 1.3; white-space: nowrap;
}
.tabla--compacta :deep(.p-datatable-thead > tr > th) { padding: 3px 6px; font-size: 9.5px; }
.tabla--compacta :deep(.p-datatable-tbody > tr > td) { padding: 1px 6px; font-size: 11px; line-height: 1.2; }
.tabla :deep(.p-datatable-tbody > tr > td .p-button) { width: 1.5rem; height: 1.5rem; }
.tabla :deep(.p-datatable-tbody > tr > td .p-button .p-button-icon) { font-size: .7rem; }
.tabla :deep(.p-paginator) { padding: 2px 6px; font-size: 12px; border-top: 1px solid #F1EDF7; }
.tabla :deep(.p-paginator .p-paginator-page),
.tabla :deep(.p-paginator .p-paginator-first),
.tabla :deep(.p-paginator .p-paginator-prev),
.tabla :deep(.p-paginator .p-paginator-next),
.tabla :deep(.p-paginator .p-paginator-last) { min-width: 1.75rem; height: 1.75rem; }
.tabla :deep(.p-datatable-sort-icon) { width: .65rem; height: .65rem; }

/* Fila resaltada por vencimiento (misma semántica que la vista Clientes) */
.tabla :deep(.row-vencido) > td    { background: #FEF2F2 !important; }
.tabla :deep(.row-por-vencer) > td { background: #FFFBEB !important; }

/* La fila entera abre el detalle (sólo donde row-click está cableado) */
.tabla--clickable :deep(.p-datatable-tbody > tr) { cursor: pointer; }

/* ── Sin scroll horizontal ────────────────────────────────────────
   `table-layout: fixed` hace que los porcentajes de cada <Column> manden: la
   tabla se reparte el ancho disponible y NUNCA lo excede. Lo que no cabe se
   recorta con puntos suspensivos (y el dato completo queda en el tooltip o en
   el Excel), en vez de empujar la tabla y aparecer una barra horizontal. */
.tabla :deep(.p-datatable-table) { table-layout: fixed; width: 100%; }
.tabla :deep(.p-datatable-table-container) { overflow-x: hidden; }
.tabla :deep(.p-datatable-thead > tr > th) { overflow: hidden; }
.tabla :deep(.p-datatable-tbody > tr > td) { overflow: hidden; text-overflow: ellipsis; }

/* Texto de una línea que se recorta dentro de su celda */
.celda-txt {
  display: block; min-width: 0; max-width: 100%;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* Chips en una sola línea: si sobran, se recortan en vez de agrandar la fila */
.chips-fila { display: flex; gap: 2px; overflow: hidden; min-width: 0; }

/* Subencabezado de grupo (cuando se agrupa el portafolio) */
.grupo-titulo { font-size: 12px; font-weight: 800; color: #2C2039; }
.grupo-conteo {
  margin-left: 7px; background: #f0ebfd; color: #915BD8;
  border-radius: 999px; font-size: 10px; font-weight: 800; padding: 0 6px;
}
.tabla :deep(.p-rowgroup-header) { background: #FAF9FC; }
.tabla :deep(.p-rowgroup-header > td) { padding: 4px 8px; }

/* Celda "Falta": dos contadores, campos y documentos */
.falta-celda { display: flex; gap: 3px; }
.falta-chip {
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 10px; font-weight: 700; line-height: 1.5;
  padding: 0 5px; border-radius: 999px; cursor: default; white-space: nowrap;
}
.falta-chip i { font-size: 8px; }
.falta--ok  { background: #D1FAE5; color: #065F46; }
.falta--mal { background: #FEF3C7; color: #92400E; }

/* Celda de acciones: mismos dos iconos, misma posicion, en las 5 tablas */
.acciones { display: flex; justify-content: flex-end; gap: 0; }

/* ── Piezas de celda ──────────────────────────────────────────────────────── */
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; color: #6b5a8a; }
.sutil { font-size: 11px; color: #6b7280; }
.vacio { font-size: 11px; color: #d1d5db; }

.mini-chip {
  display: inline-flex; align-items: center; flex: 0 0 auto;
  font-size: 9.5px; font-weight: 600; line-height: 1.5;
  padding: 0 5px; border-radius: 999px; white-space: nowrap;
}
.srv-badge { background: #D1FAE5; color: #065F46; font-weight: 700; }
.chip-ok      { background: #D1FAE5; color: #065F46; }
.chip-warn    { background: #FEF3C7; color: #92400E; }
.chip-danger  { background: #FEE2E2; color: #991B1B; }
.chip-neutral { background: #F3F4F6; color: #374151; }

.estado-operacion    { background: #D1FAE5; color: #065F46; }
.estado-suspendido   { background: #FEF3C7; color: #92400E; }
.estado-construccion { background: #DBEAFE; color: #1E40AF; }
.estado-default      { background: #F3F4F6; color: #374151; }
.badge-minigranja    { background: #D1FAE5; color: #065F46; }
.badge-gd            { background: #DBEAFE; color: #1E40AF; }
.badge-autoconsumo   { background: #E1F5EE; color: #085041; }
.badge-movilidad     { background: #EEEDFE; color: #3C3489; }
.badge-otro          { background: #F3F4F6; color: #374151; }

.nombre-link {
  display: block; max-width: 100%; text-align: left;
  font-size: 11.5px; font-weight: 600; color: #2C2039;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  cursor: pointer; transition: color .12s;
}
.nombre-link:hover { color: #915BD8; text-decoration: underline; text-underline-offset: 2px; }

.ppa-chip {
  min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  background: #EEEDFE; color: #3C3489; font-size: 9.5px; font-weight: 600;
  padding: 0 5px; border-radius: 999px; cursor: pointer; transition: background .12s, color .12s;
}
.ppa-chip:hover { background: #915BD8; color: #fff; }

.pulse-dot {
  display: inline-block; width: 5px; height: 5px; border-radius: 50%;
  background: #10B981; flex-shrink: 0; animation: pulse-dot 1.5s ease-in-out infinite;
}
@keyframes pulse-dot {
  0%, 100% { transform: scale(1);   opacity: 1; }
  50%      { transform: scale(1.4); opacity: .65; }
}

</style>
