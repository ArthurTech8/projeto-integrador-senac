// Preferência de movimento do sistema operacional ("reduzir movimento" / "remover animações").
// Quem ativa isso pode passar mal com a tela deslizando sozinha: nesse caso a rolagem é instantânea.

/** true quando a pessoa pediu menos movimento nas configurações do aparelho */
export function prefereMenosMovimento(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** comportamento para scrollIntoView/scrollTo: 'smooth' normalmente, 'auto' (instantâneo) com movimento reduzido */
export function comportamentoRolagem(): ScrollBehavior {
  return prefereMenosMovimento() ? 'auto' : 'smooth'
}
