package br.gov.cuidar.controller;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.gov.cuidar.dto.ApiResponse;
import br.gov.cuidar.entity.Auditoria;
import br.gov.cuidar.repository.AuditoriaRepository;

@RestController
@org.springframework.transaction.annotation.Transactional(rollbackFor = Exception.class)
@RequestMapping("/api/auditoria")
@PreAuthorize("hasAnyRole('ADMIN', 'ANALYTICS_ADMIN')")
public class AuditoriaController {

    private final AuditoriaRepository auditoriaRepository;

    public AuditoriaController(AuditoriaRepository auditoriaRepository) {
        this.auditoriaRepository = auditoriaRepository;
    }

    /** Trilha de auditoria corporativa paginada com suporte a ordenação dinâmica. */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<Map<String, Object>>>> listar(
            @RequestParam(required = false) String acao,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir) {
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        String prop = "data";
        if (sortBy != null) {
            switch (sortBy.trim().toLowerCase()) {
                case "acao": prop = "acao"; break;
                case "cpf": prop = "cpf"; break;
                case "ip": prop = "ip"; break;
                case "sucesso": prop = "sucesso"; break;
                case "usuario": prop = "usuario.nome"; break;
                default: prop = "data"; break;
            }
        }
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, prop));
        Page<Auditoria> result = (acao != null && !acao.isBlank())
            ? auditoriaRepository.findByAcaoStartingWith(acao, pageable)
            : auditoriaRepository.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.ok(result.map(this::toMap)));
    }

    /** Resumo de logins para o dashboard executivo. */
    @GetMapping("/resumo-logins")
    public ResponseEntity<ApiResponse<Map<String, Long>>> resumoLogins() {
        Map<String, Long> resumo = new LinkedHashMap<>();
        resumo.put("sucesso", auditoriaRepository.countByAcaoAndSucesso("LOGIN", true));
        resumo.put("falha", auditoriaRepository.countByAcaoAndSucesso("LOGIN", false));
        return ResponseEntity.ok(ApiResponse.ok(resumo));
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
        return map;
    }
}
