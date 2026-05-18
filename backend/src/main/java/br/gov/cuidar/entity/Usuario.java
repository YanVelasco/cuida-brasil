package br.gov.cuidar.entity;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.util.*;

@Entity
@Table(name = "TB_USUARIO")
public class Usuario {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @NotBlank @Column(nullable = false, length = 150)
    private String nome;
    @NotBlank @Column(nullable = false, unique = true, length = 14)
    private String cpf;
    @Email @NotBlank @Column(nullable = false, unique = true, length = 200)
    private String email;
    @Column(nullable = false, length = 255)
    private String senha;
    @Column(nullable = false, length = 20)
    private String perfil = "CITIZEN";
    @Column(nullable = false)
    private Boolean ativo = true;
    @Column(nullable = false)
    private LocalDateTime dataCriacao = LocalDateTime.now();
    @OneToMany(mappedBy = "usuario", cascade = CascadeType.ALL)
    private List<Solicitacao> solicitacoes = new ArrayList<>();

    public Usuario() {}
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public String getNome() { return nome; } public void setNome(String nome) { this.nome = nome; }
    public String getCpf() { return cpf; } public void setCpf(String cpf) { this.cpf = cpf; }
    public String getEmail() { return email; } public void setEmail(String email) { this.email = email; }
    public String getSenha() { return senha; } public void setSenha(String senha) { this.senha = senha; }
    public String getPerfil() { return perfil; } public void setPerfil(String perfil) { this.perfil = perfil; }
    public Boolean getAtivo() { return ativo; } public void setAtivo(Boolean ativo) { this.ativo = ativo; }
    public LocalDateTime getDataCriacao() { return dataCriacao; } public void setDataCriacao(LocalDateTime dataCriacao) { this.dataCriacao = dataCriacao; }
    public List<Solicitacao> getSolicitacoes() { return solicitacoes; } public void setSolicitacoes(List<Solicitacao> solicitacoes) { this.solicitacoes = solicitacoes; }
}
