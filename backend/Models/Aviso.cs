namespace Api.Models;

// Um aviso do mural. Cada propriedade corresponde a uma coluna da tabela "avisos"
// (o Dapper liga DataInicio ⇄ data_inicio graças ao MatchNamesWithUnderscores).
public class Aviso
{
    public int Id { get; set; }
    public string Titulo { get; set; } = "";
    public string Resumo { get; set; } = "";
    public string Descricao { get; set; } = "";

    // calendario | extracurricular | emprego | curso
    public string Categoria { get; set; } = "";
    public string Curso { get; set; } = "Todos os cursos";

    public DateTime? DataInicio { get; set; }
    public DateTime? DataFim { get; set; }
    public string? Localizacao { get; set; }
    public string? Link { get; set; }

    // Campos usados só por algumas categorias
    public string? Empresa { get; set; }
    public int? CargaHoraria { get; set; }
    public string? Modalidade { get; set; }
    public bool Certificado { get; set; }
    public int? Vagas { get; set; }

    public bool Urgente { get; set; }
    public DateTime PublicadoEm { get; set; }

    // A coluna "ativo" (exclusão lógica) não aparece aqui de propósito: a API só devolve
    // avisos com ativo = 1, e só a rota DELETE muda esse valor (para 0).
}
