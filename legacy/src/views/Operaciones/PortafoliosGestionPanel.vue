<template>
  <div class="pg-wrap">
    <!-- Toast -->
    <transition name="fade">
      <div v-if="toastMsg" class="pg-toast" :class="toastErr ? 'pg-toast-err' : 'pg-toast-ok'">
        {{ toastMsg }}
      </div>
    </transition>

    <!-- Barra superior: crear portafolio -->
    <div class="pg-toolbar">
      <div class="pg-hint">
        <i class="pi pi-info-circle" />
        Arrastra proyectos entre capas. Cada capa es un portafolio; el cambio se guarda
        automáticamente.
      </div>
      <div class="pg-create">
        <input
          v-model="nuevoNombre"
          class="pg-input"
          placeholder="Nombre del nuevo portafolio…"
          @keyup.enter="crear"
        />
        <button
          class="pg-btn pg-btn-primary"
          :disabled="!nuevoNombre.trim() || creando"
          @click="crear"
        >
          <i class="pi pi-plus" /> Crear capa
        </button>
        <button
          class="pg-btn pg-btn-ghost"
          :disabled="loading"
          @click="cargar"
          v-tooltip.bottom="'Recargar'"
        >
          <i :class="loading ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'" />
        </button>
      </div>
    </div>

    <div v-if="loading" class="pg-state">
      <ProgressSpinner style="width: 32px; height: 32px" /> <span>Cargando portafolios…</span>
    </div>

    <div v-else class="pg-board">
      <!-- Pool: proyectos sin portafolio -->
      <section class="pg-col pg-col-pool">
        <header class="pg-col-head">
          <div class="pg-col-title"><i class="pi pi-inbox" /> Sin portafolio</div>
          <span class="pg-col-count">{{ sinPortafolio.length }}</span>
        </header>
        <draggable
          v-model="sinPortafolio"
          :group="{ name: 'proyectos' }"
          item-key="id"
          class="pg-col-body"
          :animation="160"
          @change="onChange($event, null)"
        >
          <template #item="{ element }">
            <div class="pg-card pg-card-pool">
              <i class="pi pi-bolt pg-card-ico" />
              <div class="pg-card-info">
                <div class="pg-card-nombre">{{ element.nombre }}</div>
                <div class="pg-card-sub" v-if="element.municipio">{{ element.municipio }}</div>
              </div>
            </div>
          </template>
          <template #footer>
            <div v-if="!sinPortafolio.length" class="pg-empty">
              Todos los proyectos operativos están asignados ✓
            </div>
          </template>
        </draggable>
      </section>

      <!-- Capas (portafolios) -->
      <section v-for="pt in portafolios" :key="pt.id" class="pg-col pg-col-layer">
        <header class="pg-col-head">
          <template v-if="editandoId === pt.id">
            <input
              v-model="editandoNombre"
              class="pg-input pg-input-sm"
              @keyup.enter="renombrar(pt)"
              @keyup.esc="editandoId = null"
            />
            <button class="pg-icon-btn" @click="renombrar(pt)" v-tooltip.bottom="'Guardar'">
              <i class="pi pi-check" />
            </button>
            <button class="pg-icon-btn" @click="editandoId = null" v-tooltip.bottom="'Cancelar'">
              <i class="pi pi-times" />
            </button>
          </template>
          <template v-else>
            <div class="pg-col-title"><i class="pi pi-folder" /> {{ pt.nombre }}</div>
            <span class="pg-col-count">{{ pt.proyectos.length }}</span>
            <div class="pg-col-actions">
              <button
                class="pg-icon-btn"
                @click="empezarEdicion(pt)"
                v-tooltip.bottom="'Renombrar'"
              >
                <i class="pi pi-pencil" />
              </button>
              <button
                class="pg-icon-btn pg-icon-del"
                @click="eliminar(pt)"
                v-tooltip.bottom="'Eliminar capa'"
              >
                <i class="pi pi-trash" />
              </button>
            </div>
          </template>
        </header>
        <draggable
          v-model="pt.proyectos"
          :group="{ name: 'proyectos' }"
          item-key="id"
          class="pg-col-body"
          :animation="160"
          @change="onChange($event, pt.id)"
        >
          <template #item="{ element }">
            <div class="pg-card">
              <i class="pi pi-bolt pg-card-ico" />
              <div class="pg-card-info">
                <div class="pg-card-nombre">{{ element.nombre }}</div>
                <div class="pg-card-sub" v-if="element.municipio">{{ element.municipio }}</div>
              </div>
            </div>
          </template>
          <template #footer>
            <div v-if="!pt.proyectos.length" class="pg-empty pg-drop-hint">
              Arrastra proyectos aquí
            </div>
          </template>
        </draggable>
      </section>

      <div v-if="!portafolios.length" class="pg-state pg-state-empty">
        <i class="pi pi-folder-open text-3xl" style="color: #a89ec0" />
        <p>No hay portafolios todavía. Crea uno arriba y arrástrale proyectos.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import draggable from 'vuedraggable'
