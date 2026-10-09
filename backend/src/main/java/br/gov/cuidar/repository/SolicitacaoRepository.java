package br.gov.cuidar.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import br.gov.cuidar.entity.Solicitacao;

public interface SolicitacaoRepository extends JpaRepository<Solicitacao, Long> {

    Page<Solicitacao> findByUsuarioId(Long usuarioId, Pageable pageable);
    List<Solicitacao> findByUsuarioIdOrderByDataCriacaoDesc(Long usuarioId);
    List<Solicitacao> findByEquipeIdOrderByDataCriacaoDesc(Long equipeId);
    @Query("SELECT s FROM Solicitacao s WHERE s.equipe.orgao.id = :orgaoId ORDER BY s.dataCriacao DESC")
    List<Solicitacao> findByOrgaoIdOrderByDataCriacaoDesc(@Param("orgaoId") Long orgaoId);
    Page<Solicitacao> findByStatus(String status, Pageable pageable);
    @Query("SELECT s FROM Solicitacao s WHERE s.equipe.orgao.id = :orgaoId")
    Page<Solicitacao> findByOrgaoId(@Param("orgaoId") Long orgaoId, Pageable pageable);
    @Query("SELECT s FROM Solicitacao s WHERE s.equipe.orgao.id = :orgaoId AND s.status = :status")
    Page<Solicitacao> findByOrgaoIdAndStatus(@Param("orgaoId") Long orgaoId, @Param("status") String status, Pageable pageable);
    @Query("SELECT s FROM Solicitacao s WHERE s.equipe.orgao.id = :orgaoId AND s.protocolo LIKE CONCAT('%', :protocolo, '%')")
    Page<Solicitacao> findByOrgaoIdAndProtocolo(@Param("orgaoId") Long orgaoId, @Param("protocolo") String protocolo, Pageable pageable);
    @Query("SELECT s FROM Solicitacao s WHERE s.equipe.orgao.id = :orgaoId AND s.protocolo LIKE CONCAT('%', :protocolo, '%') AND s.status = :status")
    Page<Solicitacao> findByOrgaoIdAndProtocoloAndStatus(@Param("orgaoId") Long orgaoId, @Param("protocolo") String protocolo, @Param("status") String status, Pageable pageable);
    Page<Solicitacao> findByProtocoloContainingIgnoreCase(String protocolo, Pageable pageable);
    Page<Solicitacao> findByProtocoloContainingIgnoreCaseAndStatus(String protocolo, String status, Pageable pageable);
    Page<Solicitacao> findByEquipeId(Long equipeId, Pageable pageable);
    Page<Solicitacao> findByStatusAndEquipeId(String status, Long equipeId, Pageable pageable);
    List<Solicitacao> findByEquipeId(Long equipeId);
    @Query("SELECT s FROM Solicitacao s WHERE s.equipe IS NOT NULL AND s.equipe.orgao.id = :orgaoId ORDER BY s.dataCriacao DESC")
    List<Solicitacao> findComEquipeByOrgaoId(@Param("orgaoId") Long orgaoId);
    @Query("SELECT s FROM Solicitacao s WHERE s.protocolo LIKE CONCAT('%', :protocolo, '%') AND (s.equipe.id = :equipeId OR s.equipe IS NULL)")
    Page<Solicitacao> findByProtocoloAndEquipeIdOrNullAndUnassigned(@Param("protocolo") String protocolo, @Param("equipeId") Long equipeId, Pageable pageable);
    @Query("SELECT s FROM Solicitacao s WHERE s.protocolo LIKE CONCAT('%', :protocolo, '%') AND s.status = :status AND (s.equipe.id = :equipeId OR s.equipe IS NULL)")
    Page<Solicitacao> findByProtocoloAndStatusAndEquipeIdOrNullAndUnassigned(@Param("protocolo") String protocolo, @Param("status") String status, @Param("equipeId") Long equipeId, Pageable pageable);
    @Query("SELECT s FROM Solicitacao s WHERE s.status = :status AND (s.equipe.id = :equipeId OR s.equipe IS NULL)")
    Page<Solicitacao> findByStatusAndEquipeIdOrNullAndUnassigned(@Param("status") String status, @Param("equipeId") Long equipeId, Pageable pageable);
    @Query("SELECT s FROM Solicitacao s WHERE s.equipe.id = :equipeId OR s.equipe IS NULL")
    Page<Solicitacao> findByEquipeIdOrNullAndUnassigned(@Param("equipeId") Long equipeId, Pageable pageable);
    java.util.Optional<Solicitacao> findByProtocolo(String protocolo);

