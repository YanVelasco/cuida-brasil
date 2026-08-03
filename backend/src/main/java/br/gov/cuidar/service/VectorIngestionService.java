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
    private final br.gov.cuidar.repository.EquipePublicaRepository equipeRepository;
    private final br.gov.cuidar.repository.GestorRepository gestorRepository;
    private boolean initialized = false;

    public VectorIngestionService(VectorStore vectorStore, SolicitacaoRepository solicitacaoRepository,
                                  br.gov.cuidar.repository.EquipePublicaRepository equipeRepository,
                                  br.gov.cuidar.repository.GestorRepository gestorRepository) {
        this.vectorStore = vectorStore;
        this.solicitacaoRepository = solicitacaoRepository;
        this.equipeRepository = equipeRepository;
        this.gestorRepository = gestorRepository;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional(readOnly = true)
    public void ingestOnStartup() {
        if (!initialized) {
            List<Solicitacao> solicitacoes = solicitacaoRepository.findAll();
            for(Solicitacao s : solicitacoes) {
                ingestSolicitacao(s);
            }
            
            List<br.gov.cuidar.entity.EquipePublica> equipes = equipeRepository.findByAtivoTrue();
            for (br.gov.cuidar.entity.EquipePublica eq : equipes) {
                ingestEquipe(eq);
            }
            
            initialized = true;
            System.out.println("[VectorIngestion] " + solicitacoes.size() + " solicitacoes and " + equipes.size() + " equipes ingested to PGVector");
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

    public void ingestEquipe(br.gov.cuidar.entity.EquipePublica eq) {
        List<br.gov.cuidar.entity.Gestor> membros = gestorRepository.findByEquipeId(eq.getId());
        StringBuilder membrosStr = new StringBuilder();
        for (br.gov.cuidar.entity.Gestor m : membros) {
            membrosStr.append("- ").append(m.getUsuario().getNome())
                      .append(" (Perfil: ").append(m.getUsuario().getPerfil()).append(")\n");
        }

        String content = String.format("""
                Equipe: %s
                Órgão Responsável: %s
                Membros da Equipe:
                %s
                """,
                eq.getNome(),
                eq.getOrgao().getNome(),
                membrosStr.length() > 0 ? membrosStr.toString() : "Nenhum membro cadastrado."
        );

        Map<String, Object> metadata = Map.of(
                "domain", "equipes",
                "equipeId", String.valueOf(eq.getId())
        );

        vectorStore.add(List.of(new Document(content, metadata)));
    }
}
