import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DIA, chaveMes, diasAte, diasEntre, formatarData, hoje, mesmoDia, paraData } from '@/utils/datas'
import { AGORA } from '../apoio/fabricas'

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(AGORA) })
afterEach(() => { vi.useRealTimers() })

describe('paraData', () => {
  it('lê "AAAA-MM-DD" como meia-noite no fuso local (sem o dia "voltar um")', () => {
    const data = paraData('2026-11-20')
    expect(data?.getFullYear()).toBe(2026)
    expect(data?.getMonth()).toBe(10)
    expect(data?.getDate()).toBe(20)
    expect(data?.getHours()).toBe(0)
  })

  it('ignora a hora que vem da API ("2026-11-20T23:59:00")', () => {
    expect(paraData('2026-11-20T23:59:00')).toEqual(new Date(2026, 10, 20))
  })

  it('aceita Date e zera a hora', () => {
    expect(paraData(new Date(2026, 0, 5, 18, 30))).toEqual(new Date(2026, 0, 5))
  })

  it.each([null, undefined, '', 'abc', '2026-xx-01'])('devolve null para valor vazio ou inválido (%s)', (valor) => {
    expect(paraData(valor)).toBeNull()
  })
})

describe('hoje, diasEntre, diasAte', () => {
  it('hoje() é a data atual à meia-noite', () => {
    expect(hoje()).toEqual(new Date(2026, 10, 10))
  })

  it('diasEntre conta dias inteiros, inclusive negativos', () => {
    expect(diasEntre(new Date(2026, 10, 10), new Date(2026, 10, 15))).toBe(5)
    expect(diasEntre(new Date(2026, 10, 15), new Date(2026, 10, 10))).toBe(-5)
  })

  it('diasEntre não erra na virada do horário de verão', () => {
    expect(diasEntre(new Date(2026, 0, 1), new Date(2026, 11, 31))).toBe(364)
  })

  it('diasAte mede a partir de hoje e aceita null', () => {
    expect(diasAte(new Date(2026, 10, 11))).toBe(1)
    expect(diasAte(new Date(2026, 10, 9))).toBe(-1)
    expect(diasAte(null)).toBeNull()
  })

  it('DIA tem 24 horas em milissegundos', () => {
    expect(DIA).toBe(86_400_000)
  })
})

describe('mesmoDia e chaveMes', () => {
  it('mesmoDia compara datas e trata null como diferente', () => {
    expect(mesmoDia(new Date(2026, 1, 1), new Date(2026, 1, 1))).toBe(true)
    expect(mesmoDia(new Date(2026, 1, 1), new Date(2026, 1, 2))).toBe(false)
    expect(mesmoDia(null, new Date(2026, 1, 1))).toBe(false)
    expect(mesmoDia(null, null)).toBe(false)
  })

  it('chaveMes usa o mês começando em 0', () => {
    expect(chaveMes(new Date(2026, 10, 20))).toBe('2026-10')
    expect(chaveMes(new Date(2027, 0, 1))).toBe('2027-0')
  })
})

describe('formatarData', () => {
  it.each([
    ['completa', '20/11/2026'],
    ['curta', '20/11'],
    ['extenso', 'sexta-feira, 20 de novembro de 2026'],
    ['mes', 'novembro de 2026'],
    ['mesCurto', 'nov'],
    ['semanaCurta', 'sex']
  ] as const)('estilo %s → %s', (estilo, esperado) => {
    expect(formatarData('2026-11-20', estilo)).toBe(esperado)
  })

  it('usa "completa" quando o estilo não é informado', () => {
    expect(formatarData(new Date(2026, 0, 2))).toBe('02/01/2026')
  })

  it('devolve texto vazio para data inválida', () => {
    expect(formatarData(null)).toBe('')
    expect(formatarData('xx')).toBe('')
  })
})
