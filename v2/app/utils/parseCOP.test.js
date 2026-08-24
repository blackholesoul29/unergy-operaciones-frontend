/**
 * parseCOP — parseo del "Valor a Facturar" editado en línea.
 *
 * Portada a Vitest en la Fase 0 de la migración. La versión anterior
 * (`parseCOP.test.mjs`) leía el fuente, le quitaba los `export` y lo evaluaba
 * con `new Function`, porque el repo no tenía runner. Ahora importa el módulo
 * de verdad, que es lo que hará el código migrado.
 */
import { describe, expect, it } from 'vitest'
import { parseCOP } from './parseCOP.js'

describe('parseCOP', () => {
  it('lee enteros planos y moneda con separador de miles', () => {
    expect(parseCOP('1500000')).toBe(1500000)
    expect(parseCOP('$1.500.000')).toBe(1500000)
    expect(parseCOP('1.200')).toBe(1200)
    expect(parseCOP('$0')).toBe(0)
  })

  // Regresión (bug #7a): en formato colombiano el punto es miles y la coma es
  // decimal. Tratar la coma como separador de miles multiplicaba por 100.
  it('trata la coma como decimal y redondea a peso entero', () => {
    expect(parseCOP('1.500.000,50')).toBe(1500001)
    expect(parseCOP('1200,00')).toBe(1200)
    expect(parseCOP('1200,50')).toBe(1201)
  })

  // Regresión (bug #7b): el signo se perdía al limpiar el string.
  it('conserva el signo negativo', () => {
    expect(parseCOP('-500000')).toBe(-500000)
    expect(parseCOP('-1.500.000,50')).toBe(-1500001)
  })

  it('devuelve null para entradas que no son un valor', () => {
    expect(parseCOP('')).toBeNull()
    expect(parseCOP(null)).toBeNull()
    expect(parseCOP('abc')).toBeNull()
  })
})
