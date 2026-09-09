# Cuidar+ Brasil 🌿

Plataforma unificada de zeladoria urbana municipal para solicitação e acompanhamento de serviços prestados por Órgãos Públicos. O sistema conecta o **Cidadão** às **Equipes** e **Gestores** competentes, agilizando o atendimento de solicitações diversas de forma centralizada e transparente — com inteligência artificial embarcada.

Este projeto foi construído utilizando as melhores e mais modernas práticas de desenvolvimento de software, com separação clara de responsabilidades entre front-end, back-end e infraestrutura.

---

## 🏗 Estrutura do Projeto

O repositório está dividido nas seguintes partes:

| Diretório | Descrição |
| :--- | :--- |
| **`frontend/`** | Aplicação cliente desenvolvida em **React (Vite)**, estilizada com Glassmorphism e paleta Dark Mode. Comunica-se com a API via Axios com autenticação JWT. |
| **`backend/`** | API RESTful em **Java + Spring Boot 3**. Gerencia dados no **SQL Server**, perfis de usuário, autenticação JWT Stateless e integração com IA via **Spring AI**. |
| **`docker-compose.yml`** | Orquestra toda a infraestrutura: SQL Server, PostgreSQL + pgvector e serviços auxiliares. |

---

## ✨ Funcionalidades

### Núcleo
- 🔐 **Autenticação JWT Stateless** com perfis de acesso (Cidadão, Gestor, Administrador)
- 📋 **Gestão de Solicitações (CRUD completo)** — abertura, acompanhamento, atualização de status e exclusão auditada (DELETE exclusivo do ADMIN)
- 👥 **Gestão de Equipes** — criação de equipes e adição de membros (exclusivos do Gestor) e atribuição de incidentes à equipe
- 🧑‍💼 **Gestão de Gestores** — o ADMIN lista, adiciona e remove gestores da plataforma
- 🧑‍🤝‍🧑 **Listagem de Usuários** — ADMIN vê todos os cidadãos cadastrados; Gestor vê apenas os usuários atrelados à sua equipe
- 📎 **Upload de Anexos** — o cidadão envia fotos do problema (validadas por IA de visão); admin e gestor visualizam e baixam as imagens

### Dashboards, Relatórios e Auditoria
- 📊 **Dashboard Executivo** — métricas e gráficos em tempo real gerados a partir do banco (com isolamento de dados por perfil)
- 🖥️ **Exibição de Relatório em tela** antes da exportação
- 📄 **Exportação de Relatórios em PDF** (jsPDF + autotable) e **Excel** (SheetJS)
- 🕵️ **Auditoria Corporativa** — trilha de auditoria de ações sensíveis e **Login Auditado** (sucessos e falhas), com exportação PDF/Excel
- 📈 **Indicadores Operacionais** — tempo médio de resolução, volumes por status/categoria e tendência mensal produzidos a partir dos dados da plataforma
- 🗺️ **Inteligência Territorial** — agregação de ocorrências por região/bairro (endereço ou GPS)
- 🤖 **Tabela Serviço × Prioridade × Equipe** — base de conhecimento para IA

### Geolocalização e Mapas
- 📍 **Geolocalização no cadastro** — captura de GPS e resolução do endereço completo (rua e número) via geocodificação reversa (Nominatim → Photon → BigDataCloud), persistido no banco
- 🗺️ **Mapa de Alocação** (Gestor) — equipes e ocorrências atribuídas em tempo real
- 🌎 **Mapa Geral de Ocorrências** (Admin) — todas as ocorrências ativas coloridas por prioridade
- 🔎 **Filtro global por região** aplicado em dashboards, mapas, solicitações e equipes

### IA e Acessibilidade
- 🤖 **Luna — Assistente de IA (RAG)** — chatbot inteligente com isolamento JWT. Retorna apenas dados de interesse do solicitante.
- 👁️ **Validação de imagens via Gemini Vision** no cadastro de solicitações
- ♿ **Acessibilidade** — integração com VLibras para tradução em Língua Brasileira de Sinais

---

## 🔐 Modelo de Permissões

| Ação | Cidadão | Gestor | Admin |
| :--- | :---: | :---: | :---: |
| Abrir solicitação (com fotos e GPS) | ✅ | — | — |
| Acompanhar as próprias solicitações | ✅ | — | — |
| Criar equipes / adicionar membros (trabalhadores) | — | ✅ | — |
| Atribuir ou realocar incidentes a uma equipe | — | ✅ (própria equipe) | ✅ (qualquer equipe) |
| Atualizar status/prioridade de ocorrências | — | ✅ (própria equipe) | ✅ (qualquer equipe) |
| Adicionar / remover gestores | — | — | ✅ |
| Excluir solicitações (auditado) | — | — | ✅ |
| Auditoria e Login Auditado | — | — | ✅ |
| Mapa de Alocação da equipe | — | ✅ | — |
| Mapa Geral de Ocorrências | — | — | ✅ |
| Listagem de cidadãos | — | ✅ (da sua equipe) | ✅ (todos) |

