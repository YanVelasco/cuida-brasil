package br.gov.cuidar.service;

import br.gov.cuidar.dto.AuthDTO.*;
import br.gov.cuidar.entity.Usuario;
import br.gov.cuidar.repository.UsuarioRepository;
import br.gov.cuidar.security.JwtTokenProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.servlet.http.HttpServletRequest;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtProvider;
    private final AuditoriaService auditoriaService;

    public AuthService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder, JwtTokenProvider jwtProvider, AuditoriaService auditoriaService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtProvider = jwtProvider;
        this.auditoriaService = auditoriaService;
    }

    public AuthResponse login(LoginRequest req, HttpServletRequest request) {
        Usuario user = usuarioRepository.findByCpf(req.getCpf()).orElse(null);

        if (user == null || !passwordEncoder.matches(req.getSenha(), user.getSenha())) {
            auditoriaService.registrar("LOGIN", "Tentativa de login com credenciais invalidas", req.getCpf(), user, false, request);
            throw new RuntimeException("CPF ou senha invalidos");
        }
        if (!user.getAtivo()) {
            auditoriaService.registrar("LOGIN", "Tentativa de login em conta desativada", req.getCpf(), user, false, request);
            throw new RuntimeException("Conta desativada. Entre em contato com o suporte.");
        }

        auditoriaService.registrar("LOGIN", "Login realizado com sucesso (" + user.getPerfil() + ")", user.getCpf(), user, true, request);

        String token = jwtProvider.generateToken(user.getId(), user.getCpf(), user.getNome(), user.getPerfil());
        return new AuthResponse(token, "Bearer", user.getId(), user.getNome(), user.getCpf(), user.getEmail(), user.getPerfil());
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (usuarioRepository.existsByCpf(req.getCpf())) {
            throw new RuntimeException("CPF ja cadastrado");
        }
        if (usuarioRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("E-mail ja cadastrado");
        }

        Usuario user = new Usuario();
        user.setNome(req.getNome());
        user.setCpf(req.getCpf());
        user.setEmail(req.getEmail());
        user.setSenha(passwordEncoder.encode(req.getSenha()));
        user.setPerfil("CITIZEN");
        
        user = usuarioRepository.save(user);

        String token = jwtProvider.generateToken(user.getId(), user.getCpf(), user.getNome(), user.getPerfil());
        return new AuthResponse(token, "Bearer", user.getId(), user.getNome(), user.getCpf(), user.getEmail(), user.getPerfil());
    }
}
