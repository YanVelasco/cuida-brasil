-- =============================================
-- Cuidar+Brasil - V1: Criacao das Tabelas
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TB_USUARIO')
CREATE TABLE TB_USUARIO (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    nome        VARCHAR(150)  NOT NULL,
    cpf         VARCHAR(14)   NOT NULL,
    email       VARCHAR(200)  NOT NULL,
    senha       VARCHAR(255)  NOT NULL,
    perfil      VARCHAR(20)   NOT NULL DEFAULT 'CITIZEN',
    ativo       BIT           NOT NULL DEFAULT 1,
    data_criacao DATETIME2     NOT NULL DEFAULT GETDATE(),
    CONSTRAINT UQ_USUARIO_CPF   UNIQUE (cpf),
    CONSTRAINT UQ_USUARIO_EMAIL UNIQUE (email),
    CONSTRAINT CK_USUARIO_PERFIL CHECK (perfil IN ('CITIZEN','ADMIN','GESTOR'))
);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TB_ORGAO_PUBLICO')
CREATE TABLE TB_ORGAO_PUBLICO (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    nome            VARCHAR(200) NOT NULL,
    sigla           VARCHAR(20)  NOT NULL,
    tipo            VARCHAR(100) NOT NULL,
    area_atendimento VARCHAR(200) NOT NULL,
    ativo           BIT          NOT NULL DEFAULT 1
);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TB_EQUIPE_PUBLICA')
CREATE TABLE TB_EQUIPE_PUBLICA (
    id       INT IDENTITY(1,1) PRIMARY KEY,
    nome     VARCHAR(200) NOT NULL,
    id_orgao INT          NOT NULL,
    ativo    BIT          NOT NULL DEFAULT 1
);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TB_EQUIPE_USUARIO')
CREATE TABLE TB_EQUIPE_USUARIO (
    id_equipe  INT NOT NULL,
    id_usuario INT NOT NULL,
    CONSTRAINT PK_EQUIPE_USUARIO PRIMARY KEY (id_equipe, id_usuario)
);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TB_GESTOR')
CREATE TABLE TB_GESTOR (
    id         INT IDENTITY(1,1) PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_equipe  INT NOT NULL
);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TB_SERVICO')
CREATE TABLE TB_SERVICO (
    id           INT IDENTITY(1,1) PRIMARY KEY,
    categoria    VARCHAR(100) NOT NULL,
    subcategoria VARCHAR(200) NOT NULL
);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TB_SOLICITACAO')
CREATE TABLE TB_SOLICITACAO (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    protocolo     VARCHAR(50)   NOT NULL,
    descricao     VARCHAR(2000) NOT NULL,
    fotos         VARCHAR(1000) NULL,
    gps           VARCHAR(100)  NOT NULL,
    status        VARCHAR(30)   NOT NULL DEFAULT 'PENDENTE',
    prioridade    VARCHAR(20)   NULL,
    data_criacao   DATETIME2     NOT NULL DEFAULT GETDATE(),
    data_conclusao DATE          NULL,
    id_usuario    INT           NOT NULL,
    id_equipe     INT           NULL,
    id_servico    INT           NOT NULL,
    CONSTRAINT CK_SOLICITACAO_STATUS    CHECK (status    IN ('PENDENTE','TRIAGEM','EM_CAMPO','EM_ANDAMENTO','CONCLUIDA','CANCELADA')),
    CONSTRAINT CK_SOLICITACAO_PRIORIDADE CHECK (prioridade IN ('BAIXA','MEDIA','ALTA','URGENTE') OR prioridade IS NULL),
    CONSTRAINT UQ_SOLICITACAO_PROTOCOLO UNIQUE (protocolo)
);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TB_ANEXO')
CREATE TABLE TB_ANEXO (
    id             INT IDENTITY(1,1) PRIMARY KEY,
    arquivo        VARCHAR(500)  NOT NULL,
    data           DATETIME2     NOT NULL DEFAULT GETDATE(),
    autor          INT           NOT NULL,
    id_solicitacao INT           NOT NULL
);

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TB_HISTORICO')
CREATE TABLE TB_HISTORICO (
    id             INT IDENTITY(1,1) PRIMARY KEY,
    data           DATETIME2    NOT NULL DEFAULT GETDATE(),
    acao           VARCHAR(500) NOT NULL,
    id_solicitacao INT          NOT NULL,
    id_usuario     INT          NOT NULL
);

