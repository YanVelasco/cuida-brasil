-- =============================================
-- Cuidar+Brasil - V3: Dados Iniciais (Seed)
-- =============================================

-- ---- ORGAOS PUBLICOS ----
IF NOT EXISTS (SELECT 1 FROM TB_ORGAO_PUBLICO WHERE sigla = 'SABESP')
INSERT INTO TB_ORGAO_PUBLICO (nome, sigla, tipo, area_atendimento) VALUES
('Companhia de Saneamento Basico do Estado de Sao Paulo', 'SABESP', 'Concessionaria Estadual', 'Abastecimento de agua e esgotamento sanitario');

IF NOT EXISTS (SELECT 1 FROM TB_ORGAO_PUBLICO WHERE sigla = 'ENEL')
INSERT INTO TB_ORGAO_PUBLICO (nome, sigla, tipo, area_atendimento) VALUES
('Enel Distribuicao Sao Paulo', 'ENEL', 'Concessionaria Privada', 'Distribuicao de energia eletrica e iluminacao publica');

IF NOT EXISTS (SELECT 1 FROM TB_ORGAO_PUBLICO WHERE sigla = 'PMSP')
INSERT INTO TB_ORGAO_PUBLICO (nome, sigla, tipo, area_atendimento) VALUES
('Prefeitura Municipal de Sao Paulo', 'PMSP', 'Orgao Municipal', 'Pavimentacao, limpeza urbana, zeladoria');

IF NOT EXISTS (SELECT 1 FROM TB_ORGAO_PUBLICO WHERE sigla = 'INFRA-SP')
INSERT INTO TB_ORGAO_PUBLICO (nome, sigla, tipo, area_atendimento) VALUES
('Empresa de Urbanismo e Infraestrutura do Estado de SP', 'INFRA-SP', 'Empresa Publica Estadual', 'Obras de infraestrutura viaria e urbana');

IF NOT EXISTS (SELECT 1 FROM TB_ORGAO_PUBLICO WHERE sigla = 'COMCAP')
INSERT INTO TB_ORGAO_PUBLICO (nome, sigla, tipo, area_atendimento) VALUES
('Companhia de Manejo de Residuos', 'COMCAP', 'Empresa Municipal', 'Coleta de residuos, limpeza publica e poda');

-- ---- SERVICOS ----
IF NOT EXISTS (SELECT 1 FROM TB_SERVICO WHERE categoria = 'Iluminacao Publica')
INSERT INTO TB_SERVICO (categoria, subcategoria) VALUES
('Iluminacao Publica', 'Lampada apagada'),
('Iluminacao Publica', 'Poste danificado'),
('Iluminacao Publica', 'Cabo exposto');

IF NOT EXISTS (SELECT 1 FROM TB_SERVICO WHERE categoria = 'Pavimentacao')
INSERT INTO TB_SERVICO (categoria, subcategoria) VALUES
('Pavimentacao', 'Buraco / Tapa-buraco'),
('Pavimentacao', 'Calcada danificada'),
('Pavimentacao', 'Sinal de transito apagado');

IF NOT EXISTS (SELECT 1 FROM TB_SERVICO WHERE categoria = 'Limpeza Urbana')
INSERT INTO TB_SERVICO (categoria, subcategoria) VALUES
('Limpeza Urbana', 'Entulho irregular'),
('Limpeza Urbana', 'Varrição de via'),
('Limpeza Urbana', 'Limpeza de bueiro');

IF NOT EXISTS (SELECT 1 FROM TB_SERVICO WHERE categoria = 'Saneamento')
INSERT INTO TB_SERVICO (categoria, subcategoria) VALUES
('Saneamento', 'Vazamento de agua'),
('Saneamento', 'Esgoto a ceu aberto'),
('Saneamento', 'Entupimento de rede');

