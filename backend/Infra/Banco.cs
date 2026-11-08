using MySqlConnector;

namespace Api.Infra;

// Guarda a connection string (vinda do .env) e abre uma conexão nova a cada pedido.
// Registrado uma vez no Program.cs; as rotas recebem "Banco banco" como parâmetro.
public sealed class Banco(string conexao)
{
    public MySqlConnection Abrir() => new(conexao);
}
