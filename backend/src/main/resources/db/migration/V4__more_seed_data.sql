-- =============================================
-- Cuidar+Brasil - V4: Dados de Seed Expandidos
-- Gestores, Cidadãos e Solicitações em volume
-- =============================================

-- ---- USUARIOS: Gestores adicionais ----
-- Senha: Gestor@123
IF NOT EXISTS (SELECT 1 FROM TB_USUARIO WHERE cpf = '333.333.333-33')
INSERT INTO TB_USUARIO (nome, cpf, email, senha, perfil) VALUES
('Ana Paula Ferreira', '333.333.333-33', 'ana.gestor@cuidarbrasil.gov.br',
 '$2a$10$Hefm7wbo1Q8XFdb4l2DnC.Ept9eRpsZBVhLY/3TYfAKIR6fSeNuQi', 'GESTOR');

IF NOT EXISTS (SELECT 1 FROM TB_USUARIO WHERE cpf = '444.444.444-44')
INSERT INTO TB_USUARIO (nome, cpf, email, senha, perfil) VALUES
('Roberto Oliveira Santos', '444.444.444-44', 'roberto.gestor@cuidarbrasil.gov.br',
 '$2a$10$Hefm7wbo1Q8XFdb4l2DnC.Ept9eRpsZBVhLY/3TYfAKIR6fSeNuQi', 'GESTOR');

IF NOT EXISTS (SELECT 1 FROM TB_USUARIO WHERE cpf = '555.555.555-55')
INSERT INTO TB_USUARIO (nome, cpf, email, senha, perfil) VALUES
('Fernanda Lima Costa', '555.555.555-55', 'fernanda.gestor@cuidarbrasil.gov.br',
 '$2a$10$Hefm7wbo1Q8XFdb4l2DnC.Ept9eRpsZBVhLY/3TYfAKIR6fSeNuQi', 'GESTOR');

IF NOT EXISTS (SELECT 1 FROM TB_USUARIO WHERE cpf = '666.666.666-66')
INSERT INTO TB_USUARIO (nome, cpf, email, senha, perfil) VALUES
('Gabriela Costa Mendes', '666.666.666-66', 'gabriela.gestor@cuidarbrasil.gov.br',
 '$2a$10$Hefm7wbo1Q8XFdb4l2DnC.Ept9eRpsZBVhLY/3TYfAKIR6fSeNuQi', 'GESTOR');

-- ---- USUARIOS: Cidadãos adicionais ----
-- Senha: Cidadao@123
IF NOT EXISTS (SELECT 1 FROM TB_USUARIO WHERE cpf = '601.501.401-01')
INSERT INTO TB_USUARIO (nome, cpf, email, senha, perfil) VALUES
('João Pedro Alves', '601.501.401-01', 'joao.alves@email.com',
 '$2a$10$co7HXcuEt3llH3FktB3XSe8oieqqYKP4cMi5WIID3GxudZaRX9QNG', 'CITIZEN');

IF NOT EXISTS (SELECT 1 FROM TB_USUARIO WHERE cpf = '602.502.402-02')
INSERT INTO TB_USUARIO (nome, cpf, email, senha, perfil) VALUES
('Luciana Rodrigues Melo', '602.502.402-02', 'luciana.melo@email.com',
 '$2a$10$co7HXcuEt3llH3FktB3XSe8oieqqYKP4cMi5WIID3GxudZaRX9QNG', 'CITIZEN');

IF NOT EXISTS (SELECT 1 FROM TB_USUARIO WHERE cpf = '603.503.403-03')
INSERT INTO TB_USUARIO (nome, cpf, email, senha, perfil) VALUES
('Carlos Eduardo Nunes', '603.503.403-03', 'carlos.nunes@email.com',
 '$2a$10$co7HXcuEt3llH3FktB3XSe8oieqqYKP4cMi5WIID3GxudZaRX9QNG', 'CITIZEN');

