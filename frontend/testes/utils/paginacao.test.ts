import { describe, expect, it } from 'vitest'
import { limitarPagina, paginar, paginasVisiveis, totalDePaginas } from '@/utils/paginacao'

describe('totalDePaginas', () => {
  it('arredonda para cima e tem no mínimo 1 página', () => {
    expect(totalDePaginas(0, 10)).toBe(1)
    expect(totalDePaginas(10, 10)).toBe(1)
    expect(totalDePaginas(11, 10)).toBe(2)
    expect(totalDePaginas(95, 10)).toBe(10)
  })
})

describe('limitarPagina', () => {
  it('mantém a página entre 1 e o total', () => {
    expect(limitarPagina(0, 5)).toBe(1)
    expect(limitarPagina(-3, 5)).toBe(1)
    expect(limitarPagina(9, 5)).toBe(5)
    expect(limitarPagina(3, 5)).toBe(3)
  })

  it('corta casas decimais e trata NaN como página 1', () => {
    expect(limitarPagina(2.9, 5)).toBe(2)
    expect(limitarPagina(Number.NaN, 5)).toBe(1)
  })
})

describe('paginar', () => {
  const lista = Array.from({ length: 25 }, (_, i) => i + 1)

  it('devolve os itens da página pedida', () => {
    expect(paginar(lista, 1, 10)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(paginar(lista, 3, 10)).toEqual([21, 22, 23, 24, 25])
  })

  it('página além do fim devolve lista vazia, sem alterar a original', () => {
    expect(paginar(lista, 4, 10)).toEqual([])
    expect(lista).toHaveLength(25)
  })
})

describe('paginasVisiveis', () => {
  it('mostra todas quando são até 7', () => {
    expect(paginasVisiveis(1, 1)).toEqual([1])
    expect(paginasVisiveis(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('usa "…" nos saltos', () => {
    expect(paginasVisiveis(1, 12)).toEqual([1, 2, '…', 12])
    expect(paginasVisiveis(5, 12)).toEqual([1, '…', 4, 5, 6, '…', 12])
    expect(paginasVisiveis(12, 12)).toEqual([1, '…', 11, 12])
  })

  it('não põe "…" quando a vizinha já é a primeira ou a última', () => {
    expect(paginasVisiveis(3, 12)).toEqual([1, 2, 3, 4, '…', 12])
    expect(paginasVisiveis(10, 12)).toEqual([1, '…', 9, 10, 11, 12])
  })
})
