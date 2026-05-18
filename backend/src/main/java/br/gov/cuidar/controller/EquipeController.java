package br.gov.cuidar.controller;
import br.gov.cuidar.dto.ApiResponse;
import br.gov.cuidar.entity.EquipePublica;
import br.gov.cuidar.repository.EquipePublicaRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/equipes")
public class EquipeController {
    private final EquipePublicaRepository eqRepo;
    public EquipeController(EquipePublicaRepository eqRepo) { this.eqRepo = eqRepo; }
    @GetMapping @PreAuthorize("hasAnyRole('ADMIN','GESTOR')")
    public ResponseEntity<ApiResponse<List<EquipePublica>>> listar() { return ResponseEntity.ok(ApiResponse.ok(eqRepo.findByAtivoTrue())); }
}
