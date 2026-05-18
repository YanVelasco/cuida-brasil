package br.gov.cuidar.repository;
import br.gov.cuidar.entity.Solicitacao;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;
public interface SolicitacaoRepository extends JpaRepository<Solicitacao, Long> {
    Optional<Solicitacao> findByProtocolo(String protocolo);
    Page<Solicitacao> findByUsuarioId(Long usuarioId, Pageable pageable);
    Page<Solicitacao> findByStatus(String status, Pageable pageable);
    List<Solicitacao> findByEquipeId(Long equipeId);
    long countByStatus(String status);
    @Query("SELECT COUNT(s) FROM Solicitacao s WHERE s.prioridade = 'URGENTE' AND s.status <> 'CONCLUIDA'")
    long countUrgentes();
}
