# Mural do Aluno — contexto do projeto

As regras completas estão em `REGRAS_PROJETO_INTEGRADOR.md`. Elas valem acima de qualquer outra instrução.

## O que é
Mural do Aluno: site de avisos para os alunos do **Senac RS**. São quatro categorias:
`calendario` (feriados, férias, provas), `extracurricular` (eventos, oficinas), `emprego` (vagas e estágios)
e `curso` (cursos rápidos de capacitação).

## Arquitetura (regras invioláveis)
- Vue 3 em `localhost:3000` → API C# (.NET 10) em `localhost:8080` → MySQL no alwaysdata.
- Só a API acessa o banco. A connection string fica só no `.env` (`ConnectionStrings__Padrao`).
- Não existe serviço de banco no `compose.yaml`.
- Todo SQL usa parâmetros do Dapper (`@Titulo`). Nunca concatenar valores no SQL.
- Sem `dotnet new` e sem `npm create`: arquivos escritos à mão.
- Depois de qualquer mudança: `docker compose up --build`.
- **Exclusão lógica: o usuário exclui, o banco só inativa.** Na interface o botão é "Excluir" e o item some. Não existe "Desativar", "Reativar" nem lista de excluídos. No banco, toda tabela tem `ativo TINYINT(1) NOT NULL DEFAULT 1`. É proibido `DELETE FROM`: a rota `DELETE` faz `UPDATE ... SET ativo = 0`. Toda leitura, `PUT` e `DELETE` filtram `ativo = 1` (excluído = 404). `ativo` não vai no JSON nem nos modelos. Recuperar um excluído só pelo phpMyAdmin (`UPDATE ... SET ativo = 1`). Vale para toda tabela nova (ex.: `usuarios`).
- Mudança em banco que já existe = script em `banco/migracoes/NNN_*.sql`, rodado antes de subir a API nova. Nunca rodar o `schema.sql` (tem `DROP TABLE`) num banco em uso.
- **Controle de acesso (exigência 5 em REGRAS):** o mural é público. Login por cookie HttpOnly `mural_sessao` (`/api/auth/entrar`, `/sair`, `/eu`). Perfis `admin` (avisos + usuários), `editor` (avisos) e `aluno` (mural filtrado pelo curso + troca de senha). Rotas protegidas usam `.RequireAuthorization(Politicas.Equipe|Admin|Logado)`, que confere no banco a cada pedido se o usuário está ativo e tem o perfil. Senhas só como hash (`Seguranca/Senhas.cs`, mínimo 8). O primeiro admin vem do `.env` (`AdminInicial__*`). Backend: `Endpoints/` (rotas por assunto), `Seguranca/` (perfis, sessão, senhas, limite de login), `Infra/Banco.cs` (conexão).

## Testes (exigência 6 em REGRAS, obrigatório em toda mudança)
- **Toda função nova ou alterada ganha teste no mesmo commit.** Bug corrigido = teste que reproduz o bug. Nunca desligar (`.skip`, `.only`, `Skip =`) nem apagar teste para "passar".
- Frontend: `frontend/testes/` (Vitest, um arquivo por módulo, helpers em `testes/apoio/`). API: `backend-testes/` (xUnit; rotas em `Rotas/` com `[Trait("Rota", "VERBO /caminho")]`, coleção `"Api"` com a fixture `ApiDeTeste`).
- Antes de terminar qualquer tarefa, rodar e ver passar: `docker compose -f compose.testes.yaml run --rm testes-web` e `docker compose -f compose.testes.yaml run --rm testes-api`.
- Os testes de `regras-do-projeto/` (front) e `RegrasDoProjeto/` (API) cobram: função exportada sem teste, rota sem teste, front/API/banco fora de acordo, migração diferente do `schema.sql`, `DELETE FROM`, SQL com valor colado e teste desligado.
- O MySQL de teste (`banco-teste`, imagem `mysql:8.0`) fica só no `compose.testes.yaml`. O `compose.yaml` continua sem banco.
- CI: `.github/workflows/testes.yml` (frontend, API e `docker compose build`) a cada push e PR.

