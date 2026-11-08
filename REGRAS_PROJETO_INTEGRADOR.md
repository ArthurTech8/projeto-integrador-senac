# Regras e Estrutura do Projeto Integrador

> **Projeto Final · Guia de Configuração** — "Do zero ao sistema completo: API em C#, frontend em Vue 3 e banco MySQL online no alwaysdata."

**Documento-fonte:** *Projeto Final C# + Vue 3 + alwaysdata* (23 lâminas).
**Stack obrigatória:** **Vue 3** (frontend) · **API em C# / .NET 10** (backend) · **MySQL no alwaysdata** (banco) · **Docker Compose** (execução).

> O Vue pede, a API decide, o banco guarda.

---

## 📋 Regras e Exigências Gerais

### Arquitetura (regras invioláveis)

- O sistema é dividido em **três partes, cada uma com uma função**:
  - **Frontend** — Vue 3, roda no navegador, em `localhost:3000`.
  - **Backend** — API em C# (.NET 10), em `localhost:8080`.
  - **Banco** — MySQL hospedado **online no alwaysdata** (`mysql-<conta>.alwaysdata.net`).
- **Comunicação exclusiva via API:**
  > O frontend só conversa com a API, por HTTP e JSON.
- **Somente a API acessa o banco** e conhece a credencial:
  > Só a API conhece a senha e fala com o banco.
- **O navegador nunca acessa o banco diretamente** (analogia do restaurante: salão = frontend, cozinha = API, despensa = banco).
  > O cliente nunca entra na despensa. Do mesmo jeito, o navegador nunca fala direto com o banco.
- **O banco não roda localmente** e **não há serviço de banco no `compose.yaml`**:
  > O banco não roda no seu PC: ele fica na internet.

### Ambiente e ferramentas

- Ferramentas obrigatórias: **Docker Desktop**, **Git**, **VS Code** e **conta no alwaysdata** (plano gratuito).
- Extensões recomendadas do VS Code: **Vue (Official)**, **REST Client** e **Docker**.
- Verificação da instalação: `docker --version` e `git --version`.
- **Não instalar .NET nem Node.js** localmente:
  > Não precisa instalar .NET nem Node.js. As imagens do Docker trazem o compilador do C# e o Node, e baixam as bibliotecas durante o build.
- **Proibido usar geradores de scaffold**: sem `dotnet new` e sem `npm create`. Todos os arquivos são escritos manualmente; o Docker baixa as dependências no build.

### Versões e dependências fixadas

- **Backend:** `net10.0`, `Nullable` e `ImplicitUsings` habilitados; pacotes **Dapper 2.1.66** e **MySqlConnector 2.6.2**.
- **Frontend:** `vue ^3.5.0`, `vue-router ^5.0.0`, `@vitejs/plugin-vue ^6.0.0`, `vite ^8.0.0`; `"type": "module"`; script `build` = `vite build`.
- **Imagens Docker do frontend:** `node:24-alpine` (build) e `nginx:alpine` (servidor).

### Segurança

- **A senha nunca entra no código.** A connection string fica **apenas no arquivo `.env`**, na raiz do projeto.
- O `.env` é entregue à API **pelo Docker** (`env_file: .env` no `compose.yaml`).
- Chave obrigatória: `ConnectionStrings__Padrao` — os **dois sublinhados (`__`) viram `:`**, e o .NET lê `ConnectionStrings:Padrao`.
- O valor da connection string ocupa **uma única linha** no `.env`.
- **`.env` nunca vai para o Git**; um **`.env.example`** (sem senha, com valores de exemplo) **deve** ser versionado.
  > O .env.example vai para o Git; o .env, nunca.
