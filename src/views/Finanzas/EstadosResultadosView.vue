<template>
  <div class="space-y-4">
    <PageHeader title="Estados de resultados"
                subtitle="Genera estados de resultados y el cruce de facturas por período">
      <template #actions>
        <Button label="Crear cruce facturas" icon="pi pi-file" size="small" outlined @click="abrirCrudo" />
        <Button label="Generar estado de resultados" icon="pi pi-chart-line" size="small" @click="abrirEstado" />
      </template>
    </PageHeader>

    <!-- Panel informativo -->
    <div class="bg-white rounded-xl shadow-sm border p-8 text-center" style="border-color:#ECE7F2">
      <i class="pi pi-chart-line text-3xl mb-3 block" style="color:#915BD8" />
      <p class="text-sm font-semibold text-gray-700">Generación de estados de resultados</p>
      <p class="text-xs text-gray-400 mt-1 max-w-md mx-auto">
        Usa los botones de arriba para generar el <b>estado de resultados</b> de un período
        (opcionalmente por proyecto) o el <b>cruce de facturas</b>. La generación se conectará
        a la API próximamente.
      </p>
    </div>

    <!-- Dialog: Generar estado de resultados -->
    <Dialog v-model:visible="estadoVisible" header="Generar estado de resultados" modal class="w-full max-w-md">
      <form @submit.prevent="generarEstado" class="space-y-4 pt-1">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="field-label">Mes</label>
            <InputNumber v-model="er.mes" :min="1" :max="12" :useGrouping="false" class="w-full" placeholder="1–12" />
          </div>
          <div>
            <label class="field-label">Año</label>
            <InputNumber v-model="er.anio" :useGrouping="false" class="w-full" placeholder="ej: 2026" />
          </div>
        </div>
        <div>
          <label class="field-label">Versión actual</label>
          <InputText v-model="er.version" class="w-full" placeholder="ej: TXF" />
        </div>
        <div>
          <label class="field-label">Proyecto <span class="text-gray-400 font-normal">(opcional)</span></label>
          <InputText v-model="er.proyecto" class="w-full" placeholder="Dejar vacío para todos" />
        </div>
        <div class="flex justify-end gap-2 pt-1">
          <Button type="button" label="Cancelar" severity="secondary" @click="estadoVisible = false" />
          <Button type="submit" label="Generar" icon="pi pi-check" />
        </div>
      </form>
    </Dialog>

    <!-- Dialog: Crear cruce facturas -->
    <Dialog v-model:visible="crudoVisible" header="Crear cruce facturas" modal class="w-full max-w-md">
      <form @submit.prevent="generarCrudo" class="space-y-4 pt-1">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="field-label">Mes</label>
            <InputNumber v-model="cr.mes" :min="1" :max="12" :useGrouping="false" class="w-full" placeholder="1–12" />
          </div>
          <div>
            <label class="field-label">Año</label>
            <InputNumber v-model="cr.anio" :useGrouping="false" class="w-full" placeholder="ej: 2026" />
          </div>
        </div>
        <div>
          <label class="field-label">Versión</label>
          <InputText v-model="cr.version" class="w-full" placeholder="ej: TXF" />
        </div>
        <div class="flex justify-end gap-2 pt-1">
          <Button type="button" label="Cancelar" severity="secondary" @click="crudoVisible = false" />
          <Button type="submit" label="Generar" icon="pi pi-check" />
        </div>
      </form>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { useToast } from 'primevue/usetoast'

const toast = useToast()

// ── Generar estado de resultados (mes, año, versión, proyecto opcional) ───────
const estadoVisible = ref(false)
const er = reactive({ mes: null, anio: null, version: '', proyecto: '' })

function abrirEstado() {
  Object.assign(er, { mes: null, anio: null, version: '', proyecto: '' })
  estadoVisible.value = true
}
function generarEstado() {
  if (er.mes == null || er.anio == null || !er.version) {
    toast.add({ severity: 'warn', summary: 'Faltan campos', detail: 'Completa mes, año y versión.', life: 4000 })
    return
  }
  toast.add({ severity: 'info', summary: 'Estado de resultados listo', detail: 'La generación se conectará a la API próximamente.', life: 4500 })
  estadoVisible.value = false
}

// ── Generar crudo de facturas (mes, año, versión) ─────────────────────────────
const crudoVisible = ref(false)
const cr = reactive({ mes: null, anio: null, version: '' })

function abrirCrudo() {
  Object.assign(cr, { mes: null, anio: null, version: '' })
  crudoVisible.value = true
}
function generarCrudo() {
  if (cr.mes == null || cr.anio == null || !cr.version) {
    toast.add({ severity: 'warn', summary: 'Faltan campos', detail: 'Completa mes, año y versión.', life: 4000 })
    return
  }
  toast.add({ severity: 'info', summary: 'Cruce de facturas listo', detail: 'La generación se conectará a la API próximamente.', life: 4500 })
  crudoVisible.value = false
}
</script>

<style scoped>
.field-label { @apply block text-xs font-medium text-gray-600 mb-1; }
</style>