IF NOT EXISTS (SELECT 1 FROM TB_USUARIO WHERE cpf = '604.504.404-04')
INSERT INTO TB_USUARIO (nome, cpf, email, senha, perfil) VALUES
('Patricia Souza Lima', '604.504.404-04', 'patricia.lima@email.com',
 '$2a$10$co7HXcuEt3llH3FktB3XSe8oieqqYKP4cMi5WIID3GxudZaRX9QNG', 'CITIZEN');

IF NOT EXISTS (SELECT 1 FROM TB_USUARIO WHERE cpf = '605.505.405-05')
INSERT INTO TB_USUARIO (nome, cpf, email, senha, perfil) VALUES
('Marcos Antonio Vieira', '605.505.405-05', 'marcos.vieira@email.com',
 '$2a$10$co7HXcuEt3llH3FktB3XSe8oieqqYKP4cMi5WIID3GxudZaRX9QNG', 'CITIZEN');

-- ---- EQUIPES adicionais ----
IF NOT EXISTS (SELECT 1 FROM TB_EQUIPE_PUBLICA WHERE nome = 'Equipe Iluminacao 01')
INSERT INTO TB_EQUIPE_PUBLICA (nome, id_orgao) VALUES
('Equipe Iluminacao 01', (SELECT TOP 1 id FROM TB_ORGAO_PUBLICO WHERE sigla = 'ENEL'));

IF NOT EXISTS (SELECT 1 FROM TB_EQUIPE_PUBLICA WHERE nome = 'Equipe Saneamento 02')
INSERT INTO TB_EQUIPE_PUBLICA (nome, id_orgao) VALUES
('Equipe Saneamento 02', (SELECT TOP 1 id FROM TB_ORGAO_PUBLICO WHERE sigla = 'SABESP'));

IF NOT EXISTS (SELECT 1 FROM TB_EQUIPE_PUBLICA WHERE nome = 'Equipe Poda 02')
INSERT INTO TB_EQUIPE_PUBLICA (nome, id_orgao) VALUES
('Equipe Poda 02', (SELECT TOP 1 id FROM TB_ORGAO_PUBLICO WHERE sigla = 'COMCAP'));

-- ---- GESTORES adicionais vinculados às novas equipes ----
IF NOT EXISTS (SELECT 1 FROM TB_GESTOR WHERE id_usuario = (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '333.333.333-33'))
INSERT INTO TB_GESTOR (id_usuario, id_equipe) VALUES
((SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '333.333.333-33'),
 (SELECT TOP 1 id FROM TB_EQUIPE_PUBLICA WHERE nome = 'Equipe Iluminacao 01'));

IF NOT EXISTS (SELECT 1 FROM TB_GESTOR WHERE id_usuario = (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '444.444.444-44'))
INSERT INTO TB_GESTOR (id_usuario, id_equipe) VALUES
((SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '444.444.444-44'),
 (SELECT TOP 1 id FROM TB_EQUIPE_PUBLICA WHERE nome = 'Equipe Saneamento 02'));

IF NOT EXISTS (SELECT 1 FROM TB_GESTOR WHERE id_usuario = (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '555.555.555-55'))
INSERT INTO TB_GESTOR (id_usuario, id_equipe) VALUES
((SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '555.555.555-55'),
 (SELECT TOP 1 id FROM TB_EQUIPE_PUBLICA WHERE nome = 'Equipe Poda 02'));

IF NOT EXISTS (SELECT 1 FROM TB_GESTOR WHERE id_usuario = (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '666.666.666-66'))
INSERT INTO TB_GESTOR (id_usuario, id_equipe) VALUES
((SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '666.666.666-66'),
 (SELECT TOP 1 id FROM TB_EQUIPE_PUBLICA WHERE nome = 'Equipe Limpeza 03'));

-- ============================================================
-- SOLICITAÇÕES EXPANDIDAS
-- ============================================================

