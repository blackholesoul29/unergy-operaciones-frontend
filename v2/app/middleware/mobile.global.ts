/**
 * Navegación de la app móvil (`/m/*`): login propio y destino de aterrizaje por
 * rol. `auth.global.ts` deja pasar de largo estas rutas (`to.meta.mobile`)
 * porque coordinador y técnico no comparten bandeja con el resto y cada uno
 * tiene que aterrizar en la suya — algo que "permitido/denegado" no expresa.
 *
 * Traducido 1:1 del `router.beforeEach` legacy. `AUTH_ROUTE_PERMISSIONS` no
 * declara páginas `/m/*` a propósito: son un axis aparte, resuelto aquí.
 */
import { UserRole } from '~/types/user'

const RUTAS = {
  loginMovil: '/m/login',
  movilSolar: '/m/solar',
  movilCoordinador: '/m/coordinador',
  movilTecnico: '/m/tecnico',
} as const

/** A dónde aterriza cada rol al entrar a la app móvil. */
function inicioMovil(role: UserRole | undefined): string {
  if (role === UserRole.COORDINADOR) return RUTAS.movilCoordinador
  if (role === UserRole.TECNICO) return RUTAS.movilTecnico
  return RUTAS.movilSolar
}

export default defineNuxtRouteMiddleware((to) => {
  if (!to.meta.mobile) return

  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated.value) {
    if (to.path === RUTAS.loginMovil) return
    return navigateTo(RUTAS.loginMovil, { replace: true })
  }

  // Con sesión, el login móvil no tiene nada que ofrecer.
  if (to.path === RUTAS.loginMovil) {
    return navigateTo(inicioMovil(user.value?.role), { replace: true })
  }

  const role = user.value?.role

  // Coordinador y técnico tienen bandeja propia: la genérica no es para ellos.
  if (
    to.path === RUTAS.movilSolar &&
    (role === UserRole.COORDINADOR || role === UserRole.TECNICO)
  ) {
    return navigateTo(inicioMovil(role), { replace: true })
  }
  // Y al revés: nadie más entra en esas dos (admin sí ve la de coordinador).
  if (
    to.path === RUTAS.movilCoordinador &&
    role !== UserRole.COORDINADOR &&
    role !== UserRole.ADMIN
  ) {
    return navigateTo(RUTAS.movilSolar, { replace: true })
  }
  if (to.path === RUTAS.movilTecnico && role !== UserRole.TECNICO) {
    return navigateTo(RUTAS.movilSolar, { replace: true })
  }
})
