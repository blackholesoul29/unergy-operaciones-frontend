/**
 * API client factory, backed by `air` — a tiny fetch-based client, so a
 * relative URL called during SSR reaches this app's own Nitro routes without a
 * round trip over the network, same as the native `fetch` it wraps.
 *
 * Usage:
 *   import { createApiClient } from '~/core/api'
 *   const client = createApiClient({ getToken: () => auth.accessToken.value })
 */
import air, { type AirClient } from '@korastd/air'

export type ApiClient = AirClient

export interface ApiClientOptions {
  baseUrl?: string
  /** Called on every request so a refreshed token is always picked up. */
  getToken?: () => string | null
}

export function createApiClient(options: ApiClientOptions = {}): ApiClient {
  const { baseUrl = '', getToken } = options

  return air.create({
    baseURL: baseUrl,
    headers: () => {
      const token = getToken?.()
      return token ? { Authorization: `Bearer ${token}` } : {}
    },
  })
}
