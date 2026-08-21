<template>
  <div v-if="contrato">
    <DetalleLayout :volver="{ to: '/servicios-unificado?vista=servicios&srv=ppa', label: 'Servicios' }"
                   :titulo="contrato.nombre_interno || contrato.numero_codigo_contrato || 'Contrato PPA'"
                   :codigo="contrato.numero_codigo_contrato || ''"
                   :tabs="TABS" v-model="activeTab">
      <template #chips>
        <Tag value="PPA" severity="warn" class="text-[10px]" />
        <Tag :value="(contrato.tipo_contrato === 'compra') ? 'Compra' : 'Venta'"
          :style="(contrato.tipo_contrato === 'compra')
            ? 'background:#915BD8;color:#fff'
            : 'background:#F6FF72;color:#2C2039'" class="text-[10px]" />
      </template>
      <template #acciones>
        <!-- Atajo al contrato: el enlace se guarda en la pestaña Datos -->
        <a v-if="enlaceContrato" :href="enlaceContrato" target="_blank" rel="noopener noreferrer"
          class="cd-head-link" v-tooltip.bottom="'Abrir el contrato en Drive'">
          <i class="pi pi-external-link" />Contrato
        </a>
        <Button label="Editar contrato" icon="pi pi-pencil" severity="secondary" outlined size="small"
          @click="abrirEdicionCompleta" />
      </template>
      <template #default="{ tab }">
      <!-- ══ DATOS ══ -->
      <div v-if="tab === 'datos'" class="space-y-4">

        <!-- ── Resumen: lo que se quiere saber de un vistazo ─────────── -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div class="cd-stat"
            :style="`background:${estadoVigencia.bg};border-color:${estadoVigencia.borde}`">
            <p class="cd-stat-lbl" :style="`color:${estadoVigencia.color}`">
              <i class="pi pi-circle-fill" style="font-size:6px" />Estado
            </p>
            <p class="cd-stat-val" :style="`color:${estadoVigencia.color}`">{{ estadoVigencia.label }}</p>
            <p class="cd-stat-sub" :style="`color:${estadoVigencia.color};opacity:.7`">{{ estadoVigencia.detalle }}</p>
          </div>

          <div class="cd-stat">
            <p class="cd-stat-lbl"><i class="pi pi-clock" style="font-size:9px" />Duración</p>
            <p class="cd-stat-val">{{ duracion || '—' }}</p>
            <p class="cd-stat-sub">
              {{ formatFecha(contrato.fecha_inicio) || '—' }} → {{ formatFecha(contrato.fecha_fin) || '—' }}
            </p>
          </div>

          <div class="cd-stat">
            <p class="cd-stat-lbl"><i class="pi pi-chart-line" style="font-size:9px" />Indexación</p>
            <p class="cd-stat-val">{{ contrato.indice_indexacion || '—' }}</p>
            <p class="cd-stat-sub">
              {{ contrato.periodicidad_indexacion || 'sin periodicidad' }}<template v-if="contrato.periodo_indexacion_base"> · base {{ contrato.periodo_indexacion_base }}</template>
            </p>
          </div>

          <div class="cd-stat">
            <p class="cd-stat-lbl"><i class="pi pi-file" style="font-size:9px" />Facturación</p>
            <p class="cd-stat-val">{{ contrato.periodicidad_facturacion || '—' }}</p>
            <p class="cd-stat-sub">
              {{ contrato.tiempo_pago != null ? ('pago a ' + contrato.tiempo_pago + ' días') : 'sin plazo de pago' }}
            </p>
          </div>
        </div>

        <!-- ── Identificación ────────────────────────────────────────── -->
        <section class="cd-sec">
          <header class="cd-sec-head">
            <span class="cd-ico" style="background:#915BD818"><i class="pi pi-id-card" style="color:#915BD8" /></span>
            <h3 class="cd-sec-title">Identificación</h3>
            <div class="cd-sec-act">
              <Button v-if="!editandoId" icon="pi pi-pencil" label="Editar" size="small" text severity="secondary"
                @click="iniciarEdicionId" />
              <template v-else>
                <Button label="Cancelar" size="small" text severity="secondary" @click="cancelarEdicionId" />
                <Button label="Guardar" icon="pi pi-check" size="small" :loading="guardandoId" @click="guardarId" />
              </template>
            </div>
          </header>
          <div class="cd-sec-body">
            <!-- Modo lectura -->
            <div v-if="!editandoId" class="cd-grid">
              <InfoField label="Nombre interno" :value="contrato.nombre_interno" />
              <InfoField label="Número de contrato" :value="contrato.numero_codigo_contrato" />
              <InfoField label="Tipo de contrato" :value="contrato.tipo_contrato === 'compra' ? 'Compra' : 'Venta'" />
              <InfoField label="Responsable" :value="contrato.responsable?.nombre" />
              <div class="flex flex-col gap-0.5">
                <span class="cd-campo-lbl">Comunidad energética</span>
                <div>
                  <Tag v-if="contrato.es_comunidad_energetica" severity="success" value="🏘 Sí" class="text-[10px]" />
                  <span v-else class="text-sm" style="color:#2C2039">{{ contrato.es_comunidad_energetica === false ? 'No' : '—' }}</span>
                </div>
              </div>
            </div>
            <!-- Modo edición -->
            <div v-else class="cd-grid">
              <div class="flex flex-col gap-1">
                <label class="cd-lbl">Nombre interno</label>
                <InputText v-model="formId.nombre_interno" placeholder="Ej: Terpel 1" class="w-full" />
              </div>
              <div class="flex flex-col gap-1">
                <label class="cd-lbl">Número de contrato</label>
                <InputText v-model="formId.numero_codigo_contrato" placeholder="Ej: UNERGY 001-2023" class="w-full" />
              </div>
            </div>
          </div>
        </section>

        <!-- ── Partes del contrato ───────────────────────────────────── -->
        <section class="cd-sec">
          <header class="cd-sec-head">
            <span class="cd-ico" style="background:#3b82f618"><i class="pi pi-users" style="color:#3b82f6" /></span>
            <h3 class="cd-sec-title">Partes del contrato</h3>
            <div class="cd-sec-act">
              <Button v-if="!editandoPartes" icon="pi pi-pencil" label="Editar" size="small" text severity="secondary"
                @click="iniciarEdicionPartes" />
              <template v-else>
                <Button label="Cancelar" size="small" text severity="secondary" @click="cancelarEdicionPartes" />
                <Button label="Guardar" icon="pi pi-check" size="small" :loading="guardandoPartes"
                  @click="guardarPartes" />
              </template>
            </div>
          </header>
          <div class="cd-sec-body">
            <!-- Modo lectura: la energía va del vendedor al comprador -->
            <div v-if="!editandoPartes" class="cd-partes">
              <div class="cd-parte">
                <p class="cd-parte-rol"><i class="pi pi-sun" style="font-size:9px" />Vendedor</p>
                <p class="cd-parte-nom">{{ contrato.vendedor_nombre || '—' }}</p>
                <p class="cd-parte-nit">NIT {{ contrato.vendedor_nit || '—' }}</p>
              </div>
              <i class="pi pi-arrow-right cd-partes-flecha" />
              <div class="cd-parte">
                <p class="cd-parte-rol"><i class="pi pi-building" style="font-size:9px" />Comprador</p>
                <p class="cd-parte-nom">{{ contrato.comprador_nombre || '—' }}</p>
                <p class="cd-parte-nit">NIT {{ contrato.comprador_nit || '—' }}</p>
              </div>
            </div>
            <!-- Modo edición -->
            <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="cd-parte space-y-3">
                <p class="cd-parte-rol"><i class="pi pi-sun" style="font-size:9px" />Vendedor</p>
                <div class="flex flex-col gap-1">
                  <label class="cd-lbl">Nombre / Razón social</label>
                  <InputText v-model="formPartes.vendedor_nombre" class="w-full" />
                </div>
                <div class="flex flex-col gap-1">
                  <label class="cd-lbl">NIT</label>
                  <InputText v-model="formPartes.vendedor_nit" class="w-full" />
                </div>
              </div>
              <div class="cd-parte space-y-3">
                <p class="cd-parte-rol"><i class="pi pi-building" style="font-size:9px" />Comprador</p>
                <div class="flex flex-col gap-1">
                  <label class="cd-lbl">Nombre / Razón social</label>
                  <InputText v-model="formPartes.comprador_nombre" class="w-full" />
                </div>
                <div class="flex flex-col gap-1">
                  <label class="cd-lbl">NIT</label>
                  <InputText v-model="formPartes.comprador_nit" class="w-full" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ── Vigencia ──────────────────────────────────────────────── -->
        <section class="cd-sec">
          <header class="cd-sec-head">
            <span class="cd-ico" style="background:#10b98118"><i class="pi pi-calendar" style="color:#10b981" /></span>
            <h3 class="cd-sec-title">Vigencia</h3>
          </header>
          <div class="cd-sec-body">
            <div class="cd-grid">
              <InfoField label="Fecha inicio" :value="formatFecha(contrato.fecha_inicio)" />
              <InfoField label="Fecha fin" :value="formatFecha(contrato.fecha_fin)" />
              <InfoField label="Duración" :value="duracion" />
              <div class="flex flex-col gap-0.5">
                <span class="cd-campo-lbl">Renovación automática</span>
                <div>
                  <Tag v-if="contrato.renovacion_automatica != null"
                    :severity="contrato.renovacion_automatica ? 'success' : 'secondary'"
                    :value="contrato.renovacion_automatica ? 'Sí' : 'No'" class="text-[10px]" />
                  <span v-else class="text-sm" style="color:#2C2039">—</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ── Condiciones comerciales ───────────────────────────────── -->
        <section class="cd-sec">
          <header class="cd-sec-head">
            <span class="cd-ico" style="background:#f59e0b18"><i class="pi pi-dollar" style="color:#f59e0b" /></span>
            <h3 class="cd-sec-title">Condiciones comerciales</h3>
          </header>
          <div class="cd-sec-body">
            <div class="cd-grid">
              <InfoField label="Índice de indexación" :value="contrato.indice_indexacion" />
              <InfoField label="Periodicidad indexación" :value="contrato.periodicidad_indexacion" />
              <InfoField label="Período base indexación" :value="contrato.periodo_indexacion_base" />
              <InfoField label="Valor indexación base"
                :value="contrato.valor_indexacion_base != null ? String(contrato.valor_indexacion_base) : null" />
              <InfoField label="Tarifa base ($/kWh)" :value="tarifaBaseFmt" />
              <InfoField label="Periodicidad facturación" :value="contrato.periodicidad_facturacion" />
              <InfoField label="Tiempo de pago (días)"
                :value="contrato.tiempo_pago != null ? String(contrato.tiempo_pago) : null" />
              <div v-if="contrato.condiciones_pago" class="cd-ancho flex flex-col gap-0.5">
                <span class="cd-campo-lbl">Condiciones de pago</span>
                <span class="text-sm whitespace-pre-line" style="color:#2C2039">{{ contrato.condiciones_pago }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- ── GESCON / SIC ──────────────────────────────────────────── -->
        <section class="cd-sec">
          <header class="cd-sec-head">
            <span class="cd-ico" style="background:#6366f118"><i class="pi pi-book" style="color:#6366f1" /></span>
            <h3 class="cd-sec-title">GESCON / SIC</h3>
            <div class="cd-sec-act">
              <Button v-if="!editandoGescon" icon="pi pi-pencil" label="Editar" size="small" text severity="secondary"
                @click="editandoGescon = true" />
              <template v-else>
                <Button label="Cancelar" size="small" text severity="secondary" @click="editandoGescon = false" />
                <Button label="Guardar" size="small" icon="pi pi-check" :loading="guardandoGescon" @click="guardarGescon" />
              </template>
            </div>
          </header>
          <div class="cd-sec-body">
            <!-- Modo lectura -->
            <div v-if="!editandoGescon" class="cd-grid">
              <InfoField label="Código SIC" :value="contrato.codigo_sic" />
              <InfoField label="Código GESCON" :value="contrato.gescon_codigo" />
              <InfoField label="GESCON inicio" :value="formatFecha(contrato.gescon_fecha_inicio)" />
              <InfoField label="GESCON fin" :value="formatFecha(contrato.gescon_fecha_fin)" />
              <InfoField label="Precio GESCON" :value="gesconPrecioFmt" />
              <InfoField label="Cantidades GESCON (kWh)" :value="gesconCantidadesFmt" />
            </div>
            <!-- Modo edición -->
            <div v-else class="cd-grid">
              <div class="flex flex-col gap-1">
                <label class="cd-lbl">Código SIC</label>
                <InputText v-model="formGescon.codigo_sic" class="w-full" />
              </div>
              <div class="flex flex-col gap-1">
                <label class="cd-lbl">Código GESCON</label>
                <InputText v-model="formGescon.gescon_codigo" class="w-full" />
              </div>
              <div class="flex flex-col gap-1">
                <label class="cd-lbl">Precio GESCON ($/kWh)</label>
                <InputNumber v-model="formGescon.gescon_precio" :maxFractionDigits="4" class="w-full" />
              </div>
              <div class="flex flex-col gap-1">
                <label class="cd-lbl">GESCON inicio</label>
                <DatePicker v-model="formGescon.gescon_fecha_inicio" dateFormat="yy-mm-dd" showIcon class="w-full" />
              </div>
              <div class="flex flex-col gap-1">
                <label class="cd-lbl">GESCON fin</label>
                <DatePicker v-model="formGescon.gescon_fecha_fin" dateFormat="yy-mm-dd" showIcon class="w-full" />
              </div>
              <div class="flex flex-col gap-1">
                <label class="cd-lbl">Cantidades GESCON (kWh)</label>
                <InputNumber v-model="formGescon.gescon_cantidades_kwh" :maxFractionDigits="3" locale="en-US" class="w-full" />
              </div>
            </div>
          </div>
        </section>

        <!-- ── Documentos y enlaces ──────────────────────────────────── -->
        <section class="cd-sec">
          <header class="cd-sec-head">
            <span class="cd-ico" style="background:#d9770618"><i class="pi pi-link" style="color:#d97706" /></span>
            <h3 class="cd-sec-title">Documentos y enlaces</h3>
            <div class="cd-sec-act">
              <Button v-if="!editandoEnlace"
                :icon="enlaceContrato ? 'pi pi-pencil' : 'pi pi-plus'"
                :label="enlaceContrato ? 'Editar' : 'Agregar enlace'"
                size="small" text severity="secondary" @click="iniciarEdicionEnlace" />
              <template v-else>
                <Button label="Cancelar" size="small" text severity="secondary" @click="editandoEnlace = false" />
                <Button label="Guardar" icon="pi pi-check" size="small" :loading="guardandoEnlace" @click="guardarEnlace" />
              </template>
            </div>
          </header>
          <div class="cd-sec-body">
            <!-- Modo lectura -->
            <div v-if="!editandoEnlace" class="cd-link" :class="{ 'cd-link--vacio': !enlaceContrato }">
              <span class="cd-ico" style="background:#fef3c7">
                <i class="pi pi-file-pdf" style="color:#d97706" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="text-xs font-medium mb-0.5" style="color:#92400e">Contrato en Drive</p>
                <a v-if="enlaceContrato" :href="enlaceContrato" target="_blank" rel="noopener noreferrer"
                  class="text-sm font-semibold inline-flex items-center gap-1.5 hover:underline" style="color:#d97706">
                  <i class="pi pi-external-link text-xs" />Ver contrato
                </a>
                <button v-else type="button" class="cd-link-add" @click="iniciarEdicionEnlace">
                  <i class="pi pi-plus-circle text-xs" />Agregar enlace
                </button>
                <p v-if="enlaceContrato" class="text-[11px] truncate mt-0.5" style="color:#b4884f">
                  {{ enlaceContrato }}
                </p>
              </div>
            </div>
            <!-- Modo edición -->
            <div v-else class="flex flex-col gap-1 max-w-xl">
              <label class="cd-lbl">Enlace al contrato (Drive, Dropbox, SharePoint…)</label>
              <InputText v-model.trim="formEnlace.carpeta_link" class="w-full"
                placeholder="https://drive.google.com/…" @keyup.enter="guardarEnlace" />
              <small class="text-[11px]" style="color:#9b89b5">
                Debe empezar por <span class="font-mono">http://</span> o <span class="font-mono">https://</span>.
                Déjalo vacío para quitar el enlace.
              </small>
            </div>
          </div>
        </section>

        <!-- ── Detalles operacionales (solo si el contrato los trae) ─── -->
        <section v-if="tieneDetallesOperacionales" class="cd-sec">
          <header class="cd-sec-head">
            <span class="cd-ico" style="background:#64748b18"><i class="pi pi-list" style="color:#64748b" /></span>
            <h3 class="cd-sec-title">Detalles operacionales y contractuales</h3>
          </header>
          <div class="cd-sec-body space-y-3">
            <div v-if="contrato.service_scope" class="flex flex-col gap-0.5">
              <span class="cd-campo-lbl">Alcance del servicio</span>
              <span class="text-sm whitespace-pre-line" style="color:#2C2039">{{ contrato.service_scope }}</span>
            </div>
            <div v-if="contrato.specific_service_terms" class="flex flex-col gap-0.5">
              <span class="cd-campo-lbl">Términos específicos del servicio</span>
              <span class="text-sm whitespace-pre-line" style="color:#2C2039">{{ contrato.specific_service_terms }}</span>
            </div>
            <div v-if="contrato.slas" class="flex flex-col gap-0.5">
              <span class="cd-campo-lbl">SLAs (Acuerdos de nivel de servicio)</span>
              <span class="text-sm whitespace-pre-line" style="color:#2C2039">{{ contrato.slas }}</span>
            </div>
            <div v-if="contrato.responsibilities" class="flex flex-col gap-0.5">
              <span class="cd-campo-lbl">Responsabilidades</span>
              <span class="text-sm whitespace-pre-line" style="color:#2C2039">{{ contrato.responsibilities }}</span>
            </div>
          </div>
        </section>

      </div>

      <!-- ══ CANTIDADES ══ -->
      <div v-if="tab === 'cantidades'">
        <div class="flex justify-between items-center mb-3">
          <SelectButton v-if="!editandoCantidades" v-model="vistaCantidades" :options="VISTAS" optionLabel="label" optionValue="value" />
          <span v-else />
          <div class="flex gap-2">
            <template v-if="!editandoCantidades">
              <Button icon="pi pi-pencil" label="Editar" size="small" text severity="secondary"
                @click="editandoCantidades = true" />
            </template>
            <template v-else>
              <Button label="Cancelar" size="small" text severity="secondary"
                @click="editandoCantidades = false; energiaPaste = ''; energiaRows = []; energiaError = ''" />
              <Button label="Guardar" icon="pi pi-check" size="small" :loading="guardandoCantidades"
                :disabled="!energiaRows.length" @click="guardarCantidades" />
            </template>
          </div>
        </div>

        <!-- Modo edición cantidades -->
        <template v-if="editandoCantidades">
          <p class="text-xs text-gray-400 mb-2">
            Copia las columnas <strong>Año · Mes · Mín · Máx · Plantas contrato</strong> desde Excel y pégalas aquí
            (Mín/Máx en MWh/mes; <strong>Plantas contrato</strong> = nº de plantas que el contrato exige ese mes).
            Máx y Plantas contrato son opcionales. Esto <strong>reemplazará</strong> todos los compromisos actuales.
          </p>
          <Textarea v-model="energiaPaste" rows="7"
            placeholder="2024&#9;Enero&#9;90&#9;180&#9;4&#10;2024&#9;Febrero&#9;90&#9;180&#9;4"
            class="w-full font-mono text-xs" @paste="onPasteEnergia" />
          <div class="flex items-center gap-2 mt-2">
            <Button label="Procesar" icon="pi pi-refresh" size="small" severity="secondary" outlined @click="parseEnergia" />
            <Button v-if="energiaRows.length" label="Limpiar" icon="pi pi-times" size="small" severity="danger" text
              @click="energiaRows = []; energiaPaste = ''; energiaError = ''" />
            <span v-if="energiaRows.length" class="text-xs text-green-600 font-medium">{{ energiaRows.length }} filas listas</span>
            <span v-if="energiaError" class="text-xs text-red-400">{{ energiaError }}</span>
          </div>
          <div v-if="energiaRows.length" class="mt-3 border border-gray-100 rounded-lg overflow-hidden">
            <table class="w-full text-xs">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-3 py-1.5 text-left text-gray-500 font-medium">Año</th>
                  <th class="px-3 py-1.5 text-left text-gray-500 font-medium">Mes</th>
                  <th class="px-3 py-1.5 text-right text-gray-500 font-medium">Mín (MWh)</th>
                  <th class="px-3 py-1.5 text-right text-gray-500 font-medium">Máx (MWh)</th>
                  <th class="px-3 py-1.5 text-right text-gray-500 font-medium">Plantas contrato</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, i) in energiaRows.slice(0, 8)" :key="i" class="border-t border-gray-50">
                  <td class="px-3 py-1 text-gray-700">{{ r.año }}</td>
                  <td class="px-3 py-1 text-gray-700">{{ MESES[r.mes - 1] }}</td>
                  <td class="px-3 py-1 text-right text-gray-700">{{ r.energia_minima }}</td>
                  <td class="px-3 py-1 text-right text-gray-700">{{ r.energia_maxima ?? '—' }}</td>
                  <td class="px-3 py-1 text-right text-gray-700">{{ r.cantidad_proyectos ?? '—' }}</td>
                </tr>
                <tr v-if="energiaRows.length > 8" class="border-t border-gray-50">
                  <td colspan="5" class="px-3 py-1 text-gray-300 italic">… y {{ energiaRows.length - 8 }} filas más</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>

        <!-- Modo lectura cantidades -->
        <template v-else>
          <DataTable
            :value="vistaCantidades === 'anual' ? cantidadesAnuales : cantidadesMensuales"
            stripedRows class="text-sm" paginator :rows="24"
            :rowsPerPageOptions="[12, 24, 60, 120]"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
            emptyMessage="Sin compromisos de energía registrados."
          >
            <Column field="año" header="Año" style="width:70px" />
            <Column v-if="vistaCantidades === 'mensual'" header="Mes" style="width:130px">
              <template #body="{ data }">{{ MESES[data.mes - 1] }}</template>
            </Column>
            <Column :header="vistaCantidades === 'anual' ? 'Mín (MWh/año)' : 'Mín (MWh/mes)'">
              <template #body="{ data }">
                {{ data.energia_minima != null ? Number(data.energia_minima).toLocaleString('es-CO', { maximumFractionDigits: 1 }) : '—' }}
              </template>
            </Column>
            <Column :header="vistaCantidades === 'anual' ? 'Máx (MWh/año)' : 'Máx (MWh/mes)'">
              <template #body="{ data }">
                {{ data.energia_maxima != null ? Number(data.energia_maxima).toLocaleString('es-CO', { maximumFractionDigits: 1 }) : '—' }}
              </template>
            </Column>
            <Column style="width:150px">
              <template #header>
                <span v-tooltip.top="'Plantas registradas y despachando energía al contrato. La calcula la plataforma vía GESCON.'">
                  {{ vistaCantidades === 'anual' ? 'Plantas inscritas (máx)' : 'Plantas inscritas' }}
                </span>
              </template>
              <template #body="{ data }">
                {{ data.plantas_inscritas != null ? data.plantas_inscritas : '—' }}
              </template>
            </Column>
            <Column :header="vistaCantidades === 'anual' ? 'Plantas contrato (máx)' : 'Plantas contrato'" style="width:150px">
              <template #body="{ data }">
                {{ data.cantidad_proyectos != null ? data.cantidad_proyectos : '—' }}
              </template>
            </Column>
            <Column header="Rango">
              <template #body="{ data }">
                <div v-if="data.energia_minima != null && data.energia_maxima != null" class="text-xs text-gray-400">
                  {{ ((data.energia_maxima / data.energia_minima - 1) * 100).toFixed(0) }}% flex
                </div>
              </template>
            </Column>
          </DataTable>
        </template>
      </div>

      <!-- ══ TARIFAS ══ -->
      <div v-if="tab === 'tarifas'">
        <div class="flex justify-between items-center mb-3">
          <SelectButton v-if="!editandoTarifas" v-model="vistaTarifas" :options="VISTAS" optionLabel="label" optionValue="value" />
          <span v-else />
          <div class="flex gap-2">
            <template v-if="!editandoTarifas">
              <Button icon="pi pi-pencil" label="Editar" size="small" text severity="secondary"
                @click="editandoTarifas = true" />
            </template>
            <template v-else>
              <Button label="Cancelar" size="small" text severity="secondary"
                @click="editandoTarifas = false; tarifasPaste = ''; tarifasRows = []; tarifasError = ''" />
              <Button label="Guardar" icon="pi pi-check" size="small" :loading="guardandoTarifas"
                :disabled="!tarifasRows.length" @click="guardarTarifas" />
            </template>
          </div>
        </div>

        <!-- Modo edición tarifas -->
        <template v-if="editandoTarifas">
          <p class="text-xs text-gray-400 mb-2">
            Copia las columnas <strong>Año · Mes · Tarifa</strong> desde Excel y pégalas aquí.
            Esto <strong>reemplazará</strong> todas las tarifas actuales.
          </p>
          <Textarea v-model="tarifasPaste" rows="7"
            placeholder="2024&#9;Enero&#9;460&#10;2024&#9;Febrero&#9;460"
            class="w-full font-mono text-xs" @paste="onPasteTarifas" />
          <div class="flex items-center gap-2 mt-2">
            <Button label="Procesar" icon="pi pi-refresh" size="small" severity="secondary" outlined @click="parseTarifas" />
            <Button v-if="tarifasRows.length" label="Limpiar" icon="pi pi-times" size="small" severity="danger" text
              @click="tarifasRows = []; tarifasPaste = ''; tarifasError = ''" />
            <span v-if="tarifasRows.length" class="text-xs text-green-600 font-medium">{{ tarifasRows.length }} filas listas</span>
            <span v-if="tarifasError" class="text-xs text-red-400">{{ tarifasError }}</span>
          </div>
          <div v-if="tarifasRows.length" class="mt-3 border border-gray-100 rounded-lg overflow-hidden">
            <table class="w-full text-xs">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-3 py-1.5 text-left text-gray-500 font-medium">Año</th>
                  <th class="px-3 py-1.5 text-left text-gray-500 font-medium">Mes</th>
                  <th class="px-3 py-1.5 text-right text-gray-500 font-medium">Tarifa ($/kWh)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, i) in tarifasRows.slice(0, 8)" :key="i" class="border-t border-gray-50">
                  <td class="px-3 py-1 text-gray-700">{{ r.año }}</td>
                  <td class="px-3 py-1 text-gray-700">{{ MESES[r.mes - 1] }}</td>
                  <td class="px-3 py-1 text-right text-gray-700">{{ r.tarifa }}</td>
                </tr>
                <tr v-if="tarifasRows.length > 8" class="border-t border-gray-50">
                  <td colspan="3" class="px-3 py-1 text-gray-300 italic">… y {{ tarifasRows.length - 8 }} filas más</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>

        <!-- Modo lectura tarifas -->
        <template v-else>
          <DataTable
            :value="vistaTarifas === 'anual' ? tarifasAnuales : tarifasMensuales"
            stripedRows class="text-sm" paginator :rows="24"
            :rowsPerPageOptions="[12, 24, 60, 120]"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
            emptyMessage="Sin tarifas registradas."
          >
            <Column field="año" header="Año" style="width:70px" />
            <Column v-if="vistaTarifas === 'mensual'" header="Mes" style="width:130px">
              <template #body="{ data }">{{ MESES[data.mes - 1] }}</template>
            </Column>
            <Column header="Tarifa (COP/kWh)">
              <template #body="{ data }">
                <span class="font-mono font-medium text-amber-700">
                  {{ data.tarifa != null ? `$${Number(data.tarifa).toLocaleString('es-CO', { maximumFractionDigits: 2 })}` : '—' }}
                </span>
                <span v-if="vistaTarifas === 'anual' && !data._uniforme" class="text-xs text-gray-400 ml-1">prom.</span>
              </template>
            </Column>
            <Column header="Variación">
              <template #body="{ data, index }">
                <template v-if="index > 0">
                  <span
                    v-if="currentTarifas[index - 1]?.tarifa != null && data.tarifa != null"
                    class="text-xs font-medium"
                    :class="data.tarifa < currentTarifas[index-1].tarifa ? 'text-green-600' : data.tarifa > currentTarifas[index-1].tarifa ? 'text-red-500' : 'text-gray-400'"
                  >
                    {{ variacion(currentTarifas[index-1].tarifa, data.tarifa) }}
                  </span>
                </template>
              </template>
            </Column>
          </DataTable>
        </template>
      </div>

      <!-- ══ CONTRATOS ASIC ══ -->
      <div v-if="tab === 'asic'">
        <div class="flex justify-between items-center mb-3">
          <span class="text-xs text-gray-400">{{ asicRows.length }} registros totales</span>
          <SelectButton v-model="vistaAsic"
            :options="[{ label: 'Vigentes', value: 'vigentes' }, { label: 'Históricos', value: 'historicos' }]"
            optionLabel="label" optionValue="value" />
        </div>
        <div v-if="loadingAsic" class="flex items-center justify-center py-16 text-gray-400 gap-2">
          <i class="pi pi-spin pi-spinner" />
          <span class="text-sm">Cargando registros ASIC…</span>
        </div>
        <DataTable
          v-else
          :value="asicFiltrados"
          stripedRows
          class="text-sm"
          emptyMessage="Sin registros ASIC para este contrato."
          sortField="fecha_solicitud"
          :sortOrder="-1"
        >
          <Column field="codigo_sic_contrato" header="Código SIC" sortable style="width:110px">
            <template #body="{ data }">
              <span class="font-mono text-xs">{{ data.codigo_sic_contrato || '—' }}</span>
            </template>
          </Column>
          <Column field="planta_nombre" header="Planta" sortable>
            <template #body="{ data }">
              <router-link v-if="data.proyecto_id" :to="`/proyectos/${data.proyecto_id}`"
                class="text-amber-700 hover:underline">
                {{ data.planta_nombre || data.proyecto_id }}
              </router-link>
              <span v-else class="text-gray-400">—</span>
            </template>
          </Column>
          <Column field="tipo_solicitud" header="Tipo" style="width:120px">
            <template #body="{ data }">
              <Tag
                :value="data.tipo_solicitud"
                :severity="{ registro: 'success', modificacion: 'info', terminacion: 'danger', desistimiento: 'secondary' }[data.tipo_solicitud] || 'secondary'"
                class="text-xs capitalize"
              />
            </template>
          </Column>
          <Column field="estado_solicitud" header="Estado" style="width:110px">
            <template #body="{ data }">
              <Tag
                :value="data.estado_solicitud.replace('_', ' ')"
                :severity="{ publicado: 'success', en_proceso: 'warn', rechazado: 'danger', desistido: 'secondary' }[data.estado_solicitud] || 'secondary'"
                class="text-xs capitalize"
              />
            </template>
          </Column>
          <Column field="fecha_inicio" header="Inicio" sortable style="width:100px" />
          <Column field="fecha_fin" header="Fin" sortable style="width:100px" />
          <Column field="porcentaje_despacho" header="% Despacho" style="width:110px">
            <template #body="{ data }">
              <span v-if="data.porcentaje_despacho != null"
                :class="data.porcentaje_despacho > 100 ? 'text-red-600 font-semibold' : ''">
                {{ Number(data.porcentaje_despacho).toFixed(1) }}%
              </span>
              <span v-else class="text-gray-400">—</span>
            </template>
          </Column>
          <Column field="fecha_solicitud" header="F. solicitud" sortable style="width:120px" />
          <Column field="observaciones" header="Observaciones">
            <template #body="{ data }">
              <span class="text-xs text-gray-500">{{ data.observaciones || '—' }}</span>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- ══ PROYECTOS ══ -->
      <div v-if="tab === 'proyectos'">
        <div class="flex justify-end mb-3">
          <Button label="Asociar proyecto" icon="pi pi-plus" size="small" severity="secondary" outlined
            @click="abrirAsociar" />
        </div>
        <div v-if="contrato.proyectos?.length" class="p-2">
          <DataTable :value="contrato.proyectos" stripedRows class="text-sm" rowHover>
            <Column field="id" header="ID" style="width:60px" />
            <Column field="nombre_comercial" header="Nombre comercial" sortable>
              <template #body="{ data }">
                <router-link :to="`/proyectos/${data.id}`"
                  class="font-medium text-amber-700 hover:underline">
                  {{ data.nombre_comercial }}
                </router-link>
              </template>
            </Column>
          </DataTable>
        </div>
        <div v-else class="flex flex-col items-center py-16 gap-2 text-gray-400">
          <i class="pi pi-sitemap text-3xl" />
          <span class="text-sm">Sin proyectos asociados</span>
        </div>
      </div>
      </template>
    </DetalleLayout>

    <!-- Wizard edición completa -->
    <PPAContratoWizard v-if="showWizard" :visible="showWizard"
      :initialData="wizardInitialData"
      :editandoId="wizardEditandoId"
      @cerrar="showWizard = false"
      @editado="onWizardEditado"
      @creado="onWizardCreado" />

    <!-- Dialog asociar proyecto -->
    <Dialog v-model:visible="showAsociar" header="Asociar proyecto" modal :style="{ width: '420px' }">
      <div class="flex flex-col gap-2 pt-1">
        <label class="text-xs font-medium text-gray-600">Buscar proyecto</label>
        <Select
          v-model="proyectoSeleccionado"
          :options="todosProyectosDisponibles"
          optionLabel="nombre_comercial"
          placeholder="Seleccionar proyecto…"
          filter
          filterPlaceholder="Buscar…"
          class="w-full"
          :loading="cargandoProyectos"
        />
      </div>
      <template #footer>
        <Button label="Cancelar" severity="secondary" outlined @click="showAsociar = false" />
        <Button label="Asociar" icon="pi pi-check" :loading="asociando"
          :disabled="!proyectoSeleccionado" @click="asociarProyecto" />
      </template>
    </Dialog>
  </div>

  <!-- Loading -->
  <div v-else-if="loading" class="flex items-center justify-center py-24 text-gray-400 gap-3">
    <i class="pi pi-spin pi-spinner text-xl" />
    <span>Cargando contrato…</span>
  </div>

  <!-- Error -->
  <div v-else class="flex flex-col items-center py-24 text-gray-400 gap-2">
    <i class="pi pi-exclamation-triangle text-3xl text-amber-400" />
    <span class="text-sm">No se encontró el contrato</span>
    <Button label="Volver" text @click="$router.back()" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import DetalleLayout from '@/components/DetalleLayout.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import SelectButton from 'primevue/selectbutton'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import DatePicker from 'primevue/datepicker'
