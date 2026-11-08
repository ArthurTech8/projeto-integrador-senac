// A sessão é um estado único para o site inteiro (fica no módulo). Por isso cada teste
// importa uma cópia nova do módulo (vi.resetModules), para um teste não herdar o login do outro.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { carregarSessao, useSessao, usuarioAtual } from '@/composables/useSessao'
import { criarUsuario } from '../apoio/fabricas'

vi.mock('@/services/auth', () => ({
  buscarUsuarioLogado: vi.fn(),
  entrar: vi.fn(),
  sair: vi.fn()
}))

async function carregarModulos() {
  const sessao = await import('@/composables/useSessao')
  const auth = await import('@/services/auth')
  const api = await import('@/services/api')
  const apiFalsa = await import('../apoio/apiFalsa')
  return { ...sessao, auth, api, apiFalsa }
}

beforeEach(() => { vi.resetModules() })
afterEach(async () => { (await import('../apoio/apiFalsa')).restaurarApi() })

it('o módulo exporta as três funções da sessão', () => {
  for (const funcao of [carregarSessao, useSessao, usuarioAtual]) expect(funcao).toBeTypeOf('function')
})

describe('carregarSessao e usuarioAtual', () => {
  it('pergunta à API quem está logado, uma vez só', async () => {
    const m = await carregarModulos()
    const ana = criarUsuario({ nome: 'Ana' })
    vi.mocked(m.auth.buscarUsuarioLogado).mockResolvedValue(ana)
    await m.carregarSessao()
    await m.carregarSessao()
    expect(m.auth.buscarUsuarioLogado).toHaveBeenCalledTimes(1)
    expect(m.usuarioAtual()).toEqual(ana)
  })

  it('API fora do ar → segue como ninguém logado (o mural continua público)', async () => {
    const m = await carregarModulos()
    vi.mocked(m.auth.buscarUsuarioLogado).mockRejectedValue(new Error('fora do ar'))
    await expect(m.carregarSessao()).resolves.toBeUndefined()
    expect(m.usuarioAtual()).toBeNull()
  })
})

describe('useSessao', () => {
  it('entrar guarda o usuário e calcula o perfil', async () => {
    const m = await carregarModulos()
    const editor = criarUsuario({ perfil: 'editor' })
    vi.mocked(m.auth.entrar).mockResolvedValue(editor)
    const sessao = m.useSessao()
    expect(sessao.logado.value).toBe(false)

    await expect(sessao.entrar({ email: 'e@x.com', senha: '12345678' })).resolves.toEqual(editor)
    expect(sessao.usuario.value).toEqual(editor)
    expect([sessao.logado.value, sessao.equipe.value, sessao.admin.value, sessao.aluno.value]).toEqual([true, true, false, false])
  })

  it('perfis admin e aluno', async () => {
    const m = await carregarModulos()
    const sessao = m.useSessao()
    vi.mocked(m.auth.entrar).mockResolvedValueOnce(criarUsuario({ perfil: 'admin' }))
    await sessao.entrar({ email: 'a@x.com', senha: '12345678' })
    expect([sessao.equipe.value, sessao.admin.value, sessao.aluno.value]).toEqual([true, true, false])

    vi.mocked(m.auth.entrar).mockResolvedValueOnce(criarUsuario({ perfil: 'aluno', curso: 'Enfermagem' }))
    await sessao.entrar({ email: 'b@x.com', senha: '12345678' })
    expect([sessao.equipe.value, sessao.admin.value, sessao.aluno.value]).toEqual([false, false, true])
  })

  it('login errado não muda a sessão', async () => {
    const m = await carregarModulos()
    vi.mocked(m.auth.entrar).mockRejectedValue(new m.api.ErroApi('E-mail ou senha incorretos.', 401))
    const sessao = m.useSessao()
    await expect(sessao.entrar({ email: 'x@x.com', senha: 'errada123' })).rejects.toThrow('E-mail ou senha incorretos.')
    expect(sessao.logado.value).toBe(false)
  })

  it('sair limpa a sessão, mesmo se a API falhar', async () => {
    const m = await carregarModulos()
    vi.mocked(m.auth.entrar).mockResolvedValue(criarUsuario())
    vi.mocked(m.auth.sair).mockRejectedValue(new Error('fora do ar'))
    const sessao = m.useSessao()
    await sessao.entrar({ email: 'e@x.com', senha: '12345678' })
    await expect(sessao.sair()).rejects.toThrow()
    expect(sessao.logado.value).toBe(false)
  })

  it('qualquer resposta 401 da API desloga o front na hora', async () => {
    const m = await carregarModulos()
    vi.mocked(m.auth.entrar).mockResolvedValue(criarUsuario())
    const sessao = m.useSessao()
    await sessao.entrar({ email: 'e@x.com', senha: '12345678' })

    m.apiFalsa.simularApi({ status: 401 })
    await expect(m.api.pedir({ method: 'GET', url: '/api/usuarios' })).rejects.toBeInstanceOf(m.api.ErroApi)
    expect(sessao.logado.value).toBe(false)
    expect(m.usuarioAtual()).toBeNull()
  })
})
