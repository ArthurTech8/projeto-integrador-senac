import { describe, expect, it } from 'vitest'
import { capitalizar, normalizar, plural } from '@/utils/texto'

describe('normalizar', () => {
  it('tira acentos e deixa minúsculo', () => {
    expect(normalizar('Estágio em Administração')).toBe('estagio em administracao')
    expect(normalizar('ÇÃO Ü')).toBe('cao u')
  })

  it('trata null e undefined como texto vazio', () => {
    expect(normalizar(null)).toBe('')
    expect(normalizar(undefined)).toBe('')
  })
})

describe('capitalizar', () => {
  it('deixa só a primeira letra maiúscula', () => {
    expect(capitalizar('sábado, 7 de novembro')).toBe('Sábado, 7 de novembro')
    expect(capitalizar('élan')).toBe('Élan')
  })

  it('não quebra com texto vazio', () => {
    expect(capitalizar('')).toBe('')
  })
})

describe('plural', () => {
  it('usa o singular só para 1', () => {
    expect(plural(1, 'aviso', 'avisos')).toBe('1 aviso')
    expect(plural(0, 'aviso', 'avisos')).toBe('0 avisos')
    expect(plural(3, 'aviso', 'avisos')).toBe('3 avisos')
  })
})
