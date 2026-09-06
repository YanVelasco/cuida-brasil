package br.gov.cuidar.controller;
import br.gov.cuidar.dto.ApiResponse;
import br.gov.cuidar.dto.DashboardDTO;
import br.gov.cuidar.dto.DashboardAdminDTO;
import br.gov.cuidar.entity.Usuario;
import br.gov.cuidar.repository.EquipePublicaRepository;
import br.gov.cuidar.repository.GestorRepository;
import br.gov.cuidar.repository.UsuarioRepository;
import br.gov.cuidar.repository.SolicitacaoRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class DashboardController {
    private final SolicitacaoRepository solRepo;
    private final UsuarioRepository usuarioRepo;
    private final EquipePublicaRepository equipeRepo;
    private final GestorRepository gestorRepo;

    public DashboardController(SolicitacaoRepository solRepo, UsuarioRepository usuarioRepo,
                                EquipePublicaRepository equipeRepo, GestorRepository gestorRepo) {
        this.solRepo = solRepo;
        this.usuarioRepo = usuarioRepo;
        this.equipeRepo = equipeRepo;
        this.gestorRepo = gestorRepo;
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('GESTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<DashboardDTO>> dashboard(@AuthenticationPrincipal Usuario usuario) {
        long abertas, andamento, concluidas, pendentes, urgentes;

        if ("GESTOR".equals(usuario.getPerfil())) {
            Long equipeId = gestorRepo.findEquipeIdByUsuarioId(usuario.getId()).orElse(null);
            if (equipeId != null) {
                abertas    = solRepo.countByStatusAndEquipeId("PENDENTE", equipeId)
                           + solRepo.countByStatusAndEquipeId("TRIAGEM", equipeId)
                           + solRepo.countByStatusAndEquipeNull("PENDENTE")
                           + solRepo.countByStatusAndEquipeNull("TRIAGEM");
                andamento  = solRepo.countByStatusAndEquipeId("EM_ANDAMENTO", equipeId)
                           + solRepo.countByStatusAndEquipeId("EM_CAMPO", equipeId);
                concluidas = solRepo.countByStatusAndEquipeId("CONCLUIDA", equipeId);
                pendentes  = solRepo.countByStatusAndEquipeId("PENDENTE", equipeId)
                           + solRepo.countByStatusAndEquipeNull("PENDENTE");
                urgentes   = solRepo.countUrgentesByEquipeId(equipeId) + solRepo.countUrgentesByEquipeNull();
            } else {
                abertas = andamento = concluidas = pendentes = urgentes = 0;
            }
        } else {
            abertas    = solRepo.countByStatus("PENDENTE") + solRepo.countByStatus("TRIAGEM");
            andamento  = solRepo.countByStatus("EM_ANDAMENTO") + solRepo.countByStatus("EM_CAMPO");
            concluidas = solRepo.countByStatus("CONCLUIDA");
            pendentes  = solRepo.countByStatus("PENDENTE");
            urgentes   = solRepo.countUrgentes();
        }

        return ResponseEntity.ok(ApiResponse.ok(new DashboardDTO(abertas, andamento, concluidas, pendentes, urgentes)));
    }

    @GetMapping("/system-dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DashboardAdminDTO>> systemDashboard() {
        long totalGestores = usuarioRepo.countByPerfil("GESTOR");
        long totalUsuarios = usuarioRepo.countByPerfil("CITIZEN");
        long totalEquipes  = equipeRepo.count();
        return ResponseEntity.ok(ApiResponse.ok(new DashboardAdminDTO(totalGestores, totalUsuarios, totalEquipes)));
    }
}
