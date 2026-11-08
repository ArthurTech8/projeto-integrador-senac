// Fábricas de dados para os testes: um objeto completo e válido, mudando só o que o teste precisa.
//   criarAviso({ categoria: 'emprego', dataFim: '2026-11-30' })
import type { Aviso, Usuario } from '@/types'

let proximoId = 1

export function criarAviso(mudancas: Partial<Aviso> = {}): Aviso {
  return {
    id: proximoId++,
    titulo: 'Aviso de teste',
    resumo: 'Resumo do aviso',
    descricao: 'Descrição completa do aviso',
    categoria: 'calendario',
    curso: 'Todos os cursos',
    dataInicio: null,
    dataFim: null,
    localizacao: null,
    link: null,
    empresa: null,
    cargaHoraria: null,
    modalidade: null,
    certificado: false,
    vagas: null,
    urgente: false,
    publicadoEm: '2026-11-01T10:00:00',
    ...mudancas
  }
}

export function criarUsuario(mudancas: Partial<Usuario> = {}): Usuario {
  return {
    id: proximoId++,
    nome: 'Pessoa de Teste',
    email: 'pessoa@teste.com',
    perfil: 'editor',
    curso: null,
    criadoEm: '2026-11-01T10:00:00',
    ...mudancas
  }
}

/** Relógio fixo: terça-feira, 10/11/2026, meio-dia (fuso de São Paulo, ver vitest.config.ts) */
export const AGORA = new Date(2026, 10, 10, 12, 0, 0)
