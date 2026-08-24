/**
 * Validación de contratos ASIC: solapamiento, atribución y unicidad.
 *
 * Portada a Vitest en la Fase 0 de la migración (antes:
 * `validacionContratos.test.mjs`, evaluando el fuente con `new Function`).
 */
import { describe, expect, it } from 'vitest'
import {
  checkDateOverlap,
  conflictosAtribucion,
  finEfectivoIso,
  findReplacementContract,
  toIsoDate,
  validateContractUniqueness,
} from './validacionContratos.js'

describe('toIsoDate', () => {
  it('recorta un string ISO y usa componentes locales para un Date', () => {
    expect(toIsoDate('2026-01-05T12:00:00')).toBe('2026-01-05')
    // Con componentes UTC este caso se corría un día según la zona horaria.
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(toIsoDate(null)).toBeNull()
  })
})

describe('checkDateOverlap', () => {
  const base = [{ id: 1, fecha_inicio: '2026-01-01', fecha_fin: '2026-06-30' }]

  it('no ve cruce entre rangos disjuntos', () => {
    expect(checkDateOverlap('2026-07-01', '2026-12-31', base)).toHaveLength(0)
  })

  it('trata los bordes como inclusivos', () => {
    expect(checkDateOverlap('2026-06-30', '2026-12-31', base)).toHaveLength(1)
    expect(checkDateOverlap('2026-01-01', '2026-06-30', base)).toHaveLength(1)
  })

  it('detecta cruce parcial y cruce total', () => {
    expect(checkDateOverlap('2026-05-01', '2026-08-01', base)).toHaveLength(1)
    expect(checkDateOverlap('2025-01-01', '2027-01-01', base)).toHaveLength(1)
  })

  it('trata una fecha fin abierta como vigencia infinita', () => {
    const abierto = [{ id: 9, fecha_inicio: '2020-01-01', fecha_fin: null }]
    expect(checkDateOverlap('2030-01-01', null, abierto)).toHaveLength(1)
  })
})

describe('conflictosAtribucion', () => {
  const universo = [
    { id: 1, proyecto_id: 10, estado_solicitud: 'publicado', fecha_inicio: '2026-01-01', fecha_fin: '2026-12-31' },
    { id: 2, proyecto_id: 99, estado_solicitud: 'publicado', fecha_inicio: '2026-01-01', fecha_fin: '2026-12-31' },
    { id: 3, proyecto_id: 10, estado_solicitud: 'terminado', fecha_inicio: '2026-01-01', fecha_fin: '2026-12-31' },
  ]
  const propuesta = { proyecto_id: 10, fecha_inicio: '2026-03-01', fecha_fin: '2026-04-01' }

  it('solo mira la misma planta', () => {
    expect(conflictosAtribucion(propuesta, universo)).toHaveLength(1)
  })

  it('se excluye a sí mismo por id al editar', () => {
    expect(conflictosAtribucion({ ...propuesta, id: 1 }, universo)).toHaveLength(0)
  })

  it('ignora contratos terminados', () => {
    expect(conflictosAtribucion(propuesta, [universo[2]])).toHaveLength(0)
  })

  it('no evalúa nada si no hay planta seleccionada', () => {
    expect(conflictosAtribucion({ ...propuesta, proyecto_id: null }, universo)).toHaveLength(0)
  })

  it('no cuenta una fila ya marcada como compra en bolsa ni una terminación', () => {
    const fila = { ...universo[0], proyecto_id: 12 }
    const nueva = { proyecto_id: 12, fecha_inicio: '2026-01-01', fecha_fin: '2039-12-31' }
    expect(conflictosAtribucion(nueva, [{ ...fila, es_duplicado: true }])).toHaveLength(0)
    expect(conflictosAtribucion(nueva, [{ ...fila, tipo_solicitud: 'terminacion' }])).toHaveLength(0)
  })
})

