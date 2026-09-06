package br.gov.cuidar.controller;

import br.gov.cuidar.dto.ApiResponse;
import br.gov.cuidar.dto.LocalizacaoDTO;
import br.gov.cuidar.entity.Gestor;
import br.gov.cuidar.entity.Usuario;
import br.gov.cuidar.repository.GestorRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/gestores")
public class GestorController {
    
    private final GestorRepository gestorRepo;

    public GestorController(GestorRepository gestorRepo) {
        this.gestorRepo = gestorRepo;
    }

    /** Listagem de todos os gestores ativos da plataforma (visão do ADMIN). */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<java.util.List<java.util.Map<String, Object>>>> listarGestores() {
        java.util.List<java.util.Map<String, Object>> gestores = gestorRepo.findAllGestoresAtivos().stream()
                .map(g -> {
                    java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
                    m.put("id", g.getId());
                    m.put("nome", g.getUsuario().getNome());
                    m.put("email", g.getUsuario().getEmail());
                    m.put("cpf", g.getUsuario().getCpf());
                    m.put("equipeId", g.getEquipe().getId());
                    m.put("equipeNome", g.getEquipe().getNome());
                    return m;
                }).toList();
        return ResponseEntity.ok(ApiResponse.ok(gestores));
    }

    @PutMapping("/localizacao")
    @PreAuthorize("hasRole('GESTOR')")
    public ResponseEntity<ApiResponse<String>> atualizarLocalizacao(@RequestBody LocalizacaoDTO dto, Authentication auth) {
        Usuario usuario = (Usuario) auth.getPrincipal();
        Gestor gestor = gestorRepo.findByUsuarioId(usuario.getId())
                .orElseThrow(() -> new RuntimeException("Gestor não encontrado"));
        
        gestor.setLatitude(dto.getLatitude());
        gestor.setLongitude(dto.getLongitude());
        gestor.setUltimaAtualizacaoLocalizacao(LocalDateTime.now());
        gestorRepo.save(gestor);

        return ResponseEntity.ok(ApiResponse.ok("Localização atualizada com sucesso"));
    }
}
