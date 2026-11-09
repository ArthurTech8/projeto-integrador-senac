// REGRA DO PROJETO: o texto das telas fica direto sobre o degradê do miolo (--fundo-miolo, em tokens.css).
// Se alguém escurecer o degradê, a textura ou clarear o --texto-suave, o texto cinza pode cair abaixo
// de 4,5:1 (WCAG AA) sem ninguém perceber na tela. Este teste lê as cores do tokens.css e mede o pior caso:
// cada mancha colorida sozinha sobre a cor mais escura da base, com um pontinho da textura por cima.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

type Rgb = [number, number, number]

const tokens = readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'), 'utf8')

// valor de uma variável do :root (pode ocupar várias linhas, termina no ";")
function variavel(nome: string): string {
  const valor = tokens.match(new RegExp(`--${nome}:\\s*([^;]+);`))?.[1]
  if (!valor) throw new Error(`--${nome} não encontrada em tokens.css`)
  return valor
}

function hex(texto: string): Rgb {
  const h = texto.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb
}

// "rgb(29 95 209 / 0.10)" → cor e opacidade
function rgbComAlfa(texto: string): { cor: Rgb; alfa: number } {
  const [r, g, b, a] = (texto.match(/[\d.]+/g) ?? []).map(Number)
  return { cor: [r ?? 0, g ?? 0, b ?? 0], alfa: a ?? 1 }
}

// cor translúcida pintada por cima de outra (como o navegador faz)
function misturar(cor: Rgb, alfa: number, fundo: Rgb): Rgb {
  return cor.map((c, i) => alfa * c + (1 - alfa) * (fundo[i] ?? 0)) as Rgb
}

function luminancia(cor: Rgb): number {
  const [r, g, b] = cor.map((c) => {
    const v = c / 255
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }) as Rgb
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contraste(a: Rgb, b: Rgb): number {
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x) as [number, number]
  return (claro + 0.05) / (escuro + 0.05)
}

describe('regra: contraste do texto sobre o miolo', () => {
  const miolo = variavel('fundo-miolo')
  const manchas = [...miolo.matchAll(/radial-gradient\([^,]+,\s*(rgb\([^)]+\))/g)].map((m) => rgbComAlfa(m[1] ?? ''))
  // cores fixas da base (linear-gradient) e o --fundo do meio: a mais escura é o pior caso
  const bases = [
    ...[...(miolo.match(/linear-gradient\(([^]*)\)/)?.[1] ?? '').matchAll(/#[0-9a-f]{6}/gi)].map((m) => hex(m[0])),
    hex(variavel('fundo'))
  ]
  const baseMaisEscura = bases.reduce((pior, cor) => (luminancia(cor) < luminancia(pior) ? cor : pior))
  const ponto = rgbComAlfa(variavel('textura-miolo').match(/rgb\([^)]+\)/)?.[0] ?? '')

  it('encontrou as manchas, a base e a textura (o leitor não quebrou)', () => {
    expect(manchas.length).toBeGreaterThanOrEqual(3)
    expect(bases.length).toBeGreaterThanOrEqual(3)
    expect(ponto.alfa).toBeGreaterThan(0)
  })

  for (const nome of ['texto-suave', 'texto', 'texto-forte', 'primaria']) {
    it(`--${nome} fica acima de 4,5:1 no ponto mais escuro do miolo`, () => {
      const texto = hex(variavel(nome))
      const piores = manchas.map(({ cor, alfa }) => misturar(ponto.cor, ponto.alfa, misturar(cor, alfa, baseMaisEscura)))
      const menor = Math.min(...piores.map((fundo) => contraste(texto, fundo)))
      expect(menor).toBeGreaterThanOrEqual(4.5)
    })
  }
})
