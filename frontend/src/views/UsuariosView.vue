<script setup lang="ts">
// Tela de usuários (só admin): cadastrar, editar e excluir.
// "Excluir" tira o usuário do sistema na hora (ele perde o acesso mesmo com a sessão aberta);
// no banco a linha só fica inativa (ativo = 0).
import { ref, computed, useTemplateRef } from 'vue'
import Icone from '@/components/ui/Icone.vue'
import CabecalhoPagina from '@/components/ui/CabecalhoPagina.vue'
import EstadoCarregamento from '@/components/ui/EstadoCarregamento.vue'
import EstadoVazio from '@/components/ui/EstadoVazio.vue'
import FormularioUsuario from '@/components/usuarios/FormularioUsuario.vue'
import ItemUsuario from '@/components/usuarios/ItemUsuario.vue'
import { useUsuarios } from '@/composables/useUsuarios'
import { useSessao } from '@/composables/useSessao'
import { criarUsuario, alterarUsuario, excluirUsuario } from '@/services/usuarios'
import { CHAVES_PERFIS, PERFIS } from '@/config'
import { comportamentoRolagem } from '@/utils/movimento'
import type { Perfil, Usuario, UsuarioEntrada } from '@/types'

const { usuarios, carregando, erro, carregar } = useUsuarios()
const { usuario: eu } = useSessao()

const filtroPerfil = ref<Perfil | ''>('')
const lista = computed(() =>
  filtroPerfil.value ? usuarios.value.filter((u) => u.perfil === filtroPerfil.value) : usuarios.value)
const contagem = computed(() =>
  Object.fromEntries(CHAVES_PERFIS.map((p) => [p, usuarios.value.filter((u) => u.perfil === p).length])) as Record<Perfil, number>)

const emEdicao = ref<Usuario | null>(null)
const salvando = ref(false)
const excluindo = ref(false)
const sucesso = ref('')
const erroAcao = ref('')
const formularioRef = useTemplateRef<InstanceType<typeof FormularioUsuario>>('formulario')
const painelRef = useTemplateRef<HTMLElement>('painel')

const mensagemDe = (e: unknown): string => (e instanceof Error ? e.message : String(e))
const ehEu = (u: Usuario | null): boolean => u !== null && u.id === eu.value?.id

function limparMensagens(): void {
  sucesso.value = ''
  erroAcao.value = ''
}

async function salvar(dados: UsuarioEntrada): Promise<void> {
  limparMensagens()
  salvando.value = true
  try {
    if (emEdicao.value) {
      await alterarUsuario(emEdicao.value.id, dados)
      sucesso.value = `Usuário ${dados.nome} alterado.`
    } else {
      await criarUsuario(dados)
      sucesso.value = `Usuário ${dados.nome} cadastrado.`
    }
    cancelar()
    await carregar()
  } catch (e) {
    erroAcao.value = `Não foi possível salvar: ${mensagemDe(e)}`
  } finally {
    salvando.value = false
  }
}

function editar(usuario: Usuario): void {
  limparMensagens()
  emEdicao.value = usuario
  painelRef.value?.scrollIntoView({ behavior: comportamentoRolagem(), block: 'start' })
}

function cancelar(): void {
  emEdicao.value = null
  formularioRef.value?.limpar()
}

async function excluir(usuario: Usuario): Promise<void> {
  if (!confirm(`Excluir o usuário "${usuario.nome}"? Ele perde o acesso ao sistema na hora.`)) return
  limparMensagens()
  excluindo.value = true
  try {
    await excluirUsuario(usuario.id)
    if (emEdicao.value?.id === usuario.id) cancelar()
    sucesso.value = `Usuário ${usuario.nome} excluído.`
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
    <CabecalhoPagina titulo="Usuários" subtitulo="Cadastre quem pode entrar no sistema: administradores, editores e alunos." />

    <div class="layout">
      <section ref="painel" class="painel" aria-labelledby="t-form">
        <h2 id="t-form">{{ emEdicao ? 'Editar usuário' : 'Novo usuário' }}</h2>
        <FormularioUsuario
          ref="formulario"
          :usuario="emEdicao"
          :salvando="salvando"
          :eu-mesmo="ehEu(emEdicao)"
          @salvar="salvar"
          @cancelar="cancelar"
        />
      </section>

      <section aria-labelledby="t-lista">
        <div class="cabecalho-lista">
          <h2 id="t-lista">Usuários ({{ usuarios.length }})</h2>
          <label class="campo filtro">
            <span class="visualmente-oculto">Filtrar por perfil</span>
            <select v-model="filtroPerfil">
              <option value="">Todos os perfis</option>
              <option v-for="p in CHAVES_PERFIS" :key="p" :value="p">{{ PERFIS[p].rotulo }} ({{ contagem[p] }})</option>
            </select>
          </label>
        </div>

        <p v-if="sucesso" class="mensagem mensagem-sucesso" role="status">{{ sucesso }}</p>
        <p v-if="erroAcao" class="mensagem mensagem-erro" role="alert"><Icone nome="alerta" /> {{ erroAcao }}</p>

        <EstadoCarregamento :carregando="carregando" :erro="erro" texto-carregando="Carregando usuários…" @tentar-de-novo="carregar">
          <ul v-if="lista.length" class="itens">
            <ItemUsuario
              v-for="u in lista"
              :key="u.id"
              :usuario="u"
              :selecionado="emEdicao?.id === u.id"
              :eu-mesmo="ehEu(u)"
              :ocupado="excluindo"
              @editar="editar"
              @excluir="excluir"
            />
          </ul>
          <EstadoVazio v-else>Nenhum usuário com este perfil.</EstadoVazio>
        </EstadoCarregamento>
      </section>
    </div>
  </div>
</template>

<style scoped>
.layout { display: grid; gap: 24px; grid-template-columns: minmax(0, 5fr) minmax(0, 6fr); align-items: start; }
@media (max-width: 960px) { .layout { grid-template-columns: 1fr; } }

h2 { margin: 0; font-size: 1.2rem; }
.painel h2 { margin-bottom: 16px; }
/* .painel vem de styles/componentes.css; aqui só o espaço para não ficar atrás do cabeçalho fixo */
.painel { scroll-margin-top: calc(var(--altura-cabecalho) + 16px); }
.cabecalho-lista { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 16px; margin-bottom: 16px; }
.filtro { min-width: 200px; }
.mensagem { margin: 0 0 12px; }
.itens { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
</style>
