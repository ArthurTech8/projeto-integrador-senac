using System.Net;
using System.Net.Http.Json;
using Api.Testes.Infra;

namespace Api.Testes.Rotas;

// "Minha conta": troca da própria senha (Endpoints/ContaEndpoints.cs).
[Collection("Api")]
public class ContaTestes(ApiDeTeste api)
{
    [Fact, Trait("Rota", "PUT /api/conta/senha")]
    public async Task Trocar_senha_sem_login_responde_401()
    {
        var resposta = await api.Cliente().PutAsJsonAsync("/api/conta/senha", new { senhaAtual = "x", novaSenha = "nova-senha-1" });
        await resposta.AssertStatusAsync(HttpStatusCode.Unauthorized);
    }

    [Fact, Trait("Rota", "PUT /api/conta/senha")]
    public async Task Aluno_troca_a_propria_senha_e_a_antiga_para_de_funcionar()
    {
        var (aluno, usuario, senhaAntiga) = await api.NovoUsuarioAsync("aluno");
        var resposta = await aluno.PutAsJsonAsync("/api/conta/senha", new { senhaAtual = senhaAntiga, novaSenha = "senha-nova-123" });
        await resposta.AssertStatusAsync(HttpStatusCode.NoContent);

        var comAntiga = await api.Cliente().PostAsJsonAsync("/api/auth/entrar", new { email = usuario.Email, senha = senhaAntiga });
        await comAntiga.AssertStatusAsync(HttpStatusCode.Unauthorized);
        await api.LogadoAsync(usuario.Email, "senha-nova-123");
    }

    [Fact, Trait("Rota", "PUT /api/conta/senha")]
    public async Task Senha_atual_errada_responde_400_e_nada_muda()
    {
        var (editor, usuario, senha) = await api.NovoUsuarioAsync("editor");
        var resposta = await editor.PutAsJsonAsync("/api/conta/senha", new { senhaAtual = "nao-e-essa", novaSenha = "senha-nova-123" });
        await resposta.AssertStatusAsync(HttpStatusCode.BadRequest);
        Assert.Equal("A senha atual está incorreta.", await resposta.ErroAsync());
        await api.LogadoAsync(usuario.Email, senha);
    }

    [Theory, Trait("Rota", "PUT /api/conta/senha")]
    [InlineData("curta")]
    [InlineData("")]
    [InlineData(null)]
    public async Task Senha_nova_com_menos_de_8_responde_400(string? novaSenha)
    {
        var (editor, _, senha) = await api.NovoUsuarioAsync("editor");
        var resposta = await editor.PutAsJsonAsync("/api/conta/senha", new { senhaAtual = senha, novaSenha });
        await resposta.AssertStatusAsync(HttpStatusCode.BadRequest);
        Assert.Equal("A senha precisa ter pelo menos 8 caracteres.", await resposta.ErroAsync());
    }
}
