// Cada função de services/ chama o verbo e o endereço certos, com o corpo certo.
import { afterEach, describe, expect, it } from 'vitest'
import { alterarAviso, buscarAviso, criarAviso, excluirAviso, listarAvisos } from '@/services/avisos'
import { buscarUsuarioLogado, entrar, sair, trocarSenha } from '@/services/auth'
import { alterarUsuario, criarUsuario, excluirUsuario, listarUsuarios } from '@/services/usuarios'
import { ROTAS_API } from '@/services/rotas'
import { paraEnvio } from '@/regras/formularioAviso'
import { restaurarApi, simularApi } from '../apoio/apiFalsa'
import { criarAviso as fabricarAviso } from '../apoio/fabricas'

afterEach(restaurarApi)

describe('ROTAS_API', () => {
  it('monta os endereços e protege o id na URL', () => {
    expect(ROTAS_API.aviso(5)).toBe('/api/avisos/5')
    expect(ROTAS_API.aviso('a/b')).toBe('/api/avisos/a%2Fb')
    expect(ROTAS_API.usuario(9)).toBe('/api/usuarios/9')
  })
})

describe('services/avisos', () => {
  const corpo = paraEnvio({ ...fabricarAviso(), dataInicio: '', dataFim: '', localizacao: '', link: '', empresa: '', modalidade: '' })

  it.each([
    ['listarAvisos', () => listarAvisos(), 'GET', '/api/avisos', undefined],
    ['buscarAviso', () => buscarAviso(3), 'GET', '/api/avisos/3', undefined],
    ['criarAviso', () => criarAviso(corpo), 'POST', '/api/avisos', corpo],
    ['alterarAviso', () => alterarAviso(3, corpo), 'PUT', '/api/avisos/3', corpo],
    ['excluirAviso', () => excluirAviso(3), 'DELETE', '/api/avisos/3', undefined]
  ])('%s → %s %s', async (_, chamar, metodo, url, enviado) => {
    const { pedidos } = simularApi({ status: 200, data: {} })
    await chamar()
    expect(pedidos).toHaveLength(1)
    expect(pedidos[0]).toMatchObject({ method: metodo, url })
    expect(pedidos[0]?.corpo).toEqual(enviado)
  })
})

describe('services/auth', () => {
  it.each([
    ['entrar', () => entrar({ email: 'a@b.com', senha: '12345678' }), 'POST', '/api/auth/entrar', { email: 'a@b.com', senha: '12345678' }],
    ['sair', () => sair(), 'POST', '/api/auth/sair', undefined],
    ['buscarUsuarioLogado', () => buscarUsuarioLogado(), 'GET', '/api/auth/eu', undefined],
    ['trocarSenha', () => trocarSenha({ senhaAtual: 'antiga123', novaSenha: 'nova12345' }), 'PUT', '/api/conta/senha',
      { senhaAtual: 'antiga123', novaSenha: 'nova12345' }]
  ])('%s → %s %s', async (_, chamar, metodo, url, enviado) => {
    const { pedidos } = simularApi({ status: 200, data: {} })
    await chamar()
    expect(pedidos[0]).toMatchObject({ method: metodo, url })
    expect(pedidos[0]?.corpo).toEqual(enviado)
  })

  it('buscarUsuarioLogado devolve null quando ninguém está logado (204)', async () => {
    simularApi({ status: 204 })
    await expect(buscarUsuarioLogado()).resolves.toBeNull()
  })
})

describe('services/usuarios', () => {
  const corpo = { nome: 'Ana', email: 'ana@x.com', perfil: 'editor', curso: null, senha: '' } as const

  it.each([
    ['listarUsuarios', () => listarUsuarios(), 'GET', '/api/usuarios', undefined],
    ['criarUsuario', () => criarUsuario(corpo), 'POST', '/api/usuarios', corpo],
    ['alterarUsuario', () => alterarUsuario(2, corpo), 'PUT', '/api/usuarios/2', corpo],
    ['excluirUsuario', () => excluirUsuario(2), 'DELETE', '/api/usuarios/2', undefined]
  ])('%s → %s %s', async (_, chamar, metodo, url, enviado) => {
    const { pedidos } = simularApi({ status: 200, data: {} })
    await chamar()
    expect(pedidos[0]).toMatchObject({ method: metodo, url })
    expect(pedidos[0]?.corpo).toEqual(enviado)
  })
})
