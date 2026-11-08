// Uma função por operação da API de avisos. Todas passam por pedir() (services/api.ts).
import { pedir } from './api'
import { ROTAS_API } from './rotas'
import type { Aviso, AvisoEntrada } from '@/types'

export function listarAvisos(): Promise<Aviso[]> {
  return pedir<Aviso[]>({ method: 'GET', url: ROTAS_API.avisos })
}

export function buscarAviso(id: number | string): Promise<Aviso> {
  return pedir<Aviso>({ method: 'GET', url: ROTAS_API.aviso(id) })
}

// 201 + o aviso criado
export function criarAviso(aviso: AvisoEntrada): Promise<Aviso> {
  return pedir<Aviso>({ method: 'POST', url: ROTAS_API.avisos, data: aviso })
}

// 204 (sem corpo) → null
export function alterarAviso(id: number, aviso: AvisoEntrada): Promise<null> {
  return pedir<null>({ method: 'PUT', url: ROTAS_API.aviso(id), data: aviso })
}

// 204 (sem corpo) → null. Para o usuário o aviso é excluído;
// no banco a API só muda o status para inativo (ativo = 0), nada é apagado.
export function excluirAviso(id: number): Promise<null> {
  return pedir<null>({ method: 'DELETE', url: ROTAS_API.aviso(id) })
}
