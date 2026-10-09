-- Todas as equipes atuais pertencem ao orgao administrado pelo usuario seed.
UPDATE TB_EQUIPE_PUBLICA
SET id_orgao = (
    SELECT TOP 1 id
    FROM TB_ORGAO_PUBLICO
    WHERE sigla = 'PMSP'
)
WHERE EXISTS (
    SELECT 1
    FROM TB_ORGAO_PUBLICO
    WHERE sigla = 'PMSP'
);