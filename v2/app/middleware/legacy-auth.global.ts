/**
 * El guard de la plataforma, traducido desde el `router.beforeEach` de
 * `app/router/index.js`. Misma lógica y mismo orden de comprobaciones.
 *
 * Convive con `auth.global.ts`, el guard del template, que se queda quieto
 * mientras `NUXT_PUBLIC_AUTH_ENABLED=false`. Los dos desaparecen en uno solo en
 * la fase 3, ola 1.
 *
 * Diferencia con el original: donde el legacy comparaba `to.name`
 * (`'MobileCoordinador'`, `'MobileTecnico'`) esto compara la ruta. Los nombres
 * los genera Nuxt desde el árbol de `app/pages/`, así que aquellos ya no existen.
 */
import { useAuthStore } from '~/stores/auth'

const RUTAS = {
  login: '/login',
  dashboard: '/dashboard',
  loginMovil: '/m/login',
  movilSolar: '/m/solar',
  movilCoordinador: '/m/coordinador',
  movilTecnico: '/m/tecnico',
} as const

/** A dónde manda a cada rol la app móvil al entrar. */
function inicioMovil(rol: string | null): string {
  if (rol === 'coordinador') return RUTAS.movilCoordinador
  if (rol === 'tecnico') return RUTAS.movilTecnico
  return RUTAS.movilSolar
}

export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()

  // Modo previsualización local (solo DEV): ?preview=tecnico o ?preview=coordinador
  if (import.meta.dev && to.query.preview) {
    auth.previewLogin(String(to.query.preview))
  }

  // No autenticado → login. La app móvil tiene el suyo.
  if (!to.meta.public && !auth.isAuthenticated) {
    return navigateTo(to.meta.mobile ? RUTAS.loginMovil : RUTAS.login, { replace: true })
  }

  // Ya con sesión, un login no tiene nada que ofrecer.
  if (to.path === RUTAS.loginMovil && auth.isAuthenticated) {
    return navigateTo(inicioMovil(auth.role), { replace: true })
  }
  if (to.path === RUTAS.login && auth.isAuthenticated) {
    return navigateTo(RUTAS.dashboard, { replace: true })
  }

  if (to.meta.mobile && auth.isAuthenticated) {
    const rol = auth.role

    // Coordinador y técnico tienen bandeja propia: la genérica no es para ellos.
    if (to.path === RUTAS.movilSolar && (rol === 'coordinador' || rol === 'tecnico')) {
      return navigateTo(inicioMovil(rol), { replace: true })
    }
    // Y al revés: nadie más entra en esas dos.
    if (to.path === RUTAS.movilCoordinador && rol !== 'coordinador' && rol !== 'admin') {
      return navigateTo(RUTAS.movilSolar, { replace: true })
    }
    if (to.path === RUTAS.movilTecnico && rol !== 'tecnico') {
      return navigateTo(RUTAS.movilSolar, { replace: true })
    }
  }

  // Con sesión pero sin datos de usuario (la caché se borró mientras el JWT
  // sigue vivo): re-login para reconstruir el estado.
  if (to.meta.roles && auth.isAuthenticated && !auth.user) {
    return navigateTo(RUTAS.login, { replace: true })
  }

  // Rol (solo rutas web: las móviles ya se resolvieron arriba).
  if (to.meta.roles && to.meta.mobile !== true && !auth.can(...to.meta.roles)) {
    return navigateTo(RUTAS.dashboard, { replace: true })
  }

  // Restricción a una persona concreta.
  if (to.meta.requireEmail && auth.user?.email !== to.meta.requireEmail) {
    return navigateTo(RUTAS.dashboard, { replace: true })
  }
})
