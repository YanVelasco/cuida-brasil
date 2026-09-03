package br.gov.cuidar.controller;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.gov.cuidar.dto.ApiResponse;
import br.gov.cuidar.dto.SolicitacaoDTO.*;
import br.gov.cuidar.dto.SolicitacaoDTO.CreateRequest;
import br.gov.cuidar.dto.SolicitacaoDTO.Response;
import br.gov.cuidar.dto.SolicitacaoDTO.UpdateStatusRequest;
import br.gov.cuidar.entity.Usuario;
import br.gov.cuidar.service.SolicitacaoService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/solicitacoes")
public class SolicitacaoController {
    private final SolicitacaoService sService;
    public SolicitacaoController(SolicitacaoService sService) { this.sService = sService; }

    @PostMapping
    public ResponseEntity<ApiResponse<Response>> criar(@Valid @RequestBody CreateRequest req, @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Solicitacao criada", sService.criar(req, usuario.getId())));
    }
    @GetMapping @PreAuthorize("hasAnyRole('ADMIN','GESTOR')")
    public ResponseEntity<ApiResponse<Page<Response>>> listar(@AuthenticationPrincipal Usuario usuario,
                                                            @RequestParam(required = false) String status,
                                                            @RequestParam(defaultValue = "0") int page,
                                                            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.ok(sService.listarTodas(status, page, size, usuario)));
    }
    
    @GetMapping("/nao-atribuidas") @PreAuthorize("hasAnyRole('ADMIN','GESTOR')")
    public ResponseEntity<ApiResponse<java.util.List<Response>>> listarNaoAtribuidas() {
        return ResponseEntity.ok(ApiResponse.ok(sService.listarNaoAtribuidas()));
    }
    @GetMapping("/minhas")
    public ResponseEntity<ApiResponse<Page<Response>>> minhas(@AuthenticationPrincipal Usuario usuario, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.ok(sService.listarPorUsuario(usuario.getId(), page, size)));
    }
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Response>> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(sService.buscarPorId(id)));
    }
    @GetMapping("/protocolo/{protocolo}")
    public ResponseEntity<ApiResponse<Response>> buscarPorProtocolo(@PathVariable String protocolo) {
        return ResponseEntity.ok(ApiResponse.ok(sService.buscarPorProtocolo(protocolo)));
    }
    @PutMapping("/{id}/status") @PreAuthorize("hasAnyRole('ADMIN','GESTOR')")
    public ResponseEntity<ApiResponse<Response>> atualizarStatus(@PathVariable Long id, @Valid @RequestBody UpdateStatusRequest req, @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(ApiResponse.ok(sService.atualizarStatus(id, req, usuario.getId())));
    }
}
