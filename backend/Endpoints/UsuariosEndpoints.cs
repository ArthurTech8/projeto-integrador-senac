using System.Net.Mail;
using System.Security.Claims;
using Api.Infra;
using Api.Models;
using Api.Seguranca;
using Dapper;
using MySqlConnector;

namespace Api.Endpoints;

// Cadastro de usuários. Todas as rotas: só admin.
// Exclusão lógica: "Excluir" marca ativo = 0 (a linha continua no banco).
public static class UsuariosEndpoints
{
    private const string Colunas = AuthEndpoints.ColunasUsuario;

    // Valida os dados. senhaObrigatoria = true no cadastro; no PUT a senha é opcional.
    // Devolve (erro, dados normalizados).
    private static (string? Erro, UsuarioEntrada Dados) Validar(UsuarioEntrada entrada, bool senhaObrigatoria)
    {
        var nome = entrada.Nome?.Trim() ?? "";
        var email = entrada.Email?.Trim().ToLowerInvariant() ?? "";
        var perfil = entrada.Perfil?.Trim().ToLowerInvariant() ?? "";
        var curso = string.IsNullOrWhiteSpace(entrada.Curso) ? null : entrada.Curso.Trim();
        var dados = new UsuarioEntrada(nome, email, perfil, perfil == Perfis.Aluno ? curso : null, entrada.Senha);

        if (nome == "") return ("Informe o nome.", dados);
        if (!MailAddress.TryCreate(email, out var endereco) || endereco.Address != email) return ("E-mail inválido.", dados);
        if (!Perfis.Todos.Contains(perfil)) return ("Perfil inválido.", dados);
        if (perfil == Perfis.Aluno && curso is null) return ("Informe o curso do aluno.", dados);
        if (senhaObrigatoria || !string.IsNullOrEmpty(entrada.Senha))
        {
            var erroSenha = Senhas.Validar(entrada.Senha);
            if (erroSenha is not null) return (erroSenha, dados);
        }
        return (null, dados);
    }

    // Já existe outro usuário ATIVO com este e-mail?
    private static async Task<bool> EmailEmUso(MySqlConnection db, string email, int idIgnorado = 0) =>
        await db.ExecuteScalarAsync<int>(
            "SELECT COUNT(*) FROM usuarios WHERE email = @Email AND ativo = 1 AND id <> @Id",
            new { Email = email, Id = idIgnorado }) > 0;

    public static void MapUsuarios(this WebApplication app)
    {
        var usuarios = app.MapGroup("/api/usuarios").RequireAuthorization(Politicas.Admin);

        usuarios.MapGet("/", async (Banco banco) =>
        {
            await using var db = banco.Abrir();
            return Results.Ok(await db.QueryAsync<Usuario>(
                $"SELECT {Colunas} FROM usuarios WHERE ativo = 1 ORDER BY nome"));
        });

        usuarios.MapGet("/{id:int}", async (int id, Banco banco) =>
        {
            await using var db = banco.Abrir();
            var usuario = await db.QueryFirstOrDefaultAsync<Usuario>(
                $"SELECT {Colunas} FROM usuarios WHERE id = @Id AND ativo = 1", new { Id = id });
            return usuario is null ? Results.NotFound() : Results.Ok(usuario);
        });

        usuarios.MapPost("/", async (UsuarioEntrada entrada, Banco banco) =>
        {
            var (erro, dados) = Validar(entrada, senhaObrigatoria: true);
            if (erro is not null) return Results.BadRequest(new { erro });

            await using var db = banco.Abrir();
            if (await EmailEmUso(db, dados.Email!))
                return Results.Conflict(new { erro = "Já existe um usuário com este e-mail." });

            var id = await db.ExecuteScalarAsync<int>("""
                INSERT INTO usuarios (nome, email, senha_hash, perfil, curso)
                VALUES (@Nome, @Email, @SenhaHash, @Perfil, @Curso);
                SELECT LAST_INSERT_ID();
                """, new { dados.Nome, dados.Email, SenhaHash = Senhas.Gerar(dados.Senha!), dados.Perfil, dados.Curso });

            var criado = await db.QueryFirstAsync<Usuario>($"SELECT {Colunas} FROM usuarios WHERE id = @Id", new { Id = id });
            return Results.Created($"/api/usuarios/{id}", criado);
        });

        // Senha vazia no corpo = mantém a senha atual
        usuarios.MapPut("/{id:int}", async (int id, UsuarioEntrada entrada, Banco banco, ClaimsPrincipal eu) =>
        {
            var (erro, dados) = Validar(entrada, senhaObrigatoria: false);
            if (erro is not null) return Results.BadRequest(new { erro });

            // evita que o admin se tranque fora do sistema
            if (Sessao.IdDoUsuario(eu) == id && dados.Perfil != Perfis.Admin)
                return Results.BadRequest(new { erro = "Você não pode tirar o seu próprio perfil de administrador." });

            await using var db = banco.Abrir();
            if (await EmailEmUso(db, dados.Email!, id))
                return Results.Conflict(new { erro = "Já existe um usuário com este e-mail." });

            var trocarSenha = !string.IsNullOrEmpty(dados.Senha);
            var linhas = await db.ExecuteAsync($"""
                UPDATE usuarios SET nome = @Nome, email = @Email, perfil = @Perfil, curso = @Curso
                    {(trocarSenha ? ", senha_hash = @SenhaHash" : "")}
                WHERE id = @Id AND ativo = 1
                """, new { dados.Nome, dados.Email, dados.Perfil, dados.Curso,
                           SenhaHash = trocarSenha ? Senhas.Gerar(dados.Senha!) : null, Id = id });
            return linhas == 0 ? Results.NotFound() : Results.NoContent();
        });

        // Exclui (ativo = 0). O usuário perde o acesso na hora, mesmo com a sessão aberta.
        usuarios.MapDelete("/{id:int}", async (int id, Banco banco, ClaimsPrincipal eu) =>
        {
            if (Sessao.IdDoUsuario(eu) == id)
                return Results.BadRequest(new { erro = "Você não pode excluir a sua própria conta." });

            await using var db = banco.Abrir();
            var linhas = await db.ExecuteAsync(
                "UPDATE usuarios SET ativo = 0 WHERE id = @Id AND ativo = 1", new { Id = id });
            return linhas == 0 ? Results.NotFound() : Results.NoContent();
        });
    }
}
