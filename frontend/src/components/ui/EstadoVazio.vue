<script setup lang="ts">
// Caixa tracejada para listas vazias. Slot padrão = texto; slot "acao" = botão opcional.
defineSlots<{
  default?: () => unknown
  acao?: () => unknown
}>()
</script>

<template>
  <div class="vazio">
    <p><slot /></p>
    <div v-if="$slots.acao" class="vazio-acao"><slot name="acao" /></div>
  </div>
</template>

<style scoped>
p { margin: 0; }
.vazio-acao { margin-top: 12px; }
</style>
