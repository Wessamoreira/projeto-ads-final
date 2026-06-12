package com.financas.controller;

import com.financas.dto.AlterarSenhaRequest;
import com.financas.dto.AtualizarPerfilRequest;
import com.financas.dto.UsuarioResponse;
import com.financas.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Dados e perfil do usuario autenticado. */
@RestController
@RequestMapping("/api/v1/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;

    /** Usado pelo frontend para confirmar o token e carregar o perfil. */
    @GetMapping("/perfil")
    public UsuarioResponse perfil() {
        return UsuarioResponse.de(usuarioService.getLogado());
    }

    /** Edita nome e renda mensal. */
    @PutMapping("/perfil")
    public UsuarioResponse atualizarPerfil(@Valid @RequestBody AtualizarPerfilRequest dados) {
        return UsuarioResponse.de(usuarioService.atualizarPerfil(dados));
    }

    /** Troca a senha (confere a senha atual). */
    @PutMapping("/senha")
    public ResponseEntity<Void> alterarSenha(@Valid @RequestBody AlterarSenhaRequest dados) {
        usuarioService.alterarSenha(dados);
        return ResponseEntity.noContent().build();
    }
}
