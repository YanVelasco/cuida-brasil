-- =============================================
-- Cuidar+Brasil - V11: Adiciona perfil TRABALHADOR
-- =============================================

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_USUARIO_PERFIL')
    ALTER TABLE TB_USUARIO DROP CONSTRAINT CK_USUARIO_PERFIL;

ALTER TABLE TB_USUARIO WITH NOCHECK ADD CONSTRAINT CK_USUARIO_PERFIL
    CHECK (perfil IN ('CITIZEN', 'ADMIN', 'GESTOR', 'ANALYTICS_ADMIN', 'TRABALHADOR'));
