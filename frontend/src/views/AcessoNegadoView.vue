<script setup lang="ts">
import CabecalhoPagina from '@/components/ui/CabecalhoPagina.vue'
import { useSessao } from '@/composables/useSessao'

const { usuario } = useSessao()
</script>

<template>
  <div class="container">
    <CabecalhoPagina
      titulo="Acesso negado"
      :subtitulo="usuario
        ? `Seu perfil não tem permissão para abrir esta página, ${usuario.nome}.`
        : 'Esta página exige login.'"
    >
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
