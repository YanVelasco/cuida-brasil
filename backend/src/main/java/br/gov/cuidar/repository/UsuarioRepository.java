package br.gov.cuidar.repository;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import br.gov.cuidar.entity.Usuario;
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByCpf(String cpf);
    Optional<Usuario> findByEmail(String email);
    boolean existsByCpf(String cpf);
    boolean existsByEmail(String email);
    long countByPerfil(String perfil);
    java.util.List<Usuario> findByPerfilOrderByNome(String perfil);
    java.util.List<Usuario> findByPerfilAndOrgaoIdOrderByNome(String perfil, Long orgaoId);
    long countByPerfilAndOrgaoId(String perfil, Long orgaoId);
}
