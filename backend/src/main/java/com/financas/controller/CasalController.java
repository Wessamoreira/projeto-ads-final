package com.financas.controller;

import com.financas.dto.AdicionarValorMetaRequest;
import com.financas.dto.CasalFinancasResponse;
import com.financas.dto.CasalStatusResponse;
import com.financas.dto.CasalVinculoResponse;
import com.financas.dto.ConvidarParceiroRequest;
import com.financas.dto.MetaCasalRequest;
import com.financas.dto.MetaCasalResponse;
import com.financas.service.CasalFinancasService;
import com.financas.service.CasalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Endpoints do vinculo de casal: convidar uma pessoa, aceitar/recusar convites
 * e desfazer o vinculo. Tudo opera sobre o usuario logado (token JWT).
 */
@RestController
@RequestMapping("/api/v1/casal")
@RequiredArgsConstructor
public class CasalController {

    private final CasalService casalService;
    private final CasalFinancasService casalFinancasService;

    /** Situacao completa do casal (vinculo ativo + convites enviados/recebidos). */
    @GetMapping("/status")
    public CasalStatusResponse status() {
        return casalService.obterStatus();
    }

    // =========================================================================
    // VISAO FINANCEIRA COMBINADA (juncao automatica dos dois parceiros)
    // =========================================================================

    /** Resumo financeiro do casal no mes (renda combinada, despesas, divisao...). */
    @GetMapping("/financas")
    public CasalFinancasResponse financas(@RequestParam(required = false) String periodo) {
        return casalFinancasService.obterFinancas(periodo);
    }

    // ---- Objetivos (metas) compartilhados ----

    @GetMapping("/metas")
    public List<MetaCasalResponse> listarMetas() {
        return casalFinancasService.listarMetas();
    }

    @PostMapping("/metas")
    public ResponseEntity<MetaCasalResponse> criarMeta(@Valid @RequestBody MetaCasalRequest dados) {
        return ResponseEntity.status(HttpStatus.CREATED).body(casalFinancasService.criarMeta(dados));
    }

    @PostMapping("/metas/{id}/adicionar")
    public MetaCasalResponse adicionarValorMeta(@PathVariable UUID id,
                                                @Valid @RequestBody AdicionarValorMetaRequest dados) {
        return casalFinancasService.adicionarValor(id, dados);
    }

    @DeleteMapping("/metas/{id}")
    public ResponseEntity<Void> excluirMeta(@PathVariable UUID id) {
        casalFinancasService.excluirMeta(id);
        return ResponseEntity.noContent().build();
    }

    /** Convida uma pessoa pelo e-mail. */
    @PostMapping("/convites")
    public ResponseEntity<CasalVinculoResponse> convidar(@Valid @RequestBody ConvidarParceiroRequest dados) {
        return ResponseEntity.status(HttpStatus.CREATED).body(casalService.convidar(dados));
    }

    /** Aceita um convite recebido. */
    @PostMapping("/convites/{id}/aceitar")
    public CasalVinculoResponse aceitar(@PathVariable UUID id) {
        return casalService.aceitar(id);
    }

    /** Recusa um convite recebido. */
    @PostMapping("/convites/{id}/recusar")
    public ResponseEntity<Void> recusar(@PathVariable UUID id) {
        casalService.recusar(id);
        return ResponseEntity.noContent().build();
    }

    /** Cancela um convite que o proprio usuario enviou. */
    @DeleteMapping("/convites/{id}")
    public ResponseEntity<Void> cancelar(@PathVariable UUID id) {
        casalService.cancelar(id);
        return ResponseEntity.noContent().build();
    }

    /** Desfaz o vinculo ativo. */
    @DeleteMapping
    public ResponseEntity<Void> desvincular() {
        casalService.desvincular();
        return ResponseEntity.noContent().build();
    }
}
