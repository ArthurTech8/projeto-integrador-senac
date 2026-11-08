## O que muda

<!-- Descreva a mudança em poucas linhas. -->

## Checklist (exigência 6 do REGRAS_PROJETO_INTEGRADOR.md)

- [ ] Toda função nova ou alterada tem teste (frontend em `frontend/testes/`, API em `backend-testes/`)
- [ ] Bug corrigido tem um teste que reproduz o bug
- [ ] Rota nova da API tem teste com `[Trait("Rota", "VERBO /caminho")]`
- [ ] `docker compose -f compose.testes.yaml run --rm testes-web` passou
- [ ] `docker compose -f compose.testes.yaml run --rm testes-api` passou
- [ ] Mudança no banco tem migração em `banco/migracoes/` e o `schema.sql` foi atualizado
- [ ] Nenhum teste foi desligado ou apagado para passar
- [ ] O CI do GitHub está verde
