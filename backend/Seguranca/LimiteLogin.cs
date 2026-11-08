using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

namespace Api.Seguranca;

// Limite de tentativas de login: no máximo 10 por minuto por endereço IP.
// Dificulta "chutar" senhas em sequência. Passou do limite → 429 (Too Many Requests).
// Já vem no ASP.NET Core: nenhum pacote extra.
public static class LimiteLogin
{
    public const string Politica = "login";

    public static void Configurar(RateLimiterOptions opcoes)
    {
        opcoes.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
        opcoes.AddPolicy(Politica, http =>
            RateLimitPartition.GetFixedWindowLimiter(
                http.Connection.RemoteIpAddress?.ToString() ?? "desconhecido",
                _ => new FixedWindowRateLimiterOptions { PermitLimit = 10, Window = TimeSpan.FromMinutes(1) }));
    }
}
