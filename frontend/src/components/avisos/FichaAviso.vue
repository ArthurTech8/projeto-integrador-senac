<script setup lang="ts">
// Ficha técnica do aviso (data, local, empresa, carga horária, vagas…)
import { computed } from 'vue'
import Icone from '@/components/ui/Icone.vue'
import { fichaDoAviso } from '@/regras/avisos'
import type { Aviso } from '@/types'

const props = defineProps<{ aviso: Aviso }>()

const itens = computed(() => fichaDoAviso(props.aviso))
</script>

<template>
  <dl class="ficha">
    <div v-for="item in itens" :key="item.rotulo">
      <dt><Icone :nome="item.icone" :tamanho="16" /> {{ item.rotulo }}</dt>
      <dd>{{ item.valor }}</dd>
    </div>
  </dl>
</template>

<style scoped>
.ficha {
  display: grid; gap: 1px; margin: 0;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr));
  background: var(--borda); border: 1px solid var(--borda); border-radius: var(--raio-medio); overflow: hidden;
}
.ficha div { padding: 12px 14px; background: var(--superficie-suave); min-width: 0; }
dt {
  display: flex; align-items: center; gap: 6px;
  font-size: 0.78rem; font-weight: 700; color: var(--texto-suave); text-transform: uppercase; letter-spacing: 0.03em;
}
dd { margin: 4px 0 0; font-weight: 600; color: var(--texto-forte); overflow-wrap: anywhere; }
</style>
