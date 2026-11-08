// Contrato entre as três partes: o que o front espera tem que existir na API e no banco.
// Ex.: criar uma categoria só no front (e esquecer o CHECK do banco) faz este teste falhar.
// Lê os arquivos do backend e do banco, então precisa do projeto inteiro (roda no compose.testes.yaml e no CI).
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CHAVES_CATEGORIAS, CHAVES_PERFIS, CURSO_GERAL, TAMANHO_MINIMO_SENHA } from '@/config'
import { ROTAS_API } from '@/services/rotas'
import type { Aviso, Usuario } from '@/types'
import { criarAviso, criarUsuario } from '../apoio/fabricas'

const PROJETO = resolve(process.cwd(), '..')
const ler = (caminho: string) => readFileSync(resolve(PROJETO, caminho), 'utf8')

const schema = ler('banco/schema.sql')
const endpointsAvisos = ler('backend/Endpoints/AvisosEndpoints.cs')

// "'a', 'b', 'c'" → ['a', 'b', 'c']
const listaSql = (texto: string) => [...texto.matchAll(/'([^']+)'/g)].map((m) => m[1])

describe('categorias', () => {
  it('as mesmas no front, no CHECK do banco, na API e nas cores do CSS', () => {
    const banco = listaSql(schema.match(/chk_categoria CHECK \(categoria IN \(([^)]*)\)\)/)?.[1] ?? '')
    const api = [...(endpointsAvisos.match(/CategoriasValidas\s*=\s*\[([^\]]*)\]/)?.[1] ?? '').matchAll(/"(\w+)"/g)].map((m) => m[1])
    const css = [...ler('frontend/src/styles/tokens.css').matchAll(/\[data-cat='(\w+)'\]/g)].map((m) => m[1])
    expect(banco).toEqual(CHAVES_CATEGORIAS)
    expect(api).toEqual(CHAVES_CATEGORIAS)
    expect(css).toEqual(CHAVES_CATEGORIAS)
  })
})

describe('perfis e senha', () => {
  it('os mesmos perfis no front, na API (Perfis.cs) e no CHECK do banco', () => {
    const banco = listaSql(schema.match(/chk_perfil CHECK \(perfil IN \(([^)]*)\)\)/)?.[1] ?? '')
    const api = [...ler('backend/Seguranca/Perfis.cs').matchAll(/const string \w+ = "(\w+)"/g)].map((m) => m[1])
    expect(banco).toEqual(CHAVES_PERFIS)
    expect(api.slice(0, 3)).toEqual(CHAVES_PERFIS)
  })

  it('mesmo tamanho mínimo de senha no front e na API', () => {
    const api = Number(ler('backend/Seguranca/Senhas.cs').match(/TamanhoMinimo\s*=\s*(\d+)/)?.[1])
    expect(api).toBe(TAMANHO_MINIMO_SENHA)
  })
})

describe('campos do JSON', () => {
  // Propriedades públicas de uma classe C#, já em camelCase (como o JSON da API)
  function propriedadesCs(arquivo: string, classe: string): string[] {
    const codigo = ler(arquivo)
    const inicio = codigo.indexOf(`public class ${classe}`)
    const corpo = codigo.slice(inicio, codigo.indexOf('\n}', inicio))
    return [...corpo.matchAll(/public [\w?<>]+ (\w+) \{ get; set; \}/g)].map((m) => {
      const nome = m[1] ?? ''
      return nome.charAt(0).toLowerCase() + nome.slice(1)
    }).sort()
  }

  it('types/aviso.ts espelha Models/Aviso.cs (e nenhum dos dois tem "ativo")', () => {
    const front = Object.keys(criarAviso() satisfies Aviso).sort()
    expect(front).toEqual(propriedadesCs('backend/Models/Aviso.cs', 'Aviso'))
    expect(front).not.toContain('ativo')
  })

  it('types/usuario.ts espelha Models/Usuario.cs (sem senha nem hash)', () => {
    const front = Object.keys(criarUsuario() satisfies Usuario).sort()
    expect(front).toEqual(propriedadesCs('backend/Models/Usuario.cs', 'Usuario'))
    expect(front.some((campo) => /senha|ativo/i.test(campo))).toBe(false)
  })

  it('"Todos os cursos" é o mesmo valor padrão no front, na API e no banco', () => {
    expect(ler('backend/Models/Aviso.cs')).toContain(`Curso { get; set; } = "${CURSO_GERAL}"`)
    expect(schema).toContain(`DEFAULT '${CURSO_GERAL}'`)
  })
})

describe('rotas', () => {
  // Todas as rotas da API, lidas dos arquivos Endpoints/*.cs: "GET /api/avisos/{id}"
  function rotasDaApi(): Set<string> {
    const rotas = new Set<string>()
    for (const nome of ['Avisos', 'Auth', 'Conta', 'Usuarios']) {
      const codigo = ler(`backend/Endpoints/${nome}Endpoints.cs`)
      const grupos = new Map([...codigo.matchAll(/var (\w+) = app\.MapGroup\("([^"]+)"\)/g)].map((m) => [m[1], m[2]]))
      for (const m of codigo.matchAll(/(\w+)\.Map(Get|Post|Put|Delete)\("([^"]*)"/g)) {
        const prefixo = m[1] === 'app' ? '' : grupos.get(m[1] ?? '') ?? ''
        const caminho = (prefixo + (m[3] === '/' ? '' : m[3])).replace(/\{(\w+)(:\w+)?\}/g, '{$1}')
        rotas.add(`${m[2]?.toUpperCase()} ${caminho}`)
      }
    }
    return rotas
  }

  const daApi = rotasDaApi()

  it.each([
    ['GET', ROTAS_API.avisos], ['POST', ROTAS_API.avisos],
    ['GET', ROTAS_API.aviso('{id}')], ['PUT', ROTAS_API.aviso('{id}')], ['DELETE', ROTAS_API.aviso('{id}')],
    ['POST', ROTAS_API.entrar], ['POST', ROTAS_API.sair], ['GET', ROTAS_API.eu], ['PUT', ROTAS_API.senha],
    ['GET', ROTAS_API.usuarios], ['POST', ROTAS_API.usuarios],
    ['PUT', ROTAS_API.usuario('{id}')], ['DELETE', ROTAS_API.usuario('{id}')]
  ])('o front chama %s %s, e a API tem essa rota', (verbo, url) => {
    const caminho = decodeURIComponent(url)
    expect(daApi, `${verbo} ${caminho} não existe na API`).toContain(`${verbo} ${caminho}`)
  })

  it('leu as rotas da API (o leitor não quebrou)', () => {
    expect(daApi.size).toBeGreaterThanOrEqual(14)
  })
})