-- === João Pedro Alves (601) ===
IF NOT EXISTS (SELECT 1 FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0001')
INSERT INTO TB_SOLICITACAO (protocolo, descricao, gps, status, prioridade, id_usuario, id_servico, id_equipe, data_criacao) VALUES
('PRO-2025-0001', 'Poste de iluminação pública apagado há mais de 10 dias na Rua Marechal, 450. A falta de luz está causando insegurança para moradores e pedestres.',
 '-23.5412,-46.6281', 'EM_ANDAMENTO', 'ALTA',
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '601.501.401-01'),
 (SELECT TOP 1 id FROM TB_SERVICO WHERE subcategoria = 'Lampada apagada'),
 (SELECT TOP 1 id FROM TB_EQUIPE_PUBLICA WHERE nome = 'Equipe Iluminacao 01'),
 DATEADD(day, -12, GETDATE()));

IF NOT EXISTS (SELECT 1 FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0002')
INSERT INTO TB_SOLICITACAO (protocolo, descricao, gps, status, prioridade, id_usuario, id_servico, id_equipe, data_criacao) VALUES
('PRO-2025-0002', 'Buraco de grandes dimensões na Avenida Brasil, 1200, próximo ao semáforo. Risco de acidentes para motos e bicicletas.',
 '-23.5430,-46.6295', 'PENDENTE', 'URGENTE',
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '601.501.401-01'),
 (SELECT TOP 1 id FROM TB_SERVICO WHERE subcategoria = 'Buraco / Tapa-buraco'),
 NULL,
 DATEADD(day, -5, GETDATE()));

IF NOT EXISTS (SELECT 1 FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0003')
INSERT INTO TB_SOLICITACAO (protocolo, descricao, gps, status, prioridade, id_usuario, id_servico, id_equipe, data_criacao) VALUES
('PRO-2025-0003', 'Lixo acumulado na calçada em frente ao Parque Municipal há 4 dias. Mau cheiro e atração de vetores.',
 '-23.5440,-46.6310', 'CONCLUIDA', 'MEDIA',
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '601.501.401-01'),
 (SELECT TOP 1 id FROM TB_SERVICO WHERE subcategoria = 'Varrição de via'),
 (SELECT TOP 1 id FROM TB_EQUIPE_PUBLICA WHERE nome = 'Equipe Limpeza 03'),
 DATEADD(day, -20, GETDATE()));

-- === Luciana Rodrigues Melo (602) ===
IF NOT EXISTS (SELECT 1 FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0004')
INSERT INTO TB_SOLICITACAO (protocolo, descricao, gps, status, prioridade, id_usuario, id_servico, id_equipe, data_criacao) VALUES
('PRO-2025-0004', 'Vazamento de água na Rua Ipiranga, 78. A água está escorrendo para a calçada há 6 dias e causando danos à pavimentação.',
 '-23.5460,-46.6320', 'EM_CAMPO', 'ALTA',
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '602.502.402-02'),
 (SELECT TOP 1 id FROM TB_SERVICO WHERE subcategoria = 'Vazamento de agua'),
 (SELECT TOP 1 id FROM TB_EQUIPE_PUBLICA WHERE nome = 'Equipe Saneamento 02'),
 DATEADD(day, -6, GETDATE()));

IF NOT EXISTS (SELECT 1 FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0005')
INSERT INTO TB_SOLICITACAO (protocolo, descricao, gps, status, prioridade, id_usuario, id_servico, id_equipe, data_criacao) VALUES
('PRO-2025-0005', 'Esgoto a céu aberto na Rua Paraíba, 320. Situação de risco à saúde pública. Odor forte e possível contaminação.',
 '-23.5470,-46.6335', 'TRIAGEM', 'URGENTE',
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '602.502.402-02'),
 (SELECT TOP 1 id FROM TB_SERVICO WHERE subcategoria = 'Esgoto a ceu aberto'),
 NULL,
 DATEADD(day, -3, GETDATE()));