import Textarea from 'primevue/textarea'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import InfoField from '@/components/InfoField.vue'
import PPAContratoWizard from '@/views/Contratos/PPAContratoWizard.vue'
import api from '@/api/client'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const VISTAS = [{ label: 'Mensual', value: 'mensual' }, { label: 'Anual', value: 'anual' }]

const route = useRoute()
const toast = useToast()
const activeTab = ref('datos')
const TABS = computed(() => [
  { key: 'datos',      label: 'Datos',          icon: 'pi pi-info-circle' },
  { key: 'cantidades', label: 'Cantidades',     icon: 'pi pi-chart-bar',
    badge: contrato.value?.compromisos_energia?.length || null },
  { key: 'tarifas',    label: 'Tarifas',        icon: 'pi pi-dollar',
    badge: contrato.value?.tarifas?.length || null },
  { key: 'asic',       label: 'Contratos ASIC', icon: 'pi pi-book',
    badge: asicFiltrados.value?.length || null },
  { key: 'proyectos',  label: 'Proyectos',      icon: 'pi pi-bolt',
    badge: contrato.value?.proyectos?.length || null },
])

const contrato = ref(null)
const loading = ref(true)

// Edición inline de identificación
const editandoId = ref(false)
const guardandoId = ref(false)
const formId = reactive({ nombre_interno: null, numero_codigo_contrato: null })

