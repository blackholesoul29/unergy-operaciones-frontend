<template>
  <div class="p-4 md:p-6">
    <div class="mb-4">
      <h1 class="text-xl font-bold" style="color: #2c2039">Proyectos próximos a energizarse</h1>
      <p class="mt-1 text-sm" style="color: #7a6e8a">
        Pipeline de TSF sincronizado en la base de operaciones: proyectos en construcción cuya fecha
        de energización aún no ha llegado.
      </p>
    </div>
    <ProyectosProximosEnergizar />
  </div>
</template>

<script setup>
import ProyectosProximosEnergizar from '@/components/ProyectosProximosEnergizar.vue'
</script>