- `.gitignore` mínimo obrigatório: `.env`, `bin/`, `obj/`, `node_modules/`, `dist/`.
- **Todo acesso ao banco deve usar parâmetros** (`@Nome`, `@Preco`) via Dapper — **nada de SQL Injection** (proibida concatenação de valores no SQL).
- A API deve **falhar de forma explícita** se a connection string não existir (`InvalidOperationException` com mensagem clara).
- **CORS** restrito à origem do frontend: `WithOrigins("http://localhost:3000")` + `app.UseCors()`.
- **Sem senha em prints** ou slides da apresentação.

### Metodologia de desenvolvimento

- Desenvolvimento **incremental em oito etapas**, com **teste obrigatório ao fim de cada uma**:
  > Oito etapas, sempre testando no fim de cada uma.
- **A API deve ser testada antes de qualquer tela** (arquivo `.http` + verificação no phpMyAdmin), isolando falhas de frontend das de backend/banco.
- Após **qualquer alteração de código**, reconstruir com `docker compose up --build` (sem `--build` a mudança não aparece).
- `VITE_API_URL` deve ser **`http://localhost:8080`** (e não `api:8080`), pois **quem chama a API é o navegador**, fora da rede do Docker.
- O Vue **só enxerga variáveis com prefixo `VITE_`**.

### Prazos

- O documento-fonte **não define datas de entrega**. Os marcos são as **oito etapas** (ver cronograma) e a entrega final ocorre na **Etapa 8**, condicionada ao checklist abaixo.

### Critérios de avaliação / Checklist de entrega (Etapa 8)

- [ ] **`.env` fora do Git** — conferir com `git status`: ele **não pode aparecer**.
- [ ] **`.env.example` presente**, com valores de exemplo.
- [ ] **`banco/schema.sql` recria todas as tabelas.**
- [ ] **`README.md` explica como rodar**, passo a passo.
- [ ] **Todas as rotas testadas** no arquivo `.http`.
- [ ] **`docker compose up --build` funciona numa pasta recém-clonada.**
- [ ] **Sem senha no código** nem em prints da apresentação.
- [ ] **O aluno sabe explicar cada arquivo para a banca.**

---

## ➕ Exigências adicionais do aluno (definidas em 07/11/2026)

> Estas regras foram pedidas pelo aluno e **valem por cima** do documento-fonte nos pontos em que ele cita `.js`. Todo o resto do guia continua valendo.

### 1. Axios para conversar com a API
- O frontend usa **axios** (`axios ^1.12.0`) em vez de `fetch`.
- **Toda chamada continua passando por `pedir()`**, agora em `src/services/api.ts`, que guarda o cliente axios (`baseURL = VITE_API_URL`, `Content-Type: application/json`, timeout de 10 s).
- `pedir()` mantém o contrato do guia:
  - qualquer resposta de erro vira **`ErroApi`**, com `status` e `message`; a mensagem vem do `{ "erro": "..." }` da API quando existir;
  - resposta **204 retorna `null`**;
  - o corpo é enviado como **objeto em `data`**. O axios já converte para JSON, então **nunca usar `JSON.stringify`** (o JSON seria convertido duas vezes).
- Os endereços da API ficam todos em `src/services/rotas.ts` (`ROTAS_API`), espelhando as rotas do `Program.cs`. As funções por operação (`listarAvisos`, `buscarAviso`, `criarAviso`, `alterarAviso`, `excluirAviso`) ficam em `src/services/avisos.ts`.
- As rotas do backend (contrato REST) **não mudam**.

### 2. TypeScript no lugar de JavaScript
- Todo o código do frontend que puder ser TypeScript é TypeScript: arquivos `.ts` e componentes com `<script setup lang="ts">`. Isso inclui `main.ts`, `vite.config.ts` e `services/api.ts`, que substituem os `.js` citados no guia.
- Ficam fora só os arquivos que não são código: `index.html`, CSS, `nginx.conf`, `package.json`.
- Dependências de desenvolvimento adicionadas: `typescript ~5.9.0`, `vue-tsc ^3.1.0` e `@types/node ^24.0.0`.
- `tsconfig.json` (código em `src/`) e `tsconfig.node.json` (`vite.config.ts`) usam `strict: true`.
- Os tipos compartilhados ficam em `src/types/` (`Aviso`, `AvisoEntrada`, `AvisoFormulario`, `ChaveCategoria`…) e devem **espelhar o `Models/Aviso.cs`**.
- É **proibido usar `any`**. Para valores desconhecidos, use `unknown` e faça a checagem antes de usar.

