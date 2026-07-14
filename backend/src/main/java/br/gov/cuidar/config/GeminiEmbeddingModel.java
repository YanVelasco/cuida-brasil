package br.gov.cuidar.config;

import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.embedding.EmbeddingRequest;
import org.springframework.ai.embedding.EmbeddingResponse;
import org.springframework.ai.embedding.Embedding;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.HttpEntity;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@Primary
public class GeminiEmbeddingModel implements EmbeddingModel {

    @Value("${spring.ai.openai.api-key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public EmbeddingResponse call(EmbeddingRequest request) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=" + apiKey;
        List<Embedding> embeddings = new ArrayList<>();

        List<String> instructions = request.getInstructions();
        for (int idx = 0; idx < instructions.size(); idx++) {
            String inputText = instructions.get(idx);

            // Monta a parte do conteúdo
            Map<String, Object> partMap = new HashMap<>();
            partMap.put("text", inputText);

            List<Map<String, Object>> partsList = new ArrayList<>();
            partsList.add(partMap);

            Map<String, Object> contentMap = new HashMap<>();
            contentMap.put("parts", partsList);

            // Monta o body da requisição
            Map<String, Object> body = new HashMap<>();
            body.put("model", "models/gemini-embedding-001");
            body.put("content", contentMap);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> response = restTemplate.postForObject(url, entity, Map.class);
                if (response != null && response.containsKey("embedding")) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> embeddingData = (Map<String, Object>) response.get("embedding");
                    @SuppressWarnings("unchecked")
                    List<Double> values = (List<Double>) embeddingData.get("values");

                    // O modelo gemini-embedding-001 retorna 3072 dimensões.
                    // Não há necessidade de padding, mas garantimos a dimensão correta.
                    List<Double> paddedValues = new ArrayList<>(values);
                    while (paddedValues.size() < 3072) {
                        paddedValues.add(0.0);
                    }
                    embeddings.add(new Embedding(paddedValues, idx));
                }
            } catch (Exception e) {
                System.err.println("Erro ao chamar Google GenAI Embeddings: " + e.getMessage());
                // Preenche com zeros caso falhe, mantendo as 3072 dimensões
                List<Double> zeros = new ArrayList<>();
                for (int j = 0; j < 3072; j++) {
                    zeros.add(0.0);
                }
                embeddings.add(new Embedding(zeros, idx));
            }
        }

        return new EmbeddingResponse(embeddings);
    }

    @Override
    public List<Double> embed(org.springframework.ai.document.Document document) {
        return embed(document.getContent());
    }

    @Override
    public List<Double> embed(String text) {
        return embed(List.of(text)).get(0);
    }

    @Override
    public List<List<Double>> embed(List<String> texts) {
        EmbeddingResponse response = embedForResponse(texts);
        return response.getResults().stream().map(Embedding::getOutput).toList();
    }

    @Override
    public EmbeddingResponse embedForResponse(List<String> texts) {
        return call(new EmbeddingRequest(texts, org.springframework.ai.embedding.EmbeddingOptions.EMPTY));
    }
}
