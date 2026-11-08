<script setup lang="ts">
// Layout vazio: só o conteúdo, ocupando a tela inteira, sem cabeçalho nem rodapé.
// Para telas como a de login (meta.layout: 'vazio' em router/rotas.ts).
</script>

<template>
  <main id="conteudo" class="layout-vazio">
    <slot />
  </main>
</template>

<style scoped>
/* dvh acompanha a barra do navegador no celular (100vh passaria da tela) */
.layout-vazio { min-height: 100vh; min-height: 100dvh; }
</style>
