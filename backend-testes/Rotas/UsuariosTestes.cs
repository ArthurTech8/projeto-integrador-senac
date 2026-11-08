using System.Net;
using System.Net.Http.Json;
using Api.Testes.Infra;

namespace Api.Testes.Rotas;

// Cadastro de usuários, só admin (Endpoints/UsuariosEndpoints.cs). Exigências 4 e 5.
[Collection("Api")]
public class UsuariosTestes(ApiDeTeste api)
{
    private static object Novo(string? email = null, string perfil = "editor", string? curso = null, string? senha = "senha-inicial-1",
        string nome = "Pessoa Nova") =>
        new { nome, email = email ?? $"nova-{Guid.NewGuid():N}@teste.local", perfil, curso, senha };

    // ---------- Quem pode ----------

    [Theory]
    [Trait("Rota", "GET /api/usuarios"), Trait("Rota", "GET /api/usuarios/{id}"), Trait("Rota", "POST /api/usuarios")]
    [Trait("Rota", "PUT /api/usuarios/{id}"), Trait("Rota", "DELETE /api/usuarios/{id}")]
    [InlineData("editor")]
    [InlineData("aluno")]
    public async Task So_admin_mexe_em_usuarios(string perfil)
    {
        var (cliente, eu, _) = await api.NovoUsuarioAsync(perfil);
        await (await cliente.GetAsync("/api/usuarios")).AssertStatusAsync(HttpStatusCode.Forbidden);
        await (await cliente.GetAsync($"/api/usuarios/{eu.Id}")).AssertStatusAsync(HttpStatusCode.Forbidden);
        await (await cliente.PostAsJsonAsync("/api/usuarios", Novo())).AssertStatusAsync(HttpStatusCode.Forbidden);
        await (await cliente.PutAsJsonAsync($"/api/usuarios/{eu.Id}", Novo(perfil: "admin"))).AssertStatusAsync(HttpStatusCode.Forbidden);
        await (await cliente.DeleteAsync($"/api/usuarios/{eu.Id}")).AssertStatusAsync(HttpStatusCode.Forbidden);

        var anonimo = api.Cliente();
        await (await anonimo.GetAsync("/api/usuarios")).AssertStatusAsync(HttpStatusCode.Unauthorized);
        await (await anonimo.PostAsJsonAsync("/api/usuarios", Novo())).AssertStatusAsync(HttpStatusCode.Unauthorized);
    }

    // ---------- Listar e buscar ----------

    [Fact, Trait("Rota", "GET /api/usuarios")]
    public async Task Admin_lista_em_ordem_de_nome_sem_senha_nem_ativo()
    {
        var admin = await api.AdminAsync();
        await admin.PostAsJsonAsync("/api/usuarios", Novo(nome: "Zuleica"));
        await admin.PostAsJsonAsync("/api/usuarios", Novo(nome: "Abel"));

        var resposta = await admin.GetAsync("/api/usuarios");
        await resposta.AssertStatusAsync(HttpStatusCode.OK);
        var lista = await resposta.LerAsync();
        var nomes = lista.EnumerateArray().Select(u => u.GetProperty("nome").GetString()!).ToList();
        Assert.True(nomes.IndexOf("Abel") < nomes.IndexOf("Zuleica"), "a lista vem em ordem de nome");
        Assert.Equal(["criadoEm", "curso", "email", "id", "nome", "perfil"], Json.Campos(lista).OrderBy(c => c, StringComparer.Ordinal));
    }

    [Fact, Trait("Rota", "GET /api/usuarios/{id}")]
    public async Task Admin_busca_por_id_e_inexistente_responde_404()
    {
        var (_, usuario, _) = await api.NovoUsuarioAsync("aluno", "Design Gráfico");
        var admin = await api.AdminAsync();
        var resposta = await admin.GetAsync($"/api/usuarios/{usuario.Id}");
        await resposta.AssertStatusAsync(HttpStatusCode.OK);
        Assert.Equal("Design Gráfico", (await resposta.LerAsync()).GetProperty("curso").GetString());
        await (await admin.GetAsync("/api/usuarios/999999")).AssertStatusAsync(HttpStatusCode.NotFound);
    }

    // ---------- Cadastrar ----------

