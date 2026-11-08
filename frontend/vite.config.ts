import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    // "@/..." aponta para a pasta src
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  }
})
