-- =============================================
-- Cuidar+Brasil - V8: Auditoria Corporativa
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TB_AUDITORIA')
CREATE TABLE TB_AUDITORIA (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    data        DATETIME2    NOT NULL DEFAULT GETDATE(),
    acao        VARCHAR(50)  NOT NULL,
    detalhes    VARCHAR(500) NULL,
    cpf         VARCHAR(14)  NULL,
    ip          VARCHAR(50)  NULL,
    user_agent  VARCHAR(300) NULL,
    sucesso     BIT          NOT NULL DEFAULT 1,
    id_usuario  INT          NULL,
    CONSTRAINT FK_AUDITORIA_USUARIO FOREIGN KEY (id_usuario) REFERENCES TB_USUARIO(id)
);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_AUDITORIA_DATA')
CREATE INDEX IX_AUDITORIA_DATA ON TB_AUDITORIA (data DESC);
