/**
 * El gemelo de `BaseService` para el transporte que todavía usa la plataforma.
 *
 * `BaseService` (`~/core/service.ts`) es el destino: ofetch, y el token que le
 * pasa quien lo instancia. Pero hoy la sesión vive en `localStorage` y el 401 y
 * el 403 los resuelve el interceptor de axios de `~/core/client.ts`. Un service
 * migrado a ofetch dejaría de redirigir al login al caducar la sesión — una
 * regresión silenciosa, y de las caras.
 *
 * Así que durante la migración hay dos bases con el mismo contrato (`this.api`)
 * y distinto transporte. Un service que extiende esta ya tiene la forma final —
 * clase, en `features/<slice>/services/`, métodos tipados, rutas como
 * constantes; lo único que cambia en la fase 3 es de quién hereda.
 *
 * @example
 * class ProyeccionesService extends LegacyBaseService {
 *   listar() { return this.get<Proyeccion[]>('/garantias/proyecciones') }
 * }
 */
import type { AxiosInstance, AxiosRequestConfig } from 'axios'
import client from '~/core/client'

export class LegacyBaseService {
  protected api: AxiosInstance

  /**
   * Por defecto, la instancia compartida de la plataforma, con sus interceptores.
   *
   * Se puede pasar otra: el agente local de XM vive en `127.0.0.1` y **no debe**
   * llevar el token ni el redirect al login. Es el mismo motivo por el que
   * `BaseService` acepta un `baseUrl` propio.
   */
  constructor(instancia: AxiosInstance = client) {
    this.api = instancia
  }

  /** Devuelve el cuerpo de la respuesta, que es lo único que quiere quien llama. */
  protected async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await this.api.get<T>(url, config)
    return data
  }

  protected async post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await this.api.post<T>(url, body, config)
    return data
  }

  protected async put<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await this.api.put<T>(url, body, config)
    return data
  }

  protected async patch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await this.api.patch<T>(url, body, config)
    return data
  }

  protected async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await this.api.delete<T>(url, config)
    return data
  }

  /**
   * Sube archivos como `multipart/form-data` informando del avance. La subida de
   * facturas y de Excel son lo bastante lentas como para que el porcentaje no
   * sea un adorno.
   */
  protected postFormData<T>(
    url: string,
    form: FormData,
    onProgreso?: (porcentaje: number) => void,
  ): Promise<T> {
    return this.post<T>(url, form, {
      onUploadProgress: onProgreso
        ? (ev) => onProgreso(ev.total ? Math.round((ev.loaded / ev.total) * 100) : 0)
        : undefined,
    })
  }
}
