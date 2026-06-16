package com.financas.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** Dados para convidar uma pessoa para formar um casal (pelo e-mail dela). */
public record ConvidarParceiroRequest(
        @NotBlank(message = "Informe o e-mail da pessoa que voce quer convidar")
        @Email(message = "E-mail invalido")
        String email
) {}
