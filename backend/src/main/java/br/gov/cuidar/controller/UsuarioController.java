package br.gov.cuidar.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.gov.cuidar.dto.ApiResponse;
import br.gov.cuidar.entity.Usuario;
import br.gov.cuidar.repository.GestorRepository;
import br.gov.cuidar.repository.SolicitacaoRepository;
import br.gov.cuidar.repository.UsuarioRepository;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

@RestController
@org.springframework.transaction.annotation.Transactional(rollbackFor = Exception.class)
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioRepository usuarioRepo;
    private final SolicitacaoRepository solicitacaoRepo;
    private final GestorRepository gestorRepo;

    public UsuarioController(UsuarioRepository usuarioRepo, SolicitacaoRepository solicitacaoRepo, GestorRepository gestorRepo) {
        this.usuarioRepo = usuarioRepo;
        this.solicitacaoRepo = solicitacaoRepo;
        this.gestorRepo = gestorRepo;
    }

    /**
     * Listagem dos usuários comuns (cidadãos).
     * ADMIN vê todos os cidadãos da plataforma; GESTOR vê apenas os usuários
     * atrelados a ele (com solicitações atribuídas à sua equipe).
     */
    @GetMapping("/cidadaos")
    @PreAuthorize("hasAnyRole('ADMIN','GESTOR','ANALYTICS_ADMIN')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> listarCidadaos(@AuthenticationPrincipal Usuario usuario) {
        List<Usuario> usuarios;
        Map<Long, Long> solicitacoesPorUsuario;

        if ("GESTOR".equals(usuario.getPerfil())) {
            Long equipeId = gestorRepo.findEquipeIdByUsuarioId(usuario.getId()).orElse(null);
            if (equipeId == null) return ResponseEntity.ok(ApiResponse.ok(List.of()));
            usuarios = solicitacaoRepo.findUsuariosByEquipeId(equipeId);
            solicitacoesPorUsuario = solicitacaoRepo.countPorUsuarioAndEquipe(equipeId).stream()
                    .collect(Collectors.toMap(r -> ((Number) r[0]).longValue(), r -> ((Number) r[1]).longValue()));
        } else {
            usuarios = usuarioRepo.findByPerfilOrderByNome("CITIZEN");
            solicitacoesPorUsuario = solicitacaoRepo.countPorUsuario().stream()
                    .collect(Collectors.toMap(r -> ((Number) r[0]).longValue(), r -> ((Number) r[1]).longValue()));
        }

        List<Map<String, Object>> cidadaos = usuarios.stream()
                .map(u -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", u.getId());
                    m.put("nome", u.getNome());
                    m.put("email", u.getEmail());
                    m.put("cpf", u.getCpf());
                    m.put("ativo", Boolean.TRUE.equals(u.getAtivo()));
                    m.put("totalSolicitacoes", solicitacoesPorUsuario.getOrDefault(u.getId(), 0L));
                    return m;
                }).collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.ok(cidadaos));
    }
}

