namespace Api.Models;

// Usuário como a API devolve no JSON. A senha (nem o hash) NUNCA sai da API.
public class Usuario
{
    public int Id { get; set; }
    public string Nome { get; set; } = "";
    public string Email { get; set; } = "";
    // admin | editor | aluno
    public string Perfil { get; set; } = "";
    // curso do aluno (null para admin/editor)
    public string? Curso { get; set; }
    public DateTime CriadoEm { get; set; }
}

// Linha completa do banco, usada só dentro da API para conferir a senha no login.
public class UsuarioComSenha : Usuario
{
    public string SenhaHash { get; set; } = "";
}

// Corpo de POST /api/auth/entrar
public record EntradaLogin(string? Email, string? Senha);

// Corpo de POST/PUT /api/usuarios. No PUT, Senha vazia = manter a atual.
public record UsuarioEntrada(string? Nome, string? Email, string? Perfil, string? Curso, string? Senha);

// Corpo de PUT /api/conta/senha
public record TrocaSenha(string? SenhaAtual, string? NovaSenha);
