using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Api.Testes.Infra;

namespace Api.Testes.Rotas;

// Rotas de avisos (Endpoints/AvisosEndpoints.cs). Exigências 4 (exclusão lógica) e 5 (acesso).
// [Trait("Rota", ...)] marca qual rota cada teste cobre: o teste RegrasDoProjeto exige que toda rota tenha um.
[Collection("Api")]
public class AvisosTestes(ApiDeTeste api)
{
    private async Task<JsonElement> CriarAsync(params (string, object?)[] mudancas)
    {
        var (editor, _, _) = await api.NovoUsuarioAsync("editor");
        var resposta = await editor.PostAsJsonAsync("/api/avisos", Json.Aviso(mudancas));
        await resposta.AssertStatusAsync(HttpStatusCode.Created);
        return await resposta.LerAsync();
    }

    // ---------- Leitura (pública) ----------

    [Fact, Trait("Rota", "GET /api/avisos")]
    public async Task Listar_e_publico_e_vem_do_mais_recente_para_o_mais_antigo()
    {
        var resposta = await api.Cliente().GetAsync("/api/avisos");
        await resposta.AssertStatusAsync(HttpStatusCode.OK);
        var lista = (await resposta.LerAsync()).EnumerateArray().ToList();

        Assert.True(lista.Count >= 18, "o schema.sql traz 18 avisos de exemplo");
        var datas = lista.Select(a => a.GetProperty("publicadoEm").GetDateTime()).ToList();
        Assert.Equal(datas.OrderByDescending(d => d), datas);
    }

    [Fact, Trait("Rota", "GET /api/avisos")]
    public async Task Json_em_camelCase_e_sem_a_coluna_ativo()
    {
        var campos = Json.Campos(await (await api.Cliente().GetAsync("/api/avisos")).LerAsync());
        Assert.Contains("dataInicio", campos);
        Assert.Contains("cargaHoraria", campos);
        Assert.Contains("publicadoEm", campos);
        Assert.DoesNotContain("ativo", campos);
        Assert.DoesNotContain("data_inicio", campos);
    }

    [Fact, Trait("Rota", "GET /api/avisos/{id}")]
    public async Task Buscar_por_id_e_publico()
    {
        var criado = await CriarAsync(("titulo", "Busca por id"));
        var id = criado.GetProperty("id").GetInt32();

        var resposta = await api.Cliente().GetAsync($"/api/avisos/{id}");
        await resposta.AssertStatusAsync(HttpStatusCode.OK);
        Assert.Equal("Busca por id", (await resposta.LerAsync()).GetProperty("titulo").GetString());
    }

    [Theory, Trait("Rota", "GET /api/avisos/{id}")]
    [InlineData("/api/avisos/999999")]
    [InlineData("/api/avisos/abc")]
    public async Task Aviso_que_nao_existe_responde_404(string url)
    {
        await (await api.Cliente().GetAsync(url)).AssertStatusAsync(HttpStatusCode.NotFound);
    }

    // ---------- Criar ----------

    [Fact, Trait("Rota", "POST /api/avisos")]
    public async Task Editor_cria_aviso_201_com_Location_e_o_aviso_completo()
    {
        var (editor, _, _) = await api.NovoUsuarioAsync("editor");
        var resposta = await editor.PostAsJsonAsync("/api/avisos", Json.Aviso(("titulo", "Excel Essencial"), ("urgente", true)));
        await resposta.AssertStatusAsync(HttpStatusCode.Created);

        var aviso = await resposta.LerAsync();
        var id = aviso.GetProperty("id").GetInt32();
        Assert.True(id > 0);
        Assert.Equal($"/api/avisos/{id}", resposta.Headers.Location?.OriginalString);
        Assert.Equal("Excel Essencial", aviso.GetProperty("titulo").GetString());
        Assert.Equal("2026-12-01T00:00:00", aviso.GetProperty("dataInicio").GetString());
        Assert.Equal(8, aviso.GetProperty("cargaHoraria").GetInt32());
        Assert.True(aviso.GetProperty("urgente").GetBoolean());
        Assert.True(aviso.GetProperty("certificado").GetBoolean());
        Assert.NotEqual(default, aviso.GetProperty("publicadoEm").GetDateTime());
    }

