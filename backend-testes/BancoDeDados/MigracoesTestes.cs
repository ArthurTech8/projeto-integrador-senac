using Api.Testes.Infra;
using Dapper;
using MySqlConnector;

namespace Api.Testes.BancoDeDados;

// O schema.sql (banco novo) e as migrações (banco antigo atualizado) têm que dar no MESMO banco.
// Se alguém mudar o schema.sql e esquecer a migração (ou o contrário), este teste falha.
public class MigracoesTestes
{
    private static async Task<List<string>> EstruturaAsync(string conexao)
    {
        await using var db = new MySqlConnection(conexao);
        var colunas = await db.QueryAsync<string>("""
            SELECT CONCAT_WS(' | ', table_name, ordinal_position, column_name, column_type, is_nullable, IFNULL(column_default, 'NULL'))
            FROM information_schema.columns WHERE table_schema = DATABASE() ORDER BY table_name, ordinal_position
            """);
        var checks = await db.QueryAsync<string>("""
            SELECT CONCAT_WS(' | ', constraint_name, check_clause)
            FROM information_schema.check_constraints WHERE constraint_schema = DATABASE() ORDER BY constraint_name
            """);
        var indices = await db.QueryAsync<string>("""
            SELECT CONCAT_WS(' | ', table_name, index_name, column_name, non_unique)
            FROM information_schema.statistics WHERE table_schema = DATABASE() ORDER BY table_name, index_name, seq_in_index
            """);
        return [.. colunas, .. checks, .. indices];
    }

    [Fact]
    public async Task Migracoes_levam_um_banco_antigo_ao_mesmo_formato_do_schema()
    {
        var novo = await BancoDeTeste.CriarAsync("schema_novo");

        // banco antigo = como era antes da migração 001: avisos sem "ativo" e sem a tabela usuarios
        var antigo = await BancoDeTeste.CriarAsync("schema_antigo");
        await using (var db = new MySqlConnection(antigo))
        {
            await db.ExecuteAsync("DROP TABLE usuarios; ALTER TABLE avisos DROP COLUMN ativo;");
        }

        var migracoes = Directory.GetFiles(BancoDeTeste.Arquivo("banco", "migracoes"), "*.sql").Order().ToList();
        Assert.NotEmpty(migracoes);
        foreach (var migracao in migracoes) await BancoDeTeste.RodarScriptAsync(antigo, migracao);

        Assert.Equal(await EstruturaAsync(novo), await EstruturaAsync(antigo));
    }

    [Fact]
    public async Task Migracao_001_mantem_todos_os_avisos_ativos()
    {
        var antigo = await BancoDeTeste.CriarAsync("migracao_001");
        await using var db = new MySqlConnection(antigo);
        var antes = await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM avisos");
        await db.ExecuteAsync("ALTER TABLE avisos DROP COLUMN ativo;");

        await BancoDeTeste.RodarScriptAsync(antigo, BancoDeTeste.Arquivo("banco", "migracoes", "001_avisos_ativo.sql"));

        Assert.Equal(antes, await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM avisos WHERE ativo = 1"));
    }

    [Fact]
    public async Task Schema_recria_as_tabelas_com_os_avisos_de_exemplo()
    {
        var conexao = await BancoDeTeste.CriarAsync("schema_exemplos");
        await using var db = new MySqlConnection(conexao);
        var porCategoria = (await db.QueryAsync<(string Categoria, int Total)>(
            "SELECT categoria, COUNT(*) FROM avisos GROUP BY categoria")).ToDictionary(x => x.Categoria, x => x.Total);
        Assert.Equal(4, porCategoria.Count);
        Assert.All(porCategoria.Values, total => Assert.True(total > 0));
        Assert.Equal(0, await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM usuarios"));

        // o CHECK do banco barra categoria e perfil inválidos
        await Assert.ThrowsAsync<MySqlException>(() => db.ExecuteAsync(
            "INSERT INTO avisos (titulo, resumo, descricao, categoria) VALUES ('t', 'r', 'd', 'festa')"));
        await Assert.ThrowsAsync<MySqlException>(() => db.ExecuteAsync(
            "INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES ('n', 'e', 'h', 'dono')"));
    }
}
