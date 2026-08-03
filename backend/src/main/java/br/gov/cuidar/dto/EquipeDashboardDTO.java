package br.gov.cuidar.dto;

public class EquipeDashboardDTO {
    private Long id;
    private String nome;
    private String supervisor;
    private int tecnicos;
    private String tipoServico;
    private String regiao;
    private long casosAbertos;
    private String status;
    private String slaMedio;
    private String statusColor;

    public EquipeDashboardDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    
    public String getSupervisor() { return supervisor; }
    public void setSupervisor(String supervisor) { this.supervisor = supervisor; }
    
    public int getTecnicos() { return tecnicos; }
    public void setTecnicos(int tecnicos) { this.tecnicos = tecnicos; }
    
    public String getTipoServico() { return tipoServico; }
    public void setTipoServico(String tipoServico) { this.tipoServico = tipoServico; }
    
    public String getRegiao() { return regiao; }
    public void setRegiao(String regiao) { this.regiao = regiao; }
    
    public long getCasosAbertos() { return casosAbertos; }
    public void setCasosAbertos(long casosAbertos) { this.casosAbertos = casosAbertos; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public String getSlaMedio() { return slaMedio; }
    public void setSlaMedio(String slaMedio) { this.slaMedio = slaMedio; }

    public String getStatusColor() { return statusColor; }
    public void setStatusColor(String statusColor) { this.statusColor = statusColor; }
}