### 3. Validar antes de trocar de linguagem ou de biblioteca
- Antes de qualquer migração (de linguagem, de biblioteca ou de versão), **levantar o que pode quebrar** e só então alterar. Exemplos: diferenças de comportamento entre `fetch` e `axios`, operações com `Date` e `boolean`, valores da URL que podem vir como lista.
- O Vite **não verifica tipos** no build. Por isso o `Dockerfile` do frontend roda **`npm run typecheck`** (`vue-tsc`) **antes** de `npm run build`. **Erro de tipo impede o build.**
- O script `build` continua sendo `vite build`, como manda o guia. A verificação fica no script separado `typecheck`.
- Depois de cada mudança: `docker compose up --build` e teste de todas as telas, incluindo os erros (400, 404, API fora do ar).

### 4. Exclusão lógica: o usuário exclui, o banco só inativa (definida em 08/11/2026)
- **Para quem usa o sistema, excluir é excluir.** O botão é **"Excluir"** e o item some de todas as telas. Não existem "Desativar", "Reativar" nem lista de excluídos na interface.
- **No banco, nada é apagado.** Toda tabela com registros que podem ser excluídos tem a coluna `ativo TINYINT(1) NOT NULL DEFAULT 1`: `1` = ativo, `0` = inativo (excluído pelo usuário). Isso vale para `avisos` hoje e para qualquer tabela futura (ex.: `usuarios`).
- **É proibido `DELETE FROM`.** A rota `DELETE` da API executa `UPDATE ... SET ativo = 0 WHERE id = @Id AND ativo = 1` e responde `204`, ou `404` se o registro não existir ou já tiver sido excluído.
- **Toda leitura filtra `ativo = 1`.** Um registro excluído responde `404` em `GET`, `PUT` e `DELETE`, como se não existisse. A API **não** oferece rota para listar ou recuperar excluídos.
- **A coluna `ativo` não aparece no JSON** nem nos modelos (`Models/Aviso.cs`, `types/aviso.ts`). Ela é um detalhe interno do banco.
- **Recuperar um registro excluído** é tarefa do administrador do banco, direto no phpMyAdmin: `UPDATE avisos SET ativo = 1 WHERE id = ...;`
- **Mudança em banco que já existe = migração**, em `banco/migracoes/NNN_descricao.sql`, rodada no phpMyAdmin **antes** de subir a API nova. Nunca rodar o `schema.sql` de novo num banco em uso: ele começa com `DROP TABLE`.

| Verbo | Rota | O que faz | Resposta |
|---|---|---|---|
| `GET` | `/api/avisos` | Lista os não excluídos (`ativo = 1`) | `200` + lista |
| `GET` | `/api/avisos/{id}` | Busca um não excluído | `200`, ou `404` |
| `POST` | `/api/avisos` | Cadastra (nasce com `ativo = 1`) | `201` + o criado |
| `PUT` | `/api/avisos/{id}` | Altera um não excluído | `204`, ou `404` |
| `DELETE` | `/api/avisos/{id}` | Exclui para o usuário; no banco faz `ativo = 0` | `204`, ou `404` |

### 5. Controle de acesso: login e perfis (definido em 08/11/2026)
- **O mural continua público.** Qualquer pessoa vê os avisos sem login. Fazer login é preciso para **publicar, editar e excluir** avisos e para **gerenciar usuários**.
- **Três perfis**, guardados na tabela `usuarios`, coluna `perfil`:
  | Perfil | Pode |
  |---|---|
  | `admin` | Tudo o que o editor pode, **mais** cadastrar, editar e excluir usuários (tela **Usuários**) |
  | `editor` | Publicar, editar e excluir avisos (tela **Gerenciar**) |
  | `aluno` | Ver o mural, que abre **já filtrado pelo curso dele**, e trocar a própria senha |
