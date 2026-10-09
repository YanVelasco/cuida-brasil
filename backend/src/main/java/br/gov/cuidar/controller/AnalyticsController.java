package br.gov.cuidar.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.gov.cuidar.dto.ApiResponse;
import br.gov.cuidar.service.AnalyticsService;

@RestController
@RequestMapping("/api/admin/analytics")
@PreAuthorize("hasAnyRole('ADMIN', 'GESTOR', 'ANALYTICS_ADMIN')")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    /**
     * Retorna o dashboard analítico consolidado gerado a partir de consultas SQLs avançadas
     * (CTEs, Window Functions DENSE_RANK, DATEDIFF, agregações de SLA, CSAT e criticidade territorial).
     */
    @GetMapping("/avancado")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardAvancado() {
        return ResponseEntity.ok(ApiResponse.ok(analyticsService.getDashboardAvancadoCompleto()));
    }

    @GetMapping("/equipes-ranking")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRankingEquipes() {
        return ResponseEntity.ok(ApiResponse.ok(analyticsService.getPerformanceEquipes()));
    }

    @GetMapping("/sla")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAnaliseSla() {
        return ResponseEntity.ok(ApiResponse.ok(analyticsService.getAnaliseSla()));
    }

    @GetMapping("/satisfacao")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSatisfacaoCidadao() {
        return ResponseEntity.ok(ApiResponse.ok(analyticsService.getSatisfacaoCidadao()));
    }

    @GetMapping("/turnos")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getDistribuicaoTurnos() {
        return ResponseEntity.ok(ApiResponse.ok(analyticsService.getDistribuicaoTurnos()));
    }

    @GetMapping("/gargalos")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getGargalosUrbanos() {
        return ResponseEntity.ok(ApiResponse.ok(analyticsService.getGargalosUrbanos()));
    }
}
