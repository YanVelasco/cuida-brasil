-- Adiciona o administrador global, responsavel por orgaos, dashboards e relatorios.
IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_USUARIO_PERFIL')
    ALTER TABLE TB_USUARIO DROP CONSTRAINT CK_USUARIO_PERFIL;

ALTER TABLE TB_USUARIO WITH NOCHECK ADD CONSTRAINT CK_USUARIO_PERFIL
    CHECK (perfil IN ('CITIZEN', 'ADMIN', 'GESTOR', 'ANALYTICS_ADMIN', 'GLOBAL_ADMIN'));

IF NOT EXISTS (SELECT 1 FROM TB_USUARIO WHERE cpf = '888.888.888-88')
INSERT INTO TB_USUARIO (nome, cpf, email, senha, perfil) VALUES
('Administrador Global', '888.888.888-88', 'global.admin@cuidarbrasil.gov.br',
 '$2a$10$MrvaDHz8cfQfFk7N8sCd7.HNwdHM4GLfrAv7eiDI8XoXZ6M23Pww6', 'GLOBAL_ADMIN');