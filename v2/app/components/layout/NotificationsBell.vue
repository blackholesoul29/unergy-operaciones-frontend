<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import api from '~/core/client'
import { BellIcon, BellOffIcon, CircleAlertIcon, CircleCheckIcon, InfoIcon, TriangleAlertIcon } from '@lucide/vue'

const bellRef = ref(null)
const showNotifications = ref(false)
const unreadCount = ref(0)
const notifications = ref([])
let pollInterval = null

function toggleNotifications() {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) fetchNotifications()
}

async function fetchUnreadCount() {
  try {
    const { data } = await api.get('/notificaciones/count')
    unreadCount.value = data.count ?? data.unread ?? 0
  } catch { /* no crítico */ }
}

async function fetchNotifications() {
  try {
    const { data } = await api.get('/notificaciones', { params: { limit: 20 } })
    notifications.value = Array.isArray(data) ? data : (data.items ?? [])
  } catch { notifications.value = [] }
}

async function markAsRead(n) {
  if (n.leida) return
  try {
    await api.patch(`/notificaciones/${n.id}/leer`)
    n.leida = true
    if (unreadCount.value > 0) unreadCount.value--
  } catch { /* no crítico */ }
}

async function markAllRead() {
  try {
    await api.post('/notificaciones/leer-todas')
    notifications.value.forEach(n => { n.leida = true })
    unreadCount.value = 0
  } catch { /* no crítico */ }
}

function severityBg(sev) {
  const map = { critica: 'rgba(214,68,85,0.12)', alta: 'rgba(234,88,12,0.12)', media: 'rgba(240,192,64,0.12)', baja: 'rgba(16,185,129,0.12)' }
  return map[sev] || 'rgba(145,91,216,0.08)'
}
function severityColor(sev) {
  const map = { critica: '#D64455', alta: '#EA580C', media: '#CA8A04', baja: '#10B981' }
  return map[sev] || '#915BD8'
}
function severityIcon(sev) {
  const map = { critica: TriangleAlertIcon, alta: CircleAlertIcon, media: InfoIcon, baja: CircleCheckIcon }
  return map[sev] || BellIcon
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const diffMs = Date.now() - d
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Ahora'
  if (mins < 60) return `Hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Ayer'
  return `Hace ${days} días`
}

function handleClickOutside(e) {
  if (bellRef.value && !bellRef.value.contains(e.target)) showNotifications.value = false
}

onMounted(() => {
  fetchUnreadCount()
  pollInterval = setInterval(fetchUnreadCount, 60000)
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  if (pollInterval) clearInterval(pollInterval)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div ref="bellRef" class="relative">
    <button class="nb-icon-btn relative" title="Notificaciones" @click="toggleNotifications">
      <BellIcon class="size-[1em]" />
      <span v-if="unreadCount > 0" class="nb-badge">
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <div
v-if="showNotifications"
      class="absolute top-full mt-2 right-0 w-80 bg-white rounded-xl shadow-xl z-50 overflow-hidden"
      style="border: 1px solid #e8e0f0;">
      <div class="flex items-center justify-between px-4 py-3 border-b" style="border-color: #e8e0f0;">
        <span class="text-sm font-semibold" style="color: var(--color-unergy-deep);">Notificaciones</span>
        <button
v-if="unreadCount > 0" class="text-xs font-medium hover:underline"
          style="color: var(--color-unergy-purple);" @click="markAllRead">
          Marcar todas leídas
        </button>
      </div>
      <div class="max-h-80 overflow-y-auto">
        <div v-if="notifications.length === 0" class="py-8 text-center">
          <BellOffIcon class="text-2xl mb-2 block size-[1em]" style="color: #c4b8d4;" />
          <p class="text-xs" style="color: #6b5a8a;">Sin notificaciones</p>
        </div>
        <div
v-for="n in notifications" :key="n.id"
          class="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 border-b last:border-b-0"
          :style="{ borderColor: '#f3f0f7', backgroundColor: n.leida ? 'transparent' : 'rgba(145,91,216,0.04)' }"
          @click="markAsRead(n)">
          <div
class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
            :style="{ backgroundColor: severityBg(n.severidad), color: severityColor(n.severidad) }">
            <component :is="severityIcon(n.severidad)" class="text-xs size-[1em]" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm leading-snug" :style="{ color: 'var(--color-unergy-deep)', fontWeight: n.leida ? '400' : '600' }">{{ n.titulo || n.mensaje }}</p>
            <p v-if="n.titulo && n.mensaje" class="text-xs mt-0.5" style="color: #6b5a8a;">{{ n.mensaje }}</p>
            <p class="text-[10px] mt-1" style="color: #9b89b5;">{{ formatTimeAgo(n.created_at) }}</p>
          </div>
          <div v-if="!n.leida" class="w-2 h-2 rounded-full shrink-0 mt-2" style="background-color: var(--color-unergy-purple);" />
        </div>
      </div>
      <NuxtLink
to="/alertas"
        class="block text-center py-2.5 text-xs font-medium border-t hover:bg-gray-50"
        style="color: var(--color-unergy-purple); border-color: #e8e0f0;"
        @click="showNotifications = false">
        Ver todas las alertas
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.nb-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  color: #6b5a8a;
  transition: background 0.15s;
}
.nb-icon-btn:hover {
  background: rgba(145, 91, 216, 0.08);
  color: var(--color-unergy-purple);
}
.nb-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 16px;
  height: 16px;
  padding: 0 3px;
  border-radius: 8px;
  background: #D64455;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
</style>
