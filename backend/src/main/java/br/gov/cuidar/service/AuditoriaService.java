package br.gov.cuidar.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import br.gov.cuidar.entity.Auditoria;
import br.gov.cuidar.entity.Usuario;
import br.gov.cuidar.repository.AuditoriaRepository;
import jakarta.servlet.http.HttpServletRequest;

/**
 * Serviço de auditoria corporativa: registra eventos sensíveis
 * (logins, exclusões, uploads, exportações) para trilha de auditoria.
 */
@Service
public class AuditoriaService {

    private final AuditoriaRepository auditoriaRepository;

    public AuditoriaService(AuditoriaRepository auditoriaRepository) {
        this.auditoriaRepository = auditoriaRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrar(String acao, String detalhes, String cpf, Usuario usuario, boolean sucesso, HttpServletRequest request) {
        try {
            Auditoria audit = new Auditoria();
            audit.setAcao(acao);
            audit.setDetalhes(detalhes);
            audit.setCpf(cpf);
            audit.setUsuario(usuario);
            audit.setSucesso(sucesso);
            if (request != null) {
                audit.setIp(extrairIp(request));
                String userAgent = request.getHeader("User-Agent");
                audit.setUserAgent(userAgent != null && userAgent.length() > 300 ? userAgent.substring(0, 300) : userAgent);
            }
            auditoriaRepository.save(audit);
        } catch (Exception e) {
            // Auditoria nunca deve derrubar a operação principal
        }
    }

    private String extrairIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
