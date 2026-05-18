package br.gov.cuidar.entity;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "TB_HISTORICO")
public class Historico {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private LocalDateTime data = LocalDateTime.now();
    @Column(nullable = false, length = 500)
    private String acao;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_solicitacao", nullable = false)
    private Solicitacao solicitacao;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

    public Historico() {}
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public LocalDateTime getData() { return data; } public void setData(LocalDateTime data) { this.data = data; }
    public String getAcao() { return acao; } public void setAcao(String acao) { this.acao = acao; }
    public Solicitacao getSolicitacao() { return solicitacao; } public void setSolicitacao(Solicitacao solicitacao) { this.solicitacao = solicitacao; }
    public Usuario getUsuario() { return usuario; } public void setUsuario(Usuario usuario) { this.usuario = usuario; }
}
