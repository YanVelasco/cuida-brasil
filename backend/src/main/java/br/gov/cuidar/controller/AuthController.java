package br.gov.cuidar.controller;

import br.gov.cuidar.dto.ApiResponse;
import br.gov.cuidar.dto.AuthDTO.*;
import br.gov.cuidar.entity.Usuario;
import br.gov.cuidar.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    public AuthController(AuthService authService) { this.authService = authService; }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Login realizado com sucesso", authService.login(req)));
    }
    @PostMapping("/cadastro")
    public ResponseEntity<ApiResponse<AuthResponse>> cadastro(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Cadastro realizado com sucesso", authService.register(req)));
    }
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<?>> me(@AuthenticationPrincipal Usuario usuario) {
        if (usuario == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Nao autenticado"));
        return ResponseEntity.ok(ApiResponse.ok(new AuthResponse(null, null, usuario.getId(), usuario.getNome(), usuario.getCpf(), usuario.getEmail(), usuario.getPerfil())));
    }
}
