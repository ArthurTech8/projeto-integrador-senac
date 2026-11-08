<script setup lang="ts">
import { ref, computed } from 'vue'
import Icone from '@/components/ui/Icone.vue'
import CabecalhoPagina from '@/components/ui/CabecalhoPagina.vue'
import EstadoCarregamento from '@/components/ui/EstadoCarregamento.vue'
import EstadoVazio from '@/components/ui/EstadoVazio.vue'
import ItemCalendario from '@/components/avisos/ItemCalendario.vue'
import { useAvisos } from '@/composables/useAvisos'
import { CATEGORIAS, CHAVES_CATEGORIAS } from '@/config'
import { agruparPorMes, vigentes, dataReferencia, emAndamento, ordenarPorData } from '@/regras/avisos'
import type { ChaveCategoria } from '@/types'

const { avisos, carregando, erro, carregar } = useAvisos()

// Categorias marcadas no filtro (começa com todas)
const categoriasVisiveis = ref<ChaveCategoria[]>([...CHAVES_CATEGORIAS])

const comData = computed(() =>
  vigentes(avisos.value).filter((a) => categoriasVisiveis.value.includes(a.categoria) && dataReferencia(a)))

// Vagas não entram em "agora": o que importa nelas é o prazo final
const agora = computed(() => ordenarPorData(comData.value.filter((a) => emAndamento(a) && a.categoria !== 'emprego')))
const meses = computed(() => agruparPorMes(comData.value.filter((a) => !agora.value.includes(a))))
</script>

<template>
  <div class="container estreito">
    <CabecalhoPagina titulo="Calendário" subtitulo="Próximos feriados, férias, provas, eventos e prazos, em ordem de data." />

    <fieldset class="filtro">
      <legend>Mostrar no calendário</legend>
      <label v-for="(info, chave) in CATEGORIAS" :key="chave" class="caixa-marcar" :data-cat="chave">
        <input v-model="categoriasVisiveis" type="checkbox" :value="chave" />
        <Icone :nome="info.icone" :tamanho="16" class="icone-cat" /> {{ info.curto }}
      </label>
    </fieldset>

    <EstadoCarregamento :carregando="carregando" :erro="erro" texto-carregando="Carregando calendário…" @tentar-de-novo="carregar">
      <EstadoVazio v-if="!comData.length">Nenhuma data futura para as categorias escolhidas.</EstadoVazio>

      <section v-if="agora.length" class="mes" aria-labelledby="m-agora">
        <h2 id="m-agora" class="mes-titulo agora">Acontecendo agora</h2>
        <ol class="linha">
          <li v-for="aviso in agora" :key="aviso.id"><ItemCalendario :aviso="aviso" agora /></li>
        </ol>
      </section>

      <section v-for="mes in meses" :key="mes.chave" class="mes" :aria-labelledby="`m-${mes.chave}`">
        <h2 :id="`m-${mes.chave}`" class="mes-titulo">{{ mes.titulo }}</h2>
        <ol class="linha">
          <li v-for="aviso in mes.itens" :key="aviso.id"><ItemCalendario :aviso="aviso" /></li>
        </ol>
      </section>
    </EstadoCarregamento>
  </div>
</template>

<style scoped>
.estreito { max-width: 860px; }

/* legend em fieldset com sombra fica "cortando" a borda; aqui ele vira um título comum em cima */
.filtro {
  display: flex; flex-wrap: wrap; gap: 4px 20px; margin: 0 0 24px; padding: 14px 16px; min-width: 0;
  border: 0; background: var(--superficie); border-radius: var(--raio); box-shadow: var(--sombra);
}
.filtro legend { float: left; width: 100%; margin-bottom: 4px; padding: 0; font-size: 0.85rem; font-weight: 700; color: var(--texto-forte); }
.filtro input { accent-color: var(--cat); }
.icone-cat { color: var(--cat); }

.mes { margin-bottom: 28px; }
.mes-titulo {
  margin: 0 0 10px; font-size: 1rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--texto-suave);
}
.mes-titulo.agora { color: var(--sucesso); }
.linha { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
</style>
