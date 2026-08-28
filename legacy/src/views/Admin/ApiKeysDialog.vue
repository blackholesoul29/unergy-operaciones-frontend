<template>
  <Dialog v-model:visible="visible" header="API Keys" modal class="w-full max-w-2xl" @hide="onHide">
    <div v-if="usuario" class="space-y-4">
      <div class="rounded-lg bg-gray-50 p-3 text-sm">
        <span class="font-medium">{{ usuario.nombre }}</span>
        <span class="ml-2 text-gray-500">{{ usuario.email }}</span>
      </div>

      <!-- New key revealed (only once) -->
      <div v-if="newKey" class="space-y-2 rounded-lg border border-green-200 bg-green-50 p-4">
        <div class="flex items-center gap-2 text-sm font-medium text-green-800">
          <i class="pi pi-check-circle" />
          API Key creada — copia ahora, no se mostrará de nuevo
        </div>
        <div class="flex items-center gap-2">
          <code
            class="flex-1 rounded border bg-white px-3 py-2 font-mono text-xs break-all select-all"
            >{{ newKey }}</code
          >
          <Button
            icon="pi pi-copy"
            text
            rounded
            size="small"
            v-tooltip.top="'Copiar'"
            @click="copyKey"
          />
        </div>
        <div class="mt-2 space-y-1 text-xs text-gray-500">
          <p>
            <strong>Uso:</strong> Enviar en header
            <code class="rounded bg-gray-100 px-1">X-API-Key: {{ newKey }}</code>
          </p>
          <p>
            <strong>Base URL:</strong>
            <code class="rounded bg-gray-100 px-1">{{ baseUrl }}/api/v1</code>
          </p>
        </div>
        <div
          class="mt-1 flex items-start gap-2 rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700"
        >
          <i class="pi pi-shield mt-0.5" />
          <span>
            Trata esta key como una contraseña: concede el rol del usuario. Guárdala en un gestor de
            secretos, nunca en el código ni en repositorios, y revócala desde aquí si se expone.
          </span>
        </div>
      </div>

      <!-- Create new key form -->
      <div class="flex items-end gap-2">
        <div class="flex-1">
          <label class="mb-1 block text-xs font-medium text-gray-600">Nombre de la API Key</label>
          <InputText v-model="newKeyName" placeholder="ej: Integración Power BI" class="w-full" />
        </div>
        <Button
          label="Generar"
          icon="pi pi-key"
          :loading="creating"
          @click="createKey"
          :disabled="!newKeyName.trim()"
        />
      </div>

      <!-- Existing keys -->
      <div v-if="keys.length > 0" class="space-y-2">
        <h4 class="text-sm font-medium text-gray-700">Keys existentes</h4>
        <div
          v-for="k in keys"
          :key="k.id"
          class="flex items-center gap-3 rounded-lg border bg-white px-4 py-3"
        >
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium">{{ k.nombre }}</span>
              <Tag
                :value="k.activo ? 'Activa' : 'Inactiva'"
                :severity="k.activo ? 'success' : 'danger'"
                class="text-xs"
              />
            </div>
            <div class="mt-1 text-xs text-gray-400">
              <code>{{ k.key_prefix }}...</code>
              <span class="mx-1">·</span>
              Creada {{ formatDate(k.created_at) }}
              <template v-if="k.ultimo_uso">
                <span class="mx-1">·</span>
                Último uso {{ formatDate(k.ultimo_uso) }}
              </template>
            </div>
          </div>
          <Button
            :icon="k.activo ? 'pi pi-pause' : 'pi pi-play'"
            text
            rounded
            size="small"
            v-tooltip.top="k.activo ? 'Desactivar' : 'Activar'"
            @click="toggleKey(k)"
          />
          <Button
            icon="pi pi-trash"
            text
            rounded
            size="small"
            severity="danger"
            v-tooltip.top="'Eliminar'"
            @click="confirmDelete(k)"
          />
        </div>
      </div>
      <div v-else-if="!loadingKeys" class="py-4 text-center text-sm text-gray-400">
        Este usuario no tiene API Keys
      </div>

      <!-- Usage info -->
      <Divider />
      <div class="space-y-2 text-xs text-gray-500">
        <p class="font-medium text-gray-700">Ejemplo de uso:</p>
        <pre class="overflow-x-auto rounded bg-gray-50 p-3"><code>curl -H "X-API-Key: uop_xxxx..." \
  {{ baseUrl }}/api/v1/proyectos</code></pre>
        <p>
          La API Key hereda el rol y permisos del usuario seleccionado. Todos los endpoints de la
          plataforma están disponibles.
        </p>
      </div>
    </div>
  </Dialog>

  <Dialog
    v-model:visible="deleteConfirmVisible"
    header="Eliminar API Key"
    modal
    class="w-full max-w-sm"
  >
    <p class="text-sm">
      ¿Eliminar la key <strong>{{ deletingKey?.nombre }}</strong
      >? Cualquier integración que la use dejará de funcionar inmediatamente.
    </p>
    <template #footer>
      <Button label="Cancelar" severity="secondary" @click="deleteConfirmVisible = false" />
      <Button label="Eliminar" severity="danger" :loading="deleting" @click="doDelete" />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'
