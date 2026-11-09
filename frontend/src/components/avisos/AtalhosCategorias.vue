<script setup lang="ts">
// Quatro cartões de atalho (um por categoria) com a quantidade de avisos em vigor
import Icone from '@/components/ui/Icone.vue'
import { CATEGORIAS } from '@/config'
import type { ChaveCategoria } from '@/types'

withDefaults(defineProps<{
  /** { calendario: 6, emprego: 4, ... } */
  contagem?: Partial<Record<ChaveCategoria, number>>
  carregando?: boolean
}>(), { contagem: () => ({}), carregando: false })
</script>

<template>
  <nav class="atalhos" aria-label="Categorias de avisos">
    <RouterLink
      v-for="(info, chave) in CATEGORIAS"
      :key="chave"
      :to="{ name: 'avisos', query: { categoria: chave } }"
      class="atalho"
      :data-cat="chave"
    >
      <span class="icone"><Icone :nome="info.icone" :tamanho="22" /></span>
      <span class="texto">
        <strong>{{ info.rotulo }}</strong>
        <small>{{ info.descricao }}</small>
      </span>
      <span class="total" :aria-label="`${contagem[chave] ?? 0} avisos em vigor`">
        {{ carregando ? '–' : contagem[chave] ?? 0 }}
      </span>
    </RouterLink>
  </nav>
</template>

<style scoped>
/* 4 colunas no computador, 2 no tablet, 1 no celular */
.atalhos { display: grid; gap: 12px; grid-template-columns: repeat(4, minmax(0, 1fr)); }
@media (max-width: 1100px) { .atalhos { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 560px) { .atalhos { grid-template-columns: 1fr; } }

.atalho {
  display: flex; align-items: center; gap: 12px;
  padding: 16px; border-radius: var(--raio);
  background: var(--superficie); box-shadow: var(--sombra-alta);
  color: inherit; text-decoration: none;
  transition: box-shadow var(--duracao-curta) ease, transform var(--duracao-toque) var(--suave-saida);
}
.atalho:active { transform: scale(0.98); }
/* hover só com mouse: o contorno ganha a cor da categoria, sem deslocar o cartão */
@media (hover: hover) and (pointer: fine) {
  .atalho:hover { box-shadow: 0 0 0 1.5px var(--cat), var(--profundidade-erguida); }
}

.icone {
  display: grid; place-items: center; width: 44px; height: 44px; flex-shrink: 0;
  border-radius: var(--raio); background: var(--cat-fundo); color: var(--cat);
}
.texto { display: grid; flex: 1; min-width: 0; }
.texto strong { color: var(--texto-forte); font-size: 0.95rem; }
.texto small { color: var(--texto-suave); font-size: 0.8rem; }
/* tabular-nums: "9" e "12" ocupam a mesma largura, a pílula não muda de tamanho ao carregar */
.total {
  min-width: 32px; padding: 2px 8px; border-radius: var(--raio-pilula); text-align: center;
  background: var(--cat); color: #fff; font-weight: 700; font-size: 0.85rem;
  font-variant-numeric: tabular-nums;
}
</style>
