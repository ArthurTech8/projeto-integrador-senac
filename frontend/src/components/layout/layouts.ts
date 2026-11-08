// Catálogo de layouts. Cada rota escolhe um pelo nome em meta.layout (router/rotas.ts).
// Layout novo: crie o .vue nesta pasta, adicione aqui e o nome em NomeLayout (types/ui.ts).
import type { Component } from 'vue'
import type { NomeLayout } from '@/types'
import LayoutPadrao from './LayoutPadrao.vue'
import LayoutVazio from './LayoutVazio.vue'

export const LAYOUTS: Record<NomeLayout, Component> = {
  padrao: LayoutPadrao,
  vazio: LayoutVazio
}

export const LAYOUT_PADRAO: NomeLayout = 'padrao'
