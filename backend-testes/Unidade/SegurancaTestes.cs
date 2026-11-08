using System.Security.Claims;
using Api.Endpoints;
using Api.Models;
using Api.Seguranca;

namespace Api.Testes.Unidade;

// Funções puras da pasta Seguranca/ (não precisam de banco).
public class SenhasTestes
{
    [Fact]
    public void Gerar_nunca_guarda_a_senha_em_texto()
    {
        var hash = Senhas.Gerar("minha-senha-123");
        Assert.DoesNotContain("minha-senha-123", hash);
        Assert.NotEqual("minha-senha-123", hash);
    }

    [Fact]
    public void Gerar_usa_salt_aleatorio_a_mesma_senha_da_hashes_diferentes()
    {
        Assert.NotEqual(Senhas.Gerar("igual-igual"), Senhas.Gerar("igual-igual"));
    }

    [Fact]
    public void Confere_aceita_a_senha_certa_e_recusa_a_errada()
    {
        var hash = Senhas.Gerar("senha-certa");
        Assert.True(Senhas.Confere(hash, "senha-certa"));
        Assert.False(Senhas.Confere(hash, "senha-errada"));
        Assert.False(Senhas.Confere(hash, "SENHA-CERTA"));
        Assert.False(Senhas.Confere(hash, ""));
    }

    [Fact]
    public void HashFalso_nao_confere_com_senhas_comuns()
    {
        foreach (var senha in new[] { "", "12345678", "senha123", "admin" })
            Assert.False(Senhas.Confere(Senhas.HashFalso, senha));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("        ")]
    [InlineData("1234567")]
    public void Validar_recusa_senha_vazia_ou_com_menos_de_8(string? senha)
    {
        Assert.Equal("A senha precisa ter pelo menos 8 caracteres.", Senhas.Validar(senha));
    }

    [Theory]
    [InlineData("12345678")]
    [InlineData("uma senha bem longa com espaços")]
    public void Validar_aceita_8_ou_mais(string senha)
    {
        Assert.Null(Senhas.Validar(senha));
        Assert.Equal(8, Senhas.TamanhoMinimo);
    }
}

public class SessaoTestes
{
    private static Usuario Ana() => new() { Id = 42, Nome = "Ana", Email = "ana@x.com", Perfil = Perfis.Editor };

    [Fact]
    public void Criar_guarda_so_id_nome_e_perfil()
    {
        var sessao = Sessao.Criar(Ana());
        Assert.True(sessao.Identity?.IsAuthenticated);
        Assert.Equal("42", sessao.FindFirstValue(ClaimTypes.NameIdentifier));
        Assert.Equal("Ana", sessao.FindFirstValue(ClaimTypes.Name));
        Assert.Equal("editor", sessao.FindFirstValue(ClaimTypes.Role));
        Assert.Null(sessao.FindFirstValue(ClaimTypes.Email));
    }

    [Fact]
    public void IdDoUsuario_le_o_id_ou_devolve_null()
    {
        Assert.Equal(42, Sessao.IdDoUsuario(Sessao.Criar(Ana())));
        Assert.Null(Sessao.IdDoUsuario(new ClaimsPrincipal(new ClaimsIdentity())));
        var invalido = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, "abc")]));
        Assert.Null(Sessao.IdDoUsuario(invalido));
    }

    [Fact]
    public void O_cookie_se_chama_mural_sessao()
    {
        Assert.Equal("mural_sessao", Sessao.NomeCookie);
    }
}

public class PerfisTestes
{
    [Fact]
    public void Perfis_e_politicas_seguem_a_exigencia_5()
    {
        Assert.Equal(["admin", "editor", "aluno"], Perfis.Todos);
        Assert.Equal(["admin", "editor"], Perfis.Equipe);
        Assert.Equal(["Logado", "Equipe", "Admin"], new[] { Politicas.Logado, Politicas.Equipe, Politicas.Admin });
    }

    [Fact]
    public void PerfilAtivoRequisito_guarda_os_perfis_aceitos()
    {
        Assert.Equal(Perfis.Equipe, new PerfilAtivoRequisito(Perfis.Equipe).Perfis);
    }

    [Fact]
    public void LimiteLogin_responde_429()
    {
        var opcoes = new Microsoft.AspNetCore.RateLimiting.RateLimiterOptions();
        LimiteLogin.Configurar(opcoes);
        Assert.Equal(429, opcoes.RejectionStatusCode);
        Assert.Equal("login", LimiteLogin.Politica);
    }

    [Fact]
    public void SemSenha_copia_so_os_campos_publicos()
    {
        var comSenha = new UsuarioComSenha
        {
            Id = 1, Nome = "Ana", Email = "a@x.com", Perfil = "aluno", Curso = "Enfermagem",
            CriadoEm = new DateTime(2026, 11, 1), SenhaHash = "hash-secreto"
        };
        var publico = AuthEndpoints.SemSenha(comSenha);
        Assert.IsNotType<UsuarioComSenha>(publico);
        Assert.Equal((1, "Ana", "a@x.com", "aluno", "Enfermagem"), (publico.Id, publico.Nome, publico.Email, publico.Perfil, publico.Curso));
        Assert.Equal(comSenha.CriadoEm, publico.CriadoEm);
    }
}
