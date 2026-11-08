// Cursos/áreas da instituição. "Todos os cursos" marca um aviso geral.
export const CURSO_GERAL = 'Todos os cursos'

export const CURSOS: readonly string[] = [
  CURSO_GERAL,
  'Tecnologia da Informação',
  'Administração',
  'Enfermagem',
  'Design Gráfico',
  'Gastronomia'
]

// Só os cursos de verdade (sem a opção geral), para filtros
export const CURSOS_ESPECIFICOS: readonly string[] = CURSOS.filter((curso) => curso !== CURSO_GERAL)

export const MODALIDADES = ['Presencial', 'Online', 'Híbrido'] as const
