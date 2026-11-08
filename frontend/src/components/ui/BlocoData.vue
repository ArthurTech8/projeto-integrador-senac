<script setup lang="ts">
// Quadradinho de data: "20" em cima e "nov" (ou "sex") embaixo.
// Usa a cor da categoria (--cat) do elemento pai que tiver data-cat.
import { computed } from 'vue'
import Icone from './Icone.vue'
import { paraData, formatarData, type ValorData } from '@/utils/datas'
import type { NomeIcone } from '@/types'

const props = withDefaults(defineProps<{
  data?: ValorData
  /** 'mes' → "nov" | 'semana' → "sex" */
  legenda?: 'mes' | 'semana'
  /** mostra um ícone no lugar do dia (ex.: 'relogio' para "acontecendo agora") */
  icone?: NomeIcone | ''
}>(), { data: null, legenda: 'mes', icone: '' })

const dia = computed(() => String(paraData(props.data)?.getDate() ?? '').padStart(2, '0'))
const texto = computed(() => formatarData(props.data, props.legenda === 'semana' ? 'semanaCurta' : 'mesCurto'))
</script>

<template>
  <span class="bloco-data">
    <Icone v-if="icone" :nome="icone" :tamanho="20" />
    <template v-else>
      <strong>{{ dia }}</strong>
      <small>{{ texto }}</small>
    </template>
  </span>
</template>

<style scoped>
.bloco-data {
  display: grid; place-items: center; align-content: center;
  width: 52px; height: 52px; flex-shrink: 0;
  border-radius: var(--raio-medio); line-height: 1.05;
  background: var(--cat-fundo, var(--primaria-clara)); color: var(--cat, var(--primaria));
}
/* "08" e "21" com a mesma largura: a coluna de datas fica alinhada */
strong { font-size: 1.25rem; font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
small { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; }
</style>
