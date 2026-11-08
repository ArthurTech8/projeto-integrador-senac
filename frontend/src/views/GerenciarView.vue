<script setup lang="ts">
// Tela da secretaria: junta o formulário e a lista, e é a única que grava na API.
// "Excluir" tira o aviso do sistema para o usuário; no banco ele só fica inativo (ativo = 0).
import { ref, computed, useTemplateRef } from 'vue'
import Icone from '@/components/ui/Icone.vue'
import CabecalhoPagina from '@/components/ui/CabecalhoPagina.vue'
import EstadoCarregamento from '@/components/ui/EstadoCarregamento.vue'
import EstadoVazio from '@/components/ui/EstadoVazio.vue'
import Paginacao from '@/components/ui/Paginacao.vue'
import FormularioAviso from '@/components/avisos/FormularioAviso.vue'
import ItemGerenciar from '@/components/avisos/ItemGerenciar.vue'
import { useAvisos } from '@/composables/useAvisos'
import { usePaginacao } from '@/composables/usePaginacao'
import { criarAviso, alterarAviso, excluirAviso } from '@/services/avisos'
import { ordenarPorRelevancia } from '@/regras/avisos'
import { comportamentoRolagem } from '@/utils/movimento'
import type { Aviso, AvisoEntrada } from '@/types'

const { avisos, carregando, erro, carregar } = useAvisos()

const lista = computed(() => ordenarPorRelevancia(avisos.value))
// no máximo 10 avisos por página
const { itensDaPagina, pagina, totalPaginas, total, primeiro, ultimo, irPara } = usePaginacao(lista)
const listaRef = useTemplateRef<HTMLElement>('listaAvisos')

// Trocou de página pelos botões de baixo: sobe até o topo da lista para ver o primeiro aviso da página
function mudarPagina(numero: number): void {
  irPara(numero)
  listaRef.value?.scrollIntoView({ behavior: comportamentoRolagem(), block: 'start' })
}

const emEdicao = ref<Aviso | null>(null)   // aviso sendo editado (null = novo)
const salvando = ref(false)
const excluindo = ref(false)
const sucesso = ref('')
const erroAcao = ref('')
// Referências a elementos do template (ref="formulario" e ref="painel")
const formularioRef = useTemplateRef<InstanceType<typeof FormularioAviso>>('formulario')
const painelRef = useTemplateRef<HTMLElement>('painel')   // <section> do formulário, para rolar até ele

// Mensagem legível de qualquer erro (ErroApi já traz a mensagem da API)
const mensagemDe = (e: unknown): string => (e instanceof Error ? e.message : String(e))

function limparMensagens(): void {
  sucesso.value = ''
  erroAcao.value = ''
}

async function salvar(dados: AvisoEntrada): Promise<void> {
  limparMensagens()
  salvando.value = true
  try {
    if (emEdicao.value) {
      await alterarAviso(emEdicao.value.id, dados)
      sucesso.value = 'Aviso alterado.'
    } else {
      await criarAviso(dados)
      sucesso.value = 'Aviso publicado.'
      // o aviso novo é o mais recente: aparece na 1ª página
      irPara(1)
    }
    cancelar()
    await carregar()
  } catch (e) {
    erroAcao.value = `Não foi possível salvar: ${mensagemDe(e)}`
  } finally {
    salvando.value = false
  }
}

function editar(aviso: Aviso): void {
  limparMensagens()
  emEdicao.value = aviso
  painelRef.value?.scrollIntoView({ behavior: comportamentoRolagem(), block: 'start' })
}

function cancelar(): void {
  emEdicao.value = null
  formularioRef.value?.limpar()
}

async function excluir(aviso: Aviso): Promise<void> {
  if (!confirm(`Excluir o aviso "${aviso.titulo}"? Ele deixará de aparecer no mural.`)) return
  limparMensagens()
  excluindo.value = true
  try {
    await excluirAviso(aviso.id)
    if (emEdicao.value?.id === aviso.id) cancelar()
    sucesso.value = 'Aviso excluído.'
    await carregar()
  } catch (e) {
    erroAcao.value = `Não foi possível excluir: ${mensagemDe(e)}`
  } finally {
    excluindo.value = false
  }
}
</script>

<template>
  <div class="container">
    <CabecalhoPagina
      titulo="Gerenciar avisos"
      subtitulo="Área da secretaria e da coordenação: publique, altere ou exclua avisos do mural."
    />

    <div class="layout">
      <section ref="painel" class="painel" aria-labelledby="t-form">
        <h2 id="t-form">{{ emEdicao ? 'Editar aviso' : 'Novo aviso' }}</h2>
        <FormularioAviso ref="formulario" :aviso="emEdicao" :salvando="salvando" @salvar="salvar" @cancelar="cancelar" />
      </section>

      <section ref="listaAvisos" class="lista" aria-labelledby="t-lista">
        <h2 id="t-lista">Avisos publicados ({{ total }})</h2>

        <p v-if="sucesso" class="mensagem mensagem-sucesso" role="status">{{ sucesso }}</p>
        <p v-if="erroAcao" class="mensagem mensagem-erro" role="alert"><Icone nome="alerta" /> {{ erroAcao }}</p>

        <EstadoCarregamento :carregando="carregando" :erro="erro" @tentar-de-novo="carregar">
          <ul v-if="itensDaPagina.length" class="itens">
            <ItemGerenciar
              v-for="aviso in itensDaPagina"
              :key="aviso.id"
              :aviso="aviso"
              :selecionado="emEdicao?.id === aviso.id"
              :ocupado="excluindo"
              @editar="editar"
              @excluir="excluir"
            />
          </ul>
          <EstadoVazio v-else>Nenhum aviso cadastrado.</EstadoVazio>

          <Paginacao
            :pagina="pagina"
            :total-paginas="totalPaginas"
            :primeiro="primeiro"
            :ultimo="ultimo"
            :total="total"
            rotulo="avisos publicados"
            @ir-para="mudarPagina"
          />
        </EstadoCarregamento>
      </section>
    </div>
  </div>
</template>

<style scoped>
.layout { display: grid; gap: 24px; grid-template-columns: minmax(0, 5fr) minmax(0, 6fr); align-items: start; }
@media (max-width: 960px) { .layout { grid-template-columns: 1fr; } }

h2 { margin: 0 0 16px; font-size: 1.2rem; }

/* .painel vem de styles/componentes.css; aqui só o espaço para não ficar atrás do cabeçalho fixo */
.painel, .lista { scroll-margin-top: calc(var(--altura-cabecalho) + 16px); }

.mensagem { margin: 0 0 12px; }
.itens { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
</style>
