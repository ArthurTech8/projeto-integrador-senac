<script setup lang="ts">
import { computed } from 'vue'
import CabecalhoPagina from '@/components/ui/CabecalhoPagina.vue'
import EstadoCarregamento from '@/components/ui/EstadoCarregamento.vue'
import EstadoVazio from '@/components/ui/EstadoVazio.vue'
import FiltrosAvisos from '@/components/avisos/FiltrosAvisos.vue'
import GradeAvisos from '@/components/avisos/GradeAvisos.vue'
import { useAvisos } from '@/composables/useAvisos'
import { useFiltrosAvisos } from '@/composables/useFiltrosAvisos'
import { infoCategoria } from '@/config'
import { plural } from '@/utils/texto'

const { avisos, carregando, erro, carregar } = useAvisos()
const { filtros, filtrados, qtdEncerrados, temFiltro, limpar } = useFiltrosAvisos(avisos)

// undefined quando o filtro está em "Todos"
const categoriaAtual = computed(() => infoCategoria(filtros.categoria))
const titulo = computed(() => categoriaAtual.value?.rotulo ?? 'Todos os avisos')
const subtitulo = computed(() => categoriaAtual.value?.descricao ?? 'Todos os comunicados da escola, com os urgentes primeiro.')
</script>

<template>
  <div class="container">
    <CabecalhoPagina :titulo="titulo" :subtitulo="subtitulo" />

    <FiltrosAvisos
      v-model:categoria="filtros.categoria"
      v-model:curso="filtros.curso"
      v-model:busca="filtros.busca"
      v-model:mostrar-encerrados="filtros.mostrarEncerrados"
      :qtd-encerrados="qtdEncerrados"
      :tem-filtro="temFiltro"
      @limpar="limpar"
    />

    <EstadoCarregamento :carregando="carregando" :erro="erro" texto-carregando="Carregando avisos…" @tentar-de-novo="carregar">
      <p class="resultado" aria-live="polite">
        {{ plural(filtrados.length, 'aviso encontrado', 'avisos encontrados') }}
        <template v-if="filtros.curso"> para <strong>{{ filtros.curso }}</strong> (inclui avisos gerais)</template>
      </p>

      <GradeAvisos :avisos="filtrados">
        <template #vazio>
          <EstadoVazio>
            Nenhum aviso encontrado com esses filtros.
            <template v-if="temFiltro" #acao>
              <button type="button" class="botao botao-secundario" @click="limpar">Limpar filtros</button>
            </template>
          </EstadoVazio>
        </template>
      </GradeAvisos>
    </EstadoCarregamento>
  </div>
</template>

<style scoped>
.resultado { margin: 0 0 14px; color: var(--texto-suave); font-size: 0.92rem; }
</style>
