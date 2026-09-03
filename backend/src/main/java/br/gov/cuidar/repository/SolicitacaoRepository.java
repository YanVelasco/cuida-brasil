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
    Page<Solicitacao> findByStatus(String status, Pageable pageable);
    Page<Solicitacao> findByEquipeId(Long equipeId, Pageable pageable);
    Page<Solicitacao> findByStatusAndEquipeId(String status, Long equipeId, Pageable pageable);
    List<Solicitacao> findByEquipeId(Long equipeId);

    @Query("SELECT s FROM Solicitacao s WHERE s.status = :status AND s.equipe.id = :equipeId")
    Page<Solicitacao> findByStatusAndEquipeIdOrNull(@Param("status") String status, @Param("equipeId") Long equipeId, Pageable pageable);

    @Query("SELECT s FROM Solicitacao s WHERE s.equipe.id = :equipeId")
    Page<Solicitacao> findByEquipeIdOrNull(@Param("equipeId") Long equipeId, Pageable pageable);

    @Query("SELECT s FROM Solicitacao s WHERE s.equipe.id IN (SELECT g.equipe.id FROM Gestor g WHERE LOWER(g.usuario.nome) = LOWER(:gestor))")
    Page<Solicitacao> findByGestorNome(@Param("gestor") String gestor, Pageable pageable);

    @Query("SELECT s FROM Solicitacao s WHERE s.status = :status AND s.equipe.id IN (SELECT g.equipe.id FROM Gestor g WHERE LOWER(g.usuario.nome) = LOWER(:gestor))")
    Page<Solicitacao> findByStatusAndGestorNome(@Param("status") String status, @Param("gestor") String gestor, Pageable pageable);
    
    @Query("SELECT s FROM Solicitacao s WHERE s.equipe IS NULL AND s.status IN ('PENDENTE', 'TRIAGEM') ORDER BY s.dataCriacao ASC")
    List<Solicitacao> findNaoAtribuidas();
    long countByStatus(String status);

    @Query("SELECT COUNT(s) FROM Solicitacao s WHERE s.status = :status AND s.equipe.id = :equipeId")
    long countByStatusAndEquipeId(@Param("status") String status, @Param("equipeId") Long equipeId);

    @Query("SELECT COUNT(s) FROM Solicitacao s WHERE (s.prioridade = 'ALTA' OR s.prioridade = 'URGENTE') AND s.status NOT IN ('CONCLUIDA', 'CANCELADA') AND s.equipe.id = :equipeId")
    long countUrgentesByEquipeId(@Param("equipeId") Long equipeId);

    @Query("SELECT COUNT(s) FROM Solicitacao s WHERE (s.prioridade = 'ALTA' OR s.prioridade = 'URGENTE') AND s.status NOT IN ('CONCLUIDA', 'CANCELADA')")
    long countUrgentes();

    @Query("SELECT s.servico.categoria, COUNT(s) FROM Solicitacao s GROUP BY s.servico.categoria ORDER BY COUNT(s) DESC")
    List<Object[]> countByCategoria();

    @Query("SELECT s.servico.categoria, COUNT(s) FROM Solicitacao s WHERE s.equipe.id = :equipeId GROUP BY s.servico.categoria ORDER BY COUNT(s) DESC")
    List<Object[]> countByCategoriaAndEquipeId(@Param("equipeId") Long equipeId);

    // Relatórios: agrupamento por status
    @Query("SELECT s.status, COUNT(s) FROM Solicitacao s GROUP BY s.status")
    List<Object[]> countByStatusGrouped();

    @Query("SELECT s.status, COUNT(s) FROM Solicitacao s WHERE s.equipe.id = :equipeId GROUP BY s.status")
    List<Object[]> countByStatusGroupedAndEquipeId(@Param("equipeId") Long equipeId);

    @Query("SELECT COUNT(s) FROM Solicitacao s WHERE s.dataCriacao >= :inicio AND s.dataCriacao < :fim AND (:gestor IS NULL OR EXISTS (SELECT g.id FROM Gestor g WHERE g.equipe.id = s.equipe.id AND LOWER(g.usuario.nome) = LOWER(:gestor)))")
    long countByPeriod(@Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim, @Param("gestor") String gestor);

    @Query("SELECT COUNT(s) FROM Solicitacao s WHERE s.status = :status AND s.dataCriacao >= :inicio AND s.dataCriacao < :fim AND (:gestor IS NULL OR EXISTS (SELECT g.id FROM Gestor g WHERE g.equipe.id = s.equipe.id AND LOWER(g.usuario.nome) = LOWER(:gestor)))")
    long countByStatusAndPeriod(@Param("status") String status, @Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim, @Param("gestor") String gestor);

    @Query("SELECT COUNT(s) FROM Solicitacao s WHERE (s.prioridade = 'ALTA' OR s.prioridade = 'URGENTE') AND s.status IN ('PENDENTE', 'TRIAGEM') AND s.dataCriacao >= :inicio AND s.dataCriacao < :fim AND (:gestor IS NULL OR EXISTS (SELECT g.id FROM Gestor g WHERE g.equipe.id = s.equipe.id AND LOWER(g.usuario.nome) = LOWER(:gestor)))")
    long countUrgentesByPeriod(@Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim, @Param("gestor") String gestor);

    @Query("SELECT s.servico.categoria, COUNT(s) FROM Solicitacao s WHERE s.dataCriacao >= :inicio AND s.dataCriacao < :fim AND (:gestor IS NULL OR EXISTS (SELECT g.id FROM Gestor g WHERE g.equipe.id = s.equipe.id AND LOWER(g.usuario.nome) = LOWER(:gestor))) GROUP BY s.servico.categoria ORDER BY COUNT(s) DESC")
    List<Object[]> countByCategoriaPeriod(@Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim, @Param("gestor") String gestor);

    @Query("SELECT s.status, COUNT(s) FROM Solicitacao s WHERE s.dataCriacao >= :inicio AND s.dataCriacao < :fim AND (:gestor IS NULL OR EXISTS (SELECT g.id FROM Gestor g WHERE g.equipe.id = s.equipe.id AND LOWER(g.usuario.nome) = LOWER(:gestor))) GROUP BY s.status")
    List<Object[]> countByStatusGroupedPeriod(@Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim, @Param("gestor") String gestor);

    // Relatórios: tendência mensal (últimos 6 meses)
    @Query(value = "SELECT MONTH(data_criacao) as mes, YEAR(data_criacao) as ano, COUNT(*) as total FROM TB_SOLICITACAO WHERE data_criacao >= DATEADD(month, -6, GETDATE()) GROUP BY YEAR(data_criacao), MONTH(data_criacao) ORDER BY ano, mes", nativeQuery = true)
    List<Object[]> tendenciaMensal();

    @Query(value = "SELECT MONTH(s.data_criacao) as mes, YEAR(s.data_criacao) as ano, COUNT(DISTINCT s.id) as total FROM TB_SOLICITACAO s LEFT JOIN TB_EQUIPE_PUBLICA e ON e.id = s.id_equipe LEFT JOIN TB_GESTOR g ON g.id_equipe = e.id LEFT JOIN TB_USUARIO u ON u.id = g.id_usuario WHERE s.data_criacao >= :inicio AND s.data_criacao < :fim AND (:gestor IS NULL OR LOWER(u.nome) = LOWER(:gestor)) GROUP BY YEAR(s.data_criacao), MONTH(s.data_criacao) ORDER BY ano, mes", nativeQuery = true)
    List<Object[]> tendenciaMensalPeriod(@Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim, @Param("gestor") String gestor);
}

