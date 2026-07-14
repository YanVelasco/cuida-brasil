package br.gov.cuidar.config;

import org.postgresql.ds.PGSimpleDataSource;
import org.springframework.ai.vectorstore.PgVectorStore;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class VectorStoreConfig {

    @Bean
    public VectorStore pgVectorStore(GeminiEmbeddingModel embeddingModel) {
        PGSimpleDataSource dataSource = new PGSimpleDataSource();
        // Conecta ao container postgres-pgvector isolado
        dataSource.setURL("jdbc:postgresql://localhost:5432/vectordb");
        dataSource.setUser("postgres");
        dataSource.setPassword("root");

        JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);

        // Cria a extensão e tabela manualmente pois desativamos a auto-configuração
        jdbcTemplate.execute("CREATE EXTENSION IF NOT EXISTS vector");
        jdbcTemplate.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"");
        jdbcTemplate.execute("DROP TABLE IF EXISTS vector_store CASCADE");
        jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS vector_store (
                id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
                content text,
                metadata json,
                embedding vector(3072)
            )
            """);
            
        return new PgVectorStore(jdbcTemplate, embeddingModel);
    }
}
