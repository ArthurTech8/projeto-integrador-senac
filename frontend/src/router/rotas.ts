// Lista de telas do site. Cada URL mostra uma tela (view).
//
// meta.titulo → título da aba do navegador
// meta.menu   → { texto, ordem }: aparece no menu do topo (CabecalhoSite.vue)
// meta.layout → moldura da tela: 'padrao' (sem valor = cabeçalho + rodapé) ou 'vazio' (tela cheia)
// meta.requer → quem pode abrir: 'logado', 'equipe' (admin/editor) ou 'admin'. Sem valor = pública.
//               O router (router/index.ts) confere antes de abrir; a API confere de novo em cada pedido.
//
// A página inicial carrega junto com o site; as outras só quando o aluno abre
// ("() => import(...)"), deixando o primeiro carregamento mais leve.
import type { RouteRecordRaw } from 'vue-router'
import InicioView from '@/views/InicioView.vue'

export const rotas: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'inicio',
    component: InicioView,
    meta: { titulo: 'Início', menu: { texto: 'Início', ordem: 1 } }
  },
  {
    path: '/avisos',
    name: 'avisos',
    component: () => import('@/views/AvisosView.vue'),
    meta: { titulo: 'Avisos', menu: { texto: 'Avisos', ordem: 2 } }
  },
  {
    // só aceita número: /avisos/abc cai na página "não encontrada"
    path: '/avisos/:id(\\d+)',
    name: 'aviso',
    component: () => import('@/views/AvisoDetalheView.vue'),
    props: true,
    meta: { titulo: 'Aviso' }
  },
  {
    path: '/calendario',
    name: 'calendario',
    component: () => import('@/views/CalendarioView.vue'),
    meta: { titulo: 'Calendário', menu: { texto: 'Calendário', ordem: 3 } }
  },
  {
    path: '/gerenciar',
    name: 'gerenciar',
    component: () => import('@/views/GerenciarView.vue'),
    meta: { titulo: 'Gerenciar avisos', menu: { texto: 'Gerenciar', ordem: 4 }, requer: 'equipe' }
  },
  {
    path: '/usuarios',
    name: 'usuarios',
    component: () => import('@/views/UsuariosView.vue'),
    meta: { titulo: 'Usuários', menu: { texto: 'Usuários', ordem: 5 }, requer: 'admin' }
  },
  {
    path: '/conta',
    name: 'conta',
    component: () => import('@/views/ContaView.vue'),
    meta: { titulo: 'Minha conta', requer: 'logado' }
  },
  {
    // tela cheia, sem cabeçalho nem rodapé
    path: '/entrar',
    name: 'entrar',
    component: () => import('@/views/LoginView.vue'),
    meta: { titulo: 'Entrar', layout: 'vazio' }
  },
  {
    path: '/sem-acesso',
    name: 'sem-acesso',
    component: () => import('@/views/AcessoNegadoView.vue'),
    meta: { titulo: 'Acesso negado' }
  },
  {
    path: '/:caminho(.*)*',
    name: 'nao-encontrado',
    component: () => import('@/views/NaoEncontradoView.vue'),
    meta: { titulo: 'Página não encontrada' }
  }
]
