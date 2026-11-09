<script setup lang="ts">
// Linha da lista de usuários, com Editar e Excluir.
// O admin não pode excluir a si mesmo (a API também bloqueia).
import Icone from '@/components/ui/Icone.vue'
import SeloPerfil from './SeloPerfil.vue'
import type { Usuario } from '@/types'

withDefaults(defineProps<{
  usuario: Usuario
  selecionado?: boolean
  /** é o próprio admin logado? */
  euMesmo?: boolean
  ocupado?: boolean
}>(), { selecionado: false, euMesmo: false, ocupado: false })

defineEmits<{
  editar: [usuario: Usuario]
  excluir: [usuario: Usuario]
}>()
</script>

<template>
  <li class="item" :class="{ selecionado }">
    <div class="info">
      <div class="linha">
        <strong class="nome">{{ usuario.nome }}</strong>
        <SeloPerfil :perfil="usuario.perfil" />
        <span v-if="euMesmo" class="voce">você</span>
      </div>
      <small>{{ usuario.email }}<template v-if="usuario.curso"> · {{ usuario.curso }}</template></small>
    </div>
    <div class="acoes">
      <button type="button" class="botao botao-pequeno botao-secundario" :disabled="ocupado" :aria-label="`Editar ${usuario.nome}`" @click="$emit('editar', usuario)">
        <Icone nome="editar" :tamanho="15" /> Editar
      </button>
      <button
        type="button"
        class="botao botao-pequeno botao-perigo"
        :disabled="ocupado || euMesmo"
        :title="euMesmo ? 'Você não pode excluir a sua própria conta' : undefined"
        :aria-label="`Excluir ${usuario.nome}`"
        @click="$emit('excluir', usuario)"
      >
        <Icone nome="lixeira" :tamanho="15" /> Excluir
      </button>
    </div>
  </li>
</template>

<style scoped>
.item {
  display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
  padding: 12px 14px; background: var(--superficie); border-radius: var(--raio-medio); box-shadow: var(--sombra-leve);
  transition: box-shadow var(--duracao-curta) ease;
}
/* o item em edição fica marcado: contorno azul + halo claro */
.item.selecionado { box-shadow: 0 0 0 2px var(--primaria), 0 0 0 5px var(--primaria-clara); }
.info { display: grid; gap: 4px; min-width: 0; flex: 1 1 240px; }
.linha { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.nome { color: var(--texto-forte); overflow-wrap: anywhere; }
.voce { font-size: 0.75rem; font-weight: 700; color: var(--sucesso); text-transform: uppercase; }
small { color: var(--texto-suave); overflow-wrap: anywhere; }
.acoes { display: flex; gap: 6px; }
</style>
