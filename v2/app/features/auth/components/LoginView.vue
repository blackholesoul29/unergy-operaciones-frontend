<template>
  <div class="min-h-screen flex items-center justify-center" style="background-color: var(--color-unergy-deep);">
    <!-- Background accent -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10" style="background: var(--color-unergy-purple);"></div>
      <div class="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10" style="background: var(--color-unergy-purple);"></div>
    </div>

    <div class="relative w-full max-w-sm mx-4">
      <!-- Card -->
      <div class="rounded-2xl shadow-2xl overflow-hidden" style="background-color: var(--color-unergy-avena);">
        <!-- Header with logo -->
        <div class="px-10 pt-10 pb-6 text-center">
          <img src="/logos/Stacked_Logo_pupura_energico.png" alt="Unergy" class="h-16 w-auto mx-auto object-contain" />
          <p class="text-sm mt-3" style="color: #6b5a8a;">Plataforma de Operaciones</p>
        </div>

        <!-- Form -->
        <div class="px-10 pb-10">
          <form @submit.prevent="submit" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style="color: var(--color-unergy-deep);">Correo</label>
              <input
                v-model="email"
                type="email"
                placeholder="tu@unergy.io"
                required
                class="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                style="border: 1.5px solid #d4c8e8; background: white; color: var(--color-unergy-deep);"
                onfocus="this.style.borderColor='var(--color-unergy-purple)'"
                onblur="this.style.borderColor='#d4c8e8'"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style="color: var(--color-unergy-deep);">Contraseña</label>
              <input
                v-model="password"
                type="password"
                placeholder="••••••••"
                required
                class="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                style="border: 1.5px solid #d4c8e8; background: white; color: var(--color-unergy-deep);"
                onfocus="this.style.borderColor='var(--color-unergy-purple)'"
                onblur="this.style.borderColor='#d4c8e8'"
              />
            </div>

            <div v-if="error" class="text-xs px-3 py-2 rounded-lg" style="background: #fde8e8; color: #c0392b;">
              {{ error }}
            </div>

            <button
              type="submit"
              :disabled="loading"
              class="w-full py-3 rounded-lg text-sm font-bold tracking-wide transition-all mt-2"
              style="background-color: var(--color-unergy-purple); color: var(--color-unergy-avena);"
              onmouseover="if(!this.disabled) this.style.backgroundColor='#7a46c0'"
              onmouseout="if(!this.disabled) this.style.backgroundColor='var(--color-unergy-purple)'"
            >
              <span v-if="loading" class="flex items-center justify-center gap-2">
                <LoaderCircleIcon class="text-xs size-[1em] animate-spin" />
                Ingresando...
              </span>
              <span v-else>Ingresar</span>
            </button>
          </form>

          <div class="text-center mt-4">
            <RouterLink to="/forgot-password" class="text-xs hover:underline" style="color: var(--color-unergy-purple);">
              ¿Olvidaste tu contraseña?
            </RouterLink>
          </div>
        </div>
      </div>

      <p class="text-center text-xs mt-6" style="color: rgba(253,250,247,0.35);">
        © {{ new Date().getFullYear() }} Unergy · Operaciones
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { normalizeError } from '~/core/errors'
import { LoaderCircleIcon } from '@lucide/vue'

const router = useRouter()
const { signIn } = useAuth()

const email    = ref('')
const password = ref('')
const loading  = ref(false)
const error    = ref('')

async function submit() {
  loading.value = true
  error.value = ''
  try {
    await signIn({ email: email.value, password: password.value })
    router.push('/dashboard')
  } catch (e) {
    error.value = normalizeError(e).message
  } finally {
    loading.value = false
  }
}
</script>
