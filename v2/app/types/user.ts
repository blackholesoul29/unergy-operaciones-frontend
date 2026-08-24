export enum UserRole {
  ADMIN = 'admin',
  MEMBER = 'member',
}

export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
}

export interface User extends BaseEntity {
  email: string
  name?: string | null
  role: UserRole
  avatar?: string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// MIGRACIÓN — el par heredado de los dos de arriba.
//
// El JWT que emite el backend de operaciones lleva `{ sub, rol, nombre, email }`,
// no la forma del template (`{ id, email, name, role, … }`). Es el mismo concepto
// de dominio con distinta forma, así que conviven hasta que la fase 3, ola 1,
// apunte `server/utils/auth-api.ts` a este backend y los mappers `toUser` /
// `toSession` traduzcan uno en otro. Entonces esta mitad desaparece.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Los roles que reconoce la plataforma.
 *
 * Va como unión de literales y no como `enum` a propósito: hay 164 literales
 * (`'admin'`, `'operaciones'`, …) repartidos por las vistas y el router, y con un
 * `enum` ninguno compilaría. Así el tipo ya obliga en el código nuevo mientras el
 * viejo sigue válido. Pasa a `enum` cuando la fase 3 migre esos call sites.
 */
export const ROLES_LEGACY = [
  'admin',
  'operaciones',
  'monitoreo',
  'liquidaciones',
  'comercial',
  'coordinador',
  'tecnico',
] as const

export type RolLegacy = (typeof ROLES_LEGACY)[number]

/** El usuario tal como viaja en el JWT y como lo guarda `~/core/security`. */
export interface UsuarioLegacy {
  id: string
  /**
   * Sin estrechar a `RolLegacy`: el backend puede inventar un rol mañana y tiene
   * que llegar verbatim para que `can()` no lo reconozca y deniegue. Estrecharlo
   * aquí obligaría a un cast que se comería justo ese caso.
   */
  rol: string
  nombre: string
  email: string
}
