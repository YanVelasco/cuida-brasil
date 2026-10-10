INSERT INTO TB_HISTORICO (acao, id_solicitacao, id_usuario)
SELECT
    CONCAT(
        N'Avaliação do cidadão registrada: prazos ',
        COALESCE(CONVERT(VARCHAR(10), s.nota_prazos), 'N/D'),
        N'/5, qualidade ',
        COALESCE(CONVERT(VARCHAR(10), s.nota_qualidade), 'N/D'),
        N'/5 e atendimento ',
        COALESCE(CONVERT(VARCHAR(10), s.nota_atendimento), 'N/D'),
        N'/5.'
    ),
    s.id,
    s.id_usuario
FROM TB_SOLICITACAO s
WHERE (
         s.nota_prazos IS NOT NULL
     OR s.nota_qualidade IS NOT NULL
     OR s.nota_atendimento IS NOT NULL
     OR (s.feedback_comentario IS NOT NULL AND LEN(LTRIM(RTRIM(s.feedback_comentario))) > 0)
)
AND NOT EXISTS (
    SELECT 1
    FROM TB_HISTORICO h
    WHERE h.id_solicitacao = s.id
      AND h.acao LIKE 'Avaliação do cidadão registrada:%'
);