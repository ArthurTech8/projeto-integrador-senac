import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DIAS_NOVO, agruparPorMes, contarPorCategoria, correspondeBusca, dataLimite, dataReferencia, diasRestantes,
  emAndamento, ehNovo, encerrado, fichaDoAviso, filtrarAvisos, ordenarPorData, ordenarPorRelevancia, periodo,
  proximasDatas, rotuloPrazo, serveParaCurso, textoAcao, textoPrazoDetalhe, vigentes
} from '@/regras/avisos'
import type { Aviso, ChaveCategoria } from '@/types'
import { AGORA, criarAviso } from '../apoio/fabricas'

// Hoje nos testes: terça, 10/11/2026
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(AGORA) })
afterEach(() => { vi.useRealTimers() })

describe('ehNovo', () => {
  it(`é novo quando foi publicado há menos de ${DIAS_NOVO} dias`, () => {
    expect(ehNovo(criarAviso({ publicadoEm: '2026-11-09T08:00:00' }))).toBe(true)
    expect(ehNovo(criarAviso({ publicadoEm: '2026-11-03T12:00:01' }))).toBe(true)
  })

  it('deixa de ser novo a partir de 7 dias', () => {
    expect(ehNovo(criarAviso({ publicadoEm: '2026-11-03T12:00:00' }))).toBe(false)
    expect(ehNovo(criarAviso({ publicadoEm: '2026-10-01T12:00:00' }))).toBe(false)
  })
})

describe('dataLimite, encerrado, emAndamento, diasRestantes', () => {
  it('dataLimite usa o fim do período e, sem fim, a data inicial', () => {
    expect(dataLimite(criarAviso({ dataInicio: '2026-11-01', dataFim: '2026-11-20' }))).toEqual(new Date(2026, 10, 20))
    expect(dataLimite(criarAviso({ dataInicio: '2026-11-01' }))).toEqual(new Date(2026, 10, 1))
    expect(dataLimite(criarAviso())).toBeNull()
  })

  it('encerrado só depois que o último dia passou (hoje ainda vale)', () => {
    expect(encerrado(criarAviso({ dataFim: '2026-11-09' }))).toBe(true)
    expect(encerrado(criarAviso({ dataFim: '2026-11-10' }))).toBe(false)
    expect(encerrado(criarAviso({ dataInicio: '2026-11-11' }))).toBe(false)
    expect(encerrado(criarAviso())).toBe(false)
  })

  it('emAndamento exige início e fim, com hoje dentro do período', () => {
    expect(emAndamento(criarAviso({ dataInicio: '2026-11-01', dataFim: '2026-11-30' }))).toBe(true)
    expect(emAndamento(criarAviso({ dataInicio: '2026-11-10', dataFim: '2026-11-10' }))).toBe(true)
    expect(emAndamento(criarAviso({ dataInicio: '2026-11-11', dataFim: '2026-11-30' }))).toBe(false)
    expect(emAndamento(criarAviso({ dataInicio: '2026-11-01' }))).toBe(false)
  })

  it('diasRestantes conta até a data limite', () => {
    expect(diasRestantes(criarAviso({ dataFim: '2026-11-15' }))).toBe(5)
    expect(diasRestantes(criarAviso())).toBeNull()
  })
})

describe('dataReferencia', () => {
  it('vagas de emprego usam o prazo final', () => {
    expect(dataReferencia(criarAviso({ categoria: 'emprego', dataInicio: '2026-11-01', dataFim: '2026-11-30' })))
      .toEqual(new Date(2026, 10, 30))
    expect(dataReferencia(criarAviso({ categoria: 'emprego', dataInicio: '2026-11-01' }))).toBeNull()
  })

  it('as outras categorias usam o início e, sem início, o fim', () => {
    expect(dataReferencia(criarAviso({ dataInicio: '2026-11-01', dataFim: '2026-11-30' }))).toEqual(new Date(2026, 10, 1))
    expect(dataReferencia(criarAviso({ dataFim: '2026-11-30' }))).toEqual(new Date(2026, 10, 30))
  })
})

