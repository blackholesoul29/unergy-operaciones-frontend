/**
 * Recarga la pestaña cuando un chunk deja de existir.
 *
 * MIGRACIÓN — es el `window.addEventListener('vite:preloadError', …)` de
 * `main.js`, traducido al hook de Nuxt.
 *
 * El caso: cada deploy borra los archivos JS de la versión anterior. Si alguien
 * tenía la pestaña abierta desde antes, el `import()` perezoso de una vista falla
 * con 404 al navegar y la ruta se queda «pegada» sin ningún error visible.
 *
 * La marca en `sessionStorage` es un antibucle, y es la parte que no se puede
 * quitar: si tras recargar el archivo sigue sin existir —un deploy roto, no solo
 * desactualizado— esto reintentaría para siempre. Se limpia cuando la app monta
 * bien, para que un deploy futuro sobre esta misma pestaña pueda disparar su
 * propia recarga.
 */
import { logger } from '~/core/logger'

const MARCA = 'nuxt_chunk_reload_intentado'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:chunkError', ({ error }) => {
    logger.error('chunk-error', error)

    try {
      if (sessionStorage.getItem(MARCA)) return
      sessionStorage.setItem(MARCA, '1')
    } catch {
      // Almacenamiento no disponible (modo privado): se recarga igual, una vez
      // por navegación, que es preferible a dejar la ruta muerta.
    }

    reloadNuxtApp({ persistState: false })
  })

  // Si llegamos hasta aquí es porque el build actual cargó bien.
  nuxtApp.hook('app:mounted', () => {
    try {
      sessionStorage.removeItem(MARCA)
    } catch {
      /* nada que limpiar */
    }
  })
})
