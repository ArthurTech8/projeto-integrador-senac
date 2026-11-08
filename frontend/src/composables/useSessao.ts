import { ref, computed } from 'vue'
import { buscarUsuarioLogado, entrar as entrarNaApi, sair as sairDaApi } from '@/services/auth'
import { quandoPerderSessao } from '@/services/api'
import { ehEquipe } from '@/regras/acesso'
import type { DadosLogin, Usuario } from '@/types'

// Sessão do usuário, COMPARTILHADA por todo o site (fica fora da função, então existe uma só).
// Quem guarda a sessão de verdade é o cookie HttpOnly da API; aqui é só a cópia para a tela.
const usuario = ref<Usuario | null>(null)
let carregamento: Promise<void> | null = null

// Se a API responder 401 em qualquer pedido, a sessão acabou: limpa a cópia do front.
quandoPerderSessao(() => { usuario.value = null })

// Pergunta à API quem está logado. Roda uma vez (o router chama antes da primeira tela).
// Se a API estiver fora do ar, segue como "ninguém logado" (o mural público continua funcionando).
export function carregarSessao(): Promise<void> {
  carregamento ??= buscarUsuarioLogado()
    .then((u) => { usuario.value = u })
    .catch(() => { usuario.value = null })
  return carregamento
}

// Para usar fora de componentes (ex.: router): o usuário atual, sem reatividade
export function usuarioAtual(): Usuario | null {
  return usuario.value
}

//   const { usuario, logado, equipe, admin, aluno, entrar, sair } = useSessao()
export function useSessao() {
  async function entrar(dados: DadosLogin): Promise<Usuario> {
    const logadoAgora = await entrarNaApi(dados)
    usuario.value = logadoAgora
    return logadoAgora
  }

  async function sair(): Promise<void> {
    try {
      await sairDaApi()
    } finally {
      usuario.value = null
    }
  }

  return {
    usuario: computed(() => usuario.value),
    logado: computed(() => usuario.value !== null),
    equipe: computed(() => ehEquipe(usuario.value?.perfil)),
    admin: computed(() => usuario.value?.perfil === 'admin'),
    aluno: computed(() => usuario.value?.perfil === 'aluno'),
    entrar,
    sair
  }
}
