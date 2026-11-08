import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  CATEGORIAS, CHAVES_CATEGORIAS, CHAVES_PERFIS, CURSOS, CURSOS_ESPECIFICOS, CURSO_GERAL, FUNDOS_INICIO,
  INSTITUICAO, INTERVALO_FUNDO, MENSAGEM_ERRO_API, MODALIDADES, PERFIS, ehCategoria, infoCategoria, usaCampo
} from '@/config'

const PUBLICO = resolve(process.cwd(), 'public')

describe('categorias', () => {
  it('são exatamente as quatro do mural, nesta ordem', () => {
    expect(CHAVES_CATEGORIAS).toEqual(['calendario', 'extracurricular', 'emprego', 'curso'])
  })

  it('toda categoria tem textos preenchidos', () => {
    for (const chave of CHAVES_CATEGORIAS) {
      const info = CATEGORIAS[chave]
      for (const texto of [info.rotulo, info.curto, info.descricao, info.acao, info.rotuloDataFim]) expect(texto.trim()).not.toBe('')
    }
  })

  it('ehCategoria aceita só chaves válidas (protege a URL ?categoria=)', () => {
    expect(ehCategoria('emprego')).toBe(true)
    expect(ehCategoria('xyz')).toBe(false)
    expect(ehCategoria('')).toBe(false)
    expect(ehCategoria(['emprego'])).toBe(false)
    expect(ehCategoria(null)).toBe(false)
    // "toString" existe em todo objeto: não pode passar como categoria
    expect(ehCategoria('toString')).toBe(false)
  })

  it('infoCategoria devolve a configuração, ou undefined', () => {
    expect(infoCategoria('curso')?.rotulo).toBe('Cursos rápidos')
    expect(infoCategoria('')).toBeUndefined()
    expect(infoCategoria('nada')).toBeUndefined()
  })

  it('usaCampo segue a lista "campos" de cada categoria', () => {
    expect(usaCampo('curso', 'cargaHoraria')).toBe(true)
    expect(usaCampo('emprego', 'empresa')).toBe(true)
    expect(usaCampo('calendario', 'empresa')).toBe(false)
    expect(usaCampo('emprego', 'certificado')).toBe(false)
  })
})

describe('cursos, perfis e mensagens', () => {
  it('"Todos os cursos" é a primeira opção e fica fora dos cursos específicos', () => {
    expect(CURSOS[0]).toBe(CURSO_GERAL)
    expect(CURSOS_ESPECIFICOS).not.toContain(CURSO_GERAL)
    expect(CURSOS_ESPECIFICOS).toHaveLength(CURSOS.length - 1)
    expect(new Set(CURSOS).size).toBe(CURSOS.length)
  })

  it('modalidades são as três aceitas', () => {
    expect([...MODALIDADES]).toEqual(['Presencial', 'Online', 'Híbrido'])
  })

  it('três perfis, cada um com rótulo e descrição', () => {
    expect(CHAVES_PERFIS).toEqual(['admin', 'editor', 'aluno'])
    for (const perfil of CHAVES_PERFIS) {
      expect(PERFIS[perfil].rotulo).not.toBe('')
      expect(PERFIS[perfil].descricao).not.toBe('')
    }
  })

  it('mensagem padrão de falha é a do guia do projeto', () => {
    expect(MENSAGEM_ERRO_API).toBe('Erro ao carregar. A API está rodando?')
  })
})

describe('marca e fotos do banner', () => {
  it('os logos oficiais existem em public/marca', () => {
    for (const caminho of [INSTITUICAO.logo.fundoEscuro, INSTITUICAO.logo.fundoClaro]) {
      expect(existsSync(resolve(PUBLICO, caminho.slice(1))), caminho).toBe(true)
    }
  })

  it('cada foto do banner existe nas duas larguras, em WebP, com crédito', () => {
    expect(FUNDOS_INICIO.length).toBeGreaterThan(0)
    for (const foto of FUNDOS_INICIO) {
      expect(foto.grande).toMatch(/-1920\.webp$/)
      expect(foto.pequena).toMatch(/-960\.webp$/)
      expect(existsSync(resolve(PUBLICO, foto.grande.slice(1))), foto.grande).toBe(true)
      expect(existsSync(resolve(PUBLICO, foto.pequena.slice(1))), foto.pequena).toBe(true)
      expect(foto.autor).not.toBe('')
      expect(foto.origem).toMatch(/^https:\/\//)
    }
  })

  it('a foto troca a cada 8 segundos (regra do banner no CLAUDE.md)', () => {
    expect(INTERVALO_FUNDO).toBe(8000)
  })
})
