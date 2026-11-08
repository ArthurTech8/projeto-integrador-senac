// O mensageiro: único lugar do frontend que conversa com a API (via axios).
// Toda chamada passa por pedir(), então o erro é tratado num lugar só.
import axios, { type AxiosRequestConfig } from 'axios'

// Cliente axios com o endereço da API (VITE_API_URL vem do compose.yaml no build)
export const cliente = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
  // manda o cookie de sessão (HttpOnly) junto com os pedidos; a API libera com AllowCredentials
  withCredentials: true,
  // sem resposta em 10s → erro (evita a tela ficar "Carregando…" para sempre)
  timeout: 10_000
})

// Erro padronizado: as telas só precisam olhar "status" e "message"
export class ErroApi extends Error {
  readonly status: number | null

  constructor(mensagem: string, status: number | null) {
    super(mensagem)
    this.name = 'ErroApi'
    this.status = status
  }
}

// A API devolve { "erro": "Informe o título." } nos 400
interface CorpoErro {
  erro?: string
}

// Mensagens para quando a API não manda texto próprio
const MENSAGENS_STATUS: Record<number, string> = {
  401: 'Sua sessão expirou. Entre de novo.',
  403: 'Você não tem permissão para fazer isso.',
  429: 'Muitas tentativas seguidas. Aguarde um minuto e tente de novo.'
}

function paraErroApi(erro: unknown): ErroApi {
  if (axios.isAxiosError<CorpoErro>(erro)) {
    const status = erro.response?.status ?? null
    const corpo = erro.response?.data
    const mensagem =
      (typeof corpo === 'object' && corpo?.erro) ||
      (status !== null ? MENSAGENS_STATUS[status] ?? `Erro ${status}` : 'A API não respondeu')
    return new ErroApi(mensagem, status)
  }
  return new ErroApi(erro instanceof Error ? erro.message : 'Erro desconhecido', null)
}

// Quem quiser saber quando a API responder 401 (sessão perdida) se registra aqui.
// O composable useSessao usa isso para "deslogar" o front na hora.
let aoPerderSessao: (() => void) | null = null
export function quandoPerderSessao(callback: () => void): void {
  aoPerderSessao = callback
}

// Faz a requisição e devolve o corpo já convertido de JSON.
// Respostas 204 (sem corpo) viram null. Qualquer falha vira ErroApi.
export async function pedir<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const resposta = await cliente.request<T>(config)
    if (resposta.status === 204) return null as T
    return resposta.data
  } catch (erro) {
    const erroApi = paraErroApi(erro)
    if (erroApi.status === 401) aoPerderSessao?.()
    throw erroApi
  }
}
