using Api.Infra;
using Api.Models;
using Api.Seguranca;
using Dapper;

namespace Api.Endpoints;

// Rotas de avisos.
// Leitura: pública (o mural continua aberto). Criar, editar e excluir: só a equipe (admin ou editor).
//
// EXCLUSÃO LÓGICA: para quem usa o sistema, "Excluir" apaga o aviso.
// No banco, porém, nada é apagado: a linha fica com ativo = 0 e a API passa a tratá-la
// como inexistente (todas as consultas filtram ativo = 1).
public static class AvisosEndpoints
{
    private const string Colunas = """
        id, titulo, resumo, descricao, categoria, curso, data_inicio, data_fim,
        localizacao, link, empresa, carga_horaria, modalidade, certificado, vagas,
        urgente, publicado_em
        """;

    private static readonly string[] CategoriasValidas = ["calendario", "extracurricular", "emprego", "curso"];

    // Retorna a mensagem de erro, ou null se o aviso estiver válido.
    private static string? Validar(Aviso aviso)
    {
        if (string.IsNullOrWhiteSpace(aviso.Titulo)) return "Informe o título.";
        if (string.IsNullOrWhiteSpace(aviso.Resumo)) return "Informe o resumo.";
        if (string.IsNullOrWhiteSpace(aviso.Descricao)) return "Informe a descrição.";
        if (!CategoriasValidas.Contains(aviso.Categoria)) return "Categoria inválida.";
        if (aviso.DataInicio is not null && aviso.DataFim is not null && aviso.DataFim < aviso.DataInicio)
            return "A data final não pode ser antes da data inicial.";
        if (string.IsNullOrWhiteSpace(aviso.Curso)) aviso.Curso = "Todos os cursos";
        return null;
    }

    public static void MapAvisos(this WebApplication app)
    {
        var avisos = app.MapGroup("/api/avisos");

        // Lista os avisos (não excluídos), do mais recente para o mais antigo. Público.
        avisos.MapGet("/", async (Banco banco) =>
        {
            await using var db = banco.Abrir();
            var lista = await db.QueryAsync<Aviso>(
                $"SELECT {Colunas} FROM avisos WHERE ativo = 1 ORDER BY publicado_em DESC, id DESC");
            return Results.Ok(lista);
        });

        // Busca um aviso pelo id. Excluído (ativo = 0) responde 404. Público.
        avisos.MapGet("/{id:int}", async (int id, Banco banco) =>
        {
            await using var db = banco.Abrir();
            var aviso = await db.QueryFirstOrDefaultAsync<Aviso>(
                $"SELECT {Colunas} FROM avisos WHERE id = @Id AND ativo = 1", new { Id = id });
            return aviso is null ? Results.NotFound() : Results.Ok(aviso);
        });

        // Cadastra um aviso novo. Só a equipe.
        avisos.MapPost("/", async (Aviso aviso, Banco banco) =>
        {
            var erro = Validar(aviso);
            if (erro is not null) return Results.BadRequest(new { erro });

            await using var db = banco.Abrir();
            aviso.Id = await db.ExecuteScalarAsync<int>("""
                INSERT INTO avisos (titulo, resumo, descricao, categoria, curso, data_inicio, data_fim,
                                    localizacao, link, empresa, carga_horaria, modalidade, certificado, vagas, urgente)
                VALUES (@Titulo, @Resumo, @Descricao, @Categoria, @Curso, @DataInicio, @DataFim,
                        @Localizacao, @Link, @Empresa, @CargaHoraria, @Modalidade, @Certificado, @Vagas, @Urgente);
                SELECT LAST_INSERT_ID();
                """, aviso);

            var criado = await db.QueryFirstAsync<Aviso>(
                $"SELECT {Colunas} FROM avisos WHERE id = @Id", new { aviso.Id });
            return Results.Created($"/api/avisos/{criado.Id}", criado);
        }).RequireAuthorization(Politicas.Equipe);

        // Altera um aviso existente (excluído responde 404). Só a equipe.
        avisos.MapPut("/{id:int}", async (int id, Aviso aviso, Banco banco) =>
        {
            var erro = Validar(aviso);
            if (erro is not null) return Results.BadRequest(new { erro });

            aviso.Id = id;
            await using var db = banco.Abrir();
            var linhas = await db.ExecuteAsync("""
                UPDATE avisos SET
                    titulo = @Titulo, resumo = @Resumo, descricao = @Descricao, categoria = @Categoria,
                    curso = @Curso, data_inicio = @DataInicio, data_fim = @DataFim, localizacao = @Localizacao,
                    link = @Link, empresa = @Empresa, carga_horaria = @CargaHoraria, modalidade = @Modalidade,
                    certificado = @Certificado, vagas = @Vagas, urgente = @Urgente
                WHERE id = @Id AND ativo = 1
                """, aviso);
            return linhas == 0 ? Results.NotFound() : Results.NoContent();
        }).RequireAuthorization(Politicas.Equipe);

        // Exclui um aviso: para o usuário ele some; no banco só muda o status (ativo = 0).
        // Nunca usamos DELETE FROM. Já excluído ou inexistente → 404. Só a equipe.
        avisos.MapDelete("/{id:int}", async (int id, Banco banco) =>
        {
            await using var db = banco.Abrir();
            var linhas = await db.ExecuteAsync(
                "UPDATE avisos SET ativo = 0 WHERE id = @Id AND ativo = 1", new { Id = id });
            return linhas == 0 ? Results.NotFound() : Results.NoContent();
        }).RequireAuthorization(Politicas.Equipe);
    }
}
