using System.Security.Claims;
using Api.Infra;
using Api.Seguranca;
using Dapper;

namespace Api.Endpoints;

// "Minha conta": o próprio usuário logado (qualquer perfil) troca a sua senha.
public static class ContaEndpoints
{
    public static void MapConta(this WebApplication app)
    {
        app.MapPut("/api/conta/senha", async (Models.TrocaSenha troca, Banco banco, ClaimsPrincipal eu) =>
        {
            var id = Sessao.IdDoUsuario(eu);
            var erroSenha = Senhas.Validar(troca.NovaSenha);
            if (erroSenha is not null) return Results.BadRequest(new { erro = erroSenha });

            await using var db = banco.Abrir();
            var hashAtual = await db.QueryFirstOrDefaultAsync<string>(
                "SELECT senha_hash FROM usuarios WHERE id = @Id AND ativo = 1", new { Id = id });
            if (hashAtual is null) return Results.NotFound();
            if (!Senhas.Confere(hashAtual, troca.SenhaAtual ?? ""))
                return Results.BadRequest(new { erro = "A senha atual está incorreta." });

            await db.ExecuteAsync("UPDATE usuarios SET senha_hash = @Hash WHERE id = @Id",
                new { Hash = Senhas.Gerar(troca.NovaSenha!), Id = id });
            return Results.NoContent();
        })
        .RequireAuthorization(Politicas.Logado)
        .RequireRateLimiting(LimiteLogin.Politica);
    }
}