IF NOT EXISTS (SELECT 1 FROM TB_SERVICO WHERE categoria = 'Poda e Areas Verdes')
INSERT INTO TB_SERVICO (categoria, subcategoria) VALUES
('Poda e Areas Verdes', 'Poda de arvore'),
('Poda e Areas Verdes', 'Arvore caida'),
('Poda e Areas Verdes', 'Capina de terreno');

-- ---- USUARIOS (senhas: Admin@123 hashadas com BCrypt $2a$10$...) ----
-- Senha: Admin@123
IF NOT EXISTS (SELECT 1 FROM TB_USUARIO WHERE cpf = '000.000.000-00')
INSERT INTO TB_USUARIO (nome, cpf, email, senha, perfil) VALUES
('Administrador Sistema', '000.000.000-00', 'admin@cuidarbrasil.gov.br',
 '$2a$10$MrvaDHz8cfQfFk7N8sCd7.HNwdHM4GLfrAv7eiDI8XoXZ6M23Pww6', 'ADMIN');

-- Senha: Gestor@123
IF NOT EXISTS (SELECT 1 FROM TB_USUARIO WHERE cpf = '111.111.111-11')
INSERT INTO TB_USUARIO (nome, cpf, email, senha, perfil) VALUES
('Carlos Alberto Silva', '111.111.111-11', 'carlos.gestor@cuidarbrasil.gov.br',
 '$2a$10$Hefm7wbo1Q8XFdb4l2DnC.Ept9eRpsZBVhLY/3TYfAKIR6fSeNuQi', 'GESTOR');

-- Senha: Cidadao@123
IF NOT EXISTS (SELECT 1 FROM TB_USUARIO WHERE cpf = '222.222.222-22')
INSERT INTO TB_USUARIO (nome, cpf, email, senha, perfil) VALUES
('Maria das Gracas Souza', '222.222.222-22', 'maria.souza@email.com',
 '$2a$10$co7HXcuEt3llH3FktB3XSe8oieqqYKP4cMi5WIID3GxudZaRX9QNG', 'CITIZEN');

-- ---- EQUIPES ----
IF NOT EXISTS (SELECT 1 FROM TB_EQUIPE_PUBLICA WHERE nome = 'Equipe Pavimentacao 01')
INSERT INTO TB_EQUIPE_PUBLICA (nome, id_orgao) VALUES
('Equipe Pavimentacao 01', (SELECT TOP 1 id FROM TB_ORGAO_PUBLICO WHERE sigla = 'PMSP')),
('Equipe Iluminacao 02',   (SELECT TOP 1 id FROM TB_ORGAO_PUBLICO WHERE sigla = 'ENEL')),
('Equipe Limpeza 03',      (SELECT TOP 1 id FROM TB_ORGAO_PUBLICO WHERE sigla = 'COMCAP')),
('Equipe Saneamento 01',   (SELECT TOP 1 id FROM TB_ORGAO_PUBLICO WHERE sigla = 'SABESP')),
('Equipe Poda 01',         (SELECT TOP 1 id FROM TB_ORGAO_PUBLICO WHERE sigla = 'PMSP'));

-- ---- GESTOR ----
IF NOT EXISTS (SELECT 1 FROM TB_GESTOR WHERE id_usuario = (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '111.111.111-11'))
INSERT INTO TB_GESTOR (id_usuario, id_equipe) VALUES
((SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '111.111.111-11'),
 (SELECT TOP 1 id FROM TB_EQUIPE_PUBLICA WHERE nome = 'Equipe Pavimentacao 01'));

-- ---- SOLICITACOES ----
IF NOT EXISTS (SELECT 1 FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2024-0001')
INSERT INTO TB_SOLICITACAO (protocolo, descricao, gps, status, prioridade, id_usuario, id_servico, id_equipe) VALUES
('PRO-2024-0001', 'Buraco profundo na Rua das Flores causando risco aos pedestres e veiculos.',
 '-23.5505,-46.6333', 'EM_ANDAMENTO', 'ALTA',
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '222.222.222-22'),
 (SELECT TOP 1 id FROM TB_SERVICO WHERE subcategoria = 'Buraco / Tapa-buraco'),
 (SELECT TOP 1 id FROM TB_EQUIPE_PUBLICA WHERE nome = 'Equipe Pavimentacao 01'));