    [Fact, Trait("Rota", "POST /api/avisos")]
    public async Task Admin_tambem_cria_aviso()
    {
        var admin = await api.AdminAsync();
        await (await admin.PostAsJsonAsync("/api/avisos", Json.Aviso())).AssertStatusAsync(HttpStatusCode.Created);
    }

    [Fact, Trait("Rota", "POST /api/avisos")]
    public async Task Criar_sem_login_401_e_aluno_403()
    {
        await (await api.Cliente().PostAsJsonAsync("/api/avisos", Json.Aviso())).AssertStatusAsync(HttpStatusCode.Unauthorized);
        var (aluno, _, _) = await api.NovoUsuarioAsync("aluno");
        await (await aluno.PostAsJsonAsync("/api/avisos", Json.Aviso())).AssertStatusAsync(HttpStatusCode.Forbidden);
    }

    public static TheoryData<string, object?, string> AvisosInvalidos => new()
    {
        { "titulo", "", "Informe o título." },
        { "titulo", "   ", "Informe o título." },
        { "resumo", "", "Informe o resumo." },
        { "descricao", null, "Informe a descrição." },
        { "categoria", "festa", "Categoria inválida." },
        { "categoria", "", "Categoria inválida." },
        { "dataFim", "2026-11-30", "A data final não pode ser antes da data inicial." }
    };

    [Theory, Trait("Rota", "POST /api/avisos")]
    [MemberData(nameof(AvisosInvalidos))]
    public async Task Criar_aviso_invalido_responde_400_com_a_mensagem(string campo, object? valor, string mensagem)
    {
        var (editor, _, _) = await api.NovoUsuarioAsync("editor");
        var resposta = await editor.PostAsJsonAsync("/api/avisos", Json.Aviso((campo, valor)));
        await resposta.AssertStatusAsync(HttpStatusCode.BadRequest);
        Assert.Equal(mensagem, await resposta.ErroAsync());
    }

    [Fact, Trait("Rota", "POST /api/avisos")]
    public async Task Curso_vazio_vira_Todos_os_cursos_e_campos_opcionais_aceitam_null()
    {
        var aviso = await CriarAsync(("curso", ""), ("dataInicio", null), ("dataFim", null), ("vagas", null), ("link", null));
        Assert.Equal("Todos os cursos", aviso.GetProperty("curso").GetString());
        Assert.Equal(JsonValueKind.Null, aviso.GetProperty("dataInicio").ValueKind);
        Assert.Equal(JsonValueKind.Null, aviso.GetProperty("vagas").ValueKind);
    }

    [Fact, Trait("Rota", "POST /api/avisos")]
    public async Task Texto_com_aspas_e_comandos_SQL_e_gravado_como_texto()
    {
        const string malicioso = "'); DROP TABLE avisos; --";
        var aviso = await CriarAsync(("titulo", malicioso));
        Assert.Equal(malicioso, aviso.GetProperty("titulo").GetString());
        await (await api.Cliente().GetAsync("/api/avisos")).AssertStatusAsync(HttpStatusCode.OK);
    }

    // ---------- Alterar ----------

    [Fact, Trait("Rota", "PUT /api/avisos/{id}")]
    public async Task Editor_altera_aviso_204_e_a_mudanca_aparece()
    {
        var id = (await CriarAsync()).GetProperty("id").GetInt32();
        var (editor, _, _) = await api.NovoUsuarioAsync("editor");

        var resposta = await editor.PutAsJsonAsync($"/api/avisos/{id}",
            Json.Aviso(("titulo", "Título novo"), ("categoria", "emprego"), ("empresa", "Nuvem Clara"), ("cargaHoraria", null)));
        await resposta.AssertStatusAsync(HttpStatusCode.NoContent);

        var aviso = await (await api.Cliente().GetAsync($"/api/avisos/{id}")).LerAsync();
        Assert.Equal("Título novo", aviso.GetProperty("titulo").GetString());
        Assert.Equal("emprego", aviso.GetProperty("categoria").GetString());
        Assert.Equal("Nuvem Clara", aviso.GetProperty("empresa").GetString());
        Assert.Equal(JsonValueKind.Null, aviso.GetProperty("cargaHoraria").ValueKind);
    }

