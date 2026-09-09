package br.gov.cuidar.service;

import java.text.Normalizer;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.gov.cuidar.dto.SolicitacaoDTO.AvaliacaoRequest;
import br.gov.cuidar.dto.SolicitacaoDTO.CreateRequest;
import br.gov.cuidar.dto.SolicitacaoDTO.HistoricoDTO;
import br.gov.cuidar.dto.SolicitacaoDTO.Response;
import br.gov.cuidar.dto.SolicitacaoDTO.UpdateStatusRequest;
import br.gov.cuidar.entity.EquipePublica;
import br.gov.cuidar.entity.Historico;
import br.gov.cuidar.entity.Servico;
import br.gov.cuidar.entity.Solicitacao;
import br.gov.cuidar.entity.Usuario;
import br.gov.cuidar.repository.EquipePublicaRepository;
import br.gov.cuidar.repository.GestorRepository;
import br.gov.cuidar.repository.HistoricoRepository;
import br.gov.cuidar.repository.ServicoRepository;
import br.gov.cuidar.repository.SolicitacaoRepository;
import br.gov.cuidar.repository.UsuarioRepository;

@Service
public class SolicitacaoService {

    private final SolicitacaoRepository solicitacaoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ServicoRepository servicoRepository;
    private final EquipePublicaRepository equipeRepository;
    private final HistoricoRepository historicoRepository;
    private final VisionValidationService visionValidationService;
    private final GestorRepository gestorRepository;
    private final AuditoriaService auditoriaService;

    public SolicitacaoService(SolicitacaoRepository solicitacaoRepository, UsuarioRepository usuarioRepository, ServicoRepository servicoRepository, EquipePublicaRepository equipeRepository, HistoricoRepository historicoRepository, VisionValidationService visionValidationService, GestorRepository gestorRepository, AuditoriaService auditoriaService) {
        this.solicitacaoRepository = solicitacaoRepository;
        this.usuarioRepository = usuarioRepository;
        this.servicoRepository = servicoRepository;
        this.equipeRepository = equipeRepository;
        this.historicoRepository = historicoRepository;
        this.visionValidationService = visionValidationService;
        this.gestorRepository = gestorRepository;
        this.auditoriaService = auditoriaService;
    }

    @Transactional
    public Response criar(CreateRequest req, Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new RuntimeException("Usuario nao encontrado"));
        Servico servico = servicoRepository.findById(req.getIdServico())
            .orElseThrow(() -> new RuntimeException("Servico nao encontrado"));

        // Validação da imagem via Gemini Vision
        if (req.getFotos() != null && !req.getFotos().isEmpty()) {
            visionValidationService.validarImagem(req.getFotos(), servico.getSubcategoria());
        }

        String protocolo = "PRO-" + LocalDate.now().getYear() + "-" + String.format("%06d", (int)(Math.random() * 999999));

        Solicitacao sol = new Solicitacao();
        sol.setProtocolo(protocolo);
        sol.setDescricao(req.getDescricao());
        sol.setGps(req.getGps());
        sol.setEndereco(req.getEndereco());
        sol.setFotos(req.getFotos());
        sol.setStatus("PENDENTE");
        sol.setUsuario(usuario);
        sol.setServico(servico);
        sol.setPrioridade(visionValidationService.determinarPrioridade(req.getDescricao(), servico.getSubcategoria(), req.getFotos()));
        sol.setEquipe(resolverEquipeParaServico(servico));
        sol = solicitacaoRepository.save(sol);

        Historico hist = new Historico();
        hist.setAcao("Solicitacao registrada pelo cidadao.");
        hist.setSolicitacao(sol);
        hist.setUsuario(usuario);
        historicoRepository.save(hist);

        auditoriaService.registrar("CRIACAO_SOLICITACAO",
            "Solicitacao " + sol.getProtocolo() + " criada por " + usuario.getNome() + " para o servico " + servico.getCategoria() + " / " + servico.getSubcategoria(),
            usuario.getCpf(), usuario, true, null);

