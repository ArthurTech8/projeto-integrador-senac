<script setup lang="ts">
// Barra azul do topo. Os links do menu saem das rotas que têm meta.menu (router/rotas.ts)
// e só aparecem para quem tem acesso a elas (meta.requer). Uma tela nova entra no menu sem mexer aqui.
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Icone from '@/components/ui/Icone.vue'
import { INSTITUICAO, PERFIS } from '@/config'
import { useSessao } from '@/composables/useSessao'
import { permite } from '@/regras/acesso'

interface LinkMenu {
  para: string
  texto: string
  ordem: number
}

const rota = useRoute()
const router = useRouter()
const { usuario, logado, sair } = useSessao()
const menuAberto = ref(false)

const links = computed<LinkMenu[]>(() =>
  router.getRoutes()
    .filter((r) => permite(r.meta.requer, usuario.value))
    .flatMap((r) => (r.meta.menu ? [{ para: r.path, ...r.meta.menu }] : []))
    .sort((a, b) => a.ordem - b.ordem))

// Primeiro nome, para caber no cabeçalho
const primeiroNome = computed(() => usuario.value?.nome.split(' ')[0] ?? '')

// "/avisos" fica ativo também em "/avisos/3"
function ativo(caminho: string): boolean {
  return caminho === '/' ? rota.path === '/' : rota.path === caminho || rota.path.startsWith(`${caminho}/`)
}

async function sairDoSistema(): Promise<void> {
  await sair()
  // se estava numa tela protegida, volta ao início
  if (rota.meta.requer) await router.push('/')
}

// Fecha o menu do celular ao trocar de página
watch(() => rota.fullPath, () => { menuAberto.value = false })
</script>

<template>
  <header class="cabecalho">
    <div class="container barra">
      <RouterLink to="/" class="marca" :aria-label="`${INSTITUICAO.nomeSite} · ${INSTITUICAO.nome}, página inicial`">
        <!-- width/height reservam o espaço da imagem antes de ela carregar (evita a página "pular") -->
        <img
          class="marca-logo"
          :src="INSTITUICAO.logo.fundoEscuro"
          :alt="INSTITUICAO.logo.descricao"
          width="250"
          height="78"
        />
        <span class="marca-separador" aria-hidden="true"></span>
        <strong class="marca-texto">{{ INSTITUICAO.nomeSite }}</strong>
      </RouterLink>

      <button
        type="button"
        class="botao-menu"
        :aria-expanded="menuAberto"
        aria-controls="menu-principal"
        @click="menuAberto = !menuAberto"
      >
        <Icone :nome="menuAberto ? 'fechar' : 'menu'" :tamanho="22" />
        <span class="visualmente-oculto">Menu</span>
      </button>

      <nav id="menu-principal" class="menu" :class="{ aberto: menuAberto }" aria-label="Principal">
        <RouterLink
          v-for="link in links"
          :key="link.para"
          :to="link.para"
          :class="{ ativo: ativo(link.para) }"
          :aria-current="ativo(link.para) ? 'page' : undefined"
        >{{ link.texto }}</RouterLink>

        <!-- área do usuário -->
        <div v-if="logado && usuario" class="usuario">
          <RouterLink
            :to="{ name: 'conta' }"
            class="usuario-nome"
            :class="{ ativo: ativo('/conta') }"
            :title="`${usuario.nome} · ${PERFIS[usuario.perfil].rotulo}`"
          >
            <Icone nome="pessoas" :tamanho="16" /> <span class="nome-curto">{{ primeiroNome }}</span>
          </RouterLink>
          <button type="button" class="sair" @click="sairDoSistema">Sair</button>
        </div>
        <RouterLink v-else :to="{ name: 'entrar' }" class="entrar">Entrar</RouterLink>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.cabecalho {
  position: sticky; top: 0; z-index: 50;
  padding-top: env(safe-area-inset-top, 0px); /* celular com "notch": o azul vai até a borda, o conteúdo não */
  background: var(--primaria); color: #fff;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.06) inset, 0 4px 16px -6px rgba(12, 31, 74, 0.45);
}
.barra { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: var(--altura-cabecalho); }

