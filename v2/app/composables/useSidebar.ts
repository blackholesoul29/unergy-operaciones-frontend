/**
 * Estado del sidebar: overlay móvil, colapso en escritorio y grupos desplegados.
 *
 * MIGRACIÓN — el original tenía tres `ref` **a nivel de módulo** y leía
 * `localStorage` al importar. En una SPA eso funciona (los módulos son
 * singletons y sirven de estado global), pero es justo lo que `AGENTS.md`
 * prohíbe: bajo SSR los módulos son singletons *por proceso*, no por request.
 * Aquí no había fuga de datos —es estado de UI, no del usuario— pero el
 * `localStorage` al importar sí revienta en el primer render de servidor, y la
 * fase 3 enciende SSR página por página.
 *
 * `useState` da lo mismo sin la mina: una instancia por request en el servidor,
 * compartida en el cliente. La API pública no cambió.
 */
const CLAVE_COLAPSADO = 'sb:collapsed'

export function useSidebar() {
  // ── Overlay móvil ──────────────────────────────────────────────────────────
  const mobileOpen = useState('sidebar:mobile-open', () => false)

  // ── Colapso en escritorio (ocultar para concentrarse) ──────────────────────
  // Se conserva el formato '1'/'0' del legacy: cambiarlo a 'true'/'false' le
  // borraría la preferencia a todo el mundo la primera vez que entre.
  const collapsed = useLocalStorage(CLAVE_COLAPSADO, false, {
    serializer: {
      read: (valor: string) => valor === '1',
      write: (valor: boolean) => (valor ? '1' : '0'),
    },
  })

  // ── Grupos desplegados ─────────────────────────────────────────────────────
  // No se persiste a propósito: en cada carga todas las secciones aparecen
  // recogidas, y el usuario despliega lo que necesite durante la sesión.
  //
  // Lista y no `Set` porque `useState` se serializa al payload de SSR y un `Set`
  // no sobrevive ese viaje.
  const expandedGroups = useState<string[]>('sidebar:expanded-groups', () => [])

  function toggle(): void {
    mobileOpen.value = !mobileOpen.value
  }

  function toggleCollapsed(): void {
    collapsed.value = !collapsed.value
  }

  function isGroupCollapsed(label: string): boolean {
    return !expandedGroups.value.includes(label)
  }

  function toggleGroup(label: string): void {
    expandedGroups.value = isGroupCollapsed(label)
      ? [...expandedGroups.value, label]
      : expandedGroups.value.filter((grupo) => grupo !== label)
  }

  return {
    mobileOpen,
    toggle,
    collapsed,
    toggleCollapsed,
    isGroupCollapsed,
    toggleGroup,
  }
}
