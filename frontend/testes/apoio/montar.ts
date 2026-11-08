// Roda um composable dentro de um componente de verdade (precisa disso quem usa onMounted, useRoute...).
//   const { resultado } = montarComposable(() => useAvisos())
import { defineComponent, type Plugin } from 'vue'
import { mount } from '@vue/test-utils'

export function montarComposable<T>(usar: () => T, plugins: Plugin[] = []) {
  let resultado: T | undefined
  const Teste = defineComponent({
    setup() {
      resultado = usar()
      return () => null
    }
  })
  const wrapper = mount(Teste, { global: { plugins } })
  if (resultado === undefined) throw new Error('O composable não foi executado')
  return { resultado, wrapper }
}
