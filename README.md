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

- 🔐 **Autenticação JWT Stateless** com perfis de acesso (Cidadão, Gestor, Administrador)
- 📋 **Gestão de Solicitações** — abertura, acompanhamento e atualização de status
- 👥 **Gestão de Equipes** — criação, listagem e atribuição de solicitações
- 📊 **Dashboard Administrativo** — métricas em tempo real do sistema
- 🤖 **Luna — Assistente de IA (RAG)** — chatbot inteligente com memória vetorial que responde perguntas sobre as solicitações do usuário usando Gemini AI + PGVector
- ♿ **Acessibilidade** — integração com VLibras para tradução em Língua Brasileira de Sinais

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
npm run dev
```

Acesse no seu navegador: **`http://localhost:5173`**

---

## 🧪 Como Testar (Dados Iniciais / Seed)

As *Migrations* do Flyway já inserem dados reais para que você não encontre o sistema vazio.

### Contas Pré-cadastradas

| Perfil | CPF | Senha | Permissões |
| :--- | :--- | :--- | :--- |
| **Administrador** | `000.000.000-00` | `Admin@123` | Acesso total ao sistema |
| **Gestor** | `111.111.111-11` | `Gestor@123` | Gerencia equipes e solicitações |
| **Cidadão** | `222.222.222-22` | `Cidadao@123` | Acompanha e abre solicitações |

*Ou cadastre um novo usuário pela tela de registro.*

### Testando a Luna (Chatbot IA)

1. Faça login com qualquer perfil
2. Clique no ícone de chatbot no canto inferior da tela
3. Pergunte algo como: *"Quais são minhas solicitações abertas?"* ou *"Quantas equipes estão em campo?"*

### Verificando os Logs

```bash
docker-compose logs -f
```

---

## 🛠 Tecnologias Principais

### Front-End
- **React 18** + **Vite** — framework e build tool
- **Axios** — cliente HTTP com interceptors JWT
- **React Router DOM** — roteamento SPA
- **Phosphor Icons** — biblioteca de ícones
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
