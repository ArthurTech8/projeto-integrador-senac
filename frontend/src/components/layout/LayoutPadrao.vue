<script setup lang="ts">
// Layout padrão do site: cabeçalho + conteúdo da tela + rodapé.
// Usado por todas as rotas, a não ser que a rota peça outro em meta.layout (router/rotas.ts).
import CabecalhoSite from './CabecalhoSite.vue'
import RodapeSite from './RodapeSite.vue'
</script>

<template>
  <a class="pular" href="#conteudo">Pular para o conteúdo</a>
  <CabecalhoSite />
  <!-- .miolo (styles/componentes.css): fundo em degradê da marca, com o conteúdo flutuando por cima -->
  <main id="conteudo" class="miolo">
    <slot />
  </main>
  <RodapeSite />
</template>

<style scoped>
.pular {
  position: absolute; left: 16px; top: -60px; z-index: 100;
  padding: 10px 14px; border-radius: var(--raio-pequeno);
  background: var(--destaque); color: var(--primaria-escura); font-weight: 700;
}
.pular:focus { top: 12px; }

/* svh = a menor altura da tela no celular: o rodapé nunca "pula" quando a barra do navegador some */
main { min-height: 70vh; min-height: 70svh; padding-bottom: var(--respiro-rodape); }
</style>
