/**
 * Validación de seguridad de un ZIP subido: Zip Slip + allowlist de extensiones.
 *
 * Portada a Vitest en la Fase 0 de la migración (antes:
 * `zipSecurityValidator.test.mjs` sobre `node:test`, evaluando el fuente con
 * `new Function`).
 */
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_ALLOWED_EXTENSIONS,
  getSafeFilePath,
  validateZipEntries,
  type ZipLike,
} from './zipSecurityValidator'

/** Objeto con la forma pública de JSZip (`.files`): mapa ruta → ZipObject. */
function fakeZip(entries: Array<[string, boolean?]>): ZipLike {
  const files: ZipLike['files'] = {}
  for (const [name, dir] of entries) files![name] = { name, dir: !!dir }
  return { files }
}

const DOCS = { allowedExtensions: ['pdf', 'jpg', 'jpeg'] }

describe('validateZipEntries — lo que acepta', () => {
  it('acepta las extensiones permitidas', () => {
    const res = validateZipEntries(
      fakeZip([['pago_1/cuenta_cobro.pdf'], ['pago_1/factura.jpg']]),
      DOCS,
    )
    expect(res.valid).toBe(true)
    expect(res.errors).toHaveLength(0)
  })

  it('compara la extensión sin distinguir mayúsculas', () => {
    expect(validateZipEntries(fakeZip([['pago_1/CUENTA.PDF']]), DOCS).valid).toBe(true)
  })

  it('ignora las entradas de directorio', () => {
    expect(
      validateZipEntries(fakeZip([['pago_1/', true], ['pago_1/cuenta.pdf']]), DOCS).valid,
    ).toBe(true)
  })

  it('ignora los metadatos del sistema operativo', () => {
    const zip = fakeZip([
      ['__MACOSX/pago_1/._cuenta.pdf'],
      ['pago_1/.DS_Store'],
      ['pago_1/Thumbs.db'],
      ['pago_1/cuenta.pdf'],
    ])
    expect(validateZipEntries(zip, DOCS).valid).toBe(true)
  })

  it('respeta una allowlist personalizada', () => {
    const res = validateZipEntries(fakeZip([['data.csv'], ['libro.xlsx']]), {
      allowedExtensions: ['csv', 'xlsx'],
    })
    expect(res.valid).toBe(true)
  })

  it('sin opciones usa DEFAULT_ALLOWED_EXTENSIONS', () => {
    expect(DEFAULT_ALLOWED_EXTENSIONS).toEqual(['csv', 'xls', 'xlsx'])
    expect(validateZipEntries(fakeZip([['reporte.csv']])).valid).toBe(true)
    expect(validateZipEntries(fakeZip([['documento.pdf']])).valid).toBe(false)
  })
})

describe('validateZipEntries — lo que rechaza', () => {
  it('rechaza el path traversal con ".."', () => {
    const res = validateZipEntries(fakeZip([['pago_1/../../../etc/passwd.pdf']]), DOCS)
    expect(res.valid).toBe(false)
    expect(res.errors.some((e) => e.code === 'PATH_TRAVERSAL')).toBe(true)
  })

  it('rechaza rutas absolutas de unix y de windows', () => {
    const unix = validateZipEntries(fakeZip([['/etc/passwd.pdf']]), DOCS)
    expect(unix.valid).toBe(false)
    expect(unix.errors.some((e) => e.code === 'ABSOLUTE_PATH')).toBe(true)

    const win = validateZipEntries(fakeZip([['C:\\Windows\\evil.pdf']]), DOCS)
    expect(win.valid).toBe(false)
    expect(win.errors.some((e) => e.code === 'ABSOLUTE_PATH')).toBe(true)
  })

  it('rechaza una extensión fuera de la allowlist', () => {
    const res = validateZipEntries(fakeZip([['pago_1/cuenta.pdf'], ['pago_1/malware.exe']]), DOCS)
    expect(res.valid).toBe(false)
    expect(res.errors.some((e) => e.code === 'DISALLOWED_EXTENSION' && /exe/.test(e.path))).toBe(
      true,
    )
  })

  it('rechaza un archivo sin extensión', () => {
    const res = validateZipEntries(fakeZip([['pago_1/passwd']]), DOCS)
    expect(res.valid).toBe(false)
    expect(res.errors.some((e) => e.code === 'DISALLOWED_EXTENSION')).toBe(true)
  })

  it('acumula todos los errores en vez de parar en el primero', () => {
    const res = validateZipEntries(fakeZip([['../x.pdf'], ['/y.exe'], ['z.bat']]), DOCS)
    expect(res.valid).toBe(false)
    expect(res.errors.length).toBeGreaterThanOrEqual(3)
  })
})

describe('getSafeFilePath', () => {
  it('deja intacta una ruta relativa simple', () => {
    expect(getSafeFilePath('a/b/c.pdf')).toBe('a/b/c.pdf')
  })

  it('convierte una ruta absoluta en relativa', () => {
    expect(getSafeFilePath('/etc/passwd')).toBe('etc/passwd')
  })

  it('colapsa los ".." sin dejar escapar de la raíz', () => {
    expect(getSafeFilePath('a/../../b.pdf')).toBe('b.pdf')
    expect(getSafeFilePath('../../etc/passwd')).toBe('etc/passwd')
  })

  it('elimina los "." y normaliza separadores de windows con letra de unidad', () => {
    expect(getSafeFilePath('a/./b.pdf')).toBe('a/b.pdf')
    expect(getSafeFilePath('C:\\Windows\\x.pdf')).toBe('Windows/x.pdf')
  })

  it('devuelve cadena vacía para vacío o nulo', () => {
    expect(getSafeFilePath('')).toBe('')
    expect(getSafeFilePath(null)).toBe('')
  })
})
