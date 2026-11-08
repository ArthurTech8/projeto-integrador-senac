<script setup lang="ts">
// Fotos de fundo que se revezam atrás de um conteúdo (ex.: banner da página inicial).
// Ocupa todo o elemento pai (que precisa de position: relative e overflow: hidden).
//
// Cuidados (que ninguém percebe, e é essa a ideia):
// - A foto nova aparece POR CIMA da anterior, que fica inteira até a troca acabar: sem "lavar" a imagem no meio.
// - Só baixa a foto atual e a próxima; e só troca quando a próxima já carregou (nunca pisca o fundo vazio).
// - Para quando a aba fica escondida e quando a pessoa pede "reduzir movimento" no aparelho.
// - Botão de pausar: conteúdo que muda sozinho por mais de 5 s precisa poder ser parado (WCAG 2.2.2).
// - Um véu azul da marca fica entre as fotos e o texto, para o texto continuar legível em qualquer foto.
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import Icone from './Icone.vue'
import { prefereMenosMovimento } from '@/utils/movimento'
import type { ImagemFundo } from '@/types'

const props = withDefaults(defineProps<{
  imagens: readonly ImagemFundo[]
  /** tempo de cada foto na tela, em ms */
  intervalo?: number
}>(), { intervalo: 8000 })

/** duração do crossfade (ms); igual ao CSS abaixo */
const DURACAO_TROCA = 1200

const total = computed(() => props.imagens.length)
const atual = ref(0)
const anterior = ref<number | null>(null)
const pausadoPeloUsuario = ref(false)
const abaVisivel = ref(true)

// fotos que já podem ser baixadas (atual + próxima) e as que já terminaram de carregar
const liberadas = ref<Set<number>>(new Set([0]))
const prontas = ref<Set<number>>(new Set())

const proxima = (indice: number): number => (indice + 1) % total.value
const rodando = computed(() => total.value > 1 && !pausadoPeloUsuario.value && abaVisivel.value)

let relogio: ReturnType<typeof setTimeout> | undefined
let limpaAnterior: ReturnType<typeof setTimeout> | undefined

function liberar(indice: number): void {
  if (!liberadas.value.has(indice)) liberadas.value = new Set([...liberadas.value, indice])
}

function marcarPronta(indice: number): void {
  prontas.value = new Set([...prontas.value, indice])
}

function avancar(): void {
  const seguinte = proxima(atual.value)
  // a próxima ainda não carregou (internet lenta): espera mais um pouco em vez de mostrar fundo vazio
  if (!prontas.value.has(seguinte)) {
    relogio = setTimeout(avancar, 1000)
    return
  }
  anterior.value = atual.value
  atual.value = seguinte
  liberar(proxima(seguinte)) // já começa a baixar a que vem depois
  clearTimeout(limpaAnterior)
  limpaAnterior = setTimeout(() => { anterior.value = null }, DURACAO_TROCA)
  agendar()
}

function agendar(): void {
  clearTimeout(relogio)
  if (rodando.value) relogio = setTimeout(avancar, props.intervalo)
}

function aoMudarVisibilidade(): void {
  abaVisivel.value = document.visibilityState === 'visible'
}

watch(rodando, agendar)

onMounted(() => {
  // quem pediu menos movimento começa com as fotos paradas (pode tocar pelo botão)
  pausadoPeloUsuario.value = prefereMenosMovimento()
  if (total.value > 1) liberar(1)
  document.addEventListener('visibilitychange', aoMudarVisibilidade)
  agendar()
})

onBeforeUnmount(() => {
  clearTimeout(relogio)
  clearTimeout(limpaAnterior)
  document.removeEventListener('visibilitychange', aoMudarVisibilidade)
})
</script>