IF NOT EXISTS (SELECT 1 FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0006')
INSERT INTO TB_SOLICITACAO (protocolo, descricao, gps, status, prioridade, id_usuario, id_servico, id_equipe, data_criacao) VALUES
('PRO-2025-0006', 'Arvore com galhos grandes sobre os fios de energia na Rua das Acácias, 55. Risco de queda e curto-circuito.',
 '-23.5480,-46.6345', 'PENDENTE', 'ALTA',
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '602.502.402-02'),
 (SELECT TOP 1 id FROM TB_SERVICO WHERE subcategoria = 'Poda de arvore'),
 NULL,
 DATEADD(day, -2, GETDATE()));

IF NOT EXISTS (SELECT 1 FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0007')
INSERT INTO TB_SOLICITACAO (protocolo, descricao, gps, status, prioridade, id_usuario, id_servico, id_equipe, data_criacao) VALUES
('PRO-2025-0007', 'Calçada completamente destruída na Rua dos Pinheiros, 900. Idosos e pessoas com mobilidade reduzida estão em risco.',
 '-23.5490,-46.6360', 'CONCLUIDA', 'MEDIA',
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '602.502.402-02'),
 (SELECT TOP 1 id FROM TB_SERVICO WHERE subcategoria = 'Calcada danificada'),
 (SELECT TOP 1 id FROM TB_EQUIPE_PUBLICA WHERE nome = 'Equipe Pavimentacao 01'),
 DATEADD(day, -30, GETDATE()));

-- === Carlos Eduardo Nunes (603) ===
IF NOT EXISTS (SELECT 1 FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0008')
INSERT INTO TB_SOLICITACAO (protocolo, descricao, gps, status, prioridade, id_usuario, id_servico, id_equipe, data_criacao) VALUES
('PRO-2025-0008', 'Bueiro entupido na Rua Consolação, 1500. Em dias de chuva a rua fica completamente alagada.',
 '-23.5500,-46.6370', 'EM_ANDAMENTO', 'ALTA',
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '603.503.403-03'),
 (SELECT TOP 1 id FROM TB_SERVICO WHERE subcategoria = 'Limpeza de bueiro'),
 (SELECT TOP 1 id FROM TB_EQUIPE_PUBLICA WHERE nome = 'Equipe Limpeza 03'),
 DATEADD(day, -8, GETDATE()));

IF NOT EXISTS (SELECT 1 FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0009')
INSERT INTO TB_SOLICITACAO (protocolo, descricao, gps, status, prioridade, id_usuario, id_servico, id_equipe, data_criacao) VALUES
('PRO-2025-0009', 'Cabo elétrico exposto no poste da Rua Augusta, 400. Risco de choque elétrico especialmente em dias de chuva.',
 '-23.5510,-46.6380', 'PENDENTE', 'URGENTE',
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '603.503.403-03'),
 (SELECT TOP 1 id FROM TB_SERVICO WHERE subcategoria = 'Cabo exposto'),
 NULL,
 DATEADD(day, -1, GETDATE()));

IF NOT EXISTS (SELECT 1 FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0010')
INSERT INTO TB_SOLICITACAO (protocolo, descricao, gps, status, prioridade, id_usuario, id_servico, id_equipe, data_criacao) VALUES
('PRO-2025-0010', 'Entulho de obra depositado irregularmente na calçada da Rua Bela Vista, 230. Obstrução total da passagem de pedestres.',
 '-23.5520,-46.6390', 'TRIAGEM', 'MEDIA',
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '603.503.403-03'),
 (SELECT TOP 1 id FROM TB_SERVICO WHERE subcategoria = 'Entulho irregular'),
 NULL,
 DATEADD(day, -4, GETDATE()));

IF NOT EXISTS (SELECT 1 FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0011')
INSERT INTO TB_SOLICITACAO (protocolo, descricao, gps, status, prioridade, id_usuario, id_servico, id_equipe, data_criacao) VALUES
('PRO-2025-0011', 'Sinal de trânsito apagado no cruzamento da Avenida Paulista com Rua da Consolação. Causando confusão e risco de acidentes.',
 '-23.5529,-46.6401', 'EM_CAMPO', 'ALTA',
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '603.503.403-03'),
 (SELECT TOP 1 id FROM TB_SERVICO WHERE subcategoria = 'Sinal de transito apagado'),
 (SELECT TOP 1 id FROM TB_EQUIPE_PUBLICA WHERE nome = 'Equipe Pavimentacao 01'),
 DATEADD(day, -7, GETDATE()));

