import { reactive, computed, watch, type Ref } from 'vue'
import { useRoute, useRouter, type LocationQuery, type LocationQueryRaw } from 'vue-router'
import { filtrarAvisos, encerrado } from '@/regras/avisos'
import { ehCategoria } from '@/config'
import { usuarioAtual } from './useSessao'
import type { Aviso, FiltrosAvisos } from '@/types'

// Um valor da URL pode vir como texto, null ou lista (?busca=a&busca=b).
// Aqui fica só o primeiro texto, para nunca quebrar a tela.
function textoDaUrl(valor: LocationQuery[string]): string {
  const primeiro = Array.isArray(valor) ? valor[0] : valor
  return typeof primeiro === 'string' ? primeiro : ''
}

// Filtros da lista de avisos guardados na URL (ex.: /avisos?categoria=emprego&curso=Enfermagem),
// para o link poder ser compartilhado e os filtros continuarem lá ao voltar de um aviso.
//   const { filtros, filtrados, qtdEncerrados, temFiltro, limpar } = useFiltrosAvisos(avisos)
export function useFiltrosAvisos(avisos: Ref<Aviso[]>) {
  const rota = useRoute()
  const router = useRouter()

  const filtros = reactive<FiltrosAvisos>({ categoria: '', curso: '', busca: '', mostrarEncerrados: false })

  function lerDaUrl(query: LocationQuery): void {
    const categoria = textoDaUrl(query.categoria)
    // categoria inválida na URL (?categoria=xyz) é ignorada
    filtros.categoria = ehCategoria(categoria) ? categoria : ''
    filtros.curso = textoDaUrl(query.curso)
    // compara sem espaços nas pontas para não apagar o espaço que o aluno está digitando
    const busca = textoDaUrl(query.busca)
    if (busca !== filtros.busca.trim()) filtros.busca = busca
    filtros.mostrarEncerrados = textoDaUrl(query.encerrados) === '1'
  }

  function paraUrl(): LocationQueryRaw {
    const query: LocationQueryRaw = {}
    if (filtros.categoria) query.categoria = filtros.categoria
    if (filtros.curso) query.curso = filtros.curso
    if (filtros.busca.trim()) query.busca = filtros.busca.trim()
    if (filtros.mostrarEncerrados) query.encerrados = '1'
    return query
  }

  lerDaUrl(rota.query)

  // Aluno logado: se a URL não escolheu um curso, a lista já abre no curso dele.
  // Só na abertura da tela: se ele limpar o filtro depois, a lista mostra todos.
  const usuario = usuarioAtual()
  if (!filtros.curso && usuario?.perfil === 'aluno' && usuario.curso) {
    filtros.curso = usuario.curso
    void router.replace({ query: paraUrl() })
  }

  // filtro mudou na tela → atualiza a URL
  watch(filtros, () => { void router.replace({ query: paraUrl() }) })
  // URL mudou (link do rodapé, botão voltar) → atualiza os filtros
  watch(() => rota.query, lerDaUrl)

  const filtrados = computed(() => filtrarAvisos(avisos.value, filtros))
  const qtdEncerrados = computed(() => avisos.value.filter(encerrado).length)
  const temFiltro = computed(() => Boolean(filtros.categoria || filtros.curso || filtros.busca.trim()))

  function limpar(): void {
    Object.assign(filtros, { categoria: '', curso: '', busca: '', mostrarEncerrados: false } satisfies FiltrosAvisos)
  }

  return { filtros, filtrados, qtdEncerrados, temFiltro, limpar }
}
