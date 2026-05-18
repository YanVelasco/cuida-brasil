package br.gov.cuidar.service;

import br.gov.cuidar.dto.SolicitacaoDTO.*;
import br.gov.cuidar.entity.*;
import br.gov.cuidar.repository.*;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SolicitacaoService {

    private final SolicitacaoRepository solicitacaoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ServicoRepository servicoRepository;
    private final EquipePublicaRepository equipeRepository;
    private final HistoricoRepository historicoRepository;

    public SolicitacaoService(SolicitacaoRepository solicitacaoRepository, UsuarioRepository usuarioRepository, ServicoRepository servicoRepository, EquipePublicaRepository equipeRepository, HistoricoRepository historicoRepository) {
        this.solicitacaoRepository = solicitacaoRepository;
        this.usuarioRepository = usuarioRepository;
        this.servicoRepository = servicoRepository;
        this.equipeRepository = equipeRepository;
        this.historicoRepository = historicoRepository;
    }

    @Transactional
    public Response criar(CreateRequest req, Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new RuntimeException("Usuario nao encontrado"));
        Servico servico = servicoRepository.findById(req.getIdServico())
            .orElseThrow(() -> new RuntimeException("Servico nao encontrado"));

        String protocolo = "PRO-" + LocalDate.now().getYear() + "-" + String.format("%06d", (int)(Math.random() * 999999));

        Solicitacao sol = new Solicitacao();
        sol.setProtocolo(protocolo);
        sol.setDescricao(req.getDescricao());
        sol.setGps(req.getGps());
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

    public Page<Response> listarTodas(String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("dataCriacao").descending());
        Page<Solicitacao> result = status != null
            ? solicitacaoRepository.findByStatus(status, pageable)
            : solicitacaoRepository.findAll(pageable);
        return result.map(this::toResponse);
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

        sol.setStatus(req.getStatus());
        if (req.getPrioridade() != null) sol.setPrioridade(req.getPrioridade());
        if (req.getIdEquipe() != null) equipeRepository.findById(req.getIdEquipe()).ifPresent(sol::setEquipe);
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
        r.setGps(s.getGps()); r.setStatus(s.getStatus()); r.setPrioridade(s.getPrioridade());
        r.setDataCriacao(s.getDataCriacao()); r.setDataConclusao(s.getDataConclusao());
        r.setNomeUsuario(s.getUsuario().getNome());
        r.setNomeEquipe(s.getEquipe() != null ? s.getEquipe().getNome() : null);
        r.setCategoriaServico(s.getServico().getCategoria());
        r.setSubcategoriaServico(s.getServico().getSubcategoria());
        r.setHistoricos(hDtos);
        return r;
    }
}