-- === Patricia Souza Lima (604) ===
IF NOT EXISTS (SELECT 1 FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0012')
INSERT INTO TB_SOLICITACAO (protocolo, descricao, gps, status, prioridade, id_usuario, id_servico, id_equipe, data_criacao) VALUES
('PRO-2025-0012', 'Arvore caída sobre a calçada na Rua dos Bandeirantes, 750. Bloqueia passagem de pedestres e pode danificar veículos estacionados.',
 '-23.5540,-46.6415', 'EM_CAMPO', 'URGENTE',
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '604.504.404-04'),
 (SELECT TOP 1 id FROM TB_SERVICO WHERE subcategoria = 'Arvore caida'),
 (SELECT TOP 1 id FROM TB_EQUIPE_PUBLICA WHERE nome = 'Equipe Poda 02'),
 DATEADD(day, -2, GETDATE()));

IF NOT EXISTS (SELECT 1 FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0013')
INSERT INTO TB_SOLICITACAO (protocolo, descricao, gps, status, prioridade, id_usuario, id_servico, id_equipe, data_criacao) VALUES
('PRO-2025-0013', 'Buraco profundo na Rua da Liberdade, 320. Já causou dano em dois veículos. Necessita reparo urgente.',
 '-23.5550,-46.6430', 'PENDENTE', 'ALTA',
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '604.504.404-04'),
 (SELECT TOP 1 id FROM TB_SERVICO WHERE subcategoria = 'Buraco / Tapa-buraco'),
 NULL,
 DATEADD(day, -9, GETDATE()));

IF NOT EXISTS (SELECT 1 FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0014')
INSERT INTO TB_SOLICITACAO (protocolo, descricao, gps, status, prioridade, id_usuario, id_servico, id_equipe, data_criacao) VALUES
('PRO-2025-0014', 'Lâmpada de poste apagada na Rua Vergueiro, 1800. Esquina escura que prejudica a segurança da vizinhança.',
 '-23.5560,-46.6445', 'CONCLUIDA', 'MEDIA',
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '604.504.404-04'),
 (SELECT TOP 1 id FROM TB_SERVICO WHERE subcategoria = 'Lampada apagada'),
 (SELECT TOP 1 id FROM TB_EQUIPE_PUBLICA WHERE nome = 'Equipe Iluminacao 01'),
 DATEADD(day, -25, GETDATE()));

IF NOT EXISTS (SELECT 1 FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0015')
INSERT INTO TB_SOLICITACAO (protocolo, descricao, gps, status, prioridade, id_usuario, id_servico, id_equipe, data_criacao) VALUES
('PRO-2025-0015', 'Terreno baldio sem capina na Rua Santa Cruz, 50. Mato alto, insetos e riscos de incêndio.',
 '-23.5570,-46.6460', 'TRIAGEM', 'BAIXA',
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '604.504.404-04'),
 (SELECT TOP 1 id FROM TB_SERVICO WHERE subcategoria = 'Capina de terreno'),
 NULL,
 DATEADD(day, -14, GETDATE()));

-- === Marcos Antonio Vieira (605) ===
IF NOT EXISTS (SELECT 1 FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0016')
INSERT INTO TB_SOLICITACAO (protocolo, descricao, gps, status, prioridade, id_usuario, id_servico, id_equipe, data_criacao) VALUES
('PRO-2025-0016', 'Rede de esgoto entupida na Rua Haddock Lobo, 500. Água parada na rua com cheiro forte de esgoto.',
 '-23.5580,-46.6475', 'EM_ANDAMENTO', 'URGENTE',
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '605.505.405-05'),
 (SELECT TOP 1 id FROM TB_SERVICO WHERE subcategoria = 'Entupimento de rede'),
 (SELECT TOP 1 id FROM TB_EQUIPE_PUBLICA WHERE nome = 'Equipe Saneamento 01'),
 DATEADD(day, -3, GETDATE()));

