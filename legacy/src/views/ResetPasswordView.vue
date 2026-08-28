<template>
  <div class="flex min-h-screen items-center justify-center" style="background-color: #2c2039">
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
      <div class="overflow-hidden rounded-2xl shadow-2xl" style="background-color: #fdfaf7">
        <div class="px-10 pt-10 pb-6 text-center">
          <img
            src="/logos/Stacked_Logo_pupura_energico.png"
            alt="Unergy"
            class="mx-auto h-16 w-auto object-contain"
          />
          <p class="mt-3 text-sm" style="color: #6b5a8a">Nueva contraseña</p>
        </div>

        <div class="px-10 pb-10">
          <!-- Success state -->
          <div v-if="success" class="space-y-3 text-center">
            <div
              class="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
              style="background: rgba(16, 185, 129, 0.1)"
            >
              <i class="pi pi-check text-2xl" style="color: #10b981" />
            </div>
            <p class="text-sm" style="color: #2c2039">
              Tu contraseña ha sido actualizada exitosamente.
            </p>
            <RouterLink
              to="/login"
              class="mt-3 inline-block rounded-lg px-6 py-2.5 text-sm font-bold"
              style="background-color: #915bd8; color: #fdfaf7"
            >
              Ir al inicio de sesión
            </RouterLink>
          </div>

          <!-- Form state -->
          <form v-else @submit.prevent="submit" class="space-y-4">
            <div>
              <label
                class="mb-1.5 block text-xs font-semibold tracking-wide uppercase"
                style="color: #2c2039"
                >Nueva contraseña</label
              >
              <input
                v-model="password"
                type="password"
                placeholder="Minimo 8 caracteres"
                required
                minlength="8"
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
                >Confirmar contraseña</label
              >
              <input
                v-model="confirm"
                type="password"
                placeholder="Repite la contraseña"
                required
                minlength="8"
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
                Guardando...
              </span>
              <span v-else>Restablecer contraseña</span>
            </button>

            <div class="text-center">
              <RouterLink to="/login" class="text-xs hover:underline" style="color: #915bd8">
                Volver al inicio de sesión
              </RouterLink>
            </div>
          </form>
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
import { useRoute } from 'vue-router'
import api from '@/api/client'

const route = useRoute()
const password = ref('')
const confirm = ref('')
const loading = ref(false)
const error = ref('')
const success = ref(false)

async function submit() {
  if (password.value !== confirm.value) {
    error.value = 'Las contraseñas no coinciden'
    return
  }
  if (password.value.length < 8) {
    error.value = 'La contraseña debe tener al menos 8 caracteres'
    return
  }

  loading.value = true
  error.value = ''
  try {
    await api.post('/auth/reset-password', {
      token: route.params.token,
      password: password.value,
    })
    success.value = true
  } catch (e) {
    error.value =
      e.response?.data?.detail || 'El enlace ha expirado o es invalido. Solicita uno nuevo.'
  } finally {
    loading.value = false
  }
}
</script>
