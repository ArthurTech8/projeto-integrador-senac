import { ref, onMounted } from 'vue'
import { listarUsuarios } from '@/services/usuarios'
import { MENSAGEM_ERRO_API } from '@/config'
import type { Usuario } from '@/types'

// Carrega a lista de usuários (só admin) ao abrir a tela.
//   const { usuarios, carregando, erro, carregar } = useUsuarios()
export function useUsuarios() {
  const usuarios = ref<Usuario[]>([])
  const carregando = ref(true)
  const erro = ref('')

  async function carregar(): Promise<void> {
    carregando.value = true
    erro.value = ''
    try {
      usuarios.value = await listarUsuarios()
    } catch (e) {
      erro.value = e instanceof Error && 'status' in e && e.status === 403
        ? e.message
        : MENSAGEM_ERRO_API
    } finally {
      carregando.value = false
    }
  }

  onMounted(carregar)

  return { usuarios, carregando, erro, carregar }
}
