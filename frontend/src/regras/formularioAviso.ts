// Regras do formulário de avisos: estado inicial, campos visíveis e conversão para a API.
import { CATEGORIAS, CURSO_GERAL } from '@/config'
import type { Aviso, AvisoEntrada, AvisoFormulario, CampoOpcional, ChaveCategoria } from '@/types'

// Campos que só aparecem em algumas categorias (veja "campos" em config/categorias.ts)
export const CAMPOS_OPCIONAIS: readonly CampoOpcional[] = [
  'dataInicio', 'localizacao', 'link', 'empresa', 'cargaHoraria', 'modalidade', 'vagas', 'certificado'
]

export type CamposVisiveis = Record<CampoOpcional, boolean>

export function avisoVazio(): AvisoFormulario {
  return {
    titulo: '', resumo: '', descricao: '',
    categoria: 'calendario', curso: CURSO_GERAL,
    dataInicio: '', dataFim: '', localizacao: '', link: '',
    empresa: '', cargaHoraria: null, modalidade: '', certificado: false, vagas: null,
    urgente: false
  }
}

// { dataInicio: true, empresa: false, ... } para a categoria escolhida
export function camposVisiveis(categoria: ChaveCategoria): CamposVisiveis {
  const campos = CATEGORIAS[categoria]?.campos ?? []
  return Object.fromEntries(CAMPOS_OPCIONAIS.map((campo) => [campo, campos.includes(campo)])) as CamposVisiveis
}

// Aviso vindo da API → valores que os <input> entendem ("" no lugar de null, data sem hora)
export function paraFormulario(aviso: Aviso): AvisoFormulario {
  return {
    id: aviso.id,
    titulo: aviso.titulo,
    resumo: aviso.resumo,
    descricao: aviso.descricao,
    categoria: aviso.categoria,
    curso: aviso.curso,
    dataInicio: aviso.dataInicio?.slice(0, 10) ?? '',
    dataFim: aviso.dataFim?.slice(0, 10) ?? '',
    localizacao: aviso.localizacao ?? '',
    link: aviso.link ?? '',
    empresa: aviso.empresa ?? '',
    cargaHoraria: aviso.cargaHoraria,
    modalidade: aviso.modalidade ?? '',
    certificado: aviso.certificado,
    vagas: aviso.vagas,
    urgente: aviso.urgente
  }
}

// "" ou só espaços → null
function textoOuNull(texto: string): string | null {
  const limpo = texto.trim()
  return limpo === '' ? null : limpo
}

// "" (campo numérico apagado) → null
function numeroOuNull(valor: number | '' | null): number | null {
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : null
}

// Formulário → JSON para a API: textos sem espaços nas pontas, vazio vira null
// e campos que a categoria não usa são zerados.
export function paraEnvio(dados: AvisoFormulario): AvisoEntrada {
  const visivel = camposVisiveis(dados.categoria)
  return {
    id: dados.id,
    titulo: dados.titulo.trim(),
    resumo: dados.resumo.trim(),
    descricao: dados.descricao.trim(),
    categoria: dados.categoria,
    curso: dados.curso || CURSO_GERAL,
    dataInicio: visivel.dataInicio ? textoOuNull(dados.dataInicio) : null,
    dataFim: textoOuNull(dados.dataFim),
    localizacao: visivel.localizacao ? textoOuNull(dados.localizacao) : null,
    link: visivel.link ? textoOuNull(dados.link) : null,
    empresa: visivel.empresa ? textoOuNull(dados.empresa) : null,
    cargaHoraria: visivel.cargaHoraria ? numeroOuNull(dados.cargaHoraria) : null,
    modalidade: visivel.modalidade ? textoOuNull(dados.modalidade) : null,
    vagas: visivel.vagas ? numeroOuNull(dados.vagas) : null,
    certificado: visivel.certificado && dados.certificado,
    urgente: dados.urgente
  }
}
