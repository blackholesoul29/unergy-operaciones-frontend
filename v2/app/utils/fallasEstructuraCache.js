import api from '~/api/client'

// GET /fallas/estructura es un catálogo prácticamente estático (la
// estructura canónica de categorías/tipos de falla) -- se cachea a nivel de
// módulo para que abrir el formulario de Nueva/Editar varias veces en la
// misma sesión no repita la llamada cada vez.
let _cache = null

export async function getEstructuraFallas() {
  if (_cache) return _cache
  try {
    const { data } = await api.get('/fallas/estructura')
    _cache = data.categorias ?? []
  } catch {
    return []
  }
  return _cache
}
