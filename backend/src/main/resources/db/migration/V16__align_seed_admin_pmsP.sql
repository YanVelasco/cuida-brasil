-- Garante o vinculo do administrador seed e das equipes legadas com a PMSP.
UPDATE TB_USUARIO
SET id_orgao = (SELECT TOP 1 id FROM TB_ORGAO_PUBLICO WHERE sigla = 'PMSP')
WHERE cpf = '000.000.000-00'
  AND perfil = 'ADMIN'
  AND EXISTS (SELECT 1 FROM TB_ORGAO_PUBLICO WHERE sigla = 'PMSP');

UPDATE TB_EQUIPE_PUBLICA
SET id_orgao = (SELECT TOP 1 id FROM TB_ORGAO_PUBLICO WHERE sigla = 'PMSP')
WHERE EXISTS (SELECT 1 FROM TB_ORGAO_PUBLICO WHERE sigla = 'PMSP');

UPDATE u
SET u.id_orgao = e.id_orgao
FROM TB_USUARIO u
INNER JOIN TB_GESTOR g ON g.id_usuario = u.id
INNER JOIN TB_EQUIPE_PUBLICA e ON e.id = g.id_equipe
WHERE u.perfil = 'GESTOR';
