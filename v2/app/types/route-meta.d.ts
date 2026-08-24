/**
 * MIGRACIÓN — Fase 1. El `meta` de ruta que declaran las páginas puente y que
 * lee `app/middleware/legacy-auth.global.ts`.
 *
 * Sin esta ampliación, `definePageMeta({ roles: [...] })` no compila: el
 * `RouteMeta` de vue-router no conoce esas claves.
 *
 * Desaparece con el guard, en la fase 3 ola 1. El template no lleva los roles en
 * el meta de cada página, sino en una matriz central (`AUTH_ROUTE_PERMISSIONS`),
 * justo para que una página que se olvida de declararlos no quede abierta.
 */
declare module 'vue-router' {
  interface RouteMeta {
    /** Alcanzable sin sesión. */
    public?: boolean
    /** Pertenece a la app móvil (`/m/*`): otro login y otro layout. */
    mobile?: boolean
    /** Roles que pueden abrirla. Sin esta clave, basta con estar autenticado. */
    roles?: string[]
    /** Restricción a una persona concreta. Se sustituye por un permiso en la fase 3. */
    requireEmail?: string
  }
}

export {}
