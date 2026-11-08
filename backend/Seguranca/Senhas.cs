using Microsoft.AspNetCore.Identity;

namespace Api.Seguranca;

// Hash de senhas com o PasswordHasher do próprio ASP.NET Core (PBKDF2 + salt aleatório).
// Já vem no .NET: nenhum pacote extra. A senha em texto nunca é guardada.
public static class Senhas
{
    public const int TamanhoMinimo = 8;

    private static readonly PasswordHasher<object> Hasher = new();
    private static readonly object Dono = new();

    public static string Gerar(string senha) => Hasher.HashPassword(Dono, senha);

    public static bool Confere(string hash, string senha) =>
        Hasher.VerifyHashedPassword(Dono, hash, senha) != PasswordVerificationResult.Failed;

    // Usado quando o e-mail não existe: confere contra um hash qualquer para a resposta
    // demorar o mesmo tempo, e ninguém descobrir pelo tempo quais e-mails estão cadastrados.
    public static readonly string HashFalso = Gerar("senha-que-ninguem-usa-" + Guid.NewGuid());

    // Mensagem de erro, ou null se a senha for aceitável
    public static string? Validar(string? senha) =>
        string.IsNullOrWhiteSpace(senha) || senha.Length < TamanhoMinimo
            ? $"A senha precisa ter pelo menos {TamanhoMinimo} caracteres."
            : null;
}
