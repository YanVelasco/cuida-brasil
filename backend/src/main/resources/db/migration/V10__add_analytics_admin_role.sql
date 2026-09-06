-- =============================================
-- Cuidar+Brasil - V10: Adiciona perfil ANALYTICS_ADMIN
-- =============================================

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_USUARIO_PERFIL')
    ALTER TABLE TB_USUARIO DROP CONSTRAINT CK_USUARIO_PERFIL;

ALTER TABLE TB_USUARIO WITH NOCHECK ADD CONSTRAINT CK_USUARIO_PERFIL
    CHECK (perfil IN ('CITIZEN', 'ADMIN', 'GESTOR', 'ANALYTICS_ADMIN'));

IF NOT EXISTS (SELECT 1 FROM TB_USUARIO WHERE cpf = '999.999.999-99')
INSERT INTO TB_USUARIO (nome, cpf, email, senha, perfil) VALUES
('Analista de Analytics', '999.999.999-99', 'analytics.admin@cuidarbrasil.gov.br',
 '$2b$10$rXsoEGhQXThRfiqLv0CD8ej80Bnd7lXD4qfBtjynLEpFHe58Ukzt6', 'ANALYTICS_ADMIN');
