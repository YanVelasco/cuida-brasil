package br.gov.cuidar.dto;

public class NovoOrgaoDTO {
    private String nome;
    private String sigla;
    private String tipo;
    private String areaAtendimento;
    private String adminNome;
    private String adminCpf;
    private String adminEmail;
    private String adminSenha;

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getSigla() { return sigla; }
    public void setSigla(String sigla) { this.sigla = sigla; }
    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public String getAreaAtendimento() { return areaAtendimento; }
    public void setAreaAtendimento(String areaAtendimento) { this.areaAtendimento = areaAtendimento; }
    public String getAdminNome() { return adminNome; }
    public void setAdminNome(String adminNome) { this.adminNome = adminNome; }
    public String getAdminCpf() { return adminCpf; }
    public void setAdminCpf(String adminCpf) { this.adminCpf = adminCpf; }
    public String getAdminEmail() { return adminEmail; }
    public void setAdminEmail(String adminEmail) { this.adminEmail = adminEmail; }
    public String getAdminSenha() { return adminSenha; }
    public void setAdminSenha(String adminSenha) { this.adminSenha = adminSenha; }
}