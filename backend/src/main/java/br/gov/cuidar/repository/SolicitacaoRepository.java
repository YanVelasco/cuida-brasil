package br.gov.cuidar.repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import br.gov.cuidar.entity.Solicitacao;
public interface SolicitacaoRepository extends JpaRepository<Solicitacao, Long> {
    Optional<Solicitacao> findByProtocolo(String protocolo);
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

    @Query("SELECT s FROM Solicitacao s WHERE s.status = :status AND s.equipe.id = :equipeId")
    Page<Solicitacao> findByStatusAndEquipeIdOrNull(@Param("status") String status, @Param("equipeId") Long equipeId, Pageable pageable);

    @Query("SELECT s FROM Solicitacao s WHERE s.status = :status AND (s.equipe.id = :equipeId OR s.equipe IS NULL)")
    Page<Solicitacao> findByStatusAndEquipeIdOrNullAndUnassigned(@Param("status") String status, @Param("equipeId") Long equipeId, Pageable pageable);

    @Query("SELECT s FROM Solicitacao s WHERE s.protocolo LIKE CONCAT('%', :protocolo, '%') AND (s.equipe.id = :equipeId OR s.equipe IS NULL)")
    Page<Solicitacao> findByProtocoloAndEquipeIdOrNullAndUnassigned(@Param("protocolo") String protocolo, @Param("equipeId") Long equipeId, Pageable pageable);

    @Query("SELECT s FROM Solicitacao s WHERE s.protocolo LIKE CONCAT('%', :protocolo, '%') AND s.status = :status AND (s.equipe.id = :equipeId OR s.equipe IS NULL)")
    Page<Solicitacao> findByProtocoloAndStatusAndEquipeIdOrNullAndUnassigned(@Param("protocolo") String protocolo, @Param("status") String status, @Param("equipeId") Long equipeId, Pageable pageable);

    @Query("SELECT s FROM Solicitacao s WHERE s.equipe.id = :equipeId")
    Page<Solicitacao> findByEquipeIdOrNull(@Param("equipeId") Long equipeId, Pageable pageable);

    @Query("SELECT s FROM Solicitacao s WHERE s.equipe.id = :equipeId OR s.equipe IS NULL")
    Page<Solicitacao> findByEquipeIdOrNullAndUnassigned(@Param("equipeId") Long equipeId, Pageable pageable);

    @Query("SELECT s FROM Solicitacao s WHERE s.equipe.id IN (SELECT g.equipe.id FROM Gestor g WHERE LOWER(g.usuario.nome) = LOWER(:gestor))")
    Page<Solicitacao> findByGestorNome(@Param("gestor") String gestor, Pageable pageable);

    @Query("SELECT s FROM Solicitacao s WHERE s.status = :status AND s.equipe.id IN (SELECT g.equipe.id FROM Gestor g WHERE LOWER(g.usuario.nome) = LOWER(:gestor))")
    Page<Solicitacao> findByStatusAndGestorNome(@Param("status") String status, @Param("gestor") String gestor, Pageable pageable);

    @Query("SELECT s FROM Solicitacao s WHERE s.protocolo LIKE CONCAT('%', :protocolo, '%') AND s.equipe.id IN (SELECT g.equipe.id FROM Gestor g WHERE LOWER(g.usuario.nome) = LOWER(:gestor))")
    Page<Solicitacao> findByProtocoloAndGestorNome(@Param("protocolo") String protocolo, @Param("gestor") String gestor, Pageable pageable);

    @Query("SELECT s FROM Solicitacao s WHERE s.protocolo LIKE CONCAT('%', :protocolo, '%') AND s.status = :status AND s.equipe.id IN (SELECT g.equipe.id FROM Gestor g WHERE LOWER(g.usuario.nome) = LOWER(:gestor))")
    Page<Solicitacao> findByProtocoloAndStatusAndGestorNome(@Param("protocolo") String protocolo, @Param("status") String status, @Param("gestor") String gestor, Pageable pageable);
    
    @Query("SELECT s FROM Solicitacao s WHERE s.equipe IS NOT NULL ORDER BY s.dataCriacao DESC")
    List<Solicitacao> findComEquipe();

    @Query("SELECT s FROM Solicitacao s WHERE s.equipe.id = :equipeId ORDER BY s.dataCriacao DESC")
    List<Solicitacao> findComEquipeByEquipeId(@Param("equipeId") Long equipeId);

