# Cuidar+ Brasil 🌿

Plataforma unificada de zeladoria urbana municipal para solicitação e acompanhamento de serviços prestados por Órgãos Públicos. O sistema conecta o **Cidadão** às **Equipes**, **Gestores** e **Administradores** competentes, agilizando o atendimento de solicitações diversas de forma centralizada, auditada e transparente — com inteligência artificial embarcada.

Este projeto foi construído utilizando práticas modernas de desenvolvimento de software, com separação clara de responsabilidades entre front-end, back-end, inteligência artificial e infraestrutura.

---

## 🏗 Estrutura do Projeto

O repositório está dividido nas seguintes partes:

| Diretório | Descrição |
| :--- | :--- |
| **`frontend/`** | Aplicação cliente desenvolvida em **React 19 + Vite**, estilizada com Glassmorphism e paleta Dark/Light Mode. Comunica-se com a API via Axios com interceptors JWT. |
| **`backend/`** | API RESTful em **Java 17/21 + Spring Boot 3.2.5**. Gerencia dados relacionais no **SQL Server**, vetores no **PostgreSQL + pgvector**, perfis de usuário, autenticação JWT Stateless e integração com IA via **Spring AI**. |
| **`docker-compose.yml`** | Orquestra a infraestrutura de dados: Microsoft SQL Server 2022, inicializador de banco e PostgreSQL 16 com extensão `pgvector`. |

---

## ✨ Funcionalidades

### Núcleo e Atendimento ao Cidadão
- 🔐 **Autenticação JWT Stateless** — controle de sessão seguro com perfis (`CITIZEN`, `GESTOR`, `ADMIN`, `GLOBAL_ADMIN`, `ANALYTICS_ADMIN`, `TRABALHADOR`).
- 📋 **Gestão de Solicitações (CRUD completo)** — abertura de ocorrências com protocolo automático, acompanhamento de status em tempo real e histórico de tramitação.
- ⭐ **Avaliação e Feedback** — o cidadão pode avaliar o serviço concluído atribuindo notas (estrelas) e comentários de feedback.
- 📎 **Upload de Fotos com Validação por IA** — envio de fotos do problema com validação automática via Gemini Vision para verificar a coerência da imagem com a solicitação.
- 📍 **Geolocalização Inteligente** — captura de GPS e resolução automática do endereço (rua, número, bairro e cidade) por cadeia de fallback de geocodificação reversa (*Nominatim → Photon → BigDataCloud*).

### Gestão Operacional e Administrativa
- 👥 **Gestão de Equipes Públicas** — criação e gestão de equipes pelo Administrador; inclusão de trabalhadores operacionais e gestores responsáveis.
- 🧑‍💼 **Gestão de Gestores** — atribuição e visualização de gestores responsáveis por cada equipe e órgão público.
- 🏛️ **Gestão de Órgãos Públicos** — cadastro, consulta e controle de órgãos municipais e estaduais (exclusivo para Administrador Global).
- 🧑‍🤝‍🧑 **Controle de Usuários** — isolamento de visualização de usuários conforme a hierarquia do perfil autenticado.
- 🗑️ **Exclusão Auditada** — exclusão de solicitações restrita ao perfil Administrador, gerando registros compulsórios na trilha de auditoria.

### Dashboards, Relatórios e Auditoria Corporativa
- 📊 **Dashboard Executivo e Global** — indicadores em tempo real com isolamento de dados por órgão e perfil, contagem de gestores, equipes, usuários e órgãos.
- 📈 **Gráficos Operacionais (Recharts)** — visão analítica de volumes por categoria, distribuição por status, tendências mensais e tempo médio de atendimento.
- 🕵️ **Login Auditado & Trilha de Auditoria** — registro completo de acessos com filtros avançados (sucesso/falha, CPF, usuário, detalhes, IP, período), paginação e exportação.
- 📄 **Central de Relatórios** — relatórios analíticos (*Resumo Executivo, Categoria, Status, Tendência Mensal, Indicadores Nacionais e Matriz IA*) com pré-visualização em tela e exportação para **PDF** (jsPDF + AutoTable) e **Excel** (SheetJS).
- 🗺️ **Mapa Geral e de Alocação (Leaflet)** — mapa interativo com marcadores coloridos por status e prioridade, filtros por região e visualização de raio de atendimento.

