-- =============================================
-- Cuidar+Brasil - V17: Atualizacao de Datas de Conclusao,
-- Avaliacoes, Notas e Feedbacks do Cidadao
-- =============================================

-- Garante data_conclusao coerente para solicitacoes concluidas
UPDATE TB_SOLICITACAO
SET data_conclusao = CAST(DATEADD(day, 2, data_criacao) AS DATE)
WHERE status = 'CONCLUIDA' AND data_conclusao IS NULL;

-- Garante enderecos amigaveis para solicitacoes antigas
UPDATE TB_SOLICITACAO SET endereco = 'Rua dos Pinheiros, 900 - Pinheiros, São Paulo - SP'
WHERE protocolo = 'PRO-2025-0007' AND (endereco IS NULL OR endereco = '');

UPDATE TB_SOLICITACAO SET endereco = 'Rua Bela Vista, 230 - Bela Vista, São Paulo - SP'
WHERE protocolo = 'PRO-2025-0010' AND (endereco IS NULL OR endereco = '');

UPDATE TB_SOLICITACAO SET endereco = 'Rua Augusta, 400 - Consolação, São Paulo - SP'
WHERE protocolo = 'PRO-2025-0009' AND (endereco IS NULL OR endereco = '');

UPDATE TB_SOLICITACAO SET endereco = 'Av. Paulista, 1500 - Bela Vista, São Paulo - SP'
WHERE protocolo = 'PRO-2024-0004' AND (endereco IS NULL OR endereco = '');

UPDATE TB_SOLICITACAO SET endereco = 'Rua Vergueiro, 1200 - Vila Mariana, São Paulo - SP'
WHERE protocolo = 'PRO-2025-0001' AND (endereco IS NULL OR endereco = '');

UPDATE TB_SOLICITACAO SET endereco = 'Rua Ipiranga, 78 - Centro Histórico, São Paulo - SP'
WHERE protocolo = 'PRO-2025-0004' AND (endereco IS NULL OR endereco = '');

UPDATE TB_SOLICITACAO SET endereco = 'Rua Voluntários da Pátria, 800 - Santana, São Paulo - SP'
WHERE protocolo = 'PRO-2025-0014' AND (endereco IS NULL OR endereco = '');

UPDATE TB_SOLICITACAO SET endereco = 'Rua Tuiuti, 1400 - Tatuapé, São Paulo - SP'
WHERE protocolo = 'PRO-2025-0017' AND (endereco IS NULL OR endereco = '');

-- Preenche avaliacoes de satisfacao (CSAT) em solicitacoes concluidas
UPDATE TB_SOLICITACAO
SET nota_qualidade = 5,
    nota_prazos = 5,
    nota_atendimento = 5,
    feedback_comentario = 'Serviço executado com excelência e rapidez! A calçada ficou perfeita.'
WHERE protocolo = 'PRO-2025-0007' AND nota_qualidade IS NULL;

UPDATE TB_SOLICITACAO
SET nota_qualidade = 4,
    nota_prazos = 4,
    nota_atendimento = 5,
    feedback_comentario = 'Limpeza concluída rapidamente, equipe muito educada.'
WHERE protocolo = 'PRO-2024-0004' AND nota_qualidade IS NULL;

UPDATE TB_SOLICITACAO
SET nota_qualidade = 5,
    nota_prazos = 4,
    nota_atendimento = 5,
    feedback_comentario = 'Problema de asfalto resolvido dentro do prazo previsto pela prefeitura.'
WHERE protocolo = 'PRO-2025-0011' AND nota_qualidade IS NULL;

UPDATE TB_SOLICITACAO
SET nota_qualidade = 4,
    nota_prazos = 3,
    nota_atendimento = 4,
    feedback_comentario = 'Demorou um pouco mais que o esperado, mas a iluminação do poste foi totalmente restabelecida.'
WHERE protocolo = 'PRO-2025-0015' AND nota_qualidade IS NULL;

UPDATE TB_SOLICITACAO
SET nota_qualidade = 5,
    nota_prazos = 5,
    nota_atendimento = 4,
    feedback_comentario = 'Excelente trabalho da equipe de poda, galhos retirados sem transtornos.'
WHERE protocolo = 'PRO-2025-0019' AND nota_qualidade IS NULL;
