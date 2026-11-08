// Cadastro de usuários (só admin). Todas passam por pedir().
import { pedir } from './api'
import { ROTAS_API } from './rotas'
import type { Usuario, UsuarioEntrada } from '@/types'

export function listarUsuarios(): Promise<Usuario[]> {
  return pedir<Usuario[]>({ method: 'GET', url: ROTAS_API.usuarios })
}

// 201 + o usuário criado. E-mail repetido → ErroApi 409
export function criarUsuario(usuario: UsuarioEntrada): Promise<Usuario> {
  return pedir<Usuario>({ method: 'POST', url: ROTAS_API.usuarios, data: usuario })
}

// 204 → null. Senha vazia = mantém a atual
export function alterarUsuario(id: number, usuario: UsuarioEntrada): Promise<null> {
  return pedir<null>({ method: 'PUT', url: ROTAS_API.usuario(id), data: usuario })
}

// 204 → null. Para quem usa o site o usuário é excluído; no banco só muda para ativo = 0
export function excluirUsuario(id: number): Promise<null> {
  return pedir<null>({ method: 'DELETE', url: ROTAS_API.usuario(id) })
}
