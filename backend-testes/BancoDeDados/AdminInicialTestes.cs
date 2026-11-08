using BancoDaApi = Api.Infra.Banco;
using Api.Seguranca;
using Api.Testes.Infra;
using Dapper;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using MySqlConnector;

namespace Api.Testes.BancoDeDados;

// Criação do primeiro administrador a partir do .env (Seguranca/AdminInicial.cs).
// Cada teste usa um banco novo, sem nenhum admin.
public class AdminInicialTestes
{
    private static IConfiguration Config(string? email, string? senha, string? nome = null) =>
        new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["AdminInicial:Email"] = email, ["AdminInicial:Senha"] = senha, ["AdminInicial:Nome"] = nome
        }).Build();

    private static async Task<int> AdminsAsync(string conexao)
    {
        await using var db = new MySqlConnection(conexao);
        return await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM usuarios WHERE perfil = 'admin' AND ativo = 1");
    }

    [Fact]
    public async Task Cria_o_admin_com_email_limpo_senha_em_hash_e_nome_padrao()
    {
        var conexao = await BancoDeTeste.CriarAsync("admin_cria");
        await AdminInicial.GarantirAsync(new BancoDaApi(conexao), Config("  Chefe@Senac.COM ", "senha-do-chefe"), NullLogger.Instance);

        await using var db = new MySqlConnection(conexao);
        var admin = await db.QuerySingleAsync<(string Nome, string Email, string SenhaHash)>(
            "SELECT nome, email, senha_hash FROM usuarios WHERE perfil = 'admin'");
        Assert.Equal("Administrador", admin.Nome);
        Assert.Equal("chefe@senac.com", admin.Email);
        Assert.True(Senhas.Confere(admin.SenhaHash, "senha-do-chefe"));
    }

    [Fact]
    public async Task Nao_cria_um_segundo_admin_quando_ja_existe()
    {
        var conexao = await BancoDeTeste.CriarAsync("admin_unico");
        var banco = new BancoDaApi(conexao);
        await AdminInicial.GarantirAsync(banco, Config("um@x.com", "senha-segura-1", "Um"), NullLogger.Instance);
        await AdminInicial.GarantirAsync(banco, Config("dois@x.com", "senha-segura-2", "Dois"), NullLogger.Instance);
        Assert.Equal(1, await AdminsAsync(conexao));
    }

    [Theory]
    [InlineData(null, "senha-segura-1")]
    [InlineData("  ", "senha-segura-1")]
    [InlineData("chefe@x.com", null)]
    [InlineData("chefe@x.com", "curta")]
    public async Task Sem_email_ou_com_senha_fraca_nao_cria(string? email, string? senha)
    {
        var conexao = await BancoDeTeste.CriarAsync("admin_invalido");
        await AdminInicial.GarantirAsync(new BancoDaApi(conexao), Config(email, senha), NullLogger.Instance);
        Assert.Equal(0, await AdminsAsync(conexao));
    }

    [Fact]
    public async Task Email_ja_usado_por_quem_nao_e_admin_nao_cria()
    {
        var conexao = await BancoDeTeste.CriarAsync("admin_email_usado");
        await using (var db = new MySqlConnection(conexao))
        {
            await db.ExecuteAsync("INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES ('Ed', 'chefe@x.com', 'x', 'editor')");
        }
        await AdminInicial.GarantirAsync(new BancoDaApi(conexao), Config("chefe@x.com", "senha-segura-1"), NullLogger.Instance);
        Assert.Equal(0, await AdminsAsync(conexao));
    }

    [Fact]
    public async Task Sem_a_tabela_usuarios_a_API_sobe_mesmo_assim()
    {
        // banco antigo, antes da migração 002
        var conexao = await BancoDeTeste.CriarAsync("admin_sem_tabela", rodarSchema: false);
        var erro = await Record.ExceptionAsync(() =>
            AdminInicial.GarantirAsync(new BancoDaApi(conexao), Config("chefe@x.com", "senha-segura-1"), NullLogger.Instance));
        Assert.Null(erro);
    }
}
