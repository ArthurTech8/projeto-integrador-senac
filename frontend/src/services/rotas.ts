// Endereços da API num lugar só. Espelham as rotas do backend (pasta Endpoints/):
//   GET    /api/avisos              → lista (público)
//   GET    /api/avisos/{id}         → um aviso (público)
//   POST   /api/avisos              → cadastra (equipe)
//   PUT    /api/avisos/{id}         → altera (equipe)
//   DELETE /api/avisos/{id}         → exclui; no banco só muda para ativo = 0 (equipe)
//   POST   /api/auth/entrar         → login (grava o cookie de sessão)
//   POST   /api/auth/sair           → logout
//   GET    /api/auth/eu             → usuário logado, ou 204 se ninguém
//   PUT    /api/conta/senha         → troca a própria senha (logado)
//   GET/POST/PUT/DELETE /api/usuarios[/{id}] → cadastro de usuários (admin)
const id = (valor: number | string) => encodeURIComponent(valor)

export const ROTAS_API = {
  raiz: '/',
  avisos: '/api/avisos',
  aviso: (valor: number | string) => `/api/avisos/${id(valor)}`,
  entrar: '/api/auth/entrar',
  sair: '/api/auth/sair',
  eu: '/api/auth/eu',
  senha: '/api/conta/senha',
  usuarios: '/api/usuarios',
  usuario: (valor: number | string) => `/api/usuarios/${id(valor)}`
} as const
