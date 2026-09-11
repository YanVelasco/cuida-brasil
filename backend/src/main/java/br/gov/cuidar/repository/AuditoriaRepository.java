package br.gov.cuidar.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import br.gov.cuidar.entity.Auditoria;

public interface AuditoriaRepository extends JpaRepository<Auditoria, Long> {
    Page<Auditoria> findByAcao(String acao, Pageable pageable);
    Page<Auditoria> findByAcaoStartingWith(String prefixo, Pageable pageable);
    long countByAcaoAndSucesso(String acao, Boolean sucesso);

    @Query(value = "select distinct a.* from TB_AUDITORIA a left join TB_USUARIO u on u.id = a.id_usuario where (:acao is null or a.acao like concat(:acao, '%')) and (:sucesso is null or a.sucesso = :sucesso) and (:cpf is null or lower(coalesce(a.cpf, '')) like concat('%', lower(:cpf), '%')) and (:nomeUsuario is null or lower(coalesce(u.nome, '')) like concat('%', lower(:nomeUsuario), '%')) and (:detalhes is null or lower(coalesce(a.detalhes, '')) like concat('%', lower(:detalhes), '%')) and (:ip is null or lower(coalesce(a.ip, '')) like concat('%', lower(:ip), '%')) and (:inicio is null or a.data >= :inicio) and (:fim is null or a.data < :fim) order by a.data desc", countQuery = "select count(distinct a.id) from TB_AUDITORIA a left join TB_USUARIO u on u.id = a.id_usuario where (:acao is null or a.acao like concat(:acao, '%')) and (:sucesso is null or a.sucesso = :sucesso) and (:cpf is null or lower(coalesce(a.cpf, '')) like concat('%', lower(:cpf), '%')) and (:nomeUsuario is null or lower(coalesce(u.nome, '')) like concat('%', lower(:nomeUsuario), '%')) and (:detalhes is null or lower(coalesce(a.detalhes, '')) like concat('%', lower(:detalhes), '%')) and (:ip is null or lower(coalesce(a.ip, '')) like concat('%', lower(:ip), '%')) and (:inicio is null or a.data >= :inicio) and (:fim is null or a.data < :fim)", nativeQuery = true)
    Page<Auditoria> findFiltered(@Param("acao") String acao, @Param("sucesso") Boolean sucesso, @Param("cpf") String cpf, @Param("nomeUsuario") String nomeUsuario, @Param("detalhes") String detalhes, @Param("ip") String ip, @Param("inicio") java.time.LocalDateTime inicio, @Param("fim") java.time.LocalDateTime fim, Pageable pageable);

    @Query("select distinct a from Auditoria a join a.usuario u left join Gestor g on g.usuario.id = u.id where u.orgao.id = :orgaoId or g.equipe.orgao.id = :orgaoId order by a.data desc")
    Page<Auditoria> findByOrgaoId(@Param("orgaoId") Long orgaoId, Pageable pageable);

    @Query("select distinct a from Auditoria a join a.usuario u left join Gestor g on g.usuario.id = u.id where a.acao like concat(:prefixo, '%') and (u.orgao.id = :orgaoId or g.equipe.orgao.id = :orgaoId) order by a.data desc")
    Page<Auditoria> findByAcaoStartingWithAndOrgaoId(@Param("prefixo") String prefixo, @Param("orgaoId") Long orgaoId, Pageable pageable);

    @Query(value = "select distinct a.* from TB_AUDITORIA a left join TB_USUARIO u on u.id = a.id_usuario left join TB_GESTOR g on g.id_usuario = u.id left join TB_EQUIPE_PUBLICA e on e.id = g.id_equipe where (u.id_orgao = :orgaoId or e.id_orgao = :orgaoId) order by a.data desc", countQuery = "select count(distinct a.id) from TB_AUDITORIA a left join TB_USUARIO u on u.id = a.id_usuario left join TB_GESTOR g on g.id_usuario = u.id left join TB_EQUIPE_PUBLICA e on e.id = g.id_equipe where (u.id_orgao = :orgaoId or e.id_orgao = :orgaoId)", nativeQuery = true)
    Page<Auditoria> findAllByOrgaoIdNative(@Param("orgaoId") Long orgaoId, Pageable pageable);

