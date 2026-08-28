<template>
  <!--
    Editar nombre, descripción y rango del trimestre (spec §7.3).
    El PATCH lo hace la vista orquestadora; aquí solo se arma el payload y se
    muestran `guardando` y el `detail` del backend bajo el campo que lo provocó.
  -->
  <Dialog
    :visible="visible"
    modal
    :draggable="false"
    class="w-full max-w-md"
    header="Editar trimestre"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="space-y-3">
      <div>
        <label class="rq-field-label" for="rq-t-nombre">Nombre</label>
        <InputText id="rq-t-nombre" v-model="f.nombre" class="w-full" placeholder="Retos Q3 2026" />
      </div>

      <div>
        <label class="rq-field-label" for="rq-t-desc">Descripción</label>
        <Textarea
          id="rq-t-desc"
          v-model="f.descripcion"
          class="w-full"
          rows="2"
          autoResize
          placeholder="Opcional: en qué se enfoca el trimestre"
        />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="rq-field-label" for="rq-t-ini">Inicio</label>
          <DatePicker
            id="rq-t-ini"
            v-model="f.fechaInicio"
            dateFormat="dd/mm/yy"
            showIcon
            class="w-full"
          />
          <p v-if="errorInicio" class="rq-error-campo">{{ errorInicio }}</p>
        </div>
        <div>
          <label class="rq-field-label" for="rq-t-fin">Fin</label>
          <DatePicker
            id="rq-t-fin"
            v-model="f.fechaFin"
            dateFormat="dd/mm/yy"
            showIcon
            class="w-full"
          />
          <p v-if="errorFin" class="rq-error-campo">{{ errorFin }}</p>
        </div>
      </div>

      <p v-if="vistaPrevia" class="rq-preview">{{ vistaPrevia }}</p>

      <p v-if="avisoValores" class="rq-aviso">
        <i class="pi pi-exclamation-triangle" />
        <span>
          Los valores que queden fuera del nuevo rango dejan de mostrarse. No se borran: vuelven a
          aparecer si restauras las fechas.
        </span>
      </p>
    </div>

    <template #footer>
      <Button
        label="Cancelar"
        severity="secondary"
        text
        size="small"
        @click="emit('update:visible', false)"
      />
      <Button
        label="Guardar"
        icon="pi pi-check"
        size="small"
        :loading="guardando"
        :disabled="guardando || !!errorLocal || !f.fechaInicio || !f.fechaFin"
        @click="enviar"
      />
    </template>
  </Dialog>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import DatePicker from 'primevue/datepicker'

const props = defineProps({
  visible: { type: Boolean, default: false },
  /** RetoDetalle actual. */
  reto: { type: Object, default: null },
  guardando: { type: Boolean, default: false },
  /** `detail` del backend tras un 400/409, ya normalizado a texto. */
  errorApi: { type: String, default: '' },
})

const emit = defineEmits(['update:visible', 'submit'])

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

const f = reactive({ nombre: '', descripcion: '', fechaInicio: null, fechaFin: null })

/**
 * `new Date('2026-07-01')` se interpreta como UTC y en Colombia cae el 30 de
 * junio. Por eso se parsea y se serializa por componentes, siempre en local.
 */
function isoADate(iso) {
  if (!iso) return null
  const [a, m, d] = String(iso).split('-').map(Number)
  if (!a || !m || !d) return null
  return new Date(a, m - 1, d)
}

function dateAIso(d) {
  if (!d) return null
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

watch(
  () => props.visible,
  (abierto) => {
    if (!abierto || !props.reto) return
    Object.assign(f, {
      nombre: props.reto.nombre || '',
      descripcion: props.reto.descripcion || '',
      fechaInicio: isoADate(props.reto.fecha_inicio),
      fechaFin: isoADate(props.reto.fecha_fin),
    })
  },
  { immediate: true },
)

/** Misma generación de semanas del contrato §3, para la vista previa. */
function semanasDe(inicio, fin) {
  const out = []
  const cursor = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate())
  cursor.setDate(cursor.getDate() - ((cursor.getDay() + 6) % 7)) // lunes de esa semana
  let numero = 1
  while (cursor <= fin && numero <= 60) {
    const finSemana = new Date(cursor)
    finSemana.setDate(finSemana.getDate() + 6)
    out.push({ numero, inicio: new Date(cursor), fin: finSemana })
    cursor.setDate(cursor.getDate() + 7)
    numero += 1
  }
  return out
}

const semanas = computed(() => {
  if (!f.fechaInicio || !f.fechaFin) return []
  if (f.fechaFin <= f.fechaInicio) return []
  return semanasDe(f.fechaInicio, f.fechaFin)
})

function fechaLarga(d) {
  return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`
}

const vistaPrevia = computed(() => {
  const s = semanas.value
  if (!s.length) return ''
  const primera = s[0]
  const ultima = s[s.length - 1]
  return (
    `${s.length} ${s.length === 1 ? 'semana' : 'semanas'}. La S1 empieza el ${fechaLarga(primera.inicio)}` +
    ` y la S${ultima.numero} termina el ${fechaLarga(ultima.fin)}.`
  )
})

/** Se anticipan los dos 400 del contrato para no gastar un viaje al servidor. */
const errorLocal = computed(() => {
  if (!f.fechaInicio || !f.fechaFin) return ''
  if (f.fechaFin <= f.fechaInicio) return 'La fecha de fin debe ser posterior a la de inicio'
  if (semanas.value.length >= 60) return 'El rango no puede superar 60 semanas'
  return ''
})

const errorMostrado = computed(() => errorLocal.value || props.errorApi || '')

/** El detail cae bajo el campo que lo provocó; los dos del contrato hablan del fin. */
const esErrorDeInicio = computed(() => {
  const t = errorMostrado.value.toLowerCase()
  return t.includes('inicio') && !t.includes('fin')
})

const errorInicio = computed(() => (esErrorDeInicio.value ? errorMostrado.value : ''))
const errorFin = computed(() => (esErrorDeInicio.value ? '' : errorMostrado.value))

const fechasCambiaron = computed(() => {
  if (!props.reto) return false
  return (
    dateAIso(f.fechaInicio) !== props.reto.fecha_inicio ||
    dateAIso(f.fechaFin) !== props.reto.fecha_fin
  )
})

const avisoValores = computed(
  () => fechasCambiaron.value && (props.reto?.semanas_con_datos ?? 0) > 0,
)

function limpio(txt) {
  const t = String(txt ?? '').trim()
  return t === '' ? null : t
}

function enviar() {
  if (errorLocal.value) return
  emit('submit', {
    nombre: limpio(f.nombre),
    descripcion: limpio(f.descripcion),
    fecha_inicio: dateAIso(f.fechaInicio),
    fecha_fin: dateAIso(f.fechaFin),
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

.rq-error-campo {
  font-size: 10px;
  color: #b0364a;
  margin-top: 3px;
}

.rq-preview {
  background: rgba(145, 91, 216, 0.06);
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 11px;
  color: #6b5a8a;
  line-height: 1.5;
}

.rq-aviso {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  background: rgba(202, 138, 4, 0.1);
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 11px;
  color: #a16207;
  line-height: 1.5;
}
.rq-aviso .pi {
  font-size: 10px;
  margin-top: 2px;
  flex: none;
}
</style>
