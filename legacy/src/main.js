import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import { definePreset } from '@primevue/themes'

const UnergPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{violet.50}',
      100: '{violet.100}',
      200: '{violet.200}',
      300: '{violet.300}',
      400: '{violet.400}',
      500: '#915BD8',
      600: '#7c4ec0',
      700: '#6a3faa',
      800: '#593393',
      900: '#4a2878',
      950: '#31175a',
    },
  },
})
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import Tooltip from 'primevue/tooltip'
import 'primeicons/primeicons.css'
import './assets/main.css'

import App from './App.vue'
import router from './router'
import InfoField from './components/InfoField.vue'
import PageHeader from './components/PageHeader.vue'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: UnergPreset,
    options: { darkModeSelector: '.dark', cssLayer: false },
  },
})
app.use(ToastService)
app.use(ConfirmationService)
app.directive('tooltip', Tooltip)
app.component('InfoField', InfoField)
app.component('PageHeader', PageHeader)

const montar = () => app.mount('#app')

router.isReady().then(
  () => {
    montar()
    // Si llegamos hasta acá es porque el build actual sí cargó bien -- limpiar
    // la marca para que un deploy FUTURO (mientras esta pestaña siga abierta)
    // pueda disparar su propia recarga automática, en vez de quedar bloqueado
    // por una recarga de un deploy anterior ya resuelta.
    sessionStorage.removeItem('vite_reload_intentado')
  },
  () => {
    // La navegación inicial falló (caso típico: el chunk de la vista lo borró un
    // deploy). isReady() RECHAZA en ese escenario, así que sin este segundo
    // callback la app no se montaba nunca y quedaba la pantalla en blanco --
    // ni siquiera el fallback de router.onError (/dashboard) tenía dónde
    // renderizar. Montamos igual. NO limpiamos la marca: si esta carga viene de
    // una recarga automática, el anti-bucle tiene que seguir puesto.
    montar()
  },
)

// Vite dispara esto cuando falla la carga de un módulo/CSS cargado con import()
// perezoso (pestaña abierta desde antes de un deploy, pidiendo un archivo que
// Vercel ya reemplazó). Recarga UNA sola vez para tomar la versión nueva --
// sin este guardado, si el archivo sigue sin existir tras recargar (deploy
// roto, no solo desactualizado), esto reintentaría para siempre.
window.addEventListener('vite:preloadError', () => {
  if (sessionStorage.getItem('vite_reload_intentado')) return
  sessionStorage.setItem('vite_reload_intentado', '1')
  window.location.reload()
})