---

## 🤖 Arquitetura de Inteligência Artificial (RAG)

O sistema embarca uma arquitetura **RAG (Retrieval-Augmented Generation)** para alimentar a assistente **Luna**:

```
Pergunta do Usuário
       │
       ▼
GeminiEmbeddingModel ──► Vetor da pergunta (3072 dims)
       │
       ▼
PGVector (PostgreSQL) ──► Busca semântica por similaridade
       │
       ▼
Contexto recuperado ──► Prompt enriquecido ──► Gemini 2.0 Flash ──► Resposta
```

| Componente | Tecnologia |
| :--- | :--- |
| **Embedding Model** | `gemini-embedding-001` (3072 dimensões) |
| **Chat Model** | `gemini-2.0-flash` via OpenAI-compat layer |
| **Vector Store** | PostgreSQL + pgvector (índice HNSW, distância cosseno) |
| **Framework AI** | Spring AI 1.0.0-M1 |

---

## 🚀 Como Executar o Projeto

### Pré-requisitos

- [Docker e Docker Compose](https://www.docker.com/products/docker-desktop/)
- [Node.js e NPM](https://nodejs.org/)
- [Java 21+](https://adoptium.net/) e [Maven](https://maven.apache.org/)
- Chave de API do [Google AI Studio](https://aistudio.google.com/app/apikey)

### 1. Configurar a Chave de API

Defina a variável de ambiente com sua chave do Google AI Studio:

```bash
# Windows (PowerShell)
$env:GOOGLE_GENAI_API_KEY = "sua-chave-aqui"

# Linux / macOS
export GOOGLE_GENAI_API_KEY="sua-chave-aqui"
```

### 2. Inicializando a Infraestrutura (Docker)

Suba todos os serviços de banco de dados com:

```bash
docker-compose up -d
```

**O que será provisionado:**
1. 🗄️ **Microsoft SQL Server** na porta `1433` — banco de dados principal
2. 🐘 **PostgreSQL + pgvector** na porta `5432` — armazenamento de embeddings
3. O Spring Boot conecta a ambos automaticamente na inicialização

### 3. Inicializando o Backend (Spring Boot)

```bash
cd backend
mvn spring-boot:run
```

O Flyway executará as migrations automaticamente. A API ficará disponível em `http://localhost:8080`.

> **Nota:** Na primeira inicialização, o sistema fará chamadas à API do Gemini para gerar embeddings das solicitações. Isso pode levar alguns segundos.

### 4. Inicializando o Frontend (React)

```bash
cd frontend
npm install
npm install jspdf-autotable
npm run dev
```

Acesse no seu navegador: **`http://localhost:5173`**

---

## 🧪 Como Testar (Dados Iniciais / Seed)

As *Migrations* do Flyway já inserem dados reais para que você não encontre o sistema vazio.

### Contas Pré-cadastradas

| Perfil | Usuário | CPF | Senha | Equipe Associada (Gestores) |
| :--- | :--- | :--- | :--- | :--- |
| **Administrador** | Administrador Sistema | `000.000.000-00` | `Admin@123` | *Acesso total (Sem equipe)* |
| **Analytics Admin** | Analista de Analytics | `999.999.999-99` | `Analytics@123` | *Leitura + relatórios + auditoria* |
| **Gestor** | Carlos Alberto Silva | `111.111.111-11` | `Gestor@123` | Equipe Pavimentação 01 |
| **Gestor** | Ana Paula Ferreira | `333.333.333-33` | `Gestor@123` | Equipe Iluminação 01 |
| **Gestor** | Roberto Oliveira Santos | `444.444.444-44` | `Gestor@123` | Equipe Saneamento 02 |
| **Gestor** | Fernanda Lima Costa | `555.555.555-55` | `Gestor@123` | Equipe Poda 02 |
| **Gestor** | Gabriela Costa Mendes | `666.666.666-66` | `Gestor@123` | Equipe Limpeza 03 |
| **Cidadão** | Maria das Graças Souza | `222.222.222-22` | `Cidadao@123` | *Não aplicável* |
| **Cidadão** | João Pedro Alves | `601.501.401-01` | `Cidadao@123` | *Não aplicável* |
| **Cidadão** | Luciana Rodrigues Melo | `602.502.402-02` | `Cidadao@123` | *Não aplicável* |
| **Cidadão** | Carlos Eduardo Nunes | `603.503.403-03` | `Cidadao@123` | *Não aplicável* |
| **Cidadão** | Patricia Souza Lima | `604.504.404-04` | `Cidadao@123` | *Não aplicável* |
| **Cidadão** | Marcos Antonio Vieira | `605.505.405-05` | `Cidadao@123` | *Não aplicável* |

*Ou cadastre um novo usuário pela tela de registro.*

### Testando a Luna (Chatbot IA)

1. Faça login com qualquer perfil
2. Clique no ícone de chatbot no canto inferior da tela
3. Pergunte algo como: *"Quais são minhas solicitações abertas?"* ou *"Quantas equipes estão em campo?"*

### Verificando os Logs

```bash
docker-compose logs -f
```

### Isolamento de Dados por Perfil
Todo o front-end e o assistente Luna consomem dados reais do backend. O acesso aos dados é restrito com base no perfil autenticado no token JWT:
- **Cidadão (`CITIZEN`)**: Tem acesso exclusivo e limitado a suas próprias solicitações abertas (na IA e nas telas de acompanhamento).
- **Gestor (`GESTOR`)**: Visualiza e interage unicamente com os indicadores de dashboard, chamados e respostas da IA referentes à sua **Equipe Pública** designada. Não acessa os dados gerais de outras equipes da prefeitura.
- **Administrador (`ADMIN`)**: Possui visão global dos dados, dashboards, auditoria e relatórios. Gerencia gestores, exclui solicitações e pode atribuir ou realocar solicitações entre equipes, bem como atualizar status e prioridade quando necessário.

---

## 🛠 Tecnologias Principais

### Front-End
- **React 19** + **Vite** — framework e build tool
- **Axios** — cliente HTTP com interceptors JWT
- **React Router DOM 7** — roteamento SPA
- **Leaflet / React-Leaflet** — mapas interativos
- **Recharts** — gráficos do dashboard
- **jsPDF + jspdf-autotable** — exportação de relatórios em PDF
- **SheetJS (xlsx)** — exportação de relatórios em Excel
- **Lucide React** — biblioteca de ícones
- **CSS Modules** — estilização por componente
- **VLibras** — acessibilidade em Libras

### Back-End
- **Java 21** + **Spring Boot 3.2.5**
- **Spring Security** + **JWT (JJWT)** — autenticação stateless
- **Spring Data JPA** + **Hibernate** — ORM
- **Spring AI 1.0.0-M1** — framework de IA (RAG, embeddings, chat)
- **Microsoft SQL Server** — banco relacional principal
- **PostgreSQL + pgvector** — banco vetorial para RAG
- **Flyway** — migrações de banco de dados
- **Maven** — gerenciamento de dependências

### IA & Machine Learning
- **Google Gemini API** — via camada de compatibilidade OpenAI
- **gemini-embedding-001** — geração de embeddings (3072 dims)
- **gemini-2.0-flash** — modelo de linguagem para o chatbot
- **pgvector** — busca semântica por similaridade vetorial (HNSW)

### Geocodificação (APIs públicas)
- **Nominatim (OpenStreetMap)** → **Photon (Komoot)** → **BigDataCloud** — cadeia de fallback para resolução reversa de endereços (rua e número) a partir do GPS

### DevOps & Infraestrutura
- **Docker** + **Docker Compose** — containerização
- **Microsoft SQL Server** (container)
- **PostgreSQL 16** (container com extensão pgvector)

---

## 📁 Variáveis de Ambiente

| Variável | Descrição | Padrão |
| :--- | :--- | :--- |
| `GOOGLE_GENAI_API_KEY` | Chave da API do Google AI Studio | *(obrigatória)* |
| `DB_HOST` | Host do SQL Server | `localhost` |
| `DB_PORT` | Porta do SQL Server | `1433` |
| `DB_NAME` | Nome do banco | `cuidar_brasil` |
| `DB_USER` | Usuário do banco | `sa` |
| `DB_PASSWORD` | Senha do banco | `YourPassword123!` |
| `JWT_SECRET` | Segredo para assinatura JWT | *(valor padrão de dev)* |
| `FRONTEND_URL` | URL do frontend para CORS | `http://localhost:5173` |

---

## 👥 Equipe

Projeto desenvolvido para o **Hackathon GovTech — FIAP 2026**.
