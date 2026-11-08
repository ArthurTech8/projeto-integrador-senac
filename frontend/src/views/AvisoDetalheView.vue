<script setup lang="ts">
import { computed, watch } from 'vue'
import Icone from '@/components/ui/Icone.vue'
import EstadoCarregamento from '@/components/ui/EstadoCarregamento.vue'
import SelosAviso from '@/components/avisos/SelosAviso.vue'
import FichaAviso from '@/components/avisos/FichaAviso.vue'
import { useAviso } from '@/composables/useAviso'
import { INSTITUICAO } from '@/config'
import { encerrado, textoAcao, textoPrazoDetalhe } from '@/regras/avisos'
import { formatarData } from '@/utils/datas'

// vem da URL /avisos/:id (props: true na rota), por isso é texto
const props = defineProps<{ id: string }>()

const { aviso, carregando, erro, naoEncontrado, carregar } = useAviso(() => props.id)

const fechado = computed(() => aviso.value !== null && encerrado(aviso.value))
const prazo = computed(() => (aviso.value ? textoPrazoDetalhe(aviso.value) : ''))

// A aba do navegador mostra o título do aviso
watch(aviso, (a) => { if (a) document.title = `${a.titulo} · ${INSTITUICAO.nomeSite}` })
</script>

<template>
  <div class="container estreito">
    <RouterLink to="/avisos" class="voltar"><Icone nome="voltar" :tamanho="16" /> Voltar para os avisos</RouterLink>

    <EstadoCarregamento
      :carregando="carregando"
      :erro="erro"
      texto-carregando="Carregando aviso…"
      :pode-tentar-de-novo="!naoEncontrado"
      @tentar-de-novo="carregar"
    >
      <article v-if="aviso" class="aviso" :data-cat="aviso.categoria">
        <SelosAviso :aviso="aviso" categoria="completo" />

        <h1>{{ aviso.titulo }}</h1>
        <p class="resumo">{{ aviso.resumo }}</p>

        <p v-if="prazo" class="faixa-prazo"><Icone nome="relogio" :tamanho="18" /> {{ prazo }}</p>
        <p v-if="fechado" class="faixa-prazo faixa-encerrado">Este aviso já foi encerrado.</p>

        <FichaAviso :aviso="aviso" class="ficha" />

        <div class="descricao">
          <h2>Detalhes</h2>
          <p>{{ aviso.descricao }}</p>
        </div>

        <div class="acoes">
          <a
            v-if="aviso.link && !fechado"
            :href="aviso.link"
            target="_blank"
            rel="noopener noreferrer"
            class="botao botao-acao"
          >{{ textoAcao(aviso) }} <Icone nome="externo" :tamanho="16" /></a>
          <RouterLink :to="{ name: 'avisos', query: { categoria: aviso.categoria } }" class="botao botao-secundario">
            Mais avisos desta categoria
          </RouterLink>
        </div>

        <p class="publicado">Publicado em {{ formatarData(aviso.publicadoEm) }}</p>
      </article>
    </EstadoCarregamento>
  </div>
</template>

<style scoped>
.estreito { max-width: 820px; }

.voltar {
  display: inline-flex; align-items: center; gap: 6px; min-height: 40px; margin: 16px 0 8px;
  font-weight: 600; font-size: 0.92rem; text-decoration: none;
}
@media (hover: hover) and (pointer: fine) {
  .voltar:hover { text-decoration: underline; text-underline-offset: 3px; }
}

/* faixa da categoria no topo como sombra inset: acompanha o canto arredondado */
.aviso {
  padding: clamp(20px, 4vw, 36px);
  padding-top: calc(clamp(20px, 4vw, 36px) + 6px);
  background: var(--superficie); border-radius: var(--raio);
  box-shadow: inset 0 6px 0 var(--cat), var(--sombra);
}
h1 { margin: 14px 0 8px; font-size: clamp(1.5rem, 4vw, 2rem); letter-spacing: -0.02em; overflow-wrap: anywhere; }
.resumo { margin: 0 0 18px; font-size: 1.08rem; color: var(--texto-suave); overflow-wrap: anywhere; }

.faixa-prazo {
  display: flex; align-items: center; gap: 8px; margin: 0 0 18px; padding: 10px 14px;
  border-radius: var(--raio-medio); background: var(--cat-fundo); color: var(--cat); font-weight: 700;
}
.faixa-encerrado { background: var(--neutro-fundo); color: var(--neutro); }

.ficha { margin-bottom: 24px; }

/* texto longo: linha de até ~70 caracteres é a mais confortável de ler */
.descricao h2 { font-size: 1.1rem; margin: 0 0 8px; }
.descricao p { margin: 0; max-width: 70ch; white-space: pre-line; line-height: 1.7; overflow-wrap: anywhere; }

.acoes { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 28px; }
/* ".acoes" na frente: ganha do hover/active azul do .botao global */
.acoes .botao-acao { background: var(--cat); }
.acoes .botao-acao:active { background: var(--cat); filter: brightness(0.9); }
@media (hover: hover) and (pointer: fine) {
  .acoes .botao-acao:hover { background: var(--cat); filter: brightness(0.9); }
}

.publicado { margin: 24px 0 0; font-size: 0.82rem; color: var(--texto-suave); }
</style>
