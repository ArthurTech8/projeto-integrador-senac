import { ref, watch, toValue, type MaybeRefOrGetter } from 'vue'
import { buscarAviso } from '@/services/avisos'
import { ErroApi } from '@/services/api'
import { MENSAGEM_ERRO_API, MENSAGEM_NAO_ENCONTRADO } from '@/config'
import type { Aviso } from '@/types'

// Carrega um aviso pelo id e recarrega se o id mudar.
//   const { aviso, carregando, erro, naoEncontrado } = useAviso(() => props.id)
export function useAviso(id: MaybeRefOrGetter<string | number>) {
  const aviso = ref<Aviso | null>(null)
  const carregando = ref(true)
  const erro = ref('')
  const naoEncontrado = ref(false)

  async function carregar(): Promise<void> {
    carregando.value = true
    erro.value = ''
    naoEncontrado.value = false
    try {
      aviso.value = await buscarAviso(toValue(id))
    } catch (e) {
      aviso.value = null
      naoEncontrado.value = e instanceof ErroApi && e.status === 404
      erro.value = naoEncontrado.value ? MENSAGEM_NAO_ENCONTRADO : MENSAGEM_ERRO_API
    } finally {
      carregando.value = false
    }
  }

  watch(() => toValue(id), carregar, { immediate: true })

  return { aviso, carregando, erro, naoEncontrado, carregar }
}
