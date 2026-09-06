package br.gov.cuidar.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import br.gov.cuidar.entity.Auditoria;

public interface AuditoriaRepository extends JpaRepository<Auditoria, Long> {
    Page<Auditoria> findByAcao(String acao, Pageable pageable);
    Page<Auditoria> findByAcaoStartingWith(String prefixo, Pageable pageable);
    long countByAcaoAndSucesso(String acao, Boolean sucesso);
}
