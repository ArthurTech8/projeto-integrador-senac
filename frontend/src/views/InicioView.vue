<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Icone from '@/components/ui/Icone.vue'
import EstadoCarregamento from '@/components/ui/EstadoCarregamento.vue'
import EstadoVazio from '@/components/ui/EstadoVazio.vue'
import CabecalhoSecao from '@/components/ui/CabecalhoSecao.vue'
import CarrosselFundo from '@/components/ui/CarrosselFundo.vue'
import AtalhosCategorias from '@/components/avisos/AtalhosCategorias.vue'
import GradeAvisos from '@/components/avisos/GradeAvisos.vue'
import ItemCalendario from '@/components/avisos/ItemCalendario.vue'
import { useAvisos } from '@/composables/useAvisos'
import { vigentes, contarPorCategoria, ordenarPorRelevancia, proximasDatas } from '@/regras/avisos'
import { FUNDOS_INICIO, INTERVALO_FUNDO } from '@/config'
import { formatarData, hoje } from '@/utils/datas'
import { capitalizar } from '@/utils/texto'

const { avisos, carregando, erro, carregar } = useAvisos()
const router = useRouter()
const termo = ref('')

const avisosVigentes = computed(() => vigentes(avisos.value))
const urgentes = computed(() => avisosVigentes.value.filter((a) => a.urgente))
const recentes = computed(() => ordenarPorRelevancia(avisosVigentes.value.filter((a) => !a.urgente)).slice(0, 6))
const datas = computed(() => proximasDatas(avisos.value, 5))
const contagem = computed(() => contarPorCategoria(avisosVigentes.value))

const dataHoje = capitalizar(formatarData(hoje(), 'extenso'))

function buscar(): void {
  const busca = termo.value.trim()
  void router.push({ name: 'avisos', query: busca ? { busca } : {} })
}
</script>

<template>
  <section class="hero">
    <!-- fotos de estudantes trocando a cada 8 s, com véu azul por cima para o texto ficar legível -->
    <CarrosselFundo :imagens="FUNDOS_INICIO" :intervalo="INTERVALO_FUNDO" />
    <div class="container conteudo-hero">
      <p class="hoje">{{ dataHoje }}</p>
      <h1>Fique por dentro de tudo o que acontece na escola</h1>
      <p class="chamada">Feriados, férias, atividades, vagas de emprego e cursos rápidos, num lugar só.</p>

      <form class="busca" role="search" @submit.prevent="buscar">
        <label for="busca-inicio" class="visualmente-oculto">Buscar avisos</label>
        <Icone nome="busca" :tamanho="20" class="busca-icone" />
        <input id="busca-inicio" v-model="termo" type="search" enterkeyhint="search" placeholder="Buscar: estágio, feriado, Excel…" />
        <button class="botao" type="submit">Buscar</button>
      </form>
    </div>
  </section>

  <div class="container">
    <AtalhosCategorias class="atalhos" :contagem="contagem" :carregando="carregando" />

    <EstadoCarregamento :carregando="carregando" :erro="erro" texto-carregando="Carregando avisos…" @tentar-de-novo="carregar">
      <section v-if="urgentes.length" class="secao" aria-labelledby="t-urgentes">
        <CabecalhoSecao id="t-urgentes" titulo="Atenção: avisos urgentes">
          <template #antes><span class="ponto-urgente" aria-hidden="true"></span></template>
        </CabecalhoSecao>
        <GradeAvisos :avisos="urgentes" />
      </section>

      <div class="duas-colunas secao">
        <section aria-labelledby="t-recentes">
          <CabecalhoSecao id="t-recentes" titulo="Publicados recentemente" :link="{ para: '/avisos', texto: 'Ver todos os avisos' }" />
          <GradeAvisos :avisos="recentes" :coluna-minima="260">
            <template #vazio><EstadoVazio>Nenhum aviso publicado por enquanto.</EstadoVazio></template>
          </GradeAvisos>
        </section>

        <aside class="painel-datas" aria-labelledby="t-datas" data-cat="calendario">
          <CabecalhoSecao id="t-datas" titulo="Próximas datas" :link="{ para: '/calendario', texto: 'Calendário' }" />
          <ol v-if="datas.length" class="datas">
            <li v-for="aviso in datas" :key="aviso.id"><ItemCalendario :aviso="aviso" compacto /></li>
          </ol>
          <EstadoVazio v-else>Sem datas próximas.</EstadoVazio>
        </aside>
      </div>
    </EstadoCarregamento>
  </div>
