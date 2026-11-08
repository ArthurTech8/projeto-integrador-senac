// Configuração dos testes automatizados (Vitest). Reaproveita o vite.config.ts (plugin do Vue e alias "@").
// Rodar: npm test   (ou, sem Node instalado: docker compose -f compose.testes.yaml run --rm testes-web)
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

// Fuso fixo: as regras de data ("Hoje", "Em 5 dias") dão o mesmo resultado em qualquer máquina
process.env.TZ = 'America/Sao_Paulo'

export default mergeConfig(viteConfig, defineConfig({
  test: {
    // navegador simulado (window, document) para composables, router e componentes
    environment: 'happy-dom',
    include: ['testes/**/*.test.ts'],
    // cada teste começa com os mocks e o relógio limpos
    restoreMocks: true,
    unstubGlobals: true
  }
}))
