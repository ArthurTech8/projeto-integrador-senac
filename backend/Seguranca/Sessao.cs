using System.Security.Claims;
using Api.Models;
using Microsoft.AspNetCore.Authentication.Cookies;

namespace Api.Seguranca;

// O que vai dentro do cookie de sessão (criptografado pelo ASP.NET).
// Guardamos só o id e o perfil; os dados atuais são sempre relidos do banco.
public static class Sessao
{
    public const string NomeCookie = "mural_sessao";

    public static ClaimsPrincipal Criar(Usuario usuario)
    {
        var dados = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
            new(ClaimTypes.Name, usuario.Nome),
            new(ClaimTypes.Role, usuario.Perfil)
        };
        var identidade = new ClaimsIdentity(dados, CookieAuthenticationDefaults.AuthenticationScheme);
        return new ClaimsPrincipal(identidade);
    }

    public static int? IdDoUsuario(ClaimsPrincipal usuario) =>
        int.TryParse(usuario.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;
}
