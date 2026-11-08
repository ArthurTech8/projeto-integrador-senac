<script setup lang="ts">
// Rodapé com a marca da instituição e atalhos das categorias
import { INSTITUICAO, CATEGORIAS } from '@/config'
</script>

<template>
  <footer class="rodape">
    <div class="container grade-rodape">
      <div>
        <img
          class="rodape-logo"
          :src="INSTITUICAO.logo.fundoEscuro"
          :alt="INSTITUICAO.logo.descricao"
          width="250"
          height="78"
          loading="lazy"
        />
        <p>{{ INSTITUICAO.nomeSite }}: mural oficial de avisos para os alunos.</p>
        <p><a :href="INSTITUICAO.site" target="_blank" rel="noopener noreferrer">Site do {{ INSTITUICAO.nome }}</a></p>
      </div>
      <nav aria-label="Categorias">
        <strong>Categorias</strong>
        <ul>
          <li v-for="(info, chave) in CATEGORIAS" :key="chave">
            <RouterLink :to="{ name: 'avisos', query: { categoria: chave } }">{{ info.rotulo }}</RouterLink>
          </li>
        </ul>
      </nav>
    </div>
  </footer>
</template>

<style scoped>
.rodape {
  background: var(--primaria-escura); color: #c8d3ec; font-size: 0.9rem;
  padding: 40px 0 calc(32px + env(safe-area-inset-bottom, 0px)); /* longe da barra de gestos do celular */
}
strong { color: #fff; }
p { margin: 8px 0 0; }
/* logo oficial: só a altura muda, a largura acompanha */
.rodape-logo { height: 64px; width: auto; }
.grade-rodape { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: 24px; }
ul { list-style: none; margin: 6px 0 0; padding: 0; display: grid; gap: 2px; }
/* links com altura de toque confortável, sem mudar o visual */
a { display: inline-flex; align-items: center; min-height: 32px; color: #c8d3ec; text-decoration: none; transition: color var(--duracao-curta) ease; }
a:active { color: #fff; }
@media (hover: hover) and (pointer: fine) {
  a:hover { color: #fff; text-decoration: underline; text-underline-offset: 3px; }
}
</style>
