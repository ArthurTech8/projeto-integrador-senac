using System.Net;
using System.Net.Http.Json;
using Api.Testes.Infra;

namespace Api.Testes.Rotas;

// Login, logout e "quem sou eu" (Endpoints/AuthEndpoints.cs). Exigência 5.
[Collection("Api")]
public class AuthTestes(ApiDeTeste api)
{
    [Fact, Trait("Rota", "POST /api/auth/entrar")]
    public async Task Login_certo_devolve_o_usuario_sem_senha_e_grava_cookie_HttpOnly()
    {
        var resposta = await api.Cliente().PostAsJsonAsync("/api/auth/entrar",
            new { email = ApiDeTeste.AdminEmail, senha = ApiDeTeste.AdminSenha });
        await resposta.AssertStatusAsync(HttpStatusCode.OK);

        var usuario = await resposta.LerAsync();
        Assert.Equal(ApiDeTeste.AdminEmail, usuario.GetProperty("email").GetString());
        Assert.Equal("admin", usuario.GetProperty("perfil").GetString());
        Assert.DoesNotContain(Json.Campos(usuario), c => c.Contains("senha", StringComparison.OrdinalIgnoreCase));

        var cookie = Assert.Single(resposta.Headers.GetValues("Set-Cookie"), c => c.StartsWith("mural_sessao="));
        Assert.Contains("httponly", cookie, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("samesite=lax", cookie, StringComparison.OrdinalIgnoreCase);
    }

    [Fact, Trait("Rota", "POST /api/auth/entrar")]
    public async Task Email_com_maiusculas_e_espacos_tambem_entra()
    {
        var resposta = await api.Cliente().PostAsJsonAsync("/api/auth/entrar",
            new { email = "  ADMIN@Teste.Local ", senha = ApiDeTeste.AdminSenha });
        await resposta.AssertStatusAsync(HttpStatusCode.OK);
    }

    [Theory, Trait("Rota", "POST /api/auth/entrar")]
    [InlineData(ApiDeTeste.AdminEmail, "senha-errada")]
    [InlineData("ninguem@teste.local", "qualquer-senha")]
    [InlineData("", "")]
    public async Task Senha_errada_e_email_inexistente_tem_a_mesma_mensagem(string email, string senha)
    {
        var resposta = await api.Cliente().PostAsJsonAsync("/api/auth/entrar", new { email, senha });
        await resposta.AssertStatusAsync(HttpStatusCode.Unauthorized);
        Assert.Equal("E-mail ou senha incorretos.", await resposta.ErroAsync());
        Assert.False(resposta.Headers.Contains("Set-Cookie"));
    }

    [Fact, Trait("Rota", "POST /api/auth/entrar")]
    public async Task Depois_de_10_tentativas_no_mesmo_minuto_responde_429()
    {
        var mesmoIp = api.Cliente();
        for (var i = 0; i < 10; i++)
        {
            var tentativa = await mesmoIp.PostAsJsonAsync("/api/auth/entrar", new { email = "x@x.com", senha = "errada-123" });
            await tentativa.AssertStatusAsync(HttpStatusCode.Unauthorized);
        }
        var bloqueada = await mesmoIp.PostAsJsonAsync("/api/auth/entrar", new { email = ApiDeTeste.AdminEmail, senha = ApiDeTeste.AdminSenha });
        await bloqueada.AssertStatusAsync(HttpStatusCode.TooManyRequests);

        // o limite é por IP: outra pessoa continua entrando
        await (await api.Cliente().PostAsJsonAsync("/api/auth/entrar",
            new { email = ApiDeTeste.AdminEmail, senha = ApiDeTeste.AdminSenha })).AssertStatusAsync(HttpStatusCode.OK);
    }

    [Fact, Trait("Rota", "GET /api/auth/eu")]
    public async Task Eu_sem_login_responde_204_e_logado_devolve_o_usuario()
    {
        await (await api.Cliente().GetAsync("/api/auth/eu")).AssertStatusAsync(HttpStatusCode.NoContent);

        var (aluno, usuario, _) = await api.NovoUsuarioAsync("aluno", "Gastronomia");
        var resposta = await aluno.GetAsync("/api/auth/eu");
        await resposta.AssertStatusAsync(HttpStatusCode.OK);
        var eu = await resposta.LerAsync();
        Assert.Equal(usuario.Id, eu.GetProperty("id").GetInt32());
        Assert.Equal("Gastronomia", eu.GetProperty("curso").GetString());
        Assert.DoesNotContain(Json.Campos(eu), c => c.Contains("senha", StringComparison.OrdinalIgnoreCase) || c == "ativo");
    }

    [Fact, Trait("Rota", "POST /api/auth/sair")]
    public async Task Sair_apaga_a_sessao()
    {
        var (editor, _, _) = await api.NovoUsuarioAsync("editor");
        await (await editor.PostAsync("/api/auth/sair", null)).AssertStatusAsync(HttpStatusCode.NoContent);
        await (await editor.GetAsync("/api/auth/eu")).AssertStatusAsync(HttpStatusCode.NoContent);
        await (await editor.PostAsJsonAsync("/api/avisos", Json.Aviso())).AssertStatusAsync(HttpStatusCode.Unauthorized);
    }

    [Fact, Trait("Rota", "GET /api/auth/eu")]
    public async Task Usuario_excluido_perde_o_acesso_na_hora_mesmo_com_a_sessao_aberta()
    {
        var (editor, usuario, senha) = await api.NovoUsuarioAsync("editor");
        var admin = await api.AdminAsync();
        await (await admin.DeleteAsync($"/api/usuarios/{usuario.Id}")).AssertStatusAsync(HttpStatusCode.NoContent);

        // o cookie ainda existe, mas a API confere no banco a cada pedido
        await (await editor.PostAsJsonAsync("/api/avisos", Json.Aviso())).AssertStatusAsync(HttpStatusCode.Forbidden);
        await (await editor.GetAsync("/api/auth/eu")).AssertStatusAsync(HttpStatusCode.NoContent);
        // e não consegue entrar de novo
        var login = await api.Cliente().PostAsJsonAsync("/api/auth/entrar", new { email = usuario.Email, senha });
        await login.AssertStatusAsync(HttpStatusCode.Unauthorized);
    }
}
