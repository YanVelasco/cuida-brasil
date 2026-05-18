package br.gov.cuidar.dto;
import jakarta.validation.constraints.*;

public class AuthDTO {
    public static class LoginRequest {
        @NotBlank(message = "CPF obrigatorio") private String cpf;
        @NotBlank(message = "Senha obrigatoria") private String senha;
        public LoginRequest() {}
        public LoginRequest(String cpf, String senha) { this.cpf = cpf; this.senha = senha; }
        public String getCpf() { return cpf; } public void setCpf(String cpf) { this.cpf = cpf; }
        public String getSenha() { return senha; } public void setSenha(String senha) { this.senha = senha; }
    }

    public static class RegisterRequest {
        @NotBlank private String nome;
        @NotBlank private String cpf;
        @Email @NotBlank private String email;
        @NotBlank @Size(min = 6) private String senha;
        public RegisterRequest() {}
        public RegisterRequest(String nome, String cpf, String email, String senha) { this.nome = nome; this.cpf = cpf; this.email = email; this.senha = senha; }
        public String getNome() { return nome; } public void setNome(String nome) { this.nome = nome; }
        public String getCpf() { return cpf; } public void setCpf(String cpf) { this.cpf = cpf; }
        public String getEmail() { return email; } public void setEmail(String email) { this.email = email; }
        public String getSenha() { return senha; } public void setSenha(String senha) { this.senha = senha; }
    }

    public static class AuthResponse {
        private String token; private String tipo; private Long id; private String nome;
        private String cpf; private String email; private String perfil;
        public AuthResponse() {}
        public AuthResponse(String token, String tipo, Long id, String nome, String cpf, String email, String perfil) {
            this.token = token; this.tipo = tipo; this.id = id; this.nome = nome; this.cpf = cpf; this.email = email; this.perfil = perfil;
        }
        public String getToken() { return token; } public void setToken(String token) { this.token = token; }
        public String getTipo() { return tipo; } public void setTipo(String tipo) { this.tipo = tipo; }
        public Long getId() { return id; } public void setId(Long id) { this.id = id; }
        public String getNome() { return nome; } public void setNome(String nome) { this.nome = nome; }
        public String getCpf() { return cpf; } public void setCpf(String cpf) { this.cpf = cpf; }
        public String getEmail() { return email; } public void setEmail(String email) { this.email = email; }
        public String getPerfil() { return perfil; } public void setPerfil(String perfil) { this.perfil = perfil; }
    }
}
