using System.Net;
using System.Net.Http.Json;
using Api.Models;
using Dapper;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using MySqlConnector;

namespace Api.Testes.Infra;

// Sobe a API de verdade (o mesmo Program.cs) dentro do processo de teste, ligada ao banco de teste.
// Uma vez só para todos os testes de API (coleção "Api"), que rodam um depois do outro.
public sealed class ApiDeTeste : IAsyncLifetime
{
    public const string AdminEmail = "admin@teste.local";
    public const string AdminSenha = "senha-do-admin-1";

    private WebApplicationFactory<Program>? fabrica;
    private int ultimoIp;

    public string Conexao { get; private set; } = "";

    public async ValueTask InitializeAsync()
    {
        Conexao = await BancoDeTeste.CriarAsync("mural");

        // A API lê a configuração das variáveis de ambiente, como no Docker (env_file: .env)
        Environment.SetEnvironmentVariable("ConnectionStrings__Padrao", Conexao);
        Environment.SetEnvironmentVariable("AdminInicial__Email", AdminEmail);
        Environment.SetEnvironmentVariable("AdminInicial__Senha", AdminSenha);
        Environment.SetEnvironmentVariable("AdminInicial__Nome", "Admin de Teste");

        fabrica = new WebApplicationFactory<Program>().WithWebHostBuilder(web =>
            web.ConfigureTestServices(servicos => servicos.AddSingleton<IStartupFilter, IpDeTeste>()));
        // força a API a subir agora (e criar o admin inicial)
        fabrica.CreateClient().Dispose();
    }

    public async ValueTask DisposeAsync()
    {
        if (fabrica is not null) await fabrica.DisposeAsync();
    }

    // Cliente novo: guarda o próprio cookie de sessão e tem um IP só dele
    // (o limite de login é por IP; assim um teste não gasta as tentativas do outro).
    public HttpClient Cliente()
    {
        var cliente = (fabrica ?? throw new InvalidOperationException("API não iniciada")).CreateClient(
            new WebApplicationFactoryClientOptions { HandleCookies = true, AllowAutoRedirect = false });
        var n = Interlocked.Increment(ref ultimoIp);
        cliente.DefaultRequestHeaders.Add(IpDeTeste.Cabecalho, $"10.0.{n / 250}.{n % 250 + 1}");
        return cliente;
    }

    public async Task<HttpClient> LogadoAsync(string email, string senha)
    {
        var cliente = Cliente();
        var resposta = await cliente.PostAsJsonAsync("/api/auth/entrar", new { email, senha });
        Assert.Equal(HttpStatusCode.OK, resposta.StatusCode);
        return cliente;
    }

    public Task<HttpClient> AdminAsync() => LogadoAsync(AdminEmail, AdminSenha);

    // Cria um usuário (pelo admin, como no sistema) com e-mail único e já devolve o cliente logado
    public async Task<(HttpClient Cliente, Usuario Usuario, string Senha)> NovoUsuarioAsync(string perfil, string? curso = null)
    {
        var admin = await AdminAsync();
        var senha = "senha-" + Guid.NewGuid().ToString("N")[..8];
        var email = $"{perfil}-{Guid.NewGuid():N}@teste.local";
        var resposta = await admin.PostAsJsonAsync("/api/usuarios",
            new { nome = $"Teste {perfil}", email, perfil, curso = curso ?? (perfil == "aluno" ? "Enfermagem" : null), senha });
        Assert.Equal(HttpStatusCode.Created, resposta.StatusCode);
        var usuario = (await resposta.Content.ReadFromJsonAsync<Usuario>())!;
        return (await LogadoAsync(email, senha), usuario, senha);
    }

    // Consulta direta no banco (para conferir o que a API gravou de verdade, ex.: ativo = 0)
    public async Task<T?> ConsultarAsync<T>(string sql, object? parametros = null)
    {
        await using var db = new MySqlConnection(Conexao);
        return await db.QueryFirstOrDefaultAsync<T>(sql, parametros);
    }
}

[CollectionDefinition("Api")]
public class ColecaoApi : ICollectionFixture<ApiDeTeste>;
