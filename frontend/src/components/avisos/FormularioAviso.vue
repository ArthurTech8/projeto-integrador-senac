<script setup lang="ts">
// Formulário de cadastro/edição de aviso. Não chama a API: só emite "salvar" com o JSON pronto.
//   <FormularioAviso ref="form" :aviso="avisoEmEdicao" :salvando="..." @salvar="..." @cancelar="..." />
// Depois de salvar um aviso novo, o pai chama form.limpar().
import { ref, computed, watch } from 'vue'
import Icone from '@/components/ui/Icone.vue'
import { CATEGORIAS, CURSOS, MODALIDADES } from '@/config'
import { avisoVazio, camposVisiveis, paraFormulario, paraEnvio } from '@/regras/formularioAviso'
import type { Aviso, AvisoEntrada, AvisoFormulario } from '@/types'

const props = withDefaults(defineProps<{
  /** null = novo aviso; objeto = editar este aviso */
  aviso?: Aviso | null
  salvando?: boolean
}>(), { aviso: null, salvando: false })

const emit = defineEmits<{
  salvar: [dados: AvisoEntrada]
  cancelar: []
}>()

const dados = ref<AvisoFormulario>(avisoVazio())

watch(() => props.aviso, (aviso) => {
  dados.value = aviso ? paraFormulario(aviso) : avisoVazio()
}, { immediate: true })

const editando = computed(() => props.aviso !== null)
const mostra = computed(() => camposVisiveis(dados.value.categoria))
const rotuloDataFim = computed(() => CATEGORIAS[dados.value.categoria]?.rotuloDataFim ?? 'Data final')

function enviar(): void {
  emit('salvar', paraEnvio(dados.value))
}

function limpar(): void {
  dados.value = avisoVazio()
}

defineExpose({ limpar })
</script>

<template>
  <form class="form" @submit.prevent="enviar">
    <div class="colunas">
      <label class="campo">
        <span>Categoria</span>
        <select v-model="dados.categoria" required>
          <option v-for="(info, chave) in CATEGORIAS" :key="chave" :value="chave">{{ info.rotulo }}</option>
        </select>
      </label>
      <label class="campo">
        <span>Para qual curso</span>
        <select v-model="dados.curso" required>
          <option v-for="c in CURSOS" :key="c" :value="c">{{ c }}</option>
        </select>
      </label>
    </div>

    <label class="campo">
      <span>Título</span>
      <input v-model="dados.titulo" required maxlength="150" placeholder="Ex.: Feriado de Natal" />
    </label>

    <label class="campo">
      <span>Resumo</span>
      <input v-model="dados.resumo" required maxlength="300" placeholder="Uma frase que aparece no card" />
    </label>

    <label class="campo">
      <span>Descrição completa</span>
      <textarea v-model="dados.descricao" required placeholder="Todas as informações que o aluno precisa saber"></textarea>
    </label>

    <div class="colunas">
      <label v-if="mostra.dataInicio" class="campo">
        <span>Data de início</span>
        <input v-model="dados.dataInicio" type="date" />
      </label>
      <label class="campo">
        <span>{{ rotuloDataFim }}</span>
        <input v-model="dados.dataFim" type="date" :min="(mostra.dataInicio && dados.dataInicio) || undefined" />
        <small v-if="mostra.dataInicio">Deixe vazio se for um dia só.</small>
      </label>
    </div>

    <label v-if="mostra.empresa" class="campo">
      <span>Empresa</span>
      <input v-model="dados.empresa" maxlength="100" />
    </label>

    <label v-if="mostra.localizacao" class="campo">
      <span>Local</span>
      <input v-model="dados.localizacao" maxlength="150" placeholder="Ex.: Auditório, Sala 204, Online" />
    </label>

    <div v-if="mostra.cargaHoraria || mostra.modalidade || mostra.vagas" class="colunas colunas-estreitas">
      <label v-if="mostra.cargaHoraria" class="campo">
        <span>Carga horária (h)</span>
        <input v-model.number="dados.cargaHoraria" type="number" inputmode="numeric" min="1" step="1" />
      </label>
      <label v-if="mostra.modalidade" class="campo">
        <span>Modalidade</span>
        <select v-model="dados.modalidade">
          <option value="">—</option>
          <option v-for="m in MODALIDADES" :key="m" :value="m">{{ m }}</option>
        </select>
      </label>
      <label v-if="mostra.vagas" class="campo">
        <span>Vagas</span>
        <input v-model.number="dados.vagas" type="number" inputmode="numeric" min="1" step="1" />
      </label>
    </div>

    <label v-if="mostra.link" class="campo">
      <span>Link de inscrição / candidatura</span>
      <input v-model="dados.link" type="url" maxlength="300" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="https://" />
    </label>

    <div class="marcar">
      <label v-if="mostra.certificado" class="caixa-marcar">
        <input v-model="dados.certificado" type="checkbox" /> Emite certificado
      </label>
      <label class="caixa-marcar">
        <input v-model="dados.urgente" type="checkbox" /> Marcar como urgente
      </label>
    </div>

    <div class="botoes">
      <button class="botao" type="submit" :disabled="salvando">
        <Icone :nome="editando ? 'editar' : 'mais'" :tamanho="16" />
        {{ salvando ? 'Salvando…' : editando ? 'Salvar alterações' : 'Publicar aviso' }}
      </button>
      <button v-if="editando" class="botao botao-secundario" type="button" @click="emit('cancelar')">Cancelar</button>
    </div>
  </form>
</template>

<style scoped>
.form { display: grid; gap: 14px; }
.colunas { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr)); }
.colunas-estreitas { grid-template-columns: repeat(auto-fit, minmax(min(100%, 130px), 1fr)); }
.marcar { display: flex; flex-wrap: wrap; gap: 10px 24px; }
.botoes { display: flex; flex-wrap: wrap; gap: 10px; }
</style>
