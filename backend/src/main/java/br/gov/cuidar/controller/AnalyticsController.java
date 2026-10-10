package br.gov.cuidar.controller;

import java.util.List;
import java.util.Map;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import br.gov.cuidar.dto.ApiResponse;
import br.gov.cuidar.entity.Usuario;
import br.gov.cuidar.repository.GestorRepository;
import br.gov.cuidar.repository.OrgaoPublicoRepository;
import br.gov.cuidar.service.AnalyticsService;

@RestController
@RequestMapping("/api/admin/analytics")
@PreAuthorize("hasAnyRole('ADMIN', 'GESTOR', 'ANALYTICS_ADMIN', 'GLOBAL_ADMIN')")
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final GestorRepository gestorRepository;
    private final OrgaoPublicoRepository orgaoRepository;

    public AnalyticsController(AnalyticsService analyticsService,
                               GestorRepository gestorRepository,
                               OrgaoPublicoRepository orgaoRepository) {
        this.analyticsService = analyticsService;
        this.gestorRepository = gestorRepository;
        this.orgaoRepository = orgaoRepository;
    }

    private record Escopo(Long orgaoId, Long equipeId) {}
    private record Periodo(LocalDateTime inicio, LocalDateTime fim) {}

    private Periodo resolverPeriodo(String inicio, String fim) {
        LocalDate inicioData;
        LocalDate fimData;
        try {
            fimData = fim == null || fim.isBlank() ? LocalDate.now() : LocalDate.parse(fim);
            inicioData = inicio == null || inicio.isBlank() ? fimData.minusDays(29) : LocalDate.parse(inicio);
        } catch (DateTimeParseException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "As datas devem usar o formato yyyy-MM-dd.", exception);
        }
        if (inicioData.isAfter(fimData)) {
            LocalDate swap = inicioData;
            inicioData = fimData;
            fimData = swap;
        }
        return new Periodo(inicioData.atStartOfDay(), fimData.plusDays(1).atStartOfDay());
    }

    private Escopo resolverEscopo(Usuario usuario, Long orgaoIdParam, Long equipeIdParam, String gestorParam) {
        if (usuario == null) {
            return new Escopo(orgaoIdParam, equipeIdParam);
        }

        // GESTOR: sempre enxerga EXCLUSIVAMENTE a sua equipe
        if ("GESTOR".equals(usuario.getPerfil())) {
            Long equipeIdGestor = gestorRepository.findEquipeIdByUsuarioId(usuario.getId()).orElse(null);
            return new Escopo(null, equipeIdGestor);
        }

        // Se informou nome do gestor (ex: filtro de dropdown), resolve para a equipe dele
        Long equipeIdResolvida = equipeIdParam;
        if (equipeIdResolvida == null && gestorParam != null && !gestorParam.isBlank()) {
            equipeIdResolvida = gestorRepository.findEquipeIdByGestorNome(gestorParam.trim()).orElse(null);
        }

        // ADMIN (Administrador do Órgão): enxerga TODAS as ocorrências do seu órgão
        if ("ADMIN".equals(usuario.getPerfil())) {
            Long orgaoId = (usuario.getOrgao() != null) ? usuario.getOrgao().getId() : null;
            if (orgaoId == null) {
                orgaoId = orgaoRepository.findBySigla("PMSP").map(o -> o.getId()).orElse(null);
            }
            return new Escopo(orgaoId, equipeIdResolvida);
        }

        // ANALYTICS_ADMIN: muito parecido com Administrador do Órgão (se vinculado a órgão, foca nele; caso contrário visão ampla)
        if ("ANALYTICS_ADMIN".equals(usuario.getPerfil())) {
            Long orgaoId = (usuario.getOrgao() != null) ? usuario.getOrgao().getId() : orgaoIdParam;
            return new Escopo(orgaoId, equipeIdResolvida);
        }

        // GLOBAL_ADMIN: visão global por padrão ou filtrada por orgaoIdParam / gestorParam
        return new Escopo(orgaoIdParam, equipeIdResolvida);
    }

    /**
     * Retorna o dashboard analítico consolidado gerado a partir de consultas SQLs avançadas
     * (CTEs, Window Functions DENSE_RANK, DATEDIFF, agregações de SLA, CSAT e criticidade territorial),
     * respeitando o escopo do usuário (Gestor vê sua equipe; Administrador do Órgão vê seu órgão).
     */
    @GetMapping("/avancado")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardAvancado(
            @RequestParam(required = false) Long orgaoId,
            @RequestParam(required = false) Long equipeId,
            @RequestParam(required = false) String gestor,
            @RequestParam(required = false) String inicio,
            @RequestParam(required = false) String fim,
            @RequestParam(required = false) String bairro,
            @RequestParam(required = false) Integer diaNum,
            @RequestParam(required = false) String turno,
            @AuthenticationPrincipal Usuario usuario) {
        Escopo escopo = resolverEscopo(usuario, orgaoId, equipeId, gestor);
        Periodo periodo = resolverPeriodo(inicio, fim);
        if (diaNum != null && (diaNum < 1 || diaNum > 7)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "diaNum deve estar entre 1 e 7.");
        }
        return ResponseEntity.ok(ApiResponse.ok(
            analyticsService.getDashboardAvancadoCompleto(escopo.orgaoId(), escopo.equipeId(), periodo.inicio(), periodo.fim(),
                bairro == null || bairro.isBlank() ? null : bairro.trim(), diaNum, turno == null || turno.isBlank() ? null : turno.trim())
        ));
    }

    @GetMapping("/equipes-ranking")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRankingEquipes(
            @RequestParam(required = false) Long orgaoId,
            @RequestParam(required = false) Long equipeId,
            @RequestParam(required = false) String gestor,
            @RequestParam(required = false) String inicio,
            @RequestParam(required = false) String fim,
            @AuthenticationPrincipal Usuario usuario) {
        Escopo escopo = resolverEscopo(usuario, orgaoId, equipeId, gestor);
        Periodo periodo = resolverPeriodo(inicio, fim);
        return ResponseEntity.ok(ApiResponse.ok(
            analyticsService.getPerformanceEquipes(escopo.orgaoId(), escopo.equipeId(), periodo.inicio(), periodo.fim())
        ));
    }

    @GetMapping("/sla")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAnaliseSla(
            @RequestParam(required = false) Long orgaoId,
            @RequestParam(required = false) Long equipeId,
            @RequestParam(required = false) String gestor,
            @RequestParam(required = false) String inicio,
            @RequestParam(required = false) String fim,
            @AuthenticationPrincipal Usuario usuario) {
        Escopo escopo = resolverEscopo(usuario, orgaoId, equipeId, gestor);
        Periodo periodo = resolverPeriodo(inicio, fim);
        return ResponseEntity.ok(ApiResponse.ok(
            analyticsService.getAnaliseSla(escopo.orgaoId(), escopo.equipeId(), periodo.inicio(), periodo.fim())
        ));
    }

    @GetMapping("/satisfacao")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSatisfacaoCidadao(
            @RequestParam(required = false) Long orgaoId,
            @RequestParam(required = false) Long equipeId,
            @RequestParam(required = false) String gestor,
            @RequestParam(required = false) String inicio,
            @RequestParam(required = false) String fim,
            @AuthenticationPrincipal Usuario usuario) {
        Escopo escopo = resolverEscopo(usuario, orgaoId, equipeId, gestor);
        Periodo periodo = resolverPeriodo(inicio, fim);
        return ResponseEntity.ok(ApiResponse.ok(
            analyticsService.getSatisfacaoCidadao(escopo.orgaoId(), escopo.equipeId(), periodo.inicio(), periodo.fim())
        ));
    }

    @GetMapping("/turnos")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getDistribuicaoTurnos(
            @RequestParam(required = false) Long orgaoId,
            @RequestParam(required = false) Long equipeId,
            @RequestParam(required = false) String gestor,
            @RequestParam(required = false) String inicio,
            @RequestParam(required = false) String fim,
            @AuthenticationPrincipal Usuario usuario) {
        Escopo escopo = resolverEscopo(usuario, orgaoId, equipeId, gestor);
        Periodo periodo = resolverPeriodo(inicio, fim);
        return ResponseEntity.ok(ApiResponse.ok(
            analyticsService.getDistribuicaoTurnos(escopo.orgaoId(), escopo.equipeId(), periodo.inicio(), periodo.fim(), null)
        ));
    }

    @GetMapping("/gargalos")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getGargalosUrbanos(
            @RequestParam(required = false) Long orgaoId,
            @RequestParam(required = false) Long equipeId,
            @RequestParam(required = false) String gestor,
            @RequestParam(required = false) String inicio,
            @RequestParam(required = false) String fim,
            @AuthenticationPrincipal Usuario usuario) {
        Escopo escopo = resolverEscopo(usuario, orgaoId, equipeId, gestor);
        Periodo periodo = resolverPeriodo(inicio, fim);
        return ResponseEntity.ok(ApiResponse.ok(
            analyticsService.getGargalosUrbanos(escopo.orgaoId(), escopo.equipeId(), periodo.inicio(), periodo.fim(), null, null)
        ));
    }
}
