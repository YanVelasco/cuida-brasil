package br.gov.cuidar.service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    public SolicitacaoService(SolicitacaoRepository solicitacaoRepository, UsuarioRepository usuarioRepository, ServicoRepository servicoRepository, EquipePublicaRepository equipeRepository, HistoricoRepository historicoRepository, VisionValidationService visionValidationService, GestorRepository gestorRepository) {
        this.solicitacaoRepository = solicitacaoRepository;
        this.usuarioRepository = usuarioRepository;
        this.servicoRepository = servicoRepository;
        this.equipeRepository = equipeRepository;
        this.historicoRepository = historicoRepository;
        this.visionValidationService = visionValidationService;
        this.gestorRepository = gestorRepository;
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
        sol = solicitacaoRepository.save(sol);

        Historico hist = new Historico();
        hist.setAcao("Solicitacao registrada pelo cidadao.");
        hist.setSolicitacao(sol);
        hist.setUsuario(usuario);
        historicoRepository.save(hist);

        return toResponse(sol);
    }

    public Page<Response> listarTodas(String status, String gestor, int page, int size, Usuario usuario) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("dataCriacao").descending());
        Page<Solicitacao> result;

        if (usuario != null && "GESTOR".equals(usuario.getPerfil())) {
            Long equipeId = gestorRepository.findEquipeIdByUsuarioId(usuario.getId()).orElse(null);
            if (equipeId == null) {
                return Page.empty(pageable);
            }
            result = status != null
                ? solicitacaoRepository.findByStatusAndEquipeIdOrNull(status, equipeId, pageable)
                : solicitacaoRepository.findByEquipeIdOrNull(equipeId, pageable);
        } else if (gestor != null && !gestor.isBlank() && usuario != null && "ADMIN".equals(usuario.getPerfil())) {
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

        return toResponse(sol);
    }

    private Response toResponse(Solicitacao s) {
        List<HistoricoDTO> hDtos = historicoRepository.findBySolicitacaoIdOrderByDataAsc(s.getId()).stream()
            .map(h -> new HistoricoDTO(h.getData(), h.getAcao(), h.getUsuario().getNome()))
            .collect(Collectors.toList());

        Response r = new Response();
        r.setId(s.getId()); r.setProtocolo(s.getProtocolo()); r.setDescricao(s.getDescricao());
        r.setGps(s.getGps()); r.setEndereco(s.getEndereco()); r.setStatus(s.getStatus()); r.setPrioridade(s.getPrioridade());
        r.setDataCriacao(s.getDataCriacao()); r.setDataConclusao(s.getDataConclusao());
        r.setNomeUsuario(s.getUsuario().getNome());
        r.setNomeEquipe(s.getEquipe() != null ? s.getEquipe().getNome() : null);
        r.setIdEquipe(s.getEquipe() != null ? s.getEquipe().getId() : null);
        r.setCategoriaServico(s.getServico().getCategoria());
        r.setSubcategoriaServico(s.getServico().getSubcategoria());
        r.setHistoricos(hDtos);
        return r;
    }
}
