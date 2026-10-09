-- Vincula administradores ao orgao que eles administram.
IF COL_LENGTH('TB_USUARIO', 'id_orgao') IS NULL
BEGIN
    EXEC sp_executesql N'ALTER TABLE TB_USUARIO ADD id_orgao INT NULL';
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_USUARIO_ORGAO'
)
BEGIN
    EXEC sp_executesql N'ALTER TABLE TB_USUARIO ADD CONSTRAINT FK_USUARIO_ORGAO FOREIGN KEY (id_orgao) REFERENCES TB_ORGAO_PUBLICO(id)';
END;

-- O administrador seed representa a administracao da Prefeitura de Sao Paulo.
EXEC sp_executesql N'
    UPDATE TB_USUARIO
    SET id_orgao = (SELECT TOP 1 id FROM TB_ORGAO_PUBLICO WHERE sigla = ''PMSP'')
    WHERE cpf = ''000.000.000-00'' AND perfil = ''ADMIN'' AND id_orgao IS NULL';