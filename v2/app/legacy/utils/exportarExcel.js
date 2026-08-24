// Exportar una tabla (array de filas ya filtradas/visibles) a un .xlsx --
// genera el archivo en el navegador con `exceljs`, sin pasar por el backend.
// Pensado para "descargar la vista tal cual está" en listados simples
// (Clientes, Proyectos, Fronteras...), no para reportes con lógica de
// negocio propia (esos ya tienen su propio *ExcelExport.js con `xlsx`).
//
// Se usa exceljs y no `xlsx` (que ya está en el proyecto) porque la edición
// gratuita de `xlsx` no escribe estilos de celda -- se probó (negrita) y el
// archivo resultante queda sin ningún estilo, aunque no da error.
//
// Import dinámico (no al inicio del archivo): exceljs pesa ~940 KB sin
// comprimir -- así solo se descarga cuando alguien de verdad hace clic en
// "Descargar Excel", no cada vez que se visita Clientes/Proyectos/etc.

const COLOR_HEADER = 'FF915BD8' // mismo morado de marca que ya se usa en la UI
const COLOR_BORDE = 'FFE0E0E0'
const ANCHO_MIN = 10
const ANCHO_MAX = 45

// columnas: [{ header: 'Nombre visible', value: fila => valor }]
export async function exportarExcel(filas, columnas, nombreArchivo, hoja = 'Datos') {
  const { default: ExcelJS } = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet(hoja, { views: [{ state: 'frozen', ySplit: 1 }] })

  ws.columns = columnas.map(col => ({ header: col.header, key: col.header }))
  for (const fila of filas) {
    const row = {}
    for (const col of columnas) row[col.header] = col.value(fila)
    ws.addRow(row)
  }

  const borde = { style: 'thin', color: { argb: COLOR_BORDE } }
  ws.eachRow((row, rowNum) => {
    row.eachCell({ includeEmpty: true }, cell => {
      cell.border = { top: borde, left: borde, bottom: borde, right: borde }
      if (rowNum === 1) {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER } }
        cell.alignment = { vertical: 'middle' }
      }
    })
  })
  ws.getRow(1).height = 20

  ws.columns.forEach(col => {
    let max = String(col.header || '').length
    col.eachCell({ includeEmpty: true }, cell => {
      const len = (cell.value ?? '').toString().length
      if (len > max) max = len
    })
    col.width = Math.min(Math.max(max + 2, ANCHO_MIN), ANCHO_MAX)
  })

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo
  a.click()
  URL.revokeObjectURL(url)
}
