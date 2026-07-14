package br.gov.cuidar.controller;
import br.gov.cuidar.dto.ApiResponse;
import br.gov.cuidar.dto.DashboardDTO;
import br.gov.cuidar.dto.DashboardAdminDTO;
import br.gov.cuidar.repository.EquipePublicaRepository;
import br.gov.cuidar.repository.UsuarioRepository;
import br.gov.cuidar.repository.SolicitacaoRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class DashboardController {
    private final SolicitacaoRepository solRepo;
    private final UsuarioRepository usuarioRepo;
    private final EquipePublicaRepository equipeRepo;

    public DashboardController(SolicitacaoRepository solRepo, UsuarioRepository usuarioRepo, EquipePublicaRepository equipeRepo) { 
        this.solRepo = solRepo; 
        this.usuarioRepo = usuarioRepo;
        this.equipeRepo = equipeRepo;
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('GESTOR')")
    public ResponseEntity<ApiResponse<DashboardDTO>> dashboard() {
        long abertas = solRepo.countByStatus("PENDENTE") + solRepo.countByStatus("TRIAGEM");
        long andamento = solRepo.countByStatus("EM_ANDAMENTO") + solRepo.countByStatus("EM_CAMPO");
        long concluidas = solRepo.countByStatus("CONCLUIDA");
        long pendentes = solRepo.countByStatus("PENDENTE");
        long urgentes = solRepo.countUrgentes();
        return ResponseEntity.ok(ApiResponse.ok(new DashboardDTO(abertas, andamento, concluidas, pendentes, urgentes)));
    }

    @GetMapping("/system-dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DashboardAdminDTO>> systemDashboard() {
        long totalGestores = usuarioRepo.countByPerfil("GESTOR");
        long totalUsuarios = usuarioRepo.countByPerfil("CITIZEN");
        long totalEquipes = equipeRepo.count();
        return ResponseEntity.ok(ApiResponse.ok(new DashboardAdminDTO(totalGestores, totalUsuarios, totalEquipes)));
    }
}
