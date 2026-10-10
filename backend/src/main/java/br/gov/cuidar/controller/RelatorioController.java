package br.gov.cuidar.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.gov.cuidar.dto.ApiResponse;
import br.gov.cuidar.entity.Usuario;
import br.gov.cuidar.repository.EquipePublicaRepository;
import br.gov.cuidar.repository.GestorRepository;
import br.gov.cuidar.repository.OrgaoPublicoRepository;
import br.gov.cuidar.repository.SolicitacaoRepository;
import br.gov.cuidar.repository.UsuarioRepository;
import br.gov.cuidar.service.AuditoriaService;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@org.springframework.transaction.annotation.Transactional(rollbackFor = Exception.class)
@RequestMapping("/api/relatorios")
@PreAuthorize("hasAnyRole('ADMIN', 'GESTOR', 'ANALYTICS_ADMIN', 'GLOBAL_ADMIN')")
public class RelatorioController {

    private final SolicitacaoRepository solRepo;
    private final GestorRepository gestorRepo;
    private final UsuarioRepository usuarioRepo;
    private final EquipePublicaRepository equipeRepo;
    private final OrgaoPublicoRepository orgaoRepo;
    private final AuditoriaService auditoriaService;

    public RelatorioController(SolicitacaoRepository solRepo, GestorRepository gestorRepo,
            UsuarioRepository usuarioRepo, EquipePublicaRepository equipeRepo, OrgaoPublicoRepository orgaoRepo,
            AuditoriaService auditoriaService) {
        this.solRepo = solRepo;
        this.gestorRepo = gestorRepo;
        this.usuarioRepo = usuarioRepo;
        this.equipeRepo = equipeRepo;
        this.orgaoRepo = orgaoRepo;
        this.auditoriaService = auditoriaService;
    }

