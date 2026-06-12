package com.financas.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Captura excecoes em um unico lugar e devolve um JSON de erro padronizado.
 * Evita repetir try/catch em cada controller.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /** Erros de regra de negocio (404, 409, etc). */
    @ExceptionHandler(RegraNegocioException.class)
    public ResponseEntity<Map<String, Object>> tratarRegraNegocio(RegraNegocioException ex) {
        return montarResposta(HttpStatus.valueOf(ex.getStatus()), ex.getMessage());
    }

    /** Login com e-mail ou senha incorretos. */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> tratarCredenciais(BadCredentialsException ex) {
        return montarResposta(HttpStatus.UNAUTHORIZED, "E-mail ou senha invalidos");
    }

    /** Erros de validacao dos DTOs (@NotBlank, @Email...). */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> tratarValidacao(MethodArgumentNotValidException ex) {
        FieldError primeiro = ex.getBindingResult().getFieldErrors().stream().findFirst().orElse(null);
        String mensagem = primeiro != null ? primeiro.getDefaultMessage() : "Dados invalidos";
        return montarResposta(HttpStatus.BAD_REQUEST, mensagem);
    }

    private ResponseEntity<Map<String, Object>> montarResposta(HttpStatus status, String mensagem) {
        Map<String, Object> corpo = new HashMap<>();
        corpo.put("timestamp", LocalDateTime.now());
        corpo.put("status", status.value());
        corpo.put("message", mensagem);
        return ResponseEntity.status(status).body(corpo);
    }
}
