using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace Api.Testes.Infra;

// Atalhos para ler respostas JSON da API nos testes.
public static class Json
{
    // Corpo de um aviso válido, com o que o teste quiser mudar: Json.Aviso(("titulo", ""))
    public static Dictionary<string, object?> Aviso(params (string Campo, object? Valor)[] mudancas)
    {
        var corpo = new Dictionary<string, object?>
        {
            ["titulo"] = "Aviso criado pelo teste",
            ["resumo"] = "Resumo do aviso",
            ["descricao"] = "Descrição completa do aviso",
            ["categoria"] = "curso",
            ["curso"] = "Tecnologia da Informação",
            ["dataInicio"] = "2026-12-01",
            ["dataFim"] = "2026-12-02",
            ["localizacao"] = "Laboratório 3",
            ["link"] = "https://example.com/curso",
            ["empresa"] = null,
            ["cargaHoraria"] = 8,
            ["modalidade"] = "Presencial",
            ["certificado"] = true,
            ["vagas"] = 30,
            ["urgente"] = false
        };
        foreach (var (campo, valor) in mudancas) corpo[campo] = valor;
        return corpo;
    }

    public static async Task<JsonElement> LerAsync(this HttpResponseMessage resposta) =>
        await resposta.Content.ReadFromJsonAsync<JsonElement>();

    // Mensagem do { "erro": "..." } que a API devolve nos 400/409
    public static async Task<string?> ErroAsync(this HttpResponseMessage resposta) =>
        (await resposta.LerAsync()).GetProperty("erro").GetString();

    public static async Task<string> AssertStatusAsync(this HttpResponseMessage resposta, HttpStatusCode esperado)
    {
        var corpo = await resposta.Content.ReadAsStringAsync();
        Assert.True(resposta.StatusCode == esperado, $"Esperava {(int)esperado}, veio {(int)resposta.StatusCode}: {corpo}");
        return corpo;
    }

    // Nomes de todas as propriedades de um objeto ou de uma lista de objetos
    public static HashSet<string> Campos(JsonElement json) => json.ValueKind == JsonValueKind.Array
        ? json.EnumerateArray().SelectMany(item => item.EnumerateObject().Select(p => p.Name)).ToHashSet()
        : json.EnumerateObject().Select(p => p.Name).ToHashSet();
}
