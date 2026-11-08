import { createRouter, createWebHistory } from 'vue-router'
import { rotas } from './rotas'
import { INSTITUICAO } from '@/config'
import { carregarSessao, usuarioAtual } from '@/composables/useSessao'
import { destinoAposLogin, permite } from '@/regras/acesso'

const router = createRouter({
  history: createWebHistory(),
  routes: rotas,
  // ao trocar de tela, volta ao topo (ou à posição anterior no botão "voltar").
  // Se só mudou a query (filtros de /avisos), não mexe na rolagem.
  scrollBehavior(para, de, posicaoSalva) {
    if (posicaoSalva) return posicaoSalva
    if (para.path === de.path) return false
    return { top: 0 }
  }
})

// Antes de abrir qualquer tela: confere se quem está usando pode abrir.
// (Só controla o que aparece. Quem protege os dados de verdade é a API, em cada pedido.)
router.beforeEach(async (para) => {
  await carregarSessao()
  const usuario = usuarioAtual()

  // já logado não precisa ver a tela de login
  if (para.name === 'entrar' && usuario) return destinoAposLogin(usuario)

  if (permite(para.meta.requer, usuario)) return true

  // não logado → login, e depois volta para a tela pedida
  if (!usuario) return { name: 'entrar', query: { voltar: para.fullPath } }

  // logado, mas sem o perfil necessário
  return { name: 'sem-acesso', query: { pagina: para.fullPath } }
})

// Atualiza o título da aba a cada troca de tela
router.afterEach((rota) => {
  document.title = `${rota.meta.titulo ?? 'Mural'} · ${INSTITUICAO.nomeSite}`
})

export default router
