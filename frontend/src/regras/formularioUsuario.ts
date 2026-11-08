// Regras do formulário de usuários: estado inicial, validação e conversão para a API.
// A API valida tudo de novo; aqui é só para avisar antes de enviar.
import { TAMANHO_MINIMO_SENHA } from '@/config'
import type { Usuario, UsuarioEntrada, UsuarioFormulario } from '@/types'

export function usuarioVazio(): UsuarioFormulario {
  return { nome: '', email: '', perfil: 'editor', curso: '', senha: '' }
}

export function paraFormulario(usuario: Usuario): UsuarioFormulario {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    perfil: usuario.perfil,
    curso: usuario.curso ?? '',
    senha: '' // nunca vem da API; vazio = manter a senha atual
  }
}

// Mensagem do primeiro problema encontrado, ou '' se estiver tudo certo
export function problemaNoFormulario(dados: UsuarioFormulario, editando: boolean): string {
  if (!dados.nome.trim()) return 'Informe o nome.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email.trim())) return 'Informe um e-mail válido.'
  if (dados.perfil === 'aluno' && !dados.curso) return 'Escolha o curso do aluno.'
  if (!editando && !dados.senha) return 'Defina uma senha inicial.'
  if (dados.senha && dados.senha.length < TAMANHO_MINIMO_SENHA)
    return `A senha precisa ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`
  return ''
}

export function paraEnvio(dados: UsuarioFormulario): UsuarioEntrada {
  return {
    nome: dados.nome.trim(),
    email: dados.email.trim().toLowerCase(),
    perfil: dados.perfil,
    // só aluno tem curso
    curso: dados.perfil === 'aluno' ? dados.curso : null,
    senha: dados.senha
  }
}
