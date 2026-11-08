import { describe, expect, it } from 'vitest'
import { caminhoSeguro, destinoAposLogin, ehEquipe, permite } from '@/regras/acesso'
import type { Acesso, Perfil } from '@/types'
import { criarUsuario } from '../apoio/fabricas'

describe('permite', () => {
  it('tela pública abre para todo mundo, logado ou não', () => {
    expect(permite(undefined, null)).toBe(true)
    expect(permite(undefined, criarUsuario({ perfil: 'aluno' }))).toBe(true)
  })

  it('tela protegida nunca abre para quem não está logado', () => {
    for (const requer of ['logado', 'equipe', 'admin'] as const) expect(permite(requer, null)).toBe(false)
  })

  // tabela de permissões: exigência 5 do REGRAS_PROJETO_INTEGRADOR.md
  it.each<[Acesso, Perfil, boolean]>([
    ['logado', 'aluno', true], ['logado', 'editor', true], ['logado', 'admin', true],
    ['equipe', 'aluno', false], ['equipe', 'editor', true], ['equipe', 'admin', true],
    ['admin', 'aluno', false], ['admin', 'editor', false], ['admin', 'admin', true]
  ])('requer "%s" com perfil %s → %s', (requer, perfil, esperado) => {
    expect(permite(requer, criarUsuario({ perfil }))).toBe(esperado)
  })
})

describe('ehEquipe e destinoAposLogin', () => {
  it('equipe = admin ou editor', () => {
    expect(ehEquipe('admin')).toBe(true)
    expect(ehEquipe('editor')).toBe(true)
    expect(ehEquipe('aluno')).toBe(false)
    expect(ehEquipe(undefined)).toBe(false)
  })

  it('equipe vai para Gerenciar; aluno vai para o mural', () => {
    expect(destinoAposLogin(criarUsuario({ perfil: 'admin' }))).toBe('/gerenciar')
    expect(destinoAposLogin(criarUsuario({ perfil: 'editor' }))).toBe('/gerenciar')
    expect(destinoAposLogin(criarUsuario({ perfil: 'aluno' }))).toBe('/avisos')
  })
})

describe('caminhoSeguro', () => {
  it('aceita caminhos internos', () => {
    expect(caminhoSeguro('/avisos?categoria=emprego')).toBe('/avisos?categoria=emprego')
    expect(caminhoSeguro('/')).toBe('/')
  })

  it.each<[unknown, string]>([
    ['//site-malicioso.com', 'outro site'],
    ['https://site.com', 'endereço completo'],
    ['avisos', 'caminho relativo'],
    ['', 'vazio'],
    [['/avisos'], 'lista vinda da URL'],
    [null, 'null'],
    [42, 'número']
  ])('recusa %o (%s)', (valor, _motivo) => {
    expect(caminhoSeguro(valor)).toBeNull()
  })
})
