/**
 * Cálculo financiero del dashboard mensual — funciones puras.
 *
 * Portada a Vitest en la Fase 0 de la migración (antes:
 * `financialCalculations.test.mjs` sobre `node:test`, evaluando el fuente con
 * `new Function` porque el repo no tenía runner).
 */
import { describe, expect, it } from 'vitest'
import {
  calculateCompliancePct,
  calculatePPARevenue,
  calculateSLAFine,
  calculateSpotDifference,
  calculateUnderGeneration,
  formatCurrency,
  formatCurrencyCompact,
  formatMWh,
} from './financialCalculations'

describe('calculatePPARevenue', () => {
  it('multiplica energía por precio', () => {
    expect(calculatePPARevenue(100, 250000)).toBe(25000000)
  })

  it('devuelve 0 ante nulos, cero o negativos', () => {
    expect(calculatePPARevenue(null, 250000)).toBe(0)
    expect(calculatePPARevenue(100, null)).toBe(0)
    expect(calculatePPARevenue(0, 250000)).toBe(0)
    expect(calculatePPARevenue(-5, 250000)).toBe(0)
  })
})

describe('calculateSpotDifference', () => {
  it('da positivo cuando la bolsa paga más que el PPA, y negativo cuando paga menos', () => {
    expect(calculateSpotDifference(10, 300000, 250000)).toBe(500000)
    expect(calculateSpotDifference(10, 200000, 250000)).toBe(-500000)
    expect(calculateSpotDifference(0, 300000, 250000)).toBe(0)
  })
})

describe('calculateSLAFine', () => {
  it('solo penaliza el déficit real: un excedente no multa', () => {
    expect(calculateSLAFine(20, 150000)).toBe(3000000)
    expect(calculateSLAFine(0, 150000)).toBe(0)
    expect(calculateSLAFine(-3, 150000)).toBe(0)
    expect(calculateSLAFine(20, null)).toBe(0)
  })
})

describe('calculateUnderGeneration', () => {
  it('mide la brecha contra la meta, nunca por debajo de cero', () => {
    expect(calculateUnderGeneration(80, 100)).toBe(20)
    expect(calculateUnderGeneration(120, 100)).toBe(0)
    expect(calculateUnderGeneration(null, 100)).toBe(100)
  })
})

describe('calculateCompliancePct', () => {
  it('calcula el porcentaje, y devuelve null si la meta es cero', () => {
    expect(calculateCompliancePct(90, 100)).toBe(90)
    expect(calculateCompliancePct(100, 100)).toBe(100)
    expect(calculateCompliancePct(50, 0)).toBeNull()
  })
})

describe('formato', () => {
  it('formatCurrency: pesos con separador de miles, guion largo para lo que no es número', () => {
    expect(formatCurrency(null)).toBe('—')
    expect(formatCurrency(NaN)).toBe('—')
    expect(formatCurrency(1234567)).toMatch(/1\.234\.567/)
  })

  it('formatCurrencyCompact: escala a millones y miles de millones conservando el signo', () => {
    expect(formatCurrencyCompact(1_500_000)).toBe('$1.5 M')
    expect(formatCurrencyCompact(2_000_000_000)).toBe('$2.0 B')
    expect(formatCurrencyCompact(-3_000_000)).toBe('-$3.0 M')
    expect(formatCurrencyCompact(null)).toBe('—')
  })

  it('formatMWh: sufijo de unidad y guion largo para nulos', () => {
    expect(formatMWh(null)).toBe('—')
    expect(formatMWh(1234.5)).toMatch(/MWh/)
  })
})