- **Todo usuário é cadastrado por um admin** na tela Usuários. Não existe autocadastro. O **primeiro admin** é criado pela API a partir do `.env` (`AdminInicial__Email`, `AdminInicial__Senha`, `AdminInicial__Nome`), só quando ainda não existe nenhum admin ativo. A senha nunca vai para script SQL nem para o Git.
- **Qualquer usuário logado** troca a própria senha em **Minha conta** (`PUT /api/conta/senha`), informando a senha atual.
- **Senhas:** mínimo de 8 caracteres e guardadas só como hash (PBKDF2, com o `PasswordHasher` do próprio ASP.NET Core). A API nunca devolve a senha nem o hash.
- **Sessão por cookie** `mural_sessao`: `HttpOnly` (o JavaScript não lê), `SameSite=Lax`, válido por 8 h e renovado com o uso. Nunca guardar token ou senha em `localStorage`.
  - O CORS precisa de `AllowCredentials()` e o axios de `withCredentials: true`.
- **A API é quem protege os dados.** Cada rota protegida usa `.RequireAuthorization(Politicas.X)`, e cada pedido protegido confere **no banco** se o usuário está ativo e tem o perfil necessário. Por isso, excluir um usuário ou mudar o perfil dele vale **na hora**, mesmo com a sessão aberta.
  - Não logado → `401`. Logado sem permissão → `403`.
- **O front só esconde o que não pode ser usado.** Ele usa `meta.requer` nas rotas (`'logado' | 'equipe' | 'admin'`), um guarda no router e o menu filtrado por perfil. Abrir uma URL protegida sem login leva a `/entrar?voltar=...`; sem permissão, leva a `/sem-acesso`.
- **Segurança do login:** a mesma mensagem para e-mail inexistente e senha errada ("E-mail ou senha incorretos."), no máximo **10 tentativas por minuto** (depois `429`), e o redirecionamento depois do login só aceita caminhos internos.
- **Proteções contra se trancar fora:** o admin não pode excluir a própria conta nem tirar o próprio perfil de admin.
- **Usuários seguem a exclusão lógica** (exigência 4): excluir faz `ativo = 0`. O e-mail de um usuário excluído pode ser usado num cadastro novo, porque a unicidade vale só entre os ativos.
- **Sem pacotes novos no backend:** cookies, autorização, hash de senha e limite de tentativas já vêm no ASP.NET Core.
- **Ao reconstruir o container da API, as sessões abertas caem** (as chaves do cookie ficam dentro do container). Basta entrar de novo.

| Verbo | Rota | Quem | O que faz | Resposta |
|---|---|---|---|---|
| `POST` | `/api/auth/entrar` | todos | Login; grava o cookie | `200` + usuário, `401` ou `429` |
| `POST` | `/api/auth/sair` | todos | Logout; apaga o cookie | `204` |
| `GET` | `/api/auth/eu` | todos | Usuário logado | `200` + usuário, ou `204` se ninguém |
| `PUT` | `/api/conta/senha` | logado | Troca a própria senha | `204` ou `400` |
| `GET` | `/api/usuarios` | admin | Lista os usuários | `200` + lista |
| `GET` | `/api/usuarios/{id}` | admin | Busca um usuário | `200` ou `404` |
| `POST` | `/api/usuarios` | admin | Cadastra | `201`, `400` ou `409` (e-mail em uso) |
| `PUT` | `/api/usuarios/{id}` | admin | Altera (senha vazia = mantém a atual) | `204`, `400`, `404` ou `409` |
| `DELETE` | `/api/usuarios/{id}` | admin | Exclui (`ativo = 0`) | `204`, `400` ou `404` |
| `POST`/`PUT`/`DELETE` | `/api/avisos...` | admin, editor | Gravações de avisos | como na exigência 4, mais `401`/`403` |

