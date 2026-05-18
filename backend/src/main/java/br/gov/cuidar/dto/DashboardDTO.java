package br.gov.cuidar.dto;

public class DashboardDTO {
    private long totalAbertas; private long emAndamento; private long resolvidasHoje;
    private long pendentesSla; private long urgentes;
    public DashboardDTO() {}
    public DashboardDTO(long totalAbertas, long emAndamento, long resolvidasHoje, long pendentesSla, long urgentes) {
        this.totalAbertas = totalAbertas; this.emAndamento = emAndamento; this.resolvidasHoje = resolvidasHoje;
        this.pendentesSla = pendentesSla; this.urgentes = urgentes;
    }
    public long getTotalAbertas() { return totalAbertas; } public void setTotalAbertas(long totalAbertas) { this.totalAbertas = totalAbertas; }
    public long getEmAndamento() { return emAndamento; } public void setEmAndamento(long emAndamento) { this.emAndamento = emAndamento; }
    public long getResolvidasHoje() { return resolvidasHoje; } public void setResolvidasHoje(long resolvidasHoje) { this.resolvidasHoje = resolvidasHoje; }
    public long getPendentesSla() { return pendentesSla; } public void setPendentesSla(long pendentesSla) { this.pendentesSla = pendentesSla; }
    public long getUrgentes() { return urgentes; } public void setUrgentes(long urgentes) { this.urgentes = urgentes; }
}
