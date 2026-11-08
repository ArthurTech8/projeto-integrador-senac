namespace Api.Seguranca;

// Perfis de usuário (coluna "perfil" da tabela usuarios)
public static class Perfis
{
    public const string Admin = "admin";     // avisos + gerenciar usuários
    public const string Editor = "editor";   // avisos
    public const string Aluno = "aluno";     // vê o mural filtrado pelo curso, troca a própria senha

    public static readonly string[] Todos = [Admin, Editor, Aluno];
    public static readonly string[] Equipe = [Admin, Editor];
}

// Nomes das políticas usadas em .RequireAuthorization(...)
public static class Politicas
{
    public const string Logado = "Logado";   // qualquer usuário ativo
    public const string Equipe = "Equipe";   // admin ou editor
    public const string Admin = "Admin";     // só admin
}
