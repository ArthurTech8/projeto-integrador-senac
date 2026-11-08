/// <reference types="vite/client" />

// Variáveis de ambiente que o Vue enxerga (só as com prefixo VITE_)
interface ImportMetaEnv {
  /** Endereço da API, vindo do compose.yaml (args.VITE_API_URL) */
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
