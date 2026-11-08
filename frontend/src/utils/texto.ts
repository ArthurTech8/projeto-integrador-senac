// Funções de texto genéricas.

// Remove acentos e deixa minúsculo, para buscas: "Estágio" → "estagio"
export function normalizar(texto: string | null | undefined): string {
  return String(texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

// "sábado, 7 de novembro" → "Sábado, 7 de novembro"
export function capitalizar(texto: string): string {
  return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : ''
}

// plural(1, 'aviso', 'avisos') → "1 aviso"; plural(3, ...) → "3 avisos"
export function plural(quantidade: number, singular: string, pluralTexto: string): string {
  return `${quantidade} ${quantidade === 1 ? singular : pluralTexto}`
}
