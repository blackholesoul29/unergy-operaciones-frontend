// Exportar una tabla (array de filas ya filtradas/visibles) a un .xlsx --
// genera el archivo en el navegador con la librería `xlsx`, sin pasar por
// el backend. Pensado para "descargar la vista tal cual está" en listados
// simples (Clientes, Proyectos, Fronteras...), no para reportes con lógica
// de negocio propia (esos ya tienen su propio *ExcelExport.js).
import * as XLSX from 'xlsx'

// columnas: [{ header: 'Nombre visible', value: fila => valor }]
export function exportarExcel(filas, columnas, nombreArchivo, hoja = 'Datos') {
  const data = filas.map(fila => {
    const obj = {}
    for (const col of columnas) obj[col.header] = col.value(fila)
    return obj
  })
  const ws = XLSX.utils.json_to_sheet(data, { header: columnas.map(c => c.header) })
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, hoja)
  XLSX.writeFile(wb, nombreArchivo)
}
