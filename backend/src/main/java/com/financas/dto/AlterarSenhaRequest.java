package com.financas.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Dados para trocar a senha. */
public record AlterarSenhaRequest(
        @NotBlank(message = "Informe a senha atual")
        String senhaAtual,

        @NotBlank(message = "Informe a nova senha")
        @Size(min = 6, message = "A nova senha deve ter no minimo 6 caracteres")
        String novaSenha
) {}