function iniciarEdicionId() {
  formId.nombre_interno = contrato.value.nombre_interno
  formId.numero_codigo_contrato = contrato.value.numero_codigo_contrato
  editandoId.value = true
}

function cancelarEdicionId() {
  editandoId.value = false
}

async function guardarId() {
  guardandoId.value = true
  try {
    const { data } = await api.patch(`/ppa/${contrato.value.id}`, {
      nombre_interno: formId.nombre_interno || null,
      numero_codigo_contrato: formId.numero_codigo_contrato || null,
    })
    contrato.value = { ...contrato.value, ...data }
    editandoId.value = false
    toast.add({ severity: 'success', summary: 'Guardado', detail: 'Identificación actualizada', life: 2500 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.detail || e.message, life: 4000 })
  } finally {
    guardandoId.value = false
  }
}

// Edición inline de GESCON
const editandoGescon = ref(false)
const guardandoGescon = ref(false)
const formGescon = reactive({
  codigo_sic: null,
  gescon_codigo: null,
  gescon_fecha_inicio: null,
  gescon_fecha_fin: null,
  gescon_precio: null,
  gescon_cantidades_kwh: null,
})

function toISODate(v) {
  if (!v) return null
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  return String(v).slice(0, 10)
}

async function guardarGescon() {
  guardandoGescon.value = true
  try {
    const payload = {
      codigo_sic: formGescon.codigo_sic || null,
      gescon_codigo: formGescon.gescon_codigo || null,
      gescon_fecha_inicio: toISODate(formGescon.gescon_fecha_inicio),
      gescon_fecha_fin: toISODate(formGescon.gescon_fecha_fin),
      gescon_precio: formGescon.gescon_precio,
      gescon_cantidades_kwh: formGescon.gescon_cantidades_kwh,
    }
    await api.patch(`/ppa/${contrato.value.id}`, payload)
    Object.assign(contrato.value, payload)
    editandoGescon.value = false
    toast.add({ severity: 'success', summary: 'GESCON actualizado', life: 2000 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.detail || e.message, life: 4000 })
  } finally {
    guardandoGescon.value = false
  }
}