    // Gestor: busca por nome do gestor (através da equipe)
    @Query("SELECT s FROM Solicitacao s JOIN Gestor g ON g.equipe.id = s.equipe.id WHERE LOWER(g.usuario.nome) = LOWER(:nome)")
    Page<Solicitacao> findByGestorNome(@Param("nome") String nome, Pageable pageable);
    @Query("SELECT s FROM Solicitacao s JOIN Gestor g ON g.equipe.id = s.equipe.id WHERE LOWER(g.usuario.nome) = LOWER(:nome) AND s.status = :status")
    Page<Solicitacao> findByStatusAndGestorNome(@Param("status") String status, @Param("nome") String nome, Pageable pageable);
    @Query("SELECT s FROM Solicitacao s JOIN Gestor g ON g.equipe.id = s.equipe.id WHERE LOWER(g.usuario.nome) = LOWER(:nome) AND s.protocolo LIKE CONCAT('%', :protocolo, '%')")
    Page<Solicitacao> findByProtocoloAndGestorNome(@Param("protocolo") String protocolo, @Param("nome") String nome, Pageable pageable);
    @Query("SELECT s FROM Solicitacao s JOIN Gestor g ON g.equipe.id = s.equipe.id WHERE LOWER(g.usuario.nome) = LOWER(:nome) AND s.protocolo LIKE CONCAT('%', :protocolo, '%') AND s.status = :status")
    Page<Solicitacao> findByProtocoloAndStatusAndGestorNome(@Param("protocolo") String protocolo, @Param("status") String status, @Param("nome") String nome, Pageable pageable);

    // Solicitacoes nao atribuidas a nenhuma equipe (equipe IS NULL)
    @Query("SELECT s FROM Solicitacao s WHERE s.equipe IS NULL ORDER BY s.dataCriacao DESC")
    List<Solicitacao> findNaoAtribuidas();

    // Solicitacoes que tem equipe atribuida (para o dropdown de cidadaos por gestor)
    @Query("SELECT s FROM Solicitacao s WHERE s.equipe IS NOT NULL ORDER BY s.dataCriacao DESC")
    List<Solicitacao> findComEquipe();

    @Query("SELECT s FROM Solicitacao s WHERE s.equipe.id = :equipeId ORDER BY s.dataCriacao DESC")
    List<Solicitacao> findComEquipeByEquipeId(@Param("equipeId") Long equipeId);

    // Contadores para o Dashboard
    long countByStatus(String status);
    long countByStatusAndEquipeId(String status, Long equipeId);
    long countByStatusAndEquipeNull(String status);
    @Query("SELECT COUNT(s) FROM Solicitacao s WHERE s.status = :status AND s.equipe.orgao.id = :orgaoId")
    long countByStatusAndOrgaoId(@Param("status") String status, @Param("orgaoId") Long orgaoId);

    @Query("SELECT COUNT(s) FROM Solicitacao s WHERE (s.prioridade = 'ALTA' OR s.prioridade = 'URGENTE') AND s.status NOT IN ('CONCLUIDA', 'CANCELADA') AND s.equipe.orgao.id = :orgaoId")
    long countUrgentesByOrgaoId(@Param("orgaoId") Long orgaoId);

    @Query("SELECT COUNT(s) FROM Solicitacao s WHERE (s.prioridade = 'ALTA' OR s.prioridade = 'URGENTE') AND s.status NOT IN ('CONCLUIDA', 'CANCELADA') AND s.equipe.id = :equipeId")
    long countUrgentesByEquipeId(@Param("equipeId") Long equipeId);

    @Query("SELECT COUNT(s) FROM Solicitacao s WHERE (s.prioridade = 'ALTA' OR s.prioridade = 'URGENTE') AND s.status NOT IN ('CONCLUIDA', 'CANCELADA') AND s.equipe IS NULL")
    long countUrgentesByEquipeNull();

    @Query("SELECT COUNT(s) FROM Solicitacao s WHERE (s.prioridade = 'ALTA' OR s.prioridade = 'URGENTE') AND s.status NOT IN ('CONCLUIDA', 'CANCELADA')")
    long countUrgentes();

    @Query("SELECT s.servico.categoria, COUNT(s) FROM Solicitacao s GROUP BY s.servico.categoria ORDER BY COUNT(s) DESC")
    List<Object[]> countByCategoria();

    @Query("SELECT s.servico.categoria, COUNT(s) FROM Solicitacao s WHERE s.equipe.id = :equipeId GROUP BY s.servico.categoria ORDER BY COUNT(s) DESC")
    List<Object[]> countByCategoriaAndEquipeId(@Param("equipeId") Long equipeId);

    @Query("SELECT s.servico.categoria, COUNT(s) FROM Solicitacao s WHERE s.equipe.orgao.id = :orgaoId GROUP BY s.servico.categoria ORDER BY COUNT(s) DESC")
    List<Object[]> countByCategoriaAndOrgaoId(@Param("orgaoId") Long orgaoId);