import ProgressSpinner from 'primevue/progressspinner'
import api from '@/api/client'

const loading = ref(false)
const creando = ref(false)
const portafolios = ref([]) // [{id, nombre, activo, proyectos:[...]}]
const sinPortafolio = ref([]) // [{id, nombre, sub_project, municipio}]
const nuevoNombre = ref('')
const editandoId = ref(null)
const editandoNombre = ref('')

const toastMsg = ref('')
const toastErr = ref(false)
let _t = null
function toast(msg, err = false) {
  toastMsg.value = msg
  toastErr.value = err
  if (_t) clearTimeout(_t)
  _t = setTimeout(() => {
    toastMsg.value = ''
  }, 3500)
}

async function cargar() {
  loading.value = true
  try {
    const { data } = await api.get('/portafolios')
    portafolios.value = (data.portafolios || []).map((p) => ({
      ...p,
      proyectos: p.proyectos || [],
    }))
    sinPortafolio.value = data.sin_portafolio || []
  } catch (e) {
    toast('⚠️ ' + (e.response?.data?.detail || e.message), true)
  } finally {
    loading.value = false
  }
}

// Persistir la asignación cuando un proyecto entra a una lista (added = destino)
async function onChange(evt, portafolioId) {
  if (!evt.added) return
  const proyecto = evt.added.element
  try {
    await api.patch('/portafolios/asignar', {
      proyecto_id: proyecto.id,
      portafolio_id: portafolioId,
    })
    toast(
      portafolioId ? `✅ ${proyecto.nombre} → portafolio` : `✅ ${proyecto.nombre} sin portafolio`,
    )
  } catch (e) {
    toast('⚠️ ' + (e.response?.data?.detail || e.message), true)
    cargar() // revertir al estado real
  }
}

function _agregarPortafolioCreado(data) {
  portafolios.value.push({ ...data, proyectos: data.proyectos || [] })
  portafolios.value.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  nuevoNombre.value = ''
  toast('✅ Portafolio creado')
}

async function crear() {
  const nombre = nuevoNombre.value.trim()
  if (!nombre) return
  creando.value = true
  try {
    const { data } = await api.post('/portafolios', { nombre })
    _agregarPortafolioCreado(data)
  } catch (e) {
    const detail = e.response?.data?.detail
    // 409 estructurado (nombre parecido, no exacto): se puede confirmar y
    // crear igual -- mismo patrón que el aviso al crear un Proyecto.
    if (e.response?.status === 409 && detail?.duplicado_nombre) {
      if (confirm(`${detail.mensaje} ¿Crear "${nombre}" de todos modos?`)) {
        try {
          const { data } = await api.post('/portafolios', { nombre }, { params: { forzar: true } })
          _agregarPortafolioCreado(data)
        } catch (e2) {
          toast('⚠️ ' + (e2.response?.data?.detail || e2.message), true)
        }
      }
      return
    }
    toast('⚠️ ' + (typeof detail === 'string' ? detail : e.message), true)
  } finally {
    creando.value = false
  }
}

function empezarEdicion(pt) {
  editandoId.value = pt.id
  editandoNombre.value = pt.nombre
}

function _renombrado(pt, nombre) {
  pt.nombre = nombre
  portafolios.value.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  toast('✅ Renombrado')
}

async function renombrar(pt) {
  const nombre = editandoNombre.value.trim()
  if (!nombre || nombre === pt.nombre) {
    editandoId.value = null
    return
  }
  try {
    await api.patch(`/portafolios/${pt.id}`, { nombre })
    _renombrado(pt, nombre)
  } catch (e) {
    const detail = e.response?.data?.detail
    if (e.response?.status === 409 && detail?.duplicado_nombre) {
      if (confirm(`${detail.mensaje} ¿Renombrar "${pt.nombre}" a "${nombre}" de todos modos?`)) {
        try {
          await api.patch(`/portafolios/${pt.id}`, { nombre }, { params: { forzar: true } })
          _renombrado(pt, nombre)
        } catch (e2) {
          toast('⚠️ ' + (e2.response?.data?.detail || e2.message), true)
        }
      }
    } else {
      toast('⚠️ ' + (typeof detail === 'string' ? detail : e.message), true)
    }
  } finally {
    editandoId.value = null
  }
}