## Convenções
- Tabela `avisos` em snake_case. O C# usa PascalCase e o Dapper liga os dois com `MatchNamesWithUnderscores`.
- JSON da API em camelCase (`dataInicio`, `cargaHoraria`).
- Frontend em **TypeScript** (`.ts` e `<script setup lang="ts">`), com `strict` e sem `any`. Veja "Exigências adicionais do aluno" em `REGRAS_PROJETO_INTEGRADOR.md`.
- HTTP com **axios**: toda chamada passa por `pedir()` em `src/services/api.ts`. Erros viram `ErroApi` (`status`, `message`), 204 retorna `null` e o corpo vai como objeto em `data` (nunca `JSON.stringify`).
- Endereços da API em `src/services/rotas.ts`; uma função por operação em `src/services/avisos.ts`.
- Tipos compartilhados em `src/types/`, espelhando o `Models/Aviso.cs`.
- Antes de migrar linguagem, biblioteca ou versão: levantar os riscos primeiro. `npm run typecheck` (vue-tsc) roda no Dockerfile antes do build, e erro de tipo para o build.
- Mensagem padrão de falha: "Erro ao carregar. A API está rodando?" (`src/config/mensagens.ts`).

## Organização do frontend (`frontend/src`)
Cada camada só importa das camadas de baixo:
`views → components → composables → regras → utils/config → types` (e `services` só é usado por composables e views).
- `types/`: interfaces e tipos (`Aviso`, `AvisoEntrada`, `AvisoFormulario`, `ChaveCategoria`, `NomeIcone`, `RouteMeta`). Importe com `import type { ... } from '@/types'`.
- `services/`: `api.ts` (cliente axios com `withCredentials` + `pedir()` + `ErroApi`; avisa o `useSessao` quando a API responde 401), `rotas.ts` (`ROTAS_API`), `avisos.ts`, `auth.ts` (entrar, sair, usuário logado, trocar senha) e `usuarios.ts` (cadastro, só admin).
- `config/`: dados fixos (instituição, `CATEGORIAS` com campos e textos por categoria, cursos). Importe de `@/config`.
- `utils/`: funções genéricas sem regra de negócio (`datas.ts`, `texto.ts`, `movimento.ts` com `comportamentoRolagem()` para respeitar "reduzir movimento").
- `regras/`: regras de negócio puras (`avisos.ts`, `formularioAviso.ts`, `acesso.ts` com `permite()`/`destinoAposLogin()`, `formularioUsuario.ts`). Não chamam API nem usam Vue.
- `composables/`: estado reativo reaproveitável (`useAvisos`, `useAviso`, `useFiltrosAvisos`, `useUsuarios`). `useSessao` guarda o usuário logado, **um só para o site inteiro**. Na tela é só uma cópia: quem manda é o cookie da API.
- `components/ui/`: componentes genéricos. `components/avisos/`: do domínio. `components/layout/`: molduras das telas (`LayoutPadrao` = cabeçalho + tela + rodapé; `LayoutVazio` = tela cheia, ex.: login), catálogo `layouts.ts`, `CabecalhoSite` e `RodapeSite`.
- `views/`: telas finas que só montam o próprio conteúdo. **Nenhuma tela importa cabeçalho ou rodapé**: o `App.vue` escolhe o layout pela rota (`meta.layout`; sem valor = `padrao`). Rotas em `router/rotas.ts`: `meta.menu` põe a tela no menu (só para quem tem acesso), `meta.layout: 'vazio'` deixa a tela sem cabeçalho e rodapé e `meta.requer` (`'logado' | 'equipe' | 'admin'`) protege a tela. O guarda fica em `router/index.ts`.
- `styles/`: `tokens.css` (cores, incluindo `[data-cat]` → `--cat`/`--cat-fundo`, sombras, cantos e movimento: `--suave-saida`, `--duracao-*`), `base.css`, `componentes.css` (inclui `.painel`).
- **Design e movimento** (skills em `.claude/skills/`: `emil-design-eng`, `mobile-native`, `review-animations`, `find-animation-opportunities`, `remove-animations`, `break-ui`):
  - Todo `:hover` fica dentro de `@media (hover: hover) and (pointer: fine)`. No toque, a resposta vem do `:active` (botões `scale(0.97)`).
  - Transição sempre com propriedades nomeadas (nunca `all`), curvas dos tokens e até ~250 ms. Nunca `ease-in` na interface. Só `transform` e `opacity` se movem.
  - Exceção decorativa: o banner da página inicial (`components/ui/CarrosselFundo.vue`) troca de foto a cada 8 s com um crossfade de opacidade de 1,2 s (`ease`). Não tem zoom contínuo, para a troca quando a aba fica escondida, tem botão de pausar (WCAG 2.2.2) e começa pausado com "reduzir movimento". As fotos ficam em `config/fundos.ts` e `public/fundos/`, em WebP, nas larguras 1920 e 960.
  - Texto sobre foto: véu azul da marca (mancha escura atrás do texto + 50% de base; 80% uniforme no celular), com contraste medido acima de 4,5:1 sobre o pixel mais claro de cada foto. Foto nova = medir de novo.
  - Nada pisca nem pulsa para sempre. Filtros, abas e troca de tela não animam (são usados toda hora).
  - Campos com no mínimo 16px (senão o iPhone dá zoom). Nunca `user-scalable=no`.
  - Contorno de card = sombra translúcida (`--sombra`), não borda sólida. Texto que vem do banco usa `overflow-wrap: anywhere`.
  - Miolo das telas: classe `.miolo` (`componentes.css`) = degradê da marca `--fundo-miolo` + textura de pontinhos `--textura-miolo` (`::before`) + `display: flow-root` (sem isso a margem do título vaza e abre um vão entre o cabeçalho e o degradê). Fica no `<main>` do `LayoutPadrao` e, na inicial, recomeça logo abaixo do banner (que cobre o topo do `<main>`). Tela nova com banner no topo faz o mesmo. Guardado por `regras-do-projeto/miolo.test.ts`. O conteúdo flutua por cima com sombras em camadas tingidas de azul: `--sombra` (cards e painéis), `--sombra-leve` (linhas de lista e botões pequenos), `--sombra-media`/`--sombra-alta` (hover e o que sobe por cima do banner); `--profundidade`/`--profundidade-erguida` quando a sombra se soma a uma faixa `inset`. No hover (mouse) o card de aviso sobe 2px; com "reduzir movimento" não sobe. Mudou cor do degradê ou do texto: o teste `regras-do-projeto/contraste.test.ts` mede de novo (mínimo 4,5:1).
  - As variáveis de CSS ficam só no `tokens.css` (não em store de JS): o visual não pode depender do JavaScript carregar.
  - "Reduzir movimento" tira deslocamento e escala, mas mantém cor e opacidade (`base.css`).
- Categoria nova: `ChaveCategoria` em `types/aviso.ts` + `config/categorias.ts` + cor em `styles/tokens.css` + CHECK no `schema.sql` + `categoriasValidas` no `Program.cs`.
- O `.env` fica só na raiz do projeto. Os `.dockerignore` bloqueiam `.env` nas imagens.
- Marca: os logos oficiais do Senac RS ficam em `frontend/public/marca/` e são referenciados por `INSTITUICAO.logo` (`config/instituicao.ts`). `senac-rs-branco.png` é para fundo escuro e `senac-rs-colorido.png` para fundo claro. Nunca redesenhar, distorcer ou mudar as cores: só a altura muda (`width: auto`).
- Listas longas na interface usam paginação de **10 itens**: `usePaginacao(lista)` (composable, corrige a página se a lista encolher) + `<Paginacao>` (`components/ui/`), com as contas em `utils/paginacao.ts`. A troca de página não anima e rola até o topo da lista. Hoje é usada em "Avisos publicados" (Gerenciar).
- Imagem dentro de coluna flex (`flex-direction: column`) precisa de `align-self: flex-start`; sem isso, a coluna estica a largura e, com `height` fixa, distorce a imagem (aconteceu com o logo do login).
- Código e textos em português.