// Edición inline de partes
const editandoPartes = ref(false)
const guardandoPartes = ref(false)
const formPartes = reactive({ comprador_nombre: null, comprador_nit: null, vendedor_nombre: null, vendedor_nit: null })

function iniciarEdicionPartes() {
  formPartes.comprador_nombre = contrato.value.comprador_nombre
  formPartes.comprador_nit = contrato.value.comprador_nit
  formPartes.vendedor_nombre = contrato.value.vendedor_nombre
  formPartes.vendedor_nit = contrato.value.vendedor_nit
  editandoPartes.value = true
}

function cancelarEdicionPartes() {
  editandoPartes.value = false
}

async function guardarPartes() {
  guardandoPartes.value = true
  try {
    const { data } = await api.patch(`/ppa/${contrato.value.id}`, formPartes)
    contrato.value = { ...contrato.value, ...data }
    editandoPartes.value = false
    toast.add({ severity: 'success', summary: 'Guardado', detail: 'Partes del contrato actualizadas', life: 3000 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.detail || e.message, life: 4000 })
  } finally {
    guardandoPartes.value = false
  }
}

// ── Enlace al contrato (carpeta_link) ───────────────────────────────────────
// El campo ya existía en el modelo pero no se veía ni se editaba en ningún
// lado: el PPA se creaba con enlace desde la oferta firmada y después no había
// forma de ponerlo o corregirlo. Acá se edita inline como las demás secciones.
const editandoEnlace = ref(false)
const guardandoEnlace = ref(false)
const formEnlace = reactive({ carpeta_link: '' })

