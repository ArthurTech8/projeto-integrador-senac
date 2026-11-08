<script setup lang="ts">
import CabecalhoPagina from '@/components/ui/CabecalhoPagina.vue'
</script>

<template>
  <div class="container">
    <CabecalhoPagina titulo="Página não encontrada" subtitulo="O endereço digitado não existe ou mudou de lugar.">
      <div class="acoes">
        <RouterLink to="/" class="botao">Ir para o início</RouterLink>
        <RouterLink to="/avisos" class="botao botao-secundario">Ver avisos</RouterLink>
      </div>
    </CabecalhoPagina>
  </div>
</template>

<style scoped>
.acoes { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px; }
</style>
