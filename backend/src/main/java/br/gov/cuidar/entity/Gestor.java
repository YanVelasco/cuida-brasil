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

    private Double latitude;
    private Double longitude;
    private java.time.LocalDateTime ultimaAtualizacaoLocalizacao;

    public Gestor() {}
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public Usuario getUsuario() { return usuario; } public void setUsuario(Usuario usuario) { this.usuario = usuario; }
    public EquipePublica getEquipe() { return equipe; } public void setEquipe(EquipePublica equipe) { this.equipe = equipe; }
    public Double getLatitude() { return latitude; } public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; } public void setLongitude(Double longitude) { this.longitude = longitude; }
    public java.time.LocalDateTime getUltimaAtualizacaoLocalizacao() { return ultimaAtualizacaoLocalizacao; } public void setUltimaAtualizacaoLocalizacao(java.time.LocalDateTime ultimaAtualizacaoLocalizacao) { this.ultimaAtualizacaoLocalizacao = ultimaAtualizacaoLocalizacao; }
}