    [Fact, Trait("Rota", "POST /api/usuarios")]
    public async Task Cadastro_limpa_os_dados_e_quem_nao_e_aluno_fica_sem_curso()
    {
        var admin = await api.AdminAsync();
        var email = $"  Maria.{Guid.NewGuid():N}@Teste.LOCAL ";
        var resposta = await admin.PostAsJsonAsync("/api/usuarios", Novo(email, "EDITOR", "Enfermagem", nome: "  Maria  "));
        await resposta.AssertStatusAsync(HttpStatusCode.Created);

        var criado = await resposta.LerAsync();
        var id = criado.GetProperty("id").GetInt32();
        Assert.Equal($"/api/usuarios/{id}", resposta.Headers.Location?.OriginalString);
        Assert.Equal("Maria", criado.GetProperty("nome").GetString());
        Assert.Equal(email.Trim().ToLowerInvariant(), criado.GetProperty("email").GetString());
        Assert.Equal("editor", criado.GetProperty("perfil").GetString());
        Assert.Equal(System.Text.Json.JsonValueKind.Null, criado.GetProperty("curso").ValueKind);

        // a senha vai para o banco só como hash
        var hash = await api.ConsultarAsync<string>("SELECT senha_hash FROM usuarios WHERE id = @id", new { id });
        Assert.NotEqual("senha-inicial-1", hash);
        Assert.True(Api.Seguranca.Senhas.Confere(hash!, "senha-inicial-1"));
    }

    public static TheoryData<object, string> CadastrosInvalidos => new()
    {
        { Novo(nome: "   "), "Informe o nome." },
        { Novo(email: "sem-arroba"), "E-mail inválido." },
        { Novo(email: "Nome <nome@teste.local>"), "E-mail inválido." },
        { Novo(perfil: "dono"), "Perfil inválido." },
        { Novo(perfil: "aluno", curso: null), "Informe o curso do aluno." },
        { Novo(senha: "curta"), "A senha precisa ter pelo menos 8 caracteres." },
        { Novo(senha: null), "A senha precisa ter pelo menos 8 caracteres." }
    };

    [Theory, Trait("Rota", "POST /api/usuarios")]
    [MemberData(nameof(CadastrosInvalidos))]
    public async Task Cadastro_invalido_responde_400_com_a_mensagem(object corpo, string mensagem)
    {
        var admin = await api.AdminAsync();
        var resposta = await admin.PostAsJsonAsync("/api/usuarios", corpo);
        await resposta.AssertStatusAsync(HttpStatusCode.BadRequest);
        Assert.Equal(mensagem, await resposta.ErroAsync());
    }

    [Fact, Trait("Rota", "POST /api/usuarios")]
    public async Task Email_repetido_responde_409_mesmo_com_maiusculas()
    {
        var admin = await api.AdminAsync();
        var email = $"repetido-{Guid.NewGuid():N}@teste.local";
        await (await admin.PostAsJsonAsync("/api/usuarios", Novo(email))).AssertStatusAsync(HttpStatusCode.Created);
        var resposta = await admin.PostAsJsonAsync("/api/usuarios", Novo(email.ToUpperInvariant()));
        await resposta.AssertStatusAsync(HttpStatusCode.Conflict);
        Assert.Equal("Já existe um usuário com este e-mail.", await resposta.ErroAsync());
    }

    // ---------- Alterar ----------

    [Fact, Trait("Rota", "PUT /api/usuarios/{id}")]
    public async Task Senha_vazia_mantem_a_atual_e_senha_nova_troca()
    {
        var (_, usuario, senha) = await api.NovoUsuarioAsync("editor");
        var admin = await api.AdminAsync();

        await (await admin.PutAsJsonAsync($"/api/usuarios/{usuario.Id}", Novo(usuario.Email, nome: "Nome Alterado", senha: "")))
            .AssertStatusAsync(HttpStatusCode.NoContent);
        await api.LogadoAsync(usuario.Email, senha);
        var alterado = await (await admin.GetAsync($"/api/usuarios/{usuario.Id}")).LerAsync();
        Assert.Equal("Nome Alterado", alterado.GetProperty("nome").GetString());

        await (await admin.PutAsJsonAsync($"/api/usuarios/{usuario.Id}", Novo(usuario.Email, senha: "trocada-pelo-admin")))
            .AssertStatusAsync(HttpStatusCode.NoContent);
        await api.LogadoAsync(usuario.Email, "trocada-pelo-admin");
    }

    [Fact, Trait("Rota", "PUT /api/usuarios/{id}")]
    public async Task Mudar_o_perfil_vale_na_hora_mesmo_com_a_sessao_aberta()
    {
        var (editor, usuario, _) = await api.NovoUsuarioAsync("editor");
        await (await editor.PostAsJsonAsync("/api/avisos", Json.Aviso())).AssertStatusAsync(HttpStatusCode.Created);

        var admin = await api.AdminAsync();
        await (await admin.PutAsJsonAsync($"/api/usuarios/{usuario.Id}", Novo(usuario.Email, "aluno", "Enfermagem", senha: "")))
            .AssertStatusAsync(HttpStatusCode.NoContent);

        await (await editor.PostAsJsonAsync("/api/avisos", Json.Aviso())).AssertStatusAsync(HttpStatusCode.Forbidden);
    }

