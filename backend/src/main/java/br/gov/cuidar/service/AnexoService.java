package br.gov.cuidar.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import br.gov.cuidar.entity.Anexo;
import br.gov.cuidar.entity.Solicitacao;
import br.gov.cuidar.entity.Usuario;
import br.gov.cuidar.repository.AnexoRepository;
import br.gov.cuidar.repository.SolicitacaoRepository;
import jakarta.servlet.http.HttpServletRequest;

/**
 * Upload completo de anexos: armazena arquivos em disco e o
 * metadado em TB_ANEXO, com download e exclusão auditada.
 */
@Service
public class AnexoService {

    private static final Set<String> EXTENSOES_PERMITIDAS = Set.of("jpg", "jpeg", "png", "gif", "webp", "pdf", "mp4");
    private static final long TAMANHO_MAXIMO = 10L * 1024 * 1024; // 10MB

    private final AnexoRepository anexoRepository;
    private final SolicitacaoRepository solicitacaoRepository;
    private final AuditoriaService auditoriaService;
    private final Path uploadDir;

    public AnexoService(AnexoRepository anexoRepository, SolicitacaoRepository solicitacaoRepository,
                        AuditoriaService auditoriaService, @Value("${app.upload.dir:uploads}") String uploadDir) {
        this.anexoRepository = anexoRepository;
        this.solicitacaoRepository = solicitacaoRepository;
        this.auditoriaService = auditoriaService;
        this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    @Transactional
    public Anexo upload(Long solicitacaoId, MultipartFile file, Usuario usuario, HttpServletRequest request) {
        Solicitacao sol = solicitacaoRepository.findById(solicitacaoId)
            .orElseThrow(() -> new RuntimeException("Solicitacao nao encontrada"));

        if (file == null || file.isEmpty()) throw new RuntimeException("Arquivo vazio");
        if (file.getSize() > TAMANHO_MAXIMO) throw new RuntimeException("Arquivo excede o limite de 10MB");

        String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "anexo";
        String extensao = original.contains(".") ? original.substring(original.lastIndexOf('.') + 1).toLowerCase() : "";
        if (!EXTENSOES_PERMITIDAS.contains(extensao)) {
            throw new RuntimeException("Tipo de arquivo nao permitido: " + extensao);
        }

        try {
            Files.createDirectories(uploadDir);
            String nomeArquivo = UUID.randomUUID() + "." + extensao;
            Path destino = uploadDir.resolve(nomeArquivo).normalize();
            if (!destino.startsWith(uploadDir)) throw new RuntimeException("Caminho de arquivo invalido");
            file.transferTo(destino.toFile());

            Anexo anexo = new Anexo();
            anexo.setArquivo(nomeArquivo);
            anexo.setAutor(usuario);
            anexo.setSolicitacao(sol);
            anexo = anexoRepository.save(anexo);

            auditoriaService.registrar("UPLOAD_ANEXO",
                "Anexo '" + original + "' enviado para solicitacao " + sol.getProtocolo(),
                usuario.getCpf(), usuario, true, request);
            return anexo;
        } catch (IOException e) {
            throw new RuntimeException("Falha ao salvar arquivo: " + e.getMessage());
        }
    }

    public List<Anexo> listar(Long solicitacaoId) {
        return anexoRepository.findBySolicitacaoIdOrderByDataAsc(solicitacaoId);
    }

    public Path localizarArquivo(Long anexoId) {
        Anexo anexo = anexoRepository.findById(anexoId)
            .orElseThrow(() -> new RuntimeException("Anexo nao encontrado"));
        Path arquivo = uploadDir.resolve(anexo.getArquivo()).normalize();
        if (!arquivo.startsWith(uploadDir) || !Files.exists(arquivo)) {
            throw new RuntimeException("Arquivo nao encontrado no armazenamento");
        }
        return arquivo;
    }

    @Transactional
    public void excluir(Long anexoId, Usuario usuario, HttpServletRequest request) {
        Anexo anexo = anexoRepository.findById(anexoId)
            .orElseThrow(() -> new RuntimeException("Anexo nao encontrado"));
        try {
            Files.deleteIfExists(uploadDir.resolve(anexo.getArquivo()).normalize());
        } catch (IOException ignored) {
            // arquivo físico ausente não impede a exclusão do metadado
        }
        anexoRepository.delete(anexo);
        auditoriaService.registrar("EXCLUSAO_ANEXO",
            "Anexo " + anexo.getArquivo() + " excluido",
            usuario.getCpf(), usuario, true, request);
    }
}
