package br.gov.cuidar.entity;
import jakarta.persistence.*;

@Entity
@Table(name = "TB_ORGAO_PUBLICO")
public class OrgaoPublico {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 200)
    private String nome;
    @Column(nullable = false, length = 20)
    private String sigla;
    @Column(nullable = false, length = 100)
    private String tipo;
    @Column(nullable = false, length = 200)
    private String areaAtendimento;
    @Column(nullable = false)
    private Boolean ativo = true;

    public OrgaoPublico() {}
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public String getNome() { return nome; } public void setNome(String nome) { this.nome = nome; }
    public String getSigla() { return sigla; } public void setSigla(String sigla) { this.sigla = sigla; }
    public String getTipo() { return tipo; } public void setTipo(String tipo) { this.tipo = tipo; }
    public String getAreaAtendimento() { return areaAtendimento; } public void setAreaAtendimento(String areaAtendimento) { this.areaAtendimento = areaAtendimento; }
    public Boolean getAtivo() { return ativo; } public void setAtivo(Boolean ativo) { this.ativo = ativo; }
}
