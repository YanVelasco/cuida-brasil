package br.gov.cuidar.repository;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import br.gov.cuidar.entity.OrgaoPublico;
public interface OrgaoPublicoRepository extends JpaRepository<OrgaoPublico, Long> {
	List<OrgaoPublico> findByAtivoTrue();
	Optional<OrgaoPublico> findBySigla(String sigla);
}
