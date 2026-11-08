<script setup lang="ts">
// "Minha conta": dados do usuário logado e troca da própria senha (qualquer perfil).
import { ref, computed } from 'vue'
import Icone from '@/components/ui/Icone.vue'
import CabecalhoPagina from '@/components/ui/CabecalhoPagina.vue'
import { useSessao } from '@/composables/useSessao'
import { trocarSenha } from '@/services/auth'
import { PERFIS, TAMANHO_MINIMO_SENHA } from '@/config'
import { formatarData } from '@/utils/datas'

const { usuario } = useSessao()

const senhaAtual = ref('')
const novaSenha = ref('')
const confirmacao = ref('')
const salvando = ref(false)
const sucesso = ref('')
const erro = ref('')

// Mensagem de validação antes de mandar para a API (a API valida de novo)
const problema = computed(() => {
  if (novaSenha.value && novaSenha.value.length < TAMANHO_MINIMO_SENHA)
    return `A nova senha precisa ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`
  if (confirmacao.value && confirmacao.value !== novaSenha.value) return 'A confirmação não é igual à nova senha.'
  return ''
})
const podeSalvar = computed(() =>
  senhaAtual.value !== '' && novaSenha.value !== '' && confirmacao.value !== '' && !problema.value && !salvando.value)

async function salvar(): Promise<void> {
  sucesso.value = ''
  erro.value = ''
  salvando.value = true
  try {
    await trocarSenha({ senhaAtual: senhaAtual.value, novaSenha: novaSenha.value })
    sucesso.value = 'Senha alterada. Use a nova senha no próximo login.'
    senhaAtual.value = novaSenha.value = confirmacao.value = ''
  } catch (e) {
    erro.value = e instanceof Error ? e.message : 'Não foi possível trocar a senha.'
  } finally {
    salvando.value = false
  }
}
</script>

<template>
  <div class="container estreito">
    <CabecalhoPagina titulo="Minha conta" subtitulo="Seus dados de acesso ao Mural do Aluno." />

    <div v-if="usuario" class="grade-conta">
      <section class="painel" aria-labelledby="t-dados">
        <h2 id="t-dados">Dados</h2>
        <dl class="dados">
          <div><dt>Nome</dt><dd>{{ usuario.nome }}</dd></div>
          <div><dt>E-mail</dt><dd>{{ usuario.email }}</dd></div>
          <div><dt>Perfil</dt><dd>{{ PERFIS[usuario.perfil].rotulo }} · <small>{{ PERFIS[usuario.perfil].descricao }}</small></dd></div>
          <div v-if="usuario.curso"><dt>Curso</dt><dd>{{ usuario.curso }}</dd></div>
          <div><dt>Cadastro</dt><dd>{{ formatarData(usuario.criadoEm) }}</dd></div>
        </dl>
        <p class="nota">Para mudar nome, e-mail ou curso, fale com um administrador.</p>
      </section>

      <section class="painel" aria-labelledby="t-senha">
        <h2 id="t-senha">Trocar senha</h2>
        <form class="form" @submit.prevent="salvar">
          <label class="campo">
            <span>Senha atual</span>
            <input v-model="senhaAtual" type="password" autocomplete="current-password" required />
          </label>
          <label class="campo">
            <span>Nova senha</span>
            <input v-model="novaSenha" type="password" autocomplete="new-password" required :minlength="TAMANHO_MINIMO_SENHA" />
            <small>Pelo menos {{ TAMANHO_MINIMO_SENHA }} caracteres.</small>
          </label>
          <label class="campo">
            <span>Confirme a nova senha</span>
            <input v-model="confirmacao" type="password" autocomplete="new-password" required />
          </label>

          <p v-if="problema" class="mensagem mensagem-erro" role="alert"><Icone nome="alerta" /> {{ problema }}</p>
          <p v-if="erro" class="mensagem mensagem-erro" role="alert"><Icone nome="alerta" /> {{ erro }}</p>
          <p v-if="sucesso" class="mensagem mensagem-sucesso" role="status">{{ sucesso }}</p>

          <button class="botao" type="submit" :disabled="!podeSalvar">{{ salvando ? 'Salvando…' : 'Trocar senha' }}</button>
        </form>
      </section>
    </div>
  </div>
</template>

<style scoped>
.estreito { max-width: 960px; }
.grade-conta { display: grid; gap: 24px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr)); align-items: start; }
h2 { margin: 0 0 16px; font-size: 1.2rem; }
.dados { display: grid; gap: 12px; margin: 0; }
dt { font-size: 0.78rem; font-weight: 700; color: var(--texto-suave); text-transform: uppercase; letter-spacing: 0.03em; }
dd { margin: 2px 0 0; font-weight: 600; color: var(--texto-forte); overflow-wrap: anywhere; }
dd small { font-weight: 400; color: var(--texto-suave); }
.nota { margin: 16px 0 0; font-size: 0.85rem; color: var(--texto-suave); }
.form { display: grid; gap: 14px; }
.form .mensagem { margin: 0; }
</style>
