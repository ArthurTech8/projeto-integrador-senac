// Contas de paginação (funções puras, servem para qualquer lista).

/** Quantas páginas cabem (no mínimo 1, mesmo com a lista vazia) */
export function totalDePaginas(totalItens: number, porPagina: number): number {
  return Math.max(1, Math.ceil(totalItens / porPagina))
}

/** Mantém a página entre 1 e o total (ex.: depois de excluir o último item da última página) */
export function limitarPagina(pagina: number, total: number): number {
  return Math.min(Math.max(1, Math.trunc(pagina) || 1), total)
}

/** Os itens de uma página: paginar(lista, 2, 10) → itens 11 a 20 */
export function paginar<T>(lista: readonly T[], pagina: number, porPagina: number): T[] {
  const inicio = (pagina - 1) * porPagina
  return lista.slice(inicio, inicio + porPagina)
}

/** Números das páginas para mostrar, com "…" no lugar dos saltos: [1, '…', 4, 5, 6, '…', 12] */
export function paginasVisiveis(atual: number, total: number): (number | '…')[] {
  // poucas páginas: mostra todas
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const paginas: (number | '…')[] = [1]
  const inicio = Math.max(2, atual - 1)
  const fim = Math.min(total - 1, atual + 1)
  if (inicio > 2) paginas.push('…')
  for (let p = inicio; p <= fim; p++) paginas.push(p)
  if (fim < total - 1) paginas.push('…')
  paginas.push(total)
  return paginas
}
