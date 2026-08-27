import type { Component } from 'vue'
import type { Permission } from '~/config/permissions'
import {
  BookIcon,
  BriefcaseIcon,
  CalculatorIcon,
  ChartColumnIcon,
  ChartLineIcon,
  CircleAlertIcon,
  ClockIcon,
  CloudIcon,
  CreditCardIcon,
  DollarSignIcon,
  FilePenIcon,
  FileTextIcon,
  FlagIcon,
  GlobeIcon,
  HouseIcon,
  LinkIcon,
  NetworkIcon,
  ShieldIcon,
  SunIcon,
  UsersIcon,
  WalletIcon,
  WrenchIcon,
  ZapIcon,
} from '@lucide/vue'

/**
 * The buckets the sidebar renders, in this order. A group with no visible items
 * is not rendered, so adding one costs an entry here and a label below.
 */
export enum NavigationGroup {
  Main = 'main',
}

export interface NavigationItem {
  title: string
  icon: Component
  to: string
  group: NavigationGroup
  /**
   * Hides the item when the user lacks it. Presentation only — the route
   * middleware is what enforces the page, and it looks the permission up in
   * AUTH_ROUTE_PERMISSIONS. Keep the two in agreement or the menu will offer a
   * link that 403s.
   */
  requiredPermission: Permission
}

// ─── Navigation items ─────────────────────────────────────────────────────────
// Add/remove items here. The sidebar and the site header derive from this list.
export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    title: 'Dashboard',
    icon: HouseIcon,
    to: '/',
    group: NavigationGroup.Main,
    requiredPermission: 'dashboard:read',
  },
]

export const NAVIGATION_GROUP_LABELS: Record<NavigationGroup, string> = {
  [NavigationGroup.Main]: 'Main',
}

// ─────────────────────────────────────────────────────────────────────────────
// MIGRACIÓN — la navegación de la plataforma.
//
// Vivía embebida en `app/components/AppSidebar.vue` como un array `ALL_GROUPS`.
// Aquí está tipada y en el sitio que le corresponde, con la misma forma que
// `NAVIGATION_ITEMS` de arriba: items planos, cada uno con su grupo.
//
// Va aparte de `NAVIGATION_ITEMS` a propósito. Aquel exige un `requiredPermission`
// declarado en `AUTH_ROUTE_PERMISSIONS` —y `core/permissions.test.ts` lo verifica
// entrada por entrada—, mientras que esto todavía filtra por rol. Fundirlos es la
// ola 1 de la fase 3: cada `roles: [...]` de aquí se convierte en un permiso.
//
// Los iconos son componentes de `@lucide/vue`, igual que en `NAVIGATION_ITEMS`.
// ─────────────────────────────────────────────────────────────────────────────

/** Los grupos del menú, en el orden en que se pintan. */
export enum LegacyNavGroup {
  General = 'general',
  Comercial = 'comercial',
  Operaciones = 'operaciones',
  Fronteras = 'fronteras',
  RegistrosCnd = 'registros-cnd',
  Comercializacion = 'comercializacion',
  Finanzas = 'finanzas',
  Alertas = 'alertas',
  Admin = 'admin',
}

/** El orden importa: es el de la barra lateral. */
export const LEGACY_NAV_GROUP_ORDER: LegacyNavGroup[] = [
  LegacyNavGroup.General,
  LegacyNavGroup.Comercial,
  LegacyNavGroup.Operaciones,
  LegacyNavGroup.Fronteras,
  LegacyNavGroup.RegistrosCnd,
  LegacyNavGroup.Comercializacion,
  LegacyNavGroup.Finanzas,
  LegacyNavGroup.Alertas,
  LegacyNavGroup.Admin,
]

export const LEGACY_NAV_GROUP_LABELS: Record<LegacyNavGroup, string> = {
  [LegacyNavGroup.General]: 'General',
  [LegacyNavGroup.Comercial]: 'Comercial',
  [LegacyNavGroup.Operaciones]: 'Operaciones',
  [LegacyNavGroup.Fronteras]: 'Fronteras Comerciales',
  [LegacyNavGroup.RegistrosCnd]: 'Registros CND/ASIC',
  [LegacyNavGroup.Comercializacion]: 'Comercialización',
  [LegacyNavGroup.Finanzas]: 'Finanzas',
  [LegacyNavGroup.Alertas]: 'Alertas',
  [LegacyNavGroup.Admin]: 'Admin',
}

