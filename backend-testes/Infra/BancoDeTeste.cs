using Dapper;
using MySqlConnector;

namespace Api.Testes.Infra;

// Banco MySQL DESCARTÁVEL, só para os testes (serviço "banco-teste" do compose.testes.yaml,
// ou o MySQL do GitHub Actions). Os testes rodam o schema.sql, que começa com DROP TABLE:
// por isso há uma trava que se recusa a rodar fora de um servidor local.
// O banco de verdade (alwaysdata) NUNCA é usado aqui: os testes nem leem o .env.
public static class BancoDeTeste
{
    public const string Variavel = "TESTE_BANCO";

    private static readonly string[] ServidoresPermitidos = ["localhost", "127.0.0.1", "banco-teste"];

    // Pasta raiz do projeto (a que tem o compose.yaml)
    public static string Projeto { get; } = AcharProjeto();

    private static string AcharProjeto()
    {
        var pasta = new DirectoryInfo(AppContext.BaseDirectory);
        while (pasta is not null && !File.Exists(Path.Combine(pasta.FullName, "compose.yaml")))
            pasta = pasta.Parent;
        return pasta?.FullName ?? throw new InvalidOperationException("Não achei a raiz do projeto (compose.yaml).");
    }

    public static string Arquivo(params string[] partes) => Path.Combine([Projeto, .. partes]);

    // Conexão com o servidor de teste, sem banco escolhido
    public static string Servidor()
    {
        var texto = Environment.GetEnvironmentVariable(Variavel);
        if (string.IsNullOrWhiteSpace(texto))
            throw new InvalidOperationException(
                $"Variável {Variavel} não definida. Rode os testes com: docker compose -f compose.testes.yaml run --rm testes-api");

        var conexao = new MySqlConnectionStringBuilder(texto);
        if (!ServidoresPermitidos.Contains(conexao.Server.ToLowerInvariant()))
            throw new InvalidOperationException(
                $"Recusado: os testes apagam e recriam tabelas e só rodam num MySQL local de teste, não em '{conexao.Server}'.");
        conexao.Database = "";
        conexao.AllowPublicKeyRetrieval = true;
        return conexao.ConnectionString;
    }

    // Cria (ou recria do zero) um banco "teste_<nome>" e devolve a connection string dele
    public static async Task<string> CriarAsync(string nome, bool rodarSchema = true)
    {
        var banco = "teste_" + nome;
        await using (var servidor = new MySqlConnection(Servidor()))
        {
            await servidor.ExecuteAsync($"DROP DATABASE IF EXISTS `{banco}`; CREATE DATABASE `{banco}` CHARACTER SET utf8mb4;");
        }

        var conexao = new MySqlConnectionStringBuilder(Servidor()) { Database = banco }.ConnectionString;
        if (rodarSchema) await RodarScriptAsync(conexao, Arquivo("banco", "schema.sql"));
        return conexao;
    }

    public static async Task RodarScriptAsync(string conexao, string arquivo)
    {
        await using var db = new MySqlConnection(conexao);
        await db.ExecuteAsync(await File.ReadAllTextAsync(arquivo));
    }
}
