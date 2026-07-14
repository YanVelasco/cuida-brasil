package br.gov.cuidar.controller;
import br.gov.cuidar.dto.ApiResponse;
import br.gov.cuidar.entity.EquipePublica;
import br.gov.cuidar.repository.EquipePublicaRepository;
import br.gov.cuidar.repository.OrgaoPublicoRepository;
import br.gov.cuidar.repository.UsuarioRepository;
import br.gov.cuidar.repository.GestorRepository;
import br.gov.cuidar.entity.OrgaoPublico;
import br.gov.cuidar.entity.Usuario;
import br.gov.cuidar.entity.Gestor;
import br.gov.cuidar.dto.NovaEquipeDTO;
import br.gov.cuidar.dto.NovoGestorDTO;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/equipes")
public class EquipeController {
    private final EquipePublicaRepository eqRepo;
    private final OrgaoPublicoRepository orgaoRepo;
    private final UsuarioRepository userRepo;
    private final GestorRepository gestorRepo;
    private final PasswordEncoder passwordEncoder;

    public EquipeController(EquipePublicaRepository eqRepo, OrgaoPublicoRepository orgaoRepo,
                            UsuarioRepository userRepo, GestorRepository gestorRepo,
                            PasswordEncoder passwordEncoder) { 
        this.eqRepo = eqRepo; 
        this.orgaoRepo = orgaoRepo;
        this.userRepo = userRepo;
        this.gestorRepo = gestorRepo;
        this.passwordEncoder = passwordEncoder;
    }
    @GetMapping @PreAuthorize("hasAnyRole('ADMIN','GESTOR')")
    public ResponseEntity<ApiResponse<List<EquipePublica>>> listar() { return ResponseEntity.ok(ApiResponse.ok(eqRepo.findByAtivoTrue())); }

    @PostMapping @PreAuthorize("hasAnyRole('ADMIN','GESTOR')")
    public ResponseEntity<ApiResponse<EquipePublica>> criarEquipe(@RequestBody NovaEquipeDTO dto) {
        Long orgaoId = java.util.Objects.requireNonNull(dto.getIdOrgao(), "ID do órgão não pode ser nulo");
        OrgaoPublico orgao = orgaoRepo.findById(orgaoId).orElseThrow(() -> new RuntimeException("Órgão não encontrado"));
        EquipePublica equipe = new EquipePublica();
        equipe.setNome(dto.getNome());
        equipe.setOrgao(orgao);
        equipe.setAtivo(true);
        return ResponseEntity.ok(ApiResponse.ok(eqRepo.save(equipe)));
    }

    @PostMapping("/{id}/membros") @PreAuthorize("hasAnyRole('ADMIN','GESTOR')")
    public ResponseEntity<ApiResponse<Gestor>> adicionarMembro(@PathVariable Long id, @RequestBody NovoGestorDTO dto) {
        Long equipeId = java.util.Objects.requireNonNull(id, "ID da equipe não pode ser nulo");
        EquipePublica equipe = eqRepo.findById(equipeId).orElseThrow(() -> new RuntimeException("Equipe não encontrada"));
        
        Usuario user = new Usuario();
        user.setNome(dto.getNome());
        user.setCpf(dto.getCpf());
        user.setEmail(dto.getEmail());
        user.setSenha(passwordEncoder.encode(dto.getSenha()));
        user.setPerfil("GESTOR"); // Cadastrando o usuário como gestor
        user.setAtivo(true);
        user = userRepo.save(user);

        Gestor gestor = new Gestor();
        gestor.setUsuario(user);
        gestor.setEquipe(equipe);
        gestor = gestorRepo.save(gestor);

        return ResponseEntity.ok(ApiResponse.ok(gestor));
    }
}
