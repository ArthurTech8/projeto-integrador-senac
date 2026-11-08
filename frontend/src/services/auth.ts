// Login, logout, "quem sou eu" e troca da própria senha. Todas passam por pedir().
import { pedir } from './api'
import { ROTAS_API } from './rotas'
import type { DadosLogin, TrocaSenha, Usuario } from '@/types'

// 200 + usuário (a API grava o cookie de sessão). Errado → ErroApi 401 "E-mail ou senha incorretos."
export function entrar(dados: DadosLogin): Promise<Usuario> {
  return pedir<Usuario>({ method: 'POST', url: ROTAS_API.entrar, data: dados })
}

// 204 → null (a API apaga o cookie)
export function sair(): Promise<null> {
  return pedir<null>({ method: 'POST', url: ROTAS_API.sair })
}

// Usuário logado, ou null (204) se ninguém estiver logado
export function buscarUsuarioLogado(): Promise<Usuario | null> {
  return pedir<Usuario | null>({ method: 'GET', url: ROTAS_API.eu })
}

// 204 → null. Senha atual errada → ErroApi 400
export function trocarSenha(dados: TrocaSenha): Promise<null> {
  return pedir<null>({ method: 'PUT', url: ROTAS_API.senha, data: dados })
}
