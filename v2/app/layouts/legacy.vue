<script setup>
/**
 * MIGRACIÓN — Fase 1. El shell de la plataforma, traducido desde
 * `legacy/src/App.vue`. Cambios respecto al original, todos mecánicos:
 *
 *   - `<RouterView />` → `<slot />`, que es como un layout de Nuxt recibe la página.
 *   - Las ramas de login y de app móvil salieron de aquí: son sus propios layouts
 *     (`legacy-blank.vue`), que es como Nuxt modela "esta página no lleva chrome".
 *   - `routeReady` desapareció: dependía de que `route.name` existiera antes de
 *     que el router resolviera. En Nuxt el layout solo se monta con la ruta ya
 *     resuelta.
 *   - `isSolar` mira `route.path` en vez de `route.name`: los nombres de ruta los
 *     genera Nuxt desde el árbol de `app/pages/`, así que 'SolarLive' ya no existe.
 *
 * Se retira en la fase 3, ola 1, cuando el shell pase a `layouts/default.vue`.
 */
import AppSidebar from '~/components/AppSidebar.vue'
import { useSidebar } from '~/composables/useSidebar'

const route = useRoute()
const { mobileOpen, toggle, collapsed, toggleCollapsed } = useSidebar()

const isSolar = computed(() => route.path === '/solar-live')
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-gray-100">
    <AppSidebar />
    <div class="flex flex-col flex-1 overflow-hidden">
      <!-- Menú móvil (solo en <lg cuando el sidebar está cerrado) -->
      <button
        v-if="!mobileOpen"
        class="lg:hidden fixed top-3 left-3 z-30 w-9 h-9 rounded-lg bg-white shadow-md border border-gray-200 flex items-center justify-center"
        style="color: #2c2039"
        title="Menú"
        @click="toggle"
      >
        <i class="pi pi-bars" />
      </button>

      <!-- Reabrir el sidebar (escritorio, cuando está oculto) -->
      <button
        v-if="collapsed"
        class="hidden lg:flex sb-reopen"
        title="Mostrar barra lateral"
        @click="toggleCollapsed"
      >
        <i class="pi pi-angle-double-right" />
      </button>

      <main
        :class="
          isSolar
            ? 'flex-1 overflow-hidden p-0'
            : 'flex-1 overflow-y-auto p-4 pt-14 sm:p-5 sm:pt-14 lg:p-6 lg:pt-6'
        "
      >
        <slot />
      </main>
    </div>
  </div>
</template>

<style>
.sb-reopen {
  position: fixed;
  top: 14px;
  left: 0;
  z-index: 40;
  width: 26px;
  height: 38px;
  padding-left: 2px;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #915bd8, #4c1d95);
  color: #fff;
  border: none;
  cursor: pointer;
  border-radius: 0 10px 10px 0;
  box-shadow: 0 4px 14px rgba(76, 29, 149, 0.35);
  transition:
    width 0.15s ease,
    padding-left 0.15s ease;
}
.sb-reopen:hover {
  width: 32px;
  padding-left: 4px;
}
.sb-reopen .pi {
  font-size: 13px;
}
</style>
