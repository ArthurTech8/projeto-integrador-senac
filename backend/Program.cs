using Api.Endpoints;
using Api.Infra;
using Api.Seguranca;
using Dapper;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;

var builder = WebApplication.CreateBuilder(args);

// A connection string vem do .env (chave ConnectionStrings__Padrao), entregue pelo Docker.
var conexao = builder.Configuration.GetConnectionString("Padrao")
    ?? throw new InvalidOperationException(
        "Connection string 'Padrao' não encontrada. Crie o arquivo .env na raiz com a chave ConnectionStrings__Padrao.");
builder.Services.AddSingleton(new Banco(conexao));

// Só o frontend (localhost:3000) pode chamar esta API pelo navegador.
// AllowCredentials: deixa o navegador mandar o cookie de sessão junto com os pedidos.
builder.Services.AddCors(opcoes =>
    opcoes.AddDefaultPolicy(politica =>
        politica.WithOrigins("http://localhost:3000")
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials()));

// Login por cookie (já vem no ASP.NET Core).
// HttpOnly: o JavaScript não consegue ler o cookie. SameSite=Lax: outros sites não usam a sessão.
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(opcoes =>
    {
        opcoes.Cookie.Name = Sessao.NomeCookie;
        opcoes.Cookie.HttpOnly = true;
        opcoes.Cookie.SameSite = SameSiteMode.Lax;
        opcoes.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        opcoes.ExpireTimeSpan = TimeSpan.FromHours(8);
        opcoes.SlidingExpiration = true;
        // Uma API responde com códigos, não redireciona para uma página de login:
        opcoes.Events.OnRedirectToLogin = contexto => { contexto.Response.StatusCode = 401; return Task.CompletedTask; };
        opcoes.Events.OnRedirectToAccessDenied = contexto => { contexto.Response.StatusCode = 403; return Task.CompletedTask; };
    });

// Políticas de acesso: confere no banco se o usuário está ativo e tem o perfil exigido.
builder.Services.AddSingleton<IAuthorizationHandler, PerfilAtivoHandler>();
builder.Services.AddAuthorizationBuilder()
    .AddPolicy(Politicas.Logado, p => p.AddRequirements(new PerfilAtivoRequisito(Perfis.Todos)))
    .AddPolicy(Politicas.Equipe, p => p.AddRequirements(new PerfilAtivoRequisito(Perfis.Equipe)))
    .AddPolicy(Politicas.Admin, p => p.AddRequirements(new PerfilAtivoRequisito(Perfis.Admin)));

// Limite de tentativas de login (10 por minuto por IP)
builder.Services.AddRateLimiter(LimiteLogin.Configurar);

var app = builder.Build();

// A ordem importa: CORS antes da autenticação, para que até as respostas 401 tenham o cabeçalho CORS.
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

// Liga colunas snake_case (data_inicio) às propriedades C# (DataInicio).
DefaultTypeMap.MatchNamesWithUnderscores = true;

// Cria o primeiro administrador a partir do .env, se ainda não houver nenhum.
await AdminInicial.GarantirAsync(app.Services.GetRequiredService<Banco>(), app.Configuration, app.Logger);

app.MapGet("/", () => "API do projeto final no ar!");
app.MapAvisos();     // Endpoints/AvisosEndpoints.cs
app.MapAuth();       // Endpoints/AuthEndpoints.cs
app.MapConta();      // Endpoints/ContaEndpoints.cs
app.MapUsuarios();   // Endpoints/UsuariosEndpoints.cs

app.Run();
