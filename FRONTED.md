# Plataforma Operaciones Unergy — Frontend

## Qué es esto
Dashboard web para el equipo interno de operaciones de Unergy. Permite gestionar proyectos solares, clientes, fallas, liquidaciones y más.

## Stack
- **Vue 3** (Composition API + `<script setup>`)
- **Vite** (bundler)
- **PrimeVue 4** (componentes UI — Aura theme)
- **Pinia** (estado global)
- **Vue Router 4** (rutas)
- **Axios** (llamadas a la API)
- **Tailwind CSS** (estilos utilitarios)

## URLs
- **Producción:** https://frontend-taupe-six-252g9aw47x.vercel.app
- **API backend:** https://backend-production-63d8.up.railway.app
- **Dev local:** http://localhost:5173 (proxea `/api` a localhost:8000)

## Estructura de carpetas
```
src/
├── main.js              # Inicializa Vue, PrimeVue, Pinia, Router
├── App.vue              # Layout raíz: sidebar + topbar + <RouterView>
├── api/
│   └── client.js        # Axios con JWT automático + redirect 401
├── stores/
│   └── auth.js          # useAuthStore: login, logout, token, user, role, can()
├── router/
│   └── index.js         # Rutas + guard de autenticación
└── views/
    ├── LoginView.vue
    ├── DashboardView.vue
    ├── Clientes/
    │   ├── ClientesListView.vue
    │   └── ClienteForm.vue
    ├── Proyectos/
    │   ├── ProyectosListView.vue
    │   ├── ProyectoDetailView.vue
    │   └── ProyectoForm.vue
    ├── Fallas/
    │   └── FallasListView.vue
    └── Liquidaciones/
        └── LiquidacionesListView.vue
```

## Colores de marca (Unergy)
```js
purple:  '#915BD8'   // Púrpura Energético — color principal, botones, activos
deep:    '#2C2039'   // Púrpura Profundo — sidebar, textos oscuros
avena:   '#FDFAF7'   // Avena — fondo general, fondos claros
yellow:  '#F6FF72'   // Amarillo Solar — acentos, CTAs especiales
```

Usa siempre estos colores con `style=""` o las clases `text-unergy-purple`, `bg-unergy-deep`, etc. (definidas en tailwind.config.js).

## Logos disponibles (en /public/logos/)
- `Logo_avena.png` — logo horizontal blanco (para fondos oscuros)
- `Logo_lineal_purpura_energico.png` — logo horizontal púrpura
- `Stacked_Logo_pupura_energico.png` — logo apilado púrpura

## Cómo agregar una vista nueva

### 1. Crear el archivo de vista
```vue
<!-- src/views/MiModulo/MiModuloListView.vue -->
<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <h2 class="text-lg font-bold" style="color: #2C2039;">Mi Módulo</h2>
      <button @click="abrirForm" class="px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style="background: #915BD8;">+ Nuevo</button>
    </div>

    <div class="bg-white rounded-xl shadow-sm" style="border: 1px solid #e8e0f0;">
      <!-- tabla o lista -->
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api/client'

const items = ref([])

onMounted(async () => {
  const { data } = await api.get('/mi-modulo')
  items.value = data
})
</script>
```

### 2. Agregar la ruta
```js
// src/router/index.js
{ path: '/mi-modulo', name: 'MiModulo', component: () => import('@/views/MiModulo/MiModuloListView.vue') }
```

### 3. Agregar al menú lateral
```js
// src/components/AppSidebar.vue — array "all"
{ to: '/mi-modulo', label: 'Mi Módulo', icon: 'pi pi-star' }
```

Para restringir por rol:
```js
{ to: '/mi-modulo', label: 'Mi Módulo', icon: 'pi pi-star', roles: ['admin', 'operaciones'] }
```

## Llamadas a la API
```js
import api from '@/api/client'

// GET con paginación
const { data } = await api.get('/proyectos?page=1&size=20')
// data.items, data.total, data.page

// POST
const { data } = await api.post('/proyectos', { nombre: '...', cliente_id: '...' })

// PUT
await api.put(`/proyectos/${id}`, payload)

// DELETE
await api.delete(`/proyectos/${id}`)
```

El token JWT se adjunta automáticamente en cada request. Si el servidor responde 401, redirige a `/login` solo.

## Auth store
```js
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()

auth.user        // { id, nombre, email, rol }
auth.role        // 'admin' | 'operaciones' | ...
auth.isAuthenticated  // true/false
auth.can('admin', 'operaciones')  // true si el usuario tiene alguno de esos roles
```

## Componentes PrimeVue disponibles
Importar desde `primevue/<nombre>`. Los más usados:
- `DataTable` + `Column` — tablas
- `Dialog` — modales
- `InputText`, `Textarea`, `Select` (Dropdown) — formularios
- `Button` — botones
- `Tag` — etiquetas de estado
- `Toast` — notificaciones
- `Card` — tarjetas

Ejemplo Toast:
```js
import { useToast } from 'primevue/usetoast'
const toast = useToast()
toast.add({ severity: 'success', summary: 'Guardado', life: 3000 })
```

## Íconos
Se usa **PrimeIcons**. Prefijo `pi pi-`:
`pi-home` `pi-bolt` `pi-building` `pi-dollar` `pi-exclamation-triangle`
`pi-check` `pi-times` `pi-pencil` `pi-trash` `pi-plus` `pi-search`

Lista completa: https://primevue.org/icons/

## Correr localmente
```bash
npm install
npm run dev
# Disponible en http://localhost:5173
# Requiere backend corriendo en localhost:8000
```

## Producción
- **Plataforma:** Vercel
- **Deploy:** hacer push a `master` en GitHub, luego Juan José activa el deploy
- **Build:** `npm run build`

## Convenciones de estilo
- Fondo de página: `#FDFAF7` (avena) — ya definido en body
- Cards/paneles: `bg-white rounded-xl` con `border: 1px solid #e8e0f0`
- Textos principales: `color: #2C2039`
- Textos secundarios/labels: `color: #6b5a8a`
- Botón primario: `background: #915BD8; color: white`
- No usar colores hardcodeados fuera de la paleta Unergy
- Mantener `space-y-4` o `space-y-6` como espaciado entre secciones
