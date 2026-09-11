-- Repara vínculos de órgão para administradores e gestores existentes.
-- O vínculo do administrador é usado para limitar equipes e auditoria.
UPDATE TB_USUARIO
SET id_orgao = (
    SELECT TOP 1 id FROM TB_ORGAO_PUBLICO WHERE sigla = 'PMSP'
)
WHERE perfil = 'ADMIN'
  AND id_orgao IS NULL
  AND EXISTS (SELECT 1 FROM TB_ORGAO_PUBLICO WHERE sigla = 'PMSP');

-- Gestores herdam o órgão da equipe sob sua responsabilidade.
UPDATE u
SET u.id_orgao = e.id_orgao
FROM TB_USUARIO u
INNER JOIN TB_GESTOR g ON g.id_usuario = u.id
INNER JOIN TB_EQUIPE_PUBLICA e ON e.id = g.id_equipe
WHERE u.perfil = 'GESTOR'
  AND u.id_orgao IS NULL;