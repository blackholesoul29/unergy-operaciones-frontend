/**
 * Cliente del proxy a la API de Liquidaciones de Unergy.
 *
 * El navegador nunca habla con api.unergy.io: las credenciales de la cuenta de
 * servicio viven solo en el backend, que expone estas rutas bajo
 * `/liquidaciones-api`.
 */
import api from '~/api/client'

/** Versión del ciclo: `txf` es la liquidación inicial; `tx3`…`tx8`, reliquidaciones de XM. */
export const VERSIONES = ['txf', 'tx3', 'tx4', 'tx5', 'tx6', 'tx7', 'tx8']
export const VERSION_INICIAL = 'txf'

/** Estado normalizado de una tarea asíncrona (lo unifica el backend). */
export const EstadoTarea = Object.freeze({
  EN_CURSO: 'en_curso',
  EXITO: 'exito',
  FALLO: 'fallo',
})

/** Límites que impone la API al subir facturas. */
export const MAX_FACTURAS_POR_LOTE = 20
export const MAX_MB_POR_FACTURA = 10

export class TareaFallida extends Error {}
export class TareaSinRespuesta extends Error {}

const dormir = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * Sondea una tarea del ciclo hasta que termina.
 *
 * Hay dos trampas de la API que este helper absorbe para que ninguna vista las
 * repita:
 *
 *  - `status: SUCCESS` no significa que salió bien; varias tareas devuelven
 *    `result.success = false`. El backend ya colapsa eso en `estado: 'fallo'`.
 *  - un `task_id` que no existe responde «en curso» para siempre, así que el
 *    límite de tiempo lo tiene que poner quien sondea. De ahí `timeoutMs`.
 *
 * @returns {Promise<object>} el `resultado` crudo de la tarea (trae, por
 *          ejemplo, la `drive_url` de los archivos que se generan).
 * @throws {TareaFallida} si la tarea terminó mal.
 * @throws {TareaSinRespuesta} si se agotó el tiempo de espera.
 */
export async function esperarTarea(taskId, { timeoutMs = 30 * 60 * 1000, intervaloMs = 5000, onEstado } = {}) {
  if (!taskId) throw new TareaSinRespuesta('La API no devolvió un identificador de tarea.')

  const limite = Date.now() + timeoutMs
  while (Date.now() < limite) {
    const { data } = await api.get(`/liquidaciones-api/tareas/${taskId}`)
    onEstado?.(data)
    if (data.estado === EstadoTarea.EXITO) return data.resultado || {}
    if (data.estado === EstadoTarea.FALLO) throw new TareaFallida(data.mensaje)
    await dormir(intervaloMs)
  }
  throw new TareaSinRespuesta(
    'La tarea no respondió a tiempo. Puede seguir corriendo: vuelve a consultar en unos minutos.',
  )
}

/** Facturas de XM del período, con su bloque de alistamiento. */
export async function listarFacturasXm(filtros = {}) {
  const { data } = await api.get('/liquidaciones-api/facturas-xm', { params: filtros })
  return data
}

/**
 * Sube un lote de facturas en PDF. El mes y el año los extrae la IA del PDF.
 * @returns {Promise<{task_id: string, invoice_ids: number[], files_queued: number}>}
 */
export async function subirFacturasXm(archivos, version = VERSION_INICIAL, { onProgreso } = {}) {
  const fd = new FormData()
  for (const f of archivos) fd.append('files', f)
  fd.append('version', version)

  const { data } = await api.post('/liquidaciones-api/facturas-xm', fd, {
    onUploadProgress: onProgreso
      ? (ev) => onProgreso(ev.total ? Math.round((ev.loaded / ev.total) * 100) : 0)
      : undefined,
  })
  return data
}

// ── Catálogos ────────────────────────────────────────────────────────────────
/** Empresas, precios de energía y tipos de costo. Son datos fijos: se consultan. */
export async function listarCatalogos() {
  const { data } = await api.get('/liquidaciones-api/catalogos')
  return data
}

// ── Despachos liquidados ─────────────────────────────────────────────────────
export async function listarDespachos({ month, year, version = VERSION_INICIAL }) {
  const { data } = await api.get('/liquidaciones-api/despachos', { params: { month, year, version } })
  return data
}

// ── Costos e ingresos fijos ──────────────────────────────────────────────────
export async function listarCostos(filtros = {}) {
  const { data } = await api.get('/liquidaciones-api/costos', { params: filtros })
  return data
}

// ── Contratos de energía ─────────────────────────────────────────────────────
export const TIPOS_CONTRATO = [
  { value: 'ppa_pay_as_generated', label: 'PLG · pago por generado' },
  { value: 'ppa_pay_as_contracted', label: 'PLC · pago por contratado' },
  { value: 'no_contract', label: 'Sin contrato' },
]
export const TIPOS_TARIFA = [
  { value: 'ppa', label: 'PPA' },
  { value: 'market', label: 'Bolsa' },
  { value: 'market_plus_benefits', label: 'Bolsa + beneficios' },
]

export async function listarContratosEnergia() {
  const { data } = await api.get('/liquidaciones-api/contratos-energia')
  return data
}

export async function crearContratoEnergia(payload) {
  const { data } = await api.post('/liquidaciones-api/contratos-energia', payload)
  return data
}

// ── Acciones del ciclo ───────────────────────────────────────────────────────
// Orden obligatorio: liquidar → repartir → estado de resultados → cruce.
// IPP, FTP y facturas son independientes entre sí.

/** IPP del DANE. Síncrono: devuelve el valor, no una tarea. */
export async function consultarIpp({ month, year }) {
  const { data } = await api.post('/liquidaciones-api/ciclo/ipp', { month, year })
  return data.ipp
}

/** Lanza una acción asíncrona del ciclo y espera a que termine. */
async function lanzarYEsperar(ruta, cuerpo, opciones) {
  const { data } = await api.post(`/liquidaciones-api/ciclo/${ruta}`, cuerpo)
  return esperarTarea(data.task_id, opciones)
}

export const descargarArchivosXm = (p, o) => lanzarYEsperar('ftp', p, o)
export const liquidarContratos = (p, o) => lanzarYEsperar('liquidar', p, o)
export const repartirFacturasXm = (p, o) => lanzarYEsperar('repartir', p, o)
export const generarEstadoResultados = (p, o) => lanzarYEsperar('estado-resultados', p, o)
export const generarCruceFacturas = (p, o) => lanzarYEsperar('cruce-facturas', p, o)

/** Por qué un proyecto no sale en el estado de resultados. Síncrono. */
export async function diagnosticarProyecto({ project, month, year, version = VERSION_INICIAL }) {
  const { data } = await api.post('/liquidaciones-api/ciclo/diagnostico', { project, month, year, version })
  return data
}

/** Carga masiva de costos e ingresos fijos desde un Excel. Un archivo por llamada. */
export async function subirExcelCostos(archivo, { onProgreso } = {}) {
  const fd = new FormData()
  fd.append('file', archivo)
  const { data } = await api.post('/liquidaciones-api/costos/excel', fd, {
    onUploadProgress: onProgreso
      ? (ev) => onProgreso(ev.total ? Math.round((ev.loaded / ev.total) * 100) : 0)
      : undefined,
  })
  return data
}
