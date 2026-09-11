package br.gov.cuidar.service;

import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

import br.gov.cuidar.entity.EquipePublica;
import br.gov.cuidar.entity.OrgaoPublico;
import br.gov.cuidar.entity.Solicitacao;
import br.gov.cuidar.repository.EquipePublicaRepository;
import br.gov.cuidar.repository.OrgaoPublicoRepository;
import br.gov.cuidar.repository.SolicitacaoRepository;

@Service
public class AIChatbotService {

    private final VectorStore vectorStore;
    private final ChatModel chatModel;
    private final SolicitacaoRepository solicitacaoRepository;
    private final EquipePublicaRepository equipeRepository;
    private final OrgaoPublicoRepository orgaoRepository;

    public AIChatbotService(VectorStore vectorStore, ChatModel chatModel,
            SolicitacaoRepository solicitacaoRepository, EquipePublicaRepository equipeRepository,
            OrgaoPublicoRepository orgaoRepository) {
        this.vectorStore = vectorStore;
        this.chatModel = chatModel;
        this.solicitacaoRepository = solicitacaoRepository;
        this.equipeRepository = equipeRepository;
        this.orgaoRepository = orgaoRepository;
    }

    public String processQuery(String userMessage, String perfil, String usuarioId, String equipeId, String orgaoId) {
        try {
            String filterExpression;
            if ("CITIZEN".equals(perfil)) {
                filterExpression = "usuarioId == '" + usuarioId + "'";
            } else if ("GESTOR".equals(perfil)) {
                if (equipeId != null && !equipeId.equals("UNASSIGNED")) {
                    filterExpression = "equipeId == '" + equipeId + "'";
                } else {
                    filterExpression = "domain == 'solicitacoes' || domain == 'equipes'";
                }
            } else {
                filterExpression = "domain == 'solicitacoes' || domain == 'equipes'";
            }

            SearchRequest searchRequest = SearchRequest.query(userMessage)
                    .withTopK(20)
                    .withSimilarityThreshold(0.1)
                    .withFilterExpression(filterExpression);

                String context;
                if ("CITIZEN".equals(perfil)) {
                context = solicitacaoRepository.findByUsuarioIdOrderByDataCriacaoDesc(Long.valueOf(usuarioId)).stream()
                    .map(this::formatSolicitacao)
                    .reduce((a, b) -> a + "\n" + b)
                    .orElse("Nenhuma solicitação encontrada para este cidadão.");
                } else if ("ADMIN".equals(perfil) && orgaoId != null) {
                    context = solicitacaoRepository.findByOrgaoIdOrderByDataCriacaoDesc(Long.valueOf(orgaoId)).stream()
                            .map(this::formatSolicitacao)
                            .reduce((a, b) -> a + "\n" + b)
                            .orElse("Nenhuma solicitação encontrada para este órgão.");
                } else if ("GESTOR".equals(perfil) && equipeId != null && !equipeId.equals("UNASSIGNED")) {
                    Long idEquipe = Long.valueOf(equipeId);
                    String equipeContext = equipeRepository.findById(idEquipe)
                        .map(this::formatEquipe)
                        .orElse("Equipe não encontrada.");
                    String solicitacoesContext = solicitacaoRepository.findByEquipeIdOrderByDataCriacaoDesc(idEquipe).stream()
                        .map(this::formatSolicitacao)
                        .reduce((a, b) -> a + "\n" + b)
                        .orElse("Nenhuma solicitação encontrada para esta equipe.");
                    context = equipeContext + "\n" + solicitacoesContext;
                } else if ("GLOBAL_ADMIN".equals(perfil)) {
                    context = orgaoRepository.findByAtivoTrue().stream()
                            .map(this::formatOrgao)
                            .reduce((a, b) -> a + "\n" + b)
                            .orElse("Nenhum órgão ativo encontrado.");
                } else if ("ANALYTICS_ADMIN".equals(perfil)) {
                    context = formatResumoAnalitico(orgaoId != null ? Long.valueOf(orgaoId) : null);
                } else {
                List<Document> similarDocuments = vectorStore.similaritySearch(searchRequest);
                context = similarDocuments.stream()
                    .map(Document::getContent)
                    .reduce((a, b) -> a + "\n" + b)
                    .orElse("Nenhum dado encontrado no banco de dados.");
                }

            String perfilLabel = switch (perfil) {
                case "CITIZEN" -> "Cidadão";
                case "GESTOR" -> "Gestor Público";
                case "ADMIN" -> "Administrador do Sistema";
                default -> perfil;
            };

            String systemPromptTemplate = """
                    Você é a Luna, a assistente virtual inteligente oficial da plataforma Cuida+ Brasil, um sistema de zeladoria urbana municipal.
                    O usuário atual tem o perfil de: {perfil}.
                    A mensagem do usuário é: {userMessage}
                    
                    Seu objetivo é responder a dúvida do usuário utilizando ESTRITAMENTE as informações presentes no contexto abaixo (recuperado do banco de dados).
                    
                    INSTRUÇÕES IMPORTANTES:
                    - Formate sua resposta em **Markdown**. Use negrito, emojis e listas para tornar a leitura agradável.
                    - Estruture bem a resposta: separe as informações da Equipe das informações dos Protocolos usando Títulos em markdown (## ou ###).
                    - Para cada Protocolo/Chamado, use um formato limpo, por exemplo:
                      🔹 **[Protocolo]** - [Status com emoji]
                      * **Descrição:** [descrição do chamado]
                      * **Prioridade:** [prioridade]
                    - Para Equipes, mostre o Nome e o Órgão em destaque, e apresente os membros em uma lista com marcadores (bullet points) simples.
                    - Responda de forma concisa, educada e elegante. Evite pular muitas linhas desnecessárias.
                    - NÃO invente dados de protocolos, endereços ou status que não estejam no contexto.
                    - Se a resposta não estiver no contexto, diga cordialmente que não encontrou a informação.
                    - Se o usuário pedir botões de ação ou links, instrua-o a navegar pelo menu do sistema, pois você agora é focada em responder com texto inteligente.
                    - Você NUNCA deve revelar dados de outros usuários que não sejam os do perfil atual.
                    
                    DADOS RECUPERADOS (Contexto):
                    {context}
                    """;

            PromptTemplate promptTemplate = new PromptTemplate(systemPromptTemplate);
            Prompt prompt = promptTemplate.create(Map.of(
                    "perfil", perfilLabel,
                    "userMessage", userMessage,
                    "context", context
            ));

            return Objects.requireNonNull(chatModel.call(prompt).getResult()).getOutput().getContent();

        } catch (Exception e) {
            String errorMsg = e.getMessage() != null ? e.getMessage() : "";
            System.err.println("Erro no Gemini/VectorStore: " + errorMsg);
            if (errorMsg.contains("503") || errorMsg.contains("UNAVAILABLE") || errorMsg.contains("high demand")) {
                return "⚠️ Os servidores de IA estão com **alta demanda** no momento. Por favor, **aguarde alguns segundos** e tente novamente — isso é temporário!";
            }
            return "Desculpe, estou enfrentando uma instabilidade técnica no momento. Tente novamente em instantes.";
        }
    }

