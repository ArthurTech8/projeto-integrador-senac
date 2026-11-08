using System.Net;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;

namespace Api.Testes.Infra;

// No servidor de teste todo pedido chega sem IP. Este filtro (só nos testes) lê o IP do
// cabeçalho X-Teste-Ip, para o limite de login (10 por minuto por IP) poder ser testado
// sem que um teste gaste as tentativas do outro. Não existe na API de verdade.
public sealed class IpDeTeste : IStartupFilter
{
    public const string Cabecalho = "X-Teste-Ip";

    public Action<IApplicationBuilder> Configure(Action<IApplicationBuilder> proximo) => app =>
    {
        app.Use(async (contexto, seguir) =>
        {
            if (IPAddress.TryParse(contexto.Request.Headers[Cabecalho], out var ip))
                contexto.Connection.RemoteIpAddress = ip;
            await seguir();
        });
        proximo(app);
    };
}