    // Relatórios: agrupamento por status
    @Query("SELECT s.status, COUNT(s) FROM Solicitacao s GROUP BY s.status")
    List<Object[]> countByStatusGrouped();

    @Query("SELECT s.status, COUNT(s) FROM Solicitacao s WHERE s.equipe.id = :equipeId GROUP BY s.status")
    List<Object[]> countByStatusGroupedAndEquipeId(@Param("equipeId") Long equipeId);

    @Query("SELECT s.status, COUNT(s) FROM Solicitacao s WHERE s.equipe.orgao.id = :orgaoId GROUP BY s.status")
    List<Object[]> countByStatusGroupedAndOrgaoId(@Param("orgaoId") Long orgaoId);

    @Query("SELECT COUNT(s) FROM Solicitacao s WHERE s.dataCriacao >= :inicio AND s.dataCriacao < :fim AND (:gestor IS NULL OR EXISTS (SELECT g.id FROM Gestor g WHERE g.equipe.id = s.equipe.id AND LOWER(g.usuario.nome) = LOWER(:gestor)))")
    long countByPeriod(@Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim, @Param("gestor") String gestor);

    @Query("SELECT COUNT(s) FROM Solicitacao s WHERE s.equipe.orgao.id = :orgaoId AND s.dataCriacao >= :inicio AND s.dataCriacao < :fim AND (:gestor IS NULL OR EXISTS (SELECT g.id FROM Gestor g WHERE g.equipe.id = s.equipe.id AND LOWER(g.usuario.nome) = LOWER(:gestor)))")
    long countByOrgaoIdAndPeriod(@Param("orgaoId") Long orgaoId, @Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim, @Param("gestor") String gestor);

    @Query("SELECT COUNT(s) FROM Solicitacao s WHERE s.status = :status AND s.dataCriacao >= :inicio AND s.dataCriacao < :fim AND (:gestor IS NULL OR EXISTS (SELECT g.id FROM Gestor g WHERE g.equipe.id = s.equipe.id AND LOWER(g.usuario.nome) = LOWER(:gestor)))")
    long countByStatusAndPeriod(@Param("status") String status, @Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim, @Param("gestor") String gestor);

    @Query("SELECT COUNT(s) FROM Solicitacao s WHERE s.status = :status AND s.equipe.orgao.id = :orgaoId AND s.dataCriacao >= :inicio AND s.dataCriacao < :fim AND (:gestor IS NULL OR EXISTS (SELECT g.id FROM Gestor g WHERE g.equipe.id = s.equipe.id AND LOWER(g.usuario.nome) = LOWER(:gestor)))")
    long countByStatusAndOrgaoIdAndPeriod(@Param("status") String status, @Param("orgaoId") Long orgaoId, @Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim, @Param("gestor") String gestor);

    @Query("SELECT COUNT(s) FROM Solicitacao s WHERE (s.prioridade = 'ALTA' OR s.prioridade = 'URGENTE') AND s.status IN ('PENDENTE', 'TRIAGEM') AND s.dataCriacao >= :inicio AND s.dataCriacao < :fim AND (:gestor IS NULL OR EXISTS (SELECT g.id FROM Gestor g WHERE g.equipe.id = s.equipe.id AND LOWER(g.usuario.nome) = LOWER(:gestor)))")
    long countUrgentesByPeriod(@Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim, @Param("gestor") String gestor);

    @Query("SELECT COUNT(s) FROM Solicitacao s WHERE s.equipe.orgao.id = :orgaoId AND (s.prioridade = 'ALTA' OR s.prioridade = 'URGENTE') AND s.status IN ('PENDENTE', 'TRIAGEM') AND s.dataCriacao >= :inicio AND s.dataCriacao < :fim AND (:gestor IS NULL OR EXISTS (SELECT g.id FROM Gestor g WHERE g.equipe.id = s.equipe.id AND LOWER(g.usuario.nome) = LOWER(:gestor)))")
    long countUrgentesByOrgaoIdAndPeriod(@Param("orgaoId") Long orgaoId, @Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim, @Param("gestor") String gestor);

    @Query("SELECT s.servico.categoria, COUNT(s) FROM Solicitacao s WHERE s.dataCriacao >= :inicio AND s.dataCriacao < :fim AND (:gestor IS NULL OR EXISTS (SELECT g.id FROM Gestor g WHERE g.equipe.id = s.equipe.id AND LOWER(g.usuario.nome) = LOWER(:gestor))) GROUP BY s.servico.categoria ORDER BY COUNT(s) DESC")
    List<Object[]> countByCategoriaPeriod(@Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim, @Param("gestor") String gestor);

