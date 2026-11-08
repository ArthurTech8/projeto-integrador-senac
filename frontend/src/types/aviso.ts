// Formatos de dados do mural. Espelham o Models/Aviso.cs da API (JSON em camelCase).
import type { NomeIcone } from './ui'

export type ChaveCategoria = 'calendario' | 'extracurricular' | 'emprego' | 'curso'

/** Aviso como a API devolve (GET /api/avisos e /api/avisos/{id}) */
export interface Aviso {
  id: number
  titulo: string
  resumo: string
  descricao: string
  categoria: ChaveCategoria
  curso: string
  /** Datas chegam como "2026-11-20T00:00:00" */
  dataInicio: string | null
  dataFim: string | null
  localizacao: string | null
  link: string | null
  empresa: string | null
  cargaHoraria: number | null
  modalidade: string | null
  certificado: boolean
  vagas: number | null
  urgente: boolean
  publicadoEm: string
  // Não existe "ativo" aqui: a API só devolve avisos não excluídos (ativo = 1 no banco).
}

/** Corpo enviado no POST/PUT. "publicadoEm" é preenchido pelo banco. */
export type AvisoEntrada = Omit<Aviso, 'id' | 'publicadoEm'> & { id?: number }

/** Campos que só aparecem em algumas categorias */
export type CampoOpcional =
  | 'dataInicio' | 'localizacao' | 'link' | 'empresa'
  | 'cargaHoraria' | 'modalidade' | 'vagas' | 'certificado'

/** Estado do formulário: os <input> usam "" no lugar de null */
export interface AvisoFormulario {
  id?: number
  titulo: string
  resumo: string
  descricao: string
  categoria: ChaveCategoria
  curso: string
  dataInicio: string
  dataFim: string
  localizacao: string
  link: string
  empresa: string
  /** v-model.number devolve "" quando o campo é apagado */
  cargaHoraria: number | '' | null
  modalidade: string
  certificado: boolean
  vagas: number | '' | null
  urgente: boolean
}

/** O que muda de uma categoria para outra (config/categorias.ts) */
export interface InfoCategoria {
  rotulo: string
  curto: string
  icone: NomeIcone
  descricao: string
  /** Texto do botão principal na página do aviso */
  acao: string
  rotuloDataFim: string
  campos: CampoOpcional[]
}

export interface FiltrosAvisos {
  categoria: ChaveCategoria | ''
  curso: string
  busca: string
  mostrarEncerrados: boolean
}

export interface ItemFicha {
  icone: NomeIcone
  rotulo: string
  valor: string | number
}

export interface GrupoMes {
  chave: string
  titulo: string
  itens: Aviso[]
}
