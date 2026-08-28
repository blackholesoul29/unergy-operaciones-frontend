/** Los 7 roles que emite el backend de operaciones, tal como llegan en el JWT (claim `rol`). */
export enum UserRole {
  ADMIN = 'admin',
  OPERACIONES = 'operaciones',
  MONITOREO = 'monitoreo',
  LIQUIDACIONES = 'liquidaciones',
  COMERCIAL = 'comercial',
  COORDINADOR = 'coordinador',
  TECNICO = 'tecnico',
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
