# Garantías · Plan 6 — Frontend: sub-pestaña Proyecciones Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Añadir la sub-pestaña **Proyecciones** dentro de Garantías, que muestra las dos estimaciones de garantía (resto del mes actual + mes siguiente), permite ajustar plantas nuevas, guardar el snapshot semanal y ver el histórico.

**Architecture:** `GarantiasView.vue` pasa de renderizar solo `AjustesXMView` a un contenedor con dos pestañas de nivel superior: **Ajustes XM** (lo actual) y **Proyecciones** (nueva). La vista nueva consume el endpoint `/garantias/proyecciones` vía un módulo de API que usa el cliente axios existente (`@/api/client`).

**Tech Stack:** Vue 3 `<script setup>`, PrimeVue, Tailwind, axios. **Sin harness de tests en el frontend** (no hay vitest) → la verificación es `npm run build` (compila) + preview en navegador.

**Contexto verificado:**
- Cliente HTTP: `import api from '@/api/client'` (axios; baseURL `/api/v1`, agrega el Bearer token solo). Uso: `api.get(url, {params}).then(r => r.data)`.
- Backend (ya desplegable en la rama del backend): `GET /garantias/proyecciones?plantas_nuevas&kwh_planta_nueva`, `POST /garantias/proyecciones/snapshot?...`, `GET /garantias/proyecciones/historial`.
- Formateador COP: `fmtCOP` en `src/views/Garantias/AjustesXM/utils/formatters.js`.
- Estilo de pestañas (de `AjustesXMView.vue`): activa `color:#915BD8; border-bottom:2px solid #915BD8; margin-bottom:-1px`, inactiva `color:#6b5a8a`, borde `rgba(44,32,57,0.10)`.
- PrimeVue disponible: `Button`, `InputNumber`, `useToast` (patrón visto en `PolizasView.vue`).

Estructura del GET (del backend): `{fecha_corte, precio_bolsa_cop_kwh, plantas_nuevas, kwh_planta_nueva, ventanas: [{clave, anio, mes, neto_mwh, energia_neta_kwh, valor_energia, valor_plantas_nuevas, costo_regulatorio, garantia_total, regulatorio_periodo:{anio,mes,fallback}}, ...]}`. `clave ∈ {resto_mes_actual, mes_siguiente}`.

---

## File Structure

- **Create** `src/api/garantiasProyecciones.js` — wrapper de los 3 endpoints.
- **Create** `src/views/Garantias/Proyecciones/ProyeccionesView.vue` — la vista.
- **Modify** `src/views/Garantias/GarantiasView.vue` — envolver en pestañas de nivel superior.

---

### Task 1: Módulo de API

**Files:**
- Create: `src/api/garantiasProyecciones.js`

- [ ] **Step 1: Crear el módulo**

```javascript
// src/api/garantiasProyecciones.js
import api from '@/api/client'

const BASE = '/garantias/proyecciones'

export function getProyecciones({ plantasNuevas = 0, kwhPlantaNueva = 180 } = {}) {
  return api
    .get(BASE, { params: { plantas_nuevas: plantasNuevas, kwh_planta_nueva: kwhPlantaNueva } })
    .then((r) => r.data)
}

export function guardarSnapshot({ plantasNuevas = 0, kwhPlantaNueva = 180 } = {}) {
  return api
    .post(`${BASE}/snapshot`, null, {
      params: { plantas_nuevas: plantasNuevas, kwh_planta_nueva: kwhPlantaNueva },
    })
    .then((r) => r.data)
}

export function getHistorial() {
  return api.get(`${BASE}/historial`).then((r) => r.data)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/api/garantiasProyecciones.js
git commit -m "feat(garantias): modulo API de proyecciones (get/snapshot/historial)"
```

---

### Task 2: Vista `ProyeccionesView.vue`

**Files:**
- Create: `src/views/Garantias/Proyecciones/ProyeccionesView.vue`

- [ ] **Step 1: Crear la vista**

