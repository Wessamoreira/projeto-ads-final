package com.financas.controller;

import com.financas.dto.DashboardResponse;
import com.financas.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Resumo financeiro da tela inicial. */
@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    /**
     * @param periodo mes de referencia no formato yyyy-MM (opcional; padrao = mes atual)
     */
    @GetMapping
    public DashboardResponse resumo(@RequestParam(required = false) String periodo) {
        return dashboardService.gerar(periodo);
    }
}
