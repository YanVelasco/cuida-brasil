package br.gov.cuidar.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.gov.cuidar.repository.SolicitacaoRepository;

@Service
@Transactional(readOnly = true)
public class AnalyticsService {

    private final SolicitacaoRepository solicitacaoRepository;

    public AnalyticsService(SolicitacaoRepository solicitacaoRepository) {
        this.solicitacaoRepository = solicitacaoRepository;
    }

    public List<Map<String, Object>> getPerformanceEquipes(Long orgaoId, Long equipeId) {
        List<Object[]> rows = solicitacaoRepository.queryPerformanceEquipesAvancada(orgaoId, equipeId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] r : rows) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("equipeId", r[0]);
            item.put("equipeNome", r[1]);
            item.put("orgaoSigla", r[2]);
            item.put("totalDemandas", ((Number) r[3]).longValue());
            item.put("concluidas", ((Number) r[4]).longValue());
            item.put("emAberto", ((Number) r[5]).longValue());
            item.put("tempoMedioDias", ((Number) r[6]).doubleValue());
            item.put("taxaConclusao", ((Number) r[7]).doubleValue());
            item.put("notaMedia", ((Number) r[8]).doubleValue());
            item.put("rankPosicao", ((Number) r[9]).intValue());
            result.add(item);
        }
        return result;
    }

    public List<Map<String, Object>> getPerformanceEquipes() {
        return getPerformanceEquipes(null, null);
    }

    public List<Map<String, Object>> getAnaliseSla(Long orgaoId, Long equipeId) {
        List<Object[]> rows = solicitacaoRepository.queryAnaliseSlaAvancada(orgaoId, equipeId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] r : rows) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("categoria", r[0]);
            item.put("totalDemandas", ((Number) r[1]).longValue());
            item.put("concluidas", ((Number) r[2]).longValue());
            item.put("dentroPrazo", ((Number) r[3]).longValue());
            item.put("concluidasAtraso", ((Number) r[4]).longValue());
            item.put("ativasEstouradas", ((Number) r[5]).longValue());
            item.put("mediaDias", ((Number) r[6]).doubleValue());
            item.put("conformidadeSlaPct", ((Number) r[7]).doubleValue());
            result.add(item);
        }
        return result;
    }

    public List<Map<String, Object>> getAnaliseSla() {
        return getAnaliseSla(null, null);
    }

    public Map<String, Object> getSatisfacaoCidadao(Long orgaoId, Long equipeId) {
        List<Object[]> rows = solicitacaoRepository.queryAnaliseSatisfacaoAvancada(orgaoId, equipeId);
        Map<String, Object> result = new LinkedHashMap<>();
        if (!rows.isEmpty()) {
            Object[] r = rows.get(0);
            result.put("totalAvaliadas", ((Number) r[0]).longValue());
            result.put("mediaQualidade", ((Number) r[1]).doubleValue());
            result.put("mediaPrazos", ((Number) r[2]).doubleValue());
            result.put("mediaAtendimento", ((Number) r[3]).doubleValue());
            result.put("mediaGeral", ((Number) r[4]).doubleValue());
            result.put("csatPct", ((Number) r[5]).doubleValue());

            Map<String, Long> estrelas = new LinkedHashMap<>();
            estrelas.put("5", ((Number) r[6]).longValue());
            estrelas.put("4", ((Number) r[7]).longValue());
            estrelas.put("3", ((Number) r[8]).longValue());
            estrelas.put("2", ((Number) r[9]).longValue());
            estrelas.put("1", ((Number) r[10]).longValue());
            result.put("distribuicaoEstrelas", estrelas);
        } else {
            result.put("totalAvaliadas", 0L);
            result.put("mediaQualidade", 0.0);
            result.put("mediaPrazos", 0.0);
            result.put("mediaAtendimento", 0.0);
            result.put("mediaGeral", 0.0);
            result.put("csatPct", 0.0);
            result.put("distribuicaoEstrelas", Map.of("5", 0L, "4", 0L, "3", 0L, "2", 0L, "1", 0L));
        }

        result.put("feedbacksRecentes", getFeedbacksRecentes(orgaoId, equipeId));
        return result;
    }

    public Map<String, Object> getSatisfacaoCidadao() {
        return getSatisfacaoCidadao(null, null);
    }

    public List<Map<String, Object>> getFeedbacksRecentes(Long orgaoId, Long equipeId) {
        List<Object[]> rows = solicitacaoRepository.queryFeedbacksRecentesAvancados(orgaoId, equipeId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] r : rows) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("protocolo", r[0]);
            item.put("categoria", r[1]);
            item.put("comentario", r[2]);
            item.put("mediaNota", ((Number) r[3]).doubleValue());
            item.put("cidadao", r[4]);
            item.put("dataConclusao", r[5]);
            result.add(item);
        }
        return result;
    }

    public List<Map<String, Object>> getFeedbacksRecentes() {
        return getFeedbacksRecentes(null, null);
    }

    public List<Map<String, Object>> getDistribuicaoTurnos(Long orgaoId, Long equipeId) {
        List<Object[]> rows = solicitacaoRepository.queryDistribuicaoTurnosAvancada(orgaoId, equipeId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] r : rows) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("diaNum", r[0]);
            item.put("diaNome", r[1]);
            item.put("turno", r[2]);
            item.put("total", ((Number) r[3]).longValue());
            result.add(item);
        }
        return result;
    }

    public List<Map<String, Object>> getDistribuicaoTurnos() {
        return getDistribuicaoTurnos(null, null);
    }

    public List<Map<String, Object>> getGargalosUrbanos(Long orgaoId, Long equipeId) {
        List<Object[]> rows = solicitacaoRepository.queryGargalosUrbanosAvancados(orgaoId, equipeId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] r : rows) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("bairro", r[0]);
            item.put("totalDemandas", ((Number) r[1]).longValue());
            item.put("pendentes", ((Number) r[2]).longValue());
            item.put("emAtendimento", ((Number) r[3]).longValue());
            item.put("concluidas", ((Number) r[4]).longValue());
            item.put("urgentesAtivas", ((Number) r[5]).longValue());
            item.put("mediaDiasEspera", ((Number) r[6]).doubleValue());
            item.put("rankCriticidade", ((Number) r[7]).intValue());
            result.add(item);
        }
        return result;
    }

    public List<Map<String, Object>> getGargalosUrbanos() {
        return getGargalosUrbanos(null, null);
    }

    public Map<String, Object> getDashboardAvancadoCompleto(Long orgaoId, Long equipeId) {
        Map<String, Object> consolidated = new LinkedHashMap<>();
        consolidated.put("performanceEquipes", getPerformanceEquipes(orgaoId, equipeId));
        consolidated.put("analiseSla", getAnaliseSla(orgaoId, equipeId));
        consolidated.put("satisfacaoCidadao", getSatisfacaoCidadao(orgaoId, equipeId));
        consolidated.put("distribuicaoTurnos", getDistribuicaoTurnos(orgaoId, equipeId));
        consolidated.put("gargalosUrbanos", getGargalosUrbanos(orgaoId, equipeId));
        return consolidated;
    }

    public Map<String, Object> getDashboardAvancadoCompleto() {
        return getDashboardAvancadoCompleto(null, null);
    }
}
