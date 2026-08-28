<template>
  <div class="ev-wrap">
    <div v-if="modelValue?.length" class="ev-list">
      <div v-for="archivo in modelValue" :key="archivo.id" class="ev-chip">
        <i :class="iconoPara(archivo.tipo_mime)" />
        <a
          :href="archivo.url"
          target="_blank"
          rel="noopener"
          class="ev-chip-name"
          :title="archivo.nombre"
        >
          {{ archivo.nombre }}
        </a>
        <button
          class="ev-chip-del"
          title="Quitar"
          :disabled="eliminando === archivo.id"
          @click="eliminar(archivo.id)"
        >
          <i :class="eliminando === archivo.id ? 'pi pi-spin pi-spinner' : 'pi pi-times'" />
        </button>
      </div>
    </div>

    <label class="ev-upload" :class="{ 'ev-upload--busy': subiendo }">
      <i :class="subiendo ? 'pi pi-spin pi-spinner' : 'pi pi-paperclip'" />
      {{ subiendo ? 'Subiendo…' : modelValue?.length ? 'Agregar otro archivo' : 'Subir evidencia' }}
      <input
        type="file"
        class="ev-input"
        accept=".pdf,.jpg,.jpeg,.png,.webp,.heic"
        :disabled="subiendo"
        @change="subir"
      />
    </label>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '@/api/client'

const props = defineProps({
  proyectoId: { type: [Number, String], required: true },
  seccion: { type: String, required: true },
  modelValue: { type: Array, default: () => [] },
  basePath: { type: String, default: 'inicio-operacion' },
})
const emit = defineEmits(['update:modelValue', 'error'])

const subiendo = ref(false)
const eliminando = ref(null)

function iconoPara(mime) {
  if (mime?.startsWith('image/')) return 'pi pi-image'
  return 'pi pi-file'
}

async function subir(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  subiendo.value = true
  const fd = new FormData()
  fd.append('archivo', file)
  try {
    const { data } = await api.post(
      `/${props.basePath}/${props.proyectoId}/archivos/${props.seccion}`,
      fd,
    )
    emit('update:modelValue', [...(props.modelValue || []), data])
  } catch (e) {
    emit('error', e?.response?.data?.detail || 'No se pudo subir el archivo')
  } finally {
    subiendo.value = false
  }
}

async function eliminar(archivoId) {
  eliminando.value = archivoId
  try {
    await api.delete(
      `/${props.basePath}/${props.proyectoId}/archivos/${props.seccion}/${archivoId}`,
    )
    emit(
      'update:modelValue',
      (props.modelValue || []).filter((a) => a.id !== archivoId),
    )
  } catch (e) {
    emit('error', e?.response?.data?.detail || 'No se pudo eliminar el archivo')
  } finally {
    eliminando.value = null
  }
}
</script>

<style scoped>
.ev-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ev-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.ev-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f5f3fa;
  border: 1px solid #e8e0f0;
  border-radius: 8px;
  padding: 5px 6px 5px 10px;
  font-size: 12.5px;
  color: #2c2039;
  max-width: 220px;
}
.ev-chip .pi {
  color: #915bd8;
  font-size: 12px;
  flex-shrink: 0;
}
.ev-chip-name {
  color: #2c2039;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ev-chip-name:hover {
  text-decoration: underline;
  color: #6e3fb8;
}
.ev-chip-del {
  border: none;
  background: none;
  color: #9ca3af;
  width: 20px;
  height: 20px;
  border-radius: 5px;
  cursor: pointer;
  flex-shrink: 0;
}
.ev-chip-del:hover {
  background: #fee2e2;
  color: #b91c1c;
}
.ev-chip-del:disabled {
  opacity: 0.6;
  cursor: default;
}

.ev-upload {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  width: fit-content;
  border: 1.5px dashed #cbb8e8;
  background: #faf8fd;
  color: #6e3fb8;
  font-size: 12.5px;
  font-weight: 700;
  padding: 7px 12px;
  border-radius: 9px;
  cursor: pointer;
}
.ev-upload:hover {
  background: #f3edfb;
}
.ev-upload--busy {
  opacity: 0.7;
  cursor: default;
}
.ev-input {
  display: none;
}
</style>