### Inteligência Artificial e Acessibilidade
- 🤖 **Luna — Assistente IA com RAG** — chatbot flutuante com janela redimensionável e arrastável, renderização Markdown e busca vetorial sobre a base de conhecimento e solicitações.
- 👁️ **Validação de Imagens via Gemini Vision** — análise multimodal para conferência de conformidade no cadastro de ocorrências.
- ♿ **Acessibilidade Completa** — integração nativa com o **VLibras** para tradução em Língua Brasileira de Sinais.

---

## 🔐 Modelo de Permissões

| Ação | Cidadão (`CITIZEN`) | Gestor (`GESTOR`) | Admin do Órgão (`ADMIN`) | Admin Global (`GLOBAL_ADMIN`) | Analista (`ANALYTICS_ADMIN`) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Abrir solicitação com fotos e GPS | ✅ | — | — | — | — |
| Acompanhar e avaliar solicitações | ✅ | — | — | — | — |
| Criar e gerenciar equipes | — | — | ✅ | ✅ | — |
| Adicionar trabalhadores à própria equipe | — | ✅ | ✅ | ✅ | — |
| Atribuir / alterar status e prioridade | — | ✅ *(própria equipe)* | ✅ *(do seu órgão)* | ✅ *(geral)* | — |
| Gerenciar Órgãos Públicos | — | — | — | ✅ | — |
| Visualizar Mapas e Ocorrências | — | ✅ *(própria equipe)* | ✅ *(do seu órgão)* | ✅ *(geral)* | — |
| Acessar Dashboard Operacional / Gráficos | — | ✅ | ✅ | ✅ | ✅ |
| Acessar Dashboard Executivo & Login Auditado | — | — | ✅ *(do seu órgão)* | ✅ *(geral)* | ✅ *(geral)* |
| Emitir e exportar Relatórios (PDF/Excel) | — | ✅ *(da equipe)* | ✅ *(do órgão)* | ✅ *(geral)* | ✅ *(geral)* |
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

---

> **Nota:** Na primeira inicialização, o sistema fará chamadas à API do Gemini para gerar embeddings das solicitações. Isso pode levar alguns segundos.

### 4. Inicializando o Frontend (React)

```bash
cd frontend
npm install
npm install jspdf-autotable
npm run dev
```

Acesse a aplicação no navegador em: **`http://localhost:5173`**

---

## 🧪 Como Testar (Contas de Seed Pré-cadastradas)

As migrações do Flyway já populam automaticamente os dados iniciais, equipes, serviços e perfis para testes completos da plataforma:

### Contas Pré-cadastradas

| Perfil | Usuário | CPF | Senha | Equipe Associada (Gestores) |
| :--- | :--- | :--- | :--- | :--- |
| **Administrador do Órgão** | Administrador Sistema | `000.000.000-00` | `Admin@123` | Prefeitura de São Paulo (PMSP) |
| **Administrador Global** | Administrador Global | `888.888.888-88` | `Admin@123` | Gestão Global de Órgãos |
| **Analytics Admin** | Analista de Analytics | `999.999.999-99` | `Analytics@123` | Analytics, Relatórios & Auditoria |
| **Gestor** | Carlos Alberto Silva | `111.111.111-11` | `Gestor@123` | Equipe Pavimentação 01 (PMSP) |
| **Gestor** | Ana Paula Ferreira | `333.333.333-33` | `Gestor@123` | Equipe Iluminação 01 (ENEL) |
| **Gestor** | Roberto Oliveira Santos | `444.444.444-44` | `Gestor@123` | Equipe Saneamento 02 (SABESP) |
| **Gestor** | Fernanda Lima Costa | `555.555.555-55` | `Gestor@123` | Equipe Poda 02 (COMCAP) |
| **Gestor** | Gabriela Costa Mendes | `666.666.666-66` | `Gestor@123` | Equipe Limpeza 03 (COMCAP) |
| **Cidadão** | Maria das Graças Souza | `222.222.222-22` | `Cidadao@123` | Cidadão Solicitante |
| **Cidadão** | João Pedro Alves | `601.501.401-01` | `Cidadao@123` | Cidadão Solicitante |
| **Cidadão** | Luciana Rodrigues Melo | `602.502.402-02` | `Cidadao@123` | Cidadão Solicitante |
| **Cidadão** | Carlos Eduardo Nunes | `603.503.403-03` | `Cidadao@123` | Cidadão Solicitante |
| **Cidadão** | Patricia Souza Lima | `604.504.404-04` | `Cidadao@123` | Cidadão Solicitante |
| **Cidadão** | Marcos Antonio Vieira | `605.505.405-05` | `Cidadao@123` | Cidadão Solicitante |

