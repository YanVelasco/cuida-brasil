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
import br.gov.cuidar.service.AuditoriaService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@org.springframework.transaction.annotation.Transactional(rollbackFor = Exception.class)
@RequestMapping("/api/equipes")
public class EquipeController {
    private final EquipePublicaRepository eqRepo;
    private final OrgaoPublicoRepository orgaoRepo;
    private final UsuarioRepository userRepo;
    private final GestorRepository gestorRepo;
    private final br.gov.cuidar.repository.SolicitacaoRepository solRepo;
    private final PasswordEncoder passwordEncoder;
    private final AuditoriaService auditoriaService;

    public EquipeController(EquipePublicaRepository eqRepo, OrgaoPublicoRepository orgaoRepo,
                            UsuarioRepository userRepo, GestorRepository gestorRepo,
                            br.gov.cuidar.repository.SolicitacaoRepository solRepo,
                            PasswordEncoder passwordEncoder, AuditoriaService auditoriaService) { 
        this.eqRepo = eqRepo; 
        this.orgaoRepo = orgaoRepo;
        this.userRepo = userRepo;
        this.gestorRepo = gestorRepo;
        this.solRepo = solRepo;
        this.passwordEncoder = passwordEncoder;
        this.auditoriaService = auditoriaService;
    }
    @GetMapping @PreAuthorize("hasAnyRole('ADMIN','GESTOR','ANALYTICS_ADMIN')")
    public ResponseEntity<ApiResponse<List<java.util.Map<String, Object>>>> listar(@AuthenticationPrincipal Usuario usuario) {
        List<EquipePublica> equipes;
        if (isGestor(usuario)) {
            equipes = gestorRepo.findEquipeIdByUsuarioId(usuario.getId())
                    .flatMap(eqRepo::findById)
                    .filter(equipe -> Boolean.TRUE.equals(equipe.getAtivo()))
                    .map(List::of)
                    .orElseGet(List::of);
        } else {
            equipes = eqRepo.findByAtivoTrue();
        }

        List<java.util.Map<String, Object>> response = equipes.stream().map(equipe -> {
            java.util.Map<String, Object> item = new java.util.LinkedHashMap<>();
            item.put("id", equipe.getId());
            item.put("nome", equipe.getNome());
            item.put("ativo", equipe.getAtivo());
            item.put("statusOperacional", equipe.getStatusOperacional());
            item.put("orgao", equipe.getOrgao() != null ? java.util.Map.of(
                "id", equipe.getOrgao().getId(),
                "nome", equipe.getOrgao().getNome(),
                "sigla", equipe.getOrgao().getSigla(),
                "areaAtendimento", equipe.getOrgao().getAreaAtendimento()
            ) : null);
            return item;
        }).toList();

        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/dashboard") @PreAuthorize("hasAnyRole('ADMIN','GESTOR','ANALYTICS_ADMIN')")
    public ResponseEntity<ApiResponse<Page<br.gov.cuidar.dto.EquipeDashboardDTO>>> listarDashboard(
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal Usuario usuario) {
        Pageable pageable = PageRequest.of(page, size);
        Page<EquipePublica> equipes;
        if (isGestor(usuario)) {
            equipes = gestorRepo.findEquipeIdByUsuarioId(usuario.getId())
                    .flatMap(eqRepo::findById)
                    .filter(equipe -> Boolean.TRUE.equals(equipe.getAtivo()))
                    .<Page<EquipePublica>>map(equipe -> new PageImpl<>(List.of(equipe), pageable, 1))
                    .orElseGet(() -> Page.empty(pageable));
        } else {
            equipes = eqRepo.findByAtivoTrue(pageable);
        }
        org.springframework.data.domain.Page<br.gov.cuidar.dto.EquipeDashboardDTO> dtos = equipes.map(eq -> {
            br.gov.cuidar.dto.EquipeDashboardDTO dto = new br.gov.cuidar.dto.EquipeDashboardDTO();
            dto.setId(eq.getId());
            dto.setNome(eq.getNome());
            
            // Busca gestores da equipe
            List<Gestor> gestores = gestorRepo.findByEquipeId(eq.getId());
            if (!gestores.isEmpty()) {
                dto.setSupervisor(gestores.get(0).getUsuario().getNome());
                dto.setTecnicos(gestores.size()); // Considerando gestores como "membros" para efeito de mockup
            } else {
                dto.setSupervisor("Sem supervisor");
                dto.setTecnicos(0);
            }
            
            // Regiao e Tipo de Servico baseados no nome ou orgao
            dto.setTipoServico(eq.getOrgao().getAreaAtendimento() != null ? eq.getOrgao().getAreaAtendimento() : "Geral");
            
            String nome = eq.getNome().toLowerCase();
            if (nome.contains("norte")) dto.setRegiao("Norte");
            else if (nome.contains("sul")) dto.setRegiao("Sul");
            else if (nome.contains("leste")) dto.setRegiao("Leste");
            else if (nome.contains("oeste")) dto.setRegiao("Oeste");
            else dto.setRegiao("Centro"); // Default
            
            // Casos abertos
            long casos = solRepo.countByStatusAndEquipeId("PENDENTE", eq.getId()) + solRepo.countByStatusAndEquipeId("EM_ANDAMENTO", eq.getId()) + solRepo.countByStatusAndEquipeId("TRIAGEM", eq.getId()) + solRepo.countByStatusAndEquipeId("EM_CAMPO", eq.getId());
            dto.setCasosAbertos(casos);
            
            // SLA e Status simulado/baseado nos casos
            dto.setSlaMedio((90 - (casos * 2)) + "%");
            if (eq.getStatusOperacional() != null && !eq.getStatusOperacional().isBlank()) {
                String status = eq.getStatusOperacional();
                dto.setStatus("DISPONIVEL".equals(status) ? "Disponível" : "SOBRECARREGADA".equals(status) ? "Sobrecarr." : "Em campo");
                dto.setStatusColor("DISPONIVEL".equals(status) ? "#F2C94C" : "SOBRECARREGADA".equals(status) ? "#EB5757" : "#27AE60");
            } else if (casos == 0) {
                dto.setStatus("Disponível");
                dto.setStatusColor("#F2C94C");
            } else if (casos > 15) {
                dto.setStatus("Sobrecarr.");
                dto.setStatusColor("#EB5757");
            } else {
                dto.setStatus("Em campo");
                dto.setStatusColor("#27AE60");
            }
            
            return dto;
        });
        
        return ResponseEntity.ok(ApiResponse.ok(dtos));
    }
    
    @GetMapping("/{id}/membros") @PreAuthorize("hasAnyRole('ADMIN','GESTOR','ANALYTICS_ADMIN')")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<br.gov.cuidar.dto.MembroDTO>>> listarMembros(
            @PathVariable Long id, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal Usuario usuario) {
        validarEquipeDoGestor(id, usuario);
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        org.springframework.data.domain.Page<Gestor> membros = gestorRepo.findByEquipeId(id, pageable);
        org.springframework.data.domain.Page<br.gov.cuidar.dto.MembroDTO> dtos = membros.map(m -> new br.gov.cuidar.dto.MembroDTO(
            m.getId(), m.getUsuario().getNome(), m.getUsuario().getEmail(), m.getUsuario().getPerfil()
        ));
        return ResponseEntity.ok(ApiResponse.ok(dtos));
    }

    @PostMapping @PreAuthorize("hasRole('GESTOR')")
    public ResponseEntity<ApiResponse<EquipePublica>> criarEquipe(@RequestBody NovaEquipeDTO dto, @AuthenticationPrincipal Usuario usuario) {
        Long orgaoId = java.util.Objects.requireNonNull(dto.getIdOrgao(), "ID do órgão não pode ser nulo");
        OrgaoPublico orgao = orgaoRepo.findById(orgaoId).orElseThrow(() -> new RuntimeException("Órgão não encontrado"));
        EquipePublica equipe = new EquipePublica();
        equipe.setNome(dto.getNome());
        equipe.setOrgao(orgao);
        equipe.setAtivo(true);
        equipe = eqRepo.save(equipe);
        auditoriaService.registrar("CRIACAO_EQUIPE",
            "Equipe " + equipe.getNome() + " criada pelo gestor " + usuario.getNome() + " para o orgao " + orgao.getNome(),
            usuario.getCpf(), usuario, true, null);
        return ResponseEntity.ok(ApiResponse.ok(equipe));
    }

    /**
     * ADMIN adiciona/gerencia apenas GESTORES; GESTOR adiciona apenas membros
     * operacionais (TRABALHADOR) da própria equipe.
     */
    @PostMapping("/{id}/membros") @PreAuthorize("hasAnyRole('ADMIN','GESTOR')")
    public ResponseEntity<ApiResponse<br.gov.cuidar.dto.MembroDTO>> adicionarMembro(@PathVariable Long id, @RequestBody NovoGestorDTO dto,
                                                                @AuthenticationPrincipal Usuario usuario) {
        validarEquipeDoGestor(id, usuario);
        String perfil = dto.getPerfil() != null ? dto.getPerfil().toUpperCase() : "TRABALHADOR";
        if ("ADMIN".equals(usuario.getPerfil()) && !"GESTOR".equals(perfil)) {
            throw new IllegalStateException("Administradores podem adicionar apenas gestores");
        }
        if (isGestor(usuario) && "GESTOR".equals(perfil)) {
            throw new IllegalStateException("Gestores podem adicionar apenas membros operacionais");
        }
        Long equipeId = java.util.Objects.requireNonNull(id, "ID da equipe não pode ser nulo");
        EquipePublica equipe = eqRepo.findById(equipeId).orElseThrow(() -> new RuntimeException("Equipe não encontrada"));
        
        Usuario user = new Usuario();
        user.setNome(dto.getNome());
        user.setCpf(dto.getCpf());
        user.setEmail(dto.getEmail());
        user.setSenha(passwordEncoder.encode(dto.getSenha()));
        user.setPerfil(perfil);
        user.setAtivo(true);
        user = userRepo.save(user);

        Gestor gestor = new Gestor();
        gestor.setUsuario(user);
        gestor.setEquipe(equipe);
        gestor = gestorRepo.save(gestor);

        auditoriaService.registrar("ADICAO_MEMBRO_EQUIPE",
            "Usuario " + user.getNome() + " (" + perfil + ") adicionado na equipe " + equipe.getNome() + " por " + usuario.getNome(),
            usuario.getCpf(), usuario, true, null);

        br.gov.cuidar.dto.MembroDTO membroDTO = new br.gov.cuidar.dto.MembroDTO(gestor.getId(), user.getNome(), user.getEmail(), user.getPerfil());
        return ResponseEntity.ok(ApiResponse.ok(membroDTO));
    }

    /** ADMIN remove um gestor da equipe (desativa o usuário vinculado). */
    @DeleteMapping("/membros/{membroId}") @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> removerGestor(@PathVariable Long membroId, @AuthenticationPrincipal Usuario usuario) {
        Gestor membro = gestorRepo.findById(membroId)
                .orElseThrow(() -> new RuntimeException("Membro não encontrado"));
        if (!"GESTOR".equals(membro.getUsuario().getPerfil())) {
            throw new IllegalStateException("Administradores podem remover apenas gestores");
        }
        Usuario user = membro.getUsuario();
        gestorRepo.delete(membro);
        user.setAtivo(false);
        userRepo.save(user);
        auditoriaService.registrar("REMOCAO_MEMBRO_EQUIPE",
            "Gestor " + user.getNome() + " removido da equipe " + membro.getEquipe().getNome() + " por " + usuario.getNome(),
            usuario.getCpf(), usuario, true, null);
        return ResponseEntity.ok(ApiResponse.ok("Gestor removido com sucesso", null));
    }

    private boolean isGestor(Usuario usuario) {
        return usuario != null && "GESTOR".equals(usuario.getPerfil());
    }

    private void validarEquipeDoGestor(Long equipeId, Usuario usuario) {
        if (isGestor(usuario) && !gestorRepo.findEquipeIdByUsuarioId(usuario.getId()).map(equipeId::equals).orElse(false)) {
            throw new IllegalStateException("Gestor só pode operar na própria equipe");
        }
    }
}

