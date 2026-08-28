import api from '@/api/client'

const BASE = '/garantias/modelo'

export function getPlan({ agente, esquema, cuantil = 0.9, horizonte = 4 }) {
  return api
    .get(`${BASE}/plan`, { params: { agente, esquema, cuantil, horizonte } })
    .then((r) => r.data)
}

export function getDetalle(id) {
  return api.get(`${BASE}/detalle/${encodeURIComponent(id)}`).then((r) => r.data)
}
