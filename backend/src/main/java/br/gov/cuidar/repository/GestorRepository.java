package br.gov.cuidar.repository;
import br.gov.cuidar.entity.Gestor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface GestorRepository extends JpaRepository<Gestor, Long> {
    Optional<Gestor> findByUsuarioId(Long idUsuario);
}