async function eliminar(pt) {
  const msg = pt.proyectos.length
    ? `¿Eliminar el portafolio "${pt.nombre}"? Sus ${pt.proyectos.length} proyecto(s) volverán a "Sin portafolio".`
    : `¿Eliminar el portafolio "${pt.nombre}"?`
  if (!confirm(msg)) return
  try {
    await api.delete(`/portafolios/${pt.id}`)
    toast('🗑️ Portafolio eliminado')
    cargar()
  } catch (e) {
    toast('⚠️ ' + (e.response?.data?.detail || e.message), true)
  }
}

onMounted(cargar)
</script>

<style scoped>
.pg-wrap {
  font-family: 'Sora', system-ui, sans-serif;
  padding: 12px 16px 30px;
}

.pg-toast {
  position: fixed;
  top: 80px;
  right: 24px;
  padding: 11px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  z-index: 60;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.16);
}
.pg-toast-ok {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}
.pg-toast-err {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.pg-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.pg-hint {
  font-size: 11px;
  color: #6b5a8a;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.pg-create {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.pg-input {
  border: 1px solid #e5e2ec;
  border-radius: 8px;
  padding: 7px 10px;
  font-size: 13px;
  font-family: inherit;
  min-width: 220px;
  outline: none;
}
.pg-input:focus {
  border-color: #915bd8;
  box-shadow: 0 0 0 3px rgba(145, 91, 216, 0.12);
}
.pg-input-sm {
  min-width: 120px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 700;
}
.pg-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: none;
  border-radius: 8px;
  padding: 7px 12px;
  font-size: 12px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
}
.pg-btn-primary {
  background: #915bd8;
  color: #fff;
}
.pg-btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.pg-btn-ghost {
  background: #f4f1fa;
  color: #6b5a8a;
  border: 1px solid #e5e2ec;
}

.pg-state {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #6b5a8a;
  font-size: 13px;
  padding: 40px;
  justify-content: center;
}
.pg-state-empty {
  flex-direction: column;
}

.pg-board {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  overflow-x: auto;
  padding-bottom: 10px;
}
.pg-col {
  flex: 0 0 270px;
  background: #fff;
  border: 1px solid #ece7f2;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 200px);
}
.pg-col-pool {
  background: #faf8fe;
  border-style: dashed;
}
.pg-col-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid #ece7f2;
}
.pg-col-title {
  font-size: 13px;
  font-weight: 800;
  color: #2c2039;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}
.pg-col-title .pi {
  color: #915bd8;
  font-size: 13px;
}
.pg-col-count {
  background: #ede9fe;
  color: #6d28d9;
  border-radius: 9px;
  padding: 0 8px;
  font-size: 11px;
  font-weight: 800;
}
.pg-col-actions {
  display: inline-flex;
  gap: 2px;
}
.pg-icon-btn {
  width: 24px;
  height: 24px;
  border: 1px solid #e5e2ec;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
  color: #6b5a8a;
  font-size: 11px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.pg-icon-btn:hover {
  background: #f4f1fa;
  color: #2c2039;
}
.pg-icon-del:hover {
  background: #fee2e2;
  color: #dc2626;
  border-color: #fecaca;
}

.pg-col-body {
  padding: 8px;
  overflow-y: auto;
  min-height: 60px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.pg-card {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border: 1px solid #e9d5ff;
  border-radius: 9px;
  padding: 8px 10px;
  cursor: grab;
  transition:
    box-shadow 0.12s,
    border-color 0.12s;
}
.pg-card:hover {
  border-color: #915bd8;
  box-shadow: 0 2px 8px rgba(145, 91, 216, 0.15);
}
.pg-card:active {
  cursor: grabbing;
}
.pg-card-pool {
  border-color: #e5e2ec;
}
.pg-card-ico {
  color: #f59e0b;
  font-size: 13px;
}
.pg-card-info {
  min-width: 0;
}
.pg-card-nombre {
  font-size: 12px;
  font-weight: 700;
  color: #2c2039;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pg-card-sub {
  font-size: 10px;
  color: #9ca3af;
}
.pg-empty {
  font-size: 11px;
  color: #a89ec0;
  text-align: center;
  padding: 14px 8px;
}
.pg-drop-hint {
  border: 1px dashed #dad3ea;
  border-radius: 8px;
}
/* clase de vuedraggable mientras se arrastra */
.sortable-ghost {
  opacity: 0.5;
  background: #f3e8ff;
}
</style>
