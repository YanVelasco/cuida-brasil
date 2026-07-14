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
