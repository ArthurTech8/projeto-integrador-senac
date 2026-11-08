using Api.Infra;
using Dapper;
using MySqlConnector;

namespace Api.Seguranca;

// Cria o PRIMEIRO administrador quando a API sobe, se ainda não existir nenhum admin ativo.
// Os dados vêm do .env (nunca do código):
//   AdminInicial__Email=...   AdminInicial__Senha=...   AdminInicial__Nome=...
// Depois que o admin existe, estas chaves são ignoradas (podem até ser apagadas do .env).
public static class AdminInicial
{
    public static async Task GarantirAsync(Banco banco, IConfiguration config, ILogger log)
    {
        try
        {
            await using var db = banco.Abrir();
            var admins = await db.ExecuteScalarAsync<int>(
                "SELECT COUNT(*) FROM usuarios WHERE perfil = @Perfil AND ativo = 1", new { Perfil = Perfis.Admin });
            if (admins > 0) return;

            var email = config["AdminInicial:Email"]?.Trim().ToLowerInvariant();
            var senha = config["AdminInicial:Senha"];
            var nome = config["AdminInicial:Nome"]?.Trim();
            if (string.IsNullOrWhiteSpace(email) || Senhas.Validar(senha) is not null)
            {
                log.LogWarning("Nenhum administrador cadastrado. Defina AdminInicial__Email e AdminInicial__Senha " +
                               "(mínimo {Minimo} caracteres) no .env e reinicie a API.", Senhas.TamanhoMinimo);
                return;
            }

            var emUso = await db.ExecuteScalarAsync<int>(
                "SELECT COUNT(*) FROM usuarios WHERE email = @Email AND ativo = 1", new { Email = email });
            if (emUso > 0)
            {
                log.LogWarning("O e-mail de AdminInicial já pertence a um usuário que não é admin. Use outro e-mail.");
                return;
            }

            await db.ExecuteAsync("""
                INSERT INTO usuarios (nome, email, senha_hash, perfil)
                VALUES (@Nome, @Email, @SenhaHash, @Perfil)
                """, new { Nome = string.IsNullOrWhiteSpace(nome) ? "Administrador" : nome, Email = email,
                           SenhaHash = Senhas.Gerar(senha!), Perfil = Perfis.Admin });
            log.LogInformation("Administrador inicial criado: {Email}", email);
        }
        catch (MySqlException erro)
        {
            // Ex.: a migração 002 ainda não foi rodada. A API sobe mesmo assim (o mural público funciona).
            log.LogError("Não foi possível verificar o administrador inicial: {Mensagem}. " +
                         "A tabela usuarios existe? Rode banco/migracoes/002_usuarios.sql.", erro.Message);
        }
    }
}
