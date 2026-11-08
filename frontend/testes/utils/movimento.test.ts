import { describe, expect, it, vi } from 'vitest'
import { comportamentoRolagem, prefereMenosMovimento } from '@/utils/movimento'

function simularPreferencia(reduzir: boolean): void {
  vi.stubGlobal('matchMedia', (consulta: string) => ({
    matches: reduzir && consulta === '(prefers-reduced-motion: reduce)',
    media: consulta
  }))
}

describe('prefereMenosMovimento e comportamentoRolagem', () => {
  it('com "reduzir movimento" ligado, a rolagem é instantânea', () => {
    simularPreferencia(true)
    expect(prefereMenosMovimento()).toBe(true)
    expect(comportamentoRolagem()).toBe('auto')
  })

  it('sem a preferência, a rolagem é suave', () => {
    simularPreferencia(false)
    expect(prefereMenosMovimento()).toBe(false)
    expect(comportamentoRolagem()).toBe('smooth')
  })
})
