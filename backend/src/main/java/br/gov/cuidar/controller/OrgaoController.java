package br.gov.cuidar.controller;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.gov.cuidar.dto.ApiResponse;
import br.gov.cuidar.dto.NovoAdministradorOrgaoDTO;
import br.gov.cuidar.dto.NovoOrgaoDTO;
import br.gov.cuidar.entity.OrgaoPublico;
import br.gov.cuidar.entity.Usuario;
import br.gov.cuidar.repository.OrgaoPublicoRepository;
import br.gov.cuidar.repository.UsuarioRepository;

@RestController
@org.springframework.transaction.annotation.Transactional(rollbackFor = Exception.class)
@RequestMapping("/api/orgaos")
public class OrgaoController {
    private final OrgaoPublicoRepository oRepo;
    private final UsuarioRepository usuarioRepo;
    private final PasswordEncoder passwordEncoder;
    public OrgaoController(OrgaoPublicoRepository oRepo, UsuarioRepository usuarioRepo, PasswordEncoder passwordEncoder) {
        this.oRepo = oRepo;
        this.usuarioRepo = usuarioRepo;
        this.passwordEncoder = passwordEncoder;
    }
    @GetMapping @PreAuthorize("hasAnyRole('ADMIN','GESTOR','ANALYTICS_ADMIN','GLOBAL_ADMIN')")
    public ResponseEntity<ApiResponse<List<java.util.Map<String, Object>>>> listar(@AuthenticationPrincipal Usuario usuario) {
        java.util.function.Function<OrgaoPublico, java.util.Map<String, Object>> toMap = orgao -> {
            java.util.Map<String, Object> item = new java.util.LinkedHashMap<>();
            item.put("id", orgao.getId()); item.put("nome", orgao.getNome());
            item.put("sigla", orgao.getSigla()); item.put("tipo", orgao.getTipo());
            item.put("areaAtendimento", orgao.getAreaAtendimento()); item.put("ativo", orgao.getAtivo());
            item.put("membros", usuarioRepo.countByPerfilAndOrgaoId("ADMIN", orgao.getId()));
            return item;
        };
        if ("GLOBAL_ADMIN".equals(usuario.getPerfil()) || "ANALYTICS_ADMIN".equals(usuario.getPerfil())) {
            return ResponseEntity.ok(ApiResponse.ok(oRepo.findByAtivoTrue().stream().map(toMap).toList()));
        }
        OrgaoPublico orgao = usuario.getOrgao() != null
            ? usuario.getOrgao()
            : oRepo.findBySigla("PMSP").orElse(null);
        return ResponseEntity.ok(ApiResponse.ok(orgao == null ? List.of() : List.of(toMap.apply(orgao))));
    }

    @PostMapping @PreAuthorize("hasRole('GLOBAL_ADMIN')")
    public ResponseEntity<ApiResponse<OrgaoPublico>> criar(@RequestBody NovoOrgaoDTO dto) {
        OrgaoPublico orgao = new OrgaoPublico();
        preencher(orgao, dto);
        orgao.setAtivo(true);
        orgao = oRepo.save(orgao);
        return ResponseEntity.ok(ApiResponse.ok(orgao));
    }

    @PostMapping("/{id}/administrador") @PreAuthorize("hasRole('GLOBAL_ADMIN')")
    public ResponseEntity<ApiResponse<Usuario>> criarAdministrador(@PathVariable Long id,
                                                                    @RequestBody NovoAdministradorOrgaoDTO dto) {
        OrgaoPublico orgao = oRepo.findById(id).orElseThrow(() -> new IllegalArgumentException("Órgão não encontrado"));
        validarAdministrador(dto);
        if (usuarioRepo.existsByCpf(dto.getCpf()) || usuarioRepo.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("CPF ou e-mail do administrador já cadastrado");
        }
        Usuario admin = new Usuario();
        admin.setNome(dto.getNome().trim());
        admin.setCpf(dto.getCpf().trim());
        admin.setEmail(dto.getEmail().trim());
        admin.setSenha(passwordEncoder.encode(dto.getSenha()));
        admin.setPerfil("ADMIN");
        admin.setAtivo(true);
        admin.setOrgao(orgao);
        usuarioRepo.save(admin);
        return ResponseEntity.ok(ApiResponse.ok(admin));
    }

    @GetMapping("/{id}/administradores") @PreAuthorize("hasRole('GLOBAL_ADMIN')")
    public ResponseEntity<ApiResponse<List<java.util.Map<String, Object>>>> listarAdministradores(@PathVariable Long id) {
        oRepo.findById(id).orElseThrow(() -> new IllegalArgumentException("Órgão não encontrado"));
        List<java.util.Map<String, Object>> administradores = usuarioRepo
            .findByPerfilAndOrgaoIdOrderByNome("ADMIN", id).stream().map(admin -> {
                java.util.Map<String, Object> item = new java.util.LinkedHashMap<>();
                item.put("id", admin.getId());
                item.put("nome", admin.getNome());
                item.put("cpf", admin.getCpf());
                item.put("email", admin.getEmail());
                item.put("ativo", admin.getAtivo());
                return item;
            }).toList();
        return ResponseEntity.ok(ApiResponse.ok(administradores));
    }

