-- Migração 002 — usuários e controle de acesso
-- Rode UMA vez no phpMyAdmin (aba SQL), ANTES de subir a API nova.
-- Não mexe na tabela "avisos".
--
-- Perfis: admin  = publica avisos e gerencia usuários
--         editor = publica, edita e exclui avisos
--         aluno  = vê o mural já filtrado pelo seu curso e troca a própria senha
--
-- O primeiro administrador NÃO é criado aqui (senha não fica em script):
-- a API cria na primeira vez que sobe, a partir das chaves AdminInicial__* do .env.

CREATE TABLE usuarios (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nome        VARCHAR(100) NOT NULL,
    -- guardado sempre em minúsculas; a API impede dois usuários ATIVOS com o mesmo e-mail
    email       VARCHAR(150) NOT NULL,
    -- hash PBKDF2 gerado pela API (a senha em si nunca é guardada)
    senha_hash  VARCHAR(255) NOT NULL,
    perfil      VARCHAR(10)  NOT NULL,
    -- curso do aluno (NULL para admin/editor)
    curso       VARCHAR(80)  NULL,
    -- exclusão lógica: 1 = ativo, 0 = excluído. A linha nunca é apagada.
    ativo       TINYINT(1)   NOT NULL DEFAULT 1,
    criado_em   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_usuarios_email (email),
    CONSTRAINT chk_perfil CHECK (perfil IN ('admin', 'editor', 'aluno'))
) DEFAULT CHARSET = utf8mb4;

-- Conferência: a tabela deve existir e estar vazia
SELECT COUNT(*) AS usuarios FROM usuarios;