### 6. Testes automatizados obrigatórios (definido em 08/11/2026)
- **Toda mudança vem com teste, no mesmo commit.** Função nova ou alterada = teste novo ou ajustado. Correção de bug = um teste que reproduz o bug (falha antes da correção e passa depois).
- **Onde ficam:**
  - **Frontend:** `frontend/testes/`, com **Vitest** (`npm test`), um arquivo por módulo de `src/`. Os testes também são TypeScript `strict` sem `any` e entram no `npm run typecheck` (`tsconfig.testes.json`).
  - **API:** `backend-testes/`, com **xUnit**, fora de `backend/` para não entrar na imagem. Os testes de rota sobem a API de verdade ligada a um **MySQL descartável** (`compose.testes.yaml`, serviço `banco-teste`). O banco do alwaysdata **nunca** é usado em teste, e uma trava recusa qualquer servidor que não seja local.
- **Como rodar (sem instalar .NET nem Node):** `docker compose -f compose.testes.yaml run --rm testes-web` e `... run --rm testes-api`. Os dois têm que passar antes de qualquer commit.
- **CI no GitHub:** `.github/workflows/testes.yml` roda os testes do frontend, os da API e o `docker compose build` a cada `push` e pull request. **Só entra na `main` o que estiver verde.**
- **As regras se cobram sozinhas** (testes em `frontend/testes/regras-do-projeto/` e `backend-testes/RegrasDoProjeto/`):
  - toda função exportada de `utils/`, `regras/`, `services/`, `composables/` e `config/` precisa ser importada por algum teste;
  - toda rota da API precisa de pelo menos um teste marcado com `[Trait("Rota", "VERBO /caminho")]`;
  - front, API e banco precisam concordar em categorias, perfis, campos do JSON, rotas e tamanho mínimo de senha;
  - `schema.sql` e as migrações precisam produzir o mesmo banco;
  - é proibido `DELETE FROM`, SQL com valor colado (só parâmetros `@Nome`) e coluna `ativo` nos modelos;
  - é proibido desligar teste (`.skip`, `.only`, `.todo`, `Skip =`). Teste que falha se conserta, não se desliga nem se apaga.
- **Dependências só de teste** (não vão para as imagens): `vitest`, `@vue/test-utils` e `happy-dom` no frontend; `xunit.v3` e `Microsoft.AspNetCore.Mvc.Testing` no `backend-testes/`. O backend continua sem pacotes novos.

---

## 🏗️ Estrutura do Documento/Projeto

### Organização de diretórios obrigatória

> Uma pasta, dois containers.

```text
projeto-final/
├── backend/                  # API C# → container api
│   ├── Models/Produto.cs
│   ├── Program.cs
│   ├── Api.csproj · appsettings.json
│   ├── Api.http
│   └── Dockerfile
├── frontend/                 # Vue 3 → container web
│   ├── src/ (services, views, router)
│   ├── package.json · vite.config.js
│   ├── index.html · nginx.conf
│   └── Dockerfile
├── banco/schema.sql
├── .env                      # senha, fora do Git
├── compose.yaml
├── CLAUDE.md
└── README.md
```

### 1. Raiz do projeto

- Une as partes: **banco, senha, `compose.yaml` e documentação**.
- `.env` — connection string (**não versionado**).
- `.env.example` — modelo sem senha (**versionado**).
- `.gitignore` — `.env`, `bin/`, `obj/`, `node_modules/`, `dist/`.
- `compose.yaml` — **dois serviços** (`api` e `web`), **sem serviço de banco**:
  - `api`: `build: ./backend`, `ports: ["8080:8080"]`, `env_file: .env`.
  - `web`: `build.context: ./frontend`, `args.VITE_API_URL: http://localhost:8080`, `ports: ["3000:80"]`, `depends_on: [api]`.
