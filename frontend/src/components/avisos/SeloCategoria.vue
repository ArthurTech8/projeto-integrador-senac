<script setup lang="ts">
// Pílula colorida com o ícone e o nome da categoria
import { computed } from 'vue'
import Icone from '@/components/ui/Icone.vue'
import { CATEGORIAS } from '@/config'
import type { ChaveCategoria } from '@/types'

const props = withDefaults(defineProps<{
  categoria: ChaveCategoria
  completo?: boolean
}>(), { completo: false })

const info = computed(() => CATEGORIAS[props.categoria])
</script>

<template>
  <span class="selo-categoria" :data-cat="categoria">
    <Icone :nome="info?.icone ?? 'livro'" :tamanho="14" />
    {{ completo ? info?.rotulo : info?.curto }}
  </span>
</template>

<style scoped>
.selo-categoria {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--cat);
  background: var(--cat-fundo);
  white-space: nowrap;
}
</style>