```vue
<template>
  <div class="space-y-4">
    <!-- Controles -->
    <div class="flex flex-wrap items-end gap-4 p-4 rounded-xl" style="background:rgba(145,91,216,0.06)">
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium" style="color:#6b5a8a">Plantas nuevas</label>
        <InputNumber v-model="plantasNuevas" :min="0" showButtons buttonLayout="horizontal"
          style="width:9rem" @update:modelValue="cargar" />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs font-medium" style="color:#6b5a8a">kWh por planta nueva</label>
        <InputNumber v-model="kwhPlantaNueva" :min="0" :step="10" suffix=" kWh"
          style="width:11rem" @update:modelValue="cargar" />
      </div>
      <Button label="Recalcular" icon="pi pi-refresh" :loading="cargando" @click="cargar" outlined />
      <Button label="Guardar snapshot" icon="pi pi-save" :loading="guardando" @click="guardar" />
      <div v-if="data" class="ml-auto text-xs" style="color:#6b5a8a">
        Corte: <b>{{ data.fecha_corte }}</b> · Precio bolsa:
        <b>{{ data.precio_bolsa_cop_kwh != null ? fmtCOP(data.precio_bolsa_cop_kwh) + '/kWh' : '—' }}</b>
      </div>
    </div>

    <p class="text-[11px] leading-snug" style="color:#8a7aa5">
      La garantía = (ventas − compras en bolsa) × precio de bolsa (prom. 7 días SIMEM) + costo regulatorio del mes anterior.
      El “mes siguiente” usa la proyección de cierre del mes actual como aproximación. El costo regulatorio sale del Cruce de facturas del Drive de Estados de Resultados.
    </p>

    <!-- Tarjetas de las dos ventanas -->
    <div v-if="cargando" class="text-sm" style="color:#6b5a8a">Calculando…</div>
    <div v-else-if="data" class="grid gap-4" style="grid-template-columns:repeat(auto-fit,minmax(320px,1fr))">
      <div v-for="v in data.ventanas" :key="v.clave"
        class="rounded-xl border p-5" style="border-color:rgba(44,32,57,0.10)">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm font-semibold" style="color:#2C2039">{{ tituloVentana(v) }}</span>
          <span v-if="v.regulatorio_periodo && v.regulatorio_periodo.fallback"
            class="text-[10px] px-2 py-0.5 rounded-full" style="background:#FEF3C7;color:#92400E"
            title="No había Cruce de facturas del mes; se usó el último disponible">regulatorio: fallback</span>
        </div>
        <div class="text-2xl font-bold mb-4" style="color:#915BD8">{{ fmtCOP(v.garantia_total) }}</div>
        <dl class="text-xs space-y-1.5" style="color:#4b3f61">
          <div class="flex justify-between"><dt>Neto (ventas − compras)</dt><dd>{{ fmtMWh(v.neto_mwh) }}</dd></div>
          <div class="flex justify-between"><dt>Valor energía</dt><dd>{{ fmtCOP(v.valor_energia) }}</dd></div>
          <div v-if="v.valor_plantas_nuevas" class="flex justify-between">
            <dt>Plantas nuevas</dt><dd>{{ fmtCOP(v.valor_plantas_nuevas) }}</dd></div>
          <div class="flex justify-between"><dt>Costo regulatorio</dt><dd>{{ fmtCOP(v.costo_regulatorio) }}</dd></div>
        </dl>
      </div>
    </div>

    <!-- Histórico -->
    <div class="mt-6">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-semibold" style="color:#2C2039">Histórico de snapshots</span>
        <Button label="Refrescar" icon="pi pi-history" text size="small" @click="cargarHistorial" />
      </div>
      <div v-if="historial.length" class="overflow-x-auto rounded-lg border" style="border-color:rgba(44,32,57,0.10)">
        <table class="w-full text-xs">
          <thead>
            <tr style="background:rgba(145,91,216,0.06);color:#6b5a8a">
              <th class="text-left px-3 py-2">Corte</th><th class="text-left px-3 py-2">Ventana</th>
              <th class="text-left px-3 py-2">Período</th><th class="text-right px-3 py-2">Neto (MWh)</th>
              <th class="text-right px-3 py-2">Precio</th><th class="text-right px-3 py-2">Garantía</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in historial" :key="s.id" class="border-t" style="border-color:rgba(44,32,57,0.06)">
              <td class="px-3 py-2">{{ s.fecha_corte }}</td>
              <td class="px-3 py-2">{{ etiquetaClave(s.clave) }}</td>
              <td class="px-3 py-2">{{ s.mes }}/{{ s.anio }}</td>
              <td class="px-3 py-2 text-right">{{ s.neto_mwh != null ? s.neto_mwh.toFixed(1) : '—' }}</td>
              <td class="px-3 py-2 text-right">{{ s.precio_bolsa != null ? fmtCOP(s.precio_bolsa) : '—' }}</td>
              <td class="px-3 py-2 text-right font-semibold">{{ s.garantia_total != null ? fmtCOP(s.garantia_total) : '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="text-xs" style="color:#8a7aa5">Aún no hay snapshots guardados.</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import { fmtCOP } from '../AjustesXM/utils/formatters.js'
import { getProyecciones, guardarSnapshot, getHistorial } from '@/api/garantiasProyecciones.js'

const toast = useToast()
const MESES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const plantasNuevas = ref(0)
const kwhPlantaNueva = ref(180)
const data = ref(null)
const historial = ref([])
const cargando = ref(false)
const guardando = ref(false)

function tituloVentana(v) {
  const periodo = `${MESES[v.mes] || v.mes} ${v.anio}`
  return v.clave === 'resto_mes_actual' ? `Resto del mes actual · ${periodo}` : `Mes siguiente · ${periodo}`
}
function etiquetaClave(c) {
  return c === 'resto_mes_actual' ? 'Resto mes actual' : 'Mes siguiente'
}
function fmtMWh(v) {
  return v != null ? `${v.toFixed(1)} MWh` : '—'
}

async function cargar() {
  cargando.value = true
  try {
    data.value = await getProyecciones({
      plantasNuevas: plantasNuevas.value || 0,
      kwhPlantaNueva: kwhPlantaNueva.value || 0,
    })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo calcular la proyección',
      detail: e.response?.data?.detail || e.message, life: 6000 })
  } finally {
    cargando.value = false
  }
}

async function cargarHistorial() {
  try {
    const r = await getHistorial()
    historial.value = r.snapshots || []
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo cargar el histórico',
      detail: e.response?.data?.detail || e.message, life: 5000 })
  }
}

async function guardar() {
  guardando.value = true
  try {
    await guardarSnapshot({
      plantasNuevas: plantasNuevas.value || 0,
      kwhPlantaNueva: kwhPlantaNueva.value || 0,
    })
    toast.add({ severity: 'success', summary: 'Snapshot guardado', life: 3000 })
    await cargarHistorial()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudo guardar el snapshot',
      detail: e.response?.data?.detail || e.message, life: 6000 })
  } finally {
    guardando.value = false
  }
}

onMounted(() => {
  cargar()
  cargarHistorial()
})
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/views/Garantias/Proyecciones/ProyeccionesView.vue
git commit -m "feat(garantias): vista Proyecciones (dos ventanas + snapshot + historico)"
```

