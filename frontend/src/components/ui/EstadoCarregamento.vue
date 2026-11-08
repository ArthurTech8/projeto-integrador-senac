<script setup lang="ts">
// Envolve um conteúdo que depende da API:
// mostra "Carregando…", ou o erro com botão de tentar de novo, ou o conteúdo (slot).
import Icone from './Icone.vue'

withDefaults(defineProps<{
  carregando?: boolean
  erro?: string
  textoCarregando?: string
  podeTentarDeNovo?: boolean
}>(), {
  carregando: false,
  erro: '',
  textoCarregando: 'Carregando…',
  podeTentarDeNovo: true
})

defineEmits<{ 'tentar-de-novo': [] }>()
</script>

<template>
  <p v-if="carregando" class="carregando" role="status">{{ textoCarregando }}</p>

  <div v-else-if="erro" class="mensagem mensagem-erro" role="alert">
    <Icone nome="alerta" />
    <span>{{ erro }}</span>
    <button
      v-if="podeTentarDeNovo"
      class="botao botao-pequeno botao-secundario"
      type="button"
      @click="$emit('tentar-de-novo')"
    >Tentar de novo</button>
  </div>

  <slot v-else />
</template>