// Solo se muestra como enlace si es navegable: un texto suelto en el campo no
// debe convertirse en un <a href> roto (o peor, en una ruta relativa del SPA).
const enlaceContrato = computed(() => {
  const url = (contrato.value?.carpeta_link || '').trim()
  return /^https?:\/\//i.test(url) ? url : ''
})

function iniciarEdicionEnlace() {
  formEnlace.carpeta_link = contrato.value.carpeta_link || ''
  editandoEnlace.value = true
}

async function guardarEnlace() {
  const url = (formEnlace.carpeta_link || '').trim()
  if (url && !/^https?:\/\//i.test(url)) {
    toast.add({
      severity: 'warn', summary: 'Enlace inválido',
      detail: 'Debe empezar por http:// o https://', life: 3500,
    })
    return
  }
  guardandoEnlace.value = true
  try {
    const { data } = await api.patch(`/ppa/${contrato.value.id}`, { carpeta_link: url || null })
    contrato.value = { ...contrato.value, ...data }
    editandoEnlace.value = false
    toast.add({
      severity: 'success', summary: 'Guardado',
      detail: url ? 'Enlace del contrato actualizado' : 'Enlace eliminado', life: 2500,
    })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.detail || e.message, life: 4000 })
  } finally {
    guardandoEnlace.value = false
  }
}

