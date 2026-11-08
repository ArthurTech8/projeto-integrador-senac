// Dados da instituição exibidos no cabeçalho, no rodapé e no título das abas.
//
// Logos oficiais do Senac RS (assinatura do Sistema Comércio), copiados de senacrs.com.br
// e guardados em frontend/public/marca/. Arquivos em public/ são servidos na raiz do site
// ("/marca/..."). Pelo manual da marca, use sempre estes arquivos: nunca redesenhe,
// estique ou mude as cores do logo.
export const INSTITUICAO = {
  nome: 'Senac RS',
  nomeSite: 'Mural do Aluno',
  site: 'https://www.senacrs.com.br',
  logo: {
    /** versão branca, para fundos escuros (cabeçalho e rodapé) */
    fundoEscuro: '/marca/senac-rs-branco.png',
    /** versão colorida, para fundos claros */
    fundoClaro: '/marca/senac-rs-colorido.png',
    descricao: 'Senac RS, Sistema Comércio'
  }
} as const
