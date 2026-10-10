package br.gov.cuidar.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.time.LocalDate;
import java.time.LocalDateTime;

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

    private long toLong(Object val) {
        return val instanceof Number n ? n.longValue() : 0L;
    }

    private double toDouble(Object val) {
        return val instanceof Number n ? n.doubleValue() : 0.0;
    }

    private int toInt(Object val) {
        return val instanceof Number n ? n.intValue() : 0;
    }

    public List<Map<String, Object>> getPerformanceEquipes(Long orgaoId, Long equipeId, LocalDateTime inicio, LocalDateTime fim) {
        List<Object[]> rows = solicitacaoRepository.queryPerformanceEquipesAvancada(orgaoId, equipeId, inicio, fim);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] r : rows) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("equipeId", r[0]);
            item.put("equipeNome", r[1]);
            item.put("orgaoSigla", r[2]);
            item.put("totalDemandas", toLong(r[3]));
            item.put("concluidas", toLong(r[4]));
            item.put("emAberto", toLong(r[5]));
            item.put("tempoMedioDias", toDouble(r[6]));
            item.put("taxaConclusao", toDouble(r[7]));
            item.put("notaMedia", toDouble(r[8]));
            item.put("rankPosicao", toInt(r[9]));
            result.add(item);
        }
        return result;
    }

    public List<Map<String, Object>> getPerformanceEquipes() {
        return getPerformanceEquipes(null, null, defaultStart(), defaultEnd());
    }

    public List<Map<String, Object>> getAnaliseSla(Long orgaoId, Long equipeId, LocalDateTime inicio, LocalDateTime fim) {
        List<Object[]> rows = solicitacaoRepository.queryAnaliseSlaAvancada(orgaoId, equipeId, inicio, fim);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] r : rows) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("categoria", r[0]);
            item.put("totalDemandas", toLong(r[1]));
            item.put("concluidas", toLong(r[2]));
            item.put("dentroPrazo", toLong(r[3]));
            item.put("concluidasAtraso", toLong(r[4]));
            item.put("ativasEstouradas", toLong(r[5]));
            item.put("mediaDias", toDouble(r[6]));
            item.put("conformidadeSlaPct", toDouble(r[7]));
            result.add(item);
        }
        return result;
    }

    public List<Map<String, Object>> getAnaliseSla() {
        return getAnaliseSla(null, null, defaultStart(), defaultEnd());
    }

    public Map<String, Object> getSatisfacaoCidadao(Long orgaoId, Long equipeId, LocalDateTime inicio, LocalDateTime fim) {
        List<Object[]> rows = solicitacaoRepository.queryAnaliseSatisfacaoAvancada(orgaoId, equipeId, inicio, fim);
        Map<String, Object> result = new LinkedHashMap<>();
        if (!rows.isEmpty()) {
            Object[] r = rows.get(0);
            result.put("totalAvaliadas", toLong(r[0]));
            result.put("mediaQualidade", toDouble(r[1]));
            result.put("mediaPrazos", toDouble(r[2]));
            result.put("mediaAtendimento", toDouble(r[3]));
            result.put("mediaGeral", toDouble(r[4]));
            result.put("csatPct", toDouble(r[5]));

            Map<String, Long> estrelas = new LinkedHashMap<>();
            estrelas.put("5", toLong(r[6]));
            estrelas.put("4", toLong(r[7]));
            estrelas.put("3", toLong(r[8]));
            estrelas.put("2", toLong(r[9]));
            estrelas.put("1", toLong(r[10]));
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

        result.put("feedbacksRecentes", getFeedbacksRecentes(orgaoId, equipeId, inicio, fim));
        return result;
    }

    public Map<String, Object> getSatisfacaoCidadao() {
        return getSatisfacaoCidadao(null, null, defaultStart(), defaultEnd());
    }

    public List<Map<String, Object>> getFeedbacksRecentes(Long orgaoId, Long equipeId, LocalDateTime inicio, LocalDateTime fim) {
        List<Object[]> rows = solicitacaoRepository.queryFeedbacksRecentesAvancados(orgaoId, equipeId, inicio, fim);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] r : rows) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", r[0]);
            item.put("protocolo", r[1]);
            item.put("categoria", r[2]);
            item.put("comentario", r[3]);
            item.put("mediaNota", toDouble(r[4]));
            item.put("cidadao", r[5]);
            item.put("dataConclusao", r[6]);
            result.add(item);
        }
        return result;
    }

    public List<Map<String, Object>> getFeedbacksRecentes() {
        return getFeedbacksRecentes(null, null, defaultStart(), defaultEnd());
    }

    public List<Map<String, Object>> getDistribuicaoTurnos(Long orgaoId, Long equipeId, LocalDateTime inicio, LocalDateTime fim, String bairro) {
        List<Object[]> rows = solicitacaoRepository.queryDistribuicaoTurnosAvancada(orgaoId, equipeId, inicio, fim, bairro);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] r : rows) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("diaNum", r[0]);
            item.put("diaNome", r[1]);
            item.put("turno", r[2]);
            item.put("periodo", r[1] + " · " + r[2]);
            item.put("total", toLong(r[3]));
            result.add(item);
        }
        return result;
    }

    public List<Map<String, Object>> getDistribuicaoTurnos() {
        return getDistribuicaoTurnos(null, null, defaultStart(), defaultEnd(), null);
    }

    public List<Map<String, Object>> getGargalosUrbanos(Long orgaoId, Long equipeId, LocalDateTime inicio, LocalDateTime fim,
            Integer diaNum, String turno) {
        List<Object[]> rows = solicitacaoRepository.queryGargalosUrbanosAvancados(orgaoId, equipeId, inicio, fim, diaNum, turno);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] r : rows) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("bairro", r[0]);
            item.put("totalDemandas", toLong(r[1]));
            item.put("pendentes", toLong(r[2]));
            item.put("emAtendimento", toLong(r[3]));
            item.put("concluidas", toLong(r[4]));
            item.put("urgentesAtivas", toLong(r[5]));
            item.put("mediaDiasEspera", toDouble(r[6]));
            item.put("rankCriticidade", toInt(r[7]));
            result.add(item);
        }
        return result;
    }

    public List<Map<String, Object>> getGargalosUrbanos() {
        return getGargalosUrbanos(null, null, defaultStart(), defaultEnd(), null, null);
    }

    public Map<String, Object> getDashboardAvancadoCompleto(Long orgaoId, Long equipeId, LocalDateTime inicio, LocalDateTime fim,
            String bairro, Integer diaNum, String turno) {
        Map<String, Object> consolidated = new LinkedHashMap<>();
        consolidated.put("performanceEquipes", getPerformanceEquipes(orgaoId, equipeId, inicio, fim));
        consolidated.put("analiseSla", getAnaliseSla(orgaoId, equipeId, inicio, fim));
        consolidated.put("satisfacaoCidadao", getSatisfacaoCidadao(orgaoId, equipeId, inicio, fim));
        consolidated.put("distribuicaoTurnos", getDistribuicaoTurnos(orgaoId, equipeId, inicio, fim, bairro));
        consolidated.put("gargalosUrbanos", getGargalosUrbanos(orgaoId, equipeId, inicio, fim, diaNum, turno));
        return consolidated;
    }

    public Map<String, Object> getDashboardAvancadoCompleto() {
        return getDashboardAvancadoCompleto(null, null, defaultStart(), defaultEnd(), null, null, null);
    }

    private LocalDateTime defaultStart() {
        return LocalDate.now().minusDays(29).atStartOfDay();
    }

    private LocalDateTime defaultEnd() {
        return LocalDate.now().plusDays(1).atStartOfDay();
    }
}