        return toResponse(sol);
    }

    /** Salva o endereço legível resolvido no frontend; nunca sobrescreve um endereço já informado. */
    @Transactional
    public Response atualizarEndereco(Long id, String endereco) {
        Solicitacao sol = solicitacaoRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Solicitacao nao encontrada"));
        if ((sol.getEndereco() == null || sol.getEndereco().isBlank())
                && endereco != null && !endereco.isBlank()) {
            sol.setEndereco(endereco.trim());
            sol = solicitacaoRepository.save(sol);
            auditoriaService.registrar("ATUALIZACAO_ENDERECO",
                "Endereco resolvido para solicitacao " + sol.getProtocolo() + ": " + endereco,
                sol.getUsuario().getCpf(), sol.getUsuario(), true, null);
        }
        return toResponse(sol);
    }

    public Page<Response> listarTodas(String status, String gestor, int page, int size, Usuario usuario) {        Pageable pageable = PageRequest.of(page, size, Sort.by("dataCriacao").descending());
        Page<Solicitacao> result;

        if (usuario != null && "GESTOR".equals(usuario.getPerfil())) {
            Long equipeId = gestorRepository.findEquipeIdByUsuarioId(usuario.getId()).orElse(null);
            if (equipeId == null) {
                return Page.empty(pageable);
            }
            result = status != null
                ? solicitacaoRepository.findByStatusAndEquipeIdOrNullAndUnassigned(status, equipeId, pageable)
                : solicitacaoRepository.findByEquipeIdOrNullAndUnassigned(equipeId, pageable);
        } else if (gestor != null && !gestor.isBlank() && usuario != null
                && ("ADMIN".equals(usuario.getPerfil()) || "ANALYTICS_ADMIN".equals(usuario.getPerfil()))) {
            result = status != null
                ? solicitacaoRepository.findByStatusAndGestorNome(status, gestor, pageable)
                : solicitacaoRepository.findByGestorNome(gestor, pageable);
        } else {
            result = status != null
                ? solicitacaoRepository.findByStatus(status, pageable)
                : solicitacaoRepository.findAll(pageable);
        }

        return result.map(this::toResponse);
    }

    public List<Response> listarNaoAtribuidas() {
        return solicitacaoRepository.findNaoAtribuidas().stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    /**
     * Cidadãos que atrelaram um problema a um gestor (solicitações com equipe atribuída).
     * ADMIN vê todos; GESTOR vê apenas os cidadãos da própria equipe.
     */
    public List<java.util.Map<String, Object>> listarCidadaosPorGestor(Usuario usuario) {
        List<Solicitacao> sols;
        if ("GESTOR".equals(usuario.getPerfil())) {
            Long equipeId = gestorRepository.findEquipeIdByUsuarioId(usuario.getId()).orElse(null);
            if (equipeId == null) return List.of();
            sols = solicitacaoRepository.findComEquipeByEquipeId(equipeId);
        } else {
            sols = solicitacaoRepository.findComEquipe();
        }

        java.util.Map<Long, String> gestorPorEquipe = new java.util.HashMap<>();
        return sols.stream().map(s -> {
            Long equipeId = s.getEquipe().getId();
            String gestorNome = gestorPorEquipe.computeIfAbsent(equipeId, id ->
                gestorRepository.findByEquipeId(id).stream()
                    .filter(g -> "GESTOR".equals(g.getUsuario().getPerfil()) && Boolean.TRUE.equals(g.getUsuario().getAtivo()))
                    .map(g -> g.getUsuario().getNome())
                    .findFirst().orElse("—"));

            java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("id", s.getId());
            m.put("protocolo", s.getProtocolo());
            m.put("cidadaoNome", s.getUsuario().getNome());
            m.put("cidadaoEmail", s.getUsuario().getEmail());
            m.put("categoria", s.getServico().getCategoria());
            m.put("subcategoria", s.getServico().getSubcategoria());
            m.put("status", s.getStatus());
            m.put("prioridade", s.getPrioridade());
            m.put("equipeNome", s.getEquipe().getNome());
            m.put("gestorNome", gestorNome);
            m.put("dataCriacao", s.getDataCriacao());
            return m;
        }).collect(Collectors.toList());
    }

    public Page<Response> listarPorUsuario(Long usuarioId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("dataCriacao").descending());
        return solicitacaoRepository.findByUsuarioId(usuarioId, pageable).map(this::toResponse);
    }

    public Response buscarPorId(Long id) {
        return solicitacaoRepository.findById(id).map(this::toResponse).orElseThrow(() -> new RuntimeException("Nao encontrada"));
    }

    public Response buscarPorProtocolo(String protocolo) {
        return solicitacaoRepository.findByProtocolo(protocolo).map(this::toResponse).orElseThrow(() -> new RuntimeException("Nao encontrada"));
    }

    @Transactional
    public Response atualizarStatus(Long id, UpdateStatusRequest req, Long usuarioId) {
        Solicitacao sol = solicitacaoRepository.findById(id).orElseThrow(() -> new RuntimeException("Nao encontrada"));
        Usuario usuario = usuarioRepository.findById(usuarioId).orElseThrow(() -> new RuntimeException("Usuario nao encontrado"));

        if ("GESTOR".equals(usuario.getPerfil())) {
            Long equipeDoGestor = gestorRepository.findEquipeIdByUsuarioId(usuario.getId())
                    .orElseThrow(() -> new IllegalStateException("Gestor sem equipe vinculada"));
            if ((sol.getEquipe() != null && !equipeDoGestor.equals(sol.getEquipe().getId()))
                    || (req.getIdEquipe() != null && !equipeDoGestor.equals(req.getIdEquipe()))) {
                throw new IllegalStateException("Gestor só pode operar na própria equipe");
            }
        }

        sol.setStatus(req.getStatus());
        if (req.getPrioridade() != null) sol.setPrioridade(req.getPrioridade());
        if (req.getIdEquipe() != null) {
            EquipePublica equipe = equipeRepository.findById(req.getIdEquipe()).orElse(null);
            if (equipe != null) {
                sol.setEquipe(equipe);
                if (req.getStatusEquipe() != null && !req.getStatusEquipe().isBlank()) {
                    equipe.setStatusOperacional(req.getStatusEquipe());
                    equipeRepository.save(equipe);
                }
            }
        }
        if ("CONCLUIDA".equals(req.getStatus())) sol.setDataConclusao(LocalDate.now());

        sol = solicitacaoRepository.save(sol);

        Historico h = new Historico();
        h.setAcao(req.getComentario() != null ? req.getComentario() : "Status alterado para: " + req.getStatus());
        h.setSolicitacao(sol);
        h.setUsuario(usuario);
        historicoRepository.save(h);

        auditoriaService.registrar("ALTERACAO_STATUS_SOLICITACAO",
            "Solicitacao " + sol.getProtocolo() + " atualizada para status " + req.getStatus() + (req.getIdEquipe() != null ? " e equipe " + req.getIdEquipe() : "") + (req.getPrioridade() != null ? " / prioridade " + req.getPrioridade() : ""),
            usuario.getCpf(), usuario, true, null);

        return toResponse(sol);
    }

    @Transactional
    public Response avaliar(Long solicitacaoId, AvaliacaoRequest req, Usuario usuario) {
        Solicitacao sol = solicitacaoRepository.findById(solicitacaoId)
            .orElseThrow(() -> new RuntimeException("Solicitacao nao encontrada"));

        if (!sol.getUsuario().getId().equals(usuario.getId()) && !"ADMIN".equals(usuario.getPerfil())) {
            throw new IllegalStateException("Você só pode avaliar sua própria solicitação");
        }

        if (req.getPrazos() != null) sol.setNotaPrazos(req.getPrazos());
        if (req.getQualidade() != null) sol.setNotaQualidade(req.getQualidade());
        if (req.getAtendimento() != null) sol.setNotaAtendimento(req.getAtendimento());
        if (req.getComentario() != null) sol.setFeedbackComentario(req.getComentario().trim());

        sol = solicitacaoRepository.save(sol);
        auditoriaService.registrar("AVALIACAO_SOLICITACAO",
            "Solicitacao " + sol.getProtocolo() + " avaliada por " + usuario.getNome() + " com notas Prazos=" + sol.getNotaPrazos() + ", Qualidade=" + sol.getNotaQualidade() + ", Atendimento=" + sol.getNotaAtendimento(),
            usuario.getCpf(), usuario, true, null);
        return toResponse(sol);
    }

    /**
     * Exclui uma solicitação (completa o CRUD). Apenas ADMIN.
     * Históricos e anexos são removidos em cascata e a exclusão é auditada.
     */
    @Transactional
    public void excluir(Long id, Usuario usuario, jakarta.servlet.http.HttpServletRequest request) {
        Solicitacao sol = solicitacaoRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Nao encontrada"));
        String protocolo = sol.getProtocolo();
        solicitacaoRepository.delete(sol);
        auditoriaService.registrar("EXCLUSAO_SOLICITACAO",
            "Solicitacao " + protocolo + " excluida por " + usuario.getNome(),
            usuario.getCpf(), usuario, true, request);
    }

    private EquipePublica resolverEquipeParaServico(Servico servico) {
        if (servico == null) return null;

        String referencia = normalizar(servico.getCategoria() + " " + servico.getSubcategoria());
        if (referencia.isBlank()) {
            return null;
        }

        EquipePublica melhorEquipe = null;
        int melhorScore = 0;

        for (EquipePublica equipe : equipeRepository.findByAtivoTrue()) {
            if (equipe == null || !Boolean.TRUE.equals(equipe.getAtivo())) {
                continue;
            }

            String nomeEquipe = normalizar(equipe.getNome());
            int score = calcularScoreSemelhanca(referencia, nomeEquipe);
            if (score > melhorScore) {
                melhorScore = score;
                melhorEquipe = equipe;
            }
        }

        return melhorScore > 0 ? melhorEquipe : null;
    }

    private int calcularScoreSemelhanca(String referencia, String nomeEquipe) {
        if (referencia == null || nomeEquipe == null || referencia.isBlank() || nomeEquipe.isBlank()) {
            return 0;
        }

        Set<String> tokensReferencia = tokens(referencia);
        Set<String> tokensEquipe = tokens(nomeEquipe);
        if (tokensReferencia.isEmpty() || tokensEquipe.isEmpty()) {
            return 0;
        }

        Set<String> interseccao = new HashSet<>(tokensReferencia);
        interseccao.retainAll(tokensEquipe);

        return interseccao.size();
    }

    private Set<String> tokens(String valor) {
        if (valor == null || valor.isBlank()) {
            return Set.of();
        }

        return Arrays.stream(valor.split("[^a-z0-9]+"))
            .map(String::trim)
            .filter(token -> !token.isBlank())
            .collect(Collectors.toCollection(HashSet::new));
    }

    private String normalizar(String valor) {
        if (valor == null) {
            return "";
        }

        String normalizado = Normalizer.normalize(valor, Normalizer.Form.NFD);
        normalizado = normalizado.replaceAll("[\\p{InCombiningDiacriticalMarks}]", "");
        normalizado = normalizado.toLowerCase(Locale.ROOT);
        normalizado = normalizado.replaceAll("[^a-z0-9\\s]", " ");
        normalizado = normalizado.replaceAll("\\s+", " ").trim();
        return normalizado;
    }

    private Response toResponse(Solicitacao s) {
        List<HistoricoDTO> hDtos = historicoRepository.findBySolicitacaoIdOrderByDataAsc(s.getId()).stream()
            .map(h -> new HistoricoDTO(h.getData(), h.getAcao(), h.getUsuario().getNome()))
            .collect(Collectors.toList());

        Response r = new Response();
        r.setId(s.getId()); r.setProtocolo(s.getProtocolo()); r.setDescricao(s.getDescricao());
        r.setGps(s.getGps()); r.setEndereco(s.getEndereco()); r.setStatus(s.getStatus()); r.setPrioridade(s.getPrioridade());
        r.setFotos(s.getFotos()); r.setNotaPrazos(s.getNotaPrazos()); r.setNotaQualidade(s.getNotaQualidade()); r.setNotaAtendimento(s.getNotaAtendimento()); r.setFeedbackComentario(s.getFeedbackComentario()); r.setDataCriacao(s.getDataCriacao()); r.setDataConclusao(s.getDataConclusao());
        r.setNomeUsuario(s.getUsuario().getNome());
        r.setNomeEquipe(s.getEquipe() != null ? s.getEquipe().getNome() : null);
        r.setIdEquipe(s.getEquipe() != null ? s.getEquipe().getId() : null);
        r.setCategoriaServico(s.getServico().getCategoria());
        r.setSubcategoriaServico(s.getServico().getSubcategoria());
        r.setHistoricos(hDtos);
        return r;
    }
}
