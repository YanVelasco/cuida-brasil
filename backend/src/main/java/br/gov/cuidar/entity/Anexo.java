package br.gov.cuidar.entity;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "TB_ANEXO")
public class Anexo {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 500)
    private String arquivo;
    @Column(nullable = false)
    private LocalDateTime data = LocalDateTime.now();
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "autor", nullable = false)
    private Usuario autor;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_solicitacao", nullable = false)
    private Solicitacao solicitacao;

    public Anexo() {}
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public String getArquivo() { return arquivo; } public void setArquivo(String arquivo) { this.arquivo = arquivo; }
    public LocalDateTime getData() { return data; } public void setData(LocalDateTime data) { this.data = data; }
    public Usuario getAutor() { return autor; } public void setAutor(Usuario autor) { this.autor = autor; }
    public Solicitacao getSolicitacao() { return solicitacao; } public void setSolicitacao(Solicitacao solicitacao) { this.solicitacao = solicitacao; }
}
