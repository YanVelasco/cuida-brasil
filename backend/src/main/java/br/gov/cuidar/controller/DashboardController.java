package br.gov.cuidar.controller;
import br.gov.cuidar.dto.ApiResponse;
import br.gov.cuidar.dto.DashboardDTO;
import br.gov.cuidar.repository.SolicitacaoRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAnyRole('ADMIN','GESTOR')")
public class DashboardController {
    private final SolicitacaoRepository solRepo;
    public DashboardController(SolicitacaoRepository solRepo) { this.solRepo = solRepo; }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardDTO>> dashboard() {
        long abertas = solRepo.countByStatus("PENDENTE") + solRepo.countByStatus("TRIAGEM");
        long andamento = solRepo.countByStatus("EM_ANDAMENTO") + solRepo.countByStatus("EM_CAMPO");
        long concluidas = solRepo.countByStatus("CONCLUIDA");
        long pendentes = solRepo.countByStatus("PENDENTE");
        long urgentes = solRepo.countUrgentes();
        return ResponseEntity.ok(ApiResponse.ok(new DashboardDTO(abertas, andamento, concluidas, pendentes, urgentes)));
    }
}