IF NOT EXISTS (SELECT 1 FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0017')
INSERT INTO TB_SOLICITACAO (protocolo, descricao, gps, status, prioridade, id_usuario, id_servico, id_equipe, data_criacao) VALUES
('PRO-2025-0017', 'Poste danificado na Rua Pamplona, 180. Estrutura inclinada com risco de queda. Situação de perigo imediato.',
 '-23.5590,-46.6490', 'PENDENTE', 'URGENTE',
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '605.505.405-05'),
 (SELECT TOP 1 id FROM TB_SERVICO WHERE subcategoria = 'Poste danificado'),
 NULL,
 DATEADD(day, -1, GETDATE()));

IF NOT EXISTS (SELECT 1 FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0018')
INSERT INTO TB_SOLICITACAO (protocolo, descricao, gps, status, prioridade, id_usuario, id_servico, id_equipe, data_criacao) VALUES
('PRO-2025-0018', 'Calçada destruída na Rua Frei Caneca, 700. Desnível perigoso que já causou queda de pedestre.',
 '-23.5600,-46.6510', 'CONCLUIDA', 'MEDIA',
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '605.505.405-05'),
 (SELECT TOP 1 id FROM TB_SERVICO WHERE subcategoria = 'Calcada danificada'),
 (SELECT TOP 1 id FROM TB_EQUIPE_PUBLICA WHERE nome = 'Equipe Pavimentacao 01'),
 DATEADD(day, -40, GETDATE()));

IF NOT EXISTS (SELECT 1 FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0019')
INSERT INTO TB_SOLICITACAO (protocolo, descricao, gps, status, prioridade, id_usuario, id_servico, id_equipe, data_criacao) VALUES
('PRO-2025-0019', 'Acúmulo de lixo irregular no estacionamento da Praça da República. Material corrosivo e resíduos orgânicos misturados.',
 '-23.5610,-46.6530', 'EM_CAMPO', 'ALTA',
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '605.505.405-05'),
 (SELECT TOP 1 id FROM TB_SERVICO WHERE subcategoria = 'Entulho irregular'),
 (SELECT TOP 1 id FROM TB_EQUIPE_PUBLICA WHERE nome = 'Equipe Limpeza 03'),
 DATEADD(day, -6, GETDATE()));

IF NOT EXISTS (SELECT 1 FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0020')
INSERT INTO TB_SOLICITACAO (protocolo, descricao, gps, status, prioridade, id_usuario, id_servico, id_equipe, data_criacao) VALUES
('PRO-2025-0020', 'Poda de árvore necessária na Av. São João, 900. Galhos baixos obstruem a passagem de ônibus e caminhões.',
 '-23.5620,-46.6545', 'TRIAGEM', 'MEDIA',
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '605.505.405-05'),
 (SELECT TOP 1 id FROM TB_SERVICO WHERE subcategoria = 'Poda de arvore'),
 NULL,
 DATEADD(day, -10, GETDATE()));

-- === Maria das Gracas Souza (222) — mais solicitações ===
IF NOT EXISTS (SELECT 1 FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0021')
INSERT INTO TB_SOLICITACAO (protocolo, descricao, gps, status, prioridade, id_usuario, id_servico, id_equipe, data_criacao) VALUES
('PRO-2025-0021', 'Buraco perigoso na esquina da Rua das Flores com a Rua das Acácias. Profundidade de mais de 30cm. Urgente reparo.',
 '-23.5525,-46.6355', 'EM_ANDAMENTO', 'URGENTE',
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '222.222.222-22'),
 (SELECT TOP 1 id FROM TB_SERVICO WHERE subcategoria = 'Buraco / Tapa-buraco'),
 (SELECT TOP 1 id FROM TB_EQUIPE_PUBLICA WHERE nome = 'Equipe Pavimentacao 01'),
 DATEADD(day, -4, GETDATE()));

