<script setup lang="ts">
// Controle de paginação: "Anterior · 1 2 3 … 9 · Próxima" + "Mostrando 1–10 de 18".
// Não aparece quando tudo cabe numa página. Não anima: troca de página é usada toda hora.
//   <Paginacao :pagina="pagina" :total-paginas="totalPaginas" :primeiro :ultimo :total @ir-para="irPara" />
import { computed } from 'vue'
import Icone from './Icone.vue'
import { paginasVisiveis } from '@/utils/paginacao'

const props = withDefaults(defineProps<{
  pagina: number
  totalPaginas: number
  /** para o resumo "Mostrando X–Y de Z" */
  primeiro?: number
  ultimo?: number
  total?: number
  /** o que está sendo paginado, para leitores de tela ("avisos", "usuários") */
  rotulo?: string
}>(), { primeiro: 0, ultimo: 0, total: 0, rotulo: 'itens' })

const emit = defineEmits<{ 'ir-para': [pagina: number] }>()

const numeros = computed(() => paginasVisiveis(props.pagina, props.totalPaginas))

function ir(numero: number): void {
  if (numero !== props.pagina) emit('ir-para', numero)
}
</script>

<template>
  <nav v-if="totalPaginas > 1" class="paginacao" :aria-label="`Páginas de ${rotulo}`">
    <p class="resumo numeros" aria-live="polite">
      Mostrando <strong>{{ primeiro }}–{{ ultimo }}</strong> de <strong>{{ total }}</strong>
    </p>

    <ul class="botoes">
      <li>
        <button type="button" class="pagina seta" :disabled="pagina <= 1" aria-label="Página anterior" @click="ir(pagina - 1)">
          <Icone nome="voltar" :tamanho="16" /> <span class="texto-seta">Anterior</span>
        </button>
      </li>
      <li v-for="(n, i) in numeros" :key="`${n}-${i}`">
        <span v-if="typeof n !== 'number'" class="reticencias" aria-hidden="true">…</span>
        <button
          v-else
          type="button"
          class="pagina numeros"
          :class="{ atual: n === pagina }"
          :aria-current="n === pagina ? 'page' : undefined"
          :aria-label="`Página ${n}`"
          @click="ir(n)"
        >{{ n }}</button>
      </li>
      <li>
        <button type="button" class="pagina seta" :disabled="pagina >= totalPaginas" aria-label="Próxima página" @click="ir(pagina + 1)">
          <span class="texto-seta">Próxima</span> <Icone nome="seta" :tamanho="16" />
        </button>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.paginacao {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px 16px;
  margin-top: 16px;
}
.resumo { margin: 0; color: var(--texto-suave); font-size: 0.88rem; }
.resumo strong { color: var(--texto-forte); }

.botoes { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; margin: 0; padding: 0; list-style: none; }

/* 40px: área de toque confortável no celular */
.pagina {
  display: inline-flex; align-items: center; justify-content: center; gap: 4px;
  min-width: 40px; min-height: 40px; padding: 0 10px;
  border: 0; border-radius: var(--raio-medio);
  background: var(--superficie); color: var(--texto); box-shadow: var(--sombra-leve);
  font: inherit; font-size: 0.92rem; font-weight: 600; cursor: pointer;
  transition: background-color var(--duracao-curta) ease, color var(--duracao-curta) ease, transform var(--duracao-toque) var(--suave-saida);
}
.pagina:active:not(:disabled) { transform: scale(0.97); }
.pagina:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }
.pagina.atual { background: var(--primaria); color: #fff; box-shadow: none; cursor: default; }
.reticencias { display: inline-grid; place-items: center; min-width: 24px; color: var(--texto-suave); }

@media (hover: hover) and (pointer: fine) {
  .pagina:hover:not(:disabled):not(.atual) { background: var(--primaria-clara); color: var(--primaria); }
}

/* celular: setas só com ícone, para os números caberem numa linha */
@media (max-width: 480px) {
  .texto-seta { display: none; }
  .paginacao { justify-content: center; }
}
</style>
