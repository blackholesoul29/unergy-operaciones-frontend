<template>
  <!--
    Copiar la definición de métricas desde otro trimestre (spec §7.2).
    El diálogo solo elige el origen; el POST lo hace la vista orquestadora.
  -->
  <Dialog
    :visible="visible"
    modal
    :draggable="false"
    class="w-full max-w-md"
    header="Copiar métricas"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="space-y-3">
      <div>
        <label class="rq-field-label" for="rq-copiar-origen">Trimestre de origen</label>
        <Select
          id="rq-copiar-origen"
          v-model="origenId"
          :options="opciones"
          optionLabel="label"
          optionValue="id"
          optionDisabled="deshabilitada"
          class="w-full"
          placeholder="Elige el trimestre de origen"
          :emptyMessage="'No hay otros trimestres en este año'"
        />
      </div>

      <div v-if="origen" class="rq-chips">
        <span
          v-for="m in metricasOrigen"
          :key="m.id"
          class="rq-chip-metrica"
          :class="{ 'rq-chip-repetida': yaExiste(m.nombre) }"
        >{{ m.nombre }}</span>
      </div>
      <p v-if="origen && hayRepetidas" class="rq-leyenda">Ya existe en este trimestre</p>

      <p class="rq-nota">
        Se copian solo las métricas activas, sin los valores semanales.
        Las métricas con un nombre que ya existe aquí no se duplican.
      </p>
    </div>

    <template #footer>
      <Button label="Cancelar" severity="secondary" text size="small" @click="emit('update:visible', false)" />
      <Button
        label="Copiar métricas"
        icon="pi pi-copy"
        size="small"
        :disabled="!origenId || guardando"
        :loading="guardando"
        @click="emit('submit', origenId)"
      />
    </template>
  </Dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Select from 'primevue/select'

const props = defineProps({
  visible: { type: Boolean, default: false },
  /** RetoResumen de los otros trimestres del año (el actual ya viene filtrado). */
  retos: { type: Array, default: () => [] },
  /** Nombres de las métricas que ya existen en el trimestre destino. */
  nombresDestino: { type: Array, default: () => [] },
  guardando: { type: Boolean, default: false },
})

const emit = defineEmits(['update:visible', 'submit'])

const origenId = ref(null)

watch(
  () => props.visible,
  (abierto) => { if (abierto) origenId.value = null },
)

const opciones = computed(() =>
  props.retos.map((r) => {
    const n = r.total_metricas ?? (r.metricas || []).length
    return {
      id: r.id,
      label: `${r.nombre || `Retos Q${r.trimestre} ${r.anio}`} · ${n} ${n === 1 ? 'métrica' : 'métricas'}`,
      deshabilitada: n === 0,
    }
  }),
)

const origen = computed(() => props.retos.find(r => r.id === origenId.value) || null)

const metricasOrigen = computed(() =>
  (origen.value?.metricas || [])
    .filter(m => m.activa !== false)
    .slice()
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)),
)

/** Comparación laxa: el backend deduplica por nombre, aquí solo se anticipa. */
const setDestino = computed(
  () => new Set(props.nombresDestino.map(n => String(n || '').trim().toLowerCase())),
)

function yaExiste(nombre) {
  return setDestino.value.has(String(nombre || '').trim().toLowerCase())
}

const hayRepetidas = computed(() => metricasOrigen.value.some(m => yaExiste(m.nombre)))
</script>

<style scoped>
.rq-field-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 4px;
  color: #6b5a8a;
}

.rq-chips { display: flex; flex-wrap: wrap; gap: 5px; }

.rq-chip-metrica {
  font-size: 10px; font-weight: 600;
  background: #f0ebfd; color: #915BD8;
  padding: 1px 7px; border-radius: 999px;
}
.rq-chip-repetida {
  color: #c7bdd8;
  background: rgba(44, 32, 57, .04);
  text-decoration: line-through;
}

.rq-leyenda { font-size: 10px; color: #c7bdd8; margin-top: -4px; }

.rq-nota { font-size: 11px; color: #6b5a8a; line-height: 1.5; }
</style>