describe('periodo', () => {
  it.each<[string, Partial<Aviso>, string]>([
    ['vaga com prazo', { categoria: 'emprego', dataFim: '2026-11-30' }, 'Inscrições até 30/11/2026'],
    ['período no mesmo ano', { dataInicio: '2026-11-23', dataFim: '2026-12-04' }, '23/11 a 04/12/2026'],
    ['período que vira o ano', { dataInicio: '2026-12-19', dataFim: '2027-01-31' }, '19/12/2026 a 31/01/2027'],
    ['início e fim no mesmo dia', { dataInicio: '2026-12-05', dataFim: '2026-12-05' }, '05/12/2026'],
    ['só início', { dataInicio: '2026-11-20' }, '20/11/2026'],
    ['só fim', { dataFim: '2026-11-20' }, 'Até 20/11/2026'],
    ['sem datas', {}, '']
  ])('%s', (_, mudancas, esperado) => {
    expect(periodo(criarAviso(mudancas))).toBe(esperado)
  })
})

describe('rotuloPrazo', () => {
  it.each<[Partial<Aviso>, string]>([
    [{ dataFim: '2026-11-01' }, 'Encerrado'],
    [{ dataInicio: '2026-11-01', dataFim: '2026-11-20' }, 'Acontecendo agora'],
    [{ dataInicio: '2026-11-10' }, 'Hoje'],
    [{ dataInicio: '2026-11-11' }, 'Amanhã'],
    [{ dataInicio: '2026-11-15' }, 'Em 5 dias'],
    [{ dataInicio: '2026-12-10' }, 'Em 30 dias'],
    [{ dataInicio: '2026-12-11' }, ''],
    [{}, '']
  ])('%o → "%s"', (mudancas, esperado) => {
    expect(rotuloPrazo(criarAviso(mudancas))).toBe(esperado)
  })
})

describe('textoPrazoDetalhe', () => {
  it('vaga encerrada não mostra prazo', () => {
    expect(textoPrazoDetalhe(criarAviso({ categoria: 'emprego', dataFim: '2026-11-01' }))).toBe('')
  })

  it('vaga: último dia, 1 dia (singular) e vários dias', () => {
    expect(textoPrazoDetalhe(criarAviso({ categoria: 'emprego', dataFim: '2026-11-10' }))).toBe('Último dia para se candidatar!')
    expect(textoPrazoDetalhe(criarAviso({ categoria: 'emprego', dataFim: '2026-11-11' })))
      .toBe('Faltam 1 dia para o fim das inscrições')
    expect(textoPrazoDetalhe(criarAviso({ categoria: 'emprego', dataFim: '2026-11-20' })))
      .toBe('Faltam 10 dias para o fim das inscrições')
  })

  it('outras categorias usam o rótulo curto', () => {
    expect(textoPrazoDetalhe(criarAviso({ dataInicio: '2026-11-11' }))).toBe('Amanhã')
    expect(textoPrazoDetalhe(criarAviso({ categoria: 'emprego' }))).toBe('')
  })
})

describe('textoAcao', () => {
  it.each<[ChaveCategoria, string]>([
    ['calendario', 'Saiba mais'],
    ['extracurricular', 'Inscrever-se'],
    ['emprego', 'Candidatar-se à vaga'],
    ['curso', 'Fazer inscrição']
  ])('%s → %s', (categoria, esperado) => {
    expect(textoAcao(criarAviso({ categoria }))).toBe(esperado)
  })

  it('categoria desconhecida vinda da API cai em "Saiba mais"', () => {
    const estranho = { ...criarAviso(), categoria: 'outra' } as unknown as Aviso
    expect(textoAcao(estranho)).toBe('Saiba mais')
  })
})

