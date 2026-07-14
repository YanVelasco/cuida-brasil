package br.gov.cuidar.controller;

import br.gov.cuidar.service.AIChatbotService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
public class AIChatbotController {

    private final AIChatbotService aiChatbotService;

    public AIChatbotController(AIChatbotService aiChatbotService) {
        this.aiChatbotService = aiChatbotService;
    }

    @PostMapping("/ask")
    public ResponseEntity<Map<String, String>> askLuna(@RequestBody Map<String, String> request) {
        String message = request.get("message");
        String perfil = request.get("perfil");
        String usuarioId = request.get("usuarioId");

        if (message == null || message.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("reply", "Mensagem vazia."));
        }

        String reply = aiChatbotService.processQuery(message, perfil, usuarioId);

        return ResponseEntity.ok(Map.of("reply", reply));
    }
}
