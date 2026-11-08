<script setup lang="ts">
// Linha da lista de gerenciamento, com botões Editar e Excluir
import Icone from '@/components/ui/Icone.vue'
import SelosAviso from './SelosAviso.vue'
import { periodo } from '@/regras/avisos'
import type { Aviso } from '@/types'

withDefaults(defineProps<{
  aviso: Aviso
  selecionado?: boolean
  /** desabilita os botões enquanto uma exclusão está em andamento */
  ocupado?: boolean
}>(), { selecionado: false, ocupado: false })

defineEmits<{
  editar: [aviso: Aviso]
  excluir: [aviso: Aviso]
}>()
</script>

<template>
  <li class="item" :class="{ selecionado }">
    <div class="info">
      <SelosAviso :aviso="aviso" />
      <RouterLink :to="{ name: 'aviso', params: { id: aviso.id } }" class="titulo">{{ aviso.titulo }}</RouterLink>
      <small>{{ periodo(aviso) || 'Sem data' }} · {{ aviso.curso }}</small>
    </div>
    <div class="acoes">
      <button type="button" class="botao botao-pequeno botao-secundario" :disabled="ocupado" :aria-label="`Editar ${aviso.titulo}`" @click="$emit('editar', aviso)">
        <Icone nome="editar" :tamanho="15" /> Editar
      </button>
      <button type="button" class="botao botao-pequeno botao-perigo" :disabled="ocupado" :aria-label="`Excluir ${aviso.titulo}`" @click="$emit('excluir', aviso)">
        <Icone nome="lixeira" :tamanho="15" /> Excluir
      </button>
    </div>
  </li>
</template>

<style scoped>
.item {
  display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
  padding: 12px 14px; background: var(--superficie); border-radius: var(--raio-medio); box-shadow: var(--sombra);
  transition: box-shadow var(--duracao-curta) ease;
}
/* o item em edição fica marcado: contorno azul + halo claro */
.item.selecionado { box-shadow: 0 0 0 2px var(--primaria), 0 0 0 5px var(--primaria-clara); }
.info { display: grid; gap: 4px; min-width: 0; flex: 1 1 260px; }
.titulo { font-weight: 700; color: var(--texto-forte); text-decoration: none; overflow-wrap: anywhere; }
small { color: var(--texto-suave); overflow-wrap: anywhere; }
.acoes { display: flex; gap: 6px; }
@media (hover: hover) and (pointer: fine) {
  .titulo:hover { text-decoration: underline; text-underline-offset: 3px; }
}
</style>
