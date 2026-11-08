-- Migração 001 — exclusão lógica em "avisos"
-- Rode UMA vez no phpMyAdmin (aba SQL) do banco que já existe, ANTES de subir a API nova.
-- Não apaga nada: todos os avisos atuais ficam ativos (ativo = 1).

ALTER TABLE avisos
    ADD COLUMN ativo TINYINT(1) NOT NULL DEFAULT 1 AFTER urgente;

-- Conferência: deve mostrar todos os avisos com ativo = 1
SELECT ativo, COUNT(*) AS quantidade FROM avisos GROUP BY ativo;
