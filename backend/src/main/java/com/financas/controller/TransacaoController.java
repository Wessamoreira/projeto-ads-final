package com.financas.controller;

import com.financas.dto.TransacaoRequest;
import com.financas.dto.TransacaoResponse;
import com.financas.service.TransacaoService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/** CRUD de transacoes (receitas e despesas). */
@RestController
@RequestMapping("/api/v1/transacoes")
public class TransacaoController {

    private final TransacaoService transacaoService;

    public TransacaoController(TransacaoService transacaoService) {
        this.transacaoService = transacaoService;
    }

    /** Lista paginada. Por padrao, mais recentes primeiro. */
    @GetMapping
    public Page<TransacaoResponse> listar(
            @PageableDefault(size = 20, sort = "dataTransacao", direction = Sort.Direction.DESC)
            Pageable pageable) {
        return transacaoService.listar(pageable);
    }

    @GetMapping("/{id}")
    public TransacaoResponse buscar(@PathVariable UUID id) {
        return transacaoService.buscar(id);
    }

    @PostMapping
    public ResponseEntity<TransacaoResponse> criar(@Valid @RequestBody TransacaoRequest dados) {
        return ResponseEntity.status(HttpStatus.CREATED).body(transacaoService.criar(dados));
    }

    @PutMapping("/{id}")
    public TransacaoResponse atualizar(@PathVariable UUID id, @Valid @RequestBody TransacaoRequest dados) {
        return transacaoService.atualizar(id, dados);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable UUID id) {
        transacaoService.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
