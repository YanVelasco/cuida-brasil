package br.gov.cuidar.repository;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import br.gov.cuidar.entity.EquipePublica;
public interface EquipePublicaRepository extends JpaRepository<EquipePublica, Long> {
    List<EquipePublica> findByAtivoTrue();
    Page<EquipePublica> findByAtivoTrue(Pageable pageable);
    List<EquipePublica> findByAtivoTrueAndOrgaoId(Long orgaoId);
    Page<EquipePublica> findByAtivoTrueAndOrgaoId(Long orgaoId, Pageable pageable);
}
