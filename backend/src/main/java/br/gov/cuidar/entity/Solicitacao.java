package br.gov.cuidar.entity;
import jakarta.persistence.*;
import java.time.*;
import java.util.*;

@Entity
@Table(name = "TB_SOLICITACAO")
public class Solicitacao {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 50)
    private String protocolo;
    @Column(nullable = false, length = 2000)
    private String descricao;
    @Column(length = 1000)
    private String fotos;
    @Column(nullable = false, length = 100)
    private String gps;
    @Column(nullable = false, length = 30)
    private String status = "PENDENTE";
    @Column(length = 20)
    private String prioridade;
    @Column(nullable = false)
    private LocalDateTime dataCriacao = LocalDateTime.now();
    private LocalDate dataConclusao;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_equipe")
    private EquipePublica equipe;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_servico", nullable = false)
    private Servico servico;
    @OneToMany(mappedBy = "solicitacao", cascade = CascadeType.ALL)
    private List<Historico> historicos = new ArrayList<>();
    @OneToMany(mappedBy = "solicitacao", cascade = CascadeType.ALL)
    private List<Anexo> anexos = new ArrayList<>();

    public Solicitacao() {}
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public String getProtocolo() { return protocolo; } public void setProtocolo(String protocolo) { this.protocolo = protocolo; }
    public String getDescricao() { return descricao; } public void setDescricao(String descricao) { this.descricao = descricao; }
    public String getFotos() { return fotos; } public void setFotos(String fotos) { this.fotos = fotos; }
    public String getGps() { return gps; } public void setGps(String gps) { this.gps = gps; }
    public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
    public String getPrioridade() { return prioridade; } public void setPrioridade(String prioridade) { this.prioridade = prioridade; }
    public LocalDateTime getDataCriacao() { return dataCriacao; } public void setDataCriacao(LocalDateTime dataCriacao) { this.dataCriacao = dataCriacao; }
    public LocalDate getDataConclusao() { return dataConclusao; } public void setDataConclusao(LocalDate dataConclusao) { this.dataConclusao = dataConclusao; }
    public Usuario getUsuario() { return usuario; } public void setUsuario(Usuario usuario) { this.usuario = usuario; }
    public EquipePublica getEquipe() { return equipe; } public void setEquipe(EquipePublica equipe) { this.equipe = equipe; }
    public Servico getServico() { return servico; } public void setServico(Servico servico) { this.servico = servico; }
    public List<Historico> getHistoricos() { return historicos; } public void setHistoricos(List<Historico> historicos) { this.historicos = historicos; }
    public List<Anexo> getAnexos() { return anexos; } public void setAnexos(List<Anexo> anexos) { this.anexos = anexos; }
}
