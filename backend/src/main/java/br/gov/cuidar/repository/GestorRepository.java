package br.gov.cuidar.repository;
import br.gov.cuidar.entity.Gestor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
public interface GestorRepository extends JpaRepository<Gestor, Long> {
    Optional<Gestor> findByUsuarioId(Long idUsuario);

    @Query("SELECT g.equipe.id FROM Gestor g WHERE g.usuario.id = :usuarioId")
    Optional<Long> findEquipeIdByUsuarioId(@Param("usuarioId") Long usuarioId);
    
    java.util.List<Gestor> findByEquipeId(Long equipeId);
    
    org.springframework.data.domain.Page<Gestor> findByEquipeId(Long equipeId, org.springframework.data.domain.Pageable pageable);
}
