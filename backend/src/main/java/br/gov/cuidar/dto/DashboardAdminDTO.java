package br.gov.cuidar.dto;

public class DashboardAdminDTO {
    private long totalGestores;
    private long totalUsuarios;
    private long totalEquipes;

    public DashboardAdminDTO(long totalGestores, long totalUsuarios, long totalEquipes) {
        this.totalGestores = totalGestores;
        this.totalUsuarios = totalUsuarios;
        this.totalEquipes = totalEquipes;
    }

    public long getTotalGestores() {
        return totalGestores;
    }

    public void setTotalGestores(long totalGestores) {
        this.totalGestores = totalGestores;
    }

    public long getTotalUsuarios() {
        return totalUsuarios;
    }

    public void setTotalUsuarios(long totalUsuarios) {
        this.totalUsuarios = totalUsuarios;
    }

    public long getTotalEquipes() {
        return totalEquipes;
    }

    public void setTotalEquipes(long totalEquipes) {
        this.totalEquipes = totalEquipes;
    }
}