<template>
  <div class="carrossel">
    <!-- decorativas: leitores de tela ignoram -->
    <div class="fotos" aria-hidden="true">
      <template v-for="(imagem, i) in imagens" :key="imagem.grande">
        <img
          v-if="liberadas.has(i)"
          :src="imagem.pequena"
          :srcset="`${imagem.pequena} 960w, ${imagem.grande} 1920w`"
          sizes="100vw"
          alt=""
          draggable="false"
          decoding="async"
          :loading="i === 0 ? 'eager' : 'lazy'"
          :class="{ ativa: i === atual, anterior: i === anterior }"
          :style="{ objectPosition: imagem.enquadramento }"
          @load="marcarPronta(i)"
        />
      </template>
    </div>
    <div class="veu" aria-hidden="true"></div>

    <button
      v-if="total > 1"
      type="button"
      class="controle"
      :aria-label="pausadoPeloUsuario ? 'Retomar a troca das fotos de fundo' : 'Pausar a troca das fotos de fundo'"
      :title="pausadoPeloUsuario ? 'Retomar fotos' : 'Pausar fotos'"
      @click="pausadoPeloUsuario = !pausadoPeloUsuario"
    >
      <Icone :nome="pausadoPeloUsuario ? 'tocar' : 'pausar'" :tamanho="14" />
    </button>
  </div>
</template>

<style scoped>
/* sem z-index aqui de propósito: fotos e véu ficam atrás do conteúdo (z 1) e o botão na frente (z 2) */
.carrossel { position: absolute; inset: 0; }

.fotos { position: absolute; inset: 0; z-index: 0; }
.fotos img {
  position: absolute; inset: 0;
  width: 100%; height: 100%; object-fit: cover;
  opacity: 0;
  /* crossfade decorativo: aparece poucas vezes por visita, então pode ser mais lento que um clique de interface */
  transition: opacity 1200ms ease;
  user-select: none; -webkit-user-select: none;
}
/* a nova sobe por cima e aparece; a anterior continua inteira por baixo até a troca acabar */
.fotos img.ativa { opacity: 1; z-index: 2; }
.fotos img.anterior { opacity: 1; z-index: 1; transition: none; }

/* Véu da marca, em 3 camadas:
   1. uma mancha escura e suave atrás do texto (lado esquerdo), que acompanha o conteúdo em qualquer largura;
   2. um véu de base de 50% em tudo, para a foto aparecer mas sem brigar com o texto;
   3. um escurecido embaixo, para os cartões de categoria "saírem" do banner.
   No pior caso (texto branco sobre a parte mais clara da foto) o contraste fica em torno de 7:1 (mínimo: 4,5:1). */
.veu {
  position: absolute; inset: 0; z-index: 0;
  background:
    radial-gradient(ellipse 75% 95% at 20% 45%, rgba(12, 31, 74, 0.78) 0%, rgba(12, 31, 74, 0.5) 60%, rgba(12, 31, 74, 0) 100%),
    linear-gradient(rgba(12, 31, 74, 0.5), rgba(12, 31, 74, 0.5)),
    linear-gradient(0deg, rgba(12, 31, 74, 0.45) 0%, rgba(12, 31, 74, 0) 40%);
}
/* no celular o texto ocupa a largura toda: véu mais forte por igual */
@media (max-width: 760px) {
  .veu {
    background:
      linear-gradient(rgba(12, 31, 74, 0.8), rgba(12, 31, 74, 0.8)),
      linear-gradient(0deg, rgba(12, 31, 74, 0.4) 0%, rgba(12, 31, 74, 0) 40%);
  }
}

.controle {
  position: absolute; z-index: 2;
  top: 14px;
  /* alinhado com a borda direita do conteúdo (.container) */
  right: max(var(--respiro-lateral), calc((100% - var(--largura)) / 2 + var(--respiro-lateral)));
  display: grid; place-items: center;
  width: 36px; height: 36px; padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.3); border-radius: var(--raio-pilula);
  background: rgba(12, 31, 74, 0.55); color: #fff;
  cursor: pointer;
  opacity: 0.75;
  transition: opacity var(--duracao-curta) ease, background-color var(--duracao-curta) ease, transform var(--duracao-toque) var(--suave-saida);
}
.controle:active { transform: scale(0.94); }
.controle:focus-visible { opacity: 1; }
@media (hover: hover) and (pointer: fine) {
  .controle:hover { opacity: 1; background: rgba(12, 31, 74, 0.8); }
}
</style>
