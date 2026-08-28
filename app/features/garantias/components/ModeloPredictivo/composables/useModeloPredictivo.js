import { ref, computed } from 'vue'
import { ModeloPredictivoService } from '~/features/garantias/services/modelo-predictivo'
import { AGENTE, ESQUEMA, mensajeError } from '../utils/modeloPredictivo'

export function useModeloPredictivo() {
  const modeloApi = new ModeloPredictivoService()

  const agente = ref(AGENTE.UNGG)
  const esquema = ref(ESQUEMA.SEMANAL)
  const cuantil = ref(0.9)
  const horizonte = ref(4)

  const data = ref(null)
  const cargando = ref(false)
  const error = ref('')

  const detalle = ref(null)
  const detalleCargando = ref(false)
  const detalleAbierto = ref(false)
  const detalleError = ref('')

  const semanales = computed(() => data.value?.semanales ?? [])
  const mensuales = computed(() => data.value?.mensuales ?? [])

  async function cargar() {
    cargando.value = true
    error.value = ''
    try {
      data.value = await modeloApi.getPlan({
        agente: agente.value,
        esquema: esquema.value,
        cuantil: cuantil.value,
        horizonte: horizonte.value,
      })
    } catch (e) {
      error.value = mensajeError(e, 'El servicio no respondió. Puede que aún no esté publicado.')
      data.value = null
    } finally {
      cargando.value = false
    }
  }

  async function abrirDetalle(id) {
    detalleAbierto.value = true
    detalleCargando.value = true
    detalle.value = null
    detalleError.value = ''
    try {
      detalle.value = await modeloApi.getDetalle(id)
    } catch (e) {
      detalleError.value = mensajeError(e, 'El servicio no respondió. Puede que aún no esté publicado.')
      detalleAbierto.value = false
    } finally {
      detalleCargando.value = false
    }
  }

  function cerrarDetalle() {
    detalleAbierto.value = false
    detalle.value = null
  }

  return {
    agente, esquema, cuantil, horizonte,
    data, cargando, error,
    semanales, mensuales,
    detalle, detalleCargando, detalleAbierto, detalleError,
    cargar, abrirDetalle, cerrarDetalle,
  }
}
