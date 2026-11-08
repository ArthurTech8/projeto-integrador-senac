// REGRA DO PROJETO: toda função exportada de utils/, regras/, services/, composables/ e config/
// precisa ser importada e usada em pelo menos um teste (exigência 6 do REGRAS_PROJETO_INTEGRADOR.md).
// Criou uma função nova e esqueceu o teste? Este teste falha e diz qual é, e o CI do GitHub fica vermelho.
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const RAIZ = process.cwd()
const PASTAS_COM_FUNCOES = ['utils', 'regras', 'services', 'composables', 'config']

function arquivos(pasta: string, extensao: string): string[] {
  return readdirSync(pasta, { withFileTypes: true }).flatMap((item) => {
    const caminho = join(pasta, item.name)
    if (item.isDirectory()) return arquivos(caminho, extensao)
    return item.name.endsWith(extensao) ? [caminho] : []
  })
}

interface Exportada {
  nome: string
  /** módulo como é importado: "@/regras/avisos" */
  modulo: string
}

function funcoesExportadas(): Exportada[] {
  return PASTAS_COM_FUNCOES.flatMap((pasta) =>
    arquivos(resolve(RAIZ, 'src', pasta), '.ts').flatMap((arquivo) => {
      const modulo = '@/' + relative(resolve(RAIZ, 'src'), arquivo).replace(/\\/g, '/').replace(/\.ts$/, '')
      const codigo = readFileSync(arquivo, 'utf8')
      return [...codigo.matchAll(/^export\s+(?:async\s+)?(?:function|class)\s+(\w+)/gm)].map((m) => ({ nome: m[1] ?? '', modulo }))
    }))
}

// Todos os imports dos testes: { módulo: nomes importados }
function importsDosTestes(): Map<string, Set<string>> {
  const mapa = new Map<string, Set<string>>()
  for (const arquivo of arquivos(resolve(RAIZ, 'testes'), '.test.ts')) {
    const codigo = readFileSync(arquivo, 'utf8')
    for (const m of codigo.matchAll(/import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*'([^']+)'/g)) {
      const nomes = (m[1] ?? '').split(',').map((n) => n.trim().split(/\s+as\s+/)[0]?.trim() ?? '').filter(Boolean)
      const conjunto = mapa.get(m[2] ?? '') ?? new Set<string>()
      nomes.forEach((n) => conjunto.add(n))
      mapa.set(m[2] ?? '', conjunto)
    }
  }
  return mapa
}

describe('regra: toda função tem teste', () => {
  const exportadas = funcoesExportadas()
  const imports = importsDosTestes()

  it('encontrou as funções do projeto (o leitor não quebrou)', () => {
    expect(exportadas.length).toBeGreaterThan(50)
  })

  it('cada função exportada é importada por algum teste', () => {
    const semTeste = exportadas.filter(({ nome, modulo }) => {
      // config/ também é importado pelo ponto único "@/config"
      const modulos = modulo.startsWith('@/config/') ? [modulo, '@/config'] : [modulo]
      return !modulos.some((m) => imports.get(m)?.has(nome))
    })
    expect(semTeste.map((f) => `${f.nome} (${f.modulo})`), 'Funções sem teste. Crie um teste em frontend/testes/').toEqual([])
  })
})
