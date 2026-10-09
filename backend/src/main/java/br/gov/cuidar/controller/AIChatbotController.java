package br.gov.cuidar.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.gov.cuidar.entity.Usuario;
import br.gov.cuidar.repository.GestorRepository;
import br.gov.cuidar.service.AIChatbotService;

@RestController
@org.springframework.transaction.annotation.Transactional(rollbackFor = Exception.class)
@RequestMapping("/api/chat")
public class AIChatbotController {

    private final AIChatbotService aiChatbotService;
    private final GestorRepository gestorRepository;

    public AIChatbotController(AIChatbotService aiChatbotService, GestorRepository gestorRepository) {
        this.aiChatbotService = aiChatbotService;
        this.gestorRepository = gestorRepository;
    }

    @PostMapping("/ask")
    public ResponseEntity<Map<String, String>> askLuna(
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal Usuario usuario) {

        String message = request.get("message");

        if (message == null || message.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("reply", "Mensagem vazia."));
        }

        if (usuario == null) {
            return ResponseEntity.status(401).body(Map.of("reply", "Não autenticado."));
        }

        String perfil = usuario.getPerfil();
        String usuarioId = String.valueOf(usuario.getId());
        String orgaoId = usuario.getOrgao() != null ? String.valueOf(usuario.getOrgao().getId()) : null;

        String equipeId = null;
        if ("GESTOR".equals(perfil)) {
            equipeId = gestorRepository.findEquipeIdByUsuarioId(usuario.getId())
                    .map(String::valueOf)
                    .orElse(null);
        }

        String reply = aiChatbotService.processQuery(message, perfil, usuarioId, equipeId, orgaoId);
        return ResponseEntity.ok(Map.of("reply", reply));
    }
}


