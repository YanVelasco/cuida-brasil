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

        @GetMapping("/resumo")
        public ResponseEntity<ApiResponse<Map<String, Long>>> resumo(
            @AuthenticationPrincipal Usuario usuario,
            @RequestParam String inicio, @RequestParam String fim,
            @RequestParam(required = false) String gestor,
            HttpServletRequest request) {
        LocalDateTime inicioData = LocalDate.parse(inicio).atStartOfDay();
        LocalDateTime fimData = LocalDate.parse(fim).plusDays(1).atStartOfDay();
        String filtroGestor = "GESTOR".equals(usuario.getPerfil()) ? usuario.getNome() : gestor;
        Map<String, Long> result = new LinkedHashMap<>();

        if (isAdminLocal(usuario)) {
            Long orgaoId = usuario.getOrgao().getId();
            result.put("total", solRepo.countByOrgaoIdAndPeriod(orgaoId, inicioData, fimData, filtroGestor));
            result.put("concluidas", solRepo.countByStatusAndOrgaoIdAndPeriod("CONCLUIDA", orgaoId, inicioData, fimData, filtroGestor));
            result.put("emAndamento", solRepo.countByStatusAndOrgaoIdAndPeriod("EM_ANDAMENTO", orgaoId, inicioData, fimData, filtroGestor)
                + solRepo.countByStatusAndOrgaoIdAndPeriod("EM_CAMPO", orgaoId, inicioData, fimData, filtroGestor));
            result.put("abertas", solRepo.countByStatusAndOrgaoIdAndPeriod("PENDENTE", orgaoId, inicioData, fimData, filtroGestor)
                + solRepo.countByStatusAndOrgaoIdAndPeriod("TRIAGEM", orgaoId, inicioData, fimData, filtroGestor));
            result.put("urgentes", solRepo.countUrgentesByOrgaoIdAndPeriod(orgaoId, inicioData, fimData, filtroGestor));
        } else {
            result.put("total", solRepo.countByPeriod(inicioData, fimData, filtroGestor));
            result.put("concluidas", solRepo.countByStatusAndPeriod("CONCLUIDA", inicioData, fimData, filtroGestor));
            result.put("emAndamento", solRepo.countByStatusAndPeriod("EM_ANDAMENTO", inicioData, fimData, filtroGestor)
                + solRepo.countByStatusAndPeriod("EM_CAMPO", inicioData, fimData, filtroGestor));
            result.put("abertas", solRepo.countByStatusAndPeriod("PENDENTE", inicioData, fimData, filtroGestor)
                + solRepo.countByStatusAndPeriod("TRIAGEM", inicioData, fimData, filtroGestor));
            result.put("urgentes", solRepo.countUrgentesByPeriod(inicioData, fimData, filtroGestor));
        }

        auditoriaService.registrar("CONSULTA_RELATORIO_RESUMO",
            "Resumo solicitado por " + usuario.getNome() + " no periodo " + inicio + " a " + fim + (gestor != null ? " para gestor " + gestor : ""),
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
                ? solRepo.countByCategoriaAndOrgaoIdPeriod(orgaoId, inicioData, fimData, filtroGestor)
                : solRepo.countByCategoriaAndOrgaoId(orgaoId);
        } else if (inicio != null && fim != null) {
            LocalDateTime inicioData = LocalDate.parse(inicio).atStartOfDay();
            LocalDateTime fimData = LocalDate.parse(fim).plusDays(1).atStartOfDay();
            String filtroGestor = "GESTOR".equals(usuario.getPerfil()) ? usuario.getNome() : gestor;
            raw = solRepo.countByCategoriaPeriod(inicioData, fimData, filtroGestor);
        } else if ("GESTOR".equals(usuario.getPerfil())) {
            Long equipeId = getEquipeId(usuario);
            raw = equipeId != null ? solRepo.countByCategoriaAndEquipeId(equipeId) : List.of();
        } else {
            raw = solRepo.countByCategoria();
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
     * Retorna a tendência mensal dos últimos 6 meses (global — apenas ADMIN).
     */
    @GetMapping("/tendencia-mensal")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYTICS_ADMIN')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> tendenciaMensal(
            @RequestParam(required = false) String inicio, @RequestParam(required = false) String fim,
            @RequestParam(required = false) String gestor,
            @AuthenticationPrincipal Usuario usuario,
            HttpServletRequest request) {
        LocalDateTime fimData = fim != null ? LocalDate.parse(fim).plusDays(1).atStartOfDay() : LocalDateTime.now().plusDays(1);
        LocalDateTime inicioData = inicio != null ? LocalDate.parse(inicio).atStartOfDay() : fimData.minusMonths(6);
        List<Object[]> raw;
        if (isAdminLocal(usuario)) {
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
    public ResponseEntity<ApiResponse<Map<String, Object>>> indicadores(@AuthenticationPrincipal Usuario usuario, HttpServletRequest request) {
        long total;
        long concluidas;
        Double tempoMedio;
        long regioes;
        long gestoresCount;
        long equipesCount;

        if (isAdminLocal(usuario)) {
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
        result.put("urgentesAbertas", isAdminLocal(usuario) ? solRepo.countUrgentesByOrgaoId(usuario.getOrgao().getId()) : solRepo.countUrgentes());
        result.put("cidadaosCadastrados", usuarioRepo.countByPerfil("CITIZEN"));
        result.put("gestoresAtivos", gestoresCount);
        result.put("equipesOperacionais", equipesCount);
        result.put("orgaosIntegrados", isAdminLocal(usuario) ? 1L : orgaoRepo.count());
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
        List<Object[]> rows = isAdminLocal(usuario)
            ? solRepo.matrizServicoPrioridadeEquipeByOrgaoId(usuario.getOrgao().getId())
            : solRepo.matrizServicoPrioridadeEquipe();
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
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> territorial(@AuthenticationPrincipal Usuario usuario, HttpServletRequest request) {
        Map<String, long[]> porRegiao = new LinkedHashMap<>();
        List<Object[]> rows = isAdminLocal(usuario)
            ? solRepo.dadosTerritoriaisByOrgaoId(usuario.getOrgao().getId())
            : solRepo.dadosTerritoriais();
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
        return usuario != null && "ADMIN".equals(usuario.getPerfil()) && usuario.getOrgao() != null;
    }
}

