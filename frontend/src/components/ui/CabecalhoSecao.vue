<script setup lang="ts">
// Título de uma seção (h2) com link opcional à direita ("Ver todos →")
import type { LinkSecao } from '@/types'

withDefaults(defineProps<{
  titulo: string
  /** id do h2, para a <section aria-labelledby="..."> */
  id?: string
  link?: LinkSecao | null
}>(), { id: undefined, link: null })
</script>

<template>
  <div class="secao-cabecalho">
    <h2 :id="id"><slot name="antes" />{{ titulo }}</h2>
    <RouterLink v-if="link" :to="link.para">{{ link.texto }} →</RouterLink>
  </div>
</template>

<style scoped>
.secao-cabecalho {
  display: flex; align-items: baseline; justify-content: space-between; gap: 12px;
  flex-wrap: wrap; margin-bottom: 16px;
}
h2 { margin: 0; font-size: 1.35rem; }
a { display: inline-flex; align-items: center; min-height: 32px; font-weight: 600; font-size: 0.92rem; text-decoration: none; }
a:active { color: var(--primaria-escura); }
@media (hover: hover) and (pointer: fine) {
  a:hover { text-decoration: underline; text-underline-offset: 3px; }
}
</style>
