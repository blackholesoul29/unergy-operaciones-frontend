<template>
  <div class="monitoreo-wrapper">
    <div v-if="loading" class="monitoreo-loading">
      <div class="spin-ring" />
      <span>Cargando monitoreo…</span>
    </div>

    <iframe
      v-show="!loading"
      ref="iframeRef"
      :src="iframeSrc"
      class="monitoreo-iframe"
      title="Monitoreo de fallas"
      allow="clipboard-write"
      @load="onIframeLoad"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const iframeRef = ref(null)
const loading = ref(true)

// VITE_BACKEND_URL apunta a Railway (definido en Vercel env vars para producción)
const backendUrl = (import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000').replace(/\/$/, '')

const iframeSrc = computed(() => {
  const token = auth.token
  if (!token) return ''
  return `${backendUrl}/monitoreo?token=${encodeURIComponent(token)}`
})

function onIframeLoad() {
  loading.value = false
}

onMounted(() => {
  if (!auth.token) {
    loading.value = false
  }
})
</script>

<style scoped>
.monitoreo-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #1a1025;
}

.monitoreo-iframe {
  flex: 1;
  width: 100%;
  border: none;
  display: block;
}

.monitoreo-loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: #9b89b5;
  font-size: 14px;
}

.spin-ring {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(145, 91, 216, 0.2);
  border-top-color: #915BD8;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