IF NOT EXISTS (SELECT 1 FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0022')
INSERT INTO TB_SOLICITACAO (protocolo, descricao, gps, status, prioridade, id_usuario, id_servico, id_equipe, data_criacao) VALUES
('PRO-2025-0022', 'Iluminação apagada em trecho de 100m na Rua dos Girassóis. Bairro sem luz a noite inteira.',
 '-23.5530,-46.6365', 'TRIAGEM', 'ALTA',
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '222.222.222-22'),
 (SELECT TOP 1 id FROM TB_SERVICO WHERE subcategoria = 'Lampada apagada'),
 NULL,
 DATEADD(day, -2, GETDATE()));

IF NOT EXISTS (SELECT 1 FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0023')
INSERT INTO TB_SOLICITACAO (protocolo, descricao, gps, status, prioridade, id_usuario, id_servico, id_equipe, data_criacao) VALUES
('PRO-2025-0023', 'Vazamento de agua na Rua Carneiro Leão, 450. Perda de agua potável há 8 dias.',
 '-23.5535,-46.6372', 'CONCLUIDA', 'ALTA',
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '222.222.222-22'),
 (SELECT TOP 1 id FROM TB_SERVICO WHERE subcategoria = 'Vazamento de agua'),
 (SELECT TOP 1 id FROM TB_EQUIPE_PUBLICA WHERE nome = 'Equipe Saneamento 01'),
 DATEADD(day, -22, GETDATE()));

-- ============================================================
-- HISTÓRICO DAS NOVAS SOLICITAÇÕES
-- ============================================================

-- PRO-2025-0001 (João, Iluminação)
INSERT INTO TB_HISTORICO (acao, id_solicitacao, id_usuario) VALUES
('Solicitacao registrada pelo cidadao.',
 (SELECT TOP 1 id FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0001'),
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '601.501.401-01'));
INSERT INTO TB_HISTORICO (acao, id_solicitacao, id_usuario) VALUES
('Solicitacao encaminhada para Equipe Iluminacao 01.',
 (SELECT TOP 1 id FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0001'),
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '333.333.333-33'));
INSERT INTO TB_HISTORICO (acao, id_solicitacao, id_usuario) VALUES
('Equipe realizou vistoria no local. Aguardando material.',
 (SELECT TOP 1 id FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0001'),
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '333.333.333-33'));

-- PRO-2025-0002 (João, Buraco)
INSERT INTO TB_HISTORICO (acao, id_solicitacao, id_usuario) VALUES
('Solicitacao registrada pelo cidadao.',
 (SELECT TOP 1 id FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0002'),
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '601.501.401-01'));

-- PRO-2025-0003 (João, Limpeza concluída)
INSERT INTO TB_HISTORICO (acao, id_solicitacao, id_usuario) VALUES
('Solicitacao registrada pelo cidadao.',
 (SELECT TOP 1 id FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0003'),
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '601.501.401-01'));
INSERT INTO TB_HISTORICO (acao, id_solicitacao, id_usuario) VALUES
('Equipe de limpeza realizou varrição e recolheu o lixo acumulado.',
 (SELECT TOP 1 id FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0003'),
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '111.111.111-11'));

-- PRO-2025-0004 (Luciana, Vazamento)
INSERT INTO TB_HISTORICO (acao, id_solicitacao, id_usuario) VALUES
('Solicitacao registrada pelo cidadao.',
 (SELECT TOP 1 id FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0004'),
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '602.502.402-02'));
INSERT INTO TB_HISTORICO (acao, id_solicitacao, id_usuario) VALUES
('Equipe de saneamento encaminhada ao local para reparo.',
 (SELECT TOP 1 id FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0004'),
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '444.444.444-44'));

-- PRO-2025-0005 (Luciana, Esgoto)
INSERT INTO TB_HISTORICO (acao, id_solicitacao, id_usuario) VALUES
('Solicitacao registrada pelo cidadao. Situacao critica identificada.',
 (SELECT TOP 1 id FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0005'),
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '602.502.402-02'));

