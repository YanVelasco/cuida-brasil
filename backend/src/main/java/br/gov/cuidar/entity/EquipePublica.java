package br.gov.cuidar.entity;
import jakarta.persistence.*;

@Entity
@Table(name = "TB_EQUIPE_PUBLICA")
public class EquipePublica {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 200)
    private String nome;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_orgao", nullable = false)
    private OrgaoPublico orgao;
    @Column(nullable = false)
    private Boolean ativo = true;

    public EquipePublica() {}
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public String getNome() { return nome; } public void setNome(String nome) { this.nome = nome; }
    public OrgaoPublico getOrgao() { return orgao; } public void setOrgao(OrgaoPublico orgao) { this.orgao = orgao; }
    public Boolean getAtivo() { return ativo; } public void setAtivo(Boolean ativo) { this.ativo = ativo; }
}
