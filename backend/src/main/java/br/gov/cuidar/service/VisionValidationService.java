package br.gov.cuidar.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.ai.chat.messages.Media;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;
import org.springframework.util.MimeTypeUtils;

import java.util.Base64;
import java.util.List;

@Service
public class VisionValidationService {

    private final ChatModel chatModel;
    private final ObjectMapper objectMapper;

    public VisionValidationService(ChatModel chatModel, ObjectMapper objectMapper) {
        this.chatModel = chatModel;
        this.objectMapper = objectMapper;
    }

    public void validarImagem(String base64Image, String categoriaServico) {
        if (base64Image == null || base64Image.trim().isEmpty()) {
            return; // Se não houver foto, passa direto
        }

        try {
            String pureBase64 = base64Image;
            if (base64Image.contains(",")) {
                pureBase64 = base64Image.split(",")[1];
            }

            byte[] imageBytes = Base64.getDecoder().decode(pureBase64);

            String instruction = """
                    Você é um especialista em análise de imagem para zeladoria urbana e infraestrutura municipal.
                    O cidadão enviou a foto em anexo relatando o seguinte problema: "%s".
                    
                    Por favor, analise a imagem e verifique se:
                    1. A imagem tem qualidade suficiente para ser analisada (não é totalmente preta, totalmente branca ou absurdamente borrada).
                    2. A imagem mostra evidências plausíveis do problema relatado (ex: se é "Buraco", deve haver algo parecido com rua, asfalto, calçada, ou um buraco). Se a foto for claramente de dentro de uma casa (como um sofá ou teto), de um cachorro, de uma selfie, ou completamente desconexa, ela é inválida.
                    
                    Retorne ESTRITAMENTE um JSON no seguinte formato (e nada mais além do JSON):
                    {
                      "valido": true ou false,
                      "motivo": "Se for falso, explique de forma clara e amigável em português por que a foto não pode ser aceita para esse tipo de problema. Se for verdadeiro, pode deixar vazio."
                    }
                    """.formatted(categoriaServico);

            UserMessage userMessage = new UserMessage(
                    instruction,
                    List.of(new Media(MimeTypeUtils.IMAGE_JPEG, new ByteArrayResource(imageBytes)))
            );

            ChatResponse response = chatModel.call(new Prompt(userMessage));
            String jsonResult = response.getResult().getOutput().getContent().trim();
            
            // Remove blocos de markdown caso o Gemini retorne ```json ... ```
            if (jsonResult.startsWith("```json")) {
                jsonResult = jsonResult.replace("```json", "").replace("```", "").trim();
            } else if (jsonResult.startsWith("```")) {
                jsonResult = jsonResult.replace("```", "").trim();
            }

            JsonNode rootNode = objectMapper.readTree(jsonResult);
            boolean isValido = rootNode.get("valido").asBoolean();

            if (!isValido) {
                String motivo = rootNode.has("motivo") ? rootNode.get("motivo").asText() : "A imagem enviada não condiz com o problema relatado.";
                throw new IllegalArgumentException(motivo);
            }

        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            System.err.println("Erro ao validar imagem com a IA: " + e.getMessage());
        }
    }
}
