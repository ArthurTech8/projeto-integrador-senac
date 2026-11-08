<script setup lang="ts">
// Linha de selos de um aviso: categoria + Urgente/Novo + Encerrado
import { computed } from 'vue'
import Icone from '@/components/ui/Icone.vue'
import SeloCategoria from './SeloCategoria.vue'
import { ehNovo, encerrado } from '@/regras/avisos'
import type { Aviso } from '@/types'

const props = withDefaults(defineProps<{
  aviso: Aviso
  /** como mostrar a categoria */
  categoria?: 'curto' | 'completo' | 'nenhum'
}>(), { categoria: 'curto' })

const fechado = computed(() => encerrado(props.aviso))
</script>

<template>
  <div class="selos-aviso">
    <SeloCategoria v-if="categoria !== 'nenhum'" :categoria="aviso.categoria" :completo="categoria === 'completo'" />
    <span v-if="aviso.urgente && !fechado" class="selo selo-urgente"><Icone nome="alerta" :tamanho="12" /> Urgente</span>
    <span v-else-if="ehNovo(aviso) && !fechado" class="selo selo-novo">Novo</span>
    <span v-if="fechado" class="selo selo-encerrado">Encerrado</span>
  </div>
</template>

<style scoped>
.selos-aviso { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
</style>
