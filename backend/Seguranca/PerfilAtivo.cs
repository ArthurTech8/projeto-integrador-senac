using Api.Infra;
using Dapper;
using Microsoft.AspNetCore.Authorization;

namespace Api.Seguranca;

// Regra de acesso: o usuário do cookie precisa estar ATIVO no banco e ter um dos perfis permitidos.
// O perfil é lido do banco (não do cookie) a cada pedido protegido, então excluir um usuário
// ou mudar o perfil dele vale na hora, sem esperar a sessão expirar.
public class PerfilAtivoRequisito(params string[] perfis) : IAuthorizationRequirement
{
    public string[] Perfis { get; } = perfis;
}

public class PerfilAtivoHandler(Banco banco) : AuthorizationHandler<PerfilAtivoRequisito>
{
    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext contexto, PerfilAtivoRequisito requisito)
    {
        var id = Sessao.IdDoUsuario(contexto.User);
        if (id is null) return; // não logado → 401

        await using var db = banco.Abrir();
        var perfil = await db.QueryFirstOrDefaultAsync<string>(
            "SELECT perfil FROM usuarios WHERE id = @Id AND ativo = 1", new { Id = id });

        if (perfil is not null && requisito.Perfis.Contains(perfil))
            contexto.Succeed(requisito);
        // sem Succeed → logado mas sem permissão (ou excluído) → 403
    }
}
