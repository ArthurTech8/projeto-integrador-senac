using Api.Infra;
using Api.Models;
using Api.Seguranca;
using Dapper;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using System.Security.Claims;

namespace Api.Endpoints;

// Login, logout e "quem sou eu". A sessão fica num cookie HttpOnly (o JavaScript não lê).
public static class AuthEndpoints
{
    public const string ColunasUsuario = "id, nome, email, perfil, curso, criado_em";

    public static void MapAuth(this WebApplication app)
    {
        var auth = app.MapGroup("/api/auth");

        // Entrar: confere e-mail e senha; se ok, grava o cookie de sessão e devolve o usuário.
        // Mesma mensagem para e-mail inexistente e senha errada (não revela quem está cadastrado).
        auth.MapPost("/entrar", async (EntradaLogin entrada, Banco banco, HttpContext http) =>
        {
            var email = entrada.Email?.Trim().ToLowerInvariant() ?? "";
            var senha = entrada.Senha ?? "";

            await using var db = banco.Abrir();
            var usuario = await db.QueryFirstOrDefaultAsync<UsuarioComSenha>(
                $"SELECT {ColunasUsuario}, senha_hash FROM usuarios WHERE email = @Email AND ativo = 1",
                new { Email = email });

            var senhaConfere = Senhas.Confere(usuario?.SenhaHash ?? Senhas.HashFalso, senha);
            if (usuario is null || !senhaConfere)
                return Results.Json(new { erro = "E-mail ou senha incorretos." }, statusCode: StatusCodes.Status401Unauthorized);

            await http.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, Sessao.Criar(usuario));
            return Results.Ok(SemSenha(usuario));
        }).RequireRateLimiting(LimiteLogin.Politica);

        // Sair: apaga o cookie de sessão.
        auth.MapPost("/sair", async (HttpContext http) =>
        {
            await http.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Results.NoContent();
        });

        // Quem sou eu: devolve o usuário logado (relido do banco) ou 204 se ninguém estiver logado.
        // 204 em vez de 401 para não sujar o console do navegador de quem só visita o mural.
        auth.MapGet("/eu", async (ClaimsPrincipal principal, Banco banco, HttpContext http) =>
        {
            var id = Sessao.IdDoUsuario(principal);
            if (id is null) return Results.NoContent();

            await using var db = banco.Abrir();
            var usuario = await db.QueryFirstOrDefaultAsync<Usuario>(
                $"SELECT {ColunasUsuario} FROM usuarios WHERE id = @Id AND ativo = 1", new { Id = id });

            if (usuario is null)
            {
                // usuário foi excluído enquanto estava logado: encerra a sessão
                await http.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
                return Results.NoContent();
            }
            return Results.Ok(usuario);
        });
    }

    // Copia só os campos públicos (sem o hash da senha)
    public static Usuario SemSenha(Usuario u) => new()
    {
        Id = u.Id, Nome = u.Nome, Email = u.Email, Perfil = u.Perfil, Curso = u.Curso, CriadoEm = u.CriadoEm
    };
}
