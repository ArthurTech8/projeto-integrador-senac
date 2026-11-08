import { ref, computed, watch, type Ref } from 'vue'
import { limitarPagina, paginar, totalDePaginas } from '@/utils/paginacao'

/** Itens por página padrão do site */
export const ITENS_POR_PAGINA = 10

// Paginação de uma lista que já está no front.
//   const { itensDaPagina, pagina, totalPaginas, primeiro, ultimo, total, irPara } = usePaginacao(lista)
export function usePaginacao<T>(lista: Ref<readonly T[]>, porPagina = ITENS_POR_PAGINA) {
  const pagina = ref(1)

  const total = computed(() => lista.value.length)
  const totalPaginas = computed(() => totalDePaginas(total.value, porPagina))
  const itensDaPagina = computed(() => paginar(lista.value, pagina.value, porPagina))

  // "Mostrando 11–18 de 18"
  const primeiro = computed(() => (total.value === 0 ? 0 : (pagina.value - 1) * porPagina + 1))
  const ultimo = computed(() => Math.min(pagina.value * porPagina, total.value))

  // a lista encolheu (ex.: excluiu o último aviso da última página): volta para a última página que existe
  watch(totalPaginas, (novoTotal) => { pagina.value = limitarPagina(pagina.value, novoTotal) })

  function irPara(numero: number): void {
    pagina.value = limitarPagina(numero, totalPaginas.value)
  }

  return { pagina, itensDaPagina, totalPaginas, total, primeiro, ultimo, irPara, porPagina }
}
