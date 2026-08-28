/**
 * La navegación de la app móvil (`/m/*`): a dónde aterriza cada rol y a dónde
 * se redirige cuando la pantalla no es la suya. Pura, para que se pruebe sin
 * montar Nuxt — la aplica `app/middleware/mobile.global.ts`, que solo traduce
 * el resultado a `navigateTo`.
 *
 * Aparte de `~/features/auth/access.ts` a propósito: esa decide
 * "permitido/denegado" para la web, esto decide "a cuál de las cuatro
 * pantallas propias" — no es un caso más de deny-by-default, es un router
 * secundario con su propia noción de home por rol.
 */
import { UserRole } from '~/types/user'

export const MOBILE_ROUTES = {
  login: '/m/login',
  solar: '/m/solar',
  coordinador: '/m/coordinador',
  tecnico: '/m/tecnico',
} as const

/** A dónde aterriza cada rol al entrar a la app móvil. */
export function mobileHome(role: UserRole | undefined): string {
  if (role === UserRole.COORDINADOR) return MOBILE_ROUTES.coordinador
  if (role === UserRole.TECNICO) return MOBILE_ROUTES.tecnico
  return MOBILE_ROUTES.solar
}

export interface MobileSession {
  isAuthenticated: boolean
  role: UserRole | undefined
}

/** A dónde redirigir dado el estado de sesión, o `null` si la ruta ya es la suya. */
export function mobileRedirect(pathname: string, session: MobileSession): string | null {
  if (!session.isAuthenticated) {
    return pathname === MOBILE_ROUTES.login ? null : MOBILE_ROUTES.login
  }

  // Con sesión, el login móvil no tiene nada que ofrecer.
  if (pathname === MOBILE_ROUTES.login) return mobileHome(session.role)

  const { role } = session

  // Coordinador y técnico tienen bandeja propia: la genérica no es para ellos.
  if (
    pathname === MOBILE_ROUTES.solar &&
    (role === UserRole.COORDINADOR || role === UserRole.TECNICO)
  ) {
    return mobileHome(role)
  }
  // Y al revés: nadie más entra en esas dos (admin sí ve la de coordinador).
  if (pathname === MOBILE_ROUTES.coordinador && role !== UserRole.COORDINADOR && role !== UserRole.ADMIN) {
    return MOBILE_ROUTES.solar
  }
  if (pathname === MOBILE_ROUTES.tecnico && role !== UserRole.TECNICO) {
    return MOBILE_ROUTES.solar
  }

  return null
}
