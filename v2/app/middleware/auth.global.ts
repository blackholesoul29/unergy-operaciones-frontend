/**
 * The page guard. Runs on the server for the first request and in the browser
 * for every navigation after it, which is why it — and not the server
 * middleware — is where page access is decided. The decision itself is
 * `pageAccess`, shared and pure, so there is one table to keep right.
 *
 * `/m/*` is left to `mobile.global.ts`: coordinador/técnico land on their own
 * tray, which "allowed/forbidden" cannot express, and `AUTH_ROUTE_PERMISSIONS`
 * deliberately declares no mobile page.
 */
import { AUTH_DEFAULT_REDIRECT_PATH, AUTH_LOGIN_PATH } from '~/config/app'
import { logger } from '~/core/logger'
import { loginUrl, pageAccess } from '~/features/auth/access'
import { decodeRedirect } from '~/features/auth/redirect'

export default defineNuxtRouteMiddleware((to) => {
  if (!useRuntimeConfig().public.authEnabled) return

  // Vista previa local (solo DEV): ?preview=operaciones, ?preview=comercial…
  if (import.meta.dev && typeof to.query.preview === 'string') {
    useAuth().previewLogin(to.query.preview)
  }

  if (to.meta.mobile) return

  const { user } = useAuth()
  const access = pageAccess(user.value, to.path)

  if (access === 'allowed') return

  if (access === 'public') {
    // Already signed in, so the login page has nothing left to offer.
    if (user.value && to.path === AUTH_LOGIN_PATH) {
      const redirect = typeof to.query.redirect === 'string' ? to.query.redirect : null
      return navigateTo(decodeRedirect(redirect) ?? AUTH_DEFAULT_REDIRECT_PATH, { replace: true })
    }
    return
  }

  if (access === 'unauthenticated') {
    const search = to.fullPath.slice(to.path.length)
    return navigateTo(loginUrl(to.path, search), { replace: true })
  }

  if (access === 'undeclared') {
    // Not a user problem: the page exists but nobody declared it. Say so in the
    // log, and give the visitor the same 403 as any other refusal.
    logger.error('auth', new Error(`Undeclared page route: ${to.path}`))
  }

  throw createError({ statusCode: 403, statusMessage: 'You do not have access to this page.' })
})