    @PutMapping("/{orgaoId}/administradores/{adminId}") @PreAuthorize("hasRole('GLOBAL_ADMIN')")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> atualizarAdministrador(
            @PathVariable Long orgaoId, @PathVariable Long adminId, @RequestBody NovoAdministradorOrgaoDTO dto) {
        Usuario admin = usuarioRepo.findById(adminId)
            .filter(usuario -> "ADMIN".equals(usuario.getPerfil()) && usuario.getOrgao() != null
                && orgaoId.equals(usuario.getOrgao().getId()))
            .orElseThrow(() -> new IllegalArgumentException("Administrador não encontrado neste órgão"));
        if (dto.getNome() == null || dto.getNome().isBlank() || dto.getCpf() == null || dto.getCpf().isBlank()
                || dto.getEmail() == null || dto.getEmail().isBlank()) {
            throw new IllegalArgumentException("Nome, CPF e e-mail são obrigatórios");
        }
        admin.setNome(dto.getNome().trim());
        admin.setCpf(dto.getCpf().trim());
        admin.setEmail(dto.getEmail().trim());
        if (dto.getSenha() != null && !dto.getSenha().isBlank()) {
            if (dto.getSenha().length() < 6) throw new IllegalArgumentException("A senha deve ter no mínimo 6 caracteres");
            admin.setSenha(passwordEncoder.encode(dto.getSenha()));
        }
        usuarioRepo.save(admin);
        java.util.Map<String, Object> response = new java.util.LinkedHashMap<>();
        response.put("id", admin.getId()); response.put("nome", admin.getNome());
        response.put("cpf", admin.getCpf()); response.put("email", admin.getEmail());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{orgaoId}/administradores/{adminId}") @PreAuthorize("hasRole('GLOBAL_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> excluirAdministrador(@PathVariable Long orgaoId, @PathVariable Long adminId) {
        Usuario admin = usuarioRepo.findById(adminId)
            .filter(usuario -> "ADMIN".equals(usuario.getPerfil()) && usuario.getOrgao() != null
                && orgaoId.equals(usuario.getOrgao().getId()))
            .orElseThrow(() -> new IllegalArgumentException("Administrador não encontrado neste órgão"));
        admin.setAtivo(false);
        usuarioRepo.save(admin);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PutMapping("/{id}") @PreAuthorize("hasRole('GLOBAL_ADMIN')")
    public ResponseEntity<ApiResponse<OrgaoPublico>> atualizar(@PathVariable Long id, @RequestBody NovoOrgaoDTO dto) {
        OrgaoPublico orgao = oRepo.findById(id).orElseThrow(() -> new IllegalArgumentException("Órgão não encontrado"));
        preencher(orgao, dto);
        return ResponseEntity.ok(ApiResponse.ok(oRepo.save(orgao)));
    }

    @DeleteMapping("/{id}") @PreAuthorize("hasRole('GLOBAL_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> excluir(@PathVariable Long id) {
        OrgaoPublico orgao = oRepo.findById(id).orElseThrow(() -> new IllegalArgumentException("Órgão não encontrado"));
        orgao.setAtivo(false);
        oRepo.save(orgao);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    private void preencher(OrgaoPublico orgao, NovoOrgaoDTO dto) {
        if (dto.getNome() == null || dto.getNome().isBlank()
                || dto.getSigla() == null || dto.getSigla().isBlank()
                || dto.getTipo() == null || dto.getTipo().isBlank()
                || dto.getAreaAtendimento() == null || dto.getAreaAtendimento().isBlank()) {
            throw new IllegalArgumentException("Todos os campos do órgão são obrigatórios");
        }
        orgao.setNome(dto.getNome().trim());
        orgao.setSigla(dto.getSigla().trim().toUpperCase());
        orgao.setTipo(dto.getTipo().trim());
        orgao.setAreaAtendimento(dto.getAreaAtendimento().trim());
    }

    private void validarAdministrador(NovoAdministradorOrgaoDTO dto) {
        if (dto.getNome() == null || dto.getNome().isBlank()
                || dto.getCpf() == null || dto.getCpf().isBlank()
                || dto.getEmail() == null || dto.getEmail().isBlank()
                || dto.getSenha() == null || dto.getSenha().length() < 6) {
            throw new IllegalArgumentException("Informe nome, CPF, e-mail e senha do administrador (mínimo 6 caracteres)");
        }
    }
}

