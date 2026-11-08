// Tipos da interface (componentes genéricos)

/** Ícones disponíveis em components/ui/Icone.vue */
export type NomeIcone =
  | 'calendario' | 'pessoas' | 'maleta' | 'capelo' | 'busca' | 'alerta' | 'local'
  | 'relogio' | 'voltar' | 'seta' | 'editar' | 'lixeira' | 'mais' | 'externo'
  | 'menu' | 'fechar' | 'certificado' | 'predio' | 'tela' | 'livro'
  | 'pausar' | 'tocar'

/** Foto de fundo do banner (config/fundos.ts). Duas versões: o celular baixa só a pequena. */
export interface ImagemFundo {
  /** versão de 1920 px de largura (telas grandes) */
  grande: string
  /** versão de 960 px de largura (celular e tablet) */
  pequena: string
  /** object-position: qual parte da foto fica visível quando ela é cortada (ex.: '60% 35%') */
  enquadramento: string
  /** crédito do fotógrafo (Licença Unsplash) */
  autor: string
  origem: string
}

/**
 * Moldura da tela (components/layout/layouts.ts):
 * 'padrao' = cabeçalho + conteúdo + rodapé | 'vazio' = só o conteúdo (ex.: login)
 */
export type NomeLayout = 'padrao' | 'vazio'

/** Link usado em cabeçalhos de seção: { para: '/avisos', texto: 'Ver todos' } */
export interface LinkSecao {
  para: string
  texto: string
}
