package br.gov.cuidar.controller;
import br.gov.cuidar.dto.ApiResponse;
import br.gov.cuidar.entity.OrgaoPublico;
import br.gov.cuidar.repository.OrgaoPublicoRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/orgaos")
public class OrgaoController {
    private final OrgaoPublicoRepository oRepo;
    public OrgaoController(OrgaoPublicoRepository oRepo) { this.oRepo = oRepo; }
    @GetMapping @PreAuthorize("hasAnyRole('ADMIN','GESTOR')")
    public ResponseEntity<ApiResponse<List<OrgaoPublico>>> listar() { return ResponseEntity.ok(ApiResponse.ok(oRepo.findAll())); }
}
