package br.gov.cuidar.service;

import br.gov.cuidar.entity.Solicitacao;
import br.gov.cuidar.repository.SolicitacaoRepository;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;

@Service
public class VectorIngestionService {

    private final VectorStore vectorStore;
    private final SolicitacaoRepository solicitacaoRepository;
    private boolean initialized = false;

    public VectorIngestionService(VectorStore vectorStore, SolicitacaoRepository solicitacaoRepository) {
        this.vectorStore = vectorStore;
        this.solicitacaoRepository = solicitacaoRepository;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional(readOnly = true)
    public void ingestOnStartup() {
        if (!initialized) {
            List<Solicitacao> solicitacoes = solicitacaoRepository.findAll();
            for(Solicitacao s : solicitacoes) {
                ingestSolicitacao(s);
            }
            initialized = true;
            System.out.println("[VectorIngestion] " + solicitacoes.size() + " solicitacoes ingested to PGVector");
        }
    }

    public void ingestSolicitacao(Solicitacao s) {
        String content = String.format("""
                Protocolo: %s
                Descrição: %s
                Status: %s
                Prioridade: %s
                Categoria: %s
                Local: %s
                Cidadão Autor: %s
                """,
                s.getProtocolo(),
                s.getDescricao(),
                s.getStatus(),
                s.getPrioridade() != null ? s.getPrioridade() : "N/A",
                s.getServico().getCategoria() + " - " + s.getServico().getSubcategoria(),
                s.getGps(),
                s.getUsuario().getNome()
        );

        Map<String, Object> metadata = Map.of(
                "domain", "solicitacoes",
                "protocolo", s.getProtocolo(),
                "status", s.getStatus(),
                "usuarioId", String.valueOf(s.getUsuario().getId()),
                "equipeId", s.getEquipe() != null ? String.valueOf(s.getEquipe().getId()) : "UNASSIGNED"
        );

        vectorStore.add(List.of(new Document(content, metadata)));
    }
}
