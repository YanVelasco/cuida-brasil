package br.gov.cuidar.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.gov.cuidar.dto.ApiResponse;
import br.gov.cuidar.entity.Usuario;
import br.gov.cuidar.repository.GestorRepository;
import br.gov.cuidar.repository.SolicitacaoRepository;

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

        @GetMapping("/resumo")
        public ResponseEntity<ApiResponse<Map<String, Long>>> resumo(
            @AuthenticationPrincipal Usuario usuario,
            @RequestParam String inicio, @RequestParam String fim,
            @RequestParam(required = false) String gestor) {
        LocalDateTime inicioData = LocalDate.parse(inicio).atStartOfDay();
        LocalDateTime fimData = LocalDate.parse(fim).plusDays(1).atStartOfDay();
        String filtroGestor = "GESTOR".equals(usuario.getPerfil()) ? usuario.getNome() : gestor;
        Map<String, Long> result = new LinkedHashMap<>();
        result.put("total", solRepo.countByPeriod(inicioData, fimData, filtroGestor));
        result.put("concluidas", solRepo.countByStatusAndPeriod("CONCLUIDA", inicioData, fimData, filtroGestor));
        result.put("emAndamento", solRepo.countByStatusAndPeriod("EM_ANDAMENTO", inicioData, fimData, filtroGestor)
            + solRepo.countByStatusAndPeriod("EM_CAMPO", inicioData, fimData, filtroGestor));
        result.put("abertas", solRepo.countByStatusAndPeriod("PENDENTE", inicioData, fimData, filtroGestor)
            + solRepo.countByStatusAndPeriod("TRIAGEM", inicioData, fimData, filtroGestor));
        result.put("urgentes", solRepo.countUrgentesByPeriod(inicioData, fimData, filtroGestor));
        return ResponseEntity.ok(ApiResponse.ok(result));
        }

    /**
     * Retorna a contagem de solicitações agrupada por categoria de serviço.
     * GESTOR vê apenas sua equipe; ADMIN vê tudo.
     */
    @GetMapping("/por-categoria")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> porCategoria(
            @AuthenticationPrincipal Usuario usuario,
            @RequestParam String inicio, @RequestParam String fim,
            @RequestParam(required = false) String gestor) {

        List<Object[]> raw;
        if (inicio != null && fim != null) {
            LocalDateTime inicioData = LocalDate.parse(inicio).atStartOfDay();
            LocalDateTime fimData = LocalDate.parse(fim).plusDays(1).atStartOfDay();
            String filtroGestor = "GESTOR".equals(usuario.getPerfil()) ? usuario.getNome() : gestor;
            raw = solRepo.countByCategoriaPeriod(inicioData, fimData, filtroGestor);
        } else if ("GESTOR".equals(usuario.getPerfil())) {
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
            @AuthenticationPrincipal Usuario usuario,
            @RequestParam String inicio, @RequestParam String fim,
            @RequestParam(required = false) String gestor) {

        List<Object[]> raw;
        if (inicio != null && fim != null) {
            LocalDateTime inicioData = LocalDate.parse(inicio).atStartOfDay();
            LocalDateTime fimData = LocalDate.parse(fim).plusDays(1).atStartOfDay();
            String filtroGestor = "GESTOR".equals(usuario.getPerfil()) ? usuario.getNome() : gestor;
            raw = solRepo.countByStatusGroupedPeriod(inicioData, fimData, filtroGestor);
        } else if ("GESTOR".equals(usuario.getPerfil())) {
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
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> tendenciaMensal(
            @RequestParam(required = false) String inicio, @RequestParam(required = false) String fim,
            @RequestParam(required = false) String gestor) {
        LocalDateTime fimData = fim != null ? LocalDate.parse(fim).plusDays(1).atStartOfDay() : LocalDateTime.now().plusDays(1);
        LocalDateTime inicioData = inicio != null ? LocalDate.parse(inicio).atStartOfDay() : fimData.minusMonths(6);
        List<Object[]> raw = solRepo.tendenciaMensalPeriod(inicioData, fimData, gestor);
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
