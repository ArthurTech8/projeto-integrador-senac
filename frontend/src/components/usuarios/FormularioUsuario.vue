<script setup lang="ts">
// Formulário de cadastro/edição de usuário. Não chama a API: só emite "salvar" com o JSON pronto.
// O campo "Curso" só aparece para o perfil Aluno. Na edição, senha vazia = manter a atual.
import { ref, computed, watch } from 'vue'
import Icone from '@/components/ui/Icone.vue'
import { CHAVES_PERFIS, CURSOS_ESPECIFICOS, PERFIS, TAMANHO_MINIMO_SENHA } from '@/config'
import { paraEnvio, paraFormulario, problemaNoFormulario, usuarioVazio } from '@/regras/formularioUsuario'
import type { Usuario, UsuarioEntrada, UsuarioFormulario } from '@/types'

const props = withDefaults(defineProps<{
  /** null = novo usuário; objeto = editar */
  usuario?: Usuario | null
  salvando?: boolean
  /** editando a si mesmo: o perfil fica travado em admin (a API também bloqueia) */
  euMesmo?: boolean
}>(), { usuario: null, salvando: false, euMesmo: false })

const emit = defineEmits<{
  salvar: [dados: UsuarioEntrada]
  cancelar: []
}>()

const dados = ref<UsuarioFormulario>(usuarioVazio())
const tentouEnviar = ref(false)

watch(() => props.usuario, (u) => {
  dados.value = u ? paraFormulario(u) : usuarioVazio()
  tentouEnviar.value = false
}, { immediate: true })

const editando = computed(() => props.usuario !== null)
const problema = computed(() => problemaNoFormulario(dados.value, editando.value))

function enviar(): void {
  tentouEnviar.value = true
  if (problema.value) return
  emit('salvar', paraEnvio(dados.value))
}

function limpar(): void {
  dados.value = usuarioVazio()
  tentouEnviar.value = false
}

defineExpose({ limpar })
</script>

<template>
  <form class="form" novalidate @submit.prevent="enviar">
    <label class="campo">
      <span>Nome</span>
      <input v-model="dados.nome" required maxlength="100" autocomplete="off" />
    </label>

    <label class="campo">
      <span>E-mail</span>
      <input
        v-model="dados.email"
        type="email"
        inputmode="email"
        required
        maxlength="150"
        autocomplete="off"
        autocapitalize="none"
        autocorrect="off"
        spellcheck="false"
      />
    </label>

    <label class="campo">
      <span>Perfil</span>
      <select v-model="dados.perfil" :disabled="euMesmo">
        <option v-for="chave in CHAVES_PERFIS" :key="chave" :value="chave">
          {{ PERFIS[chave].rotulo }} — {{ PERFIS[chave].descricao }}
        </option>
      </select>
      <small v-if="euMesmo">Você não pode tirar o seu próprio perfil de administrador.</small>
    </label>

    <label v-if="dados.perfil === 'aluno'" class="campo">
      <span>Curso do aluno</span>
      <select v-model="dados.curso" required>
        <option value="" disabled>Escolha o curso</option>
        <option v-for="c in CURSOS_ESPECIFICOS" :key="c" :value="c">{{ c }}</option>
      </select>
      <small>O mural do aluno já abre filtrado por este curso.</small>
    </label>

    <label class="campo">
      <span>{{ editando ? 'Nova senha (opcional)' : 'Senha inicial' }}</span>
      <input v-model="dados.senha" type="password" autocomplete="new-password" :minlength="TAMANHO_MINIMO_SENHA" />
      <small>{{ editando ? 'Deixe vazio para manter a senha atual.' : `Pelo menos ${TAMANHO_MINIMO_SENHA} caracteres. O usuário pode trocar depois em "Minha conta".` }}</small>
    </label>

    <p v-if="tentouEnviar && problema" class="mensagem mensagem-erro" role="alert"><Icone nome="alerta" /> {{ problema }}</p>

    <div class="botoes">
      <button class="botao" type="submit" :disabled="salvando">
        <Icone :nome="editando ? 'editar' : 'mais'" :tamanho="16" />
        {{ salvando ? 'Salvando…' : editando ? 'Salvar alterações' : 'Cadastrar usuário' }}
      </button>
      <button v-if="editando" class="botao botao-secundario" type="button" @click="emit('cancelar')">Cancelar</button>
    </div>
  </form>
</template>

<style scoped>
.form { display: grid; gap: 14px; }
.form .mensagem { margin: 0; }
.botoes { display: flex; flex-wrap: wrap; gap: 10px; }
</style>
