package br.gov.cuidar.repository;
import br.gov.cuidar.entity.EquipePublica;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface EquipePublicaRepository extends JpaRepository<EquipePublica, Long> {
    List<EquipePublica> findByAtivoTrue();
    Page<EquipePublica> findByAtivoTrue(Pageable pageable);
}
