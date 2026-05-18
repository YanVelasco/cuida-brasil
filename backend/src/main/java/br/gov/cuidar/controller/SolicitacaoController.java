package br.gov.cuidar.controller;

import br.gov.cuidar.dto.*;
import br.gov.cuidar.dto.SolicitacaoDTO.*;
import br.gov.cuidar.entity.Usuario;
import br.gov.cuidar.service.SolicitacaoService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<ApiResponse<Page<Response>>> listar(@RequestParam(required = false) String status, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.ok(sService.listarTodas(status, page, size)));
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
