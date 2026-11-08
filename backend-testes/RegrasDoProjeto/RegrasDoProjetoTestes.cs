using System.Reflection;
using System.Text.RegularExpressions;
using Api.Testes.Infra;

namespace Api.Testes.RegrasDoProjeto;

// Regras invioláveis do projeto (CLAUDE.md e REGRAS_PROJETO_INTEGRADOR.md), conferidas lendo o código.
// Não precisam de banco. Se alguém quebrar uma regra numa mudança futura, o CI fica vermelho.
public partial class RegrasDoProjetoTestes
{
    private static string Ler(params string[] partes) => File.ReadAllText(BancoDeTeste.Arquivo(partes));

    // Arquivos de uma pasta do projeto, sem bin/, obj/ e node_modules/
    private static IEnumerable<string> Arquivos(string pasta, string padrao) =>
        Directory.EnumerateFiles(BancoDeTeste.Arquivo(pasta), padrao, SearchOption.AllDirectories)
            .Where(f => !Regex.IsMatch(f, @"[\\/](bin|obj|node_modules)[\\/]"));

    private static string Relativo(string arquivo) => Path.GetRelativePath(BancoDeTeste.Projeto, arquivo).Replace('\\', '/');

    // ---------- Exclusão lógica (exigência 4) ----------

    [Fact]
    public void Ninguem_usa_DELETE_FROM_a_exclusao_e_sempre_UPDATE_ativo_0()
    {
        // comentários (// no C#, -- no SQL) podem citar a regra ("nunca usamos DELETE FROM")
        static string SemComentarios(string arquivo) =>
            Regex.Replace(File.ReadAllText(arquivo), arquivo.EndsWith(".sql") ? "--.*$" : "//.*$", "", RegexOptions.Multiline);

        var culpados = Arquivos("backend", "*.cs").Concat(Arquivos("banco", "*.sql"))
            .Where(f => Regex.IsMatch(SemComentarios(f), @"DELETE\s+FROM", RegexOptions.IgnoreCase))
            .Select(Relativo);
        Assert.Empty(culpados);
    }

    [Fact]
    public void Toda_tabela_do_schema_tem_a_coluna_ativo()
    {
        var tabelas = TabelaSql().Matches(Ler("banco", "schema.sql"));
        Assert.NotEmpty(tabelas);
        foreach (Match tabela in tabelas)
            Assert.True(Regex.IsMatch(tabela.Groups[2].Value, @"\bativo\s+TINYINT\(1\)\s+NOT NULL\s+DEFAULT 1", RegexOptions.IgnoreCase),
                $"A tabela {tabela.Groups[1].Value} não tem 'ativo TINYINT(1) NOT NULL DEFAULT 1'");
    }

    [Fact]
    public void Os_modelos_nao_tem_a_propriedade_Ativo()
    {
        var modelos = typeof(Program).Assembly.GetTypes().Where(t => t.Namespace == "Api.Models");
        Assert.NotEmpty(modelos);
        foreach (var modelo in modelos)
            Assert.Null(modelo.GetProperty("Ativo", BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase));
    }

    // ---------- Segurança ----------

    // Texto interpolado ($"...") com SQL só pode colar constantes conhecidas, nunca um valor vindo do usuário.
    // Valores entram como parâmetro do Dapper (@Titulo). Precisa de um trecho novo? Adicione aqui e explique.
    private static readonly string[] InterpolacoesPermitidas =
    [
        "Colunas",
        "ColunasUsuario",
        "(trocarSenha ? \", senha_hash = @SenhaHash\" : \"\")"
    ];

    [Fact]
    public void SQL_nunca_concatena_valores_so_usa_parametros()
    {
        var problemas = new List<string>();
        foreach (var arquivo in Arquivos("backend", "*.cs"))
        {
            foreach (Match texto in TextoInterpolado().Matches(File.ReadAllText(arquivo)))
            {
                if (!Regex.IsMatch(texto.Value, @"\b(SELECT|INSERT|UPDATE|DELETE)\b")) continue;
                foreach (Match trecho in Regex.Matches(texto.Value, @"(?<!\{)\{(?!\{)((?:[^{}]|\{[^{}]*\})*)\}"))
                    if (!InterpolacoesPermitidas.Contains(trecho.Groups[1].Value.Trim()))
                        problemas.Add($"{Relativo(arquivo)}: {{{trecho.Groups[1].Value}}}");
            }
        }
        Assert.Empty(problemas);
    }