</template>

<style scoped>
.hero {
  /* o gradiente azul continua por baixo: aparece enquanto a primeira foto carrega */
  position: relative;
  overflow: hidden;
  isolation: isolate; /* as camadas do carrossel ficam presas dentro do banner */
  background:
    radial-gradient(circle at 85% 20%, rgba(242, 183, 5, 0.2), transparent 40%),
    linear-gradient(160deg, var(--primaria) 0%, var(--primaria-escura) 100%);
  color: #fff;
  padding: clamp(36px, 7vw, 56px) 0 88px;
}
/* texto e busca acima das fotos e do véu */
.conteudo-hero { position: relative; z-index: 1; }
/* sombra leve: mais uma garantia de leitura sobre qualquer pedaço de foto */
.hoje, .hero h1, .chamada { text-shadow: 0 1px 2px rgba(5, 14, 36, 0.45); }
/* amarelo claro da marca: sobre as fotos, o amarelo normal ficava abaixo de 4,5:1 no pior pedaço da imagem */
.hoje { margin: 0 0 8px; color: var(--destaque-claro); font-weight: 600; font-size: 0.9rem; }
.hero h1 { margin: 0; max-width: 680px; color: #fff; font-size: clamp(1.7rem, 4.5vw, 2.6rem); letter-spacing: -0.025em; }
.chamada { margin: 12px 0 24px; max-width: 560px; color: #e4eaf7; font-size: 1.05rem; }

.busca {
  position: relative; display: flex; gap: 8px; max-width: 600px;
  padding: 6px; border-radius: 14px; background: #fff; box-shadow: var(--sombra-alta);
  transition: box-shadow var(--duracao-curta) ease;
}
.busca-icone { position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: var(--texto-suave); pointer-events: none; }
.busca input {
  flex: 1; min-width: 0; min-height: 44px; padding: 0 12px 0 44px;
  border: 0; border-radius: var(--raio-medio); font: inherit; font-size: 1rem; color: var(--texto);
  background: transparent;
}
.busca input::placeholder { color: #8a93ab; }
.busca input:focus-visible { outline: none; }
/* o foco aparece na caixa inteira, não só no campo */
.busca:focus-within { box-shadow: 0 0 0 3px var(--foco), var(--sombra-alta); }

/* os atalhos sobem por cima do fim do banner azul */
/* position + z-index: sem isso o banner (que agora tem position: relative) seria desenhado por cima deles */
.atalhos { position: relative; z-index: 1; margin-top: -52px; margin-bottom: 8px; }

/* Ponto vermelho dos urgentes: pulsa UMA vez quando aparece, para chamar o olho, e depois fica parado.
   Pulsar para sempre cansa e tira a atenção do resto. O anel é um ::after com transform/opacity (leve para o navegador). */
.ponto-urgente {
  position: relative;
  display: inline-block; width: 10px; height: 10px; margin-right: 8px; vertical-align: middle;
  border-radius: 50%; background: var(--urgente);
}
.ponto-urgente::after {
  content: ''; position: absolute; inset: 0; border-radius: 50%;
  background: var(--urgente); opacity: 0;
  animation: pulso 1.2s var(--suave-saida) 400ms 1;
}
@keyframes pulso {
  from { opacity: 0.5; transform: scale(1); }
  to { opacity: 0; transform: scale(2.6); }
}

.duas-colunas { display: grid; gap: 32px; grid-template-columns: minmax(0, 1fr) 320px; align-items: start; }

.painel-datas {
  padding: 20px; border-radius: var(--raio);
  background: var(--superficie); box-shadow: var(--sombra);
  position: sticky; top: calc(var(--altura-cabecalho) + 20px); /* fica abaixo do cabeçalho fixo */
}
.painel-datas :deep(h2) { font-size: 1.15rem; }
.datas { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }

@media (max-width: 900px) {
  .duas-colunas { grid-template-columns: 1fr; }
  .painel-datas { position: static; }
}
</style>
