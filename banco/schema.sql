-- Mural do Aluno — schema do banco (MySQL · alwaysdata)
-- Execute no phpMyAdmin, aba SQL. Recria as tabelas do zero, com dados de exemplo.
-- ATENÇÃO: os DROP TABLE abaixo apagam os dados existentes. Para atualizar um banco
-- que já está em uso, rode os arquivos da pasta banco/migracoes/ em vez deste.
-- O primeiro administrador é criado pela API a partir do .env (chaves AdminInicial__*).

DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS avisos;

-- Usuários (perfis: admin, editor, aluno). Exclusão lógica pela coluna "ativo".
CREATE TABLE usuarios (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nome        VARCHAR(100) NOT NULL,
    email       VARCHAR(150) NOT NULL,     -- minúsculas; único entre os ativos (a API garante)
    senha_hash  VARCHAR(255) NOT NULL,     -- hash PBKDF2; a senha nunca é guardada
    perfil      VARCHAR(10)  NOT NULL,
    curso       VARCHAR(80)  NULL,         -- só para aluno
    ativo       TINYINT(1)   NOT NULL DEFAULT 1,
    criado_em   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_usuarios_email (email),
    CONSTRAINT chk_perfil CHECK (perfil IN ('admin', 'editor', 'aluno'))
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE avisos (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    titulo         VARCHAR(150) NOT NULL,
    resumo         VARCHAR(300) NOT NULL,
    descricao      TEXT         NOT NULL,
    -- calendario | extracurricular | emprego | curso
    categoria      VARCHAR(20)  NOT NULL,
    -- curso/área a que o aviso se destina ("Todos os cursos" = geral)
    curso          VARCHAR(80)  NOT NULL DEFAULT 'Todos os cursos',
    data_inicio    DATE         NULL,
    data_fim       DATE         NULL,
    localizacao    VARCHAR(150) NULL,
    link           VARCHAR(300) NULL,
    -- campos usados só por algumas categorias
    empresa        VARCHAR(100) NULL,      -- emprego
    carga_horaria  INT          NULL,      -- curso (em horas)
    modalidade     VARCHAR(20)  NULL,      -- Presencial | Online | Híbrido
    certificado    TINYINT(1)   NOT NULL DEFAULT 0,
    vagas          INT          NULL,
    urgente        TINYINT(1)   NOT NULL DEFAULT 0,
    -- exclusão lógica: 1 = ativo, 0 = excluído pelo usuário. A linha nunca é apagada.
    ativo          TINYINT(1)   NOT NULL DEFAULT 1,
    publicado_em   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_categoria CHECK (categoria IN ('calendario', 'extracurricular', 'emprego', 'curso'))
) DEFAULT CHARSET = utf8mb4;

-- ---------- Calendário acadêmico ----------
INSERT INTO avisos (titulo, resumo, descricao, categoria, curso, data_inicio, data_fim, urgente, publicado_em) VALUES
('Feriado: Proclamação da República',
 'Domingo, 15/11. Não há aulas no sábado letivo de 14/11.',
 'Em razão do feriado nacional da Proclamação da República, o sábado letivo de 14/11 foi cancelado. As atividades voltam normalmente na segunda-feira, 16/11.',
 'calendario', 'Todos os cursos', '2026-11-15', NULL, 0, NOW() - INTERVAL 6 DAY),
('Feriado: Dia da Consciência Negra',
 'Sexta-feira, 20/11. A instituição estará fechada.',
 'O Dia Nacional de Zumbi e da Consciência Negra é feriado nacional. Não haverá aulas nem atendimento na secretaria. As aulas de sexta serão repostas conforme orientação de cada coordenação.',
 'calendario', 'Todos os cursos', '2026-11-20', NULL, 0, NOW() - INTERVAL 4 DAY),
('Rematrícula para o 1º semestre de 2027',
 'De 23/11 a 04/12 pelo Portal do Aluno. Quem perder o prazo pode ficar sem vaga.',
 'A rematrícula é obrigatória para todos os alunos que continuarão no próximo semestre. Acesse o Portal do Aluno, confira as disciplinas e confirme. Alunos com pendências financeiras ou de documentos devem procurar a secretaria antes do prazo.',
 'calendario', 'Todos os cursos', '2026-11-23', '2026-12-04', 1, NOW() - INTERVAL 1 DAY),
('Semana de avaliações finais',
 'De 30/11 a 11/12. Confira o cronograma de provas com seu professor.',
 'Durante a semana de avaliações, os horários podem mudar. Chegue com 15 minutos de antecedência e leve documento com foto. A segunda chamada só será aplicada mediante justificativa entregue na secretaria em até 48h.',
 'calendario', 'Todos os cursos', '2026-11-30', '2026-12-11', 0, NOW() - INTERVAL 3 DAY),
('Férias de fim de ano',
 'Recesso de 19/12/2026 a 31/01/2027. As aulas voltam em 01/02/2027.',
 'Durante o recesso, a secretaria funciona em horário reduzido (9h às 13h) entre 05/01 e 29/01. Nos dias 24/12, 25/12, 31/12 e 01/01 a instituição estará fechada.',
 'calendario', 'Todos os cursos', '2026-12-19', '2027-01-31', 0, NOW() - INTERVAL 2 DAY),
('Carnaval 2027',
 'Sem aulas de 08/02 a 10/02 (até as 12h).',
 'As aulas serão suspensas na segunda e terça-feira de Carnaval e na manhã da Quarta-feira de Cinzas. Os cursos noturnos retomam na quarta-feira, 10/02.',
 'calendario', 'Todos os cursos', '2027-02-08', '2027-02-10', 0, NOW() - INTERVAL 5 DAY);

-- ---------- Atividades extracurriculares ----------
INSERT INTO avisos (titulo, resumo, descricao, categoria, curso, data_inicio, data_fim, localizacao, link, vagas, certificado, urgente, publicado_em) VALUES
('Semana de Tecnologia e Inovação',
 'Palestras, oficinas e feira de projetos de 23 a 27/11. Inscrição gratuita.',
 'Uma semana inteira com profissionais do mercado falando sobre inteligência artificial, segurança da informação, desenvolvimento web e carreira. Haverá certificado de horas complementares para quem participar de pelo menos 3 atividades.',
 'extracurricular', 'Tecnologia da Informação', '2026-11-23', '2026-11-27', 'Auditório principal', 'https://example.com/semana-tecnologia', 200, 1, 0, NOW() - INTERVAL 2 DAY),
('Hackathon Soluções para a Comunidade',
 'Maratona de 12h em equipes de até 4 pessoas. Prêmios para os 3 primeiros.',
 'Desenvolva uma solução para um problema real do bairro. Equipes podem misturar cursos — designers, programadores e administradores são bem-vindos. Alimentação inclusa.',
 'extracurricular', 'Todos os cursos', '2026-12-05', '2026-12-05', 'Laboratórios do bloco B', 'https://example.com/hackathon', 60, 1, 1, NOW() - INTERVAL 1 DAY),
('Grupo de conversação em inglês',
 'Toda quarta, das 18h às 19h. Nível intermediário. Encontros gratuitos.',
 'Grupo de prática de conversação conduzido por monitores. Ideal para quem quer se preparar para entrevistas e vagas que exigem inglês. Não precisa de inscrição prévia.',
 'extracurricular', 'Todos os cursos', '2026-11-11', '2026-12-16', 'Sala 204', NULL, 25, 0, 0, NOW() - INTERVAL 8 DAY),
('Oficina de confeitaria natalina',
 'Aprenda panetone e biscoitos decorados no dia 12/12. Vagas limitadas.',
 'Oficina prática com a chef convidada. Os participantes levam para casa o que produzirem. Use roupa adequada para cozinha e cabelo preso.',
 'extracurricular', 'Gastronomia', '2026-12-12', '2026-12-12', 'Cozinha pedagógica', 'https://example.com/oficina-natal', 20, 1, 0, NOW() - INTERVAL 3 DAY);

-- ---------- Oportunidades de emprego e estágio ----------
INSERT INTO avisos (titulo, resumo, descricao, categoria, curso, data_fim, localizacao, link, empresa, modalidade, vagas, urgente, publicado_em) VALUES
('Estágio em Desenvolvimento Web',
 'Bolsa de R$ 1.400 + VT. Conhecimentos em HTML, CSS e JavaScript.',
 'Requisitos: estar cursando a partir do 2º módulo, conhecer HTML, CSS e JavaScript. Desejável: Vue ou React e Git. Carga horária de 6h por dia, de segunda a sexta. Envie seu currículo e link do GitHub.',
 'emprego', 'Tecnologia da Informação', '2026-11-30', 'Centro', 'https://example.com/vaga-estagio-web', 'Nuvem Clara Sistemas', 'Híbrido', 2, 1, NOW() - INTERVAL 1 DAY),
('Jovem Aprendiz — Auxiliar Administrativo',
 'Para alunos de 16 a 22 anos. Rotinas de escritório e atendimento.',
 'Atividades: organização de documentos, apoio ao financeiro e atendimento ao cliente. Requisitos: Pacote Office básico e boa comunicação. Benefícios: VT, VR e plano de saúde.',
 'emprego', 'Administração', '2026-12-10', 'Zona Sul', 'https://example.com/vaga-aprendiz', 'Grupo Ponto Logístico', 'Presencial', 3, 0, NOW() - INTERVAL 4 DAY),
('Técnico(a) de Enfermagem — plantão noturno',
 'Contratação CLT. Necessário COREN ativo ou em andamento.',
 'Vaga para escala 12x36 no período noturno. Experiência de estágio é aceita. Envie currículo com cópia do registro profissional.',
 'emprego', 'Enfermagem', '2026-12-15', 'Hospital Vida Plena — Bairro Norte', 'https://example.com/vaga-enfermagem', 'Hospital Vida Plena', 'Presencial', 4, 0, NOW() - INTERVAL 2 DAY),
('Designer Gráfico Júnior',
 'Criação de peças para redes sociais. Portfólio obrigatório.',
 'Requisitos: domínio de ferramentas de design (Figma, Illustrator ou similares), noções de identidade visual e tipografia. Diferencial: edição de vídeos curtos.',
 'emprego', 'Design Gráfico', '2026-11-25', 'Remoto', 'https://example.com/vaga-designer', 'Estúdio Traço Livre', 'Online', 1, 0, NOW() - INTERVAL 6 DAY);

-- ---------- Cursos rápidos de capacitação ----------
INSERT INTO avisos (titulo, resumo, descricao, categoria, curso, data_inicio, data_fim, localizacao, link, carga_horaria, modalidade, certificado, vagas, urgente, publicado_em) VALUES
('Excel Essencial para o Mercado',
 '8 horas online: fórmulas, tabelas dinâmicas e gráficos.',
 'Curso prático em 4 encontros de 2h, ao vivo. Indicado para qualquer área. Necessário computador com Excel ou Google Planilhas.',
 'curso', 'Todos os cursos', '2026-11-17', '2026-11-26', 'Online (ao vivo)', 'https://example.com/curso-excel', 8, 'Online', 1, 40, 0, NOW() - INTERVAL 2 DAY),
('Git e GitHub do zero',
 '6 horas: versionamento, branches e portfólio no GitHub.',
 'Aprenda a versionar seus projetos e montar um portfólio que recrutadores conseguem ver. Traga seu notebook, se tiver.',
 'curso', 'Tecnologia da Informação', '2026-11-28', '2026-11-28', 'Laboratório 3', 'https://example.com/curso-git', 6, 'Presencial', 1, 30, 0, NOW() - INTERVAL 1 DAY),
('Primeiros Socorros Básicos',
 '4 horas com prática em manequim. Aberto a todos os cursos.',
 'Conteúdo: avaliação da cena, RCP, engasgo, queimaduras e quando acionar o SAMU. Ministrado pela coordenação de Enfermagem.',
 'curso', 'Todos os cursos', '2026-12-03', '2026-12-03', 'Laboratório de Enfermagem', 'https://example.com/curso-socorros', 4, 'Presencial', 1, 24, 0, NOW() - INTERVAL 5 DAY),
('Oratória e Entrevista de Emprego',
 '12 horas para perder o medo de falar em público e se sair bem em entrevistas.',
 'Simulações de entrevista, apresentação pessoal, linguagem corporal e elaboração de currículo. Formato híbrido: 2 encontros presenciais e 2 online.',
 'curso', 'Todos os cursos', '2026-12-01', '2026-12-10', 'Sala 101 e online', 'https://example.com/curso-oratoria', 12, 'Híbrido', 1, 35, 0, NOW() - INTERVAL 3 DAY);
