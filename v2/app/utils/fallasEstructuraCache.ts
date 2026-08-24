import api from '~/core/client'

export interface EstructuraFallaCategoria {
  codigo: string
  etiqueta: string
  tipo: 'opcion' | 'equipo' | 'inversores'
  opciones?: Array<{ codigo: string; etiqueta?: string; [key: string]: unknown }>
  opciones_label?: string
  tipos_falla?: string[]
  [key: string]: unknown
}

// GET /fallas/estructura es un catálogo prácticamente estático (la
// estructura canónica de categorías/tipos de falla) -- se cachea a nivel de
// módulo para que abrir el formulario de Nueva/Editar varias veces en la
// misma sesión no repita la llamada cada vez.
let _cache: EstructuraFallaCategoria[] | null = null

export async function getEstructuraFallas(): Promise<EstructuraFallaCategoria[]> {
  if (_cache) return _cache
  try {
    const { data } = await api.get<{ categorias?: EstructuraFallaCategoria[] }>(
      '/fallas/estructura',
    )
    _cache = data.categorias ?? []
  } catch {
    return []
  }
  return _cache
}
