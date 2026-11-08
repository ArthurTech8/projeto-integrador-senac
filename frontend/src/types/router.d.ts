// Informa ao TypeScript quais campos existem em "meta" das rotas (router/rotas.ts)
import 'vue-router'
import type { NomeLayout } from './ui'
import type { Acesso } from './usuario'

declare module 'vue-router' {
  interface RouteMeta {
    /** Título da aba do navegador */
    titulo?: string
    /** Se existir, a tela aparece no menu do topo (só para quem tem acesso a ela) */
    menu?: { texto: string; ordem: number }
    /** Moldura da tela. Sem valor = 'padrao' (cabeçalho + rodapé) */
    layout?: NomeLayout
    /** Quem pode abrir a tela. Sem valor = pública */
    requer?: Acesso
  }
}

export {}
