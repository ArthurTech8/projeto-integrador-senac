import { describe, expect, it } from 'vitest'
import { paraEnvio, paraFormulario, problemaNoFormulario, usuarioVazio } from '@/regras/formularioUsuario'
import type { UsuarioFormulario } from '@/types'
import { criarUsuario } from '../apoio/fabricas'

function formulario(mudancas: Partial<UsuarioFormulario> = {}): UsuarioFormulario {
  return { nome: 'Ana', email: 'ana@senac.com', perfil: 'editor', curso: '', senha: 'senha-forte', ...mudancas }
}

describe('usuarioVazio e paraFormulario', () => {
  it('formulário novo começa como editor, sem senha', () => {
    expect(usuarioVazio()).toEqual({ nome: '', email: '', perfil: 'editor', curso: '', senha: '' })
  })

  it('usuário da API vira formulário com senha vazia (= manter a atual)', () => {
    const form = paraFormulario(criarUsuario({ id: 4, nome: 'Bia', perfil: 'aluno', curso: 'Enfermagem' }))
    expect(form).toEqual({ id: 4, nome: 'Bia', email: 'pessoa@teste.com', perfil: 'aluno', curso: 'Enfermagem', senha: '' })
    expect(paraFormulario(criarUsuario({ curso: null })).curso).toBe('')
  })
})

describe('problemaNoFormulario', () => {
  it('formulário correto não tem problema', () => {
    expect(problemaNoFormulario(formulario(), false)).toBe('')
  })

  it.each<[Partial<UsuarioFormulario>, string]>([
    [{ nome: '   ' }, 'Informe o nome.'],
    [{ email: 'sem-arroba' }, 'Informe um e-mail válido.'],
    [{ email: 'a@b' }, 'Informe um e-mail válido.'],
    [{ email: 'com espaco@x.com' }, 'Informe um e-mail válido.'],
    [{ perfil: 'aluno', curso: '' }, 'Escolha o curso do aluno.'],
    [{ senha: '' }, 'Defina uma senha inicial.'],
    [{ senha: '1234567' }, 'A senha precisa ter pelo menos 8 caracteres.']
  ])('cadastro com %o → "%s"', (mudancas, esperado) => {
    expect(problemaNoFormulario(formulario(mudancas), false)).toBe(esperado)
  })

  it('na edição, senha vazia é permitida, mas senha curta não', () => {
    expect(problemaNoFormulario(formulario({ senha: '' }), true)).toBe('')
    expect(problemaNoFormulario(formulario({ senha: 'curta' }), true)).toBe('A senha precisa ter pelo menos 8 caracteres.')
  })

  it('aluno com curso passa', () => {
    expect(problemaNoFormulario(formulario({ perfil: 'aluno', curso: 'Gastronomia' }), false)).toBe('')
  })
})

describe('paraEnvio', () => {
  it('limpa o nome, deixa o e-mail minúsculo e mantém a senha', () => {
    expect(paraEnvio(formulario({ nome: '  Ana  ', email: '  ANA@Senac.COM ' }))).toEqual({
      nome: 'Ana', email: 'ana@senac.com', perfil: 'editor', curso: null, senha: 'senha-forte'
    })
  })

  it('só aluno leva curso', () => {
    expect(paraEnvio(formulario({ perfil: 'aluno', curso: 'Enfermagem' })).curso).toBe('Enfermagem')
    expect(paraEnvio(formulario({ perfil: 'admin', curso: 'Enfermagem' })).curso).toBeNull()
  })
})
