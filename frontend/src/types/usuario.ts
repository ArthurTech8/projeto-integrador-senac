// Formatos de dados de usuário. Espelham o Models/Usuario.cs da API.
// A senha (e o hash dela) nunca vem da API.

/** admin = avisos + usuários | editor = avisos | aluno = mural filtrado pelo curso */
export type Perfil = 'admin' | 'editor' | 'aluno'

/** Usuário como a API devolve (login, /api/auth/eu e /api/usuarios) */
export interface Usuario {
  id: number
  nome: string
  email: string
  perfil: Perfil
  /** curso do aluno; null para admin/editor */
  curso: string | null
  criadoEm: string
}

/** Corpo do POST/PUT /api/usuarios. No PUT, senha vazia = manter a atual. */
export interface UsuarioEntrada {
  nome: string
  email: string
  perfil: Perfil
  curso: string | null
  senha: string
}

/** Estado do formulário de usuário */
export interface UsuarioFormulario {
  id?: number
  nome: string
  email: string
  perfil: Perfil
  curso: string
  senha: string
}

export interface DadosLogin {
  email: string
  senha: string
}

export interface TrocaSenha {
  senhaAtual: string
  novaSenha: string
}

/** O que uma rota exige: estar logado, ser da equipe (admin/editor) ou ser admin */
export type Acesso = 'logado' | 'equipe' | 'admin'
