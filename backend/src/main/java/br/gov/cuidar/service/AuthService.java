package br.gov.cuidar.service;

import br.gov.cuidar.dto.AuthDTO.*;
import br.gov.cuidar.entity.Usuario;
import br.gov.cuidar.repository.UsuarioRepository;
import br.gov.cuidar.security.JwtTokenProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtProvider;

    public AuthService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder, JwtTokenProvider jwtProvider) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtProvider = jwtProvider;
    }

    public AuthResponse login(LoginRequest req) {
        Usuario user = usuarioRepository.findByCpf(req.getCpf())
            .orElseThrow(() -> new RuntimeException("CPF ou senha invalidos"));

        if (!passwordEncoder.matches(req.getSenha(), user.getSenha())) {
            throw new RuntimeException("CPF ou senha invalidos");
        }
        if (!user.getAtivo()) {
            throw new RuntimeException("Conta desativada. Entre em contato com o suporte.");
        }

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
