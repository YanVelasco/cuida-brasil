-- Adicionar coluna de endereço na tabela de solicitações
ALTER TABLE TB_SOLICITACAO ADD endereco VARCHAR(500);

-- Aumentar a capacidade da coluna de fotos para suportar Base64 (VARCHAR(MAX))
ALTER TABLE TB_SOLICITACAO ALTER COLUMN fotos VARCHAR(MAX);
