package br.gov.cuidar.dto;
import jakarta.validation.constraints.*;
import java.time.*;
import java.util.List;

public class SolicitacaoDTO {

    public static class CreateRequest {
        @NotBlank private String descricao;
        @NotBlank private String gps;
        @NotNull  private Long idServico;
        private String fotos;
        public CreateRequest() {}
        public String getDescricao() { return descricao; } public void setDescricao(String descricao) { this.descricao = descricao; }
        public String getGps() { return gps; } public void setGps(String gps) { this.gps = gps; }
        public Long getIdServico() { return idServico; } public void setIdServico(Long idServico) { this.idServico = idServico; }
        public String getFotos() { return fotos; } public void setFotos(String fotos) { this.fotos = fotos; }
    }

    public static class UpdateStatusRequest {
        @NotBlank private String status;
        private String prioridade;
        private Long idEquipe;
        private String comentario;
        public UpdateStatusRequest() {}
        public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
        public String getPrioridade() { return prioridade; } public void setPrioridade(String prioridade) { this.prioridade = prioridade; }
        public Long getIdEquipe() { return idEquipe; } public void setIdEquipe(Long idEquipe) { this.idEquipe = idEquipe; }
        public String getComentario() { return comentario; } public void setComentario(String comentario) { this.comentario = comentario; }
    }

    public static class Response {
        private Long id; private String protocolo; private String descricao; private String gps;
        private String status; private String prioridade; private LocalDateTime dataCriacao;
        private LocalDate dataConclusao; private String nomeUsuario; private String nomeEquipe;
        private String categoriaServico; private String subcategoriaServico; private List<HistoricoDTO> historicos;
        public Response() {}
        public Long getId() { return id; } public void setId(Long id) { this.id = id; }
        public String getProtocolo() { return protocolo; } public void setProtocolo(String protocolo) { this.protocolo = protocolo; }
        public String getDescricao() { return descricao; } public void setDescricao(String descricao) { this.descricao = descricao; }
        public String getGps() { return gps; } public void setGps(String gps) { this.gps = gps; }
        public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
        public String getPrioridade() { return prioridade; } public void setPrioridade(String prioridade) { this.prioridade = prioridade; }
        public LocalDateTime getDataCriacao() { return dataCriacao; } public void setDataCriacao(LocalDateTime dataCriacao) { this.dataCriacao = dataCriacao; }
        public LocalDate getDataConclusao() { return dataConclusao; } public void setDataConclusao(LocalDate dataConclusao) { this.dataConclusao = dataConclusao; }
        public String getNomeUsuario() { return nomeUsuario; } public void setNomeUsuario(String nomeUsuario) { this.nomeUsuario = nomeUsuario; }
        public String getNomeEquipe() { return nomeEquipe; } public void setNomeEquipe(String nomeEquipe) { this.nomeEquipe = nomeEquipe; }
        public String getCategoriaServico() { return categoriaServico; } public void setCategoriaServico(String categoriaServico) { this.categoriaServico = categoriaServico; }
        public String getSubcategoriaServico() { return subcategoriaServico; } public void setSubcategoriaServico(String subcategoriaServico) { this.subcategoriaServico = subcategoriaServico; }
        public List<HistoricoDTO> getHistoricos() { return historicos; } public void setHistoricos(List<HistoricoDTO> historicos) { this.historicos = historicos; }
    }

    public static class HistoricoDTO {
        private LocalDateTime data; private String acao; private String nomeUsuario;
        public HistoricoDTO() {}
        public HistoricoDTO(LocalDateTime data, String acao, String nomeUsuario) { this.data = data; this.acao = acao; this.nomeUsuario = nomeUsuario; }
        public LocalDateTime getData() { return data; } public void setData(LocalDateTime data) { this.data = data; }
        public String getAcao() { return acao; } public void setAcao(String acao) { this.acao = acao; }
        public String getNomeUsuario() { return nomeUsuario; } public void setNomeUsuario(String nomeUsuario) { this.nomeUsuario = nomeUsuario; }
    }
}
