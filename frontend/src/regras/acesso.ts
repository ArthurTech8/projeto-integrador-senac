// Regras de acesso do front (funções puras). A segurança de verdade está na API:
// aqui só decidimos o que mostrar e para onde mandar o usuário.
import type { Acesso, Perfil, Usuario } from '@/types'

// O usuário (ou ninguém, se null) pode abrir algo que exige "requer"?
export function permite(requer: Acesso | undefined, usuario: Usuario | null): boolean {
  if (!requer) return true
  if (!usuario) return false
  if (requer === 'logado') return true
  if (requer === 'equipe') return usuario.perfil === 'admin' || usuario.perfil === 'editor'
  return usuario.perfil === 'admin'
}

export function ehEquipe(perfil: Perfil | undefined): boolean {
  return perfil === 'admin' || perfil === 'editor'
}

// Para onde ir depois de entrar, quando não havia uma página pedida antes
export function destinoAposLogin(usuario: Usuario): string {
  return ehEquipe(usuario.perfil) ? '/gerenciar' : '/avisos'
}

// Só aceita voltar para um caminho interno ("/avisos?x=1"), nunca para outro site ("//site.com")
export function caminhoSeguro(valor: unknown): string | null {
  return typeof valor === 'string' && valor.startsWith('/') && !valor.startsWith('//') ? valor : null
}