    @Query("SELECT s.servico.categoria, COUNT(s) FROM Solicitacao s WHERE s.equipe.orgao.id = :orgaoId AND s.dataCriacao >= :inicio AND s.dataCriacao < :fim AND (:gestor IS NULL OR EXISTS (SELECT g.id FROM Gestor g WHERE g.equipe.id = s.equipe.id AND LOWER(g.usuario.nome) = LOWER(:gestor))) GROUP BY s.servico.categoria ORDER BY COUNT(s) DESC")
    List<Object[]> countByCategoriaAndOrgaoIdPeriod(@Param("orgaoId") Long orgaoId, @Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim, @Param("gestor") String gestor);

    @Query("SELECT s.status, COUNT(s) FROM Solicitacao s WHERE s.dataCriacao >= :inicio AND s.dataCriacao < :fim AND (:gestor IS NULL OR EXISTS (SELECT g.id FROM Gestor g WHERE g.equipe.id = s.equipe.id AND LOWER(g.usuario.nome) = LOWER(:gestor))) GROUP BY s.status")
    List<Object[]> countByStatusGroupedPeriod(@Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim, @Param("gestor") String gestor);

    @Query("SELECT s.status, COUNT(s) FROM Solicitacao s WHERE s.equipe.orgao.id = :orgaoId AND s.dataCriacao >= :inicio AND s.dataCriacao < :fim AND (:gestor IS NULL OR EXISTS (SELECT g.id FROM Gestor g WHERE g.equipe.id = s.equipe.id AND LOWER(g.usuario.nome) = LOWER(:gestor))) GROUP BY s.status")
    List<Object[]> countByStatusGroupedAndOrgaoIdPeriod(@Param("orgaoId") Long orgaoId, @Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim, @Param("gestor") String gestor);

    // Relatórios: tendência mensal (últimos 6 meses)
    @Query(value = "SELECT MONTH(data_criacao) as mes, YEAR(data_criacao) as ano, COUNT(*) as total FROM TB_SOLICITACAO WHERE data_criacao >= DATEADD(month, -6, GETDATE()) GROUP BY YEAR(data_criacao), MONTH(data_criacao) ORDER BY ano, mes", nativeQuery = true)
    List<Object[]> tendenciaMensal();

    @Query(value = "SELECT MONTH(s.data_criacao) as mes, YEAR(s.data_criacao) as ano, COUNT(DISTINCT s.id) as total FROM TB_SOLICITACAO s LEFT JOIN TB_EQUIPE_PUBLICA e ON e.id = s.id_equipe LEFT JOIN TB_GESTOR g ON g.id_equipe = e.id LEFT JOIN TB_USUARIO u ON u.id = g.id_usuario WHERE s.data_criacao >= :inicio AND s.data_criacao < :fim AND (:gestor IS NULL OR LOWER(u.nome) = LOWER(:gestor)) GROUP BY YEAR(s.data_criacao), MONTH(s.data_criacao) ORDER BY ano, mes", nativeQuery = true)
    List<Object[]> tendenciaMensalPeriod(@Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim, @Param("gestor") String gestor);

    @Query(value = "SELECT MONTH(s.data_criacao) as mes, YEAR(s.data_criacao) as ano, COUNT(DISTINCT s.id) as total FROM TB_SOLICITACAO s INNER JOIN TB_EQUIPE_PUBLICA e ON e.id = s.id_equipe LEFT JOIN TB_GESTOR g ON g.id_equipe = e.id LEFT JOIN TB_USUARIO u ON u.id = g.id_usuario WHERE e.id_orgao = :orgaoId AND s.data_criacao >= :inicio AND s.data_criacao < :fim AND (:gestor IS NULL OR LOWER(u.nome) = LOWER(:gestor)) GROUP BY YEAR(s.data_criacao), MONTH(s.data_criacao) ORDER BY ano, mes", nativeQuery = true)
    List<Object[]> tendenciaMensalPeriodAndOrgaoId(@Param("orgaoId") Long orgaoId, @Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim, @Param("gestor") String gestor);

    // Indicadores reais: tempo médio de resolução em dias
    @Query(value = "SELECT AVG(CAST(DATEDIFF(day, data_criacao, data_conclusao) AS FLOAT)) FROM TB_SOLICITACAO WHERE status = 'CONCLUIDA' AND data_conclusao IS NOT NULL", nativeQuery = true)
    Double tempoMedioResolucaoDias();

    @Query(value = "SELECT AVG(CAST(DATEDIFF(day, s.data_criacao, s.data_conclusao) AS FLOAT)) FROM TB_SOLICITACAO s INNER JOIN TB_EQUIPE_PUBLICA e ON e.id = s.id_equipe WHERE e.id_orgao = :orgaoId AND s.status = 'CONCLUIDA' AND s.data_conclusao IS NOT NULL", nativeQuery = true)
    Double tempoMedioResolucaoDiasByOrgaoId(@Param("orgaoId") Long orgaoId);

