import { describe, expect, it } from 'vitest'
import { CAMPOS_OPCIONAIS, avisoVazio, camposVisiveis, paraEnvio, paraFormulario } from '@/regras/formularioAviso'
import { CATEGORIAS, CHAVES_CATEGORIAS } from '@/config'
import type { AvisoFormulario } from '@/types'
import { criarAviso } from '../apoio/fabricas'

describe('avisoVazio', () => {
  it('começa como calendário geral, sem datas e sem urgência', () => {
    const vazio = avisoVazio()
    expect(vazio.categoria).toBe('calendario')
    expect(vazio.curso).toBe('Todos os cursos')
    expect(vazio.titulo).toBe('')
    expect(vazio.urgente).toBe(false)
    expect(vazio.id).toBeUndefined()
  })

  it('devolve um objeto novo a cada chamada (um formulário não suja o outro)', () => {
    const a = avisoVazio()
    a.titulo = 'mudou'
    expect(avisoVazio().titulo).toBe('')
  })
})

describe('camposVisiveis', () => {
  it.each(CHAVES_CATEGORIAS)('categoria %s mostra exatamente os campos de config/categorias.ts', (categoria) => {
    const visiveis = camposVisiveis(categoria)
    expect(Object.keys(visiveis).sort()).toEqual([...CAMPOS_OPCIONAIS].sort())
    for (const campo of CAMPOS_OPCIONAIS) expect(visiveis[campo]).toBe(CATEGORIAS[categoria].campos.includes(campo))
  })

  it('vaga mostra empresa e esconde carga horária; curso faz o contrário', () => {
    expect(camposVisiveis('emprego').empresa).toBe(true)
    expect(camposVisiveis('emprego').cargaHoraria).toBe(false)
    expect(camposVisiveis('curso').empresa).toBe(false)
    expect(camposVisiveis('curso').cargaHoraria).toBe(true)
  })
})

describe('paraFormulario', () => {
  it('troca null por "" e corta a hora das datas', () => {
    const form = paraFormulario(criarAviso({
      id: 7, dataInicio: '2026-11-20T00:00:00', dataFim: null, localizacao: null, cargaHoraria: 8
    }))
    expect(form.id).toBe(7)
    expect(form.dataInicio).toBe('2026-11-20')
    expect(form.dataFim).toBe('')
    expect(form.localizacao).toBe('')
    expect(form.empresa).toBe('')
    expect(form.cargaHoraria).toBe(8)
  })
})

describe('paraEnvio', () => {
  function formulario(mudancas: Partial<AvisoFormulario>): AvisoFormulario {
    return { ...avisoVazio(), titulo: 'T', resumo: 'R', descricao: 'D', ...mudancas }
  }

  it('tira espaços das pontas e transforma vazio em null', () => {
    const envio = paraEnvio(formulario({ categoria: 'extracurricular', titulo: '  Hackathon  ', localizacao: '   ', link: ' https://x.com ' }))
    expect(envio.titulo).toBe('Hackathon')
    expect(envio.localizacao).toBeNull()
    expect(envio.link).toBe('https://x.com')
  })

  it('zera os campos que a categoria não usa (sobra de quando trocou a categoria)', () => {
    const envio = paraEnvio(formulario({
      categoria: 'calendario', empresa: 'Empresa X', cargaHoraria: 10, vagas: 5, certificado: true, modalidade: 'Online'
    }))
    expect(envio.empresa).toBeNull()
    expect(envio.cargaHoraria).toBeNull()
    expect(envio.vagas).toBeNull()
    expect(envio.modalidade).toBeNull()
    expect(envio.certificado).toBe(false)
  })

  it('número apagado no campo ("") vira null; número válido passa', () => {
    expect(paraEnvio(formulario({ categoria: 'curso', cargaHoraria: '' })).cargaHoraria).toBeNull()
    expect(paraEnvio(formulario({ categoria: 'curso', cargaHoraria: 12, vagas: 30 }))).toMatchObject({ cargaHoraria: 12, vagas: 30 })
    expect(paraEnvio(formulario({ categoria: 'curso', vagas: Number.NaN })).vagas).toBeNull()
  })

  it('vaga não usa data de início, mas mantém o prazo final', () => {
    const envio = paraEnvio(formulario({ categoria: 'emprego', dataInicio: '2026-11-01', dataFim: '2026-11-30' }))
    expect(envio.dataInicio).toBeNull()
    expect(envio.dataFim).toBe('2026-11-30')
  })

  it('curso vazio vira "Todos os cursos"; id e urgente são mantidos', () => {
    const envio = paraEnvio(formulario({ id: 3, curso: '', urgente: true }))
    expect(envio).toMatchObject({ id: 3, curso: 'Todos os cursos', urgente: true })
  })

  it('ida e volta: o que veio da API volta igual', () => {
    const original = criarAviso({
      categoria: 'curso', dataInicio: '2026-11-17T00:00:00', dataFim: '2026-11-26T00:00:00', localizacao: 'Online',
      link: 'https://x.com', cargaHoraria: 8, modalidade: 'Online', certificado: true, vagas: 40
    })
    const envio = paraEnvio(paraFormulario(original))
    expect(envio).toMatchObject({
      dataInicio: '2026-11-17', dataFim: '2026-11-26', localizacao: 'Online', link: 'https://x.com',
      cargaHoraria: 8, modalidade: 'Online', certificado: true, vagas: 40
    })
  })
})
