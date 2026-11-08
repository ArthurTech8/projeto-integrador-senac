// Textos de cada perfil de usuário (iguais aos perfis do backend/Seguranca/Perfis.cs)
import type { Perfil } from '@/types'

export interface InfoPerfil {
  rotulo: string
  descricao: string
}

export const PERFIS: Record<Perfil, InfoPerfil> = {
  admin: { rotulo: 'Administrador', descricao: 'Publica avisos e gerencia usuários' },
  editor: { rotulo: 'Editor', descricao: 'Publica, edita e exclui avisos' },
  aluno: { rotulo: 'Aluno', descricao: 'Vê o mural filtrado pelo seu curso' }
}

export const CHAVES_PERFIS = Object.keys(PERFIS) as Perfil[]

/** Mesmo mínimo do backend (Seguranca/Senhas.cs) */
export const TAMANHO_MINIMO_SENHA = 8
