# Cuidar+Brasil API — Backend

API REST para a plataforma cidadã **Cuidar+Brasil**, desenvolvida com **Java 17 + Spring Boot 3.2**, autenticação **JWT**, banco de dados **SQL Server** e migrations via **Flyway**.

## Requisitos

- Java 17+
- Maven 3.8+
- SQL Server (local ou Docker)

## Configuração Rápida

### 1. SQL Server com Docker (se nao tiver instalado)
```bash
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourPassword123!" \
  -p 1433:1433 --name sqlserver-cuidar \
  -d mcr.microsoft.com/mssql/server:2022-latest
```

### 2. Criar o banco de dados
```sql
CREATE DATABASE cuidar_brasil;
```

### 3. Copiar e configurar variaveis
```bash
cp .env.example .env
# Edite .env com suas credenciais
```

### 4. Executar
```bash
mvn spring-boot:run
```

O Flyway aplicará as 3 migrations automaticamente na inicializacao.

## Endpoints Principais

| Metodo | Endpoint | Descricao | Auth |
|--------|----------|-----------|------|
| POST | `/api/auth/login` | Login com CPF + senha | Publico |
| POST | `/api/auth/cadastro` | Cadastro de cidadao | Publico |
| GET | `/api/auth/me` | Dados do usuario logado | JWT |
| GET | `/api/solicitacoes/minhas` | Minhas solicitacoes | JWT |
| POST | `/api/solicitacoes` | Criar solicitacao | JWT |
| GET | `/api/solicitacoes` | Todas as solicitacoes | ADMIN/GESTOR |
| PUT | `/api/solicitacoes/{id}/status` | Atualizar status | ADMIN/GESTOR |
| GET | `/api/admin/dashboard` | KPIs do dashboard | ADMIN/GESTOR |
| GET | `/api/equipes` | Listar equipes | ADMIN/GESTOR |
| GET | `/api/orgaos` | Listar orgaos | ADMIN/GESTOR |
| GET | `/api/servicos` | Listar servicos | Publico |

## Usuarios de Teste (Seed)

| CPF | Senha | Perfil |
|-----|-------|--------|
| 000.000.000-00 | Admin@123 | ADMIN |
| 111.111.111-11 | Admin@123 | GESTOR |
| 222.222.222-22 | Admin@123 | CITIZEN |

## Estrutura do Projeto

```
src/main/java/br/gov/cuidar/
├── config/          # SecurityConfig, CorsConfig
├── security/        # JwtTokenProvider, JwtAuthFilter
├── entity/          # Entidades JPA (9 tabelas)
├── repository/      # Spring Data Repositories
├── service/         # Logica de negocio
├── controller/      # REST Controllers
├── dto/             # Request/Response DTOs
└── exception/       # GlobalExceptionHandler

src/main/resources/db/migration/
├── V1__create_tables.sql       # DDL das 9 tabelas
├── V2__create_constraints.sql  # FKs e indices
└── V3__seed_data.sql           # Dados iniciais
```
