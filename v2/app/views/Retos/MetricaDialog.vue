<template>
  <!--
    Crear / editar una métrica (spec §7.1).
    El diálogo NO llama a la API: emite `submit` con el payload del contrato y
    la vista orquestadora hace el POST/PATCH. `guardando` viene de vuelta.
  -->
  <Dialog
    :visible="visible"
    modal
    :draggable="false"
    class="w-full max-w-lg"
    :header="esEdicion ? 'Editar métrica' : 'Nueva métrica'"
    @update:visible="cerrar($event)"
  >
    <div class="space-y-3">
      <div>
        <label class="rq-field-label" for="rq-m-nombre">Nombre</label>
        <InputText
          id="rq-m-nombre"
          v-model="f.nombre"
          class="w-full"
          :class="{ 'rq-invalido': tocado && !nombreValido }"
          placeholder="MWh comercializados"
          autofocus
          @blur="tocado = true"
        />
        <p v-if="tocado && !nombreValido" class="rq-error-campo">El nombre es obligatorio.</p>
      </div>

      <div>
        <label class="rq-field-label" for="rq-m-desc">Descripción</label>
        <Textarea
          id="rq-m-desc"
          v-model="f.descripcion"
          class="w-full"
          rows="2"
          autoResize
          placeholder="Opcional: cómo se mide y de dónde sale el dato"
        />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="rq-field-label" for="rq-m-unidad">Unidad</label>
          <Select
            id="rq-m-unidad"
            v-model="f.unidad"
            :options="UNIDADES"
            editable
            class="w-full"
            placeholder="Sin unidad"
          />
        </div>
        <div>
          <label class="rq-field-label" for="rq-m-meta">Meta del trimestre</label>
          <InputNumber
            id="rq-m-meta"
            v-model="f.meta"
            class="w-full"
            locale="es-CO"
            :maxFractionDigits="4"
            placeholder="Opcional"
          />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="rq-field-label" for="rq-m-agg">Agregación</label>
          <Select
            id="rq-m-agg"
            v-model="f.tipo_agregacion"
            :options="TIPOS_AGREGACION"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
        </div>
        <div>
          <label class="rq-field-label">Dirección</label>
          <SelectButton
            v-model="f.direccion"
            :options="DIRECCIONES"
            optionLabel="label"
            optionValue="value"
            :allowEmpty="false"
            class="rq-dir"
          />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="rq-field-label" for="rq-m-dec">Decimales</label>
          <InputNumber
            id="rq-m-dec"
            v-model="f.decimales"
            showButtons
            :min="0"
            :max="4"
            class="w-24"
          />
        </div>
        <div>
          <label class="rq-field-label" for="rq-m-resp">Responsable</label>
          <InputText
            id="rq-m-resp"
            v-model="f.responsable"
            class="w-full"
            placeholder="Nombre de quien reporta"
          />
        </div>
      </div>

      <p class="rq-preview">{{ vistaPrevia }}</p>
    </div>

    <template #footer>
      <Button label="Cancelar" severity="secondary" text size="small" @click="cerrar(false)" />
      <Button
        :label="esEdicion ? 'Guardar cambios' : 'Crear métrica'"
        icon="pi pi-check"
        size="small"
        :loading="guardando"
        :disabled="!nombreValido || guardando"
        @click="enviar"
      />
    </template>
  </Dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import SelectButton from 'primevue/selectbutton'
import { TIPOS_AGREGACION, DIRECCIONES, fmtValor } from './retosUi'

const props = defineProps({
  visible: { type: Boolean, default: false },
  /** MetricaResumen a editar; `null` = creación. */
  metrica: { type: Object, default: null },
  totalSemanas: { type: Number, default: 0 },
  guardando: { type: Boolean, default: false },
})

const emit = defineEmits(['update:visible', 'submit'])

const UNIDADES = ['MWh', 'kWh', '%', '#', 'COP', 'h']

const VACIO = {
  nombre: '',
  descripcion: '',
  unidad: null,
  meta: null,
  tipo_agregacion: 'suma',
  direccion: 'mayor_mejor',
  decimales: 0,
  responsable: '',
}

const f = reactive({ ...VACIO })
const tocado = ref(false)

const esEdicion = computed(() => !!props.metrica)
const nombreValido = computed(() => !!String(f.nombre || '').trim())

watch(
  () => props.visible,
  (abierto) => {
    if (!abierto) return
    tocado.value = false
    const m = props.metrica
    Object.assign(f, {
      ...VACIO,
      ...(m
        ? {
            nombre: m.nombre || '',
            descripcion: m.descripcion || '',
            unidad: m.unidad || null,
            meta: m.meta === null || m.meta === undefined ? null : Number(m.meta),
            tipo_agregacion: m.tipo_agregacion || 'suma',
            direccion: m.direccion || 'mayor_mejor',
            decimales: m.decimales ?? 0,
            responsable: m.responsable || '',
          }
        : {}),
    })
  },
  { immediate: true },
)

/**
 * Explica en prosa qué va a calcular el tablero. Se omite la parte de la meta
 * cuando no hay meta, para no inventar cifras.
 */
const vistaPrevia = computed(() => {
  const dec = Number(f.decimales) || 0
  const unidad = (f.unidad || '').trim()
  const meta = f.meta === null || f.meta === undefined ? null : Number(f.meta)
  const total = props.totalSemanas || 0

  let base
  switch (f.tipo_agregacion) {
    case 'promedio':
      base = 'El consolidado será el promedio de las semanas con dato.'
      break
    case 'ultimo':
      base = 'El consolidado será el valor de la última semana con dato.'
      break
    case 'maximo':
      base = 'El consolidado será el valor más alto de las semanas.'
      break
    default:
      base = `El consolidado será la suma de las ${total} semanas.`
  }

  if (meta === null || !Number.isFinite(meta)) return base

  const metaTxt = fmtValor(meta, dec, unidad)
  if (f.tipo_agregacion === 'suma' && total > 0) {
    const porSemana = fmtValor(meta / total, Math.max(dec, 1), unidad)
    return `${base} Meta ${metaTxt}, equivalente a ${porSemana} por semana.`
  }
  return `${base} Meta ${metaTxt}.`
})

function cerrar(v) {
  if (v === false || v === undefined) emit('update:visible', false)
  else emit('update:visible', !!v)
}

function limpio(txt) {
  const t = String(txt ?? '').trim()
  return t === '' ? null : t
}

function enviar() {
  tocado.value = true
  if (!nombreValido.value) return
  emit('submit', {
    nombre: String(f.nombre).trim(),
    descripcion: limpio(f.descripcion),
    unidad: limpio(f.unidad),
    meta: f.meta === null || f.meta === undefined || f.meta === '' ? null : Number(f.meta),
    tipo_agregacion: f.tipo_agregacion,
    direccion: f.direccion,
    decimales: Math.min(Math.max(Number(f.decimales) || 0, 0), 4),
    responsable: limpio(f.responsable),
  })
}
</script>

<style scoped>
.rq-field-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 4px;
  color: #6b5a8a;
}

.rq-invalido :deep(input),
.rq-invalido { border-color: #D64455 !important; }

.rq-error-campo { font-size: 10px; color: #B0364A; margin-top: 3px; }

.rq-preview {
  background: rgba(145, 91, 216, .06);
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 11px;
  color: #6b5a8a;
  line-height: 1.5;
}

.rq-dir :deep(.p-togglebutton) { font-size: 11.5px; }
</style>
