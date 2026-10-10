# Cuidar+ Brasil 🌿

Plataforma unificada de zeladoria urbana municipal para solicitação e acompanhamento de serviços prestados por Órgãos Públicos. O sistema conecta o **Cidadão** às **Equipes**, **Gestores** e **Administradores** competentes, agilizando o atendimento de solicitações diversas de forma centralizada, auditada e transparente — com inteligência artificial embarcada e inteligência analítica em tempo real.

Este projeto foi construído utilizando práticas modernas de engenharia de software, com separação clara de responsabilidades entre front-end, back-end, inteligência artificial e infraestrutura de alta performance.

---

## 🏗 Estrutura do Projeto

O repositório está dividido nas seguintes partes:

| Diretório | Descrição |
| :--- | :--- |
| **`frontend/`** | Aplicação cliente desenvolvida em **React 19 + Vite**, estilizada com Glassmorphism e paleta Dark/Light Mode. Comunica-se com a API via Axios com interceptors JWT e renderiza gráficos analíticos interativos via Recharts. |
| **`backend/`** | API RESTful em **Java 17/21 + Spring Boot 3.2.5**. Gerencia dados relacionais no **SQL Server 2022**, vetores no **PostgreSQL 16 + pgvector**, perfis de usuário, autenticação JWT Stateless, rotinas de auditoria e integração com IA via **Spring AI**. |
| **`docker-compose.yml`** | Orquestra a infraestrutura de dados: Microsoft SQL Server 2022, inicializador de banco e PostgreSQL 16 com extensão `pgvector`. |

---

## ✨ Funcionalidades da Plataforma

### 1. Núcleo e Atendimento ao Cidadão
- 🔐 **Autenticação JWT Stateless** — controle de sessão seguro com perfis (`CITIZEN`, `GESTOR`, `ADMIN`, `GLOBAL_ADMIN`, `ANALYTICS_ADMIN`, `TRABALHADOR`).
- 📋 **Gestão de Solicitações (CRUD completo)** — abertura de ocorrências com protocolo automático, acompanhamento de status em tempo real e histórico de tramitação.
- ⭐ **Avaliação e Feedback com CSAT** — o cidadão pode avaliar o serviço concluído atribuindo notas de 1 a 5 estrelas e comentários detalhados.
- 📎 **Upload de Fotos com Validação por IA** — envio de fotos do problema com validação automática via Gemini Vision para verificar a conformidade e pertinência da imagem com o chamado.
- 📍 **Geolocalização Inteligente** — captura de coordenadas GPS e resolução automática do logradouro (rua, número, bairro e cidade) por cadeia de fallback de geocodificação reversa (*Nominatim → Photon → BigDataCloud*).

### 2. Gestão Operacional e Administrativa
- 👥 **Gestão de Equipes Públicas** — criação e gestão de equipes pelo Administrador; inclusão de trabalhadores operacionais e gestores responsáveis.
- 🧑‍💼 **Gestão de Gestores** — atribuição e visualização de gestores responsáveis por cada equipe e órgão público.
- 🏛️ **Gestão de Órgãos Públicos** — cadastro, consulta e controle de órgãos municipais e estaduais (exclusivo para Administrador Global).
- 🧑‍🤝‍🧑 **Controle de Usuários e Perfis** — isolamento estrito de visualização de usuários conforme a hierarquia do perfil autenticado.
- 🗑️ **Exclusão Auditada** — exclusão de solicitações restrita ao perfil Administrador, gerando registros compulsórios na trilha de auditoria.

### 3. Dashboards Analíticos Avançados (Fase 6)
O módulo de inteligência analítica foi expandido com consultas SQL avançadas e métricas em tempo real, organizadas em abas dedicadas no **Dashboard Operacional** e na **Central de Relatórios**:

- ⏱️ **Análise de SLA por Categoria**:
  - Cálculo analítico de conformidade de prazos através de expressões `DATEDIFF` em horas úteis.
  - Métricas de tempo médio de resolução, total de chamados finalizados e taxa percentual de cumprimento de SLA.
  - Identificação imediata de categorias em risco ou com tempo de resposta acima da meta acordada.
- 🏆 **Ranking de Performance das Equipes**:
  - Classificação multidimensional de equipes baseada em: volume de casos resolvidos, taxa de resolução e tempo médio de conclusão.
  - Média de satisfação dos cidadãos (*Citizen Rating Score*) por equipe, gerando visibilidade sobre eficiência e qualidade técnica.
