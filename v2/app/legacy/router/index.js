import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '~/stores/auth'

const routes = [
  // ── Públicas ─────────────────────────────────────────────────────
  { path: '/login',                   name: 'Login',          component: () => import('~/legacy/views/LoginView.vue'),           meta: { public: true } },
  { path: '/forgot-password',         name: 'ForgotPassword', component: () => import('~/legacy/views/ForgotPasswordView.vue'),  meta: { public: true } },
  { path: '/reset-password/:token',   name: 'ResetPassword',  component: () => import('~/legacy/views/ResetPasswordView.vue'),   meta: { public: true } },

  // ── App móvil (PWA) — aparte de la plataforma ────────────────────
  { path: '/m',           redirect: '/m/solar' },
  { path: '/m/login',     name: 'MobileLogin',  component: () => import('~/legacy/mobile/MobileLoginView.vue'), meta: { public: true, mobile: true } },
  { path: '/m/solar',     name: 'MobileSolar',  component: () => import('~/legacy/mobile/MobileSolarView.vue'),  meta: { mobile: true } },
  { path: '/m/fallas',    name: 'MobileFallas', component: () => import('~/legacy/mobile/MobileFallasView.vue'), meta: { mobile: true } },
  { path: '/m/coordinador', name: 'MobileCoordinador', component: () => import('~/legacy/mobile/MobileCoordinadorFallasView.vue'), meta: { mobile: true, roles: ['coordinador', 'admin'] } },
  { path: '/m/tecnico',     name: 'MobileTecnico',     component: () => import('~/legacy/mobile/MobileTecnicoFallasView.vue'),    meta: { mobile: true, roles: ['tecnico'] } },
  { path: '/m/resumen',   name: 'MobileResumen', component: () => import('~/legacy/mobile/MobileResumenView.vue'), meta: { mobile: true } },
  { path: '/m/reporte-cgm', name: 'MobileReporteCGM', component: () => import('~/legacy/mobile/MobileReporteCGMView.vue'), meta: { mobile: true } },

  // ── General ──────────────────────────────────────────────────────
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard',    name: 'Dashboard',    component: () => import('~/legacy/views/DashboardView.vue') },
  { path: '/clientes',     name: 'Clientes',     component: () => import('~/legacy/views/Clientes/ClientesListView.vue') },
  { path: '/clientes/:id', name: 'ClienteDetalle', component: () => import('~/legacy/views/Clientes/ClienteDetailView.vue') },
  { path: '/proyectos',    name: 'Proyectos',    component: () => import('~/legacy/views/Proyectos/ProyectosListView.vue') },
  { path: '/proyectos/:id',          name: 'ProyectoDetalle', component: () => import('~/legacy/views/Proyectos/ProyectoDetailView.vue') },
  { path: '/proyectos/:id/ppa',      name: 'ProyectoPPA',     component: () => import('~/legacy/views/Servicios/PPAView.vue') },
  { path: '/proyectos/:id/operacion',       name: 'ProyectoOperacion',       component: () => import('~/legacy/views/Servicios/OperacionView.vue') },
  { path: '/proyectos/:id/representacion',  name: 'ProyectoRepresentacion',  component: () => import('~/legacy/views/Servicios/RepresentacionView.vue') },
  { path: '/servicios',    name: 'Servicios',    component: () => import('~/legacy/views/Contratos/ContratosListView.vue') },
  { path: '/servicios-unificado', name: 'ServiciosUnificado', component: () => import('~/legacy/views/Servicios/ServiciosUnificadoView.vue') },
  { path: '/contratos/:id',name: 'ContratoDetalle', component: () => import('~/legacy/views/Contratos/ContratoDetailView.vue') },
  { path: '/general/proximos-energizar', name: 'ProximosEnergizar', component: () => import('~/legacy/views/General/ProximosEnergizarView.vue') },
  { path: '/general/retos',     name: 'Retos',        component: () => import('~/legacy/views/Retos/RetosListView.vue') },
  { path: '/general/retos/:id', name: 'RetoDetalle',  component: () => import('~/legacy/views/Retos/RetoDetailView.vue') },

  // ── Comercial ────────────────────────────────────────────────────
  // El drawer de una oferta se abre con ?oferta=<id> sobre esta misma ruta, para
  // que el enlace se pueda compartir y sobreviva un F5.
  { path: '/comercial', name: 'Comercial', component: () => import('~/legacy/views/Comercial/ComercialView.vue'), meta: { roles: ['admin', 'comercial'] } },
  { path: '/comercial/oportunidades/:id', name: 'OportunidadDetalle', component: () => import('~/legacy/views/Comercial/OportunidadDetailView.vue'), meta: { roles: ['admin', 'comercial'] } },

  // ── Operaciones ──────────────────────────────────────────────────
  { path: '/operaciones/informes-mensuales', name: 'InformesMensuales', component: () => import('~/legacy/views/Operaciones/InformesMensualesView.vue'), meta: { roles: ['admin', 'operaciones', 'monitoreo'] } },
  { path: '/informes/:id', name: 'InformeDetalle', component: () => import('~/legacy/views/Operaciones/InformeDetailView.vue'), meta: { roles: ['admin', 'operaciones', 'monitoreo'] } },
  { path: '/operaciones/gestion-fallas', name: 'GestionFallas', component: () => import('~/legacy/views/Operaciones/GestionFallasView.vue'), meta: { roles: ['admin', 'operaciones', 'monitoreo'] } },
  { path: '/operaciones/informe-om', name: 'InformeOM', component: () => import('~/legacy/views/Operaciones/InformeOMView.vue'), meta: { roles: ['admin', 'operaciones'] } },
  { path: '/operaciones/polizas', name: 'Polizas', component: () => import('~/legacy/views/Operaciones/PolizasView.vue'), meta: { roles: ['admin', 'operaciones'] } },
  { path: '/fallas',       name: 'Fallas',       component: () => import('~/legacy/views/Fallas/MonitoreoView.vue'),   meta: { roles: ['admin', 'operaciones', 'monitoreo'] } },
  { path: '/fallas/lista', redirect: '/fallas' },
  { path: '/fallas/:id',   name: 'FallaDetalle', component: () => import('~/legacy/views/Fallas/FallaDetailView.vue'), meta: { roles: ['admin', 'operaciones', 'monitoreo'] } },
  { path: '/solar-live',   name: 'SolarLive',   component: () => import('~/legacy/views/Solar/SolarLiveView.vue'),          meta: { roles: ['admin', 'operaciones', 'monitoreo'] } },

  // ── Alertas ──────────────────────────────────────────────────────
  { path: '/alertas',             name: 'Alertas',            component: () => import('~/legacy/views/Alertas/AlertasView.vue'),           meta: { roles: ['admin', 'operaciones', 'monitoreo'] } },
  { path: '/alertas/contratos-ppa', name: 'AlertasContratosPPA', component: () => import('~/legacy/views/Alertas/AlertasContratosPPAView.vue'), meta: { roles: ['admin', 'operaciones'] } },

  // ── Finanzas ─────────────────────────────────────────────────────
  { path: '/liquidaciones',                  name: 'Liquidaciones',                  component: () => import('~/legacy/views/Liquidaciones/LiquidacionesView.vue'),                     meta: { roles: ['admin', 'liquidaciones'] } },
  { path: '/liquidaciones/inversionista',    redirect: '/liquidaciones?tab=inversionistas' },
  { path: '/liquidaciones/cargar-excel',     redirect: '/liquidaciones' },
  { path: '/finanzas/costos',             name: 'Costos',                     component: () => import('~/legacy/views/Finanzas/CostosView.vue'),                                meta: { roles: ['admin', 'liquidaciones'] } },
  { path: '/validador-mandatos',          name: 'ValidadorMandatos',          component: () => import('~/legacy/views/Finanzas/ValidadorMandatosView.vue'),                     meta: { roles: ['admin', 'liquidaciones'] } },
  { path: '/finanzas/descarga-xm',     name: 'DescargaXM',     component: () => import('~/legacy/views/Finanzas/DescargaXMView.vue'),        meta: { roles: ['admin', 'liquidaciones'] } },
  { path: '/finanzas/ids-proyectos',   name: 'IdsProyectos',   component: () => import('~/legacy/views/Finanzas/IdsProyectosView.vue'),      meta: { roles: ['admin', 'liquidaciones'] } },
  { path: '/finanzas/contratos-energia', name: 'ContratosEnergia', component: () => import('~/legacy/views/Finanzas/ContratosEnergiaView.vue'), meta: { roles: ['admin', 'liquidaciones'] } },
  { path: '/finanzas/despachos-liquidados', name: 'DespachosLiquidados', component: () => import('~/legacy/views/Finanzas/DespachosLiquidadosView.vue'), meta: { roles: ['admin', 'liquidaciones'] } },
  { path: '/finanzas/consumo', name: 'Consumo', component: () => import('~/legacy/views/Finanzas/ConsumoView.vue'), meta: { roles: ['admin', 'liquidaciones'] } },
  { path: '/finanzas/costos-comercializacion', name: 'CostosComercializacion', component: () => import('~/legacy/views/Finanzas/CostosComercializacionView.vue'), meta: { roles: ['admin', 'liquidaciones'] } },
  { path: '/finanzas/facturas-xm', name: 'FacturasXm', component: () => import('~/legacy/views/Finanzas/FacturasXmView.vue'), meta: { roles: ['admin', 'liquidaciones'] } },
  { path: '/finanzas/verificacion-costos', name: 'VerificacionCostos', component: () => import('~/legacy/views/Finanzas/VerificacionCostosView.vue'), meta: { roles: ['admin', 'liquidaciones'] } },
  { path: '/finanzas/estados-resultados', name: 'EstadosResultados', component: () => import('~/legacy/views/Finanzas/EstadosResultadosView.vue'), meta: { roles: ['admin', 'liquidaciones'] } },
  { path: '/finanzas/mandatos', name: 'MandatosFinanzas', component: () => import('~/legacy/views/Finanzas/MandatosFinanzas.vue'), meta: { roles: ['admin', 'liquidaciones'] } },
  { path: '/panel-contable',              name: 'PanelContable',              component: () => import('~/legacy/views/PanelContable/PanelContableView.vue'),                    meta: { roles: ['admin', 'liquidaciones'] } },
  { path: '/liquidaciones/minigranjas',   redirect: '/liquidaciones' },
  { path: '/liquidaciones/:id',           name: 'LiquidacionDetalle',         component: () => import('~/legacy/views/Liquidaciones/LiquidacionDetailView.vue'),           meta: { roles: ['admin', 'liquidaciones'] } },
  { path: '/liquidaciones/:id/pdf',       name: 'LiquidacionPdf',             component: () => import('~/legacy/views/Liquidaciones/LiquidacionPdfView.vue'),              meta: { roles: ['admin', 'liquidaciones'] } },
  { path: '/garantias',                   name: 'Garantias',                  component: () => import('~/legacy/views/Garantias/GarantiasView.vue'),                       meta: { roles: ['admin', 'liquidaciones'] } },

  // ── MEM ──────────────────────────────────────────────────────────
  { path: '/mem/gescon',       name: 'MemGescon',       component: () => import('~/legacy/views/MEM/GesconView.vue'),        meta: { roles: ['admin', 'operaciones'] } },
  { path: '/mem/fronteras',    name: 'MemFronteras',    component: () => import('~/legacy/views/MEM/FronterasView.vue'),     meta: { roles: ['admin', 'operaciones'] } },
  { path: '/mem/reporte-energia', name: 'MemReporteEnergia', component: () => import('~/legacy/views/MEM/ReporteEnergiaView.vue'), meta: { roles: ['admin', 'operaciones'] } },
  { path: '/mem/operadores-red', name: 'MemOperadoresRed', component: () => import('~/legacy/views/MEM/OperadoresRedView.vue'), meta: { roles: ['admin', 'operaciones'] } },
  { path: '/mem/operadores-red/:id', name: 'MemOperadorRedDetalle', component: () => import('~/legacy/views/MEM/OperadorRedDetailView.vue'), meta: { roles: ['admin', 'operaciones'] } },
  { path: '/mem/precio-bolsa', name: 'MemPrecioBolsa',  component: () => import('~/legacy/views/MEM/PrecioBolsaView.vue') },
  { path: '/mem/balance',      name: 'MemBalance',      component: () => import('~/legacy/views/MEM/BalanceView.vue') },
  { path: '/mem/clima',        name: 'MemClima',        component: () => import('~/legacy/views/MEM/ClimaView.vue') },
  { path: '/mem/cumplimiento', name: 'MemCumplimiento', component: () => import('~/legacy/views/MEM/CumplimientoV2View.vue') },
  { path: '/mem/descubrimientos', name: 'MemDescubrimientos', component: () => import('~/legacy/views/MEM/DescubrimientosView.vue') },
  { path: '/mem/cumplimiento-v2', redirect: '/mem/cumplimiento' },

  // ── Registros CND/ASIC ───────────────────────────────────────────
  { path: '/registros-cnd-asic',     name: 'RegistrosCndAsic',       component: () => import('~/legacy/views/RegistrosCndAsic/RegistrosCndAsicListView.vue'), meta: { roles: ['admin', 'operaciones'] } },
  { path: '/registros-cnd-asic/:proyectoId', name: 'RegistroCndAsicDetalle', component: () => import('~/legacy/views/RegistrosCndAsic/RegistroCndAsicDetailView.vue'), meta: { roles: ['admin', 'operaciones'] } },

  // ── Admin ────────────────────────────────────────────────────────
  { path: '/admin/usuarios',    name: 'AdminUsuarios',   component: () => import('~/legacy/views/Admin/AdminUsuariosView.vue'),     meta: { roles: ['admin', 'operaciones'] } },
  { path: '/admin/diagnostico', name: 'AdminDiagnostico',component: () => import('~/legacy/views/Admin/DiagnosticoEnlacesView.vue'), meta: { roles: ['admin'], requireEmail: 'juanjose@unergy.io' } },

  // ── Fallback ─────────────────────────────────────────────────────
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Cada deploy a Vercel borra los archivos JS de la versión anterior. Si el
// usuario tenía una pestaña abierta desde antes del deploy, el import()
// perezoso de una vista falla (404) al navegar -- la ruta se queda "pegada"
// sin ningún error visible, hasta que refresca a mano. El listener de
// `vite:preloadError` en main.js recarga para tomar los archivos nuevos; aquí
// solo evitamos que la ruta quede completamente muerta si esa recarga no llega
// a dispararse por algún motivo (navegamos al dashboard en vez de no hacer nada).
// Una sola vez por carga de página: si el propio fallback también falla (su chunk
// tampoco existe, o beforeEach lo reenvía a otra ruta rota), currentRoute nunca
// avanza -- la condición de abajo seguiría siendo verdadera y quedaríamos en un
// bucle de navegaciones fallidas, cada una pidiendo un archivo inexistente. La
// bandera vive en el módulo, así que una recarga la reinicia.
let fallbackIntentado = false
router.onError((_err, to) => {
  if (fallbackIntentado) return
  if (to.fullPath !== router.currentRoute.value.fullPath) {
    fallbackIntentado = true
    router.push('/dashboard').catch(() => {})
  }
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  // Modo preview local (solo DEV): ?preview=tecnico o ?preview=coordinador
  if (import.meta.env.DEV && to.query.preview) {
    auth.previewLogin(String(to.query.preview))
  }

  // No autenticado → login (la app móvil tiene su propio login)
  if (!to.meta.public && !auth.isAuthenticated) return to.meta.mobile ? '/m/login' : '/login'

  // Ya logueado intentando ir a un login → su home correspondiente
  if (to.path === '/m/login' && auth.isAuthenticated) {
    const rol = auth.role
    if (rol === 'coordinador') return '/m/coordinador'
    if (rol === 'tecnico') return '/m/tecnico'
    return '/m/solar'
  }
  if (to.path === '/login' && auth.isAuthenticated) return '/dashboard'

  // Roles móviles dedicados: redirigir /m/solar y /m/fallas al home correcto
  if (to.meta.mobile && auth.isAuthenticated) {
    const rol = auth.role
    if (rol === 'coordinador' && to.path === '/m/solar') return '/m/coordinador'
    if (rol === 'tecnico'     && to.path === '/m/solar') return '/m/tecnico'
    // Bloquear rutas de coordinador/tecnico a quien no tenga ese rol
    if (to.name === 'MobileCoordinador' && rol !== 'coordinador' && rol !== 'admin') return '/m/solar'
    if (to.name === 'MobileTecnico'     && rol !== 'tecnico')                         return '/m/solar'
  }

  // Autenticado pero sin datos de usuario (localStorage.user borrado mientras
  // el JWT sigue vivo) → forzar re-login para reconstruir el estado
  if (to.meta.roles && auth.isAuthenticated && !auth.user) return '/login'

  // Verificación de rol (rutas web)
  if (to.meta.roles && to.meta.mobile !== true && !auth.can(...to.meta.roles)) return '/dashboard'

  // Verificación de email específico (rutas admin restringidas)
  if (to.meta.requireEmail && auth.user?.email !== to.meta.requireEmail) return '/dashboard'
})

export default router
