<script setup lang="ts">
import { TriangleAlertIcon } from '@lucide/vue'

// Composición directa sobre `ui/`: Gandalf todavía no envuelve AlertDialog
// (ver app/components/gandalf/README.md).
const state = useConfirmState()

const open = computed({
  get: () => state.value.open,
  set: (value: boolean) => {
    state.value = { ...state.value, open: value }
  },
})

function onConfirm() {
  state.value.options?.onConfirm()
}
</script>

<template>
  <AlertDialog v-model:open="open">
    <AlertDialogContent v-if="state.options">
      <AlertDialogHeader>
        <AlertDialogMedia
          :class="
            state.options.variant === 'destructive' ? 'bg-destructive/10 text-destructive' : ''
          "
        >
          <TriangleAlertIcon />
        </AlertDialogMedia>
        <AlertDialogTitle>{{ state.options.title }}</AlertDialogTitle>
        <AlertDialogDescription v-if="state.options.description">
          {{ state.options.description }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>{{ state.options.cancelLabel ?? 'Cancelar' }}</AlertDialogCancel>
        <AlertDialogAction :variant="state.options.variant ?? 'default'" @click="onConfirm">
          {{ state.options.confirmLabel ?? 'Confirmar' }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
