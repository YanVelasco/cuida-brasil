package br.gov.cuidar.service;

import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class AIChatbotService {

    private final VectorStore vectorStore;
    private final ChatModel chatModel;

    public AIChatbotService(VectorStore vectorStore, ChatModel chatModel) {
        this.vectorStore = vectorStore;
        this.chatModel = chatModel;
    }

    public String processQuery(String userMessage, String perfil, String usuarioId, String equipeId) {
        try {
            String filterExpression;
            if ("CITIZEN".equals(perfil)) {
                filterExpression = "usuarioId == '" + usuarioId + "'";
            } else if ("GESTOR".equals(perfil)) {
                if (equipeId != null && !equipeId.equals("UNASSIGNED")) {
                    filterExpression = "equipeId == '" + equipeId + "'";
                } else {
                    filterExpression = "domain == 'solicitacoes'";
                }
            } else {
                filterExpression = "domain == 'solicitacoes'";
            }

            SearchRequest searchRequest = SearchRequest.query(userMessage)
                    .withTopK(20)
                    .withSimilarityThreshold(0.1)
                    .withFilterExpression(filterExpression);

            List<Document> similarDocuments = vectorStore.similaritySearch(searchRequest);

            String context = similarDocuments.stream()
                    .map(Document::getContent)
                    .reduce((a, b) -> a + "\n" + b)
                    .orElse("Nenhum dado encontrado no banco de dados.");

            String perfilLabel = switch (perfil) {
                case "CITIZEN" -> "Cidadão";
                case "GESTOR" -> "Gestor Público";
                case "ADMIN" -> "Administrador do Sistema";
                default -> perfil;
            };

            String systemPromptTemplate = """
                    Você é a Luna, a assistente virtual inteligente oficial da plataforma Cuida+ Brasil, um sistema de zeladoria urbana municipal.
                    O usuário atual tem o perfil de: {perfil}.
                    A mensagem do usuário é: {userMessage}
                    
                    Seu objetivo é responder a dúvida do usuário utilizando ESTRITAMENTE as informações presentes no contexto abaixo (recuperado do banco de dados).
                    
                    INSTRUÇÕES IMPORTANTES:
                    - Formate sua resposta em **Markdown**. Use negrito, emojis e listas para tornar a leitura agradável.
                    - Responda de forma concisa, educada e elegante.
                    - NÃO invente dados de protocolos, endereços ou status que não estejam no contexto.
                    - Se a resposta não estiver no contexto, diga cordialmente que não encontrou a informação.
                    - Se o usuário pedir botões de ação ou links, instrua-o a navegar pelo menu do sistema, pois você agora é focada em responder com texto inteligente.
                    - Você NUNCA deve revelar dados de outros usuários que não sejam os do perfil atual.
                    
                    DADOS RECUPERADOS (Contexto):
                    {context}
                    """;

            PromptTemplate promptTemplate = new PromptTemplate(systemPromptTemplate);
            Prompt prompt = promptTemplate.create(Map.of(
                    "perfil", perfilLabel,
                    "userMessage", userMessage,
                    "context", context
            ));

            return Objects.requireNonNull(chatModel.call(prompt).getResult()).getOutput().getContent();

        } catch (Exception e) {
            String errorMsg = e.getMessage() != null ? e.getMessage() : "";
            System.err.println("Erro no Gemini/VectorStore: " + errorMsg);
            if (errorMsg.contains("503") || errorMsg.contains("UNAVAILABLE") || errorMsg.contains("high demand")) {
                return "⚠️ Os servidores de IA estão com **alta demanda** no momento. Por favor, **aguarde alguns segundos** e tente novamente — isso é temporário!";
            }
            return "Desculpe, estou enfrentando uma instabilidade técnica no momento. Tente novamente em instantes.";
        }
    }
}
