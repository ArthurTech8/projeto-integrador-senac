<script setup lang="ts">
// Grade responsiva de cards. Se a lista estiver vazia, mostra o slot "vazio".
import AvisoCard from './AvisoCard.vue'
import EstadoVazio from '@/components/ui/EstadoVazio.vue'
import type { Aviso } from '@/types'

withDefaults(defineProps<{
  avisos: readonly Aviso[]
  /** largura mínima de cada coluna, em px */
  colunaMinima?: number
}>(), { colunaMinima: 300 })
</script>

<template>
  <div v-if="avisos.length" class="grade" :style="{ '--coluna-minima': `${colunaMinima}px` }">
    <AvisoCard v-for="aviso in avisos" :key="aviso.id" :aviso="aviso" />
  </div>
  <slot v-else name="vazio">
    <EstadoVazio>Nenhum aviso por aqui.</EstadoVazio>
  </slot>
</template>