- ⭐ **Satisfação do Cidadão (CSAT & Net Promoter)**:
  - Distribuição estatística de notas de 1 a 5 estrelas calculada de forma segura com `ISNULL(SUM(...), 0)`.
  - Média ponderada geral, percentual de satisfação (CSAT %) e painel com os comentários de feedback mais recentes.
- ⚠️ **Gargalos Urbanos & Etapas Estagnadas**:
  - Detecção proativa de solicitações estagnadas nos estados `PENDENTE`, `TRIAGEM`, `EM_ANDAMENTO` ou `EM_CAMPO`.
  - Cálculo de dias em aberto, sinalização de prioridade (`ALTA`/`URGENTE`) e indicador visual de atraso operacional.
- 🔄 **Distribuição de Turnos & Cargas Operacionais**:
  - Agrupamento de solicitações por turnos (Manhã, Tarde, Noite) e dias da semana para apoiar o dimensionamento das escalas de trabalho das equipes de campo.

### 4. Melhorias de Ordenação e Filtros Avançados (Fase 6)
- 🔀 **Ordenação Dinâmica Multicolunas**:
  - As listagens de solicitações e equipes contam com ordenação interativa por cabeçalho de coluna: `dataAbertura`, `prioridade`, `status`, `sla`, `protocolo`, `nome`.
  - Direção alternável com feedback visual (`asc` / `desc`) integrada nativamente com a paginação do Spring Data JPA (`Pageable`).
- 🔍 **Filtro Hierárquico por Gestor**:
  - O Administrador do Órgão pode visualizar o panorama geral de todas as equipes ou filtrar a visualização por um gestor específico, atualizando dinamicamente todos os gráficos e KPIs.
- 📅 **Filtro Temporal Flexível com Fallback Inteligente**:
  - Os endpoints de relatórios e análises aceitam intervalos de datas (`inicio` e `fim`) e aplicam automaticamente o período padrão dos últimos 30 dias quando omitidos, prevenindo falhas de requisição.

### 5. Auditoria Corporativa e Exportação
- 📊 **Dashboard Executivo e Global** — visão condensada de KPIs nacionais com contagem de órgãos, equipes e solicitações.
- 🕵️ **Login Auditado & Trilha de Auditoria** — registro completo de acessos com filtros avançados (sucesso/falha, CPF, usuário, detalhes, IP, período), paginação e exportação.
- 📄 **Central de Relatórios com Exportação** — relatórios executivos (*Resumo, Categoria, Status, Tendência Mensal e Indicadores*) com exportação para **PDF** (jsPDF + AutoTable) e **Excel** (SheetJS).
- 🗺️ **Mapa Geral e de Alocação (Leaflet)** — mapa interativo com marcadores coloridos por status e prioridade, filtros por região e raio de atendimento.

### 6. Inteligência Artificial e Acessibilidade
- 🤖 **Luna — Assistente IA com RAG** — chatbot flutuante com janela redimensionável e arrastável, renderização Markdown e busca vetorial sobre a base de conhecimento e solicitações.
- 👁️ **Validação de Imagens via Gemini Vision** — análise multimodal para conferência de conformidade no cadastro de ocorrências.
- ♿ **Acessibilidade Completa** — integração nativa com o **VLibras** para tradução em Língua Brasileira de Sinais.

---

## 🔐 Modelo de Permissões e Isolamento de Escopo

Todo o front-end e o assistente Luna consomem dados reais do backend com isolamento estrito via token JWT Stateless:

| Ação / Visualização | Cidadão (`CITIZEN`) | Gestor (`GESTOR`) | Admin do Órgão (`ADMIN`) | Admin Global (`GLOBAL_ADMIN`) | Analista (`ANALYTICS_ADMIN`) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Abrir solicitação com fotos e GPS | ✅ | — | — | — | — |
| Acompanhar e avaliar solicitações próprias | ✅ *(apenas suas)* | — | — | — | — |
| Acessar Dashboard Operacional & Abas Analíticas | — | ✅ *(sua equipe)* | ✅ *(do seu órgão / filtro gestor)* | ✅ *(geral consolidado)* | ✅ *(geral consolidado)* |
| Criar e gerenciar equipes | — | — | ✅ | ✅ | — |
| Adicionar trabalhadores à própria equipe | — | ✅ | ✅ | ✅ | — |
| Atribuir / alterar status e prioridade | — | ✅ *(sua equipe)* | ✅ *(do seu órgão)* | ✅ *(geral)* | — |
| Gerenciar Órgãos Públicos | — | — | — | ✅ | — |
| Visualizar Mapas e Ocorrências | — | ✅ *(sua equipe)* | ✅ *(do seu órgão)* | ✅ *(geral)* | — |
| Acessar Dashboard Executivo & Login Auditado | — | — | ✅ *(do seu órgão)* | ✅ *(geral)* | ✅ *(geral)* |
| Emitir e exportar Relatórios (PDF/Excel) | — | ✅ *(sua equipe)* | ✅ *(do seu órgão)* | ✅ *(geral)* | ✅ *(geral)* |
| Excluir solicitações (auditado) | — | — | ✅ | ✅ | — |
| Assistente Virtual Luna (RAG) | ✅ *(seus chamados)* | ✅ *(sua equipe)* | ✅ *(seu órgão)* | ✅ *(geral)* | ✅ *(geral)* |