describe('fichaDoAviso', () => {
  it('vaga: prazo, empresa, local, modalidade, vagas e público, sem certificado', () => {
    const ficha = fichaDoAviso(criarAviso({
      categoria: 'emprego', dataFim: '2026-11-30', empresa: 'Nuvem Clara', localizacao: 'Centro',
      modalidade: 'Híbrido', vagas: 2, curso: 'Tecnologia da Informação'
    }))
    expect(ficha.map((i) => [i.rotulo, i.valor])).toEqual([
      ['Prazo', 'Inscrições até 30/11/2026'],
      ['Empresa', 'Nuvem Clara'],
      ['Local', 'Centro'],
      ['Modalidade', 'Híbrido'],
      ['Vagas', 2],
      ['Para', 'Tecnologia da Informação']
    ])
  })

  it('curso: carga horária em horas e certificado Sim/Não', () => {
    const comCertificado = fichaDoAviso(criarAviso({ categoria: 'curso', cargaHoraria: 8, certificado: true }))
    expect(comCertificado).toContainEqual({ icone: 'relogio', rotulo: 'Carga horária', valor: '8 horas' })
    expect(comCertificado).toContainEqual({ icone: 'certificado', rotulo: 'Certificado', valor: 'Sim' })
    const semCertificado = fichaDoAviso(criarAviso({ categoria: 'curso' }))
    expect(semCertificado).toContainEqual({ icone: 'certificado', rotulo: 'Certificado', valor: 'Não' })
  })

  it('só mostra o que está preenchido; curso vazio vira "Todos os cursos"', () => {
    const ficha = fichaDoAviso(criarAviso({ categoria: 'calendario', dataInicio: '2026-11-20', curso: '' }))
    expect(ficha).toEqual([
      { icone: 'calendario', rotulo: 'Quando', valor: '20/11/2026' },
      { icone: 'livro', rotulo: 'Para', valor: 'Todos os cursos' }
    ])
  })
})

describe('serveParaCurso', () => {
  const ti = criarAviso({ curso: 'Tecnologia da Informação' })
  const geral = criarAviso({ curso: 'Todos os cursos' })

  it('sem curso escolhido (ou "Todos os cursos") serve tudo', () => {
    expect(serveParaCurso(ti, '')).toBe(true)
    expect(serveParaCurso(ti, 'Todos os cursos')).toBe(true)
  })

  it('aviso do curso e aviso geral servem; de outro curso, não', () => {
    expect(serveParaCurso(ti, 'Tecnologia da Informação')).toBe(true)
    expect(serveParaCurso(geral, 'Enfermagem')).toBe(true)
    expect(serveParaCurso(ti, 'Enfermagem')).toBe(false)
  })
})

describe('correspondeBusca', () => {
  const aviso = criarAviso({
    titulo: 'Estágio em Desenvolvimento Web', resumo: 'Bolsa', descricao: 'HTML e CSS',
    empresa: 'Nuvem Clara', localizacao: null
  })

  it('ignora acentos e maiúsculas', () => {
    expect(correspondeBusca(aviso, 'ESTAGIO')).toBe(true)
    expect(correspondeBusca(aviso, 'estágio')).toBe(true)
  })

  it('todas as palavras precisam aparecer, em qualquer campo', () => {
    expect(correspondeBusca(aviso, 'estagio nuvem')).toBe(true)
    expect(correspondeBusca(aviso, 'estagio enfermagem')).toBe(false)
  })

  it('busca vazia ou só espaços aceita tudo; campo null não vira "null"', () => {
    expect(correspondeBusca(aviso, '   ')).toBe(true)
    expect(correspondeBusca(aviso, 'null')).toBe(false)
  })
})

describe('ordenarPorRelevancia e ordenarPorData', () => {
  it('urgentes primeiro, depois os mais recentes, sem alterar a lista original', () => {
    const antigo = criarAviso({ publicadoEm: '2026-11-01T10:00:00' })
    const recente = criarAviso({ publicadoEm: '2026-11-09T10:00:00' })
    const urgente = criarAviso({ urgente: true, publicadoEm: '2026-10-01T10:00:00' })
    const lista = [antigo, recente, urgente]
    expect(ordenarPorRelevancia(lista)).toEqual([urgente, recente, antigo])
    expect(lista).toEqual([antigo, recente, urgente])
  })

  it('da data mais próxima para a mais distante; sem data vai para o fim', () => {
    const semData = criarAviso()
    const dezembro = criarAviso({ dataInicio: '2026-12-01' })
    const novembro = criarAviso({ dataInicio: '2026-11-15' })
    expect(ordenarPorData([semData, dezembro, novembro])).toEqual([novembro, dezembro, semData])
  })
})