IF NOT EXISTS (SELECT 1 FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2024-0002')
INSERT INTO TB_SOLICITACAO (protocolo, descricao, gps, status, prioridade, id_usuario, id_servico, id_equipe) VALUES
('PRO-2024-0002', 'Lampada do poste apagada ha 3 semanas deixando a rua escura a noite.',
 '-23.5510,-46.6340', 'TRIAGEM', 'MEDIA',
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '222.222.222-22'),
 (SELECT TOP 1 id FROM TB_SERVICO WHERE subcategoria = 'Lampada apagada'),
 NULL);

IF NOT EXISTS (SELECT 1 FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2024-0003')
INSERT INTO TB_SOLICITACAO (protocolo, descricao, gps, status, prioridade, id_usuario, id_servico, id_equipe) VALUES
('PRO-2024-0003', 'Vazamento de agua na calcada causando danos ao pavimento.',
 '-23.5520,-46.6350', 'PENDENTE', 'URGENTE',
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '222.222.222-22'),
 (SELECT TOP 1 id FROM TB_SERVICO WHERE subcategoria = 'Vazamento de agua'),
 NULL);

IF NOT EXISTS (SELECT 1 FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2024-0004')
INSERT INTO TB_SOLICITACAO (protocolo, descricao, gps, status, prioridade, id_usuario, id_servico, id_equipe) VALUES
('PRO-2024-0004', 'Entulho de obra abandonado na calcada ha mais de 2 semanas.',
 '-23.5515,-46.6360', 'CONCLUIDA', 'BAIXA',
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '222.222.222-22'),
 (SELECT TOP 1 id FROM TB_SERVICO WHERE subcategoria = 'Entulho irregular'),
 (SELECT TOP 1 id FROM TB_EQUIPE_PUBLICA WHERE nome = 'Equipe Limpeza 03'));

IF NOT EXISTS (SELECT 1 FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2024-0005')
INSERT INTO TB_SOLICITACAO (protocolo, descricao, gps, status, prioridade, id_usuario, id_servico, id_equipe) VALUES
('PRO-2024-0005', 'Arvore com galhos podres ameacando cair sobre residencias.',
 '-23.5500,-46.6320', 'EM_CAMPO', 'ALTA',
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '222.222.222-22'),
 (SELECT TOP 1 id FROM TB_SERVICO WHERE subcategoria = 'Arvore caida'),
 (SELECT TOP 1 id FROM TB_EQUIPE_PUBLICA WHERE nome = 'Equipe Poda 01'));

-- ---- HISTORICO ----
INSERT INTO TB_HISTORICO (acao, id_solicitacao, id_usuario) VALUES
('Solicitacao registrada pelo cidadao.',
 (SELECT TOP 1 id FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2024-0001'),
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '222.222.222-22'));

INSERT INTO TB_HISTORICO (acao, id_solicitacao, id_usuario) VALUES
('Solicitacao encaminhada para Equipe Pavimentacao 01.',
 (SELECT TOP 1 id FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2024-0001'),
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '000.000.000-00'));

INSERT INTO TB_HISTORICO (acao, id_solicitacao, id_usuario) VALUES
('Equipe chegou ao local para inspecao.',
 (SELECT TOP 1 id FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2024-0001'),
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '111.111.111-11'));

INSERT INTO TB_HISTORICO (acao, id_solicitacao, id_usuario) VALUES
('Solicitacao registrada pelo cidadao.',
 (SELECT TOP 1 id FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2024-0004'),
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '222.222.222-22'));

INSERT INTO TB_HISTORICO (acao, id_solicitacao, id_usuario) VALUES
('Servico concluido. Entulho removido com sucesso.',
 (SELECT TOP 1 id FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2024-0004'),
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '111.111.111-11'));