---

## 🤖 Arquitetura de Inteligência Artificial (RAG)

O sistema conta com uma arquitetura **RAG (Retrieval-Augmented Generation)** integrada ao Spring AI para alimentar a assistente **Luna**:

```
Pergunta do Usuário
       │
       ▼
GeminiEmbeddingModel ──► Vetor da pergunta (1536/3072 dims)
       │
       ▼
PGVector (PostgreSQL) ──► Busca semântica por similaridade (HNSW + Cosine)
       │
       ▼
Contexto recuperado ──► Prompt com isolamento JWT ──► Gemini Flash ──► Resposta
```

| Componente | Tecnologia | Configuração / Detalhes |
| :--- | :--- | :--- |
| **Embedding Model** | `gemini-embedding-001` | Vetorização semântica das solicitações e base de serviços |
| **Chat Model** | `gemini-3.5-flash-lite` / `gemini-2.0-flash` | Respostas contextuais via camada OpenAI-compatible |
| **Vision Model** | Gemini Vision API | Validação automática de fotos enviadas pelo cidadão |
| **Vector Store** | PostgreSQL 16 + `pgvector` | Índice HNSW com métrica de distância cosseno |
| **Framework AI** | Spring AI 1.0.0-M1 | Orquestração de embeddings, prompts e vector store |

---

## 🚀 Como Executar o Projeto

### Pré-requisitos

