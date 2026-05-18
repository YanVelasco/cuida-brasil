package br.gov.cuidar.entity;
import jakarta.persistence.*;

@Entity
@Table(name = "TB_GESTOR")
public class Gestor {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_equipe", nullable = false)
    private EquipePublica equipe;

    public Gestor() {}
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public Usuario getUsuario() { return usuario; } public void setUsuario(Usuario usuario) { this.usuario = usuario; }
    public EquipePublica getEquipe() { return equipe; } public void setEquipe(EquipePublica equipe) { this.equipe = equipe; }
}