describe('filtrarAvisos', () => {
  const vaga = criarAviso({ categoria: 'emprego', curso: 'Enfermagem', titulo: 'Técnico de enfermagem', dataFim: '2026-12-15' })
  const feriado = criarAviso({ categoria: 'calendario', titulo: 'Feriado', dataInicio: '2026-11-20' })
  const velho = criarAviso({ categoria: 'calendario', titulo: 'Prova antiga', dataFim: '2026-10-01' })
  const lista = [vaga, feriado, velho]

  it('sem filtros esconde só os encerrados', () => {
    expect(filtrarAvisos(lista)).toHaveLength(2)
    expect(filtrarAvisos(lista)).not.toContain(velho)
  })

  it('mostrarEncerrados traz os encerrados de volta', () => {
    expect(filtrarAvisos(lista, { mostrarEncerrados: true })).toHaveLength(3)
  })

  it('filtra por categoria, curso e busca ao mesmo tempo', () => {
    expect(filtrarAvisos(lista, { categoria: 'emprego' })).toEqual([vaga])
    expect(filtrarAvisos(lista, { curso: 'Administração' })).toEqual([feriado])
    expect(filtrarAvisos(lista, { busca: 'tecnico', categoria: 'emprego', curso: 'Enfermagem' })).toEqual([vaga])
    expect(filtrarAvisos(lista, { busca: 'tecnico', categoria: 'calendario' })).toEqual([])
  })
})

describe('vigentes, contarPorCategoria, proximasDatas', () => {
  it('vigentes tira só os que já terminaram', () => {
    const ativo = criarAviso({ dataFim: '2026-11-30' })
    const terminado = criarAviso({ dataFim: '2026-11-01' })
    const semData = criarAviso()
    expect(vigentes([ativo, terminado, semData])).toEqual([ativo, semData])
  })

  it('contarPorCategoria tem todas as categorias e ignora uma desconhecida', () => {
    const estranho = { ...criarAviso(), categoria: 'outra' } as unknown as Aviso
    const total = contarPorCategoria([criarAviso({ categoria: 'emprego' }), criarAviso({ categoria: 'emprego' }), estranho])
    expect(total).toEqual({ calendario: 0, extracurricular: 0, emprego: 2, curso: 0 })
  })

  it('proximasDatas: só calendário vigente com data, em ordem, até o limite', () => {
    const a = criarAviso({ dataInicio: '2026-11-20' })
    const b = criarAviso({ dataInicio: '2026-11-15' })
    const c = criarAviso({ dataInicio: '2026-12-01' })
    const passado = criarAviso({ dataInicio: '2026-11-01' })
    const semData = criarAviso()
    const vaga = criarAviso({ categoria: 'emprego', dataFim: '2026-11-12' })
    expect(proximasDatas([a, b, c, passado, semData, vaga])).toEqual([b, a, c])
    expect(proximasDatas([a, b, c], 2)).toEqual([b, a])
  })
})

describe('agruparPorMes', () => {
  it('agrupa em ordem de data, com título por extenso, e pula os sem data', () => {
    const dez = criarAviso({ dataInicio: '2026-12-05' })
    const nov1 = criarAviso({ dataInicio: '2026-11-20' })
    const nov2 = criarAviso({ dataInicio: '2026-11-15' })
    const grupos = agruparPorMes([dez, criarAviso(), nov1, nov2])
    expect(grupos).toEqual([
      { chave: '2026-10', titulo: 'Novembro de 2026', itens: [nov2, nov1] },
      { chave: '2026-11', titulo: 'Dezembro de 2026', itens: [dez] }
    ])
  })

  it('lista vazia → nenhum grupo', () => {
    expect(agruparPorMes([])).toEqual([])
  })
})