// Regresión del falso positivo de La Reserva (SIC 89116): la fila vieja de la
// planta en su SIC anterior conserva `fecha_fin` cruda 2030, pero un relevo
// (modificación con otra planta) la recortó al 2026-02-06. Comparar contra la
// fecha cruda hacía saltar una alarma que no existía.
describe('ventanas efectivas — La Reserva', () => {
  const filaSuperada = {
    id: 1,
    proyecto_id: 12,
    estado_solicitud: 'publicado',
    codigo_sic_contrato: '87137',
    fecha_inicio: '2025-04-03',
    fecha_fin: '2030-03-31',
    fecha_fin_efectiva: '2026-02-06',
  }

  it('finEfectivoIso prefiere la ventana efectiva, y cae a la cruda si el backend no la manda', () => {
    expect(finEfectivoIso({ fecha_fin: '2030-03-31', fecha_fin_efectiva: '2026-02-06' })).toBe('2026-02-06')
    expect(finEfectivoIso({ fecha_fin: '2030-03-31' })).toBe('2030-03-31')
  })

  it('la fila superada por un relevo no genera conflicto', () => {
    const nueva = { proyecto_id: 12, fecha_inicio: '2026-02-07', fecha_fin: '2039-12-31' }
    expect(conflictosAtribucion(nueva, [filaSuperada])).toHaveLength(0)
  })

  it('sin fecha efectiva (backend viejo) conserva el comportamiento anterior', () => {
    const nueva = { proyecto_id: 12, fecha_inicio: '2026-02-07', fecha_fin: '2039-12-31' }
    expect(conflictosAtribucion(nueva, [{ ...filaSuperada, fecha_fin_efectiva: undefined }])).toHaveLength(1)
  })

  it('si la propuesta pisa el tramo efectivamente vigente, el cruce es real y sigue alarmando', () => {
    const nueva = { proyecto_id: 12, fecha_inicio: '2026-01-01', fecha_fin: '2039-12-31' }
    expect(conflictosAtribucion(nueva, [filaSuperada])).toHaveLength(1)
  })

  it('editar la fila recortada respeta su corte y no alarma contra el nuevo hogar de la planta', () => {
    const nuevoHogar = {
      id: 3,
      proyecto_id: 12,
      estado_solicitud: 'publicado',
      codigo_sic_contrato: '89116',
      fecha_inicio: '2026-02-07',
      fecha_fin: '2039-12-31',
      fecha_fin_efectiva: '2039-12-31',
    }
    const edicion = { id: 1, proyecto_id: 12, fecha_inicio: '2025-04-03', fecha_fin: '2030-03-31' }
    expect(conflictosAtribucion(edicion, [filaSuperada, nuevoHogar])).toHaveLength(0)
  })
})

describe('findReplacementContract', () => {
  const porSic = [
    { id: 1, codigo_sic_contrato: '88806', estado_solicitud: 'publicado', fecha_inicio: '2025-01-01', fecha_fin: '2026-12-31' },
    { id: 2, codigo_sic_contrato: '99999', estado_solicitud: 'publicado', fecha_inicio: '2025-01-01', fecha_fin: '2026-12-31' },
  ]

  it('encuentra el contrato del mismo SIC que se cruza', () => {
    const repl = findReplacementContract(
      { codigo_sic_contrato: '88806', fecha_inicio: '2026-06-01', fecha_fin: '2027-06-01' },
      porSic,
    )
    expect(repl).toHaveLength(1)
    expect(repl[0].id).toBe(1)
  })

  it('sin SIC no hay candidato a reemplazar', () => {
    expect(findReplacementContract({ codigo_sic_contrato: null, fecha_inicio: '2026-06-01' }, porSic)).toHaveLength(0)
  })
})

describe('validateContractUniqueness', () => {
  const existentes = [
    { id: 1, codigo_sic_contrato: '88806', proyecto_id: 10, tipo_solicitud: 'registro', fecha_inicio: '2026-01-01', fecha_fin: '2026-12-31' },
  ]
  const duplicado = {
    codigo_sic_contrato: '88806',
    proyecto_id: 10,
    tipo_solicitud: 'registro',
    fecha_inicio: '2026-01-01',
    fecha_fin: '2026-12-31',
  }

  it('detecta el duplicado exacto', () => {
    expect(validateContractUniqueness(duplicado, existentes)).toHaveLength(1)
  })

  it('una fecha fin distinta ya no es duplicado exacto', () => {
    expect(validateContractUniqueness({ ...duplicado, fecha_fin: '2027-01-01' }, existentes)).toHaveLength(0)
  })

  it('no se cuenta a sí mismo', () => {
    expect(validateContractUniqueness({ ...duplicado, id: 1 }, existentes)).toHaveLength(0)
  })
})
