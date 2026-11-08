import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/index.css'

const app = createApp(App).use(router)

// Espera a primeira rota ser resolvida antes de montar: assim o App já sabe o layout
// certo (ex.: abrir /entrar direto não mostra o cabeçalho por um instante e depois some).
void router.isReady().then(() => app.mount('#app'))
