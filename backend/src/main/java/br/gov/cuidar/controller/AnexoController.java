package br.gov.cuidar.controller;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import br.gov.cuidar.dto.ApiResponse;
import br.gov.cuidar.entity.Anexo;
import br.gov.cuidar.entity.Usuario;
import br.gov.cuidar.service.AnexoService;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@org.springframework.transaction.annotation.Transactional(rollbackFor = Exception.class)
@RequestMapping("/api")
public class AnexoController {

    private final AnexoService anexoService;

    public AnexoController(AnexoService anexoService) {
        this.anexoService = anexoService;
    }

    @PostMapping("/solicitacoes/{id}/anexos")
    public ResponseEntity<ApiResponse<Map<String, Object>>> upload(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal Usuario usuario,
            HttpServletRequest request) {
        Anexo anexo = anexoService.upload(id, file, usuario, request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.ok("Anexo enviado com sucesso", toMap(anexo)));
    }

    @GetMapping("/solicitacoes/{id}/anexos")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> listar(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(
            anexoService.listar(id).stream().map(this::toMap).collect(Collectors.toList())));
    }

    @GetMapping("/anexos/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable Long id) throws java.io.IOException {
        Path arquivo = anexoService.localizarArquivo(id);
        String contentType = Files.probeContentType(arquivo);
        return ResponseEntity.ok()
            .contentType(contentType != null ? MediaType.parseMediaType(contentType) : MediaType.APPLICATION_OCTET_STREAM)
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + arquivo.getFileName() + "\"")
            .body(new FileSystemResource(arquivo));
    }

    @DeleteMapping("/anexos/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','GESTOR')")
    public ResponseEntity<ApiResponse<Void>> excluir(@PathVariable Long id,
            @AuthenticationPrincipal Usuario usuario, HttpServletRequest request) {
        anexoService.excluir(id, usuario, request);
        return ResponseEntity.ok(ApiResponse.ok("Anexo excluido com sucesso", null));
    }

    private Map<String, Object> toMap(Anexo a) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", a.getId());
        map.put("arquivo", a.getArquivo());
        map.put("data", a.getData());
        map.put("autor", a.getAutor() != null ? a.getAutor().getNome() : null);
        map.put("urlDownload", "/api/anexos/" + a.getId() + "/download");
        return map;
    }
}

