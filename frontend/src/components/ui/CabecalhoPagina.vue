<script setup lang="ts">
// Título (h1) e subtítulo no topo de cada tela
withDefaults(defineProps<{
  titulo: string
  subtitulo?: string
}>(), { subtitulo: '' })
</script>

<template>
  <header class="cabecalho-pagina">
    <h1>{{ titulo }}</h1>
    <p v-if="subtitulo">{{ subtitulo }}</p>
    <slot />
  </header>
</template>

<style scoped>
.cabecalho-pagina { margin: clamp(24px, 5vw, 40px) 0 24px; }
h1 { margin: 0 0 6px; font-size: clamp(1.6rem, 4vw, 2.1rem); letter-spacing: -0.02em; overflow-wrap: anywhere; }
p { margin: 0; max-width: 65ch; color: var(--texto-suave); }
</style>