- `README.md` — instruções de execução passo a passo.
- `CLAUDE.md` — documentação de contexto do projeto.

### 2. `banco/` — Banco de dados (MySQL · alwaysdata)

- Banco criado no painel em **Databases › MySQL** (nome no padrão `<conta>_projeto`).
- Usuário e senha confirmados na aba **Users**, com acesso ao banco.
- `schema.sql` executado no **phpMyAdmin**, aba **SQL**; deve **recriar todas as tabelas**.
- Tabela de referência `produtos`:
  - `id INT AUTO_INCREMENT PRIMARY KEY`
  - `nome VARCHAR(100) NOT NULL`
  - `preco DECIMAL(10,2) NOT NULL`
- Carga inicial: `('Caderno', 19.90)` e `('Caneta', 3.50)`.
- Host, banco, usuário e senha anotados para compor a connection string.

### 3. `backend/` — API em C# (.NET 10)

- **Projeto .NET compilado pelo Docker.**
- `Api.csproj` — SDK `Microsoft.NET.Sdk.Web`, `net10.0`, Dapper e MySqlConnector.
- `Models/Produto.cs` — namespace `Api.Models`; propriedades `Id` (`int`), `Nome` (`string`, padrão `""`), `Preco` (`decimal`).
- `Program.cs`:
  - `using Api.Models; using Dapper; using MySqlConnector;` no topo.
  - Leitura de `GetConnectionString("Padrao")` com exceção explícita se ausente.
  - CORS com política padrão para `http://localhost:3000`, `AllowAnyHeader()`, `AllowAnyMethod()`, e `app.UseCors()`.
  - Rota raiz respondendo **"API do projeto final no ar!"**.
  - Uma `MySqlConnection` por requisição (`await using`), consultas via Dapper (`QueryAsync`, `ExecuteScalarAsync`, `ExecuteAsync`).
  - `POST` com `INSERT ... ; SELECT LAST_INSERT_ID();` e retorno `Results.Created(...)`.
  - `PUT` e `DELETE` no mesmo molde, com `ExecuteAsync`.
- Contrato REST obrigatório (CRUD):

| Verbo | Rota | O que faz | Resposta |
|---|---|---|---|
| `GET` | `/api/produtos` | Lista todos (ordenados por nome) | `200` + lista |
| `GET` | `/api/produtos/{id}` | Busca um pelo id | `200`, ou `404` se não existe |
| `POST` | `/api/produtos` | Cadastra um novo | `201` + o criado |
| `PUT` | `/api/produtos/{id}` | Altera um existente | `204`, ou `404` |
| `DELETE` | `/api/produtos/{id}` | Exclui | `204`, ou `404` |

- `Api.http` — uma chamada por rota, executadas com **Send Request** (REST Client).
- `Dockerfile` — build e execução da API.

### 4. `frontend/` — Vue 3

- **Projeto Vue gerado pelo Docker e servido pelo nginx.**
- Arquivos de base:
  - `index.html` — a única página.
  - `vite.config.js` — configuração do Vite (incluindo o alias `@`).
  - `src/main.js` — inicializa o app.
  - `src/App.vue` — a moldura.
  - `src/router/` — tela por URL.
  - `src/views/` — as telas.
  - `src/services/` — comunicação com a API.
- `src/services/api.js` — **"o mensageiro"**:
  - Base lida de `import.meta.env.VITE_API_URL`.
  - **Toda chamada passa por `pedir()`**: o erro é tratado num lugar só.
  - Envia `Content-Type: application/json`; lança erro se `!resposta.ok`; retorna `null` para `204`.
  - Exporta funções por operação (`listarProdutos`, `criarProduto`, `excluirProduto`, …).