    @Query("SELECT s FROM Solicitacao s WHERE s.equipe IS NULL AND s.status IN ('PENDENTE', 'TRIAGEM') ORDER BY s.dataCriacao ASC")
    List<Solicitacao> findNaoAtribuidas();
    long countByStatus(String status);
    @Query("SELECT COUNT(s) FROM Solicitacao s WHERE s.status = :status AND s.equipe.orgao.id = :orgaoId")
    long countByStatusAndOrgaoId(@Param("status") String status, @Param("orgaoId") Long orgaoId);
    @Query("SELECT COUNT(s) FROM Solicitacao s WHERE (s.prioridade = 'ALTA' OR s.prioridade = 'URGENTE') AND s.status NOT IN ('CONCLUIDA', 'CANCELADA') AND s.equipe.orgao.id = :orgaoId")
    long countUrgentesByOrgaoId(@Param("orgaoId") Long orgaoId);
    @Query("SELECT COUNT(s) FROM Solicitacao s WHERE s.equipe.orgao.id = :orgaoId")
    long countByOrgaoId(@Param("orgaoId") Long orgaoId);

    @Query("SELECT COUNT(s) FROM Solicitacao s WHERE s.status = :status AND s.equipe.id = :equipeId")
    long countByStatusAndEquipeId(@Param("status") String status, @Param("equipeId") Long equipeId);

    @Query("SELECT COUNT(s) FROM Solicitacao s WHERE s.status = :status AND s.equipe IS NULL")
    long countByStatusAndEquipeNull(@Param("status") String status);

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

    // Tabela Serviço x Prioridade x Equipe (base de conhecimento para IA)
    @Query("SELECT s.servico.categoria, s.prioridade, s.equipe.nome, COUNT(s) FROM Solicitacao s WHERE s.equipe IS NOT NULL AND s.prioridade IS NOT NULL GROUP BY s.servico.categoria, s.prioridade, s.equipe.nome ORDER BY s.servico.categoria, s.prioridade, COUNT(s) DESC")
    List<Object[]> matrizServicoPrioridadeEquipe();

    @Query("SELECT s.servico.categoria, s.prioridade, s.equipe.nome, COUNT(s) FROM Solicitacao s WHERE s.equipe IS NOT NULL AND s.prioridade IS NOT NULL AND s.equipe.orgao.id = :orgaoId GROUP BY s.servico.categoria, s.prioridade, s.equipe.nome ORDER BY s.servico.categoria, s.prioridade, COUNT(s) DESC")
    List<Object[]> matrizServicoPrioridadeEquipeByOrgaoId(@Param("orgaoId") Long orgaoId);

    @Query("SELECT s.usuario.id, COUNT(s) FROM Solicitacao s GROUP BY s.usuario.id")
    List<Object[]> countPorUsuario();

    @Query("SELECT DISTINCT s.usuario FROM Solicitacao s WHERE s.equipe.id = :equipeId ORDER BY s.usuario.nome")
    List<br.gov.cuidar.entity.Usuario> findUsuariosByEquipeId(@Param("equipeId") Long equipeId);

    @Query("SELECT DISTINCT s.usuario FROM Solicitacao s WHERE s.equipe.orgao.id = :orgaoId AND s.usuario.perfil = 'CITIZEN' ORDER BY s.usuario.nome")
    List<br.gov.cuidar.entity.Usuario> findUsuariosByOrgaoId(@Param("orgaoId") Long orgaoId);

    @Query("SELECT s.usuario.id, COUNT(s) FROM Solicitacao s WHERE s.equipe.id = :equipeId GROUP BY s.usuario.id")
    List<Object[]> countPorUsuarioAndEquipe(@Param("equipeId") Long equipeId);

    @Query("SELECT s.usuario.id, COUNT(s) FROM Solicitacao s WHERE s.equipe.orgao.id = :orgaoId GROUP BY s.usuario.id")
    List<Object[]> countPorUsuarioAndOrgao(@Param("orgaoId") Long orgaoId);

    // Inteligência territorial: dados brutos para agregação por região
    @Query("SELECT s.endereco, s.gps, s.status, s.prioridade FROM Solicitacao s")
    List<Object[]> dadosTerritoriais();

    @Query("SELECT s.endereco, s.gps, s.status, s.prioridade FROM Solicitacao s WHERE s.equipe.orgao.id = :orgaoId")
    List<Object[]> dadosTerritoriaisByOrgaoId(@Param("orgaoId") Long orgaoId);
}

