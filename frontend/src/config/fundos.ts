// Fotos do banner da página inicial (frontend/public/fundos/).
// Todas gratuitas pela Licença Unsplash (https://unsplash.com/license): uso livre, crédito não obrigatório,
// mas mantido aqui e no README por cortesia aos fotógrafos.
// Foto nova: salve em public/fundos/ nas larguras 1920 e 960 (WebP) e acrescente uma linha aqui.
import type { ImagemFundo } from '@/types'

/** Tempo que cada foto fica na tela antes de trocar (ms) */
export const INTERVALO_FUNDO = 8000

export const FUNDOS_INICIO: readonly ImagemFundo[] = [
  {
    grande: '/fundos/grupo-laptop-1920.webp',
    pequena: '/fundos/grupo-laptop-960.webp',
    enquadramento: '62% 30%',
    autor: 'Vitaly Gariev',
    origem: 'https://unsplash.com/photos/kp7qkHTgSKc'
  },
  {
    grande: '/fundos/biblioteca-1920.webp',
    pequena: '/fundos/biblioteca-960.webp',
    enquadramento: '50% 55%',
    autor: 'Zoshua Colah',
    origem: 'https://unsplash.com/photos/Ma7aOy5mMp0'
  },
  {
    grande: '/fundos/aula-1920.webp',
    pequena: '/fundos/aula-960.webp',
    enquadramento: '62% 40%',
    autor: 'Timur Shakerzianov',
    origem: 'https://unsplash.com/photos/w8nxODYvrns'
  },
  {
    // foto vertical: o recorte fica nas mãos e no teclado
    grande: '/fundos/laptop-1920.webp',
    pequena: '/fundos/laptop-960.webp',
    enquadramento: '45% 62%',
    autor: 'Hasnain Ayaz',
    origem: 'https://unsplash.com/photos/pLybV75vkP4'
  }
]
