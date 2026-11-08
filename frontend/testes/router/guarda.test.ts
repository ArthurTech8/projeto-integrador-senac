// Guarda do router (router/index.ts) e lista de telas (router/rotas.ts).
// Abrir cada tela aqui também carrega o .vue dela: uma tela que não compila faz o teste falhar.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import router from '@/router'
import { rotas } from '@/router/rotas'
import { carregarSessao, usuarioAtual } from '@/composables/useSessao'
import { LAYOUTS } from '@/components/layout/layouts'
import type { Perfil } from '@/types'
import { criarUsuario } from '../apoio/fabricas'

vi.mock('@/composables/useSessao', () => ({
  carregarSessao: vi.fn(async () => {}),
  usuarioAtual: vi.fn(() => null)
}))

function logadoComo(perfil: Perfil | null): void {
  vi.mocked(usuarioAtual).mockReturnValue(perfil ? criarUsuario({ perfil, curso: perfil === 'aluno' ? 'Enfermagem' : null }) : null)
}

async function abrir(url: string) {
  await router.push(url)
  return router.currentRoute.value
}

beforeEach(async () => {
  logadoComo(null)
  // volta para uma tela neutra entre os testes
  await router.push('/')
})

describe('telas públicas', () => {
  it.each(['/', '/avisos', '/avisos/12', '/calendario'])('%s abre sem login', async (url) => {
    expect((await abrir(url)).fullPath).toBe(url)
  })

  it('confere a sessão antes de abrir a tela', async () => {
    await abrir('/calendario')
    expect(carregarSessao).toHaveBeenCalled()
  })

  it('id que não é número cai em "não encontrada"', async () => {
    expect((await abrir('/avisos/abc')).name).toBe('nao-encontrado')
    expect((await abrir('/qualquer/coisa')).name).toBe('nao-encontrado')
  })
})

describe('telas protegidas', () => {
  it('sem login vai para /entrar e guarda a tela pedida em "voltar"', async () => {
    const rota = await abrir('/gerenciar')
    expect(rota.name).toBe('entrar')
    expect(rota.query.voltar).toBe('/gerenciar')
  })

  it.each<[string, Perfil, string]>([
    ['/gerenciar', 'aluno', 'sem-acesso'],
    ['/gerenciar', 'editor', 'gerenciar'],
    ['/gerenciar', 'admin', 'gerenciar'],
    ['/usuarios', 'aluno', 'sem-acesso'],
    ['/usuarios', 'editor', 'sem-acesso'],
    ['/usuarios', 'admin', 'usuarios'],
    ['/conta', 'aluno', 'conta'],
    ['/conta', 'editor', 'conta']
  ])('%s com perfil %s → %s', async (url, perfil, esperado) => {
    logadoComo(perfil)
    expect((await abrir(url)).name).toBe(esperado)
  })

  it('sem permissão, a tela de acesso negado sabe qual página foi pedida', async () => {
    logadoComo('aluno')
    expect((await abrir('/usuarios')).query.pagina).toBe('/usuarios')
  })

  it('quem já está logado não vê a tela de login', async () => {
    logadoComo('editor')
    expect((await abrir('/entrar')).path).toBe('/gerenciar')
    logadoComo('aluno')
    expect((await abrir('/entrar')).path).toBe('/avisos')
  })
})

describe('título da aba e lista de telas', () => {
  it('o título da aba muda com a tela', async () => {
    await abrir('/calendario')
    expect(document.title).toBe('Calendário · Mural do Aluno')
  })

  it('toda tela tem nome e título; os nomes não se repetem', () => {
    const nomes = rotas.map((r) => r.name)
    expect(new Set(nomes).size).toBe(rotas.length)
    for (const rota of rotas) expect(rota.meta?.titulo, String(rota.name)).toBeTruthy()
  })

  it('só o login usa o layout "vazio"; todo layout usado existe', () => {
    expect(rotas.filter((r) => r.meta?.layout === 'vazio').map((r) => r.name)).toEqual(['entrar'])
    for (const rota of rotas) if (rota.meta?.layout) expect(LAYOUTS[rota.meta.layout]).toBeDefined()
  })

  it('telas protegidas: Gerenciar (equipe), Usuários (admin) e Minha conta (logado)', () => {
    const protegidas = Object.fromEntries(rotas.filter((r) => r.meta?.requer).map((r) => [r.name, r.meta?.requer]))
    expect(protegidas).toEqual({ gerenciar: 'equipe', usuarios: 'admin', conta: 'logado' })
  })

  it('a ordem do menu não se repete', () => {
    const ordens = rotas.flatMap((r) => (r.meta?.menu ? [r.meta.menu.ordem] : []))
    expect(new Set(ordens).size).toBe(ordens.length)
  })
})