// ── Tarjetas de resumen de la pestaña Datos ─────────────────────────────────
// `dias_restantes` lo calcula el endpoint /ppa/{id}; si no viniera, se deriva
// de fecha_fin para que la tarjeta nunca quede muda.
const estadoVigencia = computed(() => {
  const sinFechas = {
    label: 'Sin fechas', color: '#6b7280', bg: '#f9fafb', borde: '#e5e7eb',
    detalle: 'vigencia no registrada',
  }
  const c = contrato.value
  if (!c) return sinFechas
  const hoy = new Date().toISOString().slice(0, 10)
  const ini = formatFecha(c.fecha_inicio)
  const fin = formatFecha(c.fecha_fin)
  if (!ini && !fin) return sinFechas
  const dias = c.dias_restantes ?? (fin
    ? Math.round((new Date(`${fin}T00:00:00`) - new Date(`${hoy}T00:00:00`)) / 86400000)
    : null)
  if (fin && fin < hoy) {
    return {
      label: 'Vencido', color: '#dc2626', bg: '#fef2f2', borde: '#fecaca',
      detalle: dias != null ? `venció hace ${Math.abs(dias).toLocaleString('es-CO')} días` : `venció el ${fin}`,
    }
  }
  if (ini && ini > hoy) {
    return { label: 'Por iniciar', color: '#4f46e5', bg: '#eef2ff', borde: '#c7d2fe', detalle: `inicia el ${ini}` }
  }
  if (dias != null && dias <= 90) {
    return {
      label: 'Por vencer', color: '#d97706', bg: '#fffbeb', borde: '#fde68a',
      detalle: `quedan ${dias.toLocaleString('es-CO')} días`,
    }
  }
  return {
    label: 'Vigente', color: '#059669', bg: '#ecfdf5', borde: '#a7f3d0',
    detalle: dias != null ? `quedan ${dias.toLocaleString('es-CO')} días` : 'sin fecha de fin',
  }
})

const tarifaBaseFmt = computed(() => {
  const v = contrato.value?.tarifa_base
  return v != null ? `$${Number(v).toLocaleString('es-CO', { maximumFractionDigits: 4 })}` : null
})

const gesconPrecioFmt = computed(() => {
  const v = contrato.value?.gescon_precio
  return v != null ? `$${Number(v).toFixed(4)}` : null
})

const gesconCantidadesFmt = computed(() => {
  const v = contrato.value?.gescon_cantidades_kwh
  return v != null ? Number(v).toLocaleString('es-CO') : null
})

// Estos cuatro campos son de los contratos de SERVICIO, no de los PPA: el
// endpoint /ppa nunca los devuelve. Se mantiene la sección por si algún día
// llegan, pero oculta mientras estén vacíos en vez de mostrar cuatro guiones.
const tieneDetallesOperacionales = computed(() => {
  const c = contrato.value
  return !!(c?.service_scope || c?.specific_service_terms || c?.slas || c?.responsibilities)
})

const vistaCantidades = ref('mensual')
const vistaTarifas = ref('mensual')

// Plantas inscritas (calculadas por la plataforma): "año-mes" -> nº de plantas registradas
// y despachando energía al contrato vía GESCON. Numerador del cumplimiento de plantas.
const plantasInscritasMap = ref({})

// Edición tarifas
const editandoTarifas = ref(false)
const guardandoTarifas = ref(false)
const tarifasPaste = ref('')
const tarifasRows = ref([])
const tarifasError = ref('')

// Edición cantidades
const editandoCantidades = ref(false)
const guardandoCantidades = ref(false)
const energiaPaste = ref('')
const energiaRows = ref([])
const energiaError = ref('')

const MESES_ES = {
  enero:1, febrero:2, marzo:3, abril:4, mayo:5, junio:6,
  julio:7, agosto:8, septiembre:9, octubre:10, noviembre:11, diciembre:12,
}

function splitRow(line) {
  return line.includes('\t') ? line.split('\t') : line.split(',')
}

function parseMes(raw) {
  const s = String(raw).trim()
  const num = parseInt(s, 10)
  if (!isNaN(num) && num >= 1 && num <= 12) return num
  return MESES_ES[s.toLowerCase()] ?? null
}

