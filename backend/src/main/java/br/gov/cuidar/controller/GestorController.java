package br.gov.cuidar.controller;

import br.gov.cuidar.dto.ApiResponse;
import br.gov.cuidar.dto.LocalizacaoDTO;
import br.gov.cuidar.entity.Gestor;
import br.gov.cuidar.entity.Usuario;
import br.gov.cuidar.repository.GestorRepository;
import br.gov.cuidar.service.AuditoriaService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;

@RestController
@org.springframework.transaction.annotation.Transactional(rollbackFor = Exception.class)
@RequestMapping("/api/gestores")
public class GestorController {
    
    private final GestorRepository gestorRepo;
    private final AuditoriaService auditoriaService;

    public GestorController(GestorRepository gestorRepo, AuditoriaService auditoriaService) {
        this.gestorRepo = gestorRepo;
        this.auditoriaService = auditoriaService;
    }

    /** Listagem de todos os gestores ativos da plataforma (visão do ADMIN). */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','ANALYTICS_ADMIN')")
    public ResponseEntity<ApiResponse<java.util.List<java.util.Map<String, Object>>>> listarGestores(@AuthenticationPrincipal Usuario usuario) {
        java.util.List<Gestor> fonte = "ADMIN".equals(usuario.getPerfil()) && usuario.getOrgao() != null
            ? gestorRepo.findAllGestoresAtivosByOrgaoId(usuario.getOrgao().getId()) : gestorRepo.findAllGestoresAtivos();
        java.util.List<java.util.Map<String, Object>> gestores = fonte.stream()
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

        auditoriaService.registrar("ATUALIZACAO_LOCALIZACAO_GESTOR",
            "Gestor " + usuario.getNome() + " atualizou localizacao para lat=" + dto.getLatitude() + ", lon=" + dto.getLongitude(),
            usuario.getCpf(), usuario, true, null);

        return ResponseEntity.ok(ApiResponse.ok("Localização atualizada com sucesso"));
    }
}

