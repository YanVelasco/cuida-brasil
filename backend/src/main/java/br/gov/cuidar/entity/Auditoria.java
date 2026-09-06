package br.gov.cuidar.entity;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "TB_AUDITORIA")
public class Auditoria {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private LocalDateTime data = LocalDateTime.now();
    @Column(nullable = false, length = 50)
    private String acao;
    @Column(length = 500)
    private String detalhes;
    @Column(length = 14)
    private String cpf;
    @Column(length = 50)
    private String ip;
    @Column(name = "user_agent", length = 300)
    private String userAgent;
    @Column(nullable = false)
    private Boolean sucesso = true;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario")
    private Usuario usuario;

    public Auditoria() {}
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public LocalDateTime getData() { return data; } public void setData(LocalDateTime data) { this.data = data; }
    public String getAcao() { return acao; } public void setAcao(String acao) { this.acao = acao; }
    public String getDetalhes() { return detalhes; } public void setDetalhes(String detalhes) { this.detalhes = detalhes; }
    public String getCpf() { return cpf; } public void setCpf(String cpf) { this.cpf = cpf; }
    public String getIp() { return ip; } public void setIp(String ip) { this.ip = ip; }
    public String getUserAgent() { return userAgent; } public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
    public Boolean getSucesso() { return sucesso; } public void setSucesso(Boolean sucesso) { this.sucesso = sucesso; }
    public Usuario getUsuario() { return usuario; } public void setUsuario(Usuario usuario) { this.usuario = usuario; }
}