    [Fact, Trait("Rota", "PUT /api/usuarios/{id}")]
    public async Task Alterar_com_email_de_outro_409_inexistente_404_e_invalido_400()
    {
        var (_, primeiro, _) = await api.NovoUsuarioAsync("editor");
        var (_, segundo, _) = await api.NovoUsuarioAsync("editor");
        var admin = await api.AdminAsync();

        await (await admin.PutAsJsonAsync($"/api/usuarios/{segundo.Id}", Novo(primeiro.Email, senha: "")))
            .AssertStatusAsync(HttpStatusCode.Conflict);
        // manter o próprio e-mail não é conflito
        await (await admin.PutAsJsonAsync($"/api/usuarios/{segundo.Id}", Novo(segundo.Email, senha: "")))
            .AssertStatusAsync(HttpStatusCode.NoContent);
        await (await admin.PutAsJsonAsync("/api/usuarios/999999", Novo(senha: ""))).AssertStatusAsync(HttpStatusCode.NotFound);
        await (await admin.PutAsJsonAsync($"/api/usuarios/{segundo.Id}", Novo(segundo.Email, senha: "curta")))
            .AssertStatusAsync(HttpStatusCode.BadRequest);
    }

    [Fact, Trait("Rota", "PUT /api/usuarios/{id}")]
    public async Task Admin_nao_pode_tirar_o_proprio_perfil_de_admin()
    {
        var (admin, eu, _) = await api.NovoUsuarioAsync("admin");
        var resposta = await admin.PutAsJsonAsync($"/api/usuarios/{eu.Id}", Novo(eu.Email, "editor", senha: ""));
        await resposta.AssertStatusAsync(HttpStatusCode.BadRequest);
        Assert.Equal("Você não pode tirar o seu próprio perfil de administrador.", await resposta.ErroAsync());
        // mudar o próprio nome continua permitido
        await (await admin.PutAsJsonAsync($"/api/usuarios/{eu.Id}", Novo(eu.Email, "admin", nome: "Outro Nome", senha: "")))
            .AssertStatusAsync(HttpStatusCode.NoContent);
    }

    // ---------- Excluir (exclusão lógica) ----------

    [Fact, Trait("Rota", "DELETE /api/usuarios/{id}")]
    public async Task Excluir_some_para_o_usuario_mas_no_banco_so_vira_ativo_0()
    {
        var (_, usuario, _) = await api.NovoUsuarioAsync("aluno");
        var admin = await api.AdminAsync();

        await (await admin.DeleteAsync($"/api/usuarios/{usuario.Id}")).AssertStatusAsync(HttpStatusCode.NoContent);
        await (await admin.GetAsync($"/api/usuarios/{usuario.Id}")).AssertStatusAsync(HttpStatusCode.NotFound);
        await (await admin.DeleteAsync($"/api/usuarios/{usuario.Id}")).AssertStatusAsync(HttpStatusCode.NotFound);
        await (await admin.PutAsJsonAsync($"/api/usuarios/{usuario.Id}", Novo(usuario.Email, senha: ""))).AssertStatusAsync(HttpStatusCode.NotFound);
        var lista = await (await admin.GetAsync("/api/usuarios")).LerAsync();
        Assert.DoesNotContain(lista.EnumerateArray(), u => u.GetProperty("id").GetInt32() == usuario.Id);

        Assert.Equal(0, await api.ConsultarAsync<int?>("SELECT ativo FROM usuarios WHERE id = @Id", new { usuario.Id }));
    }

    [Fact, Trait("Rota", "DELETE /api/usuarios/{id}")]
    public async Task Email_de_usuario_excluido_pode_ser_usado_de_novo()
    {
        var (_, usuario, _) = await api.NovoUsuarioAsync("editor");
        var admin = await api.AdminAsync();
        await (await admin.DeleteAsync($"/api/usuarios/{usuario.Id}")).AssertStatusAsync(HttpStatusCode.NoContent);
        await (await admin.PostAsJsonAsync("/api/usuarios", Novo(usuario.Email))).AssertStatusAsync(HttpStatusCode.Created);
    }

    [Fact, Trait("Rota", "DELETE /api/usuarios/{id}")]
    public async Task Admin_nao_pode_excluir_a_propria_conta()
    {
        var (admin, eu, _) = await api.NovoUsuarioAsync("admin");
        var resposta = await admin.DeleteAsync($"/api/usuarios/{eu.Id}");
        await resposta.AssertStatusAsync(HttpStatusCode.BadRequest);
        Assert.Equal("Você não pode excluir a sua própria conta.", await resposta.ErroAsync());
        await (await admin.GetAsync("/api/auth/eu")).AssertStatusAsync(HttpStatusCode.OK);
    }
}
