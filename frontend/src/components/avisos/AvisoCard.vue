<script setup lang="ts">
// Card de um aviso, usado nas grades da página inicial e da lista de avisos
import { computed } from 'vue'
import Icone from '@/components/ui/Icone.vue'
import SelosAviso from './SelosAviso.vue'
import { CURSO_GERAL } from '@/config'
import { encerrado, periodo, rotuloPrazo } from '@/regras/avisos'
import type { Aviso } from '@/types'

const props = defineProps<{ aviso: Aviso }>()

const fechado = computed(() => encerrado(props.aviso))
const quando = computed(() => periodo(props.aviso))
const prazo = computed(() => (fechado.value ? '' : rotuloPrazo(props.aviso)))
</script>

<template>
  <RouterLink
    :to="{ name: 'aviso', params: { id: aviso.id } }"
    class="card"
    :class="{ urgente: aviso.urgente && !fechado, fechado }"
    :data-cat="aviso.categoria"
  >
    <SelosAviso :aviso="aviso" />

    <h3>{{ aviso.titulo }}</h3>
    <p class="resumo">{{ aviso.resumo }}</p>

    <ul class="meta">
      <li v-if="quando">
        <Icone nome="calendario" :tamanho="15" /> {{ quando }}
        <strong v-if="prazo" class="prazo">· {{ prazo }}</strong>
      </li>
      <li v-if="aviso.empresa"><Icone nome="predio" :tamanho="15" /> {{ aviso.empresa }}</li>
      <li v-if="aviso.cargaHoraria"><Icone nome="relogio" :tamanho="15" /> {{ aviso.cargaHoraria }}h<template v-if="aviso.modalidade"> · {{ aviso.modalidade }}</template></li>
      <li v-if="aviso.curso !== CURSO_GERAL"><Icone nome="livro" :tamanho="15" /> {{ aviso.curso }}</li>
    </ul>

    <span class="ver">Ver detalhes <Icone nome="seta" :tamanho="15" /></span>
  </RouterLink>
</template>

<style scoped>
/* A faixa colorida do topo e o contorno são sombras (inset + translúcida):
   acompanham o canto arredondado e não somam pixels ao tamanho do card. */
.card {
  --faixa: var(--cat);
  --contorno-card: var(--contorno);
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  padding: 20px 18px 16px;
  background: var(--superficie);
  border-radius: var(--raio);
  box-shadow: inset 0 4px 0 var(--faixa), var(--contorno-card), var(--profundidade);
  color: inherit;
  text-decoration: none;
  transition:
    box-shadow var(--duracao-curta) ease,
    transform var(--duracao-curta) var(--suave-saida);
}
.card.urgente { --faixa: var(--urgente); --contorno-card: 0 0 0 1px var(--urgente-borda); background: var(--urgente-fundo); }
.card.fechado { opacity: 0.65; }

/* hover só com mouse: o card sobe 2px e a sombra se afasta, como se ele saísse do fundo (efeito 3D) */
@media (hover: hover) and (pointer: fine) {
  .card:hover {
    transform: translateY(-2px);
    box-shadow: inset 0 4px 0 var(--faixa), var(--contorno-card), var(--profundidade-erguida);
  }
  .card:hover .ver { color: var(--primaria-escura); }
}
/* toque (e clique): afunda de leve, confirma que o site "ouviu".
   Fica depois do hover para valer também com o mouse em cima. */
.card:active { transform: scale(0.985); }

/* reduzir movimento: sem subir; a sombra continua mudando */
@media (prefers-reduced-motion: reduce) {
  .card:hover { transform: none; }
}

/* título sem espaço (link, código) quebra em vez de vazar do card */
h3 { margin: 0; font-size: 1.05rem; line-height: 1.35; color: var(--texto-forte); overflow-wrap: anywhere; }
/* resumo grande corta na 3ª linha: os cards da grade ficam com altura parecida */
.resumo {
  margin: 0; color: var(--texto-suave); font-size: 0.92rem; line-height: 1.5;
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
  overflow-wrap: anywhere;
}

.meta { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; font-size: 0.85rem; color: var(--texto-suave); }
.meta li { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; min-width: 0; overflow-wrap: anywhere; }
.prazo { color: var(--cat); font-weight: 600; }

.ver {
  margin-top: auto; padding-top: 4px;
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 0.85rem; font-weight: 600; color: var(--primaria);
  transition: color var(--duracao-curta) ease;
}
</style>