/** Una entrada de submenú: solo destino y etiqueta, sin icono propio. */
export interface LegacyNavChild {
  to: string
  label: string
}

export interface LegacyNavItem {
  label: string
  /** Componente de `@lucide/vue`, p. ej. `ZapIcon`. */
  icon: Component
  group: LegacyNavGroup
  /** Ausente cuando el item solo despliega un submenú. */
  to?: string
  /**
   * Oculta la entrada a quien no tenga uno de estos roles. Solo presentación:
   * quien hace cumplir el acceso página por página es `auth.global.ts` contra
   * `AUTH_ROUTE_PERMISSIONS`, no esta lista de roles.
   */
  roles?: string[]
  /** Restricción a una persona concreta. Ver la nota sobre `/admin` en `~/config/permissions`. */
  requireEmail?: string
  children?: LegacyNavChild[]
}

const EMAIL_ADMIN_PLATAFORMA = 'juanjose@unergy.io'

export const LEGACY_NAV_ITEMS: LegacyNavItem[] = [
  // ── General ────────────────────────────────────────────────────────────────
  { label: 'Dashboard', icon: HouseIcon, to: '/dashboard', group: LegacyNavGroup.General },
  // Esta entrada reemplaza a las tres que había antes (Clientes, Proyectos y
  // Servicios). La base es el portafolio de plantas, y clientes y contratos son
  // formas de reagrupar ese mismo portafolio. Las rutas /clientes, /proyectos y
  // /servicios siguen vivas: solo salieron del menú.
  {
    label: 'Proyectos',
    icon: ZapIcon,
    to: '/servicios-unificado',
    group: LegacyNavGroup.General,
  },
  {
    label: 'Operadores de Red',
    icon: NetworkIcon,
    to: '/mem/operadores-red',
    group: LegacyNavGroup.General,
    roles: ['admin', 'operaciones', 'monitoreo'],
  },
  {
    label: 'Próximos a energizar',
    icon: ClockIcon,
    to: '/general/proximos-energizar',
    group: LegacyNavGroup.General,
  },
  {
    label: 'Retos Q',
    icon: FlagIcon,
    to: '/general/retos',
    group: LegacyNavGroup.General,
  },

  // ── Comercial ──────────────────────────────────────────────────────────────
  {
    label: 'Pipeline',
    icon: BriefcaseIcon,
    to: '/comercial',
    group: LegacyNavGroup.Comercial,
    roles: ['admin', 'comercial'],
  },

  // ── Operaciones ────────────────────────────────────────────────────────────
  {
    label: 'Generación Solar',
    icon: SunIcon,
    to: '/solar-live',
    group: LegacyNavGroup.Operaciones,
    roles: ['admin', 'operaciones', 'monitoreo'],
  },
  {
    label: 'Informes Mensuales',
    icon: FilePenIcon,
    to: '/operaciones/informes-mensuales',
    group: LegacyNavGroup.Operaciones,
    roles: ['admin', 'operaciones', 'monitoreo'],
  },
  {
    label: 'Gestión de Fallas',
    icon: WrenchIcon,
    to: '/fallas',
    group: LegacyNavGroup.Operaciones,
    roles: ['admin', 'operaciones', 'monitoreo'],
  },
  {
    label: 'Informe de Puesta en Marcha',
    icon: FileTextIcon,
    to: '/operaciones/informe-om',
    group: LegacyNavGroup.Operaciones,
    roles: ['admin', 'operaciones'],
  },
  {
    label: 'Pólizas',
    icon: ShieldIcon,
    to: '/operaciones/polizas',
    group: LegacyNavGroup.Operaciones,
    roles: ['admin', 'operaciones'],
  },

  // ── Fronteras Comerciales ──────────────────────────────────────────────────
  {
    label: 'General',
    icon: GlobeIcon,
    to: '/mem/fronteras',
    group: LegacyNavGroup.Fronteras,
    roles: ['admin', 'operaciones', 'monitoreo'],
  },
  {
    label: 'Reporte de Energía',
    icon: FilePenIcon,
    to: '/mem/reporte-energia',
    group: LegacyNavGroup.Fronteras,
    roles: ['admin', 'operaciones', 'monitoreo'],
  },

  // ── Registros CND/ASIC ─────────────────────────────────────────────────────
  {
    label: 'Proyectos en conexión',
    icon: FlagIcon,
    to: '/registros-cnd-asic',
    group: LegacyNavGroup.RegistrosCnd,
    roles: ['admin', 'operaciones'],
  },

  // ── Comercialización ───────────────────────────────────────────────────────
  {
    label: 'Cumplimiento PPA',
    icon: ShieldIcon,
    to: '/mem/cumplimiento',
    group: LegacyNavGroup.Comercializacion,
  },
  {
    label: 'Descubrimientos',
    icon: ZapIcon,
    to: '/mem/descubrimientos',
    group: LegacyNavGroup.Comercializacion,
  },
  {
    label: 'Garantías',
    icon: WalletIcon,
    to: '/garantias',
    group: LegacyNavGroup.Comercializacion,
  },
  {
    label: 'GESCON / ASIC',
    icon: BookIcon,
    to: '/mem/gescon',
    group: LegacyNavGroup.Comercializacion,
  },
  {
    label: 'Precio de Bolsa',
    icon: ChartLineIcon,
    to: '/mem/precio-bolsa',
    group: LegacyNavGroup.Comercializacion,
  },
  {
    label: 'Balance Energía',
    icon: ChartColumnIcon,
    to: '/mem/balance',
    group: LegacyNavGroup.Comercializacion,
  },
  {
    label: 'Clima & ENSO',
    icon: CloudIcon,
    to: '/mem/clima',
    group: LegacyNavGroup.Comercializacion,
  },

  // ── Finanzas ───────────────────────────────────────────────────────────────
  {
    label: 'Liquidaciones',
    icon: DollarSignIcon,
    group: LegacyNavGroup.Finanzas,
    roles: ['admin', 'liquidaciones'],
    children: [
      // Entrada directa: antes solo se llegaba a la pestaña de Facturación
      // entrando por Panel Contable → Minigranjas/Autoconsumo.
      { to: '/liquidaciones?tab=facturacion', label: 'Facturación de energía' },
      { to: '/finanzas/ids-proyectos', label: 'IDs proyectos' },
      { to: '/finanzas/contratos-energia', label: 'Contratos de energía' },
      { to: '/finanzas/despachos-liquidados', label: 'Despachos liquidados' },
      { to: '/finanzas/consumo', label: 'Consumo' },
      { to: '/finanzas/costos-comercializacion', label: 'Costos comercialización' },
      { to: '/finanzas/facturas-xm', label: 'Facturas de XM' },
      { to: '/finanzas/verificacion-costos', label: 'Verificación de costos' },
      { to: '/finanzas/estados-resultados', label: 'Estados de resultados' },
      { to: '/finanzas/mandatos', label: 'Mandatos' },
    ],
  },
  {
    label: 'Panel Contable',
    icon: CalculatorIcon,
    group: LegacyNavGroup.Finanzas,
    roles: ['admin', 'liquidaciones'],
    children: [
      { to: '/panel-contable', label: 'Panel contable' },
      { to: '/liquidaciones?tipo=minigranja', label: 'Minigranjas' },
      { to: '/liquidaciones?tipo=autoconsumo', label: 'Autoconsumo' },
      { to: '/liquidaciones/inversionista', label: 'Por Inversionista' },
    ],
  },
  {
    label: 'Herramientas liquidaciones',
    icon: WrenchIcon,
    group: LegacyNavGroup.Finanzas,
    roles: ['admin', 'liquidaciones'],
    children: [
      { to: '/validador-mandatos', label: 'Validador de Mandatos' },
      { to: '/finanzas/descarga-xm', label: 'Descarga de XM' },
    ],
  },
  {
    label: 'Costos',
    icon: CreditCardIcon,
    to: '/finanzas/costos',
    group: LegacyNavGroup.Finanzas,
    roles: ['admin', 'liquidaciones'],
  },

  // ── Alertas ────────────────────────────────────────────────────────────────
  {
    label: 'Centro de Alertas',
    icon: CircleAlertIcon,
    to: '/alertas',
    group: LegacyNavGroup.Alertas,
  },

  // ── Admin ──────────────────────────────────────────────────────────────────
  {
    label: 'Usuarios',
    icon: UsersIcon,
    to: '/admin/usuarios',
    group: LegacyNavGroup.Admin,
    requireEmail: EMAIL_ADMIN_PLATAFORMA,
  },
  {
    label: 'Diagnóstico',
    icon: LinkIcon,
    to: '/admin/diagnostico',
    group: LegacyNavGroup.Admin,
    requireEmail: EMAIL_ADMIN_PLATAFORMA,
  },
]
