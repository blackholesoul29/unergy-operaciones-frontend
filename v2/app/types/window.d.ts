/**
 * MIGRACIÓN — Fase 1. El interceptor de axios del legacy publica el toast de
 * PrimeVue en `window` para poder avisar de un 403 desde fuera de un componente.
 * Este tipo existe para que ese puente no obligue a un `any`.
 *
 * Se borra junto con el interceptor, en la fase 3.
 */
import type { ToastMessageOptions } from 'primevue/toast'

declare global {
  interface Window {
    __primeToast?: (options: ToastMessageOptions) => void
  }
}

export {}