    @Query(value = "select distinct a.* from TB_AUDITORIA a left join TB_USUARIO u on u.id = a.id_usuario left join TB_GESTOR g on g.id_usuario = u.id left join TB_EQUIPE_PUBLICA e on e.id = g.id_equipe where (u.id_orgao = :orgaoId or e.id_orgao = :orgaoId) and a.acao like concat(:prefixo, '%') order by a.data desc", countQuery = "select count(distinct a.id) from TB_AUDITORIA a left join TB_USUARIO u on u.id = a.id_usuario left join TB_GESTOR g on g.id_usuario = u.id left join TB_EQUIPE_PUBLICA e on e.id = g.id_equipe where (u.id_orgao = :orgaoId or e.id_orgao = :orgaoId) and a.acao like concat(:prefixo, '%')", nativeQuery = true)
    Page<Auditoria> findByAcaoStartingWithAndOrgaoIdNative(@Param("prefixo") String prefixo, @Param("orgaoId") Long orgaoId, Pageable pageable);

    @Query(value = "select distinct a.* from TB_AUDITORIA a left join TB_USUARIO u on u.id = a.id_usuario left join TB_GESTOR g on g.id_usuario = u.id left join TB_EQUIPE_PUBLICA e on e.id = g.id_equipe where (u.id_orgao = :orgaoId or e.id_orgao = :orgaoId) and (:acao is null or a.acao like concat(:acao, '%')) and (:sucesso is null or a.sucesso = :sucesso) and (:cpf is null or lower(coalesce(a.cpf, '')) like concat('%', lower(:cpf), '%')) and (:nomeUsuario is null or lower(coalesce(u.nome, '')) like concat('%', lower(:nomeUsuario), '%')) and (:detalhes is null or lower(coalesce(a.detalhes, '')) like concat('%', lower(:detalhes), '%')) and (:ip is null or lower(coalesce(a.ip, '')) like concat('%', lower(:ip), '%')) and (:inicio is null or a.data >= :inicio) and (:fim is null or a.data < :fim) order by a.data desc", countQuery = "select count(distinct a.id) from TB_AUDITORIA a left join TB_USUARIO u on u.id = a.id_usuario left join TB_GESTOR g on g.id_usuario = u.id left join TB_EQUIPE_PUBLICA e on e.id = g.id_equipe where (u.id_orgao = :orgaoId or e.id_orgao = :orgaoId) and (:acao is null or a.acao like concat(:acao, '%')) and (:sucesso is null or a.sucesso = :sucesso) and (:cpf is null or lower(coalesce(a.cpf, '')) like concat('%', lower(:cpf), '%')) and (:nomeUsuario is null or lower(coalesce(u.nome, '')) like concat('%', lower(:nomeUsuario), '%')) and (:detalhes is null or lower(coalesce(a.detalhes, '')) like concat('%', lower(:detalhes), '%')) and (:ip is null or lower(coalesce(a.ip, '')) like concat('%', lower(:ip), '%')) and (:inicio is null or a.data >= :inicio) and (:fim is null or a.data < :fim)", nativeQuery = true)
    Page<Auditoria> findFilteredByOrgaoId(@Param("acao") String acao, @Param("sucesso") Boolean sucesso, @Param("cpf") String cpf, @Param("nomeUsuario") String nomeUsuario, @Param("detalhes") String detalhes, @Param("ip") String ip, @Param("inicio") java.time.LocalDateTime inicio, @Param("fim") java.time.LocalDateTime fim, @Param("orgaoId") Long orgaoId, Pageable pageable);

    @Query("select count(a) from Auditoria a where a.acao = :acao and a.sucesso = :sucesso and (a.usuario.orgao.id = :orgaoId or exists (select g.id from Gestor g where g.usuario.id = a.usuario.id and g.equipe.orgao.id = :orgaoId))")
    long countByAcaoAndSucessoAndOrgaoId(@Param("acao") String acao, @Param("sucesso") Boolean sucesso, @Param("orgaoId") Long orgaoId);
}