-- PRO-2025-0008 (Carlos, Bueiro)
INSERT INTO TB_HISTORICO (acao, id_solicitacao, id_usuario) VALUES
('Solicitacao registrada pelo cidadao.',
 (SELECT TOP 1 id FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0008'),
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '603.503.403-03'));
INSERT INTO TB_HISTORICO (acao, id_solicitacao, id_usuario) VALUES
('Equipe realizou desobstrução parcial. Retorno agendado.',
 (SELECT TOP 1 id FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0008'),
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '111.111.111-11'));

-- PRO-2025-0011 (Carlos, Sinal)
INSERT INTO TB_HISTORICO (acao, id_solicitacao, id_usuario) VALUES
('Solicitacao registrada pelo cidadao.',
 (SELECT TOP 1 id FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0011'),
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '603.503.403-03'));
INSERT INTO TB_HISTORICO (acao, id_solicitacao, id_usuario) VALUES
('Equipe Pavimentacao 01 verificou o sinal de transito.',
 (SELECT TOP 1 id FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0011'),
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '111.111.111-11'));

-- PRO-2025-0012 (Patricia, Arvore caida)
INSERT INTO TB_HISTORICO (acao, id_solicitacao, id_usuario) VALUES
('Solicitacao registrada pelo cidadao. Situacao de emergencia.',
 (SELECT TOP 1 id FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0012'),
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '604.504.404-04'));
INSERT INTO TB_HISTORICO (acao, id_solicitacao, id_usuario) VALUES
('Equipe Poda 02 acionada com prioridade. Em deslocamento ao local.',
 (SELECT TOP 1 id FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0012'),
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '555.555.555-55'));

-- PRO-2025-0016 (Marcos, Esgoto entupido)
INSERT INTO TB_HISTORICO (acao, id_solicitacao, id_usuario) VALUES
('Solicitacao registrada pelo cidadao.',
 (SELECT TOP 1 id FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0016'),
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '605.505.405-05'));
INSERT INTO TB_HISTORICO (acao, id_solicitacao, id_usuario) VALUES
('Equipe Saneamento 01 iniciou procedimento de desobstrução.',
 (SELECT TOP 1 id FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0016'),
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '111.111.111-11'));

-- PRO-2025-0019 (Marcos, Entulho)
INSERT INTO TB_HISTORICO (acao, id_solicitacao, id_usuario) VALUES
('Solicitacao registrada pelo cidadao.',
 (SELECT TOP 1 id FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0019'),
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '605.505.405-05'));
INSERT INTO TB_HISTORICO (acao, id_solicitacao, id_usuario) VALUES
('Equipe de limpeza realizou recolhimento parcial do entulho.',
 (SELECT TOP 1 id FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0019'),
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '111.111.111-11'));

-- PRO-2025-0021 (Maria, Buraco urgente)
INSERT INTO TB_HISTORICO (acao, id_solicitacao, id_usuario) VALUES
('Solicitacao registrada pelo cidadao.',
 (SELECT TOP 1 id FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0021'),
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '222.222.222-22'));
INSERT INTO TB_HISTORICO (acao, id_solicitacao, id_usuario) VALUES
('Prioridade URGENTE atribuída pela supervisão. Equipe acionada.',
 (SELECT TOP 1 id FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0021'),
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '111.111.111-11'));

-- PRO-2025-0023 (Maria, Vazamento concluído)
INSERT INTO TB_HISTORICO (acao, id_solicitacao, id_usuario) VALUES
('Solicitacao registrada pelo cidadao.',
 (SELECT TOP 1 id FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0023'),
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '222.222.222-22'));
INSERT INTO TB_HISTORICO (acao, id_solicitacao, id_usuario) VALUES
('Vazamento identificado e reparo efetuado com sucesso pela equipe de saneamento.',
 (SELECT TOP 1 id FROM TB_SOLICITACAO WHERE protocolo = 'PRO-2025-0023'),
 (SELECT TOP 1 id FROM TB_USUARIO WHERE cpf = '444.444.444-44'));