---

### Task 3: Envolver GarantiasView en pestañas de nivel superior

**Files:**
- Modify: `src/views/Garantias/GarantiasView.vue`

- [ ] **Step 1: Reemplazar el contenido completo del archivo**

```vue
<template>
  <div class="space-y-4">
    <div class="flex gap-0 border-b" style="border-color: rgba(44,32,57,0.10);">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="activeTab = tab.key"
        class="px-4 py-2 text-sm font-medium transition-colors relative"
        :style="activeTab === tab.key
          ? 'color:#915BD8; border-bottom:2px solid #915BD8; margin-bottom:-1px'
          : 'color:#6b5a8a'"
      >
        {{ tab.label }}
      </button>
    </div>

    <AjustesXMView v-if="activeTab === 'ajustes'" />
    <ProyeccionesView v-else-if="activeTab === 'proyecciones'" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AjustesXMView from './AjustesXM/AjustesXMView.vue'
import ProyeccionesView from './Proyecciones/ProyeccionesView.vue'

const tabs = [
  { key: 'ajustes', label: 'Ajustes XM' },
  { key: 'proyecciones', label: 'Proyecciones' },
]
const activeTab = ref('ajustes')
</script>
```

- [ ] **Step 2: Verificar que compila**

Run: `npm run build`
Expected: build termina sin errores (`✓ built in ...`). Si falla, leer el error de Vite/rollup; suele ser una ruta de import mal escrita.

- [ ] **Step 3: Commit**

```bash
git add src/views/Garantias/GarantiasView.vue
git commit -m "feat(garantias): pestanas de nivel superior en Garantias (Ajustes XM | Proyecciones)"
```

---

## Self-Review

- **Cobertura del spec:** sub-pestaña Proyecciones separada de AjustesXM ✓, dos ventanas con desglose ✓, control de plantas nuevas + kWh editable ✓, guardar snapshot ✓, histórico ✓, nota explicativa de supuestos (proxy mes siguiente, fuente regulatorio) ✓, estilo consistente con AjustesXM ✓.
- **Placeholders:** ninguno; SFCs completos.
- **Consistencia:** el módulo API usa camelCase→snake_case en params, alineado con el backend (`plantas_nuevas`, `kwh_planta_nueva`). Claves de ventana (`resto_mes_actual`, `mes_siguiente`) coinciden con el backend.

## Verificación manual (post-build)
- `npm run dev`, entrar a `/garantias`, ver dos pestañas. En "Proyecciones": dos tarjetas, ajustar plantas nuevas recalcula, "Guardar snapshot" agrega una fila al histórico.
- Nota: el GET real depende de SIMEM + Drive + API de generación; con el backend local sin esas credenciales puede tardar o devolver error (se muestra por toast). La verificación de datos reales se hace contra el backend desplegado.

## Fin del roadmap
Con este plan, la feature queda completa de punta a punta (backend Planes 1-5 + frontend Plan 6), en las ramas `feat/garantias-proyecciones` de ambos repos, sin desplegar.