    private String formatSolicitacao(Solicitacao solicitacao) {
        String categoria = solicitacao.getServico() != null
                ? solicitacao.getServico().getCategoria() + " - " + solicitacao.getServico().getSubcategoria()
                : "Não informada";
        return String.format("Protocolo: %s%nStatus: %s%nPrioridade: %s%nCategoria: %s%nDescrição: %s%nLocal: %s",
                solicitacao.getProtocolo(), solicitacao.getStatus(),
                solicitacao.getPrioridade() != null ? solicitacao.getPrioridade() : "Não informada",
                categoria, solicitacao.getDescricao(),
                solicitacao.getEndereco() != null ? solicitacao.getEndereco() : solicitacao.getGps());
    }

    private String formatEquipe(EquipePublica equipe) {
        String orgao = equipe.getOrgao() != null ? equipe.getOrgao().getNome() : "Não informado";
        return String.format("Equipe: %s%nÓrgão responsável: %s%nStatus operacional: %s",
                equipe.getNome(), orgao,
                equipe.getStatusOperacional() != null ? equipe.getStatusOperacional() : "Não informado");
    }

    private String formatOrgao(OrgaoPublico orgao) {
        return String.format("Órgão: %s%nSigla: %s%nTipo: %s%nÁrea de atendimento: %s",
                orgao.getNome(), orgao.getSigla(), orgao.getTipo(), orgao.getAreaAtendimento());
    }

    private String formatResumoAnalitico(Long orgaoId) {
        long total = orgaoId == null ? solicitacaoRepository.count() : solicitacaoRepository.countByOrgaoId(orgaoId);
        StringBuilder resumo = new StringBuilder("Resumo analítico das solicitações:\n");
        resumo.append("Total: ").append(total).append("\n");

        List<Object[]> status = orgaoId == null
                ? solicitacaoRepository.countByStatusGrouped()
                : solicitacaoRepository.countByStatusGroupedAndOrgaoId(orgaoId);
        resumo.append("Por status:\n");
        for (Object[] row : status) {
            resumo.append("- ").append(row[0]).append(": ").append(row[1]).append("\n");
        }

        List<Object[]> categorias = orgaoId == null
                ? solicitacaoRepository.countByCategoria()
                : solicitacaoRepository.countByCategoriaAndOrgaoId(orgaoId);
        resumo.append("Por categoria:\n");
        for (Object[] row : categorias) {
            resumo.append("- ").append(row[0]).append(": ").append(row[1]).append("\n");
        }
        resumo.append("Urgentes em aberto: ")
                .append(orgaoId == null ? solicitacaoRepository.countUrgentes() : solicitacaoRepository.countUrgentesByOrgaoId(orgaoId));
        return resumo.toString();
    }

}
