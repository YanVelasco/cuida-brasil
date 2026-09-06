package br.gov.cuidar.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import br.gov.cuidar.entity.Anexo;

public interface AnexoRepository extends JpaRepository<Anexo, Long> {
    List<Anexo> findBySolicitacaoIdOrderByDataAsc(Long solicitacaoId);
}