function parseTarifas() {
  tarifasError.value = ''
  const lines = tarifasPaste.value.split('\n').map(l => l.trim()).filter(Boolean)
  const rows = []
  for (const [i, line] of lines.entries()) {
    const cols = splitRow(line)
    if (cols.length < 3) { tarifasError.value = `Fila ${i + 1}: se esperan 3 columnas`; tarifasRows.value = []; return }
    const año = parseInt(cols[0].trim(), 10)
    const mes = parseMes(cols[1].trim())
    const tarifa = parseFloat(cols[2].trim().replace(',', '.'))
    if (isNaN(año) || !mes || isNaN(tarifa)) { tarifasError.value = `Fila ${i + 1}: datos inválidos`; tarifasRows.value = []; return }
    rows.push({ año, mes, tarifa })
  }
  tarifasRows.value = rows
}

function parseEnergia() {
  energiaError.value = ''
  const lines = energiaPaste.value.split('\n').map(l => l.trim()).filter(Boolean)
  const rows = []
  for (const [i, line] of lines.entries()) {
    const cols = splitRow(line)
    if (cols.length < 3) { energiaError.value = `Fila ${i + 1}: se esperan al menos 3 columnas (Año · Mes · Mín)`; energiaRows.value = []; return }
    const año = parseInt(cols[0].trim(), 10)
    const mes = parseMes(cols[1].trim())
    const min = parseFloat(cols[2].trim().replace(',', '.'))
    const max = cols[3] ? parseFloat(cols[3].trim().replace(',', '.')) : null
    const plantasRaw = cols[4] ? cols[4].trim() : ''
    const plantas = plantasRaw ? parseInt(plantasRaw.replace(',', '.'), 10) : null
    if (isNaN(año) || !mes || isNaN(min)) { energiaError.value = `Fila ${i + 1}: datos inválidos`; energiaRows.value = []; return }
    rows.push({
      año, mes,
      energia_minima: min,
      energia_maxima: (max !== null && !isNaN(max)) ? max : null,
      cantidad_proyectos: (plantas !== null && !isNaN(plantas)) ? plantas : null,
    })
  }
  energiaRows.value = rows
}

function onPasteTarifas() { setTimeout(parseTarifas, 50) }
function onPasteEnergia() { setTimeout(parseEnergia, 50) }

async function guardarTarifas() {
  guardandoTarifas.value = true
  try {
    const { data } = await api.put(`/ppa/${contrato.value.id}/tarifas`, tarifasRows.value)
    contrato.value = { ...contrato.value, tarifas: data }
    editandoTarifas.value = false
    tarifasPaste.value = ''; tarifasRows.value = []
    toast.add({ severity: 'success', summary: 'Guardado', detail: `${data.length} tarifas actualizadas`, life: 2500 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.detail || e.message, life: 4000 })
  } finally {
    guardandoTarifas.value = false
  }
}

async function guardarCantidades() {
  guardandoCantidades.value = true
  try {
    const { data } = await api.put(`/ppa/${contrato.value.id}/compromisos`, energiaRows.value)
    contrato.value = { ...contrato.value, compromisos_energia: data }
    editandoCantidades.value = false
    energiaPaste.value = ''; energiaRows.value = []
    cargarPlantasInscritas()  // los periodos pudieron cambiar → recalcular inscritas
    toast.add({ severity: 'success', summary: 'Guardado', detail: `${data.length} compromisos actualizados`, life: 2500 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.detail || e.message, life: 4000 })
  } finally {
    guardandoCantidades.value = false
  }
}
const asicRows = ref([])
const loadingAsic = ref(false)
const vistaAsic = ref('vigentes')

const asicFiltrados = computed(() => {
  if (vistaAsic.value === 'historicos') return asicRows.value
  const hoy = new Date().toISOString().slice(0, 10)
  return asicRows.value.filter(r => r.fecha_fin && r.fecha_fin >= hoy)
})

const duracion = computed(() => {
  if (!contrato.value?.fecha_inicio || !contrato.value?.fecha_fin) return null
  const a = new Date(contrato.value.fecha_inicio)
  const b = new Date(contrato.value.fecha_fin)
  const meses = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth())
  const años = Math.floor(meses / 12)
  const resto = meses % 12
  return años > 0
    ? `${años} año${años !== 1 ? 's' : ''}${resto > 0 ? ` ${resto} mes${resto !== 1 ? 'es' : ''}` : ''}`
    : `${meses} mes${meses !== 1 ? 'es' : ''}`
})

function formatFecha(f) {
  if (!f) return null
  return String(f).slice(0, 10)
}

function variacion(prev, curr) {
  const pct = ((curr - prev) / prev) * 100
  if (pct === 0) return '—'
  return `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`
}

function agregarPorAño(rows, campos, modo) {
  const byYear = {}
  for (const r of rows) {
    ;(byYear[r.año] = byYear[r.año] || []).push(r)
  }
  return Object.keys(byYear).sort((a, b) => a - b).map(año => {
    const filas = byYear[año]
    const uniforme = campos.every(c => filas.every(f => f[c] === filas[0][c]))
    const entry = { año: Number(año), _uniforme: uniforme }
    for (const c of campos) {
      const sum = filas.reduce((acc, f) => acc + (f[c] ?? 0), 0)
      entry[c] = modo === 'suma' ? sum : sum / filas.length
    }
    return entry
  })
}

const tarifasMensuales = computed(() => {
  if (!contrato.value?.tarifas) return []
  return [...contrato.value.tarifas].sort((a, b) => a.año - b.año || a.mes - b.mes)
})

const tarifasAnuales = computed(() => {
  if (!contrato.value?.tarifas) return []
  return agregarPorAño(tarifasMensuales.value, ['tarifa'], 'promedio')
})

const currentTarifas = computed(() =>
  vistaTarifas.value === 'anual' ? tarifasAnuales.value : tarifasMensuales.value
)

const cantidadesMensuales = computed(() => {
  if (!contrato.value?.compromisos_energia) return []
  return [...contrato.value.compromisos_energia]
    .sort((a, b) => a.año - b.año || a.mes - b.mes)
    .map(r => ({ ...r, plantas_inscritas: plantasInscritasMap.value[`${r.año}-${r.mes}`] ?? null }))
})

const cantidadesAnuales = computed(() => {
  if (!contrato.value?.compromisos_energia) return []
  const base = agregarPorAño(cantidadesMensuales.value, ['energia_minima', 'energia_maxima'], 'suma')
  // Plantas (contrato e inscritas) no se suman entre meses: por año mostramos el máximo.
  const maxContratoByYear = {}
  const maxInscritasByYear = {}
  for (const r of cantidadesMensuales.value) {
    if (r.cantidad_proyectos != null)
      maxContratoByYear[r.año] = Math.max(maxContratoByYear[r.año] ?? 0, r.cantidad_proyectos)
    if (r.plantas_inscritas != null)
      maxInscritasByYear[r.año] = Math.max(maxInscritasByYear[r.año] ?? 0, r.plantas_inscritas)
  }
  return base.map(e => ({
    ...e,
    cantidad_proyectos: maxContratoByYear[e.año] ?? null,
    plantas_inscritas: maxInscritasByYear[e.año] ?? null,
  }))
})

// Wizard edición completa
const showWizard = ref(false)
const wizardInitialData = ref(null)
const wizardEditandoId = ref(null)

function abrirEdicionCompleta() {
  wizardInitialData.value = { ...contrato.value }
  wizardEditandoId.value = contrato.value.id
  showWizard.value = true
}

function onWizardEditado() {
  showWizard.value = false
  cargar()
  toast.add({ severity: 'success', summary: 'Contrato actualizado', life: 2000 })
}

function onWizardCreado() {
  showWizard.value = false
  cargar()
}

// Asociar proyecto
const showAsociar = ref(false)
const proyectoSeleccionado = ref(null)
const todosProyectos = ref([])
const cargandoProyectos = ref(false)
const asociando = ref(false)