- [Docker e Docker Compose](https://www.docker.com/products/docker-desktop/)
- [Node.js (v18+) e NPM](https://nodejs.org/)
- [Java 17 ou 21+](https://adoptium.net/) e [Maven](https://maven.apache.org/) (ou utilize o wrapper `./mvnw` incluso)
- Chave de API do [Google AI Studio](https://aistudio.google.com/app/apikey)

---

### 1. Configurar a Chave de API

Defina a variável de ambiente no seu terminal com sua chave do Google AI Studio:

```bash
# Windows (PowerShell)
$env:GOOGLE_GENAI_API_KEY = "sua-chave-aqui"

# Linux / macOS (Bash / Zsh)
export GOOGLE_GENAI_API_KEY="sua-chave-aqui"
```

---

### 2. Inicializar a Infraestrutura (Docker)

Na raiz do projeto, inicie os containers dos bancos de dados:

```bash
docker-compose up -d
```

**Serviços provisionados:**
1. 🗄️ **Microsoft SQL Server 2022** na porta `1433` (banco relacional principal).
2. 🔄 **Database Init** — provisionamento automático da base `cuidar_brasil`.
3. 🐘 **PostgreSQL 16 + pgvector** na porta `5432` (armazenamento vetorial do RAG).

---

### 3. Inicializar o Back-End (Spring Boot)

Navegue até a pasta `backend` e execute a aplicação:

```bash
cd backend

# Windows (PowerShell)
.\mvnw.cmd spring-boot:run

# Linux / macOS
./mvnw spring-boot:run
```

O Flyway executará as migrações automaticamente no SQL Server. A API ficará disponível em **`http://localhost:8080`**.

> **Nota:** Na primeira inicialização, o sistema fará chamadas à API do Gemini para gerar embeddings das solicitações no PGVector.

---

### 4. Inicializando o Frontend (React)

Navegue até a pasta `frontend` e execute:

```bash
cd frontend
npm install
npm run dev
```

Acesse a aplicação no navegador em: **`http://localhost:5173`**

---

## 🧪 Contas de Teste Pré-cadastradas

As migrações do Flyway já populam automaticamente os dados iniciais, equipes, serviços, avaliações e perfis para testes completos da plataforma:

| Perfil | Usuário | CPF | Senha | Escopo Associado |
| :--- | :--- | :--- | :--- | :--- |
| **Administrador do Órgão** | Administrador Sistema | `000.000.000-00` | `Admin@123` | Prefeitura de São Paulo (PMSP) - 9 Equipes |
| **Administrador Global** | Administrador Global | `888.888.888-88` | `Admin@123` | Gestão Global de Órgãos e Visão País |
| **Analytics Admin** | Analista de Analytics | `999.999.999-99` | `Analytics@123` | Leitura Analítica Nacional, Relatórios & Auditoria |
| **Gestor** | Carlos Alberto Silva | `111.111.111-11` | `Gestor@123` | Equipe Pavimentação 01 (PMSP) |
| **Gestor** | Ana Paula Ferreira | `333.333.333-33` | `Gestor@123` | Equipe Iluminação 01 (ENEL) |
| **Gestor** | Roberto Oliveira Santos | `444.444.444-44` | `Gestor@123` | Equipe Saneamento 02 (SABESP) |
| **Gestor** | Fernanda Lima Costa | `555.555.555-55` | `Gestor@123` | Equipe Poda 02 (COMCAP) |
| **Gestor** | Gabriela Costa Mendes | `666.666.666-66` | `Gestor@123` | Equipe Limpeza 03 (COMCAP) |

### Cidadãos de Teste

As migrações V3 e V4 criam seis contas de cidadão com solicitações de exemplo. Todas usam a senha `Cidadao@123`:

| Cidadão | CPF | E-mail | Senha | Dados semeados |
| :--- | :--- | :--- | :--- | :--- |
| Maria das Graças Souza | `222.222.222-22` | `maria.souza@email.com` | `Cidadao@123` | 8 solicitações |
| João Pedro Alves | `601.501.401-01` | `joao.alves@email.com` | `Cidadao@123` | 3 solicitações |
| Luciana Rodrigues Melo | `602.502.402-02` | `luciana.melo@email.com` | `Cidadao@123` | 4 solicitações |
| Carlos Eduardo Nunes | `603.503.403-03` | `carlos.nunes@email.com` | `Cidadao@123` | 4 solicitações |
| Patricia Souza Lima | `604.504.404-04` | `patricia.lima@email.com` | `Cidadao@123` | 4 solicitações |
| Marcos Antonio Vieira | `605.505.405-05` | `marcos.vieira@email.com` | `Cidadao@123` | 5 solicitações |

Os volumes acima correspondem aos registros de exemplo associados a cada conta nas migrações; eles não representam necessariamente o total atual após uso ou alterações no banco.

---

## 🔬 Como Executar a Bateria de Verificação Minuciosa

Para validar a integridade de todas as rotas, autenticações e regras de isolamento em lote, execute o script PowerShell incluso:

```bash
# Executa a verificação completa de todos os 5 perfis e endpoints analíticos
powershell -ExecutionPolicy Bypass -File scratch/comprehensive_check.ps1
```

O script executa chamadas em tempo real na API e imprime uma tabela validando:
- Isolamento de escopo por perfil
- Retorno de dados analíticos (SLA, Ranking, Satisfação, Gargalos, Turnos)
- Emissão de relatórios e consultas de auditoria

---

## 📁 Variáveis de Ambiente

| Variável | Descrição | Padrão / Fallback |
| :--- | :--- | :--- |
| `GOOGLE_GENAI_API_KEY` | Chave de API do Google AI Studio (Gemini) | *(obrigatória para IA)* |
| `DB_HOST` | Host do SQL Server | `localhost` |
| `DB_PORT` | Porta do SQL Server | `1433` |
| `DB_NAME` | Nome do banco relacional | `cuidar_brasil` |
| `DB_USER` | Usuário do banco de dados | `sa` |
| `DB_PASSWORD` | Senha do banco de dados | `YourPassword123!` |
| `JWT_SECRET` | Chave secreta de assinatura JWT | *(valor seguro padrão de dev)* |
| `JWT_EXPIRATION` | Tempo de expiração do token (ms) | `86400000` (24 horas) |
| `FRONTEND_URL` | Origens autorizadas para CORS | `http://localhost:5173,http://localhost:5174` |
| `UPLOAD_DIR` | Diretório de armazenamento de anexos | `uploads` |

---

## 👥 Equipe

Projeto desenvolvido para o **Hackathon GovTech — FIAP 2026**.
