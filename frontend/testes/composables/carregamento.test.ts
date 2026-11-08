// useAvisos, useAviso e useUsuarios: estado de carregando, sucesso e erro.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { nextTick, ref } from 'vue'
import { useAvisos } from '@/composables/useAvisos'
import { useAviso } from '@/composables/useAviso'
import { useUsuarios } from '@/composables/useUsuarios'
import { buscarAviso, listarAvisos } from '@/services/avisos'
import { listarUsuarios } from '@/services/usuarios'
import { ErroApi } from '@/services/api'
import { MENSAGEM_ERRO_API, MENSAGEM_NAO_ENCONTRADO } from '@/config'
import { criarAviso, criarUsuario } from '../apoio/fabricas'
import { montarComposable } from '../apoio/montar'

vi.mock('@/services/avisos')
vi.mock('@/services/usuarios')

beforeEach(() => { vi.resetAllMocks() })

describe('useAvisos', () => {
  it('carrega a lista ao abrir a tela', async () => {
    const lista = [criarAviso(), criarAviso()]
    vi.mocked(listarAvisos).mockResolvedValue(lista)
    const { resultado } = montarComposable(() => useAvisos())
    expect(resultado.carregando.value).toBe(true)
    await flushPromises()
    expect(resultado.carregando.value).toBe(false)
    expect(resultado.avisos.value).toEqual(lista)
    expect(resultado.erro.value).toBe('')
  })

  it('API fora do ar → mensagem padrão', async () => {
    vi.mocked(listarAvisos).mockRejectedValue(new ErroApi('A API não respondeu', null))
    const { resultado } = montarComposable(() => useAvisos())
    await flushPromises()
    expect(resultado.erro.value).toBe(MENSAGEM_ERRO_API)
    expect(resultado.carregando.value).toBe(false)
  })

  it('carregar() de novo limpa o erro anterior', async () => {
    vi.mocked(listarAvisos).mockRejectedValueOnce(new Error('x')).mockResolvedValueOnce([])
    const { resultado } = montarComposable(() => useAvisos())
    await flushPromises()
    expect(resultado.erro.value).not.toBe('')
    await resultado.carregar()
    expect(resultado.erro.value).toBe('')
  })
})

describe('useAviso', () => {
  it('busca pelo id e busca de novo quando o id muda', async () => {
    const id = ref<number>(1)
    vi.mocked(buscarAviso).mockImplementation(async (valor) => criarAviso({ id: Number(valor) }))
    const { resultado } = montarComposable(() => useAviso(id))
    await flushPromises()
    expect(resultado.aviso.value?.id).toBe(1)
    id.value = 2
    await nextTick()
    await flushPromises()
    expect(buscarAviso).toHaveBeenLastCalledWith(2)
    expect(resultado.aviso.value?.id).toBe(2)
  })

  it('404 → naoEncontrado e mensagem de "não existe"', async () => {
    vi.mocked(buscarAviso).mockRejectedValue(new ErroApi('Erro 404', 404))
    const { resultado } = montarComposable(() => useAviso(99))
    await flushPromises()
    expect(resultado.naoEncontrado.value).toBe(true)
    expect(resultado.erro.value).toBe(MENSAGEM_NAO_ENCONTRADO)
    expect(resultado.aviso.value).toBeNull()
  })

  it('outro erro → mensagem padrão, sem marcar como não encontrado', async () => {
    vi.mocked(buscarAviso).mockRejectedValue(new ErroApi('Erro 500', 500))
    const { resultado } = montarComposable(() => useAviso(() => '5'))
    await flushPromises()
    expect(resultado.naoEncontrado.value).toBe(false)
    expect(resultado.erro.value).toBe(MENSAGEM_ERRO_API)
  })
})

describe('useUsuarios', () => {
  it('carrega a lista de usuários', async () => {
    const lista = [criarUsuario()]
    vi.mocked(listarUsuarios).mockResolvedValue(lista)
    const { resultado } = montarComposable(() => useUsuarios())
    await flushPromises()
    expect(resultado.usuarios.value).toEqual(lista)
    expect(resultado.carregando.value).toBe(false)
  })

  it('403 mostra a mensagem de permissão; outros erros, a mensagem padrão', async () => {
    vi.mocked(listarUsuarios).mockRejectedValueOnce(new ErroApi('Você não tem permissão para fazer isso.', 403))
    const { resultado } = montarComposable(() => useUsuarios())
    await flushPromises()
    expect(resultado.erro.value).toBe('Você não tem permissão para fazer isso.')

    vi.mocked(listarUsuarios).mockRejectedValueOnce(new ErroApi('Erro 500', 500))
    await resultado.carregar()
    expect(resultado.erro.value).toBe(MENSAGEM_ERRO_API)
  })
})