import { useToast } from 'primevue/usetoast'
import api from '@/api/client'

const props = defineProps({ usuario: Object })
const visible = defineModel('visible', { type: Boolean })
const toast = useToast()

const keys = ref([])
const loadingKeys = ref(false)
const creating = ref(false)
const newKeyName = ref('')
const newKey = ref(null)
const deleteConfirmVisible = ref(false)
const deletingKey = ref(null)
const deleting = ref(false)

const baseUrl = window.location.origin

watch(visible, async (v) => {
  if (v && props.usuario) {
    newKey.value = null
    newKeyName.value = ''
    await loadKeys()
  }
})

async function loadKeys() {
  loadingKeys.value = true
  try {
    const { data } = await api.get(`/api-keys/user/${props.usuario.id}`)
    keys.value = data
  } catch {
    keys.value = []
  } finally {
    loadingKeys.value = false
  }
}

async function createKey() {
  creating.value = true
  try {
    const { data } = await api.post('/api-keys', {
      usuario_id: props.usuario.id,
      nombre: newKeyName.value.trim(),
    })
    newKey.value = data.api_key
    newKeyName.value = ''
    toast.add({ severity: 'success', summary: 'API Key creada', life: 3000 })
    await loadKeys()
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: e.response?.data?.detail || 'Error al crear',
      life: 4000,
    })
  } finally {
    creating.value = false
  }
}

async function toggleKey(k) {
  try {
    const { data } = await api.patch(`/api-keys/${k.id}/toggle`)
    k.activo = data.activo
    toast.add({
      severity: 'info',
      summary: data.activo ? 'Key activada' : 'Key desactivada',
      life: 2000,
    })
  } catch {
    toast.add({ severity: 'error', summary: 'Error al cambiar estado', life: 3000 })
  }
}

function confirmDelete(k) {
  deletingKey.value = k
  deleteConfirmVisible.value = true
}

async function doDelete() {
  deleting.value = true
  try {
    await api.delete(`/api-keys/${deletingKey.value.id}`)
    deleteConfirmVisible.value = false
    toast.add({ severity: 'success', summary: 'Key eliminada', life: 3000 })
    await loadKeys()
  } catch {
    toast.add({ severity: 'error', summary: 'Error al eliminar', life: 3000 })
  } finally {
    deleting.value = false
  }
}

function copyKey() {
  navigator.clipboard.writeText(newKey.value)
  toast.add({ severity: 'info', summary: 'Copiado al portapapeles', life: 2000 })
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function onHide() {
  newKey.value = null
}
</script>
