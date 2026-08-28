/**
 * Registro de Nuxt para la navegación móvil — la decisión en sí es
 * `~/features/mobile/access.ts`, que es pura y se prueba aparte. `auth.global.ts`
 * deja pasar de largo `/m/*` (`to.meta.mobile`) porque esta es la única que la
 * gobierna.
 */
import { mobileRedirect } from '~/features/mobile/access'

export default defineNuxtRouteMiddleware((to) => {
  if (!to.meta.mobile) return

  const { user, isAuthenticated } = useAuth()
  const redirect = mobileRedirect(to.path, {
    isAuthenticated: isAuthenticated.value,
    role: user.value?.role,
  })

  if (redirect && redirect !== to.path) return navigateTo(redirect, { replace: true })
})
