<template>
  <div class="flex min-h-screen items-center justify-center" style="background-color: #2c2039">
    <!-- Background accent -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        class="absolute -top-40 -right-40 h-96 w-96 rounded-full opacity-10"
        style="background: #915bd8"
      ></div>
      <div
        class="absolute -bottom-40 -left-40 h-96 w-96 rounded-full opacity-10"
        style="background: #915bd8"
      ></div>
    </div>

    <div class="relative mx-4 w-full max-w-sm">
      <!-- Card -->
      <div class="overflow-hidden rounded-2xl shadow-2xl" style="background-color: #fdfaf7">
        <!-- Header with logo -->
        <div class="px-10 pt-10 pb-6 text-center">
          <img
            src="/logos/Stacked_Logo_pupura_energico.png"
            alt="Unergy"
            class="mx-auto h-16 w-auto object-contain"
          />
          <p class="mt-3 text-sm" style="color: #6b5a8a">Plataforma de Operaciones</p>
        </div>

        <!-- Form -->
        <div class="px-10 pb-10">
          <form @submit.prevent="submit" class="space-y-4">
            <div>
              <label
                class="mb-1.5 block text-xs font-semibold tracking-wide uppercase"
                style="color: #2c2039"
                >Correo</label
              >
              <input
                v-model="email"
                type="email"
                placeholder="tu@unergy.io"
                required
                class="w-full rounded-lg px-4 py-2.5 text-sm transition-all outline-none"
                style="border: 1.5px solid #d4c8e8; background: white; color: #2c2039"
                onfocus="this.style.borderColor = '#915BD8'"
                onblur="this.style.borderColor = '#d4c8e8'"
              />
            </div>

            <div>
              <label
                class="mb-1.5 block text-xs font-semibold tracking-wide uppercase"
                style="color: #2c2039"
                >Contraseña</label
              >
              <input
                v-model="password"
                type="password"
                placeholder="••••••••"
                required
                class="w-full rounded-lg px-4 py-2.5 text-sm transition-all outline-none"
                style="border: 1.5px solid #d4c8e8; background: white; color: #2c2039"
                onfocus="this.style.borderColor = '#915BD8'"
                onblur="this.style.borderColor = '#d4c8e8'"
              />
            </div>

            <div
              v-if="error"
              class="rounded-lg px-3 py-2 text-xs"
              style="background: #fde8e8; color: #c0392b"
            >
              {{ error }}
            </div>

            <button
              type="submit"
              :disabled="loading"
              class="mt-2 w-full rounded-lg py-3 text-sm font-bold tracking-wide transition-all"
              style="background-color: #915bd8; color: #fdfaf7"
              onmouseover="if (!this.disabled) this.style.backgroundColor = '#7a46c0'"
              onmouseout="if (!this.disabled) this.style.backgroundColor = '#915BD8'"
            >
              <span v-if="loading" class="flex items-center justify-center gap-2">
                <i class="pi pi-spin pi-spinner text-xs" />
                Ingresando...
              </span>
              <span v-else>Ingresar</span>
            </button>
          </form>

          <div class="mt-4 text-center">
            <RouterLink
              to="/forgot-password"
              class="text-xs hover:underline"
              style="color: #915bd8"
            >
              ¿Olvidaste tu contraseña?
            </RouterLink>
          </div>
        </div>
      </div>

      <p class="mt-6 text-center text-xs" style="color: rgba(253, 250, 247, 0.35)">
        © {{ new Date().getFullYear() }} Unergy · Operaciones
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  loading.value = true
  error.value = ''
  try {
    await auth.login(email.value, password.value)
    router.push('/dashboard')
  } catch (e) {
    error.value = e.response?.data?.detail || e.message || 'Error de conexión'
  } finally {
    loading.value = false
  }
}
</script>
