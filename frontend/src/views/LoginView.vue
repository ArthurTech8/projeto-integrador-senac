<script setup lang="ts">
// Tela de login (layout "vazio": sem cabeçalho nem rodapé).
// Depois de entrar, volta para a página que a pessoa tentou abrir (?voltar=...) ou vai para
// a tela inicial do perfil: equipe → Gerenciar, aluno → Avisos (já filtrado pelo curso).
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Icone from '@/components/ui/Icone.vue'
import { INSTITUICAO } from '@/config'
import { useSessao } from '@/composables/useSessao'
import { caminhoSeguro, destinoAposLogin } from '@/regras/acesso'
import type { DadosLogin } from '@/types'

const rota = useRoute()
const router = useRouter()
const { entrar } = useSessao()

const dados = ref<DadosLogin>({ email: '', senha: '' })
const mostrarSenha = ref(false)
const enviando = ref(false)
const erro = ref('')

const podeEnviar = computed(() => dados.value.email.trim() !== '' && dados.value.senha !== '' && !enviando.value)
// veio redirecionado de uma tela protegida?
const pediuPagina = computed(() => caminhoSeguro(rota.query.voltar) !== null)

async function enviar(): Promise<void> {
  erro.value = ''
  enviando.value = true
  try {
    const usuario = await entrar({ email: dados.value.email.trim(), senha: dados.value.senha })
    await router.replace(caminhoSeguro(rota.query.voltar) ?? destinoAposLogin(usuario))
  } catch (e) {
    // a API manda "E-mail ou senha incorretos." (401) ou "Muitas tentativas…" (429)
    erro.value = e instanceof Error ? e.message : 'Não foi possível entrar.'
    dados.value.senha = ''
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <div class="tela">
    <!-- lado da marca (some no celular) -->
    <section class="marca" aria-hidden="true">
      <img :src="INSTITUICAO.logo.fundoEscuro" :alt="INSTITUICAO.logo.descricao" width="250" height="78" class="marca-logo" />
      <h2>{{ INSTITUICAO.nomeSite }}</h2>
      <p>Equipe: publique e gerencie os avisos. Alunos: vejam o mural já filtrado pelo seu curso.</p>
    </section>

    <!-- formulário -->
    <section class="lado-form" aria-labelledby="t-entrar">
      <img :src="INSTITUICAO.logo.fundoClaro" :alt="INSTITUICAO.logo.descricao" width="482" height="119" class="logo-celular" />

      <h1 id="t-entrar">Entrar</h1>
      <p class="subtitulo">Use seu e-mail e senha de acesso.</p>
      <p v-if="pediuPagina" class="mensagem aviso-login" role="status">
        <Icone nome="alerta" /> Entre para acessar a página que você abriu.
      </p>

      <form class="form" novalidate @submit.prevent="enviar">
        <label class="campo">
          <span>E-mail</span>
          <!-- no celular: teclado de e-mail, sem letra maiúscula automática e sem corretor -->
          <input
            v-model="dados.email"
            type="email"
            inputmode="email"
            autocomplete="username"
            autocapitalize="none"
            autocorrect="off"
            spellcheck="false"
            enterkeyhint="next"
            required
            placeholder="nome@senacrs.com.br"
          />
        </label>

        <label class="campo">
          <span>Senha</span>
          <span class="senha">
            <input
              v-model="dados.senha"
              :type="mostrarSenha ? 'text' : 'password'"
              autocomplete="current-password"
              enterkeyhint="go"
              required
            />
            <button
              type="button"
              class="ver-senha"
              :aria-pressed="mostrarSenha"
              @click="mostrarSenha = !mostrarSenha"
            >{{ mostrarSenha ? 'Ocultar' : 'Mostrar' }}</button>
          </span>
        </label>

        <p v-if="erro" class="mensagem mensagem-erro" role="alert"><Icone nome="alerta" /> {{ erro }}</p>

        <button type="submit" class="botao entrar" :disabled="!podeEnviar">
          {{ enviando ? 'Entrando…' : 'Entrar' }}
        </button>
      </form>

      <p class="ajuda">Esqueceu a senha? Fale com a secretaria: o administrador pode cadastrar uma nova.</p>
      <RouterLink to="/" class="voltar"><Icone nome="voltar" :tamanho="16" /> Voltar para o mural</RouterLink>
    </section>
  </div>
</template>

<style scoped>
.tela { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); min-height: 100vh; min-height: 100dvh; }

.marca {
  display: flex; flex-direction: column; justify-content: center; gap: 16px;
  padding: 48px clamp(32px, 6vw, 96px);
  background:
    radial-gradient(circle at 80% 15%, rgba(242, 183, 5, 0.22), transparent 45%),
    linear-gradient(160deg, var(--primaria) 0%, var(--primaria-escura) 100%);
  color: #d3dcf0;
}
/* logo oficial: só a altura muda. align-self impede a coluna flex de esticar a imagem na largura
   (com height fixa, esticar a largura distorcia a marca). max-width: nunca passa da coluna. */
.marca-logo { align-self: flex-start; height: 72px; width: auto; max-width: 100%; object-fit: contain; }
.marca h2 { margin: 16px 0 0; color: #fff; font-size: clamp(1.8rem, 3vw, 2.4rem); letter-spacing: -0.025em; }
.marca p { margin: 0; max-width: 420px; font-size: 1.05rem; }

.lado-form {
  display: flex; flex-direction: column; justify-content: center;
  width: 100%; max-width: 440px; margin: 0 auto;
  padding: max(48px, env(safe-area-inset-top, 0px)) 24px max(48px, env(safe-area-inset-bottom, 0px));
}
.logo-celular { display: none; align-self: flex-start; height: 48px; width: auto; max-width: 100%; object-fit: contain; margin-bottom: 24px; }
h1 { margin: 0 0 6px; font-size: 1.8rem; letter-spacing: -0.02em; }
.subtitulo { margin: 0 0 20px; color: var(--texto-suave); }
.aviso-login { margin: 0 0 16px; background: var(--primaria-clara); border-color: #c9d6f3; color: var(--primaria); font-size: 0.9rem; }

.form { display: grid; gap: 16px; }
.senha { position: relative; display: block; }
.senha input { padding-right: 96px; }
.ver-senha {
  position: absolute; right: 4px; top: 50%; translate: 0 -50%;
  min-height: 36px; padding: 0 12px; border: 0; border-radius: var(--raio-pequeno);
  background: var(--primaria-clara); color: var(--primaria);
  font: inherit; font-size: 0.82rem; font-weight: 600; cursor: pointer;
  transition: background-color var(--duracao-curta) ease, transform var(--duracao-toque) var(--suave-saida);
}
/* translate (posição) e transform (aperto) são propriedades separadas: o aperto não desalinha o botão */
.ver-senha:active { transform: scale(0.95); background: #d7e1f7; }
.form .mensagem { margin: 0; font-size: 0.9rem; }
.entrar { width: 100%; min-height: 48px; }

.ajuda { margin: 20px 0 0; color: var(--texto-suave); font-size: 0.85rem; }
.voltar {
  display: inline-flex; align-items: center; gap: 6px; min-height: 40px; margin-top: 8px;
  font-weight: 600; font-size: 0.92rem; text-decoration: none;
}
@media (hover: hover) and (pointer: fine) {
  .ver-senha:hover { background: #d7e1f7; }
  .voltar:hover { text-decoration: underline; text-underline-offset: 3px; }
}

/* celular: some o lado azul e aparece o logo colorido em cima do formulário */
@media (max-width: 820px) {
  .tela { grid-template-columns: 1fr; }
  .marca { display: none; }
  .logo-celular { display: block; }
}
</style>
