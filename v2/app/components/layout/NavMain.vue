<script setup lang="ts">
import type { Component } from 'vue'
import { ChevronRightIcon } from '@lucide/vue'

export interface NavSubItem {
  title: string
  url: string
}

export interface NavItem {
  title: string
  icon: Component
  /** Ausente cuando el item solo despliega `items` (submenú). */
  url?: string
  items?: NavSubItem[]
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

defineProps<{ groups: NavGroup[] }>()

const route = useRoute()

/** Compara por path y, si `url` trae query, también por query — distingue
 * hijos que apuntan a la misma página con pestañas/filtros distintos. */
function isActive(url: string): boolean {
  const [path, query] = url.split('?')
  if (path === '/') return route.path === '/' && !query

  const pathMatches = route.path === path || route.path.startsWith(`${path}/`)
  if (!query) return pathMatches
  return pathMatches && route.fullPath.endsWith(`?${query}`)
}

function isGroupActive(item: NavItem): boolean {
  if (item.url) return isActive(item.url)
  return (item.items ?? []).some((sub) => isActive(sub.url))
}
</script>

<template>
  <SidebarGroup v-for="group in groups" :key="group.label">
    <SidebarGroupLabel>{{ group.label }}</SidebarGroupLabel>
    <SidebarGroupContent>
      <SidebarMenu>
        <template v-for="item in group.items" :key="item.title">
          <Collapsible
            v-if="item.items?.length"
            as-child
            :default-open="isGroupActive(item)"
            class="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger as-child>
                <SidebarMenuButton :tooltip="item.title" :is-active="isGroupActive(item)">
                  <component :is="item.icon" />
                  <span>{{ item.title }}</span>
                  <ChevronRightIcon
                    class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                  />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem v-for="sub in item.items" :key="sub.title">
                    <SidebarMenuSubButton as-child :is-active="isActive(sub.url)">
                      <NuxtLink :to="sub.url">
                        <span>{{ sub.title }}</span>
                      </NuxtLink>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>

          <SidebarMenuItem v-else>
            <SidebarMenuButton as-child :is-active="isActive(item.url!)" :tooltip="item.title">
              <NuxtLink :to="item.url!" :aria-current="isActive(item.url!) ? 'page' : undefined">
                <component :is="item.icon" />
                <span>{{ item.title }}</span>
              </NuxtLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </template>
      </SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
</template>
