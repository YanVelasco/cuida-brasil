package br.gov.cuidar.controller;

import br.gov.cuidar.dto.ApiResponse;
import br.gov.cuidar.entity.Gestor;
import br.gov.cuidar.entity.Usuario;
import br.gov.cuidar.repository.GestorRepository;
import br.gov.cuidar.repository.SolicitacaoRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/relatorios")
@PreAuthorize("hasAnyRole('ADMIN', 'GESTOR')")
public class RelatorioController {

    private final SolicitacaoRepository solRepo;
    private final GestorRepository gestorRepo;

    public RelatorioController(SolicitacaoRepository solRepo, GestorRepository gestorRepo) {
        this.solRepo = solRepo;
        this.gestorRepo = gestorRepo;
    }

    /**
     * Retorna a contagem de solicitações agrupada por categoria de serviço.
     * GESTOR vê apenas sua equipe; ADMIN vê tudo.
     */
    @GetMapping("/por-categoria")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> porCategoria(
            @AuthenticationPrincipal Usuario usuario) {

        List<Object[]> raw;
        if ("GESTOR".equals(usuario.getPerfil())) {
            Long equipeId = getEquipeId(usuario);
            raw = equipeId != null ? solRepo.countByCategoriaAndEquipeId(equipeId) : List.of();
        } else {
            raw = solRepo.countByCategoria();
        }

        long total = raw.stream().mapToLong(r -> ((Number) r[1]).longValue()).sum();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : raw) {
            String categoria = (String) row[0];
            long count = ((Number) row[1]).longValue();
            int pct = total > 0 ? (int) Math.round(count * 100.0 / total) : 0;
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("nome", categoria);
            item.put("qtd", count);
            item.put("pct", pct);
            result.add(item);
        }
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Retorna a contagem de solicitações agrupada por status.
     */
    @GetMapping("/por-status")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> porStatus(
            @AuthenticationPrincipal Usuario usuario) {

        List<Object[]> raw;
        if ("GESTOR".equals(usuario.getPerfil())) {
            Long equipeId = getEquipeId(usuario);
            raw = equipeId != null ? solRepo.countByStatusGroupedAndEquipeId(equipeId) : List.of();
        } else {
            raw = solRepo.countByStatusGrouped();
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : raw) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("status", row[0]);
            item.put("total", ((Number) row[1]).longValue());
            result.add(item);
        }
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Retorna a tendência mensal dos últimos 6 meses (global — apenas ADMIN).
     */
    @GetMapping("/tendencia-mensal")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> tendenciaMensal() {
        List<Object[]> raw = solRepo.tendenciaMensal();
        String[] meses = {"Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"};
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : raw) {
            int mesNum = ((Number) row[0]).intValue();
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("mes", meses[mesNum - 1]);
            item.put("ano", ((Number) row[1]).intValue());
            item.put("total", ((Number) row[2]).longValue());
            result.add(item);
        }
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    private Long getEquipeId(Usuario usuario) {
        return gestorRepo.findByUsuarioId(usuario.getId())
                .map(g -> g.getEquipe().getId())
                .orElse(null);
    }
}
