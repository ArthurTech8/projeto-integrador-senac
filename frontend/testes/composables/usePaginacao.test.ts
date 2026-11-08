import { describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'
import { ITENS_POR_PAGINA, usePaginacao } from '@/composables/usePaginacao'

const numeros = (n: number) => Array.from({ length: n }, (_, i) => i + 1)

describe('usePaginacao', () => {
  it('usa 10 itens por página (padrão do site)', () => {
    expect(ITENS_POR_PAGINA).toBe(10)
    expect(usePaginacao(ref(numeros(3))).porPagina).toBe(10)
  })

  it('mostra a primeira página e o resumo "1–10 de 25"', () => {
    const p = usePaginacao(ref(numeros(25)))
    expect(p.itensDaPagina.value).toEqual(numeros(10))
    expect(p.totalPaginas.value).toBe(3)
    expect([p.primeiro.value, p.ultimo.value, p.total.value]).toEqual([1, 10, 25])
  })

  it('irPara muda de página e não passa dos limites', () => {
    const p = usePaginacao(ref(numeros(25)))
    p.irPara(3)
    expect(p.itensDaPagina.value).toEqual([21, 22, 23, 24, 25])
    expect([p.primeiro.value, p.ultimo.value]).toEqual([21, 25])
    p.irPara(99)
    expect(p.pagina.value).toBe(3)
    p.irPara(-1)
    expect(p.pagina.value).toBe(1)
  })

  it('lista vazia: uma página, resumo 0–0', () => {
    const p = usePaginacao(ref<number[]>([]))
    expect(p.totalPaginas.value).toBe(1)
    expect([p.primeiro.value, p.ultimo.value, p.total.value]).toEqual([0, 0, 0])
  })

  it('se a lista encolher, volta para a última página que existe', async () => {
    const lista = ref(numeros(21))
    const p = usePaginacao(lista)
    p.irPara(3)
    lista.value = numeros(20) // excluiu o único item da página 3
    await nextTick()
    expect(p.pagina.value).toBe(2)
    expect(p.itensDaPagina.value).toEqual(numeros(20).slice(10))
  })

  it('aceita outro tamanho de página', () => {
    const p = usePaginacao(ref(numeros(7)), 3)
    expect(p.totalPaginas.value).toBe(3)
    expect(p.itensDaPagina.value).toEqual([1, 2, 3])
  })
})
