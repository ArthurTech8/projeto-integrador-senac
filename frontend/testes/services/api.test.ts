import { afterEach, describe, expect, it, vi } from 'vitest'
import { ErroApi, cliente, pedir, quandoPerderSessao } from '@/services/api'
import { restaurarApi, simularApi } from '../apoio/apiFalsa'

afterEach(() => {
  restaurarApi()
  quandoPerderSessao(() => {})
})

async function erroDe(promessa: Promise<unknown>): Promise<ErroApi> {
  try {
    await promessa
  } catch (erro) {
    if (erro instanceof ErroApi) return erro
    throw erro
  }
  throw new Error('era para ter dado erro')
}

describe('cliente axios', () => {
  it('manda o cookie de sessão, fala JSON e desiste depois de 10 s', () => {
    expect(cliente.defaults.withCredentials).toBe(true)
    expect(cliente.defaults.timeout).toBe(10_000)
    expect(cliente.defaults.headers['Content-Type']).toBe('application/json')
  })
})

describe('pedir', () => {
  it('devolve o corpo da resposta', async () => {
    simularApi({ status: 200, data: [{ id: 1 }] })
    await expect(pedir({ method: 'GET', url: '/api/avisos' })).resolves.toEqual([{ id: 1 }])
  })

  it('resposta 204 vira null', async () => {
    simularApi({ status: 204 })
    await expect(pedir({ method: 'DELETE', url: '/api/avisos/1' })).resolves.toBeNull()
  })

  it('envia o corpo como objeto: o JSON chega convertido uma vez só (nunca JSON.stringify)', async () => {
    const { pedidos } = simularApi({ status: 201, data: {} })
    await pedir({ method: 'POST', url: '/api/avisos', data: { titulo: 'Oi', urgente: true } })
    expect(pedidos[0]?.corpo).toEqual({ titulo: 'Oi', urgente: true })
  })

  it('erro com { erro } da API vira ErroApi com a mensagem e o status', async () => {
    simularApi({ status: 400, data: { erro: 'Informe o título.' } })
    const erro = await erroDe(pedir({ method: 'POST', url: '/api/avisos', data: {} }))
    expect(erro).toBeInstanceOf(ErroApi)
    expect(erro.name).toBe('ErroApi')
    expect(erro.status).toBe(400)
    expect(erro.message).toBe('Informe o título.')
  })

  it.each([
    [403, 'Você não tem permissão para fazer isso.'],
    [404, 'Erro 404'],
    [429, 'Muitas tentativas seguidas. Aguarde um minuto e tente de novo.'],
    [500, 'Erro 500']
  ])('status %i sem mensagem da API → "%s"', async (status, mensagem) => {
    simularApi({ status })
    const erro = await erroDe(pedir({ method: 'GET', url: '/x' }))
    expect(erro.status).toBe(status)
    expect(erro.message).toBe(mensagem)
  })

  it('401 avisa quem se registrou em quandoPerderSessao', async () => {
    const perdeu = vi.fn()
    quandoPerderSessao(perdeu)
    simularApi({ status: 401 })
    const erro = await erroDe(pedir({ method: 'GET', url: '/api/usuarios' }))
    expect(erro.message).toBe('Sua sessão expirou. Entre de novo.')
    expect(perdeu).toHaveBeenCalledOnce()
  })

  it('outros erros não derrubam a sessão', async () => {
    const perdeu = vi.fn()
    quandoPerderSessao(perdeu)
    simularApi({ status: 403 })
    await erroDe(pedir({ method: 'GET', url: '/api/usuarios' }))
    expect(perdeu).not.toHaveBeenCalled()
  })

  it('API fora do ar → status null e "A API não respondeu"', async () => {
    simularApi({ status: 0, semResposta: true })
    const erro = await erroDe(pedir({ method: 'GET', url: '/api/avisos' }))
    expect(erro.status).toBeNull()
    expect(erro.message).toBe('A API não respondeu')
  })

  it('erro que não é do axios também vira ErroApi', async () => {
    vi.spyOn(cliente, 'request').mockRejectedValueOnce(new Error('falhou')).mockRejectedValueOnce('texto solto')
    expect((await erroDe(pedir({ url: '/x' }))).message).toBe('falhou')
    expect((await erroDe(pedir({ url: '/x' }))).message).toBe('Erro desconhecido')
  })
})