    [Fact, Trait("Rota", "PUT /api/avisos/{id}")]
    public async Task Alterar_valida_igual_ao_criar_e_inexistente_responde_404()
    {
        var id = (await CriarAsync()).GetProperty("id").GetInt32();
        var (editor, _, _) = await api.NovoUsuarioAsync("editor");

        var invalido = await editor.PutAsJsonAsync($"/api/avisos/{id}", Json.Aviso(("titulo", "")));
        await invalido.AssertStatusAsync(HttpStatusCode.BadRequest);
        Assert.Equal("Informe o título.", await invalido.ErroAsync());

        await (await editor.PutAsJsonAsync("/api/avisos/999999", Json.Aviso())).AssertStatusAsync(HttpStatusCode.NotFound);
    }

    [Fact, Trait("Rota", "PUT /api/avisos/{id}")]
    public async Task Alterar_sem_login_401_e_aluno_403()
    {
        var id = (await CriarAsync()).GetProperty("id").GetInt32();
        await (await api.Cliente().PutAsJsonAsync($"/api/avisos/{id}", Json.Aviso())).AssertStatusAsync(HttpStatusCode.Unauthorized);
        var (aluno, _, _) = await api.NovoUsuarioAsync("aluno");
        await (await aluno.PutAsJsonAsync($"/api/avisos/{id}", Json.Aviso())).AssertStatusAsync(HttpStatusCode.Forbidden);
    }

    // ---------- Excluir (exclusão lógica) ----------

    [Fact, Trait("Rota", "DELETE /api/avisos/{id}")]
    public async Task Excluir_some_para_o_usuario_mas_no_banco_so_vira_ativo_0()
    {
        var id = (await CriarAsync(("titulo", "Vai ser excluído"))).GetProperty("id").GetInt32();
        var (editor, _, _) = await api.NovoUsuarioAsync("editor");

        await (await editor.DeleteAsync($"/api/avisos/{id}")).AssertStatusAsync(HttpStatusCode.NoContent);

        // para quem usa o sistema: não existe mais
        var publico = api.Cliente();
        await (await publico.GetAsync($"/api/avisos/{id}")).AssertStatusAsync(HttpStatusCode.NotFound);
        var lista = await (await publico.GetAsync("/api/avisos")).LerAsync();
        Assert.DoesNotContain(lista.EnumerateArray(), a => a.GetProperty("id").GetInt32() == id);
        await (await editor.PutAsJsonAsync($"/api/avisos/{id}", Json.Aviso())).AssertStatusAsync(HttpStatusCode.NotFound);
        await (await editor.DeleteAsync($"/api/avisos/{id}")).AssertStatusAsync(HttpStatusCode.NotFound);

        // no banco: a linha continua lá, só inativa
        var ativo = await api.ConsultarAsync<int?>("SELECT ativo FROM avisos WHERE id = @id", new { id });
        Assert.Equal(0, ativo);
        Assert.Equal("Vai ser excluído", await api.ConsultarAsync<string>("SELECT titulo FROM avisos WHERE id = @id", new { id }));
    }

    [Fact, Trait("Rota", "DELETE /api/avisos/{id}")]
    public async Task Excluir_inexistente_404_sem_login_401_e_aluno_403()
    {
        var id = (await CriarAsync()).GetProperty("id").GetInt32();
        await (await api.Cliente().DeleteAsync($"/api/avisos/{id}")).AssertStatusAsync(HttpStatusCode.Unauthorized);
        var (aluno, _, _) = await api.NovoUsuarioAsync("aluno");
        await (await aluno.DeleteAsync($"/api/avisos/{id}")).AssertStatusAsync(HttpStatusCode.Forbidden);
        var admin = await api.AdminAsync();
        await (await admin.DeleteAsync("/api/avisos/999999")).AssertStatusAsync(HttpStatusCode.NotFound);
        // nada disso excluiu o aviso
        await (await api.Cliente().GetAsync($"/api/avisos/{id}")).AssertStatusAsync(HttpStatusCode.OK);
    }
}
