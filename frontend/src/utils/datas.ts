// Funções de data genéricas (não sabem nada de avisos).

export const DIA = 24 * 60 * 60 * 1000

export type ValorData = string | Date | null | undefined

// Aceita "2026-11-20", "2026-11-20T00:00:00" ou Date e devolve a data à meia-noite, no fuso local.
// (Ler só a parte da data evita o bug de o dia "voltar um" por causa do fuso horário.)
export function paraData(valor: ValorData): Date | null {
  if (!valor) return null
  if (valor instanceof Date) return new Date(valor.getFullYear(), valor.getMonth(), valor.getDate())
  const [ano, mes, dia] = valor.slice(0, 10).split('-').map(Number)
  if (!ano || !mes || !dia) return null
  return new Date(ano, mes - 1, dia)
}

export function hoje(): Date {
  const agora = new Date()
  return new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
}

export function diasEntre(inicio: Date, fim: Date): number {
  return Math.round((fim.getTime() - inicio.getTime()) / DIA)
}

// Quantos dias faltam até a data (negativo = já passou)
export function diasAte(data: Date | null): number | null {
  return data ? diasEntre(hoje(), data) : null
}

export function mesmoDia(a: Date | null, b: Date | null): boolean {
  return a !== null && b !== null && a.getTime() === b.getTime()
}

// Chave para agrupar por mês: "2026-10" (mês começa em 0)
export function chaveMes(data: Date): string {
  return `${data.getFullYear()}-${data.getMonth()}`
}

const ESTILOS = {
  curta: { day: '2-digit', month: '2-digit' },                       // 20/11
  completa: { day: '2-digit', month: '2-digit', year: 'numeric' },   // 20/11/2026
  extenso: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }, // sexta-feira, 20 de novembro de 2026
  mes: { month: 'long', year: 'numeric' },                           // novembro de 2026
  mesCurto: { month: 'short' },                                      // nov
  semanaCurta: { weekday: 'short' }                                  // sex
} satisfies Record<string, Intl.DateTimeFormatOptions>

export type EstiloData = keyof typeof ESTILOS

const formatadores: Partial<Record<EstiloData, Intl.DateTimeFormat>> = {}

export function formatarData(valor: ValorData, estilo: EstiloData = 'completa'): string {
  const data = paraData(valor)
  if (!data) return ''
  const formatador = (formatadores[estilo] ??= new Intl.DateTimeFormat('pt-BR', ESTILOS[estilo]))
  // "nov." → "nov"
  return formatador.format(data).replace(/\.$/, '')
}