    @GetMapping("/visao-geral")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> visaoGeral(
            @AuthenticationPrincipal Usuario usuario,
            @RequestParam(required = false) String inicio,
            @RequestParam(required = false) String fim,
            @RequestParam(required = false) String gestor,
            @RequestParam(required = false) Long orgaoId,
            HttpServletRequest request) {
        LocalDate dataFim = fim == null || fim.isBlank() ? LocalDate.now() : LocalDate.parse(fim);
        LocalDate dataInicio = inicio == null || inicio.isBlank()
                ? dataFim.minusDays(29)
                : LocalDate.parse(inicio);
        if (dataInicio.isAfter(dataFim)) {
            LocalDate swap = dataInicio;
            dataInicio = dataFim;
            dataFim = swap;
        }

        Long escopoOrgao = null;
        Long escopoEquipe = null;
        boolean incluirNaoAtribuidas = false;
        String filtroGestor = gestor == null || gestor.isBlank() ? null : gestor.trim();

        if ("GESTOR".equals(usuario.getPerfil())) {
            escopoEquipe = getEquipeId(usuario);
            filtroGestor = null;
        } else if ("ADMIN".equals(usuario.getPerfil())) {
            if (usuario.getOrgao() == null) {
                escopoOrgao = -1L;
                incluirNaoAtribuidas = false;
            } else {
                escopoOrgao = usuario.getOrgao().getId();
                incluirNaoAtribuidas = true;
            }
        } else if ("ANALYTICS_ADMIN".equals(usuario.getPerfil()) && usuario.getOrgao() != null) {
            escopoOrgao = usuario.getOrgao().getId();
            incluirNaoAtribuidas = true;
        } else {
            escopoOrgao = orgaoId;
            incluirNaoAtribuidas = escopoOrgao == null;
        }

        List<Object[]> rows = ("GESTOR".equals(usuario.getPerfil()) && escopoEquipe == null)
                ? List.of()
                : solRepo.findReportRows(dataInicio.atStartOfDay(), dataFim.plusDays(1).atStartOfDay(),
                        escopoOrgao, escopoEquipe, incluirNaoAtribuidas, filtroGestor);

        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rows) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", row[0]);
            item.put("protocolo", row[1]);
            item.put("status", row[2]);
            item.put("prioridade", row[3]);
            item.put("dataCriacao", row[4]);
            item.put("categoria", row[5]);
            item.put("endereco", row[6]);
            item.put("gps", row[7]);
            item.put("equipe", row[8]);
            result.add(item);
        }

        auditoriaService.registrar("CONSULTA_RELATORIO_VISAO_GERAL",
                "Visão geral consultada por " + usuario.getNome() + " no período " + dataInicio + " a " + dataFim,
                usuario.getCpf(), usuario, true, request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/resumo")
    public ResponseEntity<ApiResponse<Map<String, Long>>> resumo(
            @AuthenticationPrincipal Usuario usuario,
            @RequestParam(required = false) String inicio,
            @RequestParam(required = false) String fim,
            @RequestParam(required = false) String gestor,
            HttpServletRequest request) {
        String iniStr = (inicio != null && !inicio.isBlank()) ? inicio : LocalDate.now().minusDays(30).toString();
        String fimStr = (fim != null && !fim.isBlank()) ? fim : LocalDate.now().toString();
        LocalDateTime inicioData = LocalDate.parse(iniStr).atStartOfDay();
        LocalDateTime fimData = LocalDate.parse(fimStr).plusDays(1).atStartOfDay();
        Map<String, Long> result = new LinkedHashMap<>();

        if ("GESTOR".equals(usuario.getPerfil())) {
            Long equipeId = getEquipeId(usuario);
            if (equipeId == null) {
                result.put("total", 0L);
                result.put("concluidas", 0L);
                result.put("emAndamento", 0L);
                result.put("abertas", 0L);
                result.put("urgentes", 0L);
            } else {
                result.put("total", solRepo.countByEquipeIdAndPeriod(equipeId, inicioData, fimData));
                result.put("concluidas", solRepo.countByStatusAndEquipeIdAndPeriod("CONCLUIDA", equipeId, inicioData, fimData));
                result.put("emAndamento", solRepo.countByStatusAndEquipeIdAndPeriod("EM_ANDAMENTO", equipeId, inicioData, fimData)
                        + solRepo.countByStatusAndEquipeIdAndPeriod("EM_CAMPO", equipeId, inicioData, fimData));
                result.put("abertas", solRepo.countByStatusAndEquipeIdAndPeriod("PENDENTE", equipeId, inicioData, fimData)
                        + solRepo.countByStatusAndEquipeIdAndPeriod("TRIAGEM", equipeId, inicioData, fimData));
                result.put("urgentes", solRepo.countUrgentesByEquipeIdAndPeriod(equipeId, inicioData, fimData));
            }
        } else if (isAdminLocal(usuario)) {
            Long orgaoId = usuario.getOrgao().getId();
            result.put("total", solRepo.countByOrgaoIdAndPeriod(orgaoId, inicioData, fimData, gestor));
            result.put("concluidas", solRepo.countByStatusAndOrgaoIdAndPeriod("CONCLUIDA", orgaoId, inicioData, fimData, gestor));
            result.put("emAndamento", solRepo.countByStatusAndOrgaoIdAndPeriod("EM_ANDAMENTO", orgaoId, inicioData, fimData, gestor)
                + solRepo.countByStatusAndOrgaoIdAndPeriod("EM_CAMPO", orgaoId, inicioData, fimData, gestor));
            result.put("abertas", solRepo.countByStatusAndOrgaoIdAndPeriod("PENDENTE", orgaoId, inicioData, fimData, gestor)
                + solRepo.countByStatusAndOrgaoIdAndPeriod("TRIAGEM", orgaoId, inicioData, fimData, gestor));
            result.put("urgentes", solRepo.countUrgentesByOrgaoIdAndPeriod(orgaoId, inicioData, fimData, gestor));
        } else {
            result.put("total", solRepo.countByPeriod(inicioData, fimData, gestor));
            result.put("concluidas", solRepo.countByStatusAndPeriod("CONCLUIDA", inicioData, fimData, gestor));
            result.put("emAndamento", solRepo.countByStatusAndPeriod("EM_ANDAMENTO", inicioData, fimData, gestor)
                + solRepo.countByStatusAndPeriod("EM_CAMPO", inicioData, fimData, gestor));
            result.put("abertas", solRepo.countByStatusAndPeriod("PENDENTE", inicioData, fimData, gestor)
                + solRepo.countByStatusAndPeriod("TRIAGEM", inicioData, fimData, gestor));
            result.put("urgentes", solRepo.countUrgentesByPeriod(inicioData, fimData, gestor));
        }

        auditoriaService.registrar("CONSULTA_RELATORIO_RESUMO",
            "Resumo solicitado por " + usuario.getNome() + " no periodo " + iniStr + " a " + fimStr + (gestor != null ? " para gestor " + gestor : ""),
            usuario.getCpf(), usuario, true, request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Retorna a contagem de solicitações agrupada por categoria de serviço.
     * GESTOR vê apenas sua equipe; ADMIN vê apenas seu órgão.
     */
    @GetMapping("/por-categoria")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> porCategoria(
            @AuthenticationPrincipal Usuario usuario,
            @RequestParam(required = false) String inicio,
            @RequestParam(required = false) String fim,
            @RequestParam(required = false) String gestor,
            HttpServletRequest request) {

        String iniStr = (inicio != null && !inicio.isBlank()) ? inicio : LocalDate.now().minusDays(30).toString();
        String fimStr = (fim != null && !fim.isBlank()) ? fim : LocalDate.now().toString();
        LocalDateTime inicioData = LocalDate.parse(iniStr).atStartOfDay();
        LocalDateTime fimData = LocalDate.parse(fimStr).plusDays(1).atStartOfDay();

        List<Object[]> raw;
        if (isAdminLocal(usuario)) {
            Long orgaoId = usuario.getOrgao().getId();
            raw = solRepo.countByCategoriaAndOrgaoIdPeriod(orgaoId, inicioData, fimData, gestor);
        } else if ("GESTOR".equals(usuario.getPerfil())) {
            Long equipeId = getEquipeId(usuario);
            raw = equipeId != null
                    ? solRepo.countByCategoriaAndEquipeIdPeriod(equipeId, inicioData, fimData)
                    : List.of();
        } else {
            String filtroGestor = gestor;
            raw = solRepo.countByCategoriaPeriod(inicioData, fimData, filtroGestor);
        }

        long total = raw.stream().mapToLong(r -> ((Number) r[1]).longValue()).sum();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : raw) {
            String categoria = (String) row[0];
            long count = ((Number) row[1]).longValue();
            int pct = total > 0 ? (int) Math.round(count * 100.0 / total) : 0;
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("nome", categoria);
            item.put("qtd", count);
            item.put("pct", pct);
            result.add(item);
        }
        auditoriaService.registrar("CONSULTA_RELATORIO_CATEGORIA",
            "Relatorio por categoria solicitado por " + usuario.getNome() + " no periodo " + inicio + " a " + fim,
            usuario.getCpf(), usuario, true, request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Retorna a contagem de solicitações agrupada por status.
     */
    @GetMapping("/por-status")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> porStatus(
            @AuthenticationPrincipal Usuario usuario,
            @RequestParam String inicio, @RequestParam String fim,
            @RequestParam(required = false) String gestor,
            HttpServletRequest request) {
 
        List<Object[]> raw;
        if (isAdminLocal(usuario)) {
            Long orgaoId = usuario.getOrgao().getId();
            LocalDateTime inicioData = LocalDate.parse(inicio).atStartOfDay();
            LocalDateTime fimData = LocalDate.parse(fim).plusDays(1).atStartOfDay();
            String filtroGestor = gestor;
            raw = (inicio != null && fim != null)
                ? solRepo.countByStatusGroupedAndOrgaoIdPeriod(orgaoId, inicioData, fimData, filtroGestor)
                : solRepo.countByStatusGroupedAndOrgaoId(orgaoId);
        } else if ("GESTOR".equals(usuario.getPerfil())) {
            Long equipeId = getEquipeId(usuario);
            raw = equipeId == null ? List.of()
                : solRepo.countByStatusGroupedAndEquipeIdPeriod(equipeId,
                    LocalDate.parse(inicio).atStartOfDay(), LocalDate.parse(fim).plusDays(1).atStartOfDay());
        } else if (inicio != null && fim != null) {
            LocalDateTime inicioData = LocalDate.parse(inicio).atStartOfDay();
            LocalDateTime fimData = LocalDate.parse(fim).plusDays(1).atStartOfDay();
            String filtroGestor = "GESTOR".equals(usuario.getPerfil()) ? usuario.getNome() : gestor;
            raw = solRepo.countByStatusGroupedPeriod(inicioData, fimData, filtroGestor);
        } else if ("GESTOR".equals(usuario.getPerfil())) {
            Long equipeId = getEquipeId(usuario);
            raw = equipeId != null ? solRepo.countByStatusGroupedAndEquipeId(equipeId) : List.of();
        } else {
            raw = solRepo.countByStatusGrouped();
        }
 
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : raw) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("status", row[0]);
            item.put("total", ((Number) row[1]).longValue());
            result.add(item);
        }
        auditoriaService.registrar("CONSULTA_RELATORIO_STATUS",
            "Relatorio por status solicitado por " + usuario.getNome() + " no periodo " + inicio + " a " + fim,
            usuario.getCpf(), usuario, true, request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
        * Retorna a tendência mensal no escopo autorizado do usuário.
     */
    @GetMapping("/tendencia-mensal")
        @PreAuthorize("hasAnyRole('ADMIN', 'GESTOR', 'ANALYTICS_ADMIN', 'GLOBAL_ADMIN')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> tendenciaMensal(
            @RequestParam(required = false) String inicio, @RequestParam(required = false) String fim,
            @RequestParam(required = false) String gestor,
            @AuthenticationPrincipal Usuario usuario,
            HttpServletRequest request) {
        LocalDateTime fimData = fim != null ? LocalDate.parse(fim).plusDays(1).atStartOfDay() : LocalDateTime.now().plusDays(1);
        LocalDateTime inicioData = inicio != null ? LocalDate.parse(inicio).atStartOfDay() : fimData.minusMonths(6);
        List<Object[]> raw;
        if ("GESTOR".equals(usuario.getPerfil())) {
            Long equipeId = getEquipeId(usuario);
            raw = equipeId == null ? List.of()
                : solRepo.tendenciaMensalPeriodAndEquipeId(equipeId, inicioData, fimData);
        } else if (isAdminLocal(usuario)) {
            Long orgaoId = usuario.getOrgao().getId();
            raw = solRepo.tendenciaMensalPeriodAndOrgaoId(orgaoId, inicioData, fimData, gestor);
        } else {
            raw = solRepo.tendenciaMensalPeriod(inicioData, fimData, gestor);
        }
        String[] meses = {"Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"};
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : raw) {
            int mesNum = ((Number) row[0]).intValue();
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("mes", meses[mesNum - 1]);
            item.put("ano", ((Number) row[1]).intValue());
            item.put("total", ((Number) row[2]).longValue());
            result.add(item);
        }
        auditoriaService.registrar("CONSULTA_RELATORIO_TENDENCIA",
            "Tendencia mensal consultada por " + usuario.getNome() + " com filtro gestor=" + gestor,
            usuario.getCpf(), usuario, true, request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Indicadores nacionais reais produzidos pelo sistema:
     * taxa de conclusão, tempo médio de resolução, cobertura territorial, engajamento.
     */
    @GetMapping("/indicadores")
        public ResponseEntity<ApiResponse<Map<String, Object>>> indicadores(
            @AuthenticationPrincipal Usuario usuario,
            @RequestParam(required = false) String inicio,
            @RequestParam(required = false) String fim,
            HttpServletRequest request) {
        long total;
        long concluidas;
        Double tempoMedio;
        long regioes;
        long gestoresCount;
        long equipesCount;

        String inicioPeriodo = (inicio != null && !inicio.isBlank()) ? inicio : LocalDate.now().minusDays(30).toString();
        String fimPeriodo = (fim != null && !fim.isBlank()) ? fim : LocalDate.now().toString();
        LocalDateTime inicioData = LocalDate.parse(inicioPeriodo).atStartOfDay();
        LocalDateTime fimData = LocalDate.parse(fimPeriodo).plusDays(1).atStartOfDay();

        if ("GESTOR".equals(usuario.getPerfil())) {
            Long equipeId = getEquipeId(usuario);
            if (equipeId == null) {
                total = 0;
                concluidas = 0;
                tempoMedio = null;
                regioes = 0;
                gestoresCount = 0;
                equipesCount = 0;
            } else {
                total = solRepo.countByEquipeIdAndPeriod(equipeId, inicioData, fimData);
                concluidas = solRepo.countByStatusAndEquipeIdAndPeriod("CONCLUIDA", equipeId, inicioData, fimData);
                tempoMedio = solRepo.tempoMedioResolucaoDiasByEquipeIdAndPeriod(equipeId, inicioData, fimData);
                regioes = solRepo.dadosTerritoriaisByEquipeIdAndPeriod(equipeId, inicioData, fimData).stream()
                        .map(row -> extrairRegiao((String) row[0], (String) row[1]))
                        .filter(region -> !"Não informada".equals(region))
                        .distinct().count();
                gestoresCount = 1;
                equipesCount = 1;
            }
        } else if (isAdminLocal(usuario)) {
            Long orgaoId = usuario.getOrgao().getId();
            total = solRepo.countByOrgaoId(orgaoId);
            concluidas = solRepo.countByStatusAndOrgaoId("CONCLUIDA", orgaoId);
            tempoMedio = solRepo.tempoMedioResolucaoDiasByOrgaoId(orgaoId);
            regioes = solRepo.dadosTerritoriaisByOrgaoId(orgaoId).stream()
                .map(row -> extrairRegiao((String) row[0], (String) row[1]))
                .filter(r -> !"Não informada".equals(r))
                .distinct().count();
            gestoresCount = gestorRepo.findAllGestoresAtivosByOrgaoId(orgaoId).size();
            equipesCount = equipeRepo.findByAtivoTrueAndOrgaoId(orgaoId).size();
        } else {
            total = solRepo.count();
            concluidas = solRepo.countByStatus("CONCLUIDA");
            tempoMedio = solRepo.tempoMedioResolucaoDias();
            regioes = solRepo.dadosTerritoriais().stream()
                .map(row -> extrairRegiao((String) row[0], (String) row[1]))
                .filter(r -> !"Não informada".equals(r))
                .distinct().count();
            gestoresCount = usuarioRepo.countByPerfil("GESTOR");
            equipesCount = equipeRepo.count();
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalSolicitacoes", total);
        result.put("concluidas", concluidas);
        result.put("taxaConclusao", total > 0 ? Math.round(concluidas * 1000.0 / total) / 10.0 : 0);
        result.put("tempoMedioResolucaoDias", tempoMedio != null ? Math.round(tempoMedio * 10.0) / 10.0 : null);
        result.put("urgentesAbertas", "GESTOR".equals(usuario.getPerfil())
            ? (getEquipeId(usuario) == null ? 0L : solRepo.countUrgentesByEquipeIdAndPeriod(getEquipeId(usuario), inicioData, fimData))
            : (isAdminLocal(usuario) ? solRepo.countUrgentesByOrgaoId(usuario.getOrgao().getId()) : solRepo.countUrgentes()));
        result.put("cidadaosCadastrados", "GESTOR".equals(usuario.getPerfil())
            ? (getEquipeId(usuario) == null ? 0L : solRepo.countUsuariosByEquipeIdAndPeriod(getEquipeId(usuario), inicioData, fimData))
            : usuarioRepo.countByPerfil("CITIZEN"));
        result.put("gestoresAtivos", gestoresCount);
        result.put("equipesOperacionais", equipesCount);
        result.put("orgaosIntegrados", "GESTOR".equals(usuario.getPerfil()) || isAdminLocal(usuario) ? 1L : orgaoRepo.count());
        result.put("regioesAtendidas", regioes);
        auditoriaService.registrar("CONSULTA_INDICADORES_NACIONAIS",
            "Indicadores consultados por " + usuario.getNome(),
            usuario.getCpf(), usuario, true, request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Tabela Serviço x Prioridade x Equipe — base de conhecimento real
     * usada pela IA para sugerir a equipe mais adequada a cada demanda.
     */
    @GetMapping("/matriz-ia")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> matrizIA(@AuthenticationPrincipal Usuario usuario, HttpServletRequest request) {
        List<Map<String, Object>> result = new ArrayList<>();
        List<Object[]> rows;
        if ("GESTOR".equals(usuario.getPerfil())) {
            Long equipeId = getEquipeId(usuario);
            rows = equipeId == null ? List.of() : solRepo.matrizServicoPrioridadeEquipeByEquipeId(equipeId);
        } else if (isAdminLocal(usuario)) {
            rows = solRepo.matrizServicoPrioridadeEquipeByOrgaoId(usuario.getOrgao().getId());
        } else {
            rows = solRepo.matrizServicoPrioridadeEquipe();
        }
        for (Object[] row : rows) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("servico", row[0]);
            item.put("prioridade", row[1]);
            item.put("equipe", row[2]);
            item.put("atendimentos", ((Number) row[3]).longValue());
            result.add(item);
        }
        auditoriaService.registrar("CONSULTA_MATRIZ_IA",
            "Matriz IA consultada por " + usuario.getNome(),
            usuario.getCpf(), usuario, true, request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Inteligência territorial: agrega solicitações por região (bairro/localidade
     * extraída do endereço), com abertas, concluídas e urgentes por região.
     */
    @GetMapping("/territorial")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> territorial(
            @AuthenticationPrincipal Usuario usuario,
            @RequestParam(required = false) String inicio,
            @RequestParam(required = false) String fim,
            HttpServletRequest request) {
        Map<String, long[]> porRegiao = new LinkedHashMap<>();
        List<Object[]> rows;
        boolean hasPeriod = (inicio != null && !inicio.isBlank()) || (fim != null && !fim.isBlank());
        LocalDateTime inicioData = null;
        LocalDateTime fimData = null;
        if (hasPeriod) {
            LocalDate dateEnd = fim == null || fim.isBlank() ? LocalDate.now() : LocalDate.parse(fim);
            LocalDate dateStart = inicio == null || inicio.isBlank() ? dateEnd : LocalDate.parse(inicio);
            if (dateStart.isAfter(dateEnd)) {
                LocalDate swap = dateStart;
                dateStart = dateEnd;
                dateEnd = swap;
            }
            inicioData = dateStart.atStartOfDay();
            fimData = dateEnd.plusDays(1).atStartOfDay();
        }

        if (isAdminLocal(usuario)) {
            Long orgaoId = usuario.getOrgao().getId();
            rows = hasPeriod
                    ? solRepo.dadosTerritoriaisByOrgaoIdOrUnassignedAndPeriod(orgaoId, inicioData, fimData)
                    : solRepo.dadosTerritoriaisByOrgaoIdOrUnassigned(orgaoId);
        } else if ("GESTOR".equals(usuario.getPerfil())) {
            Long equipeId = getEquipeId(usuario);
            rows = equipeId == null ? List.of()
                    : (hasPeriod
                        ? solRepo.dadosTerritoriaisByEquipeIdAndPeriod(equipeId, inicioData, fimData)
                        : solRepo.dadosTerritoriaisByEquipeId(equipeId));
        } else {
            rows = hasPeriod
                    ? solRepo.dadosTerritoriaisByPeriod(inicioData, fimData)
                    : solRepo.dadosTerritoriais();
        }
        for (Object[] row : rows) {
            String regiao = extrairRegiao((String) row[0], (String) row[1]);
            String status = (String) row[2];
            String prioridade = (String) row[3];
            long[] contadores = porRegiao.computeIfAbsent(regiao, k -> new long[4]);
            contadores[0]++;
            if ("CONCLUIDA".equals(status)) contadores[1]++;
            else if (!"CANCELADA".equals(status)) contadores[2]++;
            if (("ALTA".equals(prioridade) || "URGENTE".equals(prioridade))
                    && !"CONCLUIDA".equals(status) && !"CANCELADA".equals(status)) contadores[3]++;
        }
        List<Map<String, Object>> result = new ArrayList<>();
        porRegiao.entrySet().stream()
            .sorted((a, b) -> Long.compare(b.getValue()[0], a.getValue()[0]))
            .forEach(entry -> {
                long[] c = entry.getValue();
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("regiao", entry.getKey());
                item.put("total", c[0]);
                item.put("concluidas", c[1]);
                item.put("abertas", c[2]);
                item.put("urgentes", c[3]);
                item.put("criticidade", c[0] > 0 ? Math.round(c[3] * 100.0 / c[0]) : 0);
                result.add(item);
            });
        auditoriaService.registrar("CONSULTA_RELATORIO_TERRITORIAL",
            "Relatorio territorial consultado por " + usuario.getNome(),
            usuario.getCpf(), usuario, true, request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** Extrai a região (bairro/localidade) do endereço livre; sem endereço, classifica o GPS em zonas. */
    private String extrairRegiao(String endereco, String gps) {
        if (endereco != null && !endereco.isBlank()) {
            String[] porHifen = endereco.split(" - ");
            if (porHifen.length > 1) {
                String candidato = porHifen[1].split(",")[0].trim();
                if (!candidato.isBlank() && !ehNumero(candidato)) return candidato;
            }
            // Ignora números de rua/CEP: pega o bairro (2ª parte textual após a rua)
            List<String> partes = new ArrayList<>();
            for (String parte : endereco.split(",")) {
                String p = parte.trim();
                if (!p.isBlank() && !ehNumero(p)) partes.add(p);
            }
            if (partes.size() > 1) return partes.get(1);
            if (partes.size() == 1) return partes.get(0);
        }
        return regiaoPorGps(gps);
    }

    /** Verifica se o trecho é numérico (número de rua, CEP etc.), não um nome de bairro. */
    private boolean ehNumero(String texto) {
        return texto.matches("\\d[\\d\\s./-]*[A-Za-z]?");
    }

    /** Classifica coordenadas GPS em zonas geográficas relativas ao centro de São Paulo. */
    private String regiaoPorGps(String gps) {
        if (gps == null || gps.isBlank()) return "Não informada";
        try {
            String[] partes = gps.replaceAll("[^0-9.,\\-]", "").split(",");
            if (partes.length < 2) return "Não informada";
            double lat = Double.parseDouble(partes[0].trim());
            double lng = Double.parseDouble(partes[1].trim());
            double dLat = lat - (-23.5505); // centro de São Paulo
            double dLng = lng - (-46.6333);
            if (Math.abs(dLat) < 0.02 && Math.abs(dLng) < 0.02) return "Centro";
            if (Math.abs(dLat) >= Math.abs(dLng)) return dLat > 0 ? "Zona Norte" : "Zona Sul";
            return dLng > 0 ? "Zona Leste" : "Zona Oeste";
        } catch (NumberFormatException e) {
            return "Não informada";
        }
    }

    private Long getEquipeId(Usuario usuario) {
        return gestorRepo.findByUsuarioId(usuario.getId())
                .map(g -> g.getEquipe().getId())
                .orElse(null);
    }

    private boolean isAdminLocal(Usuario usuario) {
        return usuario != null && ("ADMIN".equals(usuario.getPerfil()) || "ANALYTICS_ADMIN".equals(usuario.getPerfil())) && usuario.getOrgao() != null;
    }
}

