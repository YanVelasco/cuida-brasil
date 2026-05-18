package br.gov.cuidar.controller;
import br.gov.cuidar.dto.ApiResponse;
import br.gov.cuidar.entity.Servico;
import br.gov.cuidar.repository.ServicoRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/servicos")
public class ServicoController {
    private final ServicoRepository sRepo;
    public ServicoController(ServicoRepository sRepo) { this.sRepo = sRepo; }
    @GetMapping
    public ResponseEntity<ApiResponse<List<Servico>>> listar() { return ResponseEntity.ok(ApiResponse.ok(sRepo.findAll())); }
}
