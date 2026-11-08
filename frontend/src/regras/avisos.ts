// Regras de negócio dos avisos: quando é novo, quando encerra, como filtrar, ordenar e agrupar.
// Funções puras: recebem dados e devolvem resultado, sem chamar a API nem mexer na tela.
import { CATEGORIAS, CHAVES_CATEGORIAS, CURSO_GERAL, usaCampo } from '@/config'
import { DIA, paraData, hoje, diasAte, chaveMes, formatarData } from '@/utils/datas'
import { normalizar, capitalizar } from '@/utils/texto'
import type { Aviso, ChaveCategoria, FiltrosAvisos, GrupoMes, ItemFicha } from '@/types'

export const DIAS_NOVO = 7

// ---------- Situação do aviso ----------

// "Novo" = publicado nos últimos 7 dias
export function ehNovo(aviso: Aviso): boolean {
  return Date.now() - new Date(aviso.publicadoEm).getTime() < DIAS_NOVO * DIA
}

// Último dia em que o aviso vale (fim do período, ou o próprio dia)
export function dataLimite(aviso: Aviso): Date | null {
  return paraData(aviso.dataFim) ?? paraData(aviso.dataInicio)
}

export function encerrado(aviso: Aviso): boolean {
  const limite = dataLimite(aviso)
  return limite !== null && limite < hoje()
}

// Já começou e ainda não terminou
export function emAndamento(aviso: Aviso): boolean {
  const inicio = paraData(aviso.dataInicio)
  const fim = paraData(aviso.dataFim)
  return inicio !== null && fim !== null && inicio <= hoje() && fim >= hoje()
}

export function diasRestantes(aviso: Aviso): number | null {
  return diasAte(dataLimite(aviso))
}

// Data que posiciona o aviso no calendário (vagas usam o prazo final)
export function dataReferencia(aviso: Aviso): Date | null {
  return aviso.categoria === 'emprego'
    ? paraData(aviso.dataFim)
    : paraData(aviso.dataInicio) ?? paraData(aviso.dataFim)
}

// ---------- Textos ----------

// "20/11/2026", "23/11 a 04/12/2026" ou "Inscrições até 30/11/2026"
export function periodo(aviso: Aviso): string {
  const inicio = paraData(aviso.dataInicio)
  const fim = paraData(aviso.dataFim)
  if (aviso.categoria === 'emprego' && fim) return `Inscrições até ${formatarData(fim)}`
  if (inicio && fim && inicio.getTime() !== fim.getTime()) {
    const mesmoAno = inicio.getFullYear() === fim.getFullYear()
    return `${formatarData(inicio, mesmoAno ? 'curta' : 'completa')} a ${formatarData(fim)}`
  }
  if (inicio) return formatarData(inicio)
  if (fim) return `Até ${formatarData(fim)}`
  return ''
}

// Prazo curto para cards: "Hoje", "Amanhã", "Em 5 dias", "Acontecendo agora", "Encerrado"
export function rotuloPrazo(aviso: Aviso): string {
  if (encerrado(aviso)) return 'Encerrado'
  if (emAndamento(aviso)) return 'Acontecendo agora'
  const dias = diasAte(dataReferencia(aviso))
  if (dias === null) return ''
  if (dias === 0) return 'Hoje'
  if (dias === 1) return 'Amanhã'
  if (dias > 1 && dias <= 30) return `Em ${dias} dias`
  return ''
}

// Prazo em destaque na página do aviso
export function textoPrazoDetalhe(aviso: Aviso): string {
  if (encerrado(aviso)) return ''
  const dias = diasRestantes(aviso)
  if (aviso.categoria === 'emprego' && dias !== null) {
    if (dias === 0) return 'Último dia para se candidatar!'
    return `Faltam ${dias} ${dias === 1 ? 'dia' : 'dias'} para o fim das inscrições`
  }
  return rotuloPrazo(aviso)
}

// Texto do botão principal (ex.: "Candidatar-se à vaga")
export function textoAcao(aviso: Aviso): string {
  return CATEGORIAS[aviso.categoria]?.acao ?? 'Saiba mais'
}