> *Dica: Novos cidadãos também podem ser cadastrados diretamente pela tela pública de Cadastro.*

### Testando a Luna (Chatbot IA)

1. Faça login com qualquer perfil
2. Clique no ícone de chatbot no canto inferior direito da tela
3. Pergunte algo como: *"Quais são minhas solicitações abertas?"*, *"Quantas equipes estão em campo?"* ou *"Qual o tempo médio de atendimento?"*

### Verificando os Logs

```bash
docker-compose logs -f
```

### Isolamento de Dados por Perfil
Todo o front-end e o assistente Luna consomem dados reais do backend. O acesso aos dados é restrito com base no perfil autenticado no token JWT:
- **Cidadão (`CITIZEN`)**: Tem acesso exclusivo e limitado a suas próprias solicitações abertas (na IA e nas telas de acompanhamento e avaliação).
- **Gestor (`GESTOR`)**: Visualiza e interage unicamente com os indicadores de dashboard, equipes, chamados e respostas da IA referentes à sua **Equipe Pública** designada. Não acessa os dados gerais de outras equipes da prefeitura.
- **Administrador do Órgão (`ADMIN`)**: Possui visão dos dados, dashboards, auditoria e relatórios do próprio órgão. Gerencia equipes e gestores, exclui solicitações e pode atribuir ou realocar solicitações entre equipes do órgão, bem como atualizar status e prioridade.
- **Administrador Global (`GLOBAL_ADMIN`)**: Administra os órgãos públicos, além de acessar dashboards, relatórios e auditoria em visão global.
- **Analytics Admin (`ANALYTICS_ADMIN`)**: Acesso para auditoria, leitura analítica de indicadores nacionais, relatórios executivos e consultas avançadas na assistente Luna.

---

## 🛠 Tecnologias Principais

### Front-End
- **React 19** + **Vite 8** — interface SPA reativa de alta performance
- **React Router DOM 7** — navegação declarativa protegida por perfis
- **Axios** — cliente HTTP com interceptor para autenticação JWT Stateless
- **Leaflet & React-Leaflet** — mapas interativos georreferenciados
- **Recharts** — gráficos e métricas operacionais
- **jsPDF & jsPDF-AutoTable** — geração e exportação de relatórios e auditorias em PDF
- **SheetJS (xlsx)** — exportação de relatórios e auditorias em planilhas Excel
- **React Rnd & React Markdown** — assistente virtual flutuante e responsivo
- **Lucide React** — iconografia moderna e consistente
- **CSS Modules** — estilos encapsulados com tema Glassmorphism e Dark/Light mode
- **VLibras** — acessibilidade e inclusão em Língua Brasileira de Sinais

### Back-End
- **Java 17 / 21** + **Spring Boot 3.2.5**
- **Spring Security** + **JJWT 0.12.5** — segurança stateless baseada em Bearer Token
- **Spring Data JPA** + **Hibernate** — persistência relacional
- **Spring AI 1.0.0-M1** — integração de IA generativa (Chat, Embeddings e Vector Store)
- **Microsoft SQL Server 2022** — banco relacional principal
- **PostgreSQL 16 + pgvector** — banco vetorial para busca semântica (RAG)
- **Flyway** — versionamento e migrações automáticas de banco de dados
- **Maven Wrapper** — reprodutibilidade de compilação e execução

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
