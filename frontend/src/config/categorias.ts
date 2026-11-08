// Tudo o que muda de uma categoria para outra fica aqui.
// Para criar uma categoria nova: adicione a chave em ChaveCategoria (types/aviso.ts), uma entrada aqui,
// uma cor em styles/tokens.css e o valor no CHECK da tabela (banco/schema.sql) e em categoriasValidas (Program.cs).
//
// campos = campos opcionais que o formulário mostra e a ficha do aviso exibe.
import type { CampoOpcional, ChaveCategoria, InfoCategoria } from '@/types'

// Record<ChaveCategoria, ...> obriga a ter uma entrada para cada categoria: se faltar uma, o typecheck falha.
export const CATEGORIAS: Record<ChaveCategoria, InfoCategoria> = {
  calendario: {
    rotulo: 'Calendário acadêmico',
    curto: 'Calendário',
    icone: 'calendario',
    descricao: 'Feriados, férias, provas e matrícula',
    acao: 'Saiba mais',
    rotuloDataFim: 'Data final',
    campos: ['dataInicio']
  },
  extracurricular: {
    rotulo: 'Atividades extracurriculares',
    curto: 'Atividades',
    icone: 'pessoas',
    descricao: 'Eventos, palestras, oficinas e grupos',
    acao: 'Inscrever-se',
    rotuloDataFim: 'Data final',
    campos: ['dataInicio', 'localizacao', 'vagas', 'certificado', 'link']
  },
  emprego: {
    rotulo: 'Empregos e estágios',
    curto: 'Vagas',
    icone: 'maleta',
    descricao: 'Oportunidades nas áreas dos cursos',
    acao: 'Candidatar-se à vaga',
    rotuloDataFim: 'Inscrições até',
    campos: ['empresa', 'localizacao', 'modalidade', 'vagas', 'link']
  },
  curso: {
    rotulo: 'Cursos rápidos',
    curto: 'Cursos',
    icone: 'capelo',
    descricao: 'Capacitações de poucas horas',
    acao: 'Fazer inscrição',
    rotuloDataFim: 'Data final',
    campos: ['dataInicio', 'localizacao', 'cargaHoraria', 'modalidade', 'vagas', 'certificado', 'link']
  }
}

export const CHAVES_CATEGORIAS = Object.keys(CATEGORIAS) as ChaveCategoria[]

// Confere se um texto qualquer (ex.: vindo da URL) é uma categoria válida.
// Object.hasOwn (e não "in"): "in" também aceita o que todo objeto herda, como ?categoria=toString
export function ehCategoria(valor: unknown): valor is ChaveCategoria {
  return typeof valor === 'string' && Object.hasOwn(CATEGORIAS, valor)
}

// Informações da categoria, ou undefined se a chave estiver vazia ou for inválida
export function infoCategoria(chave: string): InfoCategoria | undefined {
  return ehCategoria(chave) ? CATEGORIAS[chave] : undefined
}

// Usa um campo da categoria? (ex.: usaCampo('curso', 'cargaHoraria') → true)
export function usaCampo(categoria: ChaveCategoria, campo: CampoOpcional): boolean {
  return CATEGORIAS[categoria]?.campos.includes(campo) ?? false
}
