<script setup lang="ts">
// Linha de aviso com data em destaque. Usada no Calendário e (compacta) no painel "Próximas datas".
import { computed } from 'vue'
import BlocoData from '@/components/ui/BlocoData.vue'
import SeloCategoria from './SeloCategoria.vue'
import { dataReferencia, periodo, rotuloPrazo } from '@/regras/avisos'
import { hoje, mesmoDia } from '@/utils/datas'
import type { Aviso } from '@/types'

const props = withDefaults(defineProps<{
  aviso: Aviso
  /** versão enxuta: sem borda, sem selo de categoria e sem período */
  compacto?: boolean
  /** está acontecendo agora: mostra um relógio no lugar do dia */
  agora?: boolean
}>(), { compacto: false, agora: false })

const data = computed(() => dataReferencia(props.aviso))
const prazo = computed(() => (props.agora ? '' : rotuloPrazo(props.aviso)))
const ehHoje = computed(() => mesmoDia(data.value, hoje()))
</script>

<template>
  <RouterLink
    :to="{ name: 'aviso', params: { id: aviso.id } }"
    class="item"
    :class="{ compacto, hoje: ehHoje }"
    :data-cat="aviso.categoria"
  >
    <BlocoData :data="data" :legenda="compacto ? 'mes' : 'semana'" :icone="agora ? 'relogio' : ''" />

    <span class="texto">
      <strong>{{ aviso.titulo }}</strong>
      <small>
        <template v-if="!compacto">{{ periodo(aviso) }}</template>
        <b v-if="prazo"><template v-if="!compacto"> · </template>{{ prazo }}</b>
      </small>
    </span>

    <SeloCategoria v-if="!compacto" :categoria="aviso.categoria" />
  </RouterLink>
</template>

<style scoped>
/* faixa da categoria à esquerda como sombra inset: segue o canto arredondado */
.item {
  display: flex; align-items: center; gap: 14px; padding: 12px 14px 12px 18px;
  background: var(--superficie); border-radius: var(--raio-medio);
  box-shadow: inset 4px 0 0 var(--cat), var(--sombra-leve);
  color: inherit; text-decoration: none;
  transition: box-shadow var(--duracao-curta) ease, background-color var(--duracao-curta) ease, transform var(--duracao-toque) var(--suave-saida);
}
.item:active { transform: scale(0.99); }
.item.hoje { background: var(--cat-fundo); }

.texto { flex: 1; min-width: 0; display: grid; gap: 2px; }
.texto strong { color: var(--texto-forte); font-size: 0.98rem; overflow-wrap: anywhere; }
.texto small { color: var(--texto-suave); font-size: 0.85rem; }
.texto b { color: var(--cat); }

/* versão compacta (painel lateral da página inicial) */
.item.compacto { gap: 12px; padding: 8px; margin: 0 -8px; box-shadow: none; background: transparent; }
.item.compacto:active { background: var(--fundo); }
.item.compacto .texto strong { font-size: 0.92rem; }
.item.compacto .texto small { font-size: 0.78rem; }

@media (hover: hover) and (pointer: fine) {
  .item:not(.compacto):hover { box-shadow: inset 4px 0 0 var(--cat), var(--sombra); }
  .item.compacto:hover { background: var(--fundo); }
}

/* no celular o selo desce para baixo do título */
@media (max-width: 560px) {
  .item:not(.compacto) { flex-wrap: wrap; row-gap: 6px; }
  .item:not(.compacto) .texto { flex-basis: calc(100% - 66px); }
  .item:not(.compacto) :deep(.selo-categoria) { margin-left: 66px; }
}
</style>
