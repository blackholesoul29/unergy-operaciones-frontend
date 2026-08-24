import api from '~/api/client'

const BASE = '/garantias/proyecciones'

export function getProyecciones({ plantasNuevas = 0, kwhPlantaNueva = 180 } = {}) {
  return api
    .get(BASE, { params: { plantas_nuevas: plantasNuevas, kwh_planta_nueva: kwhPlantaNueva } })
    .then((r) => r.data)
}

export function guardarSnapshot({ plantasNuevas = 0, kwhPlantaNueva = 180 } = {}) {
  return api
    .post(`${BASE}/snapshot`, null, {
      params: { plantas_nuevas: plantasNuevas, kwh_planta_nueva: kwhPlantaNueva },
    })
    .then((r) => r.data)
}

export function getHistorial() {
  return api.get(`${BASE}/historial`).then((r) => r.data)
}

export function setPagado({ anio, mes, valor }) {
  return api
    .put(`${BASE}/pagado`, null, { params: { anio, mes, valor } })
    .then((r) => r.data)
}