    [Fact]
    public void Env_fica_fora_do_git_e_o_exemplo_nao_tem_senha_de_verdade()
    {
        var ignorados = Ler(".gitignore").Split('\n').Select(l => l.Trim()).ToHashSet();
        foreach (var obrigatorio in new[] { ".env", "bin/", "obj/", "node_modules/", "dist/" })
            Assert.Contains(obrigatorio, ignorados);

        var exemplo = Ler(".env.example");
        Assert.Contains("ConnectionStrings__Padrao=", exemplo);
        Assert.Contains("SUA_SENHA_AQUI", exemplo);
    }

    [Fact]
    public void Compose_do_sistema_nao_tem_servico_de_banco()
    {
        var compose = Ler("compose.yaml");
        var servicos = Regex.Matches(compose, @"^  (\w[\w-]*):\s*$", RegexOptions.Multiline).Select(m => m.Groups[1].Value);
        Assert.Equal(["api", "web"], servicos);
        Assert.DoesNotContain("mysql", compose, StringComparison.OrdinalIgnoreCase);
    }

    // ---------- Testes (exigência 6) ----------

    // "VERB /caminho" de todas as rotas da API, com {id:int} escrito como {id}
    private static HashSet<string> RotasDaApi()
    {
        var rotas = new HashSet<string>();
        foreach (var arquivo in Arquivos("backend", "*.cs"))
        {
            var codigo = File.ReadAllText(arquivo);
            var grupos = Regex.Matches(codigo, @"var (\w+) = app\.MapGroup\(""([^""]+)""\)")
                .ToDictionary(m => m.Groups[1].Value, m => m.Groups[2].Value);
            foreach (Match m in Regex.Matches(codigo, @"(\w+)\.Map(Get|Post|Put|Delete)\(""([^""]*)"""))
            {
                var prefixo = m.Groups[1].Value == "app" ? "" : grupos.GetValueOrDefault(m.Groups[1].Value, "");
                var caminho = prefixo + (m.Groups[3].Value == "/" && prefixo != "" ? "" : m.Groups[3].Value);
                rotas.Add($"{m.Groups[2].Value.ToUpperInvariant()} {Regex.Replace(caminho, @"\{(\w+):\w+\}", "{$1}")}");
            }
        }
        return rotas;
    }

    [Fact]
    public void Toda_rota_da_API_tem_pelo_menos_um_teste_marcado_com_Trait_Rota()
    {
        var rotas = RotasDaApi();
        Assert.True(rotas.Count >= 15, $"Só achei {rotas.Count} rotas: o leitor quebrou?");

        var cobertas = Arquivos("backend-testes", "*.cs")
            .SelectMany(f => Regex.Matches(File.ReadAllText(f), @"Trait\(""Rota"", ""([^""]+)""\)").Select(m => m.Groups[1].Value))
            .ToHashSet();

        var semTeste = rotas.Where(r => !cobertas.Contains(r)).Order();
        Assert.True(!semTeste.Any(), "Rotas sem teste (crie um em backend-testes/Rotas com [Trait(\"Rota\", \"...\")]): "
            + string.Join(", ", semTeste));

        var inexistentes = cobertas.Where(r => !rotas.Contains(r));
        Assert.True(!inexistentes.Any(), "Trait de rota que não existe na API: " + string.Join(", ", inexistentes));
    }

    [Fact]
    public void Nenhum_teste_foi_desligado()
    {
        // padrões montados em partes para este arquivo não acusar a si mesmo
        var skip = "Sk" + "ip =";
        var desligadoNoFront = new Regex(@"\b(it|test|describe)\.(sk" + "ip|on" + @"ly|to" + @"do)\b");

        var problemas = Arquivos("backend-testes", "*.cs")
            .Where(f => File.ReadAllText(f).Contains(skip))
            .Concat(Arquivos(Path.Combine("frontend", "testes"), "*.ts").Where(f => desligadoNoFront.IsMatch(File.ReadAllText(f))))
            .Select(Relativo);
        Assert.Empty(problemas);
    }

    [GeneratedRegex(@"CREATE TABLE (\w+) \(([\s\S]*?)\)\s*DEFAULT CHARSET", RegexOptions.IgnoreCase)]
    private static partial Regex TabelaSql();

    // $"..." e $"""...""" (textos interpolados do C#)
    [GeneratedRegex(@"\$""""""[\s\S]*?""""""|\$""(?:[^""\\]|\\.)*""")]
    private static partial Regex TextoInterpolado();
}
