import { ref, onMounted } from 'vue'
import { listarAvisos } from '@/services/avisos'
import { MENSAGEM_ERRO_API } from '@/config'
import type { Aviso } from '@/types'

// Carrega a lista de avisos da API ao abrir a tela.
//   const { avisos, carregando, erro, carregar } = useAvisos()
export function useAvisos() {
  const avisos = ref<Aviso[]>([])
  const carregando = ref(true)
  const erro = ref('')

  async function carregar(): Promise<void> {
    carregando.value = true
    erro.value = ''
    try {
      avisos.value = await listarAvisos()
    } catch {
      erro.value = MENSAGEM_ERRO_API
    } finally {
      carregando.value = false
    }
  }

  onMounted(carregar)

  return { avisos, carregando, erro, carregar }
}