- Tela de produtos (`<script setup>` + `<template>`):
  - Estado com `ref`: `produtos`, `novo` (`{ nome, preco }`), `erro`.
  - `carregar()` em `onMounted`, com mensagem **"Erro ao carregar. A API está rodando?"** em caso de falha.
  - `salvar()` e `excluir(id)` recarregam a lista ao final.
  - Formulário com `@submit.prevent`, `v-model` / `v-model.number`, campos `required`, preço com `step="0.01"` e `min="0"`.
  - Lista com `v-for` + `:key`, erro exibido com `v-if`, preço formatado como moeda.
- `Dockerfile` **multi-stage**:
  - Etapa 1 (`node:24-alpine`): `npm install`, recebe `ARG VITE_API_URL`, executa `npm run build`.
  - Etapa 2 (`nginx:alpine`): copia `nginx.conf` e o `dist/` para `/usr/share/nginx/html`.
- `nginx.conf` — configuração do servidor do site.

---

## ⏱️ Fases ou Cronograma Sugerido

> Uma etapa por vez: banco, API, teste, Vue, rotina. Teste no fim de cada uma.

| Etapa | Fase | Entregável | Critério de aceite (teste) |
|:---:|---|---|---|
| **01** | **Banco** | Banco e tabela `produtos` no alwaysdata via `banco/schema.sql` | Na aba **Visualizar** do phpMyAdmin aparecem os **dois produtos** |
| **02** | **API** | `Api.csproj`, `Models/Produto.cs`, `Program.cs` com conexão, CORS e **5 rotas CRUD** | Código compila no build do Docker |
| **03** | **Segredo** | `.env` com `ConnectionStrings__Padrao`, `.env.example`, `.gitignore` | `.env` **não aparece** no `git status` |
| **04** | **Subir a API** | `compose.yaml` com o serviço `api` e `Api.http` | `localhost:8080` exibe **"API do projeto final no ar!"**; todas as chamadas do `.http` funcionam; o produto de teste (**Mochila**) aparece no phpMyAdmin |
| **05** | **Vue** | Arquivos de base do Vue, `Dockerfile`, `nginx.conf` e `compose.yaml` completo (`api` + `web`) | Container `web` constrói e sobe |
| **06** | **Conectar** | `services/api.js` e tela de produtos | `docker compose up --build` → `localhost:3000` **lista os produtos** e o cadastro **grava no alwaysdata** |
| **07** | **Rotina** | Domínio dos comandos do Docker Compose | Rebuild seletivo e leitura de logs funcionando |
| **08** | **Entrega** | Repositório Git, `README.md` e checklist cumprido | Todos os itens do **checklist de entrega** atendidos |

### Comandos da rotina (Etapa 7) — executar na raiz

| Comando | Quando usar |
|---|---|
| `docker compose up --build` | Depois de qualquer mudança: reconstrói e liga tudo |
| `docker compose up --build web` | Mudou só o Vue: reconstrói só o site |
| `docker compose up --build api` | Mudou só o C#: reconstrói só a API |
| `docker compose logs -f api` | Ver erros do C# e do banco |
| `docker compose ps` | Verificar se os containers estão rodando |
| `docker compose down` | Desliga tudo |

### Diagnóstico de erros comuns

| Sintoma | Causa provável e solução |
|---|---|
| "blocked by CORS policy" no console | Origem do Vue fora do `WithOrigins`, ou `UseCors()` faltando |
| API não sobe: connection string não encontrada | `.env` faltando, fora da raiz ou com a chave errada |
| Access denied for user | Usuário ou senha errados, ou sem permissão no banco |
| Tela mostra "Erro ao carregar" | API parada ou `VITE_API_URL` errado — verificar `docker compose ps` |
| Mudança no código não aparece | Faltou o `--build`: rodar `docker compose up --build` |
| "port is already allocated" | Outro programa usa a porta 3000 ou 8080 — pará-lo ou trocar a porta |

> O .http e o navegador direto na API funcionam, só o Vue falha? **É CORS.** Confira as origens no `Program.cs`.