// Linhas da ficha técnica do aviso, só com o que estiver preenchido
export function fichaDoAviso(aviso: Aviso): ItemFicha[] {
  const itens: ItemFicha[] = []
  const quando = periodo(aviso)
  if (quando) itens.push({ icone: 'calendario', rotulo: aviso.categoria === 'emprego' ? 'Prazo' : 'Quando', valor: quando })
  if (aviso.empresa) itens.push({ icone: 'predio', rotulo: 'Empresa', valor: aviso.empresa })
  if (aviso.localizacao) itens.push({ icone: 'local', rotulo: 'Local', valor: aviso.localizacao })
  if (aviso.cargaHoraria) itens.push({ icone: 'relogio', rotulo: 'Carga horária', valor: `${aviso.cargaHoraria} horas` })
  if (aviso.modalidade) itens.push({ icone: 'tela', rotulo: 'Modalidade', valor: aviso.modalidade })
  if (aviso.vagas) itens.push({ icone: 'pessoas', rotulo: 'Vagas', valor: aviso.vagas })
  if (usaCampo(aviso.categoria, 'certificado'))
    itens.push({ icone: 'certificado', rotulo: 'Certificado', valor: aviso.certificado ? 'Sim' : 'Não' })
  itens.push({ icone: 'livro', rotulo: 'Para', valor: aviso.curso || CURSO_GERAL })
  return itens
}

// ---------- Filtros e ordenação ----------

// O aviso é para este curso? Avisos gerais valem para todos.
export function serveParaCurso(aviso: Aviso, curso: string): boolean {
  return !curso || curso === CURSO_GERAL || aviso.curso === curso || aviso.curso === CURSO_GERAL
}

// Busca sem diferenciar acentos nem maiúsculas; todas as palavras precisam aparecer
export function correspondeBusca(aviso: Aviso, termo: string): boolean {
  const palavras = normalizar(termo).split(/\s+/).filter(Boolean)
  if (!palavras.length) return true
  // join() transforma null em "", então campos vazios não atrapalham
  const alvo = normalizar([aviso.titulo, aviso.resumo, aviso.descricao, aviso.curso, aviso.empresa, aviso.localizacao].join(' '))
  return palavras.every((palavra) => alvo.includes(palavra))
}

// Urgentes primeiro, depois os mais recentes
export function ordenarPorRelevancia(lista: readonly Aviso[]): Aviso[] {
  return [...lista].sort((a, b) =>
    (Number(b.urgente) - Number(a.urgente)) ||
    (new Date(b.publicadoEm).getTime() - new Date(a.publicadoEm).getTime()))
}

// Da data mais próxima para a mais distante (sem data vai para o fim)
export function ordenarPorData(lista: readonly Aviso[]): Aviso[] {
  const tempo = (aviso: Aviso) => dataReferencia(aviso)?.getTime() ?? Number.MAX_SAFE_INTEGER
  return [...lista].sort((a, b) => tempo(a) - tempo(b))
}

// Aplica todos os filtros da tela de avisos de uma vez
export function filtrarAvisos(lista: readonly Aviso[], filtros: Partial<FiltrosAvisos> = {}): Aviso[] {
  const { categoria = '', curso = '', busca = '', mostrarEncerrados = false } = filtros
  return ordenarPorRelevancia(lista.filter((aviso) =>
    (!categoria || aviso.categoria === categoria) &&
    serveParaCurso(aviso, curso) &&
    correspondeBusca(aviso, busca) &&
    (mostrarEncerrados || !encerrado(aviso))))
}

// Avisos ainda em vigor (a data final não passou). Não confundir com a coluna "ativo" do banco.
export function vigentes(lista: readonly Aviso[]): Aviso[] {
  return lista.filter((aviso) => !encerrado(aviso))
}

// { calendario: 6, extracurricular: 4, ... }
export function contarPorCategoria(lista: readonly Aviso[]): Record<ChaveCategoria, number> {
  const total = Object.fromEntries(CHAVES_CATEGORIAS.map((chave) => [chave, 0])) as Record<ChaveCategoria, number>
  // o "in" protege contra uma categoria desconhecida vinda da API
  for (const aviso of lista) if (aviso.categoria in total) total[aviso.categoria]++
  return total
}

// Próximas datas do calendário acadêmico (inclui as que estão em andamento)
export function proximasDatas(lista: readonly Aviso[], limite = 5): Aviso[] {
  return ordenarPorData(vigentes(lista).filter((a) => a.categoria === 'calendario' && dataReferencia(a))).slice(0, limite)
}

// Agrupa por mês: [{ chave: '2026-10', titulo: 'Novembro de 2026', itens: [...] }]
export function agruparPorMes(lista: readonly Aviso[]): GrupoMes[] {
  const grupos = new Map<string, GrupoMes>()
  for (const aviso of ordenarPorData(lista)) {
    const data = dataReferencia(aviso)
    if (!data) continue
    const chave = chaveMes(data)
    let grupo = grupos.get(chave)
    if (!grupo) {
      grupo = { chave, titulo: capitalizar(formatarData(data, 'mes')), itens: [] }
      grupos.set(chave, grupo)
    }
    grupo.itens.push(aviso)
  }
  return [...grupos.values()]
}