    // Indicadores reais: taxa de conclusão (%)
    @Query("SELECT COUNT(s) FROM Solicitacao s WHERE s.status = 'CONCLUIDA'")
    long countConcluidas();

    @Query("SELECT COUNT(s) FROM Solicitacao s WHERE s.equipe.orgao.id = :orgaoId AND s.status = 'CONCLUIDA'")
    long countConcluidasByOrgaoId(@Param("orgaoId") Long orgaoId);

    @Query("SELECT COUNT(s) FROM Solicitacao s")
    long countTotal();

    @Query("SELECT COUNT(s) FROM Solicitacao s WHERE s.equipe.orgao.id = :orgaoId")
    long countTotalByOrgaoId(@Param("orgaoId") Long orgaoId);

    // Matriz de IA: agrupamento por serviço, prioridade e equipe para score de criticidade
    @Query("SELECT s.servico.categoria, s.prioridade, COUNT(s), s.equipe.nome FROM Solicitacao s WHERE s.equipe IS NOT NULL GROUP BY s.servico.categoria, s.prioridade, s.equipe.nome")
    List<Object[]> matrizServicoPrioridadeEquipe();

    @Query("SELECT s.servico.categoria, s.prioridade, COUNT(s), s.equipe.nome FROM Solicitacao s WHERE s.equipe IS NOT NULL AND s.equipe.orgao.id = :orgaoId GROUP BY s.servico.categoria, s.prioridade, s.equipe.nome")
    List<Object[]> matrizServicoPrioridadeEquipeByOrgaoId(@Param("orgaoId") Long orgaoId);

    // Eficiência de campo: solicitações concluídas por usuário/gestor
    @Query("SELECT s.usuario.id, COUNT(s) FROM Solicitacao s GROUP BY s.usuario.id")
    List<Object[]> countPorUsuario();

    @Query("SELECT s.usuario.id, COUNT(s) FROM Solicitacao s WHERE s.equipe.id = :equipeId GROUP BY s.usuario.id")
    List<Object[]> countPorUsuarioAndEquipe(@Param("equipeId") Long equipeId);

    @Query("SELECT s.usuario.id, COUNT(s) FROM Solicitacao s WHERE s.equipe.orgao.id = :orgaoId GROUP BY s.usuario.id")
    List<Object[]> countPorUsuarioAndOrgao(@Param("orgaoId") Long orgaoId);

    @Query("SELECT DISTINCT s.usuario FROM Solicitacao s WHERE s.equipe.id = :equipeId ORDER BY s.usuario.nome")
    List<br.gov.cuidar.entity.Usuario> findUsuariosByEquipeId(@Param("equipeId") Long equipeId);

    @Query("SELECT DISTINCT s.usuario FROM Solicitacao s WHERE s.equipe.orgao.id = :orgaoId ORDER BY s.usuario.nome")
    List<br.gov.cuidar.entity.Usuario> findUsuariosByOrgaoId(@Param("orgaoId") Long orgaoId);

    @Query("SELECT COUNT(s) FROM Solicitacao s WHERE s.equipe.orgao.id = :orgaoId")
    long countByOrgaoId(@Param("orgaoId") Long orgaoId);

    // Inteligência territorial: dados brutos para agregação por região
    @Query("SELECT s.endereco, s.gps, s.status, s.prioridade FROM Solicitacao s")
    List<Object[]> dadosTerritoriais();

    @Query("SELECT s.endereco, s.gps, s.status, s.prioridade FROM Solicitacao s WHERE s.equipe.orgao.id = :orgaoId")
    List<Object[]> dadosTerritoriaisByOrgaoId(@Param("orgaoId") Long orgaoId);

    // =========================================================================
    // CONSULTAS SQL AVANÇADAS: DASHBOARDS ANALÍTICOS (Fase 6 / Inteligência)
    // Suportam escopo de Gestor (:equipeId) e Administrador do Órgão (:orgaoId)
    // =========================================================================

