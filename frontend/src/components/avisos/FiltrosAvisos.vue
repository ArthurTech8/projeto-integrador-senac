<script setup lang="ts">
// Barra de filtros da lista de avisos. Cada filtro é um v-model:
// <FiltrosAvisos v-model:categoria="..." v-model:curso="..." v-model:busca="..." v-model:mostrar-encerrados="..." />
import Icone from '@/components/ui/Icone.vue'
import { CATEGORIAS, CURSOS_ESPECIFICOS } from '@/config'
import type { ChaveCategoria } from '@/types'

const categoria = defineModel<ChaveCategoria | ''>('categoria', { default: '' })
const curso = defineModel<string>('curso', { default: '' })
const busca = defineModel<string>('busca', { default: '' })
const mostrarEncerrados = defineModel<boolean>('mostrarEncerrados', { default: false })

withDefaults(defineProps<{
  qtdEncerrados?: number
  temFiltro?: boolean
}>(), { qtdEncerrados: 0, temFiltro: false })

defineEmits<{ limpar: [] }>()
</script>

<template>
  <div class="filtros">
    <div class="abas" role="group" aria-label="Filtrar por categoria">
      <button type="button" class="aba" :aria-pressed="!categoria" @click="categoria = ''">Todos</button>
      <button
        v-for="(info, chave) in CATEGORIAS"
        :key="chave"
        type="button"
        class="aba"
        :data-cat="chave"
        :aria-pressed="categoria === chave"
        @click="categoria = chave"
      >
        <Icone :nome="info.icone" :tamanho="16" /> {{ info.curto }}
      </button>
    </div>

    <div class="linha-campos">
      <label class="campo">
        <span>Buscar</span>
        <input v-model="busca" type="search" enterkeyhint="search" placeholder="Palavra-chave, empresa, local…" />
      </label>
      <label class="campo">
        <span>Meu curso</span>
        <select v-model="curso">
          <option value="">Todos os cursos</option>
          <option v-for="c in CURSOS_ESPECIFICOS" :key="c" :value="c">{{ c }}</option>
        </select>
      </label>
    </div>

    <div class="linha-opcoes">
      <label class="caixa-marcar">
        <input v-model="mostrarEncerrados" type="checkbox" />
        Mostrar encerrados ({{ qtdEncerrados }})
      </label>
      <button v-if="temFiltro" type="button" class="botao botao-pequeno botao-secundario" @click="$emit('limpar')">
        Limpar filtros
      </button>
    </div>
  </div>
</template>

<style scoped>
.filtros {
  display: grid; gap: 16px; margin-bottom: 20px; padding: 16px;
  background: var(--superficie); border-radius: var(--raio); box-shadow: var(--sombra);
}

/* Filtro é usado várias vezes seguidas: troca só de cor, sem deslizar nada (rápido é melhor). */
.abas { display: flex; flex-wrap: wrap; gap: 8px; }
.aba {
  display: inline-flex; align-items: center; gap: 6px;
  min-height: 40px; padding: 0 14px; border-radius: var(--raio-pilula);
  border: 1px solid var(--borda); background: var(--superficie); color: var(--texto);
  font: inherit; font-size: 0.9rem; font-weight: 600; cursor: pointer;
  transition:
    background-color var(--duracao-curta) ease,
    border-color var(--duracao-curta) ease,
    color var(--duracao-curta) ease,
    transform var(--duracao-toque) var(--suave-saida);
}
.aba:active { transform: scale(0.96); }
.aba[data-cat] { color: var(--cat); }
.aba[aria-pressed='true'] { background: var(--cat, var(--primaria)); border-color: var(--cat, var(--primaria)); color: #fff; }
@media (hover: hover) and (pointer: fine) {
  .aba:hover { border-color: var(--cat, var(--primaria)); }
  .aba[aria-pressed='false']:hover { background: var(--cat-fundo, var(--primaria-clara)); }
}

.linha-campos { display: grid; gap: 12px; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); }
@media (max-width: 640px) { .linha-campos { grid-template-columns: 1fr; } }

.linha-opcoes { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
</style>
