// REGRA DO PROJETO: o fundo em degradê do miolo (.miolo, em styles/componentes.css) começa colado
// no cabeçalho e aparece também na página inicial. O happy-dom não calcula layout, então este teste
// confere no código as três peças que garantem isso. Cada uma já quebrou uma vez:
//   1. sem "display: flow-root", a margem de cima do título vazava para fora do <main> e abria um
//      vão sem degradê entre o cabeçalho e o conteúdo (em todas as telas com CabecalhoPagina);
//   2. o <main> do LayoutPadrao precisa da classe .miolo (é ele que pinta o fundo);
//   3. na inicial, o banner cobre o topo do <main> (a parte colorida do degradê): o miolo tem que
//      recomeçar logo depois do banner, senão a página inicial fica com o fundo antigo.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const ler = (caminho: string) => readFileSync(resolve(process.cwd(), 'src', caminho), 'utf8')

// bloco de CSS de um seletor exato: ".miolo {" ... "}"
function regraCss(css: string, seletor: string): string {
  const escapado = seletor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return css.match(new RegExp(`(?:^|\\n)${escapado}\\s*\\{([^}]*)\\}`))?.[1] ?? ''
}

// só o <template> de um .vue, sem os comentários
function template(arquivo: string): string {
  const codigo = ler(arquivo)
  return (codigo.match(/<template>([^]*)<\/template>\s*<style/)?.[1] ?? '').replace(/<!--[^]*?-->/g, '')
}

describe('regra: fundo do miolo', () => {
  const miolo = regraCss(ler('styles/componentes.css'), '.miolo')

  it('.miolo pinta o degradê e a textura', () => {
    expect(miolo).toMatch(/background:\s*var\(--fundo-miolo\)/)
    expect(regraCss(ler('styles/componentes.css'), '.miolo::before')).toMatch(/var\(--textura-miolo\)/)
  })

  it('.miolo segura a margem do primeiro filho (sem vão entre o cabeçalho e o degradê)', () => {
    expect(miolo).toMatch(/display:\s*flow-root/)
  })

  it('o <main> do LayoutPadrao usa .miolo', () => {
    expect(template('components/layout/LayoutPadrao.vue')).toMatch(/<main\b[^>]*class="[^"]*\bmiolo\b/)
  })

  it('na página inicial, o miolo recomeça logo depois do banner', () => {
    const inicio = template('views/InicioView.vue')
    const fimDoBanner = inicio.indexOf('</section>', inicio.indexOf('class="hero"'))
    expect(fimDoBanner).toBeGreaterThan(-1)
    // o próximo elemento depois do banner é o miolo
    expect(inicio.slice(fimDoBanner + '</section>'.length)).toMatch(/^\s*<div class="miolo\b/)
  })
})