    /**
     * 1. Eficiência e Ranking das Equipes com DENSE_RANK() e agregação analítica
     */
    @Query(value = """
        SELECT 
            e.id AS equipe_id,
            e.nome AS equipe_nome,
            o.sigla AS orgao_sigla,
            COUNT(s.id) AS total_demandas,
            SUM(CASE WHEN s.status = 'CONCLUIDA' THEN 1 ELSE 0 END) AS concluidas,
            SUM(CASE WHEN s.status IN ('PENDENTE','TRIAGEM','EM_ANDAMENTO','EM_CAMPO') THEN 1 ELSE 0 END) AS em_aberto,
            ROUND(ISNULL(AVG(CASE WHEN s.status = 'CONCLUIDA' AND s.data_conclusao IS NOT NULL 
                     THEN CAST(DATEDIFF(day, s.data_criacao, CAST(s.data_conclusao AS DATETIME2)) AS FLOAT) 
                     ELSE NULL END), 0), 1) AS tempo_medio_dias,
            ROUND(CASE WHEN COUNT(s.id) > 0 THEN (CAST(SUM(CASE WHEN s.status = 'CONCLUIDA' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(s.id)) * 100 ELSE 0 END, 1) AS taxa_conclusao,
            ROUND(ISNULL(AVG(CAST((ISNULL(s.nota_qualidade, 4) + ISNULL(s.nota_atendimento, 4) + ISNULL(s.nota_prazos, 4)) / 3.0 AS FLOAT)), 0), 1) AS nota_media,
            DENSE_RANK() OVER (ORDER BY 
                (CASE WHEN COUNT(s.id) > 0 THEN (CAST(SUM(CASE WHEN s.status = 'CONCLUIDA' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(s.id)) * 100 ELSE 0 END) DESC,
                SUM(CASE WHEN s.status = 'CONCLUIDA' THEN 1 ELSE 0 END) DESC
            ) AS rank_posicao
        FROM TB_EQUIPE_PUBLICA e
        JOIN TB_ORGAO_PUBLICO o ON o.id = e.id_orgao
        LEFT JOIN TB_SOLICITACAO s ON s.id_equipe = e.id
        WHERE e.ativo = 1
          AND (:orgaoId IS NULL OR e.id_orgao = :orgaoId)
          AND (:equipeId IS NULL OR e.id = :equipeId)
        GROUP BY e.id, e.nome, o.sigla
        ORDER BY rank_posicao ASC
        """, nativeQuery = true)
    List<Object[]> queryPerformanceEquipesAvancada(@Param("orgaoId") Long orgaoId, @Param("equipeId") Long equipeId);

    /**
     * 2. Análise de Cumprimento de SLA por Categoria com CTE
     */
    @Query(value = """
        WITH DemandaSLA AS (
            SELECT 
                s.id,
                srv.categoria,
                s.status,
                CASE 
                    WHEN s.prioridade = 'URGENTE' THEN 2
                    WHEN s.prioridade = 'ALTA' THEN 5
                    WHEN s.prioridade = 'MEDIA' THEN 10
                    ELSE 15 
                END AS sla_dias_limite,
                CASE 
                    WHEN s.status = 'CONCLUIDA' AND s.data_conclusao IS NOT NULL 
                    THEN DATEDIFF(day, s.data_criacao, CAST(s.data_conclusao AS DATETIME2))
                    ELSE DATEDIFF(day, s.data_criacao, GETDATE())
                END AS dias_decorridos
            FROM TB_SOLICITACAO s
            JOIN TB_SERVICO srv ON srv.id = s.id_servico
            LEFT JOIN TB_EQUIPE_PUBLICA e ON e.id = s.id_equipe
            WHERE s.status <> 'CANCELADA'
              AND (:orgaoId IS NULL OR e.id_orgao = :orgaoId)
              AND (:equipeId IS NULL OR s.id_equipe = :equipeId)
        )
        SELECT 
            categoria,
            COUNT(*) AS total_demandas,
            SUM(CASE WHEN status = 'CONCLUIDA' THEN 1 ELSE 0 END) AS concluidas,
            SUM(CASE WHEN status = 'CONCLUIDA' AND dias_decorridos <= sla_dias_limite THEN 1 ELSE 0 END) AS dentro_prazo,
            SUM(CASE WHEN status = 'CONCLUIDA' AND dias_decorridos > sla_dias_limite THEN 1 ELSE 0 END) AS concluidas_atraso,
            SUM(CASE WHEN status <> 'CONCLUIDA' AND dias_decorridos > sla_dias_limite THEN 1 ELSE 0 END) AS ativas_estouradas,
            ROUND(AVG(CAST(dias_decorridos AS FLOAT)), 1) AS media_dias,
            ROUND(
                CASE WHEN SUM(CASE WHEN status = 'CONCLUIDA' THEN 1 ELSE 0 END) > 0 
                THEN (CAST(SUM(CASE WHEN status = 'CONCLUIDA' AND dias_decorridos <= sla_dias_limite THEN 1 ELSE 0 END) AS FLOAT) 
                      / SUM(CASE WHEN status = 'CONCLUIDA' THEN 1 ELSE 0 END)) * 100 
                ELSE 0 END, 1
            ) AS conformidade_sla_pct
        FROM DemandaSLA
        GROUP BY categoria
        ORDER BY total_demandas DESC
        """, nativeQuery = true)
    List<Object[]> queryAnaliseSlaAvancada(@Param("orgaoId") Long orgaoId, @Param("equipeId") Long equipeId);