.marca { display: flex; align-items: center; gap: 12px; min-width: 0; color: #fff; text-decoration: none; }
/* logo oficial: só a altura muda, a largura acompanha (nunca distorcer a marca) */
.marca-logo { height: 52px; width: auto; flex-shrink: 0; }
.marca-separador { width: 1px; height: 36px; background: rgba(255, 255, 255, 0.3); flex-shrink: 0; }
.marca-texto { font-size: 1.05rem; letter-spacing: -0.01em; white-space: nowrap; }

@media (max-width: 420px) {
  .marca { gap: 8px; }
  .marca-logo { height: 42px; }
  .marca-separador { height: 28px; }
  .marca-texto { font-size: 0.95rem; }
}

.menu { display: flex; align-items: center; gap: 4px; }
.menu a, .sair {
  display: inline-flex; align-items: center; min-height: 40px;
  padding: 0 12px; border-radius: var(--raio-pequeno);
  color: #dbe4f7; text-decoration: none; font-weight: 600; font-size: 0.95rem; white-space: nowrap;
  transition: background-color var(--duracao-curta) ease, color var(--duracao-curta) ease;
}
.menu a:active, .sair:active { background: rgba(255, 255, 255, 0.14); color: #fff; }
.menu a.ativo { background: rgba(255, 255, 255, 0.14); color: #fff; box-shadow: inset 0 -3px 0 var(--destaque); }

/* "Entrar" se destaca dos links do menu */
.menu a.entrar { margin-left: 8px; background: var(--destaque); color: var(--primaria-escura); }
.menu a.entrar:active { background: var(--destaque-claro); }

.usuario {
  display: flex; align-items: center; gap: 2px; min-width: 0;
  margin-left: 8px; padding-left: 8px; border-left: 1px solid rgba(255, 255, 255, 0.22);
}
.menu a.usuario-nome { gap: 6px; color: #fff; }
/* nome muito comprido não empurra o "Sair" para fora */
.nome-curto { max-width: 14ch; overflow: hidden; text-overflow: ellipsis; }
.sair { border: 0; background: transparent; cursor: pointer; }

.botao-menu {
  display: none; place-items: center; width: 44px; height: 44px; padding: 0; border: 0; border-radius: var(--raio-medio);
  background: transparent; color: #fff; cursor: pointer;
  transition: background-color var(--duracao-curta) ease, transform var(--duracao-toque) var(--suave-saida);
}
.botao-menu:active { background: rgba(255, 255, 255, 0.14); transform: scale(0.94); }

@media (hover: hover) and (pointer: fine) {
  .menu a:hover, .sair:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }
  .menu a.ativo:hover { background: rgba(255, 255, 255, 0.14); }
  .menu a.entrar:hover { background: var(--destaque-claro); color: var(--primaria-escura); }
  .botao-menu:hover { background: rgba(255, 255, 255, 0.1); }
}

/* com até 5 links + usuário, o menu vira "sanduíche" já em telas médias */
@media (max-width: 960px) {
  .botao-menu { display: grid; }
  .menu {
    display: none;
    position: absolute; left: 0; right: 0; top: 100%;
    flex-direction: column; align-items: stretch; gap: 2px;
    padding: 8px max(16px, env(safe-area-inset-right, 0px)) 16px max(16px, env(safe-area-inset-left, 0px));
    max-height: calc(100dvh - var(--altura-cabecalho)); overflow-y: auto; overscroll-behavior: contain;
    background: var(--primaria);
    box-shadow: 0 16px 24px -12px rgba(0, 0, 0, 0.35);
  }
  /* abre descendo de leve a partir do cabeçalho; fecha na hora (sair é sempre mais rápido que entrar) */
  .menu.aberto {
    display: flex;
    transform-origin: top center;
    transition: opacity var(--duracao-media) var(--suave-saida), transform var(--duracao-media) var(--suave-saida);
  }
  .menu a, .sair { min-height: 48px; padding: 0 14px; text-align: left; }
  .menu a.entrar { justify-content: center; margin: 8px 0 0; }
  .usuario {
    flex-direction: column; align-items: stretch;
    margin: 8px 0 0; padding: 8px 0 0; border-left: 0; border-top: 1px solid rgba(255, 255, 255, 0.22);
  }
  .nome-curto { max-width: none; }
}
@starting-style {
  .menu.aberto { opacity: 0; transform: translateY(-6px); }
}
</style>