const todosProyectosDisponibles = computed(() => {
  const asociadosIds = new Set((contrato.value?.proyectos ?? []).map(p => p.id))
  return todosProyectos.value.filter(p => !asociadosIds.has(p.id))
})

async function abrirAsociar() {
  showAsociar.value = true
  proyectoSeleccionado.value = null
  if (todosProyectos.value.length) return
  cargandoProyectos.value = true
  try {
    const { data } = await api.get('/proyectos', { params: { size: 500 } })
    todosProyectos.value = (data.items ?? data).sort((a, b) =>
      (a.nombre_comercial ?? '').localeCompare(b.nombre_comercial ?? ''))
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 3000 })
  } finally {
    cargandoProyectos.value = false
  }
}

async function asociarProyecto() {
  if (!proyectoSeleccionado.value) return
  asociando.value = true
  try {
    await api.post(`/ppa/${contrato.value.id}/proyectos`, { proyecto_id: proyectoSeleccionado.value.id })
    contrato.value.proyectos = [...(contrato.value.proyectos ?? []), proyectoSeleccionado.value]
    showAsociar.value = false
    toast.add({ severity: 'success', summary: 'Proyecto asociado', detail: proyectoSeleccionado.value.nombre_comercial, life: 2500 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.detail || e.message, life: 4000 })
  } finally {
    asociando.value = false
  }
}

async function cargarPlantasInscritas() {
  if (!contrato.value?.id) return
  try {
    const { data } = await api.get(`/cumplimiento/ppa/${contrato.value.id}/plantas-inscritas-por-mes`)
    const map = {}
    for (const r of data) map[`${r.año}-${r.mes}`] = r.plantas_inscritas
    plantasInscritasMap.value = map
  } catch (e) {
    // No bloquea la pestaña: si falla, la columna muestra "—".
    plantasInscritasMap.value = {}
  }
}

async function cargar() {
  loading.value = true
  try {
    const { data } = await api.get(`/ppa/${route.params.id}`)
    contrato.value = data
    cargarPlantasInscritas()
    Object.assign(formGescon, {
      codigo_sic: data.codigo_sic ?? null,
      gescon_codigo: data.gescon_codigo ?? null,
      gescon_fecha_inicio: data.gescon_fecha_inicio ?? null,
      gescon_fecha_fin: data.gescon_fecha_fin ?? null,
      gescon_precio: data.gescon_precio ?? null,
      gescon_cantidades_kwh: data.gescon_cantidades_kwh ?? null,
    })
    if (data.numero_codigo_contrato || data.codigo_sic) cargarAsic(data)
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 3000 })
  } finally {
    loading.value = false
  }
}

async function cargarAsic(c) {
  loadingAsic.value = true
  try {
    // Primero intenta por numero_codigo_contrato (un contrato PPA agrupa varios SIC)
    // y si tiene codigo_sic lo usa como filtro adicional de respaldo
    const params = c.numero_codigo_contrato
      ? { contrato_interno: c.numero_codigo_contrato }
      : { codigo_sic_contrato: c.codigo_sic }
    const { data } = await api.get('/asic', { params })
    asicRows.value = data
  } catch (e) {
    toast.add({ severity: 'warn', summary: 'ASIC', detail: 'No se pudieron cargar registros ASIC', life: 3000 })
  } finally {
    loadingAsic.value = false
  }
}

onMounted(cargar)
</script>
<style scoped>
/*
  Paleta y formas heredadas de las otras vistas de detalle (Cliente / Proyecto)
  y de Operación: tarjeta blanca con borde lila, cabecera #faf8fd, texto #2C2039,
  etiquetas #9b89b5 y un chip de ícono de color por sección. Antes esta pestaña
  era una lista plana de campos separados por <Divider> con títulos ámbar, que
  no se parecía a ninguna otra pantalla de la plataforma.
*/

/* ── Tarjetas de resumen ──────────────────────────────────────────────────── */
.cd-stat {
  background: #fff; border: 1px solid #ECE7F2; border-radius: 12px;
  padding: 11px 14px; min-width: 0;
}
.cd-stat-lbl {
  display: flex; align-items: center; gap: 5px;
  font-size: 10px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
  color: #9b89b5; margin-bottom: 3px;
}
.cd-stat-val {
  font-size: 15px; font-weight: 700; color: #2C2039; line-height: 1.25;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
/* Los valores llegan en minúscula de la BD ("mensual"). `capitalize` a secas
   convertía "16 años 1 mes" en "16 Años 1 Mes"; con ::first-letter solo sube
   la inicial y las cifras quedan intactas. */
.cd-stat-val::first-letter { text-transform: uppercase; }
.cd-stat-sub {
  font-size: 11px; color: #9b89b5; margin-top: 1px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* ── Secciones ────────────────────────────────────────────────────────────── */
.cd-sec {
  background: #fff; border: 1.5px solid #e8e0f0; border-radius: 12px; overflow: hidden;
}
.cd-sec-head {
  display: flex; align-items: center; gap: 9px; min-height: 42px;
  padding: 6px 14px; background: #faf8fd; border-bottom: 1px solid #f0eaf8;
}
.cd-sec-title {
  font-size: 12px; font-weight: 700; letter-spacing: .03em;
  text-transform: uppercase; color: #2C2039;
}
.cd-sec-act { margin-left: auto; display: flex; align-items: center; gap: 4px; }
.cd-sec-body { padding: 14px; }
.cd-ico {
  width: 26px; height: 26px; border-radius: 8px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
}
.cd-ico i { font-size: 11px; }

/* Rejilla de campos: 2 columnas en móvil, 3 desde tablet (como Proyecto) */
.cd-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
@media (min-width: 768px) { .cd-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
.cd-ancho { grid-column: 1 / -1; }
.cd-campo-lbl { font-size: 12px; font-weight: 500; color: #9b89b5; }
.cd-lbl { font-size: 12px; font-weight: 500; color: #4b5563; }

/* ── Partes: vendedor → comprador ─────────────────────────────────────────── */
.cd-partes {
  display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 12px;
}
.cd-partes-flecha { font-size: 12px; color: #c5b9db; }
@media (max-width: 640px) {
  .cd-partes { grid-template-columns: 1fr; }
  .cd-partes-flecha { transform: rotate(90deg); justify-self: center; }
}
.cd-parte {
  border: 1px solid #ECE7F2; border-radius: 10px; padding: 11px 13px;
  background: #fcfbfe; min-width: 0;
}
.cd-parte-rol {
  display: flex; align-items: center; gap: 5px;
  font-size: 10px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase;
  color: #9b89b5; margin-bottom: 3px;
}
.cd-parte-nom { font-size: 13px; font-weight: 600; color: #2C2039; }
.cd-parte-nit {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px; color: #9b8fb0; margin-top: 1px;
}

/* ── Enlace al contrato ───────────────────────────────────────────────────── */
.cd-link {
  display: flex; align-items: flex-start; gap: 10px;
  background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 11px 13px;
}
.cd-link--vacio { background: #fdfcf8; border-style: dashed; border-color: #ecdcb8; }
.cd-link-add {
  display: inline-flex; align-items: center; gap: 5px;
  background: none; border: none; padding: 0; cursor: pointer;
  font-size: 13px; font-weight: 600; color: #d97706;
}
.cd-link-add:hover { text-decoration: underline; }

/* Atajo al contrato en la cabecera, junto a "Editar contrato" */
.cd-head-link {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 10px; border-radius: 6px;
  border: 1px solid #fde68a; background: #fffbeb;
  font-size: 12px; font-weight: 600; color: #d97706;
  transition: background .12s;
}
.cd-head-link:hover { background: #fef3c7; }
.cd-head-link i { font-size: 10px; }
</style>
