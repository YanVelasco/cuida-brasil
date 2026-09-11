package br.gov.cuidar.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.gov.cuidar.dto.ApiResponse;
import br.gov.cuidar.entity.Auditoria;
import br.gov.cuidar.entity.Usuario;
import br.gov.cuidar.repository.AuditoriaRepository;
import br.gov.cuidar.repository.GestorRepository;
import br.gov.cuidar.repository.OrgaoPublicoRepository;

@RestController
@org.springframework.transaction.annotation.Transactional(rollbackFor = Exception.class)
@RequestMapping("/api/auditoria")
@PreAuthorize("hasAnyRole('ADMIN', 'ANALYTICS_ADMIN', 'GLOBAL_ADMIN')")
public class AuditoriaController {

    private final AuditoriaRepository auditoriaRepository;
    private final GestorRepository gestorRepository;
    private final OrgaoPublicoRepository orgaoRepository;

    public AuditoriaController(AuditoriaRepository auditoriaRepository, GestorRepository gestorRepository,
                               OrgaoPublicoRepository orgaoRepository) {
        this.auditoriaRepository = auditoriaRepository;
        this.gestorRepository = gestorRepository;
        this.orgaoRepository = orgaoRepository;
    }

    /** Trilha de auditoria corporativa paginada. Filtro opcional por ação (ex.: LOGIN). */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<Map<String, Object>>>> listar(
            @RequestParam(required = false) String acao,
            @RequestParam(required = false) Boolean sucesso,
            @RequestParam(required = false) String cpf,
            @RequestParam(name = "usuario", required = false) String nomeUsuario,
            @RequestParam(required = false) String detalhes,
            @RequestParam(required = false) String ip,
            @RequestParam(required = false) LocalDate dataInicio,
            @RequestParam(required = false) LocalDate dataFim,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal Usuario usuario) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("data").descending());
        LocalDateTime inicio = dataInicio == null ? null : dataInicio.atStartOfDay();
        LocalDateTime fim = dataFim == null ? null : dataFim.plusDays(1).atStartOfDay();
        Page<Auditoria> result;
        if (isGlobalAuditProfile(usuario)) {
            if (noAdvancedFilters(sucesso, cpf, nomeUsuario, detalhes, ip, inicio, fim)) {
                result = acao == null || acao.isBlank()
                    ? auditoriaRepository.findAll(pageable)
                    : auditoriaRepository.findByAcaoStartingWith(acao.trim(), pageable);
            } else {
                result = auditoriaRepository.findFiltered(normalize(acao), sucesso, normalize(cpf), normalize(nomeUsuario), normalize(detalhes), normalize(ip), inicio, fim, pageable);
            }
        } else {
            Long orgaoId = resolveOrgaoId(usuario);
            if (noAdvancedFilters(sucesso, cpf, nomeUsuario, detalhes, ip, inicio, fim)) {
                result = acao == null || acao.isBlank()
                    ? auditoriaRepository.findAllByOrgaoIdNative(orgaoId, pageable)
                    : auditoriaRepository.findByAcaoStartingWithAndOrgaoIdNative(acao.trim(), orgaoId, pageable);
            } else {
                result = auditoriaRepository.findFilteredByOrgaoId(normalize(acao), sucesso, normalize(cpf), normalize(nomeUsuario), normalize(detalhes), normalize(ip), inicio, fim, orgaoId, pageable);
            }
        }
        return ResponseEntity.ok(ApiResponse.ok(result.map(this::toMap)));
    }

    /** Resumo de logins para o dashboard executivo. */
    @GetMapping("/resumo-logins")
    public ResponseEntity<ApiResponse<Map<String, Long>>> resumoLogins(@AuthenticationPrincipal Usuario usuario) {
        Map<String, Long> resumo = new LinkedHashMap<>();
        if (isGlobalAuditProfile(usuario)) {
            resumo.put("sucesso", auditoriaRepository.countByAcaoAndSucesso("LOGIN", true));
            resumo.put("falha", auditoriaRepository.countByAcaoAndSucesso("LOGIN", false));
        } else {
            Long orgaoId = resolveOrgaoId(usuario);
            resumo.put("sucesso", auditoriaRepository.countByAcaoAndSucessoAndOrgaoId("LOGIN", true, orgaoId));
            resumo.put("falha", auditoriaRepository.countByAcaoAndSucessoAndOrgaoId("LOGIN", false, orgaoId));
        }
        return ResponseEntity.ok(ApiResponse.ok(resumo));
    }

    private boolean isGlobalAuditProfile(Usuario usuario) {
        return "GLOBAL_ADMIN".equals(usuario.getPerfil()) || "ANALYTICS_ADMIN".equals(usuario.getPerfil());
    }

    private Long resolveOrgaoId(Usuario usuario) {
        if (usuario.getOrgao() != null) return usuario.getOrgao().getId();
        return orgaoRepository.findBySigla("PMSP")
            .map(orgao -> orgao.getId())
            .orElseThrow(() -> new IllegalStateException("Órgão PMSP não foi encontrado"));
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private boolean noAdvancedFilters(Boolean sucesso, String cpf, String nomeUsuario, String detalhes,
                                      String ip, LocalDateTime inicio, LocalDateTime fim) {
        return sucesso == null && normalize(cpf) == null && normalize(nomeUsuario) == null
                && normalize(detalhes) == null && normalize(ip) == null && inicio == null && fim == null;
    }

    private Map<String, Object> toMap(Auditoria a) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", a.getId());
        map.put("data", a.getData());
        map.put("acao", a.getAcao());
        map.put("detalhes", a.getDetalhes());
        map.put("cpf", a.getCpf());
        map.put("ip", a.getIp());
        map.put("userAgent", a.getUserAgent());
        map.put("sucesso", a.getSucesso());
        map.put("usuario", a.getUsuario() != null ? a.getUsuario().getNome() : null);
        String orgaoNome = null;
        Long orgaoId = null;
        if (a.getUsuario() != null) {
            try {
                if (a.getUsuario().getOrgao() != null) {
                    orgaoNome = a.getUsuario().getOrgao().getNome();
                    orgaoId = a.getUsuario().getOrgao().getId();
                } else {
                    var orgao = gestorRepository.findByUsuarioId(a.getUsuario().getId())
                        .map(g -> g.getEquipe().getOrgao()).orElse(null);
                    if (orgao != null) {
                        orgaoNome = orgao.getNome();
                        orgaoId = orgao.getId();
                    }
                }
            } catch (org.hibernate.LazyInitializationException ignored) {
            }
        }
        map.put("orgao", orgaoNome);
        map.put("orgaoId", orgaoId);
        return map;
    }
}

