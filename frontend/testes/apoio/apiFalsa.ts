// API de mentira para os testes: troca o "adapter" do axios (a parte que faz a requisição de verdade)
// por uma função que responde na hora e guarda o que foi pedido. Nenhuma requisição sai da máquina.
import { AxiosError, AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { cliente } from '@/services/api'

export interface RespostaFalsa {
  status: number
  data?: unknown
  /** simula a API fora do ar (sem resposta nenhuma) */
  semResposta?: boolean
}

export interface PedidoFeito {
  method: string | undefined
  url: string | undefined
  /** corpo como a API recebe (texto JSON) */
  corpo: unknown
  config: InternalAxiosRequestConfig
}

const adapterOriginal = cliente.defaults.adapter

export function simularApi(resposta: RespostaFalsa | ((pedido: PedidoFeito) => RespostaFalsa)) {
  const pedidos: PedidoFeito[] = []

  cliente.defaults.adapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    const pedido: PedidoFeito = {
      method: config.method?.toUpperCase(),
      url: config.url,
      corpo: typeof config.data === 'string' ? JSON.parse(config.data) : config.data,
      config
    }
    pedidos.push(pedido)
    const r = typeof resposta === 'function' ? resposta(pedido) : resposta

    if (r.semResposta) throw new AxiosError('Network Error', AxiosError.ERR_NETWORK, config)

    const respostaAxios: AxiosResponse = {
      data: r.data ?? '',
      status: r.status,
      statusText: String(r.status),
      headers: new AxiosHeaders(),
      config
    }
    // igual ao axios de verdade: status fora de 2xx vira erro
    if (r.status >= 400) {
      throw new AxiosError(`Request failed with status code ${r.status}`, AxiosError.ERR_BAD_RESPONSE, config, null, respostaAxios)
    }
    return respostaAxios
  }

  return { pedidos }
}

export function restaurarApi(): void {
  cliente.defaults.adapter = adapterOriginal
}