    /**
     * 3. Satisfação do Cidadão (CSAT, Breakdown de Notas 1-5, Médias por Dimensão)
     */
    @Query(value = """
        SELECT 
            COUNT(s.id) AS total_avaliadas,
            ROUND(ISNULL(AVG(CAST(s.nota_qualidade AS FLOAT)), 0), 2) AS media_qualidade,
            ROUND(ISNULL(AVG(CAST(s.nota_prazos AS FLOAT)), 0), 2) AS media_prazos,
            ROUND(ISNULL(AVG(CAST(s.nota_atendimento AS FLOAT)), 0), 2) AS media_atendimento,
            ROUND(ISNULL(AVG((CAST(s.nota_qualidade AS FLOAT) + CAST(s.nota_prazos AS FLOAT) + CAST(s.nota_atendimento AS FLOAT)) / 3.0), 0), 2) AS media_geral,
            ROUND(
                CASE WHEN COUNT(s.id) > 0 
                THEN (CAST(SUM(CASE WHEN ((s.nota_qualidade + s.nota_prazos + s.nota_atendimento) / 3.0) >= 4.0 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(s.id)) * 100 
                ELSE 0 END, 1
            ) AS csat_pct,
            SUM(CASE WHEN ROUND((s.nota_qualidade + s.nota_prazos + s.nota_atendimento) / 3.0, 0) = 5 THEN 1 ELSE 0 END) AS nota_5,
            SUM(CASE WHEN ROUND((s.nota_qualidade + s.nota_prazos + s.nota_atendimento) / 3.0, 0) = 4 THEN 1 ELSE 0 END) AS nota_4,
            SUM(CASE WHEN ROUND((s.nota_qualidade + s.nota_prazos + s.nota_atendimento) / 3.0, 0) = 3 THEN 1 ELSE 0 END) AS nota_3,
            SUM(CASE WHEN ROUND((s.nota_qualidade + s.nota_prazos + s.nota_atendimento) / 3.0, 0) = 2 THEN 1 ELSE 0 END) AS nota_2,
            SUM(CASE WHEN ROUND((s.nota_qualidade + s.nota_prazos + s.nota_atendimento) / 3.0, 0) <= 1 THEN 1 ELSE 0 END) AS nota_1
        FROM TB_SOLICITACAO s
        LEFT JOIN TB_EQUIPE_PUBLICA e ON e.id = s.id_equipe
        WHERE (s.nota_qualidade IS NOT NULL OR s.nota_prazos IS NOT NULL OR s.nota_atendimento IS NOT NULL)
          AND (:orgaoId IS NULL OR e.id_orgao = :orgaoId)
          AND (:equipeId IS NULL OR s.id_equipe = :equipeId)
        """, nativeQuery = true)
    List<Object[]> queryAnaliseSatisfacaoAvancada(@Param("orgaoId") Long orgaoId, @Param("equipeId") Long equipeId);

    /**
     * 4. Feedbacks Recentes com Protocolo, Cidadão, Nota Média e Comentário
     */
    @Query(value = """
        SELECT TOP 6 
            s.protocolo,
            srv.categoria,
            s.feedback_comentario,
            ROUND((CAST(s.nota_qualidade AS FLOAT) + CAST(s.nota_prazos AS FLOAT) + CAST(s.nota_atendimento AS FLOAT)) / 3.0, 1) AS media_nota,
            u.nome AS cidadao,
            s.data_conclusao
        FROM TB_SOLICITACAO s
        JOIN TB_SERVICO srv ON srv.id = s.id_servico
        JOIN TB_USUARIO u ON u.id = s.id_usuario
        LEFT JOIN TB_EQUIPE_PUBLICA e ON e.id = s.id_equipe
        WHERE s.feedback_comentario IS NOT NULL AND LEN(s.feedback_comentario) > 0
          AND (:orgaoId IS NULL OR e.id_orgao = :orgaoId)
          AND (:equipeId IS NULL OR s.id_equipe = :equipeId)
        ORDER BY s.id DESC
        """, nativeQuery = true)
    List<Object[]> queryFeedbacksRecentesAvancados(@Param("orgaoId") Long orgaoId, @Param("equipeId") Long equipeId);

