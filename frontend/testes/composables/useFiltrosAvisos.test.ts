import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { useFiltrosAvisos } from '@/composables/useFiltrosAvisos'
import { usuarioAtual } from '@/composables/useSessao'
import type { Aviso } from '@/types'
import { AGORA, criarAviso, criarUsuario } from '../apoio/fabricas'
import { montarComposable } from '../apoio/montar'

vi.mock('@/composables/useSessao', () => ({ usuarioAtual: vi.fn(() => null) }))

const Vazio = defineComponent({ render: () => null })

async function abrir(url: string, avisos: Aviso[] = []) {
  const router: Router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/avisos', component: Vazio }] })
  await router.push(url)
  await router.isReady()
  const lista = ref(avisos)
  const { resultado } = montarComposable(() => useFiltrosAvisos(lista), [router])
  await flushPromises()
  return { ...resultado, router, lista }
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(AGORA)
  vi.mocked(usuarioAtual).mockReturnValue(null)
})
afterEach(() => { vi.useRealTimers() })

describe('useFiltrosAvisos: lendo a URL', () => {
  it('lê categoria, curso, busca e encerrados da URL', async () => {
    const { filtros } = await abrir('/avisos?categoria=emprego&curso=Enfermagem&busca=tecnico&encerrados=1')
    expect({ ...filtros }).toEqual({ categoria: 'emprego', curso: 'Enfermagem', busca: 'tecnico', mostrarEncerrados: true })
  })

  it('ignora categoria inválida e usa só o primeiro valor de uma lista', async () => {
    const { filtros } = await abrir('/avisos?categoria=xyz&busca=a&busca=b')
    expect(filtros.categoria).toBe('')
    expect(filtros.busca).toBe('a')
  })

  it('acompanha a URL quando ela muda (link do rodapé, botão voltar)', async () => {
    const { filtros, router } = await abrir('/avisos')
    await router.push('/avisos?categoria=curso')
    await flushPromises()
    expect(filtros.categoria).toBe('curso')
  })
})

describe('useFiltrosAvisos: escrevendo na URL', () => {
  it('mudar um filtro atualiza a URL, sem espaços sobrando na busca', async () => {
    const { filtros, router } = await abrir('/avisos')
    filtros.categoria = 'emprego'
    filtros.busca = '  estagio  '
    filtros.mostrarEncerrados = true
    await flushPromises()
    expect(router.currentRoute.value.query).toEqual({ categoria: 'emprego', busca: 'estagio', encerrados: '1' })
  })

  it('limpar() zera tudo e tira os filtros da URL', async () => {
    const { filtros, router, limpar, temFiltro } = await abrir('/avisos?categoria=emprego&curso=Enfermagem')
    expect(temFiltro.value).toBe(true)
    limpar()
    await flushPromises()
    expect(temFiltro.value).toBe(false)
    expect(filtros.curso).toBe('')
    expect(router.currentRoute.value.query).toEqual({})
  })

  it('"mostrar encerrados" sozinho não conta como filtro', async () => {
    const { temFiltro } = await abrir('/avisos?encerrados=1')
    expect(temFiltro.value).toBe(false)
  })
})

describe('useFiltrosAvisos: aluno logado', () => {
  it('abre já no curso do aluno quando a URL não escolhe um', async () => {
    vi.mocked(usuarioAtual).mockReturnValue(criarUsuario({ perfil: 'aluno', curso: 'Gastronomia' }))
    const { filtros, router } = await abrir('/avisos')
    expect(filtros.curso).toBe('Gastronomia')
    expect(router.currentRoute.value.query).toEqual({ curso: 'Gastronomia' })
  })

  it('o curso escolhido na URL vale mais que o do aluno', async () => {
    vi.mocked(usuarioAtual).mockReturnValue(criarUsuario({ perfil: 'aluno', curso: 'Gastronomia' }))
    const { filtros } = await abrir('/avisos?curso=Enfermagem')
    expect(filtros.curso).toBe('Enfermagem')
  })

  it('editor não ganha filtro automático', async () => {
    vi.mocked(usuarioAtual).mockReturnValue(criarUsuario({ perfil: 'editor' }))
    const { filtros } = await abrir('/avisos')
    expect(filtros.curso).toBe('')
  })
})

describe('useFiltrosAvisos: lista filtrada', () => {
  it('filtra, conta os encerrados e reage à lista nova', async () => {
    const vaga = criarAviso({ categoria: 'emprego', dataFim: '2026-12-01' })
    const feriado = criarAviso({ categoria: 'calendario', dataInicio: '2026-11-20' })
    const passado = criarAviso({ categoria: 'emprego', dataFim: '2026-10-01' })
    const { filtrados, qtdEncerrados, lista } = await abrir('/avisos?categoria=emprego', [vaga, feriado, passado])
    expect(filtrados.value).toEqual([vaga])
    expect(qtdEncerrados.value).toBe(1)
    lista.value = [feriado]
    expect(filtrados.value).toEqual([])
    expect(qtdEncerrados.value).toBe(0)
  })
})
