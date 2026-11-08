<script setup lang="ts">
// Raiz do site: escolhe a moldura (layout) pela rota atual e coloca a tela dentro dela.
//   meta.layout ausente  → LayoutPadrao (cabeçalho + tela + rodapé)
//   meta.layout: 'vazio' → LayoutVazio (só a tela, ex.: login)
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { LAYOUTS, LAYOUT_PADRAO } from '@/components/layout/layouts'

const rota = useRoute()
const layout = computed(() => LAYOUTS[rota.meta.layout ?? LAYOUT_PADRAO])
</script>

<template>
  <component :is="layout">
    <RouterView />
  </component>
</template>
