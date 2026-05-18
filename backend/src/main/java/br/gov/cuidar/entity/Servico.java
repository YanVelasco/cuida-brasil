package br.gov.cuidar.entity;
import jakarta.persistence.*;

@Entity
@Table(name = "TB_SERVICO")
public class Servico {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 100)
    private String categoria;
    @Column(nullable = false, length = 200)
    private String subcategoria;

    public Servico() {}
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public String getCategoria() { return categoria; } public void setCategoria(String categoria) { this.categoria = categoria; }
    public String getSubcategoria() { return subcategoria; } public void setSubcategoria(String subcategoria) { this.subcategoria = subcategoria; }
}
