# Mural do Aluno

Site de avisos para os alunos do **Senac RS**: **calendário acadêmico** (feriados, férias, provas, matrícula), **atividades extracurriculares**, **vagas de emprego e estágio** nas áreas dos cursos e **cursos rápidos de capacitação**.

**Stack:** Vue 3 + TypeScript + axios (frontend) · API em C# / .NET 10 (backend) · MySQL no alwaysdata (banco) · Docker Compose.

> O Vue pede, a API decide, o banco guarda.

```text
navegador ── HTTP/JSON ──► API C# (localhost:8080) ── SQL ──► MySQL (alwaysdata)
  site Vue (localhost:3000)
```

## Pré-requisitos

- Docker Desktop, Git e VS Code (extensões: Vue (Official), REST Client, Docker)
- Conta gratuita no [alwaysdata](https://www.alwaysdata.com)
- **Não** precisa instalar .NET nem Node.js: o Docker faz tudo.

## Como rodar (passo a passo)

### 1. Criar o banco no alwaysdata

1. No painel, vá em **Databases › MySQL** e crie um banco (ex.: `suaconta_projeto`).
2. Na aba **Users**, confirme o usuário e a senha com acesso ao banco.
3. Abra o **phpMyAdmin**, selecione o banco, vá na aba **SQL**, cole o conteúdo de [`banco/schema.sql`](banco/schema.sql) e execute.
4. Na aba **Visualizar** da tabela `avisos` devem aparecer **18 avisos de exemplo**.

> **Banco já criado antes?** Não rode o `schema.sql` de novo: ele começa com `DROP TABLE` e apaga os dados. Rode só os arquivos novos de [`banco/migracoes/`](banco/migracoes), em ordem, **antes** de subir a API nova. Exemplo: `001_avisos_ativo.sql` adiciona a coluna `ativo`.

### 2. Configurar a senha (arquivo `.env`)

Copie o modelo e preencha com seus dados:

```bash
cp .env.example .env
```

```env
ConnectionStrings__Padrao=Server=mysql-suaconta.alwaysdata.net;Database=suaconta_projeto;User=suaconta;Password=SUA_SENHA;

# primeiro administrador (criado pela API quando ainda não existe nenhum admin)
AdminInicial__Nome=Seu Nome
AdminInicial__Email=voce@senacrs.com.br
AdminInicial__Senha=uma-senha-forte
```

- Cada valor fica em **uma linha só**.
- O `AdminInicial__*` só é usado na primeira vez. Depois de entrar, troque a senha em **Minha conta**.
- O `.env` **nunca** vai para o Git (já está no `.gitignore`). Confira com `git status`.

### 3. Subir tudo

Na raiz do projeto:

```bash
docker compose up --build
```

- API: <http://localhost:8080> → deve mostrar **"API do projeto final no ar!"**
- Site: <http://localhost:3000>

### 4. Testar a API

Abra [`backend/Api.http`](backend/Api.http) no VS Code e clique em **Send Request** em cada chamada. Depois confira no phpMyAdmin se o aviso de teste foi gravado.

### 5. Rodar os testes automatizados

Também sem instalar .NET nem Node (tudo roda no Docker):

```bash
docker compose -f compose.testes.yaml run --rm testes-web   # frontend: tipos + testes (Vitest)
docker compose -f compose.testes.yaml run --rm testes-api   # API: testes (xUnit) com um MySQL só de teste
docker compose -f compose.testes.yaml down -v               # desliga o MySQL de teste
```

- Os testes da API usam um **MySQL descartável** (serviço `banco-teste`), que é apagado e recriado a cada rodada. O banco do alwaysdata **nunca** é usado, e os testes nem leem o `.env`.
- O GitHub roda os mesmos testes a cada `push` e pull request ([`.github/workflows/testes.yml`](.github/workflows/testes.yml)), além do build das imagens. Vermelho = a mudança quebrou algo.
- **Toda mudança vem com teste** (exigência 6 do [`REGRAS_PROJETO_INTEGRADOR.md`](REGRAS_PROJETO_INTEGRADOR.md)). Os próprios testes cobram isso: função exportada sem teste ou rota da API sem teste fazem o CI falhar.

## Rotas da API

| Verbo | Rota | O que faz | Resposta |
|---|---|---|---|
| `GET` | `/api/avisos` | Lista os avisos (não excluídos), mais recentes primeiro | `200` + lista |
| `GET` | `/api/avisos/{id}` | Busca um pelo id | `200`, ou `404` (inexistente ou excluído) |
| `POST` | `/api/avisos` | Cadastra um novo | `201` + o criado, ou `400` se inválido |
| `PUT` | `/api/avisos/{id}` | Altera um existente | `204`, `400` ou `404` |
| `DELETE` | `/api/avisos/{id}` | Exclui (no banco: `ativo = 0`, nada é apagado) | `204`, ou `404` |
Categorias válidas: `calendario`, `extracurricular`, `emprego`, `curso`.

**Quem pode o quê:** ver avisos é público. `POST`, `PUT` e `DELETE` de avisos exigem login como **admin** ou **editor**. Sem login a API responde 401; sem permissão, 403.

### Login e usuários

| Verbo | Rota | Quem | O que faz |
|---|---|---|---|
| `POST` | `/api/auth/entrar` | todos | Login (grava o cookie `mural_sessao`) |
| `POST` | `/api/auth/sair` | todos | Logout |
| `GET` | `/api/auth/eu` | todos | Usuário logado (`204` se ninguém) |
| `PUT` | `/api/conta/senha` | logado | Troca a própria senha |
| `GET/POST/PUT/DELETE` | `/api/usuarios[/{id}]` | admin | Cadastro de usuários (excluir = `ativo = 0`) |

| Perfil | Pode |
|---|---|
| Administrador | Avisos + tela **Usuários** |
| Editor | Avisos (tela **Gerenciar**) |
| Aluno | Mural já filtrado pelo curso dele + **Minha conta** |

No `Api.http`, rode primeiro a requisição **Entrar**: o REST Client guarda o cookie e o envia nas chamadas seguintes.

**Exclusão lógica:** para quem usa o site, "Excluir" apaga o aviso: ele some de todas as telas e o link direto responde 404. No banco, porém, nada é apagado: a linha só muda para `ativo = 0`. Para recuperar um aviso excluído, o administrador roda no phpMyAdmin: `UPDATE avisos SET ativo = 1 WHERE id = ...;`

## Telas do site

| Página | URL | O que mostra |
|---|---|---|
| Início | `/` | Busca, atalhos por categoria (com contagem), avisos urgentes, recentes e próximas datas |
| Avisos | `/avisos` | Lista com filtro por categoria e por curso, busca por palavra-chave e opção de ver encerrados. Os filtros ficam na URL (ex.: `/avisos?categoria=emprego`) |
| Detalhe | `/avisos/:id` | Ficha completa (data, local, empresa, carga horária, vagas, certificado), prazo restante e botão de inscrição |
| Calendário | `/calendario` | Linha do tempo agrupada por mês, com o que está "acontecendo agora" |
| Gerenciar | `/gerenciar` | Formulário para publicar, editar e excluir avisos (os campos mudam conforme a categoria) |
| Entrar | `/entrar` | Login em tela cheia, sem cabeçalho nem rodapé. Depois de entrar, volta para a página pedida ou vai para Gerenciar (equipe) ou Avisos (aluno) |
| Usuários | `/usuarios` | **Só admin.** Cadastrar, editar e excluir usuários. O curso aparece só para o perfil Aluno |
| Minha conta | `/conta` | **Logado.** Dados do usuário e troca de senha |
| Acesso negado | `/sem-acesso` | Quando o perfil não pode abrir a página pedida |
| Não encontrada | qualquer outra | Página 404 com atalhos para o início e para os avisos |

**Layouts:** nenhuma tela monta o próprio cabeçalho ou rodapé. O `App.vue` escolhe a moldura pela rota (`meta.layout` em `router/rotas.ts`):
- `padrao` (o valor quando a rota não diz nada): cabeçalho + tela + rodapé;
- `vazio`: só a tela, em tela cheia, como no login.

As telas (exceto o Início) são carregadas sob demanda: o navegador só baixa o código de uma tela quando o aluno a abre.

Selos automáticos: **Novo** (publicado há até 7 dias), **Urgente** (marcado no cadastro) e **Encerrado** (a data final já passou).

## Como adicionar ou editar avisos

- **Pelo site:** acesse <http://localhost:3000/gerenciar>.
- **Pelo banco:** use `INSERT`/`UPDATE` no phpMyAdmin, seguindo os exemplos de `banco/schema.sql`.
- Para trocar o nome da instituição ou os cursos, edite `frontend/src/config/`. As cores ficam em `frontend/src/styles/tokens.css`.
- **Logos:** os arquivos oficiais do Senac RS (copiados de [senacrs.com.br](https://www.senacrs.com.br)) ficam em `frontend/public/marca/`. Use `senac-rs-branco.png` em fundo escuro e `senac-rs-colorido.png` em fundo claro. Os caminhos ficam em `INSTITUICAO.logo` (`config/instituicao.ts`). Não redesenhe, não estique e não mude as cores da marca.
- **Fotos do banner da página inicial:** ficam em `frontend/public/fundos/` (WebP, em 1920 e 960 px; o celular baixa só a menor) e trocam a cada 8 s. Para pôr uma foto nova, salve as duas larguras e acrescente uma linha em `frontend/src/config/fundos.ts`, ajustando o `enquadramento` (a parte da foto que fica visível). Todas são gratuitas pela [Licença Unsplash](https://unsplash.com/license). Créditos:
  - [Vitaly Gariev](https://unsplash.com/photos/kp7qkHTgSKc): grupo de estudantes em volta de um laptop;
  - [Zoshua Colah](https://unsplash.com/photos/Ma7aOy5mMp0): estudante na biblioteca;
  - [Timur Shakerzianov](https://unsplash.com/photos/w8nxODYvrns): estudantes em aula;
  - [Hasnain Ayaz](https://unsplash.com/photos/pLybV75vkP4): estudante no laptop.

### Como criar uma categoria nova

1. Adicione a chave em `ChaveCategoria` (`frontend/src/types/aviso.ts`) e a entrada em `frontend/src/config/categorias.ts` (rótulo, ícone, texto do botão e campos do formulário).
2. Adicione a cor dela em `frontend/src/styles/tokens.css` (`[data-cat='nova']`).
3. Inclua o valor no `CHECK` de `banco/schema.sql` e em `categoriasValidas` no `backend/Program.cs`.

Filtros, menu, formulário, ficha, calendário e rodapé passam a mostrar a categoria sozinhos.

### Como criar uma tela nova

1. Crie `frontend/src/views/NomeView.vue`.
2. Registre a tela em `frontend/src/router/rotas.ts`. Com `meta.menu`, ela aparece no menu do topo automaticamente.

## Estrutura

```text
├── backend/                 # API C# → container api
│   ├── Program.cs           # configuração: conexão, CORS, login por cookie, perfis, rotas
│   ├── Endpoints/           # rotas por assunto: Avisos, Auth, Conta, Usuarios
│   ├── Seguranca/           # perfis, sessão (cookie), senhas (hash), admin inicial, limite de login
│   ├── Infra/Banco.cs       # abre a conexão com o MySQL
│   ├── Models/              # Aviso.cs, Usuario.cs (formatos do JSON)
│   ├── Api.csproj · appsettings.json
│   ├── Api.http             # testes das rotas (REST Client)
│   └── Dockerfile
├── frontend/                # Vue 3 → container web
│   ├── src/
│   │   ├── main.ts · App.vue      # inicia o app · moldura (cabeçalho + tela + rodapé)
│   │   ├── config/                # dados fixos: instituição, categorias, cursos, mensagens
│   │   ├── utils/                 # funções genéricas: datas.ts, texto.ts
│   │   ├── regras/                # regras de negócio (funções puras)
│   │   │   ├── avisos.ts          #   novo/encerrado, prazos, filtros, ordenação, agrupamento
│   │   │   └── formularioAviso.ts #   campos por categoria, conversão formulário ⇄ API
│   │   ├── types/                 # tipos (Aviso, AvisoEntrada, ChaveCategoria…) = Models/Aviso.cs
│   │   ├── services/              # api.ts (axios + pedir() + ErroApi) · rotas.ts · avisos.ts
│   │   ├── composables/           # estado reativo reaproveitável
│   │   │   ├── useAvisos.ts       #   lista de avisos (carregando/erro)
│   │   │   ├── useAviso.ts        #   um aviso pelo id (com 404)
│   │   │   └── useFiltrosAvisos.ts#   filtros sincronizados com a URL
│   │   ├── components/
│   │   │   ├── ui/                # genéricos: Icone, EstadoCarregamento, EstadoVazio,
│   │   │   │                      #   CabecalhoPagina, CabecalhoSecao, BlocoData
│   │   │   ├── avisos/            # do domínio: AvisoCard, GradeAvisos, SelosAviso,
│   │   │   │                      #   SeloCategoria, FichaAviso, FiltrosAvisos, ItemCalendario,
│   │   │   │                      #   AtalhosCategorias, FormularioAviso, ItemGerenciar
│   │   │   └── layout/            # LayoutPadrao, LayoutVazio, layouts.ts (catálogo),
│   │   │                          #   CabecalhoSite (menu gerado das rotas), RodapeSite
│   │   ├── views/                 # telas: Início, Avisos, Detalhe, Calendário, Gerenciar, Entrar, 404
│   │   ├── router/                # rotas.ts (lista de telas) · index.ts (cria o router)
│   │   └── styles/                # tokens.css (cores) · base.css · componentes.css · index.css
│   ├── public/marca/              # logos oficiais do Senac RS (servidos em /marca/...)
│   ├── public/fundos/             # fotos do banner da página inicial (Licença Unsplash)
│   ├── testes/                    # testes do Vitest (um arquivo por módulo de src/)
│   │   ├── apoio/                 #   fábricas de dados, API simulada, montagem de composables
│   │   └── regras-do-projeto/     #   toda função tem teste · contrato front ⇄ API ⇄ banco
│   ├── package.json · vite.config.ts · vitest.config.ts
│   ├── tsconfig.json · tsconfig.node.json · tsconfig.testes.json
│   ├── index.html · nginx.conf
│   └── Dockerfile
├── backend-testes/          # testes da API (xUnit), fora de backend/ para não entrar na imagem
│   ├── Infra/               # sobe a API de verdade ligada ao MySQL de teste
│   ├── Rotas/               # um arquivo por grupo de rotas ([Trait("Rota", ...)] em cada teste)
│   ├── BancoDeDados/        # admin inicial e migrações (= schema.sql)
│   ├── Unidade/             # senhas, sessão, perfis
│   └── RegrasDoProjeto/     # regras invioláveis: sem DELETE FROM, SQL com parâmetros, toda rota testada…
├── banco/
│   ├── schema.sql           # recria a tabela avisos do zero, com dados de exemplo (banco novo)
│   └── migracoes/           # alterações para um banco que já existe (001_avisos_ativo.sql…)
├── .github/workflows/testes.yml  # CI: roda todos os testes a cada push e pull request
├── .env.example             # modelo sem senha (vai pro Git)
├── compose.yaml             # api + web (sem serviço de banco)
├── compose.testes.yaml      # só para testes: MySQL descartável + quem roda os testes
└── README.md
```

## Comandos do dia a dia

| Comando | Quando usar |
|---|---|
| `docker compose up --build` | Depois de qualquer mudança |
| `docker compose up --build web` | Mudou só o Vue |
| `docker compose up --build api` | Mudou só o C# |
| `docker compose logs -f api` | Ver erros do C# e do banco |
| `docker compose ps` | Ver se os containers estão rodando |
| `docker compose down` | Desligar tudo |
| `docker compose -f compose.testes.yaml run --rm testes-web` | Testar o frontend (antes de todo commit) |
| `docker compose -f compose.testes.yaml run --rm testes-api` | Testar a API (antes de todo commit) |

## Problemas comuns

| Sintoma | Solução |
|---|---|
| "blocked by CORS policy" | Confira `WithOrigins("http://localhost:3000")` e `app.UseCors()` no `Program.cs` |
| API não sobe: connection string não encontrada | `.env` faltando, fora da raiz ou com a chave errada |
| Access denied for user | Usuário/senha errados ou sem permissão no banco |
| Tela mostra "Erro ao carregar. A API está rodando?" | Rode `docker compose ps`; confira o `VITE_API_URL` no `compose.yaml` |
| Mudança não aparece | Faltou o `--build` |
| "port is already allocated" | Outro programa usa a porta 3000 ou 8080 |
| Build do `web` para com `error TS…` | Erro de tipo no TypeScript. O `npm run typecheck` (vue-tsc) roda antes do build; a mensagem mostra o arquivo e a linha |
| Build para com `failed to receive status … EOF` | Instabilidade do Docker Desktop. Reinicie o Docker e rode de novo |
| Teste falha com "Funções sem teste" ou "Rotas sem teste" | Você criou uma função ou rota nova sem teste. Crie o teste em `frontend/testes/` ou `backend-testes/Rotas/` |
| `banco-teste` não sobe (`exited (1)`) | Rode `docker compose -f compose.testes.yaml down -v` e tente de novo |
