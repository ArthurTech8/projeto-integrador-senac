<script setup lang="ts">
// Pílula com o nome do perfil (Administrador, Editor, Aluno)
import { PERFIS } from '@/config'
import type { Perfil } from '@/types'

defineProps<{ perfil: Perfil }>()
</script>

<template>
  <span class="selo-perfil" :data-perfil="perfil" :title="PERFIS[perfil].descricao">{{ PERFIS[perfil].rotulo }}</span>
</template>

<style scoped>
.selo-perfil {
  display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 999px;
  font-size: 0.78rem; font-weight: 700; white-space: nowrap;
}
.selo-perfil[data-perfil='admin'] { background: var(--primaria); color: #fff; }
.selo-perfil[data-perfil='editor'] { background: var(--primaria-clara); color: var(--primaria); }
.selo-perfil[data-perfil='aluno'] { background: #fff3cd; color: #7a5600; }
</style>
