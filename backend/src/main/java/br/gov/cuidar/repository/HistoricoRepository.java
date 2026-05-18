package br.gov.cuidar.repository;
import br.gov.cuidar.entity.Historico;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface HistoricoRepository extends JpaRepository<Historico, Long> {
    List<Historico> findBySolicitacaoIdOrderByDataAsc(Long solicitacaoId);
}