    /**
     * 5. Distribuição de Chamados por Turno e Dia da Semana
     */
    @Query(value = """
        SELECT 
            DATEPART(dw, s.data_criacao) AS dia_num,
            CASE DATEPART(dw, s.data_criacao)
                WHEN 1 THEN 'Dom'
                WHEN 2 THEN 'Seg'
                WHEN 3 THEN 'Ter'
                WHEN 4 THEN 'Qua'
                WHEN 5 THEN 'Qui'
                WHEN 6 THEN 'Sex'
                WHEN 7 THEN 'Sáb'
            END AS dia_nome,
            CASE 
                WHEN DATEPART(hour, s.data_criacao) BETWEEN 6 AND 11 THEN 'Manhã'
                WHEN DATEPART(hour, s.data_criacao) BETWEEN 12 AND 17 THEN 'Tarde'
                WHEN DATEPART(hour, s.data_criacao) BETWEEN 18 AND 23 THEN 'Noite'
                ELSE 'Madrugada'
            END AS turno,
            COUNT(*) AS total
        FROM TB_SOLICITACAO s
        LEFT JOIN TB_EQUIPE_PUBLICA e ON e.id = s.id_equipe
        WHERE (:orgaoId IS NULL OR e.id_orgao = :orgaoId)
          AND (:equipeId IS NULL OR s.id_equipe = :equipeId)
        GROUP BY 
            DATEPART(dw, s.data_criacao),
            CASE 
                WHEN DATEPART(hour, s.data_criacao) BETWEEN 6 AND 11 THEN 'Manhã'
                WHEN DATEPART(hour, s.data_criacao) BETWEEN 12 AND 17 THEN 'Tarde'
                WHEN DATEPART(hour, s.data_criacao) BETWEEN 18 AND 23 THEN 'Noite'
                ELSE 'Madrugada'
            END
        ORDER BY dia_num
        """, nativeQuery = true)
    List<Object[]> queryDistribuicaoTurnosAvancada(@Param("orgaoId") Long orgaoId, @Param("equipeId") Long equipeId);

    /**
     * 6. Gargalos Urbanos por Bairro com DENSE_RANK() e Backlog
     */
    @Query(value = """
        WITH BairroStats AS (
            SELECT 
                CASE 
                    WHEN s.endereco IS NOT NULL AND CHARINDEX('-', s.endereco) > 0 
                         AND CHARINDEX(',', s.endereco, CHARINDEX('-', s.endereco)) > 0
                    THEN LTRIM(RTRIM(SUBSTRING(
                        s.endereco, 
                        CHARINDEX('-', s.endereco) + 1, 
                        CHARINDEX(',', s.endereco, CHARINDEX('-', s.endereco)) - CHARINDEX('-', s.endereco) - 1
                    )))
                    WHEN s.endereco IS NOT NULL AND LEN(s.endereco) > 0 
                    THEN SUBSTRING(s.endereco, 1, 35)
                    ELSE 'Centro Histórico'
                END AS bairro,
                COUNT(*) AS total_demandas,
                SUM(CASE WHEN s.status IN ('PENDENTE','TRIAGEM') THEN 1 ELSE 0 END) AS pendentes,
                SUM(CASE WHEN s.status IN ('EM_ANDAMENTO','EM_CAMPO') THEN 1 ELSE 0 END) AS em_atendimento,
                SUM(CASE WHEN s.status = 'CONCLUIDA' THEN 1 ELSE 0 END) AS concluidas,
                SUM(CASE WHEN s.prioridade IN ('ALTA','URGENTE') AND s.status NOT IN ('CONCLUIDA','CANCELADA') THEN 1 ELSE 0 END) AS urgentes_ativas,
                AVG(CASE WHEN s.status NOT IN ('CONCLUIDA','CANCELADA') 
                         THEN CAST(DATEDIFF(day, s.data_criacao, GETDATE()) AS FLOAT) 
                         ELSE NULL END) AS media_dias_espera
            FROM TB_SOLICITACAO s
            LEFT JOIN TB_EQUIPE_PUBLICA e ON e.id = s.id_equipe
            WHERE (:orgaoId IS NULL OR e.id_orgao = :orgaoId)
              AND (:equipeId IS NULL OR s.id_equipe = :equipeId)
            GROUP BY 
                CASE 
                    WHEN s.endereco IS NOT NULL AND CHARINDEX('-', s.endereco) > 0 
                         AND CHARINDEX(',', s.endereco, CHARINDEX('-', s.endereco)) > 0
                    THEN LTRIM(RTRIM(SUBSTRING(
                        s.endereco, 
                        CHARINDEX('-', s.endereco) + 1, 
                        CHARINDEX(',', s.endereco, CHARINDEX('-', s.endereco)) - CHARINDEX('-', s.endereco) - 1
                    )))
                    WHEN s.endereco IS NOT NULL AND LEN(s.endereco) > 0 
                    THEN SUBSTRING(s.endereco, 1, 35)
                    ELSE 'Centro Histórico'
                END
        )
        SELECT 
            bairro, total_demandas, pendentes, em_atendimento, concluidas, urgentes_ativas,
            ROUND(ISNULL(media_dias_espera, 0), 1) AS media_dias_espera,
            DENSE_RANK() OVER (ORDER BY urgentes_ativas DESC, pendentes DESC) AS rank_criticidade
        FROM BairroStats
        WHERE LEN(bairro) > 2
        ORDER BY rank_criticidade ASC
        """, nativeQuery = true)
    List<Object[]> queryGargalosUrbanosAvancados(@Param("orgaoId") Long orgaoId, @Param("equipeId") Long equipeId);
}
