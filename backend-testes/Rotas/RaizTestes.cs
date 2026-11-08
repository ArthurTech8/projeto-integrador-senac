using System.Net;
using Api.Testes.Infra;

namespace Api.Testes.Rotas;

// Rota raiz e CORS (Program.cs).
[Collection("Api")]
public class RaizTestes(ApiDeTeste api)
{
    [Fact, Trait("Rota", "GET /")]
    public async Task Raiz_responde_que_a_API_esta_no_ar()
    {
        var resposta = await api.Cliente().GetAsync("/");
        Assert.Equal("API do projeto final no ar!", await resposta.AssertStatusAsync(HttpStatusCode.OK));
    }

    [Fact]
    public async Task CORS_libera_o_frontend_em_localhost_3000_com_cookie()
    {
        using var pedido = new HttpRequestMessage(HttpMethod.Options, "/api/avisos");
        pedido.Headers.Add("Origin", "http://localhost:3000");
        pedido.Headers.Add("Access-Control-Request-Method", "POST");
        var resposta = await api.Cliente().SendAsync(pedido);

        Assert.Equal("http://localhost:3000", Assert.Single(resposta.Headers.GetValues("Access-Control-Allow-Origin")));
        Assert.Equal("true", Assert.Single(resposta.Headers.GetValues("Access-Control-Allow-Credentials")));
    }

    [Fact]
    public async Task CORS_bloqueia_outros_sites()
    {
        using var pedido = new HttpRequestMessage(HttpMethod.Get, "/api/avisos");
        pedido.Headers.Add("Origin", "https://site-qualquer.com");
        var resposta = await api.Cliente().SendAsync(pedido);
        Assert.False(resposta.Headers.Contains("Access-Control-Allow-Origin"));
    }

    [Fact]
    public async Task Ate_o_401_leva_o_cabecalho_CORS()
    {
        using var pedido = new HttpRequestMessage(HttpMethod.Get, "/api/usuarios");
        pedido.Headers.Add("Origin", "http://localhost:3000");
        var resposta = await api.Cliente().SendAsync(pedido);
        await resposta.AssertStatusAsync(HttpStatusCode.Unauthorized);
        Assert.True(resposta.Headers.Contains("Access-Control-Allow-Origin"));
    }
}
