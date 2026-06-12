package com.financas.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/**
 * Endpoint publico e leve para verificar se a API esta online.
 */
@RestController
@RequestMapping({"/api/health", "/api/v1/health"})
public class HealthController {

    @GetMapping
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "application", "financas-simples",
                "timestamp", Instant.now().toString()
        ));
    }
}
